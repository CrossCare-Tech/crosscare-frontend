import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AVATAR_GUIDES, AVATAR_OUTFITS, AVATAR_TONES } from "@/constants/avatarCatalog";
import { avatarUrl } from "@/constants/avatarImages";

// The avatar the user picked in Avatar Selection: guide + skin tone + hairstyle + outfit (the bundled avatar pack).
export interface AvatarChoice {
  guide: string;
  tone: number;
  hair: number;
  outfit: number;
}

// Hairstyle 9 (Long waves) is one of the free ones
export const DEFAULT_AVATAR: AvatarChoice = { guide: "sofia", tone: 2, hair: 9, outfit: 1 };

const KEY = "avatar.studio";

export const avatarImage = (c: AvatarChoice) => ({ uri: avatarUrl(`${c.guide}/h${c.hair}-o${c.outfit}-t${c.tone}`) });

// A look exists when its guide, hairstyle, outfit and tone are all in the catalog.
const isValid = (c: AvatarChoice) =>
  AVATAR_GUIDES.some((g) => g.id === c.guide && g.hairstyles.some((h) => h.id === c.hair)) &&
  AVATAR_OUTFITS.some((o) => o.id === c.outfit) &&
  AVATAR_TONES.some((t) => t.id === c.tone);

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
      // Ignore a stale choice that no longer maps to a look in the catalog.
      if (saved && isValid(saved)) set({ choice: saved });
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
