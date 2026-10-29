import { useCallback, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { CALL_FALLBACK, CALL_FOLLOW_UP, CALL_GREETING, CALL_TOPICS, CallLang, CallTopic } from "@/constants/callScript";
import { buzz, playSound, startRing } from "@/utils/callSounds";
import { estimateSeconds, replyAudio } from "@/utils/replyAudio";

export type CallPhase = "calling" | "greeting" | "listening" | "userSpeaking" | "thinking" | "guideSpeaking" | "ended";
export type Caption = { speaker: "guide" | "you"; words: string[]; shown: number };

const RING_MS = 2600;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Options = { name: string; language: CallLang; muted: boolean };

// A call with no microphone: the patient taps a suggestion and it is "heard" word by word, the guide
// thinks for a moment and answers out loud. Every step is cancelled when the call ends.
export function useCallSimulation({ name, language, muted }: Options) {
  const [phase, setPhase] = useState<CallPhase>("calling");
  const [caption, setCaption] = useState<Caption | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [spoken, setSpoken] = useState<CallTopic[]>([]);
  const level = useRef(new Animated.Value(0)).current; // 0..1, drives the rings and the bars
  const run = useRef(0);
  const mutedRef = useRef(muted);
  const connected = useRef(false);
  const turn = useRef(0);
  mutedRef.current = muted;

  const alive = (id: number) => run.current === id;

  const pulse = useCallback(
    (active: boolean) => {
      level.stopAnimation();
      if (!active) {
        Animated.timing(level, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }
    },
    [level]
  );

  // Moves `level` to a new random value about 7 times a second while someone is talking
  const talking = useRef<ReturnType<typeof setInterval> | null>(null);
  const setTalking = useCallback(
    (on: boolean) => {
      if (talking.current) clearInterval(talking.current);
      talking.current = null;
      pulse(on);
      if (!on) return;
      talking.current = setInterval(() => {
        Animated.timing(level, { toValue: 0.25 + Math.random() * 0.75, duration: 140, useNativeDriver: true }).start();
      }, 150);
    },
    [level, pulse]
  );

  const say = useCallback(
    async (speaker: "guide" | "you", text: string, id: number) => {
      const words = text.split(/\s+/).filter(Boolean);
      setCaption({ speaker, words, shown: speaker === "you" ? 0 : words.length });
      if (speaker === "you") {
        for (let i = 1; i <= words.length; i++) {
          await wait(230);
          if (!alive(id)) return;
          setCaption({ speaker, words, shown: i });
        }
        await wait(450);
        return;
      }
      // The guide: read aloud, with the words lighting up as she says them
      const total = estimateSeconds(text) * 1000;
      const messageId = `call-${id}-${turn.current++}`;
      const done = new Promise<void>((resolveDone) => {
        let started = false;
        let giveUp: ReturnType<typeof setTimeout> | undefined;
        const resolve = () => {
          if (giveUp) clearTimeout(giveUp);
          resolveDone();
        };
        const off = replyAudio.subscribe((state) => {
          if (state.messageId !== messageId) return;
          if (state.status === "playing") started = true;
          const length = state.durationMs || total;
          if (started) setCaption({ speaker, words, shown: Math.ceil(words.length * Math.min(state.positionMs / length, 1)) });
          if (state.status === "idle" || state.status === "error") {
            off();
            resolve();
          }
        });
        if (mutedRef.current) {
          // Speaker off: the same pace, just silent
          off();
          const start = Date.now();
          const tick = setInterval(() => {
            const fraction = Math.min((Date.now() - start) / total, 1);
            setCaption({ speaker, words, shown: Math.ceil(words.length * fraction) });
            if (fraction >= 1 || !alive(id)) {
              clearInterval(tick);
              resolve();
            }
          }, 120);
        } else {
          // A voice that never reports back must not freeze the call
          giveUp = setTimeout(resolve, total * 1.8 + 3000);
          replyAudio.play(messageId, text, language).catch(resolve);
        }
      });
      await done;
      if (!alive(id)) return;
      setCaption({ speaker, words, shown: words.length });
    },
    [language]
  );

  // Ring, pick up, greet
  useEffect(() => {
    const id = ++run.current;
    let stopRing = () => {};
    (async () => {
      buzz("tap");
      stopRing = await startRing();
      await wait(RING_MS);
      stopRing();
      if (!alive(id)) return;
      playSound("connect");
      buzz("connect");
      connected.current = true;
      setPhase("greeting");
      setTalking(true);
      await say("guide", CALL_GREETING(name)[language], id);
      if (!alive(id)) return;
      setTalking(false);
      setPhase("listening");
    })();
    return () => {
      run.current++;
      stopRing();
      setTalking(false);
      replyAudio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Call timer, from the moment she picks up
  useEffect(() => {
    const timer = setInterval(() => {
      if (connected.current && run.current >= 0) setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // The patient taps a suggestion: it is "said", the guide thinks and answers
  const talk = useCallback(
    async (topic: CallTopic) => {
      if (phase !== "listening") return;
      const id = run.current;
      buzz("tap");
      playSound("tap", 0.5);
      setPhase("userSpeaking");
      setTalking(true);
      await say("you", topic.said[language], id);
      if (!alive(id)) return;
      setTalking(false);
      setPhase("thinking");
      await wait(1100);
      if (!alive(id)) return;
      setPhase("guideSpeaking");
      setTalking(true);
      setSpoken((list) => [...list, topic]);
      await say("guide", `${topic.reply[language]} ${CALL_FOLLOW_UP[language]}`, id);
      if (!alive(id)) return;
      setTalking(false);
      setPhase("listening");
    },
    [language, phase, say, setTalking]
  );

  // Ends the call and says what it was about, for the summary in the chat
  const end = useCallback(() => {
    run.current++;
    setTalking(false);
    replyAudio.stop();
    playSound("end");
    buzz("tap");
    setPhase("ended");
    return { seconds, topics: spoken };
  }, [seconds, setTalking, spoken]);

  const remaining = CALL_TOPICS.filter((topic) => !spoken.includes(topic));
  return { phase, caption, seconds, level, talk, end, suggestions: remaining.slice(0, 3), fallback: CALL_FALLBACK[language] };
}
