import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { avatarImage, useAvatarStudio } from "@/zustandStore/avatarStudioStore";

// The Concierge's default name and face. The look picked in the customize screen replaces the face, and the
// user can rename her; the catalog names (Sofia, Amara...) are only labels of the looks, never her name.
export const GUIDE = { name: "CrossCare Concierge", portrait: require("@/assets/images/concierge/sofia.jpg") };

const NAME_KEY = "concierge.name";

// The guide with the name the user gave her (prototype /guide-setup/ "Name her"). Re-read on focus.
export const useGuide = () => {
  const [custom, setCustom] = useState("");
  const choice = useAvatarStudio((s) => s.choice);
  const loaded = useAvatarStudio((s) => s.loaded);
  const load = useAvatarStudio((s) => s.load);
  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(NAME_KEY)
        .then((v) => setCustom(v?.trim() || ""))
        .catch(() => {});
    }, [])
  );
  // The chosen look's portrait until the choice loads (then the original one). A name the user gave wins.
  const picked = loaded && avatarImage(choice);
  return { name: custom || GUIDE.name, portrait: picked || GUIDE.portrait };
};

// The name the user gave the guide, or "" when she keeps the default one.
export const loadGuideName = async () => {
  try {
    return (await AsyncStorage.getItem(NAME_KEY))?.trim() || "";
  } catch {
    return "";
  }
};

// An empty name, or the default one, means "no custom name".
export const saveGuideName = async (name: string) => {
  const clean = name.trim();
  try {
    if (!clean || clean === GUIDE.name) await AsyncStorage.removeItem(NAME_KEY);
    else await AsyncStorage.setItem(NAME_KEY, clean);
  } catch {
    // Not remembering the name is harmless: she keeps the default one.
  }
};
