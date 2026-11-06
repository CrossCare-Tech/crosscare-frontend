import { Audio, AVPlaybackStatus } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Speech from "expo-speech";
import { CONFIG } from "@/constants/config";
import { deepgramTTS } from "@/utils/deepgramTTS";

// Reading a Concierge reply aloud (screen 6b of the prototype): ready -> preparing -> playing <-> paused,
// with speed and, when the clip is a real audio file, jumping to a point. One reply plays at a time.
//
// Two voices: Deepgram (a downloaded clip, so it can pause, change speed and seek) for English and
// Spanish, and the phone's own voice for Portuguese and as the fallback when Deepgram is not
// available (no key, no network). The phone's voice cannot seek, and "pause" stops it.

export type AudioStatus = "idle" | "preparing" | "playing" | "paused" | "error";
export type AudioEngine = "deepgram" | "device";

export type AudioState = {
  messageId: string | null;
  status: AudioStatus;
  positionMs: number;
  durationMs: number;
  rate: number;
  engine: AudioEngine | null;
};

export const SPEEDS = [1, 1.25, 1.5];

const DEEPGRAM_MODELS: Record<string, string> = { en: "aura-2-thalia-en", es: "aura-2-luna-es" };
const DEVICE_LANGUAGES: Record<string, string> = { en: "en-US", es: "es-ES", pt: "pt-BR", ht: "fr-HT" };

// Markdown and emoji are for the eyes; read the words only
export const plainSpeech = (markdown: string) =>
  markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>~]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s*\n+\s*/g, ". ")
    .replace(/\.\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();

// About 155 words a minute, so the pill can say "Listen · 0:18" before anything is downloaded
export const estimateSeconds = (markdown: string) => {
  const words = plainSpeech(markdown).split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 2.6));
};

export const clipName = (language: string, text: string) => {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return `reply-${language}-${(hash >>> 0).toString(36)}.mp3`;
};

const initial: AudioState = { messageId: null, status: "idle", positionMs: 0, durationMs: 0, rate: 1, engine: null };

class ReplyAudioController {
  private state: AudioState = { ...initial };
  private listeners = new Set<(state: AudioState) => void>();
  private sound: Audio.Sound | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastText = "";
  private lastLanguage = "en";
  // Each play() gets a number; a late callback from an older play must not touch the new state
  private run = 0;

  getState = () => this.state;

  subscribe = (listener: (state: AudioState) => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private set(patch: Partial<AudioState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }

  private clearTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async release() {
    this.run++;
    this.clearTimer();
    Speech.stop();
    const sound = this.sound;
    this.sound = null;
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {
        // already unloaded
      }
    }
  }

  async stop() {
    await this.release();
    this.set({ ...initial, rate: this.state.rate });
  }

  async play(messageId: string, markdown: string, language: string) {
    await deepgramTTS.stop(); // the older player, used by voice replies
    await this.release();
    const run = this.run;
    const text = plainSpeech(markdown);
    this.lastText = text;
    this.lastLanguage = language;
    this.set({ messageId, status: "preparing", positionMs: 0, durationMs: estimateSeconds(markdown) * 1000, engine: null });

    if (DEEPGRAM_MODELS[language] && CONFIG.DEEPGRAM_API) {
      try {
        const uri = await this.download(text, language);
        if (run !== this.run) return;
        await this.playClip(uri, run);
        return;
      } catch (error) {
        console.warn("[audio] Deepgram is not available, using the phone's voice:", error);
        if (run !== this.run) return;
      }
    }
    this.playDevice(run);
  }

  private async download(text: string, language: string) {
    const uri = `${FileSystem.cacheDirectory}${clipName(language, text)}`;
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) return uri;
    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${DEEPGRAM_MODELS[language]}`, {
      method: "POST",
      headers: { Authorization: `Token ${CONFIG.DEEPGRAM_API}`, "Content-Type": "text/plain" },
      body: text,
    });
    if (!response.ok) throw new Error(`Deepgram ${response.status}`);
    const blob = await response.blob();
    const base64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    return uri;
  }

  private async playClip(uri: string, run: number) {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, rate: this.state.rate, shouldCorrectPitch: true, progressUpdateIntervalMillis: 120 },
      (status: AVPlaybackStatus) => {
        if (run !== this.run || !status.isLoaded) return;
        if (status.didJustFinish) {
          this.set({ status: "idle", positionMs: 0 });
          return;
        }
        this.set({
          status: status.isPlaying ? "playing" : this.state.status === "preparing" ? "preparing" : "paused",
          positionMs: status.positionMillis,
          durationMs: status.durationMillis ?? this.state.durationMs,
        });
      }
    );
    if (run !== this.run) {
      sound.unloadAsync();
      return;
    }
    this.sound = sound;
    this.set({ engine: "deepgram", status: "playing" });
  }

  private playDevice(run: number) {
    const startedAt = Date.now();
    this.set({ engine: "device" });
    Speech.speak(this.lastText, {
      language: DEVICE_LANGUAGES[this.lastLanguage] ?? "en-US",
      rate: this.state.rate,
      onStart: () => {
        if (run !== this.run) return;
        this.set({ status: "playing" });
        this.timer = setInterval(() => {
          const elapsed = Date.now() - startedAt;
          this.set({ positionMs: Math.min(elapsed, Math.max(this.state.durationMs - 300, 0)) });
        }, 200);
      },
      onDone: () => {
        if (run !== this.run) return;
        this.clearTimer();
        this.set({ status: "idle", positionMs: 0 });
      },
      onStopped: () => {
        // stop() and pause() set their own state
      },
      onError: () => {
        if (run !== this.run) return;
        this.clearTimer();
        this.set({ status: "error" });
      },
    });
  }

  async pause() {
    if (this.state.status !== "playing") return;
    if (this.sound) {
      await this.sound.pauseAsync();
      this.set({ status: "paused" });
      return;
    }
    // The phone's voice cannot pause on Android: stop it and start again from the top on resume
    this.run++;
    this.clearTimer();
    Speech.stop();
    this.set({ status: "paused" });
  }

  async resume() {
    if (this.state.status !== "paused" || !this.state.messageId) return;
    if (this.sound) {
      await this.sound.playAsync();
      this.set({ status: "playing" });
      return;
    }
    this.set({ status: "preparing", positionMs: 0 });
    this.playDevice(this.run);
  }

  // 1x -> 1.25x -> 1.5x -> 1x. The phone's voice restarts so the new speed takes effect.
  async cycleSpeed() {
    const rate = SPEEDS[(SPEEDS.indexOf(this.state.rate) + 1) % SPEEDS.length];
    this.set({ rate });
    if (this.sound) {
      await this.sound.setRateAsync(rate, true);
    } else if (this.state.status === "playing" && this.state.messageId) {
      this.run++;
      this.clearTimer();
      Speech.stop();
      this.playDevice(this.run);
    }
  }

  // fraction 0..1 of the clip; only real audio files can jump
  async seek(fraction: number) {
    if (!this.sound || !this.state.durationMs) return;
    const target = Math.round(Math.min(Math.max(fraction, 0), 1) * this.state.durationMs);
    await this.sound.setPositionAsync(target);
    this.set({ positionMs: target });
  }

  async retry() {
    if (this.state.messageId) await this.play(this.state.messageId, this.lastText, this.lastLanguage);
  }
}

export const replyAudio = new ReplyAudioController();
