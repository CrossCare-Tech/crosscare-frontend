import * as FileSystem from "expo-file-system";
import { Image } from "react-native";

// On-device stand-in for the CrossCare database, shaped like the Prisma models in crosscare-backend.
// It starts with two weeks of sample data and keeps whatever is added during a demo.

export const DEMO_USER_ID = "demo-patient";
export const DEMO_TOKEN = "demo-token";

const DB_FILE = `${FileSystem.documentDirectory}demo-db.json`;
const DB_VERSION = 1;

export type Activity = {
  id: string;
  date: string; // local day, YYYY-MM-DD
  water: number;
  waterGoal: number | null;
  steps: number;
  stepsGoal: number | null;
  weight: number | null;
  weight_unit: string | null;
  sleepStart: string | null; // ISO
  sleepEnd: string | null; // ISO
  heart_rate: number | null;
  calorieGoal: number | null;
  caloriesConsumed: number;
  goodFoodCount: number;
  badFoodCount: number;
  moodLevel: string | null;
  stressLevel: number | null;
  anxietyLevel: number | null;
  energyLevel: number | null;
  moodNotes: string | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  glucoseLevel: number | null;
  glucoseUnit: string | null;
  glucoseMealContext: string | null;
};

export type Patient = {
  id: string;
  email: string;
  name: string;
  phoneNumber: string | null;
  age: number | null;
  week: number;
  day: number;
  profileImage: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  waterGoal: number;
  calorieGoal: number;
  stepsGoal: number | null;
};

export type Note = { id: string; title: string; description: string; createdAt: string; updatedAt: string };
export type JournalEntry = { id: string; title: string; imageUrl: string | null; createdAt: string; updatedAt: string };
export type Medication = {
  id: string;
  medicationName: string;
  startDate: string;
  endDate: string | null;
  days: string[];
  times: string[]; // HH:MM, 24 h
  completedDates: string[];
  activityId: string;
};
export type Appointment = { id: string; title: string; appointmentDate: string };
export type Symptom = {
  id: string;
  activityId: string;
  symptomType: string;
  severity: string;
  bodyLocation: string | null;
  duration: number | null;
  notes: string | null;
  occurredAt: string;
};
export type FoodItem = {
  id: string;
  name: string;
  portion: string;
  quantity: number;
  calories: number;
  classification: string;
};
export type Meal = { id: string; activityId: string; mealType: string; foodItems: FoodItem[] };
export type AwardedBadge = { id: string; type: string; awardedAt: string };

export type DemoDb = {
  version: number;
  patient: Patient;
  activities: Activity[];
  notes: Note[];
  journal: JournalEntry[];
  medications: Medication[];
  appointments: Appointment[];
  symptoms: Symptom[];
  meals: Meal[];
  badges: AwardedBadge[];
  questionResponses: any[];
  engagements: any[];
};

let counter = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// "YYYY-MM-DD" is read as a local day (new Date() would read it as UTC midnight)
export const parseDay = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const daysAgo = (days: number, hours = 9, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const emptyActivity = (date: string, patient: Patient): Activity => ({
  id: newId("act"),
  date,
  water: 0,
  waterGoal: patient.waterGoal,
  steps: 0,
  stepsGoal: patient.stepsGoal,
  weight: null,
  weight_unit: null,
  sleepStart: null,
  sleepEnd: null,
  heart_rate: null,
  calorieGoal: patient.calorieGoal,
  caloriesConsumed: 0,
  goodFoodCount: 0,
  badFoodCount: 0,
  moodLevel: null,
  stressLevel: null,
  anxietyLevel: null,
  energyLevel: null,
  moodNotes: null,
  bloodPressureSystolic: null,
  bloodPressureDiastolic: null,
  glucoseLevel: null,
  glucoseUnit: null,
  glucoseMealContext: null,
});

const assetUri = (source: number) => Image.resolveAssetSource(source)?.uri ?? null;

const MOODS = ["HIGH", "MODERATE", "HIGH", "VERY_HIGH", "MODERATE", "LOW", "HIGH"];

const seed = (): DemoDb => {
  const created = daysAgo(60);
  const patient: Patient = {
    id: DEMO_USER_ID,
    email: "demo@crosscare.app",
    name: "Maya Thompson",
    phoneNumber: "(555) 010-2024",
    age: 29,
    week: 24,
    day: 3,
    profileImage: null,
    avatarUrl: null,
    createdAt: created.toISOString(),
    updatedAt: new Date().toISOString(),
    waterGoal: 10,
    calorieGoal: 2200,
    stepsGoal: 8000,
  };

  // Two weeks of readings, oldest first. Today is partly filled so there is room to log more.
  const activities: Activity[] = [];
  for (let i = 13; i >= 0; i--) {
    const isToday = i === 0;
    const activity = emptyActivity(dayKey(daysAgo(i)), patient);
    activity.water = isToday ? 4 : 6 + ((i * 3) % 5);
    activity.steps = isToday ? 3120 : 4200 + ((i * 1370) % 5200);
    activity.weight = Math.round((68.9 - i * 0.06) * 10) / 10;
    activity.weight_unit = "kg";
    activity.heart_rate = 74 + ((i * 7) % 12);
    if (!isToday) {
      const start = daysAgo(i + 1, 22, 15 + ((i * 10) % 40));
      const end = daysAgo(i, 6, 20 + ((i * 13) % 35));
      activity.sleepStart = start.toISOString();
      activity.sleepEnd = end.toISOString();
    }
    if (i % 2 === 0) {
      activity.bloodPressureSystolic = 110 + (i % 4) * 2;
      activity.bloodPressureDiastolic = 70 + (i % 3) * 2;
    }
    if (i % 3 === 0) {
      activity.glucoseLevel = 88 + ((i * 5) % 18);
      activity.glucoseUnit = "mg/dL";
      activity.glucoseMealContext = i % 2 ? "Fasting" : "After meal";
    }
    if (i < 7) {
      activity.moodLevel = MOODS[i];
      activity.stressLevel = 3 + (i % 4);
      activity.anxietyLevel = 2 + (i % 3);
      activity.energyLevel = 5 + (i % 4);
    }
    activities.push(activity);
  }
  const byDaysAgo = (days: number) => activities[13 - days];

  const meals: Meal[] = [];
  const addFood = (activity: Activity, mealType: string, items: Omit<FoodItem, "id">[]) => {
    meals.push({
      id: newId("meal"),
      activityId: activity.id,
      mealType,
      foodItems: items.map((item) => ({ ...item, id: newId("food") })),
    });
    for (const item of items) {
      activity.caloriesConsumed += item.calories * item.quantity;
      if (item.classification === "GOOD") activity.goodFoodCount += item.quantity;
      if (item.classification === "BAD") activity.badFoodCount += item.quantity;
    }
  };
  addFood(byDaysAgo(0), "BREAKFAST", [
    { name: "Oatmeal with berries", portion: "1 bowl", quantity: 1, calories: 320, classification: "GOOD" },
    { name: "Greek yogurt", portion: "1 cup", quantity: 1, calories: 150, classification: "GOOD" },
  ]);
  addFood(byDaysAgo(0), "LUNCH", [
    { name: "Grilled chicken salad", portion: "1 plate", quantity: 1, calories: 450, classification: "GOOD" },
  ]);
  addFood(byDaysAgo(1), "DINNER", [
    { name: "Salmon with rice", portion: "1 plate", quantity: 1, calories: 620, classification: "GOOD" },
    { name: "Chocolate cookie", portion: "1 piece", quantity: 2, calories: 140, classification: "BAD" },
  ]);
  for (let i = 1; i < 14; i++) {
    const activity = byDaysAgo(i);
    if (!activity.caloriesConsumed) activity.caloriesConsumed = 1700 + ((i * 230) % 600);
  }

  const notes: Note[] = [
    {
      title: "Questions for Dr. Lee",
      description: "Ask about the glucose test, sleeping on my left side and which stretches are safe.",
      at: daysAgo(0, 8, 40),
    },
    {
      title: "First real kick!",
      description: "Felt a strong kick after dinner. Sam felt it too.",
      at: daysAgo(3, 21, 5),
    },
    {
      title: "Nursery ideas",
      description: "Soft sage walls, a reading chair by the window, and the crib from Grandma.",
      at: daysAgo(11, 18, 30),
    },
  ].map(({ at, ...note }) => ({ ...note, id: newId("note"), createdAt: at.toISOString(), updatedAt: at.toISOString() }));

  const journal: JournalEntry[] = [
    { title: "24 weeks", source: require("@/assets/images/baby/w24.jpg"), at: daysAgo(0, 10, 15) },
    { title: "22 weeks", source: require("@/assets/images/baby/w22.jpg"), at: daysAgo(14, 11, 0) },
    { title: "20 weeks scan", source: require("@/assets/images/baby/w20.jpg"), at: daysAgo(28, 15, 30) },
  ].map(({ source, at, title }) => ({
    id: newId("photo"),
    title,
    imageUrl: assetUri(source),
    createdAt: at.toISOString(),
    updatedAt: at.toISOString(),
  }));

  const medications: Medication[] = [
    {
      id: newId("med"),
      medicationName: "Prenatal vitamin",
      startDate: dayKey(daysAgo(40)),
      endDate: null,
      days: ["SU", "M", "T", "W", "TH", "F", "SA"],
      times: ["08:00"],
      completedDates: [1, 2, 3, 4].map((i) => dayKey(daysAgo(i))),
      activityId: byDaysAgo(13).id,
    },
    {
      id: newId("med"),
      medicationName: "Iron supplement",
      startDate: dayKey(daysAgo(20)),
      endDate: dayKey(daysAgo(-40)),
      days: ["M", "W", "F"],
      times: ["13:00"],
      completedDates: [],
      activityId: byDaysAgo(13).id,
    },
  ];

  const appointments: Appointment[] = [
    { title: "Anatomy ultrasound", at: daysAgo(9, 10, 30) },
    { title: "Prenatal check-up with Dr. Lee", at: daysAgo(-5, 9, 30) },
    { title: "Glucose screening test", at: daysAgo(-12, 8, 0) },
    { title: "Childbirth class", at: daysAgo(-19, 18, 0) },
  ].map(({ title, at }) => ({ id: newId("appt"), title, appointmentDate: at.toISOString() }));

  const symptoms: Symptom[] = [
    { type: "back_pain", severity: "MODERATE", location: "Lower back", days: 1 },
    { type: "nausea", severity: "MILD", location: null, days: 2 },
    { type: "swelling", severity: "MILD", location: "Ankles", days: 5 },
  ].map(({ type, severity, location, days }) => ({
    id: newId("sym"),
    activityId: byDaysAgo(days).id,
    symptomType: type,
    severity,
    bodyLocation: location,
    duration: 45,
    notes: null,
    occurredAt: daysAgo(days, 16, 0).toISOString(),
  }));

  const badges: AwardedBadge[] = [
    { type: "GETTING_TO_KNOW_YOU", days: 50 },
    { type: "HEART_SCRIBE", days: 30 },
    { type: "SNAPSHOT", days: 28 },
    { type: "HYDRATED_QUEEN", days: 12 },
    { type: "WATER_WIZARD_I", days: 6 },
  ].map(({ type, days }) => ({ id: newId("badge"), type, awardedAt: daysAgo(days).toISOString() }));

  return {
    version: DB_VERSION,
    patient,
    activities,
    notes,
    journal,
    medications,
    appointments,
    symptoms,
    meals,
    badges,
    questionResponses: [],
    engagements: [],
  };
};

let db: DemoDb | null = null;
let loading: Promise<DemoDb> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const getDemoDb = (): Promise<DemoDb> => {
  if (db) return Promise.resolve(db);
  if (!loading) {
    loading = (async () => {
      try {
        const info = await FileSystem.getInfoAsync(DB_FILE);
        if (info.exists) {
          const saved = JSON.parse(await FileSystem.readAsStringAsync(DB_FILE));
          if (saved?.version === DB_VERSION) db = saved;
        }
      } catch (error) {
        console.warn("[demo] Could not read saved demo data, starting fresh:", error);
      }
      if (!db) db = seed();
      return db;
    })();
  }
  return loading;
};

// Writes are batched so a burst of requests (e.g. the Home screen loading) saves once
export const saveDemoDb = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!db) return;
    FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db)).catch((error) =>
      console.warn("[demo] Could not save demo data:", error)
    );
  }, 300);
};

// Puts the sample data back (Settings > Developer > Reset simulated data)
export const resetDemoDb = async () => {
  db = seed();
  loading = Promise.resolve(db);
  await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db)).catch(() => {});
};
