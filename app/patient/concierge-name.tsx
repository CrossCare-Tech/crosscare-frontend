import { withPremiumGate } from "@/components/premium/withPremiumGate";
import React, { useRef, useState } from "react";
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
import AvatarImage from "@/components/ui/AvatarImage";

export const CONCIERGE_MET_KEY = "concierge.met";

// Name the Concierge (prototype AI.2, "Her name"). After this the user has met her:
// the history opens under the chat, so the chat's back arrow lands on the conversations.
function ConciergeName() {
  const { t } = useTranslation();
  const router = useRouter();
  const guide = useGuide();
  // null until the user types: the field then follows the current name, which is still loading on first render.
  const [typed, setTyped] = useState<string | null>(null);
  const value = typed ?? guide.name;
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const finish = async () => {
    // Opening the chat takes a moment: extra taps must not stack more chats on top.
    if (started.current) return;
    started.current = true;
    setBusy(true);
    // The field starts with the current name; saveGuideName drops an empty or default name
    await saveGuideName(value, guide.defaultName);
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
        <ConciergeTopBar titleStart title={t("conciergeName.title")} onBack={() => router.replace("/patient/concierge-meet")} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <AvatarImage source={guide.portrait} style={styles.hero} accessibilityLabel={guide.name} />
            <Text style={styles.heading} accessibilityRole="header">
              {t("conciergeName.heading")}
            </Text>
            <Text style={styles.lead}>{t("conciergeName.lead")}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>{t("conciergeName.label")}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setTyped}
                placeholder={guide.name}
                placeholderTextColor={Theme.colors.placeholder}
                maxLength={24}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={finish}
              />
            </View>
            <Text style={styles.hint}>{t("conciergeName.hint")}</Text>
            <Pressable onPress={finish} disabled={busy} accessibilityRole="button" accessibilityState={{ busy }} style={[styles.primary, busy && styles.busy]}>
              <Text style={styles.primaryText}>{t("conciergeName.start")}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  busy: { opacity: 0.6 },
  flex: { flex: 1 },
  scroll: { alignItems: "center", paddingHorizontal: 24, paddingTop: Theme.spacing.lg, paddingBottom: Theme.spacing.lg, gap: 12 },
  hero: { width: 132, height: 132, borderRadius: 66, borderWidth: 3, borderColor: Theme.colors.surface, ...Theme.shadows.soft },
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
  hint: { alignSelf: "stretch", fontFamily: Theme.typography.caption, fontSize: 12, lineHeight: 18, color: Theme.colors.inkFaint },
  primary: {
    alignSelf: "stretch",
    height: 50,
    marginTop: 8,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontFamily: Theme.typography.heading, fontSize: 15, color: Theme.colors.surface },
});

export default withPremiumGate(ConciergeName);
