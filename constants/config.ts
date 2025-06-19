import Config from "react-native-config";

export const CONFIG = {
  API_BASE_URL:
    Config.API_BASE_URL || "https://crosscare-backends.onrender.com/api",
  GEMINI_API_KEY: Config.GEMINI_API_KEY || "",
  OPENAI_API_KEY: Config.OPENAI_API_KEY || "",
  DEEPGRAM_API_KEY: Config.DEEPGRAM_API_KEY || "",
};
