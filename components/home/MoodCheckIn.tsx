import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// Only the day of the last answer is kept (on this device), so the card stays away until tomorrow
const ANSWERED_ON_KEY = "moodCheckIn.answeredOn";
// How long the reply to Good or Tired stays before the card leaves
const REPLY_MS = 2500;

// Home mood check-in (prototype home version B): one tap, a short reply, then the card leaves for the day.
// The mood itself is not saved. Worried and unwell keep the card, with a way to talk to the guide, until it is used.
const MoodCheckIn = () => {
  const { t } = useTranslation();
  const [mood, setMood] = useState<Mood | null>(null);
  const [hidden, setHidden] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const needsGuide = mood === "worried" || mood === "unwell";

  useEffect(() => {
    AsyncStorage.getItem(ANSWERED_ON_KEY)
      .then((day) => setHidden(day === new Date().toDateString()))
      .catch(() => setHidden(false));
    return () => clearTimeout(timer.current);
  }, []);

  const leave = async () => {
    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
    const collapse = () => {
      if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setHidden(true);
    };
    if (reduceMotion) return collapse();
    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(collapse);
  };

  const choose = (next: Mood) => {
    setMood(next);
    AsyncStorage.setItem(ANSWERED_ON_KEY, new Date().toDateString()).catch(() => {});
    clearTimeout(timer.current);
    if (next === "good" || next === "tired") timer.current = setTimeout(leave, REPLY_MS);
  };

  const talkToGuide = () => {
    router.push({ pathname: "/patient/askdoula", params: { from_modal: "true" } });
    leave();
  };

  if (hidden) return null;

  return (
    <Animated.View style={[styles.card, { opacity }]}>
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
    </Animated.View>
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
