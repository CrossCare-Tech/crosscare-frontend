import Config from "react-native-config";

export const CONFIG = {
  API_BASE_URL:
    Config.API_BASE_URL || "https://crosscare-backends.onrender.com/api",
  GEMINI_KEY: process.env.EXPO_PUBLIC_GEMINI_API || "",
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  DEEPGRAM_API: process.env.EXPO_PUBLIC_DEEPGRAM_API || "",
};

console.log("CONFIG.OPENAI_API_KEY", CONFIG.OPENAI_API_KEY)
console.log("CONFIG.GEMINI_KEY", CONFIG.GEMINI_KEY)
console.log("CONFIG.DEEPGRAM_API", CONFIG.DEEPGRAM_API)
console.log("CONFIG.API_BASE_URL", CONFIG.API_BASE_URL)
