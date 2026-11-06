import { ApiActivity, ApiMedication, buildFeeling, buildMedications, buildMilestones, buildVitals, demoQrCells } from "../model";

const now = new Date(2026, 9, 31, 12, 0); // Saturday

describe("buildVitals", () => {
  const activities: ApiActivity[] = [
    { date: "2026-10-31", details: { glucose: { value: 88, unit: "mg/dL", mealContext: "After meal", recorded_at: "2026-10-31T11:00:00.000Z" }, heart: 80, weight: { value: 68, unit: "kg" } } },
    { date: "2026-10-28", details: { glucose: { value: 103, unit: "mg/dL", mealContext: "Fasting" } } },
    { date: "2026-10-10", details: { glucose: { value: 110, unit: "mg/dL", mealContext: "Fasting" } } },
  ];

  it("puts out-of-range readings from the last 7 days first, and keeps the latest of each vital", () => {
    const rows = buildVitals(activities, now);
    expect(rows[0]).toMatchObject({ kind: "glucose", value: "103", status: "outOfRange", day: "2026-10-28", fasting: true });
    expect(rows.map((row) => row.value)).not.toContain("110");
    expect(rows.find((row) => row.value === "88")).toMatchObject({ status: "normal", recordedAt: "2026-10-31T11:00:00.000Z" });
  });

  it("uses the existing limits and never invents a time or a weight range", () => {
    const rows = buildVitals([{ date: "2026-10-31", details: { bloodPressure: { systolic: 140, diastolic: 90 }, weight: { value: 68 } } }], now);
    expect(rows.find((row) => row.kind === "bloodPressure")).toMatchObject({ status: "outOfRange", recordedAt: null });
    expect(rows.find((row) => row.kind === "weight")?.status).toBe("noRange");
  });

  it("shows the weight in the unit the patient chose, pounds by default", () => {
    const activity = [{ date: "2026-10-31", details: { weight: { value: 68, unit: "kg" } } }];
    const weight = (unit?: "kg" | "lbs") => buildVitals(activity, now, unit).find((row) => row.kind === "weight");
    expect(weight()).toMatchObject({ value: "149.9", unit: "lbs" });
    expect(weight("kg")).toMatchObject({ value: "68", unit: "kg" });
    // A reading saved in pounds is not converted twice
    const inLbs = [{ date: "2026-10-31", details: { weight: { value: 150, unit: "lbs" } } }];
    expect(buildVitals(inLbs, now, "lbs").find((row) => row.kind === "weight")).toMatchObject({ value: "150", unit: "lbs" });
  });

  it("lists a vital with no reading last", () => {
    const rows = buildVitals([{ date: "2026-10-31", details: { heart: 80 } }], now);
    expect(rows[0].kind).toBe("heartRate");
    expect(rows.filter((row) => row.value === null)).toHaveLength(3);
  });
});

describe("buildMedications", () => {
  const med: ApiMedication = { id: "m", medicationName: "Prenatal vitamin", startDate: "2026-09-01", days: ["SA"], times: ["08:00 AM"], completedDates: [] };
  const status = (changes: Partial<ApiMedication>, at = now) => buildMedications([{ ...med, ...changes }], at)[0];

  it("is overdue once today's dose time has passed unmarked, even if never taken", () => {
    expect(status({}).status).toBe("overdue");
  });
  it("is never taken before the first dose is due", () => {
    expect(status({}, new Date(2026, 9, 31, 7, 0)).status).toBe("never");
    expect(status({ days: ["M"] }).status).toBe("never");
  });
  it("reads 12 PM doses at noon, not midnight", () => {
    expect(status({ times: ["12:30 PM"] }).status).toBe("never");
    expect(status({ times: ["12:00 AM"] }).status).toBe("overdue");
  });
  it("is taken today, with the time only when the API kept it", () => {
    expect(status({ completedDates: ["2026-10-31"] })).toMatchObject({ status: "takenToday", lastTakenAt: null, lastTakenDay: "2026-10-31" });
    expect(status({ completedDates: ["2026-10-31"], completedAt: { "2026-10-31": "2026-10-31T11:05:00.000Z" } }).lastTakenAt).toBe("2026-10-31T11:05:00.000Z");
  });
  it("is taken earlier when nothing is due today", () => {
    expect(status({ days: ["M"], completedDates: ["2026-10-26"] }).status).toBe("takenEarlier");
  });
  it("ignores a medication outside its dates when checking what is due", () => {
    expect(status({ startDate: "2026-11-05" }).status).toBe("never");
  });
});

describe("buildFeeling", () => {
  it("counts only the last 7 days", () => {
    const feeling = buildFeeling(
      [{ date: "2026-10-30", moodLevel: "LOW" }, { date: "2026-10-29", moodLevel: "HIGH" }, { date: "2026-10-01", moodLevel: "LOW" }],
      [{ occurredAt: new Date(2026, 9, 30, 16).toISOString(), symptomType: "nausea" }, { occurredAt: new Date(2026, 9, 2).toISOString(), symptomType: "swelling" }],
      [{ at: new Date(2026, 9, 30).toISOString(), topic: "sleep" }],
      now
    );
    expect(feeling).toMatchObject({ start: "2026-10-25", end: "2026-10-31", moodEntries: 2, lowMoodEntries: 1, symptomTypes: ["nausea"], noteTopics: ["sleep"] });
  });
});

describe("buildMilestones", () => {
  it("lists the prototype's three items, with the last one still to come", () => {
    const rows = buildMilestones(now);
    expect(rows.map((row) => [row.key, row.done])).toEqual([["firstScreening", true], ["anatomy", true], ["glucoseScreening", false]]);
    expect(new Date(rows[2].date).getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(rows[1].date).getTime()).toBeLessThan(now.getTime());
  });
});

describe("demoQrCells", () => {
  it("draws a different picture for each new code", () => {
    expect(demoQrCells(1)).not.toEqual(demoQrCells(2));
  });
});
