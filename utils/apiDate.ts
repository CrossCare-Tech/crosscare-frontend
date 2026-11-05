// The API returns formatted strings instead of ISO dates:
// notes   "10/23/2026, 1:16 PM" (month first), photos "23/10/2026, 1:16 PM" (day first)
// They are written with the server's clock (toLocaleString with no time zone, UTC on the host), so the
// text is read as UTC and shown in the phone's time: an entry saved at 4:21 PM in Brazil is "7:21 PM" here.
export const parseApiDate = (value: string, order: "mdy" | "dmy"): Date | null => {
  const match = value?.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i
  );
  if (!match) return null;
  const [, a, b, year, h, min, ampm] = match;
  const month = Number(order === "mdy" ? a : b) - 1;
  const day = Number(order === "mdy" ? b : a);
  let hours = Number(h) % 12;
  if (ampm?.toUpperCase() === "PM") hours += 12;
  return new Date(Date.UTC(Number(year), month, day, hours, Number(min)));
};
