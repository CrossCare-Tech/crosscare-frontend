jest.mock("@react-native-async-storage/async-storage", () => ({ setItem: jest.fn(), getItem: jest.fn() }));

import { ragAnswer, ragReply } from "@/utils/demo/mockContent";
import { EXTRA_TOPICS } from "@/utils/demo/mockConversations";

describe("demo Concierge conversations", () => {
  it("answers a greeting and thanks without falling into a broader topic", () => {
    expect(ragReply("Hi!")).toMatch(/24 weeks/);
    expect(ragReply("thanks, that was great")).toMatch(/Anytime/);
  });

  it("puts warning signs before every other topic", () => {
    expect(ragReply("I'm worried, I have heavy bleeding")).toMatch(/911/);
  });

  it("follows up when the patient says yes to the offer in the last reply", () => {
    const offer = ragReply("When is my next appointment?");
    const history = [{ role: "user", content: "When is my next appointment?" }, { role: "assistant", content: offer }, { role: "user", content: "yes" }];
    expect(ragReply("yes", "en", [], history)).toMatch(/Good questions to ask/);
    expect(ragReply("sim", "pt", [], [{ role: "assistant", content: EXTRA_TOPICS.find((t) => t.id === "appointment")!.reply.pt }])).toMatch(/Boas perguntas/);
  });

  it("quotes the saved questionnaire answers when asked what it knows", () => {
    expect(ragReply("What do you know about my home?", "en", [{ response: "Roommates" }])).toMatch(/Roommates/);
  });

  it("has a reply in every language for every topic", () => {
    EXTRA_TOPICS.forEach((t) => (["en", "pt", "es"] as const).forEach((l) => {
      expect(t.reply[l].length).toBeGreaterThan(10);
      if (t.more) expect(t.more[l].length).toBeGreaterThan(10);
    }));
  });

  it("sends media with the reply, like screen 6d of the prototype", () => {
    expect(ragAnswer("How's my baby? What size is the baby?").media?.map((m) => m.type)).toEqual(["image", "link"]);
    expect(ragAnswer("Gentle back stretch").media?.map((m) => m.type)).toEqual(["video", "actions"]);
    expect(ragAnswer("Is walking safe?").media?.map((m) => m.type)).toEqual(["link"]);
    expect(ragAnswer("Is walking safe?", "pt").media?.[0]).toMatchObject({ domain: "acog.org", label: "Fonte médica" });
  });

  it("sends no media for plain answers and never with a warning sign", () => {
    expect(ragAnswer("Hi").media).toBeUndefined();
    expect(ragAnswer("heavy bleeding while walking").media).toBeUndefined();
  });
});
