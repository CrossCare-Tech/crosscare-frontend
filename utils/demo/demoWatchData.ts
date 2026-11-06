// Plausible readings for the Demo Watch, worn by the sample patient (Maya Thompson, 24 weeks).
// Every value is derived from the date, so the same day always shows the same numbers.
// The shapes match what the Fitbit store answers, so screens read them the same way.

const DAY_MS = 86400000;

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Small deterministic noise in [0, 1) from a string
const noise = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
};

const between = (seed: string, min: number, max: number) => min + noise(seed) * (max - min);

const localNoon = (date: string) => new Date(`${date}T12:00:00`);

const eachDay = (start: string, end: string) => {
  const days: string[] = [];
  for (let t = localNoon(start).getTime(); t <= localNoon(end).getTime(); t += DAY_MS) {
    days.push(dayKey(new Date(t)));
  }
  return days;
};

// A full day lands between 4,800 and 9,600 steps; today only counts what has happened so far
export const watchStepsFor = (date: string, now = new Date()) => {
  const full = Math.round(between(`steps-${date}`, 4800, 9600));
  if (date !== dayKey(now)) return full;
  const hours = now.getHours() + now.getMinutes() / 60;
  const share = Math.min(Math.max((hours - 6) / 15, 0.05), 1);
  return Math.round(full * share);
};

export const watchRestingHeartFor = (date: string) => Math.round(between(`heart-${date}`, 68, 82));

// The night that ends on the morning of `date` (bedtime near 22:30, wake-up near 06:30)
export const watchSleepFor = (date: string) => {
  const wake = localNoon(date);
  wake.setHours(6, 0, 0, 0);
  wake.setMinutes(Math.round(between(`wake-${date}`, 0, 60)));
  const durationMs = Math.round(between(`sleep-${date}`, 6.4, 8.6) * 3600000);
  const start = new Date(wake.getTime() - durationMs);
  return {
    logId: Math.round(localNoon(date).getTime() / 1000),
    dateOfSleep: date,
    startTime: start.toISOString(),
    endTime: wake.toISOString(),
    duration: durationMs,
  };
};

export const watchSteps = (start: string, end: string) => ({
  "activities-steps": eachDay(start, end).map((date) => ({ dateTime: date, value: String(watchStepsFor(date)) })),
});

export const watchHeart = (start: string, end: string) => ({
  "activities-heart": eachDay(start, end).map((date) => ({
    dateTime: date,
    value: { restingHeartRate: watchRestingHeartFor(date) },
  })),
});

// Same range names the sleep screen sends to the real stores
export const watchSleepRange = (timeRange: string) => {
  const today = new Date();
  const back = timeRange === "today" ? 0 : timeRange === "month" || timeRange === "lastMonth" ? 30 : 7;
  const start = new Date(today.getTime() - back * DAY_MS);
  return { sleep: eachDay(dayKey(start), dayKey(today)).map(watchSleepFor) };
};
