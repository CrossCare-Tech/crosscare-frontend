import React from "react";
import { act, create } from "react-test-renderer";
import { CALL_TOPICS } from "@/constants/callScript";

const mockListeners = new Set<(s: any) => void>();
const mockState = { messageId: null as string | null, status: "idle", positionMs: 0, durationMs: 0 };
const mockEmit = (patch: any) => {
  Object.assign(mockState, patch);
  mockListeners.forEach((l) => l({ ...mockState }));
};
const mockPlayed: string[] = [];

jest.mock("@/utils/replyAudio", () => ({
  estimateSeconds: () => 3,
  replyAudio: {
    subscribe: (l: any) => {
      mockListeners.add(l);
      return () => mockListeners.delete(l);
    },
    // The voice "reads" for 2 seconds, then finishes
    play: async (id: string, text: string) => {
      mockPlayed.push(text);
      mockEmit({ messageId: id, status: "playing", positionMs: 0, durationMs: 2000 });
      setTimeout(() => mockEmit({ positionMs: 1000 }), 1000);
      setTimeout(() => mockEmit({ status: "idle", positionMs: 0 }), 2000);
    },
    stop: jest.fn(),
  },
}));
const mockSounds: string[] = [];
jest.mock("@/utils/callSounds", () => ({
  playSound: (name: string) => mockSounds.push(name),
  startRing: async () => () => mockSounds.push("ring-stopped"),
  buzz: jest.fn(),
}));

import { useCallSimulation } from "@/hooks/useCallSimulation";

let current: ReturnType<typeof useCallSimulation>;
const Probe = (props: { muted?: boolean }) => {
  current = useCallSimulation({ name: "Maya", language: "en", muted: !!props.muted });
  return null;
};

// Small steps, so the promises between two timers get to run, as they do on a phone
const advance = async (ms: number) => {
  for (let elapsed = 0; elapsed < ms; elapsed += 50) {
    await act(async () => {
      jest.advanceTimersByTime(50);
    });
  }
};

describe("call without a microphone", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSounds.length = 0;
    mockPlayed.length = 0;
    mockListeners.clear();
  });
  afterEach(() => jest.useRealTimers());

  it("rings, picks up with a chime, greets her and then listens", async () => {
    await act(async () => {
      create(<Probe />);
    });
    expect(current.phase).toBe("calling");

    await advance(2700);
    expect(mockSounds).toEqual(expect.arrayContaining(["ring-stopped", "connect"]));
    expect(current.phase).toBe("greeting");
    expect(current.caption?.speaker).toBe("guide");
    expect(mockPlayed[0]).toContain("Hi Maya");

    await advance(2200);
    expect(current.phase).toBe("listening");
    expect(current.suggestions.length).toBe(3);
  });

  it("hears the patient word by word, thinks, then answers out loud and listens again", async () => {
    await act(async () => {
      create(<Probe />);
    });
    await advance(5000);
    const topic = CALL_TOPICS[0];
    await act(async () => {
      current.talk(topic);
    });
    expect(current.phase).toBe("userSpeaking");
    await advance(500);
    expect(current.caption?.speaker).toBe("you");
    expect(current.caption!.shown).toBeGreaterThan(0);
    expect(current.caption!.shown).toBeLessThan(current.caption!.words.length);

    await advance(topic.said.en.split(" ").length * 230 + 600);
    expect(current.phase).toBe("thinking");
    await advance(1200);
    expect(current.phase).toBe("guideSpeaking");
    expect(mockPlayed[mockPlayed.length - 1]).toContain(topic.reply.en);

    await advance(2300);
    expect(current.phase).toBe("listening");
    expect(current.suggestions.map((s) => s.id)).not.toContain(topic.id);
  });

  it("keeps the same pace with the voice off, and speaks nothing", async () => {
    await act(async () => {
      create(<Probe muted />);
    });
    await advance(2700);
    expect(mockPlayed.length).toBe(0);
    await advance(8000);
    expect(current.phase).toBe("listening");
  });

  it("ends the call with a sound and reports what was talked about", async () => {
    await act(async () => {
      create(<Probe />);
    });
    await advance(5000);
    await act(async () => {
      current.talk(CALL_TOPICS[1]);
    });
    await advance(9000);
    let summary: any;
    await act(async () => {
      summary = current.end();
    });
    expect(mockSounds).toContain("end");
    expect(current.phase).toBe("ended");
    expect(summary.topics.map((t: any) => t.id)).toEqual(["back"]);
  });
});
