import { withTodayReadings } from "../todayReadings";

const day = (date: string, details: any) => ({ date, details });
const bp = { data: { todayBloodPressure: { systolic: 121, diastolic: 79 } } };
const glucose = { data: { todayGlucose: 101, todayGlucoseUnit: "mg/dL", todayGlucoseMealContext: null } };

describe("withTodayReadings", () => {
  const stale = [
    day("2026-11-04", { bloodPressure: { systolic: 110, diastolic: 70 } }),
    day("2026-11-05", { bloodPressure: { systolic: 234, diastolic: 232, recorded_at: "x" }, glucose: { value: 95, unit: "mg/dL" }, water: 8 }),
  ];

  it("replaces today's stale blood pressure and glucose with the status values", () => {
    const [yesterday, today] = withTodayReadings(stale, bp, glucose, "2026-11-05");
    expect(today.details.bloodPressure).toMatchObject({ systolic: 121, diastolic: 79, recorded_at: "x" });
    expect(today.details.glucose.value).toBe(101);
    expect(today.details.water).toBe(8);
    expect(yesterday).toBe(stale[0]);
  });

  it("leaves the list alone when the status has no reading for today", () => {
    const empty = { data: { todayBloodPressure: null, todayGlucose: null } };
    expect(withTodayReadings(stale, empty, empty, "2026-11-05")).toBe(stale);
    expect(withTodayReadings(stale, null, null, "2026-11-05")).toBe(stale);
  });

  it("only touches the day it is told is today", () => {
    expect(withTodayReadings(stale, bp, glucose, "2026-11-06")[1]).toBe(stale[1]);
  });
});
