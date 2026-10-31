/**
 * Local-calendar date helpers.
 *
 * `toISOString()` converts to UTC before formatting, so splitting its result
 * on "T" yields tomorrow's date for any local time after 19:00 at UTC-5.
 * Every calendar date this app stores or compares is a local date, so derive
 * it from the local fields instead.
 */

/** The local calendar date of `date` (default: now) as `YYYY-MM-DD`. */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's local calendar date as `YYYY-MM-DD`. */
export function todayDateString(): string {
  return toLocalDateString();
}

/**
 * The local calendar date of a value that may already be a date-only string.
 *
 * `new Date("2026-10-07")` parses as UTC midnight, so resolving it through the
 * local fields would shift it a day behind at negative offsets. An exact
 * `YYYY-MM-DD` string is therefore passed through untouched; anything else is
 * resolved against local time.
 */
export function dateKeyOf(value: string | number | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return toLocalDateString(new Date(value));
}
