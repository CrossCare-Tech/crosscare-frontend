import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";

// Prototype 2.6 "Self Care": a daily pick and a grid of activity cards.
// ponytail: the pick and the cards are static and do not navigate yet. They need the Contentful routines
// (title, audio, gradient, count in `selfCareStore`) and the exercise / audio player screens wired in
// once the content is defined; until then they only match the design.
const ACTIVITIES: { key: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "movement", icon: "walk-outline" },
  { key: "mindfulness", icon: "bulb-outline" },
  { key: "reflection", icon: "bookmark-outline" },
  { key: "connection", icon: "heart-outline" },
];

const SelfCare = () => {
  const router = useRouter();
  const { t } = useTranslation();

  // The Home counts which areas were visited
  useEffect(() => {
    AsyncStorage.setItem("self-care", "true");
  }, []);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t("back", { defaultValue: "Back" })}
          >
            <Ionicons name="chevron-back" size={20} color={Theme.colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("selfCare.title")}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={Theme.home.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pick}>
            <Text style={styles.pickLabel}>{t("selfCareHub.pickLabel")}</Text>
            <Text style={styles.pickTitle}>{t("selfCareHub.pickTitle")}</Text>
            <TouchableOpacity style={styles.startButton} accessibilityRole="button">
              <Text style={styles.startText}>{t("selfCareHub.start")}</Text>
            </TouchableOpacity>
          </LinearGradient>

          <Text style={styles.sectionLabel}>{t("selfCareHub.browse")}</Text>

          <View style={styles.grid}>
            {ACTIVITIES.map(({ key, icon }) => (
              <View key={key} style={styles.card} accessibilityRole="button">
                <View style={styles.iconChip}>
                  <Ionicons name={icon} size={22} color={Theme.colors.teal} />
                </View>
                <Text style={styles.cardTitle}>{t(`selfCareHub.${key}.title`)}</Text>
                <Text style={styles.cardSub}>{t(`selfCareHub.${key}.sub`)}</Text>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{t(`selfCareHub.${key}.tag`)}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default SelfCare;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 140, // room for the Concierge dock
  },
  pick: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.home.tileBorder,
    paddingHorizontal: 22,
    paddingVertical: 20,
    ...Theme.shadows.card,
  },
  pickLabel: {
    fontSize: 12.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
  },
  pickTitle: {
    marginTop: 6,
    maxWidth: 260,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
  },
  startButton: {
    alignSelf: "flex-start",
    marginTop: 16,
    height: 52,
    paddingHorizontal: 28,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  startText: {
    fontSize: 15,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.surface,
  },
  sectionLabel: {
    marginTop: 26,
    marginBottom: 14,
    fontSize: 13,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start", // cards keep their own height, as in the prototype
    rowGap: 14,
  },
  card: {
    width: "48%",
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    ...Theme.shadows.card,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Theme.colors.tealTint,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    marginTop: 14,
    fontSize: 14.5,
    lineHeight: 19,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  cardSub: {
    marginTop: 3,
    fontSize: 12.5,
    lineHeight: 17,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkFaint,
  },
  tag: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.tealTint,
  },
  tagText: {
    fontSize: 12.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.teal,
  },
});
