// Cycle predictions and PHQ scoring for the Menstrual Tracking & Mental Health screens (prototype 9.1–9.6).
// Plain functions, no React, so they can be tested on their own.

export type Flow = "light" | "medium" | "heavy" | "spotting";
export type CycleSymptom = "cramps" | "headache" | "bloating" | "fatigue";
export type PrivateActivity = "protected" | "unprotected" | "none";
export type PrivateSymptom = "discomfort" | "spotting" | "none";

export type CycleLog = {
  flow: Flow | null;
  symptoms: CycleSymptom[];
};

export type PrivateLog = {
  activity: PrivateActivity | null;
  symptoms: PrivateSymptom[];
  notes: string;
};

export type DayKind = "period" | "fertile" | "predicted";

export type CycleSummary = {
  starts: string[];
  days: Record<string, DayKind>;
  nextStart: string | null;
  nextEnd: string | null;
  cycleCount: number; // cycles the prediction is based on
};

const MAX_CYCLES = 6;
const DEFAULT_PERIOD_DAYS = 5;
const MAX_GAP_DAYS = 2; // a day or two without flow does not start a new period
const LUTEAL_DAYS = 14; // ovulation comes about 14 days before the next period
const FERTILE_DAYS = 3;

const pad = (value: number) => String(value).padStart(2, "0");

export const dayKeyOf = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const dateOf = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (key: string, days: number) => {
  const date = dateOf(key);
  date.setDate(date.getDate() + days);
  return dayKeyOf(date);
};

// Goes through UTC so a daylight saving change does not shift the count
export const daysBetween = (from: string, to: string) => {
  const utc = (key: string) => {
    const [year, month, day] = key.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((utc(to) - utc(from)) / 86400000);
};

const mean = (values: number[]) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

// Periods are read from the logged days, so changing a log changes the calendar. Spotting is not a period day.
const groupPeriods = (logs: Record<string, CycleLog>, today: string) => {
  const days = Object.keys(logs)
    .filter((key) => key <= today && logs[key].flow && logs[key].flow !== "spotting")
    .sort();
  const groups: string[][] = [];
  days.forEach((key) => {
    const current = groups[groups.length - 1];
    if (current && daysBetween(current[current.length - 1], key) <= MAX_GAP_DAYS) current.push(key);
    else groups.push([key]);
  });
  return groups;
};

const setFertileDays = (days: Record<string, DayKind>, periodStart: string) => {
  const ovulation = addDays(periodStart, -LUTEAL_DAYS);
  for (let index = 0; index < FERTILE_DAYS; index += 1) {
    const key = addDays(ovulation, -index);
    if (!days[key]) days[key] = "fertile";
  }
};

export const summarizeCycle = (logs: Record<string, CycleLog>, today: string): CycleSummary => {
  const groups = groupPeriods(logs, today);
  const starts = groups.map((group) => group[0]);
  const days: Record<string, DayKind> = {};
  groups.flat().forEach((key) => {
    days[key] = "period";
  });
  starts.slice(1).forEach((start) => setFertileDays(days, start));

  const lengths = starts.slice(1).map((start, index) => daysBetween(starts[index], start)).slice(-MAX_CYCLES);
  if (!lengths.length) return { starts, days, nextStart: null, nextEnd: null, cycleCount: 0 };

  // The latest period may still be going, so only finished ones set the expected length
  const finished = groups.slice(0, -1).slice(-MAX_CYCLES);
  const periodDays = finished.length
    ? mean(finished.map((group) => daysBetween(group[0], group[group.length - 1]) + 1))
    : DEFAULT_PERIOD_DAYS;

  // A late period is predicted from today, never in the past
  const expected = addDays(starts[starts.length - 1], mean(lengths));
  const nextStart = expected < today ? today : expected;
  const nextEnd = addDays(nextStart, periodDays - 1);
  setFertileDays(days, nextStart);
  for (let index = 0; index < periodDays; index += 1) {
    const key = addDays(nextStart, index);
    if (!days[key]) days[key] = "predicted";
  }
  return { starts, days, nextStart, nextEnd, cycleCount: lengths.length };
};

// Day of the cycle on a date, counting the first day of the period as day 1
export const cycleDayOn = (starts: string[], key: string) => {
  const start = [...starts].reverse().find((item) => item <= key);
  return start ? daysBetween(start, key) + 1 : null;
};

// PHQ-9 items, in the order of the validated questionnaire. The first two are the PHQ-2.
export const PHQ_ITEMS = [
  "interest",
  "down",
  "sleep",
  "energy",
  "appetite",
  "failure",
  "concentration",
  "movement",
  "selfHarm",
] as const;

export const PHQ_OPTIONS = ["notAtAll", "severalDays", "moreThanHalf", "nearlyEvery"] as const;

export const PHQ2_COUNT = 2;
export const PHQ9_COUNT = PHQ_ITEMS.length;
export const PHQ2_FULL_ASSESSMENT_SCORE = 3; // the usual cut-off for going on to the PHQ-9

const SELF_HARM_INDEX = PHQ_ITEMS.indexOf("selfHarm");

export type PhqBand = "minimal" | "mild" | "moderate" | "moderatelySevere" | "severe";

export const phqScore = (answers: number[]) => answers.reduce((sum, value) => sum + value, 0);

export const needsFullAssessment = (phq2Answers: number[]) => phqScore(phq2Answers) >= PHQ2_FULL_ASSESSMENT_SCORE;

export const phq9Band = (score: number): PhqBand => {
  if (score <= 4) return "minimal";
  if (score <= 9) return "mild";
  if (score <= 14) return "moderate";
  if (score <= 19) return "moderatelySevere";
  return "severe";
};

// Any answer above "not at all" on question 9 brings support to the top, whatever the total score
export const askedForSupport = (answers: number[]) => (answers[SELF_HARM_INDEX] ?? 0) > 0;
