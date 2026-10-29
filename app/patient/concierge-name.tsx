import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ConciergeTopBar from "@/components/ui/ConciergeTopBar";
import { Theme } from "@/constants/theme";
import { saveGuideName, useGuide } from "@/constants/conciergeGuide";

export const CONCIERGE_MET_KEY = "concierge.met";

// Name the guide (prototype /guide-setup/ step 4). After this the user has met her:
// the history opens under the chat, so the chat's back arrow lands on the conversations.
export default function ConciergeName() {
  const { t } = useTranslation();
  const router = useRouter();
  const guide = useGuide();
  const [value, setValue] = useState("");

  const finish = async (keepDefault: boolean) => {
    await saveGuideName(keepDefault ? "" : value);
    try {
      await AsyncStorage.setItem(CONCIERGE_MET_KEY, "true");
    } catch {
      // Not remembering the intro is harmless: it will show once more.
    }
    router.replace("/patient/concierge-history");
    router.push({ pathname: "/patient/askdoula", params: { from_modal: "true" } });
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <ConciergeTopBar title={t("conciergeName.title")} onBack={() => router.replace("/patient/concierge-meet")} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Image source={guide.portrait} style={styles.hero} accessibilityLabel={guide.name} />
            <Text style={styles.heading} accessibilityRole="header">
              {t("conciergeName.heading")}
            </Text>
            <Text style={styles.lead}>{t("conciergeName.lead", { name: guide.name })}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>{t("conciergeName.label")}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                placeholder={guide.name}
                placeholderTextColor={Theme.colors.placeholder}
                maxLength={20}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => finish(false)}
              />
            </View>
            <Text style={styles.hint}>{t("conciergeName.hint")}</Text>
          </ScrollView>
          <View style={styles.foot}>
            <Pressable onPress={() => finish(false)} accessibilityRole="button" style={styles.primary}>
              <Text style={styles.primaryText}>{t("conciergeName.start")}</Text>
            </Pressable>
            <Pressable onPress={() => finish(true)} accessibilityRole="button" style={styles.text}>
              <Text style={styles.textLabel}>{t("conciergeName.keep", { name: guide.name })}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { alignItems: "center", paddingHorizontal: 24, paddingTop: Theme.spacing.lg, gap: 12 },
  hero: { width: 132, height: 132, borderRadius: 66, borderWidth: 3, borderColor: Theme.colors.surface },
  heading: { fontFamily: Theme.typography.display, fontSize: 24, lineHeight: 30, color: Theme.colors.ink, textAlign: "center" },
  lead: { fontFamily: Theme.typography.body, fontSize: 14, lineHeight: 21, color: Theme.colors.inkSoft, textAlign: "center" },
  field: { alignSelf: "stretch", gap: 6, marginTop: 8 },
  label: { fontFamily: Theme.typography.heading, fontSize: 12, color: Theme.colors.inkSoft },
  input: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.inputBorder,
    backgroundColor: Theme.colors.inputBg,
    paddingHorizontal: 14,
    fontFamily: Theme.typography.body,
    fontSize: 16,
    color: Theme.colors.ink,
  },
  hint: { fontFamily: Theme.typography.caption, fontSize: 12, color: Theme.colors.inkFaint, textAlign: "center" },
  foot: { paddingHorizontal: 24, paddingBottom: Theme.spacing.md, gap: 4 },
  primary: {
    height: 50,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontFamily: Theme.typography.heading, fontSize: 15, color: Theme.colors.surface },
  text: { height: 40, alignItems: "center", justifyContent: "center" },
  textLabel: { fontFamily: Theme.typography.heading, fontSize: 14, color: Theme.colors.magenta },
});
