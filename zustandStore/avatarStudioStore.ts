import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AVATAR_IMAGES } from "@/constants/avatarImages";

// The avatar the user picked in Avatar Selection: guide + skin tone + hairstyle + outfit (the bundled avatar pack).
export interface AvatarChoice {
  guide: string;
  tone: number;
  hair: number;
  outfit: number;
}

export const DEFAULT_AVATAR: AvatarChoice = { guide: "sofia", tone: 2, hair: 1, outfit: 1 };

const KEY = "avatar.studio";

export const avatarImage = (c: AvatarChoice) => AVATAR_IMAGES[`${c.guide}/h${c.hair}-o${c.outfit}-t${c.tone}`];

interface AvatarStudioState {
  choice: AvatarChoice;
  loaded: boolean;
  load: () => Promise<void>;
  save: (choice: AvatarChoice) => Promise<void>;
}

export const useAvatarStudio = create<AvatarStudioState>((set) => ({
  choice: DEFAULT_AVATAR,
  loaded: false,
  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const saved = raw ? (JSON.parse(raw) as AvatarChoice) : null;
      // Ignore a stale choice that no longer maps to an image in the pack.
      if (saved && avatarImage(saved)) set({ choice: saved });
    } catch {
      // Not remembering the avatar is harmless: the default one is used.
    }
    set({ loaded: true });
  },
  save: async (choice) => {
    set({ choice });
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(choice));
    } catch {
      // The choice still applies for this session.
    }
  },
}));
