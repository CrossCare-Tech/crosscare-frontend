import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useTranslation } from "react-i18next";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { Theme } from "@/constants/theme";
import { useGuide } from "@/constants/conciergeGuide";

// Voice pre-prompt (prototype /concierge/ §3): a gentle ask before the system microphone request.
// Preview only: the real permission and live voice come later (Concierge call, N-01).
export default function ConciergeVoice() {
  const { t } = useTranslation();
  const guide = useGuide();
  const close = useSafeBack("/patient/concierge-history");

  return (
    <ScreenBackground>
      <View style={styles.wrap}>
        <View style={styles.art}>
          <View style={[styles.ring, styles.ringOuter]} />
          <View style={[styles.ring, styles.ringInner]} />
          <Image source={guide.portrait} style={styles.portrait} accessibilityLabel={guide.name} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {t("conciergeVoice.title")} <Text style={styles.name}>{guide.name}</Text>
        </Text>
        <Text style={styles.body}>{t("conciergeVoice.body")}</Text>
        <Pressable onPress={close} accessibilityRole="button" style={styles.primary}>
          <Text style={styles.primaryText}>{t("conciergeVoice.allow")}</Text>
        </Pressable>
        <Pressable onPress={close} accessibilityRole="button" style={styles.text}>
          <Text style={styles.textLabel}>{t("conciergeVoice.notNow")}</Text>
        </Pressable>
        <Text style={styles.note}>{t("conciergeVoice.note")}</Text>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", paddingTop: 96, paddingHorizontal: 26, gap: 12 },
  art: { width: 200, height: 200, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  ring: { position: "absolute", borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(80,40,167,0.18)" },
  ringOuter: { width: 200, height: 200 },
  ringInner: { width: 170, height: 170, borderColor: "rgba(80,40,167,0.28)" },
  portrait: { width: 132, height: 132, borderRadius: 66, borderWidth: 2, borderColor: Theme.colors.surface },
  title: { fontFamily: Theme.typography.display, fontSize: 26, lineHeight: 30, color: Theme.colors.ink, textAlign: "center" },
  name: { fontStyle: "italic", color: Theme.colors.purple },
  body: { fontFamily: Theme.typography.body, fontSize: 14, lineHeight: 22, color: Theme.colors.inkSoft, textAlign: "center" },
  primary: {
    alignSelf: "stretch",
    height: 50,
    marginTop: 6,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontFamily: Theme.typography.heading, fontSize: 15, color: Theme.colors.surface },
  text: { height: 40, alignItems: "center", justifyContent: "center" },
  textLabel: { fontFamily: Theme.typography.heading, fontSize: 14, color: Theme.colors.magenta },
  note: { fontFamily: Theme.typography.caption, fontSize: 12, color: Theme.colors.inkFaint, textAlign: "center", marginTop: 8 },
});
