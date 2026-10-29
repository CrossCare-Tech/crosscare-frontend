import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { Theme } from "@/constants/theme";
import { useGuide } from "@/constants/conciergeGuide";

// First meeting (prototype /concierge/ §3): who the guide is, what she does, and that she is not a doctor.
export default function ConciergeMeet() {
  const { t } = useTranslation();
  const router = useRouter();
  const guide = useGuide();

  // Next: "Her name", then the chat (the name screen opens the history and the chat).
  const start = () => router.replace("/patient/concierge-name");

  const bullets = [t("conciergeMeet.acog"), t("conciergeMeet.notDoctor"), t("conciergeMeet.sources")];

  return (
    <ScreenBackground>
      <ScrollView bounces={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Image source={guide.portrait} style={styles.portrait} resizeMode="cover" accessible accessibilityLabel={`${guide.name}, ${t("conciergeMeet.title")}`} />
          <LinearGradient
            colors={["rgba(30,15,45,0.18)", "rgba(30,15,45,0)", "rgba(248,244,253,0)", Theme.colors.bg]}
            locations={[0, 0.3, 0.6, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.pill}>
            <View style={styles.pillDot} />
            <Text style={styles.pillText}>{t("conciergeMeet.title")}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.hi} accessibilityRole="header">
            {t("conciergeMeet.hi")} <Text style={styles.name}>{guide.name}</Text>.
          </Text>
          <Text style={styles.intro}>{t("conciergeMeet.intro")}</Text>
          <View style={styles.chips}>
            {bullets.map((b) => (
              <View key={b} style={styles.chip}>
                <Text style={styles.chipText}>{b}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={start} accessibilityRole="button" style={styles.primary}>
            <Text style={styles.primaryText}>{t("conciergeMeet.start")}</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/avatar-studio")} accessibilityRole="button" style={styles.text}>
            <Text style={styles.textLabel}>{t("conciergeMeet.choose")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  hero: { height: 340, overflow: "hidden" },
  portrait: { width: "100%", height: "100%" },
  pill: {
    position: "absolute",
    left: Theme.spacing.md,
    top: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.tagOnPhoto,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.colors.magentaVivid },
  pillText: { fontFamily: Theme.typography.heading, fontSize: 11, color: Theme.colors.purple },
  body: { paddingHorizontal: 22, paddingBottom: 28, gap: 10, marginTop: -34 },
  hi: { fontFamily: Theme.typography.display, fontSize: 32, lineHeight: 36, color: Theme.colors.ink },
  name: { fontStyle: "italic", color: Theme.colors.magenta },
  intro: { fontFamily: Theme.typography.body, fontSize: 14, lineHeight: 22, color: Theme.colors.inkSoft },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2, marginBottom: 6 },
  chip: { backgroundColor: Theme.colors.tealTint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Theme.borderRadius.full },
  chipText: { fontFamily: Theme.typography.heading, fontSize: 11.5, color: Theme.colors.teal },
  primary: {
    height: 50,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { height: 40, alignItems: "center", justifyContent: "center" },
  textLabel: { fontFamily: Theme.typography.heading, fontSize: 14, color: Theme.colors.magenta },
  primaryText: { fontFamily: Theme.typography.heading, fontSize: 15, color: Theme.colors.surface },
});
