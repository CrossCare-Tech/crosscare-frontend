import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

type Mood = "good" | "tired" | "worried" | "unwell";

const MOODS: { id: Mood; emoji: string }[] = [
  { id: "good", emoji: "😊" },
  { id: "tired", emoji: "😴" },
  { id: "worried", emoji: "😟" },
  { id: "unwell", emoji: "🤒" },
];

// Home mood check-in (prototype home version B, Demo): one tap, a short reply, nothing is saved.
// Worried and unwell also offer a way to talk to the guide.
const MoodCheckIn = () => {
  const { t } = useTranslation();
  const [mood, setMood] = useState<Mood | null>(null);
  const needsGuide = mood === "worried" || mood === "unwell";

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t("moodCheckIn.title")}</Text>
        <Text style={styles.demo}>{t("moodCheckIn.demo")}</Text>
      </View>

      <View style={styles.grid} accessibilityRole="radiogroup">
        {MOODS.map((option) => {
          const selected = option.id === mood;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.chip, selected && styles.chipOn]}
              onPress={() => setMood(option.id)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>{t(`moodCheckIn.${option.id}`)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.reply} accessibilityLiveRegion="polite">
        {mood ? t(`moodCheckIn.reply_${mood}`) : t("moodCheckIn.hint")}
      </Text>

      {needsGuide && (
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push({ pathname: "/patient/askdoula", params: { from_modal: "true" } })}
          activeOpacity={0.88}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{t("moodCheckIn.talk")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MoodCheckIn;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontFamily: Theme.typography.display,
    fontSize: 18,
    lineHeight: 23,
    color: Theme.colors.ink,
  },
  demo: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
    backgroundColor: Theme.colors.purpleTint,
    fontFamily: Theme.typography.heading,
    fontSize: 10.5,
    color: Theme.colors.purple,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    width: "48.5%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.bg,
  },
  chipOn: {
    borderColor: Theme.colors.purple,
    backgroundColor: Theme.colors.purpleTint,
  },
  emoji: {
    fontSize: 18,
  },
  chipText: {
    flexShrink: 1,
    fontFamily: Theme.typography.heading,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  chipTextOn: {
    color: Theme.colors.purple,
  },
  reply: {
    marginTop: 12,
    fontFamily: Theme.typography.body,
    fontSize: 13,
    lineHeight: 19.5,
    color: Theme.colors.inkSoft,
  },
  cta: {
    minHeight: 48,
    marginTop: 12,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontFamily: Theme.typography.heading,
    fontSize: 14,
    color: Theme.colors.surface,
  },
});
