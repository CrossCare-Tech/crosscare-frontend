import { getBPCategory, getGlucoseCategory, getHeartCategory } from "@/utils/vitalCategories";

export type VitalKind = "bloodPressure" | "glucose" | "heartRate" | "weight";
export type VitalStatus = "outOfRange" | "attention" | "normal" | "noRange";
export type VitalRow = {
  id: string;
  kind: VitalKind;
  value: string | null; // null: this vital has no reading yet
  unit: string;
  status: VitalStatus;
  day: string | null;
  recordedAt: string | null; // null: the API only says which day (docs/demo-mode.md, gap 1)
  fasting: boolean | null; // glucose only
};

export type MedicationStatus = "takenToday" | "overdue" | "takenEarlier" | "never";
export type MedicationRow = {
  id: string;
  name: string;
  times: string[];
  status: MedicationStatus;
  lastTakenDay: string | null;
  lastTakenAt: string | null; // null: the real API stores the day a dose was marked, not the time
};

export type Feeling = {
  start: string;
  end: string;
  moodEntries: number;
  lowMoodEntries: number;
  symptomEntries: number;
  symptomTypes: string[];
  noteTopics: string[];
};

// The activity history and the medication list, as the API returns them
export type ApiActivity = {
  date: string;
  details?: {
    heart?: number;
    heartRecordedAt?: string;
    bloodPressure?: { systolic?: number | null; diastolic?: number | null; recorded_at?: string };
    glucose?: { value?: number; unit?: string; mealContext?: string | null; recorded_at?: string };
    weight?: { value?: number; unit?: string; recorded_at?: string };
  };
};
export type ApiMedication = {
  id: string;
  medicationName: string;
  startDate: string;
  endDate?: string | null;
  days?: string[];
  times?: string[];
  completedDates?: string[];
  completedAt?: Record<string, string>;
};

export const SUMMARY_DAYS = 7;
const DAY_CODES = ["SU", "M", "T", "W", "TH", "F", "SA"];
const STATUS_ORDER: VitalStatus[] = ["outOfRange", "attention", "normal", "noRange"];

export const localDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const daysBefore = (now: Date, days: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return localDay(date);
};

// One activity day as a reading of each vital it holds
export type SummaryWeightUnit = "kg" | "lbs";

// The API stores kilograms; the summary shows the unit the patient chose in Units & Measurements
const weightIn = (value: number, from: string | undefined, to: SummaryWeightUnit) => {
  const source = from === "lbs" ? "lbs" : "kg";
  const converted = source === to ? value : to === "lbs" ? value * 2.20462 : value / 2.20462;
  return Math.round(converted * 10) / 10;
};

const readingsOf = ({ date, details: d }: ApiActivity, weightUnit: SummaryWeightUnit): VitalRow[] => {
  const rows: VitalRow[] = [];
  const row = (kind: VitalKind, value: string, unit: string, status: VitalStatus, recordedAt?: string, fasting: boolean | null = null) =>
    rows.push({ id: `${kind}-${date}`, kind, value, unit, status, day: date, recordedAt: recordedAt || null, fasting });

  const { systolic, diastolic, recorded_at: bpAt } = d?.bloodPressure || {};
  if (systolic && diastolic) {
    const { key } = getBPCategory(systolic, diastolic);
    row("bloodPressure", `${systolic}/${diastolic}`, "mmHg", key === "high2" ? "outOfRange" : key === "normal" ? "normal" : "attention", bpAt);
  }
  if (d?.glucose?.value) {
    const { value, unit = "mg/dL", mealContext = null, recorded_at } = d.glucose;
    const { key } = getGlucoseCategory(value, unit, mealContext);
    row("glucose", String(value), unit, key === "normal" ? "normal" : "outOfRange", recorded_at, mealContext === "Fasting");
  }
  if (d?.heart) {
    row("heartRate", String(d.heart), "bpm", getHeartCategory(d.heart).key === "normal" ? "normal" : "outOfRange", d.heartRecordedAt);
  }
  // The app has no target range for weight
  if (d?.weight?.value) row("weight", String(weightIn(d.weight.value, d.weight.unit, weightUnit)), weightUnit, "noRange", d.weight.recorded_at);
  return rows;
};

// The latest reading of each vital, plus any other out-of-range reading from the last 7 days.
// Out-of-range rows come first, then the newest.
export const buildVitals = (activities: ApiActivity[], now = new Date(), weightUnit: SummaryWeightUnit = "lbs"): VitalRow[] => {
  const since = daysBefore(now, SUMMARY_DAYS - 1);
  const readings = [...activities].sort((a, b) => b.date.localeCompare(a.date)).flatMap((activity) => readingsOf(activity, weightUnit));
  const kinds: VitalKind[] = ["bloodPressure", "glucose", "heartRate", "weight"];
  const rows = kinds.flatMap((kind): VitalRow[] => {
    const [latest, ...older] = readings.filter((reading) => reading.kind === kind);
    if (!latest) {
      return [{ id: kind, kind, value: null, unit: "", status: "noRange", day: null, recordedAt: null, fasting: null }];
    }
    return [latest, ...older.filter((reading) => reading.status === "outOfRange" && reading.day! >= since)];
  });
  return rows.sort(
    (a, b) =>
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
      Number(a.value === null) - Number(b.value === null) ||
      (b.day || "").localeCompare(a.day || "")
  );
};

// The newest reading of a vital, for the header chips. Rows are not in date order.
export const latestReading = (rows: VitalRow[] | null, kind: VitalKind) =>
  (rows || [])
    .filter((row) => row.kind === kind && row.value !== null)
    .sort((a, b) => (b.day || "").localeCompare(a.day || ""))[0];

// "08:00 AM" (what the API sends) on a given day
const doseTime = (day: string, time: string) => {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  const [year, month, date] = day.split("-").map(Number);
  const period = match[3]?.toUpperCase();
  const hours = (Number(match[1]) % (period ? 12 : 24)) + (period === "PM" ? 12 : 0);
  return new Date(year, month - 1, date, hours, Number(match[2]));
};

// Doses are marked per day, so several doses on one day count as one. A dose is overdue only
// from its time today until it is marked; earlier missed days are not chased.
export const buildMedications = (medications: ApiMedication[], now = new Date()): MedicationRow[] => {
  const today = localDay(now);
  return medications.map((med) => {
    const taken = (med.completedDates || []).map((day) => day.slice(0, 10)).filter((day) => day <= today).sort();
    const lastTakenDay = taken[taken.length - 1] || null;
    const started = med.startDate.slice(0, 10) <= today && (!med.endDate || med.endDate.slice(0, 10) >= today);
    const dueToday = started && (med.days || []).includes(DAY_CODES[now.getDay()]);
    const doseHasPassed = (med.times || []).some((time) => {
      const due = doseTime(today, time);
      return !!due && due <= now;
    });
    const status: MedicationStatus =
      lastTakenDay === today ? "takenToday" : dueToday && doseHasPassed ? "overdue" : lastTakenDay ? "takenEarlier" : "never";
    return {
      id: med.id,
      name: med.medicationName,
      times: med.times || [],
      status,
      lastTakenDay,
      lastTakenAt: (lastTakenDay && med.completedAt?.[lastTakenDay]) || null,
    };
  });
};

// Counts behind the simulated "How she's been feeling" text, for the last 7 days
export const buildFeeling = (
  moods: { date: string; moodLevel?: string | null }[],
  symptoms: { occurredAt: string; symptomType: string }[],
  notes: { at: string; topic: string }[],
  now = new Date()
): Feeling => {
  const start = daysBefore(now, SUMMARY_DAYS - 1);
  const end = localDay(now);
  const inPeriod = (day: string) => day >= start && day <= end;
  const logged = moods.filter((mood) => mood.moodLevel && inPeriod(mood.date));
  const recent = symptoms.filter((symptom) => inPeriod(localDay(new Date(symptom.occurredAt))));
  const recentNotes = notes.filter((note) => inPeriod(localDay(new Date(note.at))));
  return {
    start,
    end,
    moodEntries: logged.length,
    lowMoodEntries: logged.filter((mood) => mood.moodLevel === "LOW" || mood.moodLevel === "VERY_LOW").length,
    symptomEntries: recent.length,
    symptomTypes: [...new Set(recent.map((symptom) => symptom.symptomType))],
    noteTopics: [...new Set(recentNotes.map((note) => note.topic))],
  };
};

export type Milestone = { key: "firstScreening" | "anatomy" | "glucoseScreening"; date: string; done: boolean };

// Sample milestones, front end only: the app has no milestone records and the backend is not involved.
// The prototype's three items, dated around today so "Scheduled" never shows a day already gone.
const SAMPLE_MILESTONES: [Milestone["key"], number][] = [
  ["firstScreening", -180],
  ["anatomy", -60],
  ["glucoseScreening", 14],
];

export const buildMilestones = (now = new Date()): Milestone[] =>
  SAMPLE_MILESTONES.map(([key, days]) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return { key, date: date.toISOString(), done: days < 0 };
  });

// The sample file name: only the date, never the patient's name
export const demoPdfName = (now = new Date()) =>
  `Pregnancy_Summary_${now.toLocaleDateString("en-US", { month: "short" })}${String(now.getDate()).padStart(2, "0")}.pdf`;

export const QR_SIZE = 21;

// Dark cells of a QR-looking drawing that changes with each code. It encodes nothing and cannot be scanned.
export const demoQrCells = (seed: number): [number, number][] => {
  const cells: [number, number][] = [];
  const corner = (x: number, y: number) => x >= 0 && y >= 0 && x < 7 && y < 7;
  const finder = (x: number, y: number) => x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      const right = QR_SIZE - 7;
      const local = corner(x, y) ? [x, y] : corner(x - right, y) ? [x - right, y] : corner(x, y - right) ? [x, y - right] : null;
      if (local ? finder(local[0], local[1]) : !(x < 8 && y < 8) && !(x >= right - 1 && y < 8) && !(x < 8 && y >= right - 1) && (x * 7 + y * 13 + x * y * seed + seed * 5) % 3 === 0) {
        cells.push([x, y]);
      }
    }
  }
  return cells;
};
