import type { Tone } from "@/components/vitals/VitalsUI";

// The ranges the app applies to vitals, shared by the metric screens and the Pregnancy Summary.

// Typical resting heart rate (60–100 bpm), the band drawn on the chart
export const TYPICAL_HEART_RATE: [number, number] = [60, 100];

export const getHeartCategory = (bpm: number): { key: string; tone: Tone } => {
  if (bpm < TYPICAL_HEART_RATE[0]) return { key: "low", tone: "warning" };
  if (bpm > TYPICAL_HEART_RATE[1]) return { key: "high", tone: "warning" };
  return { key: "normal", tone: "success" };
};

// Same ranges the app already used. Stage 2 (140/90 or higher) is the pregnancy safe limit,
// shown in yellow with words rather than red (prototype 5.5)
export const getBPCategory = (sys: number, dia: number): { key: string; tone: Tone } => {
  if (sys < 120 && dia < 80) return { key: "normal", tone: "success" };
  if (sys < 130 && dia < 80) return { key: "elevated", tone: "warning" };
  if (sys < 140 && dia < 90) return { key: "high1", tone: "warning" };
  return { key: "high2", tone: "warning" };
};

export const isMmol = (unit: string) => unit?.toLowerCase().includes("mmol");

// Pregnancy glucose targets (ACOG): fasting below 95 mg/dL, after meals below 140 mg/dL.
// Readings that are not marked as fasting use the after-meal target.
export const getGlucoseCategory = (
  level: number,
  unit: string,
  context: string | null
): { key: string; tone: Tone } => {
  const mgdl = isMmol(unit) ? level * 18 : level;
  if (mgdl < 70) return { key: "low", tone: "warning" };
  const limit = context === "Fasting" ? 95 : 140;
  return mgdl < limit ? { key: "normal", tone: "success" } : { key: "elevated", tone: "warning" };
};
