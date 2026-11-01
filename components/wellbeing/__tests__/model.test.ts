import {
  CycleLog,
  askedForSupport,
  cycleDayOn,
  needsFullAssessment,
  phq9Band,
  phqScore,
  summarizeCycle,
} from "../model";

const period = (...days: string[]): Record<string, CycleLog> =>
  Object.fromEntries(days.map((day) => [day, { flow: "medium", symptoms: [] } as CycleLog]));

describe("summarizeCycle", () => {
  const logs = {
    ...period("2026-07-07", "2026-07-08", "2026-07-09"),
    ...period("2026-08-03", "2026-08-04", "2026-08-05"),
  };

  it("predicts the next period from the last cycle length and period length", () => {
    const summary = summarizeCycle(logs, "2026-08-05");
    expect(summary.starts).toEqual(["2026-07-07", "2026-08-03"]);
    expect(summary.cycleCount).toBe(1);
    expect(summary.nextStart).toBe("2026-08-30");
    expect(summary.nextEnd).toBe("2026-09-01");
    expect(summary.days["2026-08-30"]).toBe("predicted");
  });

  it("places the fertile window before the expected ovulation", () => {
    const { days } = summarizeCycle(logs, "2026-08-05");
    expect(days["2026-08-14"]).toBe("fertile");
    expect(days["2026-08-16"]).toBe("fertile");
    expect(days["2026-08-17"]).toBeUndefined();
  });

  it("does not count spotting as a period", () => {
    const summary = summarizeCycle({ ...logs, "2026-08-20": { flow: "spotting", symptoms: [] } }, "2026-08-21");
    expect(summary.starts).toHaveLength(2);
    expect(summary.days["2026-08-20"]).toBeUndefined();
  });

  it("does not predict from a single period", () => {
    const summary = summarizeCycle(period("2026-08-03"), "2026-08-04");
    expect(summary.nextStart).toBeNull();
  });

  it("never predicts a late period in the past", () => {
    expect(summarizeCycle(logs, "2026-09-10").nextStart).toBe("2026-09-10");
  });
});

describe("cycleDayOn", () => {
  it("counts the first day of the period as day 1", () => {
    expect(cycleDayOn(["2026-07-07", "2026-08-03"], "2026-08-05")).toBe(3);
  });

  it("has no day before the first logged period", () => {
    expect(cycleDayOn(["2026-07-07"], "2026-07-01")).toBeNull();
  });
});

describe("PHQ scoring", () => {
  it("goes on to the PHQ-9 from a PHQ-2 score of 3", () => {
    expect(needsFullAssessment([1, 1])).toBe(false);
    expect(needsFullAssessment([2, 1])).toBe(true);
  });

  it.each([
    [0, "minimal"],
    [4, "minimal"],
    [5, "mild"],
    [9, "mild"],
    [10, "moderate"],
    [14, "moderate"],
    [15, "moderatelySevere"],
    [19, "moderatelySevere"],
    [20, "severe"],
    [27, "severe"],
  ])("scores %i as %s", (score, band) => {
    expect(phq9Band(score)).toBe(band);
  });

  it("adds up the answers", () => {
    expect(phqScore([1, 2, 0, 3])).toBe(6);
  });

  it("brings support forward on any positive answer to question 9, even with a low score", () => {
    expect(askedForSupport([0, 0, 0, 0, 0, 0, 0, 0, 1])).toBe(true);
    expect(askedForSupport([3, 3, 3, 3, 3, 3, 3, 3, 0])).toBe(false);
    expect(askedForSupport([1, 1])).toBe(false);
  });
});
