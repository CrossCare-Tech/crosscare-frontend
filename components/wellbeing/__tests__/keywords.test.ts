import { mentionsDistress } from "../keywords";

describe("mentionsDistress", () => {
  it("flags the words of the prototype and ignores everyday text", () => {
    expect(mentionsDistress("I feel so Overwhelmed today")).toBe(true);
    expect(mentionsDistress("Hoje me sinto sem esperança")).toBe(true);
    expect(mentionsDistress("Felt a strong kick after dinner")).toBe(false);
    expect(mentionsDistress("")).toBe(false);
  });
});
