export const CONFIG = {
  RAG_SERVICE_URL: process.env.EXPO_PUBLIC_RAG_SERVICE_URL || "",
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL,
  GEMINI_KEY: process.env.EXPO_PUBLIC_GEMINI_API || "",
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  DEEPGRAM_API: process.env.EXPO_PUBLIC_DEEPGRAM_API || "",
  USDA_API: process.env.EXPO_PUBLIC_USDA_API_KEY || "",
};
