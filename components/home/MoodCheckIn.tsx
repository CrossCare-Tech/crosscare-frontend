import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

type Mood = "good" | "tired" | "worried" | "unwell";
type MoodEntry = { mood: Mood; at: string };

const MOODS: { id: Mood; emoji: string }[] = [
  { id: "good", emoji: "😊" },
  { id: "tired", emoji: "😴" },
  { id: "worried", emoji: "😟" },
  { id: "unwell", emoji: "🤒" },
];

// Every tap is saved on this device with the time it happened, so the mood can change during the day
// (good in the morning, tired in the afternoon). The backend keeps one mood per day on a 5-level scale,
// so these entries are not sent to it yet.
const ENTRIES_KEY = "moodCheckIn.entries";
const MAX_ENTRIES = 200;
// Tapping the mood that is already selected twice in a row within this time counts as one tap
const DOUBLE_TAP_MS = 60_000;

const loadEntries = async (): Promise<MoodEntry[]> => {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(ENTRIES_KEY)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Home mood check-in (prototype home version B): one tap and a short reply. The card always stays on the
// Home, showing the last mood of today, and a new tap adds another entry (the time is saved, not shown).
const MoodCheckIn = () => {
  const { t } = useTranslation();
  const [last, setLast] = useState<MoodEntry | null>(null);

  useEffect(() => {
    loadEntries().then((entries) => {
      const latest = entries[entries.length - 1];
      if (latest && new Date(latest.at).toDateString() === new Date().toDateString()) setLast(latest);
    });
  }, []);

  const choose = async (mood: Mood) => {
    const now = new Date();
    if (last?.mood === mood && now.getTime() - new Date(last.at).getTime() < DOUBLE_TAP_MS) return;
    const entry: MoodEntry = { mood, at: now.toISOString() };
    setLast(entry);
    try {
      const entries = await loadEntries();
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify([...entries, entry].slice(-MAX_ENTRIES)));
    } catch {
      // The tap still shows on screen; only remembering it failed
    }
  };

  const talkToGuide = () => router.push({ pathname: "/patient/askdoula", params: { from_modal: "true" } });

  const mood = last?.mood ?? null;
  const needsGuide = mood === "worried" || mood === "unwell";

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("moodCheckIn.title")}</Text>

      <View style={styles.grid} accessibilityRole="radiogroup">
        {MOODS.map((option) => {
          const selected = option.id === mood;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.chip, selected && styles.chipOn]}
              onPress={() => choose(option.id)}
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
        <TouchableOpacity style={styles.cta} onPress={talkToGuide} activeOpacity={0.88} accessibilityRole="button">
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
  title: {
    fontFamily: Theme.typography.display,
    fontSize: 18,
    lineHeight: 23,
    color: Theme.colors.ink,
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
