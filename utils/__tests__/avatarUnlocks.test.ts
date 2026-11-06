import { isRuleMet, longestStreak, ruleProgress } from "../avatarUnlocks";

describe("longestStreak", () => {
  it("finds the longest run of consecutive days and ignores duplicates", () => {
    expect(longestStreak(["2026-11-01", "2026-11-02", "2026-11-02", "2026-11-03", "2026-11-05", "2026-11-06"])).toBe(3);
  });

  it("is 0 without days and 1 for a single day", () => {
    expect(longestStreak([])).toBe(0);
    expect(longestStreak(["2026-11-05"])).toBe(1);
  });

  it("counts across a month end", () => {
    expect(longestStreak(["2026-10-30", "2026-10-31", "2026-11-01"])).toBe(3);
  });
});

describe("isRuleMet", () => {
  const stats = { journalEntries: 5, bestVitalsStreak: 6 };

  it("opens free items and met rules", () => {
    expect(isRuleMet("start", stats)).toBe(true);
    expect(isRuleMet("journal-5", stats)).toBe(true);
    expect(isRuleMet("vitals-streak-3", stats)).toBe(true);
  });

  it("keeps unmet rules, check-ins and unknown rules locked", () => {
    expect(isRuleMet("journal-20", stats)).toBe(false);
    expect(isRuleMet("vitals-streak-7", stats)).toBe(false);
    expect(isRuleMet("checkin-14", stats)).toBe(false);
    expect(isRuleMet("something-else", stats)).toBe(false);
  });

  it("reports progress only for rules it can measure", () => {
    expect(ruleProgress("journal-20", stats)).toEqual({ have: 5, need: 20 });
    expect(ruleProgress("checkin-14", stats)).toBeNull();
  });
});
