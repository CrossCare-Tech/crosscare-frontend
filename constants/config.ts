import { isDemoMode } from "@/utils/demo/demoMode";

export const CONFIG = {
  RAG_SERVICE_URL: process.env.EXPO_PUBLIC_RAG_SERVICE_URL || "",
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL,
  GEMINI_KEY: process.env.EXPO_PUBLIC_GEMINI_API || "",
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  DEEPGRAM_API: process.env.EXPO_PUBLIC_DEEPGRAM_API || "",
  USDA_API: process.env.EXPO_PUBLIC_USDA_API_KEY || "",
  // Lets a vital sign be logged for an earlier date. Keep it off until the API accepts `recorded_at`.
  // Always on in demo mode, where the simulated API stores the date.
  get BACKDATED_READINGS() {
    return process.env.EXPO_PUBLIC_BACKDATED_READINGS === "true" || isDemoMode();
  },
};
