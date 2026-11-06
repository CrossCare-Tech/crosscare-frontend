const mockSpeak = jest.fn();
const mockStopSpeech = jest.fn();
jest.mock("expo-speech", () => ({ speak: (...a: any[]) => mockSpeak(...a), stop: () => mockStopSpeech() }));
jest.mock("expo-av", () => ({ Audio: { setAudioModeAsync: jest.fn(), Sound: { createAsync: jest.fn() } } }));
jest.mock("expo-file-system", () => ({
  cacheDirectory: "file:///cache/",
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  writeAsStringAsync: jest.fn(),
  EncodingType: { Base64: "base64" },
}));
jest.mock("@/utils/deepgramTTS", () => ({ deepgramTTS: { stop: jest.fn() } }));
var mockConfig = { DEEPGRAM_API: "" }; // var: the mock factory above runs before this line
jest.mock("@/constants/config", () => ({ get CONFIG() { return mockConfig; } }));

import { clipName, estimateSeconds, plainSpeech, replyAudio, SPEEDS } from "@/utils/replyAudio";

const lastSpeech = () => mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1];

describe("reading a reply aloud", () => {
  beforeEach(async () => {
    mockSpeak.mockClear();
    mockConfig.DEEPGRAM_API = "";
    await replyAudio.stop();
  });

  it("reads the words, not the Markdown or the emoji", () => {
    expect(plainSpeech("**Call your provider** now 🚨\n\n- rest\n- drink [water](http://x.com)")).toBe(
      "Call your provider now. rest. drink water"
    );
  });

  it("estimates the length from the number of words", () => {
    expect(estimateSeconds("word ".repeat(26))).toBe(10);
    expect(estimateSeconds("Hi")).toBe(2);
  });

  it("names a clip by language and text, so it is downloaded once", () => {
    expect(clipName("en", "Hello")).toBe(clipName("en", "Hello"));
    expect(clipName("en", "Hello")).not.toBe(clipName("es", "Hello"));
    expect(clipName("en", "Hello")).not.toBe(clipName("en", "Hello again"));
  });

  it("goes preparing, playing, paused, playing and ends idle with the phone's voice", async () => {
    const seen: string[] = [];
    const off = replyAudio.subscribe((s) => seen.push(s.status));
    await replyAudio.play("m1", "Olá, **Maya**", "pt");
    expect(replyAudio.getState()).toMatchObject({ messageId: "m1", status: "preparing", engine: "device" });
    expect(lastSpeech()[0]).toBe("Olá, Maya");
    expect(lastSpeech()[1]).toMatchObject({ language: "pt-BR", rate: 1 });

    lastSpeech()[1].onStart();
    expect(replyAudio.getState().status).toBe("playing");

    await replyAudio.pause();
    expect(replyAudio.getState().status).toBe("paused");
    expect(mockStopSpeech).toHaveBeenCalled();

    await replyAudio.resume();
    lastSpeech()[1].onStart();
    expect(replyAudio.getState().status).toBe("playing");

    lastSpeech()[1].onDone();
    expect(replyAudio.getState()).toMatchObject({ status: "idle", positionMs: 0 });
    off();
    expect(seen).toEqual(expect.arrayContaining(["preparing", "playing", "paused", "idle"]));
  });

  it("uses the phone's voice when there is no Deepgram key, even in English", async () => {
    await replyAudio.play("m2", "Hello Maya", "en");
    expect(replyAudio.getState().engine).toBe("device");
    expect(lastSpeech()[1].language).toBe("en-US");
  });

  it("falls back to the phone's voice when Deepgram fails", async () => {
    mockConfig.DEEPGRAM_API = "key";
    (global as any).fetch = jest.fn().mockRejectedValue(new Error("offline"));
    await replyAudio.play("m3", "Hola Maya", "es");
    expect(replyAudio.getState().engine).toBe("device");
    expect(lastSpeech()[1].language).toBe("es-ES");
  });

  it("cycles the speed 1x, 1.25x, 1.5x and restarts the phone's voice at the new speed", async () => {
    await replyAudio.play("m4", "Hello Maya", "en");
    lastSpeech()[1].onStart();
    const rates: number[] = [];
    for (let i = 0; i < SPEEDS.length; i++) {
      await replyAudio.cycleSpeed();
      rates.push(replyAudio.getState().rate);
    }
    expect(rates).toEqual([1.25, 1.5, 1]);
    expect(lastSpeech()[1].rate).toBe(1);
  });

  it("shows an error and plays again on retry", async () => {
    await replyAudio.play("m5", "Hello Maya", "en");
    lastSpeech()[1].onError(new Error("no voice"));
    expect(replyAudio.getState().status).toBe("error");
    await replyAudio.retry();
    expect(replyAudio.getState().status).toBe("preparing");
  });

  it("plays one reply at a time and ignores late callbacks from the older one", async () => {
    await replyAudio.play("a", "First reply", "en");
    const first = lastSpeech()[1];
    await replyAudio.play("b", "Second reply", "en");
    first.onDone();
    expect(replyAudio.getState()).toMatchObject({ messageId: "b", status: "preparing" });
  });
});
