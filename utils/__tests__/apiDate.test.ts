import { parseApiDate } from "../apiDate";

// The expectations are ISO strings, so they hold in any time zone of the machine running the tests
describe("parseApiDate", () => {
  it("reads a note date (month first) as the server's UTC clock", () => {
    expect(parseApiDate("10/23/2026, 1:16 PM", "mdy")?.toISOString()).toBe("2026-10-23T13:16:00.000Z");
  });

  it("reads a photo date (day first) as the server's UTC clock", () => {
    expect(parseApiDate("23/10/2026, 1:16 PM", "dmy")?.toISOString()).toBe("2026-10-23T13:16:00.000Z");
  });

  it("handles midnight and noon", () => {
    expect(parseApiDate("5/11/2026, 12:05 AM", "dmy")?.toISOString()).toBe("2026-11-05T00:05:00.000Z");
    expect(parseApiDate("5/11/2026, 12:05 PM", "dmy")?.toISOString()).toBe("2026-11-05T12:05:00.000Z");
  });

  it("returns null for text that is not a date", () => {
    expect(parseApiDate("yesterday", "dmy")).toBeNull();
  });
});
