import {
  Activity,
  DEMO_TOKEN,
  DemoDb,
  dayKey,
  emptyActivity,
  newId,
  parseDay,
  resetDemoDb,
} from "./mockDb";
import { BADGE_TEXT, ragReply } from "./mockContent";

// Answers CrossCare API requests from the demo database. Each handler returns the same shape as the
// matching controller in crosscare-backend (file:line noted where it helps), so screens cannot tell
// the difference. Routes the backend does not have yet are marked "backend gap" (see docs/demo-mode.md).

export type MockRequest = {
  method: string;
  path: string;
  query: Record<string, string>;
  body: any;
};
export type MockResponse = { status: number; body: any };
type Handler = (db: DemoDb, params: Record<string, string>, req: MockRequest) => MockResponse;

const ok = (body: any, status = 200): MockResponse => ({ status, body });
const fail = (status: number, message: string): MockResponse => ({
  status,
  body: { success: false, message },
});

// ---------- formatting (matches the backend's toLocale* output) ----------

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_CODES = ["SU", "M", "T", "W", "TH", "F", "SA"];

const weekday = (key: string) => WEEKDAYS[parseDay(key).getDay()];

// "06:45 AM", as toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
const time12 = (date: Date) => {
  const hours = date.getHours();
  const h = hours % 12 || 12;
  return `${String(h).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
};

// "10/29/2026, 8:40 AM", as formatDateTime() in activity.controller.js:2810
const dateTimeUS = (iso: string) => {
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}, ${h}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() >= 12 ? "PM" : "AM"}`;
};

// "29/10/2026, 8:40 AM", as the journal handlers in activity.controller.js:3650
const dateTimeJournal = (iso: string) => {
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}, ${h}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() >= 12 ? "PM" : "AM"}`;
};

const duration = (startIso: string | null, endIso: string | null) => {
  if (!startIso || !endIso) return "0 hr";
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (end <= start) end.setDate(end.getDate() + 1);
  const ms = end.getTime() - start.getTime();
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
};

// "08:00" or "8:00 AM" -> { hours, minutes }
const parseClock = (value: string) => {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
};

const clockTo12 = (value: string) => {
  const clock = parseClock(value);
  if (!clock) return value;
  const date = new Date();
  date.setHours(clock.hours, clock.minutes, 0, 0);
  return time12(date);
};

// ---------- activities ----------

const todayKey = () => dayKey(new Date());

// The day a reading belongs to: `recorded_at` (backdated vitals) or `date`, else today
const targetDay = (body: any) => {
  const raw = body?.recorded_at || body?.date;
  if (!raw) return todayKey();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? todayKey() : dayKey(parsed);
};

const activityFor = (db: DemoDb, key: string) => {
  let activity = db.activities.find((a) => a.date === key);
  if (!activity) {
    activity = emptyActivity(key, db.patient);
    db.activities.push(activity);
    db.activities.sort((a, b) => a.date.localeCompare(b.date));
  }
  return activity;
};

const lastDays = (db: DemoDb, count: number) => {
  const from = new Date();
  from.setDate(from.getDate() - (count - 1));
  const fromKey = dayKey(from);
  const to = todayKey();
  return db.activities.filter((a) => a.date >= fromKey && a.date <= to);
};

// The record Prisma returns for a PatientActivity
const activityRecord = (db: DemoDb, a: Activity) => ({
  ...a,
  patientId: db.patient.id,
  date: parseDay(a.date).toISOString(),
});

// ---------- patient ----------

const pregnancyProgress = (db: DemoDb) => {
  const { patient } = db;
  const today = new Date();
  const created = new Date(patient.createdAt);
  const updated = new Date(patient.updatedAt);
  const daysSinceCreation = Math.floor((today.getTime() - created.getTime()) / 86400000);
  const daysSinceUpdate = Math.floor((today.getTime() - updated.getTime()) / 86400000);
  const totalDays = (patient.week || 0) * 7 + (patient.day || 0) + daysSinceUpdate;
  const remainingDays = Math.max(0, 280 - totalDays);
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + remainingDays);
  return {
    currentWeek: Math.floor(totalDays / 7),
    currentDay: totalDays % 7,
    pregnancyData: {
      totalDays,
      remainingDays,
      dueDate: dueDate.toISOString(),
      daysSinceAccountCreation: daysSinceCreation,
      manuallySetWeek: patient.week || 0,
      manuallySetDay: patient.day || 0,
    },
  };
};

const badgeList = (db: DemoDb) =>
  db.badges.map((b) => ({
    id: b.id,
    patientId: db.patient.id,
    badgeId: `badge-${b.type}`,
    awardedAt: b.awardedAt,
    badge: {
      type: b.type,
      title: BADGE_TEXT[b.type]?.title || b.type,
      description: BADGE_TEXT[b.type]?.description || "",
      createdAt: b.awardedAt,
    },
  }));

const awardBadge = (db: DemoDb, type: string) => {
  const existing = db.badges.find((b) => b.type === type);
  if (existing) return { badge: existing, isNew: false };
  const badge = { id: newId("badge"), type, awardedAt: new Date().toISOString() };
  db.badges.push(badge);
  return { badge, isNew: true };
};

// FormData from React Native keeps its fields in `_parts` as [name, value] pairs
const formFields = (body: any): Record<string, any> => {
  if (body && Array.isArray(body._parts)) {
    return Object.fromEntries(body._parts.map(([key, value]: [string, any]) => [key, value]));
  }
  return body || {};
};
const fileUri = (value: any) => (value && typeof value === "object" ? value.uri : value) || null;

// ---------- journal ----------

const sections = <T,>(items: T[], dateOf: (item: T) => string, keepEmpty: boolean) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(startOfToday);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const groups: Record<string, T[]> = { Today: [], "Last Week": [], Previously: [] };
  for (const item of items) {
    const created = new Date(dateOf(item));
    if (created >= startOfToday) groups.Today.push(item);
    else if (created >= weekAgo) groups["Last Week"].push(item);
    else groups.Previously.push(item);
  }
  return Object.entries(groups)
    .filter(([, list]) => keepEmpty || list.length > 0)
    .map(([title, list]) => ({ title, items: list }));
};

const byNewest = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

// ---------- meals ----------

const dailyProgress = (a: Activity) => ({
  caloriesConsumed: a.caloriesConsumed,
  calorieGoal: a.calorieGoal,
  goodFoodCount: a.goodFoodCount,
  badFoodCount: a.badFoodCount,
});

const applyFood = (a: Activity, calories: number, quantity: number, classification: string, sign: 1 | -1) => {
  a.caloriesConsumed = Math.max(0, a.caloriesConsumed + sign * calories * quantity);
  if (classification === "GOOD") a.goodFoodCount = Math.max(0, a.goodFoodCount + sign * quantity);
  if (classification === "BAD") a.badFoodCount = Math.max(0, a.badFoodCount + sign * quantity);
};

const findFood = (db: DemoDb, foodItemId: string) => {
  for (const meal of db.meals) {
    const item = meal.foodItems.find((f) => f.id === foodItemId);
    if (item) return { meal, item, activity: db.activities.find((a) => a.id === meal.activityId) };
  }
  return null;
};

// ---------- medications ----------

const medicationView = (db: DemoDb, med: DemoDb["medications"][number]) => {
  const completedDaysOfWeek = med.completedDates.map((d) => DAY_CODES[parseDay(d).getDay()]);
  return {
    id: med.id,
    medicationName: med.medicationName,
    patientActivityId: med.activityId,
    startDate: med.startDate,
    endDate: med.endDate,
    days: med.days,
    times: med.times.map(clockTo12),
    activityDate: db.activities.find((a) => a.id === med.activityId)?.date || med.startDate,
    completed: med.days.every((d) => completedDaysOfWeek.includes(d)),
    completedDates: med.completedDates,
    completedDaysOfWeek,
  };
};

// ---------- mood and symptoms ----------

const MOOD_LEVELS = ["VERY_LOW", "LOW", "MODERATE", "HIGH", "VERY_HIGH"];

const moodHistory: Handler = (db, _p, req) => {
  const days = parseInt(req.query.days || "7", 10);
  const moodData = lastDays(db, days)
    .filter((a) => a.moodLevel)
    .map((a) => ({
      id: a.id,
      date: a.date,
      day: weekday(a.date),
      moodLevel: a.moodLevel,
      stressLevel: a.stressLevel,
      anxietyLevel: a.anxietyLevel,
      energyLevel: a.energyLevel,
      notes: a.moodNotes,
    }));
  const avg = (key: "stressLevel" | "energyLevel") => {
    const values = moodData.map((m) => m[key]).filter((v): v is number => !!v);
    return values.length ? (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1) : null;
  };
  return ok({
    moodHistory: moodData,
    summary: { totalEntries: moodData.length, averageStress: avg("stressLevel"), averageEnergy: avg("energyLevel") },
  });
};

const logMood: Handler = (db, _p, req) => {
  const { moodLevel, stressLevel, anxietyLevel, energyLevel, moodNotes, notes } = req.body || {};
  if (moodLevel && !MOOD_LEVELS.includes(moodLevel)) {
    return fail(400, "Invalid mood level. Must be one of: " + MOOD_LEVELS.join(", "));
  }
  const a = activityFor(db, targetDay(req.body));
  if (moodLevel !== undefined) a.moodLevel = moodLevel;
  if (stressLevel !== undefined) a.stressLevel = stressLevel;
  if (anxietyLevel !== undefined) a.anxietyLevel = anxietyLevel;
  if (energyLevel !== undefined) a.energyLevel = energyLevel;
  if (moodNotes !== undefined || notes !== undefined) a.moodNotes = moodNotes ?? notes;
  return ok({
    success: true,
    message: "Mood logged successfully",
    data: {
      moodLevel: a.moodLevel,
      stressLevel: a.stressLevel,
      anxietyLevel: a.anxietyLevel,
      energyLevel: a.energyLevel,
      moodNotes: a.moodNotes,
      date: a.date,
    },
  });
};

const updateMood: Handler = (db, p, req) => {
  const a = db.activities.find((x) => x.id === p.activityId);
  if (!a) return fail(404, "Mood entry not found");
  const { moodLevel, stressLevel, energyLevel, anxietyLevel } = req.body || {};
  if (moodLevel !== undefined) a.moodLevel = moodLevel;
  if (stressLevel !== undefined) a.stressLevel = stressLevel;
  if (energyLevel !== undefined) a.energyLevel = energyLevel;
  if (anxietyLevel !== undefined) a.anxietyLevel = anxietyLevel;
  return ok({
    success: true,
    message: "Mood updated successfully",
    data: { id: a.id, moodLevel: a.moodLevel, stressLevel: a.stressLevel, energyLevel: a.energyLevel, date: a.date },
  });
};

const deleteMood: Handler = (db, p) => {
  const a = db.activities.find((x) => x.id === p.activityId);
  if (!a) return fail(404, "Mood entry not found");
  a.moodLevel = a.moodNotes = null;
  a.stressLevel = a.anxietyLevel = a.energyLevel = null;
  return ok({ success: true, message: "Mood deleted successfully" });
};

// ---------- vitals ----------

const logHeart: Handler = (db, _p, req) => {
  const heartRate = Number(req.body?.heartRate ?? req.body?.heart_rate);
  if (!heartRate) return fail(400, "Heart rate is required");
  const a = activityFor(db, targetDay(req.body));
  a.heart_rate = heartRate;
  return ok({
    success: true,
    message: "Heart rate logged successfully",
    heartRate,
    activityId: a.id,
    date: parseDay(a.date).toISOString(),
  });
};

const logBloodPressure: Handler = (db, _p, req) => {
  const systolic = parseInt(req.body?.systolic, 10);
  const diastolic = parseInt(req.body?.diastolic, 10);
  if (!systolic || !diastolic) return fail(400, "Systolic and diastolic values are required");
  const a = activityFor(db, targetDay(req.body));
  a.bloodPressureSystolic = systolic;
  a.bloodPressureDiastolic = diastolic;
  return ok({ success: true, systolic, diastolic, unit: "mmHg", date: a.date });
};

const bloodPressureStatus: Handler = (db) => {
  const withBp = db.activities.filter((a) => a.bloodPressureSystolic != null && a.bloodPressureDiastolic != null);
  const last = withBp[withBp.length - 1];
  const today = withBp.find((a) => a.date === todayKey());
  const bp = (a?: Activity) =>
    a ? { systolic: a.bloodPressureSystolic, diastolic: a.bloodPressureDiastolic, unit: "mmHg" } : null;
  return ok({
    success: true,
    data: {
      lastBloodPressure: bp(last),
      todayBloodPressure: bp(today),
      bloodPressureData: lastDays(db, 7)
        .filter((a) => a.bloodPressureSystolic != null)
        .map((a) => ({
          date: a.date,
          day: weekday(a.date),
          systolic: a.bloodPressureSystolic,
          diastolic: a.bloodPressureDiastolic,
          unit: "mmHg",
        })),
    },
  });
};

const logGlucose: Handler = (db, _p, req) => {
  const level = parseFloat(req.body?.glucoseLevel);
  if (!level) return fail(400, "Glucose level is required");
  const a = activityFor(db, targetDay(req.body));
  a.glucoseLevel = level;
  a.glucoseUnit = req.body?.glucoseUnit || "mg/dL";
  a.glucoseMealContext = req.body?.glucoseMealContext || null;
  return ok({
    success: true,
    glucoseLevel: a.glucoseLevel,
    glucoseUnit: a.glucoseUnit,
    glucoseMealContext: a.glucoseMealContext,
    date: a.date,
  });
};

const glucoseStatus: Handler = (db) => {
  const withGlucose = db.activities.filter((a) => a.glucoseLevel != null);
  const last = withGlucose[withGlucose.length - 1];
  const today = withGlucose.find((a) => a.date === todayKey());
  return ok({
    success: true,
    data: {
      lastGlucose: last?.glucoseLevel ?? null,
      glucoseUnit: last?.glucoseUnit || "mg/dL",
      glucoseMealContext: last?.glucoseMealContext ?? null,
      todayGlucose: today?.glucoseLevel ?? null,
      todayGlucoseUnit: today?.glucoseUnit || "mg/dL",
      todayGlucoseMealContext: today?.glucoseMealContext ?? null,
      glucoseData: lastDays(db, 7)
        .filter((a) => a.glucoseLevel != null)
        .map((a) => ({
          date: a.date,
          day: weekday(a.date),
          glucoseLevel: a.glucoseLevel,
          glucoseUnit: a.glucoseUnit,
          glucoseMealContext: a.glucoseMealContext,
        })),
    },
  });
};

const stepsResponse = (a: Activity) => ({
  id: a.id,
  date: a.date,
  day: weekday(a.date),
  steps: a.steps,
  stepGoal: a.stepsGoal || 0,
});

const setStepsGoal: Handler = (db, _p, req) => {
  const goal = parseInt(req.body?.stepsGoal ?? req.body?.stepGoal, 10);
  if (!goal) return fail(400, "Invalid steps goal");
  db.patient.stepsGoal = goal;
  const a = activityFor(db, todayKey());
  a.stepsGoal = goal;
  return ok(stepsResponse(a));
};

// ---------- routes ----------

const A = "/user/activity/:id";

const ROUTES: [string, string, Handler][] = [
  // auth.controller.js
  ["POST", "/login", (db, _p, req) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !req.body?.password) return fail(400, "Email and password are required");
    db.patient.email = email;
    return ok({
      message: "Login successful",
      accessToken: DEMO_TOKEN,
      userId: db.patient.id,
      patientId: db.patient.id,
      email: db.patient.email,
      name: db.patient.name,
      profilePicture: db.patient.profileImage,
      doctorId: null,
    });
  }],
  ["POST", "/signup", (db, _p, req) => {
    if (req.body?.name) db.patient.name = req.body.name;
    if (req.body?.email) db.patient.email = String(req.body.email).toLowerCase();
    return ok({ message: "Verification code sent to your email. Please verify to complete registration.", email: db.patient.email });
  }],
  // Any 6-digit code works in demo mode
  ["POST", "/verify-email", (db) =>
    ok({ message: "Email verified successfully! You can now login.", patientId: db.patient.id, name: db.patient.name, email: db.patient.email })],
  ["POST", "/resend-verification", (db, _p, req) =>
    ok({ message: "New verification code sent to your email", email: req.body?.email || db.patient.email })],
  ["POST", "/forgot-password", (db, _p, req) =>
    ok({ message: "Password reset OTP sent to your email", email: req.body?.email || db.patient.email })],
  ["POST", "/reset-password", () => ok({ message: "Password has been reset successfully" })],

  // user.controller.js
  ["GET", "/user/:id/profile", (db) => {
    const progress = pregnancyProgress(db);
    const { waterGoal, calorieGoal, stepsGoal, ...patient } = db.patient;
    return ok({
      ...patient,
      activities: db.activities.map((a) => activityRecord(db, a)),
      questionnaires: [],
      questionResponses: db.questionResponses,
      week: progress.currentWeek,
      day: progress.currentDay,
      pregnancyData: progress.pregnancyData,
    });
  }],
  ["PUT", "/user/:id/profile", (db, _p, req) => {
    const { name, email, phoneNumber, age, week } = req.body || {};
    if (week !== undefined) {
      const n = parseInt(week, 10);
      if (isNaN(n) || n < 1 || n > 42) return fail(400, "Pregnancy week must be a number between 1 and 42");
      db.patient.week = n;
      db.patient.day = 0;
      db.patient.updatedAt = new Date().toISOString();
    }
    if (name !== undefined) db.patient.name = name;
    if (email !== undefined) db.patient.email = email;
    if (phoneNumber !== undefined) db.patient.phoneNumber = phoneNumber;
    if (age !== undefined) db.patient.age = parseInt(age, 10);
    return ok({ success: true, message: "Profile updated successfully", data: db.patient });
  }],
  ["POST", "/user/:id/profile/image", (db, _p, req) => {
    const fields = formFields(req.body);
    const uri = fileUri(fields.imageUrl ?? fields.profileImage ?? fields.image);
    if (!uri) return fail(400, "No file uploaded");
    db.patient.profileImage = uri;
    return ok({ message: "Profile image uploaded successfully", imageUrl: uri });
  }],
  ["GET", "/user/:id/pregnancy-week", (db) =>
    ok({ success: true, data: { id: db.patient.id, name: db.patient.name, week: db.patient.week, day: db.patient.day } })],
  ["PUT", "/user/:id/pregnancy-week", (db, _p, req) => {
    db.patient.week = parseInt(req.body?.week, 10) || db.patient.week;
    db.patient.day = parseInt(req.body?.day, 10) || 0;
    db.patient.updatedAt = new Date().toISOString();
    const progress = pregnancyProgress(db);
    return ok({
      success: true,
      message: "Pregnancy information updated successfully",
      data: { id: db.patient.id, name: db.patient.name, week: progress.currentWeek, day: progress.currentDay, pregnancyData: progress.pregnancyData },
    });
  }],
  ["POST", "/user/:id/avatar", (db, _p, req) => {
    const fields = formFields(req.body);
    const uri = fileUri(fields.avatar ?? fields.avatarUrl ?? fields.imageUrl ?? fields.image);
    if (uri) db.patient.avatarUrl = uri;
    return ok({ success: true, message: "Avatar uploaded successfully", data: { avatarUrl: db.patient.avatarUrl } });
  }],
  ["DELETE", "/user/:id/delete-account", () => {
    resetDemoDb();
    return ok({ success: true, message: "Account deleted successfully" });
  }],

  // avatar.controller.js (the Avatar Studio keeps its choices on the device)
  ["GET", "/user/:id/hairstyles", () => ok({ data: [] })],
  ["GET", "/user/:id/outfits", () => ok({ data: [] })],
  ["POST", "/user/:id/unlock", () => ok({ message: "Item unlocked successfully" })],
  ["GET", "/avatarcombination", () => ok({ data: null })],
  ["GET", "/avatarcombinations", () => ok({ data: [] })],
  ["GET", "/avatarface", () => ok({ data: null })],

  // questionarie.controller.js
  ["POST", "/user/:id/domain", (db, _p, req) => {
    const entries = Array.isArray(req.body) ? req.body : [req.body];
    db.questionResponses.push(...entries.map((e) => ({ ...e, id: newId("resp"), createdAt: new Date().toISOString() })));
    return ok({ success: true, message: "All responses processed successfully", data: entries });
  }],
  ["GET", "/user/:id/responses", (db) => ok({ success: true, count: db.questionResponses.length, data: db.questionResponses })],

  // engagement.controller.js
  ["POST", "/user/:id/ai-engagement", (db, _p, req) => {
    const engagement = { ...req.body, id: newId("eng"), createdAt: new Date().toISOString() };
    db.engagements.push(engagement);
    return ok({ success: true, data: engagement }, 201);
  }],
  ["GET", "/user/:id/ai-engagement", (db) => ok({
    success: true,
    data: {
      summary: { totalSessions: db.engagements.length, totalDurationMinutes: 0, totalMessages: 0, avgDurationMinutes: 0 },
      sessions: db.engagements,
    },
  })],

  // badge.controller.js
  ["POST", "/user/:id/badges/award", (db, _p, req) => {
    const { badge, isNew } = awardBadge(db, req.body?.badgeType);
    const view = badgeList(db).find((b) => b.id === badge.id);
    return isNew
      ? ok({ success: true, message: "Badge awarded successfully", badge: view?.badge, awarded: view }, 201)
      : ok({ success: true, message: "Badge already awarded", badge: view?.badge });
  }],
  ["GET", "/user/habit/:id", () => ok([])],
  ["GET", "/user/:id", (db) => ok(badgeList(db))],

  // activity.controller.js: history and goals
  ["GET", A, (db) => ok({
    activities: db.activities.map((a) => ({
      date: a.date,
      details: {
        water: a.water,
        waterGoal: a.waterGoal || 0,
        heart: a.heart_rate || 0,
        bloodPressure: { systolic: a.bloodPressureSystolic, diastolic: a.bloodPressureDiastolic, unit: "mmHg" },
        glucose: { value: a.glucoseLevel || 0, unit: a.glucoseUnit || "mg/dL", mealContext: a.glucoseMealContext },
        sleep: { start: a.sleepStart, end: a.sleepEnd },
        steps: a.steps,
        stepsGoal: a.stepsGoal || 0,
        weight: { value: a.weight || 0, unit: a.weight_unit || "kg" },
      },
    })),
    badges: badgeList(db),
    newBadge: null,
    badgeProgress: { hotMama: null, healthQueen: null },
  })],
  ["GET", `${A}/goals`, (db) => {
    const a = activityFor(db, todayKey());
    return ok({ calorieGoal: a.calorieGoal, waterGoal: a.waterGoal, stepsGoal: a.stepsGoal });
  }],

  // water
  ["POST", `${A}/water`, (db, _p, req) => {
    const water = Number(req.body?.water);
    if (isNaN(water)) return fail(400, "Invalid water value. Must be a number.");
    const a = activityFor(db, targetDay(req.body));
    a.water = req.body?.isIncrement ? a.water + water : water;
    return ok({
      updatedActivity: activityRecord(db, a),
      waterLogs: [],
      badges: badgeList(db),
      newBadges: { firstLog: null, streak: null },
      streakProgress: null,
    });
  }],
  ["POST", `${A}/waterGoal`, (db, _p, req) => {
    const goal = parseInt(req.body?.waterGoal, 10);
    if (!goal) return fail(400, "Invalid water goal");
    db.patient.waterGoal = goal;
    const a = activityFor(db, todayKey());
    a.waterGoal = goal;
    return ok(activityRecord(db, a));
  }],
  ["GET", `${A}/waterstatus`, (db) => ok({
    waterData: lastDays(db, 7).map((a) => ({
      id: a.id,
      date: a.date,
      day: weekday(a.date),
      waterMl: a.water,
      goalMl: a.waterGoal,
      goalMet: !!a.waterGoal && a.water >= a.waterGoal,
    })),
    waterWizardStatus: { hasWeeklyBadge: db.badges.some((b) => b.type.startsWith("WATER_WIZARD")), currentProgress: null },
  })],

  // weight
  ["POST", `${A}/weight`, (db, _p, req) => {
    const weight = parseFloat(req.body?.weight);
    if (!weight) return fail(400, "Invalid weight value");
    const a = activityFor(db, targetDay(req.body));
    a.weight = weight;
    a.weight_unit = req.body?.weight_unit || "kg";
    return ok({ success: true, weight: a.weight, weight_unit: a.weight_unit, date: a.date });
  }],
  ["GET", `${A}/weightstatus`, (db) => {
    const recent = lastDays(db, 7);
    let last: number | null = null;
    let unit = "kg";
    const weightData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const a = recent.find((x) => x.date === key);
      if (a?.weight != null) {
        last = a.weight;
        unit = a.weight_unit || "kg";
      }
      weightData.push({ day: weekday(key), date: key, weight: last ?? 0, weight_unit: unit });
    }
    return ok({ success: true, data: { lastWeight: last, weightData } });
  }],

  // steps
  ["POST", `${A}/steps`, (db, _p, req) => {
    const steps = parseInt(req.body?.steps, 10);
    if (isNaN(steps)) return fail(400, "Invalid steps value");
    const a = activityFor(db, targetDay(req.body));
    a.steps = steps;
    return ok(stepsResponse(a));
  }],
  ["POST", `${A}/stepsGoal`, setStepsGoal],
  // Backend gap: the Apple Health store reads the goal back with GET
  ["GET", `${A}/stepsGoal`, (db) => ok({ stepsGoal: activityFor(db, todayKey()).stepsGoal })],
  ["GET", `${A}/stepsStatus`, (db) => ok({
    stepsData: [...lastDays(db, 7)].reverse().map((a) => ({
      id: a.id,
      date: a.date,
      day: weekday(a.date),
      steps: a.steps || 0,
      stepsGoal: a.stepsGoal || 0,
      goalMet: !!a.stepsGoal && a.steps >= a.stepsGoal,
    })),
    badges: badgeList(db),
    newBadge: null,
    badgeProgress: null,
  })],

  // sleep
  ["POST", `${A}/sleep`, (db, _p, req) => {
    const key = targetDay(req.body);
    const start = parseClock(req.body?.sleepStart);
    const end = parseClock(req.body?.sleepEnd);
    if (!start || !end) return fail(400, "Invalid time format");
    const startDate = parseDay(key);
    startDate.setHours(start.hours, start.minutes, 0, 0);
    const endDate = parseDay(key);
    endDate.setHours(end.hours, end.minutes, 0, 0);
    if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
    const a = activityFor(db, key);
    a.sleepStart = startDate.toISOString();
    a.sleepEnd = endDate.toISOString();
    return ok({
      id: a.id,
      date: a.date,
      sleepStart: time12(startDate),
      sleepEnd: time12(endDate),
      duration: duration(a.sleepStart, a.sleepEnd),
      newBadges: { restedDiva: null, sleepWizard: null },
    });
  }],
  ["GET", `${A}/sleepstatus`, (db) => ok({
    sleepData: [...db.activities]
      .reverse()
      .filter((a) => a.sleepStart || a.sleepEnd)
      .map((a) => ({
        id: a.id,
        day: weekday(a.date),
        date: a.date,
        sleepStart: a.sleepStart ? time12(new Date(a.sleepStart)) : null,
        sleepEnd: a.sleepEnd ? time12(new Date(a.sleepEnd)) : null,
        duration: duration(a.sleepStart, a.sleepEnd),
      })),
    newBadge: null,
  })],
  ["DELETE", `${A}/sleepstatus/delete/:activityId`, (db, p) => {
    const a = db.activities.find((x) => x.id === p.activityId);
    if (!a) return fail(404, "Sleep data not found.");
    a.sleepStart = a.sleepEnd = null;
    return ok({ message: "Sleep data removed successfully.", data: activityRecord(db, a) });
  }],

  // heart rate, blood pressure, glucose
  ["POST", `${A}/heart`, logHeart],
  // Backend gap: the Apple Health store posts to /heartrate, which the API does not have
  ["POST", `${A}/heartrate`, logHeart],
  ["GET", `${A}/heartstatus`, (db) => {
    const a = [...db.activities].reverse().find((x) => x.heart_rate != null);
    if (!a) return fail(404, "Activity not found");
    return ok({ id: a.id, date: a.date, day: weekday(a.date), heartRate: a.heart_rate });
  }],
  ["POST", `${A}/bp`, logBloodPressure],
  ["POST", `${A}/bloodpressure`, logBloodPressure],
  ["GET", `${A}/bpstatus`, bloodPressureStatus],
  ["GET", `${A}/bloodpressurestatus`, bloodPressureStatus],
  ["POST", `${A}/glucose`, logGlucose],
  ["GET", `${A}/glucosestatus`, glucoseStatus],

  // notes
  ["POST", `${A}/note`, (db, p, req) => {
    const now = new Date().toISOString();
    const note = { id: newId("note"), title: req.body?.title || "Untitled", description: req.body?.description || "", createdAt: now, updatedAt: now };
    db.notes.push(note);
    const { isNew } = awardBadge(db, "HEART_SCRIBE");
    return ok({
      success: true,
      message: "Note created successfully",
      data: { ...note, patientId: p.id, formattedDate: dateTimeUS(note.createdAt) },
      badge: isNew ? badgeList(db).find((b) => b.badge.type === "HEART_SCRIBE") : null,
    }, 201);
  }],
  ["GET", `${A}/notes`, (db) => ok({
    success: true,
    data: sections(
      byNewest(db.notes).map((n) => ({
        id: n.id,
        title: n.title || "Untitled",
        description: n.description.length > 30 ? n.description.substring(0, 30) + " ..." : n.description,
        date: dateTimeUS(n.createdAt),
        createdAt: n.createdAt,
      })),
      (n) => n.createdAt,
      false
    ),
    currentTime: new Date().toISOString(),
  })],
  // Backend gap: there is no GET for a single note; the full text only exists on the device here
  ["GET", `${A}/note/:noteId`, (db, p) => {
    const note = db.notes.find((n) => n.id === p.noteId);
    return note ? ok({ success: true, data: { ...note, formattedDate: dateTimeUS(note.createdAt) } }) : fail(404, "Note not found");
  }],
  ["PUT", `${A}/note/:noteId`, (db, p, req) => {
    const note = db.notes.find((n) => n.id === p.noteId);
    if (!note) return fail(404, "Note not found");
    if (req.body?.title !== undefined) note.title = req.body.title;
    if (req.body?.description !== undefined) note.description = req.body.description;
    note.updatedAt = new Date().toISOString();
    return ok({ success: true, message: "Note updated successfully", data: { ...note, patientId: p.id, formattedDate: dateTimeUS(note.createdAt) } });
  }],
  ["DELETE", `${A}/note/:noteId`, (db, p) => {
    db.notes = db.notes.filter((n) => n.id !== p.noteId);
    return ok({ success: true, message: "Note deleted successfully" });
  }],

  // photo journal (WombPicture)
  ["POST", `${A}/journal/upload`, (db, _p, req) => {
    const fields = formFields(req.body);
    const now = new Date().toISOString();
    const entry = { id: newId("photo"), title: fields.title || " ", imageUrl: fileUri(fields.imageUrl), createdAt: now, updatedAt: now };
    db.journal.push(entry);
    awardBadge(db, "SNAPSHOT");
    return ok({
      success: true,
      message: "Journal entry created successfully",
      data: { id: entry.id, title: entry.title, imageUrl: entry.imageUrl, createdAt: dateTimeJournal(now) },
      badges: badgeList(db),
      newBadge: null,
    }, 201);
  }],
  ["GET", `${A}/journal`, (db) => ok({
    success: true,
    data: sections(
      byNewest(db.journal).map((e) => ({ id: e.id, title: e.title, imageUrl: e.imageUrl, date: dateTimeJournal(e.createdAt), createdAt: e.createdAt })),
      (e) => e.createdAt,
      true
    ),
  })],
  ["GET", `${A}/journal/:entryId`, (db, p) => {
    const e = db.journal.find((x) => x.id === p.entryId);
    return e
      ? ok({ success: true, data: { id: e.id, title: e.title, imageUrl: e.imageUrl, createdAt: dateTimeJournal(e.createdAt) } })
      : fail(404, "Journal entry not found");
  }],
  ["PUT", `${A}/journal/:entryId`, (db, p, req) => {
    const e = db.journal.find((x) => x.id === p.entryId);
    if (!e) return fail(404, "Journal entry not found");
    const fields = formFields(req.body);
    if (fields.title !== undefined) e.title = fields.title;
    const uri = fileUri(fields.imageUrl);
    if (uri) e.imageUrl = uri;
    e.updatedAt = new Date().toISOString();
    return ok({ success: true, message: "Journal entry updated successfully", data: { ...e, patientActivityId: null } });
  }],
  ["DELETE", `${A}/journal/:entryId`, (db, p) => {
    db.journal = db.journal.filter((e) => e.id !== p.entryId);
    return ok({ success: true, message: "Journal entry deleted successfully" });
  }],

  // medications
  ["POST", `${A}/addMedication`, (db, _p, req) => {
    const { medicationName, startDate, endDate, days, times } = req.body || {};
    if (!medicationName || !startDate || !days?.length || !times?.length) {
      return ok({ success: false, error: "Missing required medication information" }, 400);
    }
    const med = {
      id: newId("med"),
      medicationName,
      startDate: dayKey(new Date(startDate)),
      endDate: endDate ? dayKey(new Date(endDate)) : null,
      days,
      times,
      completedDates: [],
      activityId: activityFor(db, todayKey()).id,
    };
    db.medications.push(med);
    return ok({ success: true, message: "Medication added successfully", data: medicationView(db, med) }, 201);
  }],
  ["GET", `${A}/getMedication`, (db) => {
    const all = db.medications.map((m) => medicationView(db, m));
    const today = todayKey();
    return ok({
      success: true,
      data: all.filter((m) => !m.endDate || m.endDate >= today),
      past: all.filter((m) => m.endDate && m.endDate < today),
    });
  }],
  ["PATCH", "/user/activity/:id/updateStatus/:medicationId/completed", (db, p, req) => {
    const med = db.medications.find((m) => m.id === p.medicationId);
    if (!med) return fail(404, "Medication not found.");
    if (req.body?.completed === undefined) return fail(400, "Completed status is required.");
    if (!req.body?.date) return fail(400, "Completion date is required.");
    const key = targetDay({ date: req.body.date });
    med.completedDates = med.completedDates.filter((d) => d !== key);
    if (req.body.completed) med.completedDates.push(key);
    return ok({
      success: true,
      message: `Medication ${req.body.completed ? "marked as completed" : "marked as incomplete"} for ${DAY_CODES[parseDay(key).getDay()]} on ${key}.`,
      data: med,
    });
  }],

  // food
  ["POST", `${A}/caloriesGoal`, (db, _p, req) => {
    const goal = parseInt(req.body?.calorieGoal, 10);
    if (!goal) return fail(400, "Invalid calorie goal");
    db.patient.calorieGoal = goal;
    const a = activityFor(db, targetDay(req.body));
    a.calorieGoal = goal;
    return ok({ success: true, calorieGoal: goal, date: a.date });
  }],
  ["POST", `${A}/foodItem`, (db, _p, req) => {
    const { mealType, name, portion, calories, classification = "GOOD", quantity = 1 } = req.body || {};
    const a = activityFor(db, targetDay(req.body));
    const type = String(mealType || "BREAKFAST").toUpperCase();
    let meal = db.meals.find((m) => m.activityId === a.id && m.mealType === type);
    if (!meal) {
      meal = { id: newId("meal"), activityId: a.id, mealType: type, foodItems: [] };
      db.meals.push(meal);
    }
    const qty = parseInt(quantity, 10) || 1;
    const cal = parseInt(calories, 10) || 0;
    let item = meal.foodItems.find((f) => f.name === name && f.portion === portion && f.classification === classification);
    if (item) item.quantity += qty;
    else {
      item = { id: newId("food"), name, portion, quantity: qty, calories: cal, classification };
      meal.foodItems.push(item);
    }
    applyFood(a, cal, qty, classification, 1);
    return ok({ success: true, foodItem: { ...item, dailyMealId: meal.id }, mealId: meal.id, dailyProgress: dailyProgress(a) });
  }],
  ["GET", `${A}/foodItem`, (db, _p, req) => {
    const a = activityFor(db, req.query.date ? targetDay({ date: req.query.date }) : todayKey());
    const grouped: Record<string, any[]> = { BREAKFAST: [], LUNCH: [], DINNER: [], SNACK: [] };
    for (const meal of db.meals.filter((m) => m.activityId === a.id)) {
      const items = meal.foodItems;
      (grouped[meal.mealType] ||= []).push({
        id: meal.id,
        patientActivityId: a.id,
        mealType: meal.mealType,
        totalCalories: items.reduce((s, f) => s + f.calories * f.quantity, 0),
        foodItemsCount: items.reduce((s, f) => s + f.quantity, 0),
        foodItems: items,
      });
    }
    return ok({ success: true, ...dailyProgress(a), meals: grouped });
  }],
  ["GET", `${A}/calorieHistory`, (db, _p, req) => {
    const range = req.query.timeRange || "week";
    const now = new Date();
    let start: Date;
    let end: Date;
    if (range === "today") {
      start = end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (range === "lastMonth") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      end = now;
    }
    const chartData = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = dayKey(d);
      const a = db.activities.find((x) => x.date === key);
      chartData.push({ date: key, calories: a?.caloriesConsumed || 0, day: weekday(key).charAt(0) });
    }
    return ok({ success: true, timeRange: range, chartData, totalDays: chartData.length });
  }],
  ["DELETE", "/user/:userId/meals/:mealId/fooditems/:foodItemId", (db, p) => {
    const found = findFood(db, p.foodItemId);
    if (!found || !found.activity) return fail(404, "Food item not found");
    found.meal.foodItems = found.meal.foodItems.filter((f) => f.id !== p.foodItemId);
    applyFood(found.activity, found.item.calories, found.item.quantity, found.item.classification, -1);
    return ok({ success: true, message: "Food item deleted successfully", dailyProgress: dailyProgress(found.activity) });
  }],
  ["PUT", "/user/:userId/meals/:mealId/fooditems/:foodItemId/quantity", (db, p, req) => {
    const found = findFood(db, p.foodItemId);
    const quantity = parseInt(req.body?.quantity, 10);
    if (!found || !found.activity) return fail(404, "Food item not found");
    if (!quantity || quantity < 1) return fail(400, "Invalid quantity");
    applyFood(found.activity, found.item.calories, quantity - found.item.quantity, found.item.classification, 1);
    found.item.quantity = quantity;
    return ok({ success: true, foodItem: found.item, dailyProgress: dailyProgress(found.activity) });
  }],

  // appointments
  ["POST", `${A}/appointment`, (db, p, req) => {
    const { title, appointmentDate } = req.body || {};
    if (!title || !appointmentDate) return fail(400, "Title and appointment date are required");
    const appointment = { id: newId("appt"), title, appointmentDate: new Date(appointmentDate).toISOString() };
    db.appointments.push(appointment);
    return ok({ success: true, message: "Appointment created successfully", data: { ...appointment, patientId: p.id } }, 201);
  }],
  ["GET", `${A}/appointments`, (db) => ok(
    [...db.appointments]
      .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))
      .map((a) => ({ id: a.id, title: a.title, date: a.appointmentDate }))
  )],
  ["PUT", `${A}/appointments/:appointmentId`, (db, p, req) => {
    const appt = db.appointments.find((a) => a.id === p.appointmentId);
    if (!appt) return fail(404, "Appointment not found");
    if (req.body?.title) appt.title = req.body.title;
    if (req.body?.appointmentDate) appt.appointmentDate = new Date(req.body.appointmentDate).toISOString();
    return ok({ success: true, message: "Appointment updated successfully", data: { ...appt, patientId: p.id } });
  }],
  ["DELETE", `${A}/appointments/:appointmentId`, (db, p) => {
    db.appointments = db.appointments.filter((a) => a.id !== p.appointmentId);
    return ok({ success: true, message: "Appointment deleted successfully" });
  }],

  // mood (both prefixes exist on the API)
  ["POST", `${A}/mood`, logMood],
  ["GET", `${A}/mood`, moodHistory],
  ["PUT", `${A}/mood/:activityId`, updateMood],
  ["DELETE", `${A}/mood/:activityId`, deleteMood],
  ["POST", "/user/metrics/:id/mood", logMood],
  ["GET", "/user/metrics/:id/mood", moodHistory],
  ["PUT", "/user/metrics/:id/mood/:activityId", updateMood],
  ["DELETE", "/user/metrics/:id/mood/:activityId", deleteMood],

  // symptoms
  ["POST", "/user/metrics/:id/symptom", (db, _p, req) => {
    const { symptomType, severity = "MILD", bodyLocation = null, duration = null, notes = null } = req.body || {};
    if (!symptomType) return fail(400, "Symptom type is required");
    const a = activityFor(db, targetDay(req.body));
    const symptom = {
      id: newId("sym"),
      activityId: a.id,
      symptomType,
      severity,
      bodyLocation,
      duration,
      notes,
      occurredAt: req.body?.date ? new Date(req.body.date).toISOString() : new Date().toISOString(),
    };
    db.symptoms.push(symptom);
    const { activityId, ...view } = symptom;
    return ok({ success: true, message: "Symptom logged successfully", symptom: view }, 201);
  }],
  ["GET", "/user/metrics/:id/symptoms", (db, _p, req) => {
    const recent = lastDays(db, parseInt(req.query.days || "7", 10));
    const symptoms = recent
      .slice()
      .reverse()
      .flatMap((a) =>
        db.symptoms
          .filter((s) => s.activityId === a.id)
          .sort((x, y) => y.occurredAt.localeCompare(x.occurredAt))
          .map(({ activityId, ...s }) => ({ ...s, date: a.date }))
      );
    const symptomCounts = symptoms.reduce<Record<string, number>>((acc, s) => {
      acc[s.symptomType] = (acc[s.symptomType] || 0) + 1;
      return acc;
    }, {});
    return ok({
      symptoms,
      summary: {
        totalSymptoms: symptoms.length,
        symptomCounts,
        mostCommon: Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      },
    });
  }],
  ["DELETE", "/user/metrics/:id/symptom/:symptomId", (db, p) => {
    db.symptoms = db.symptoms.filter((s) => s.id !== p.symptomId);
    return ok({ success: true, message: "Symptom deleted successfully" });
  }],

  // Backend gap: self-care categories are commented out in selfcare.route.js
  ["GET", "/categories/:id", () => ok({ content: [] })],
];

// RAG service (CrossCare-rag): POST /chat/:userId
const RAG_ROUTES: [string, string, Handler][] = [
  ["POST", "/chat/:userId", (db, _p, req) =>
    ok({ success: true, response: ragReply(req.body?.query || "", req.body?.currentLanguage, db.questionResponses) })],
];

const compile = (routes: [string, string, Handler][]) =>
  routes.map(([method, pattern, handler]) => {
    const keys: string[] = [];
    const regex = new RegExp(
      "^" + pattern.replace(/:(\w+)/g, (_m, key) => (keys.push(key), "([^/]+)")) + "/?$"
    );
    return { method, regex, keys, handler };
  });

const API = compile(ROUTES);
const RAG = compile(RAG_ROUTES);

export const handleMockRequest = (
  db: DemoDb,
  service: "api" | "rag",
  req: MockRequest
): MockResponse | null => {
  for (const route of service === "api" ? API : RAG) {
    if (route.method !== req.method) continue;
    const match = req.path.match(route.regex);
    if (!match) continue;
    const params: Record<string, string> = {};
    route.keys.forEach((key, i) => {
      // Later keys win, as in Express (/updateStatus/:id/completed reuses :id)
      params[key] = decodeURIComponent(match[i + 1]);
    });
    return route.handler(db, params, req);
  }
  return null;
};
