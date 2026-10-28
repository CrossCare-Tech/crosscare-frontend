import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// The Concierge's face until the avatar chosen in Profile is used here (prototype default: Sofia).
export const GUIDE = { name: "Sofia", portrait: require("@/assets/images/concierge/sofia.jpg") };

const NAME_KEY = "concierge.name";

// The guide with the name the user gave her (prototype /guide-setup/ "Name her"). Re-read on focus.
export const useGuide = () => {
  const [name, setName] = useState(GUIDE.name);
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(NAME_KEY)
        .then((v) => setName(v?.trim() || GUIDE.name))
        .catch(() => {});
    }, [])
  );
  return { name, portrait: GUIDE.portrait };
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
