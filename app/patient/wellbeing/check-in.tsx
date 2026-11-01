import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthTopBar from "@/components/ui/AuthTopBar";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { AnswerOption, PrimaryButton, wellbeingStyles as shared } from "@/components/wellbeing/WellbeingUI";
import {
  PHQ2_COUNT,
  PHQ9_COUNT,
  PHQ_ITEMS,
  PHQ_OPTIONS,
  needsFullAssessment,
} from "@/components/wellbeing/model";
import { Theme } from "@/constants/theme";
import { useDemoWellbeing } from "@/utils/demo/demoWellbeing";

const SUMMARY_ROWS = 5;

// 9.4 and 9.5: starts with the PHQ-2 and goes on to the rest of the PHQ-9 only when its score calls for it.
// The first two PHQ-9 questions are the PHQ-2, so they are not asked twice.
const CheckInScreen = () => {
  const { t } = useTranslation();
  const savePhqResult = useDemoWellbeing((state) => state.savePhqResult);

  const [answers, setAnswers] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);

  const total = full ? PHQ9_COUNT : PHQ2_COUNT;
  const selected = answers[index];
  const item = PHQ_ITEMS[index];

  const select = (value: number) => {
    setAnswers((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const goBack = () => {
    if (index === 0) router.back();
    else {
      // Going back over the PHQ-2 returns to the short form, since a new answer can change the outcome
      if (index === PHQ2_COUNT) setFull(false);
      setIndex(index - 1);
    }
  };

  const finish = (kind: "phq2" | "phq9") => {
    savePhqResult({ at: new Date().toISOString(), kind, answers: answers.slice(0, total) });
    router.replace("/patient/wellbeing/results");
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
    } else if (!full && needsFullAssessment(answers.slice(0, PHQ2_COUNT))) {
      setFull(true);
      setIndex(PHQ2_COUNT);
    } else {
      finish(full ? "phq9" : "phq2");
    }
  };

  const summaryStart = Math.max(0, Math.min(index - 3, PHQ9_COUNT - SUMMARY_ROWS));

  return (
    <ScreenBackground>
      <SafeAreaView style={shared.safeArea}>
        <AuthTopBar title={full ? t("wellbeingCare.fullCheckIn") : t("wellbeingCare.moodCheckIn")} onBack={goBack} />
        <ScrollView contentContainerStyle={shared.content} showsVerticalScrollIndicator={false}>
          {full ? (
            <View style={styles.bar}>
              <LinearGradient
                colors={[Theme.colors.magentaVivid, Theme.colors.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.barFill, { width: `${((index + 1) / PHQ9_COUNT) * 100}%` }]}
              />
            </View>
          ) : (
            <View style={styles.dots}>
              {Array.from({ length: PHQ2_COUNT }, (_, dot) => (
                <View key={dot} style={[styles.dot, dot === index && styles.dotOn]} />
              ))}
            </View>
          )}

          <View style={styles.question}>
            <Text style={styles.counter}>{t("wellbeingCare.questionOf", { current: index + 1, total })}</Text>
            <Text style={styles.lead}>{t("wellbeingCare.questionLead")}</Text>
            <Text style={styles.questionText}>{t(`wellbeingCare.phq.${item}.question`)}</Text>
          </View>

          <View style={styles.options} accessibilityRole="radiogroup">
            {PHQ_OPTIONS.map((option, value) => (
              <AnswerOption
                key={option}
                label={t(`wellbeingCare.options.${option}`)}
                selected={selected === value}
                onPress={() => select(value)}
              />
            ))}
          </View>

          {full ? (
            <View style={styles.summary}>
              {PHQ_ITEMS.slice(summaryStart, summaryStart + SUMMARY_ROWS).map((summaryItem, offset) => {
                const row = summaryStart + offset;
                const done = row < index;
                const current = row === index;
                return (
                  <View key={summaryItem} style={[styles.summaryRow, offset > 0 && styles.summaryDivider]}>
                    <View style={[styles.summaryNum, done && styles.summaryDone, current && styles.summaryCurrent]}>
                      {done ? (
                        <Feather name="check" size={13} color={Theme.colors.surface} />
                      ) : (
                        <Text style={[styles.summaryNumText, current && styles.summaryNumTextOn]}>{row + 1}</Text>
                      )}
                    </View>
                    <Text style={[styles.summaryLabel, !done && !current && styles.summaryLabelFaint]}>
                      {t(`wellbeingCare.phq.${summaryItem}.short`)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={shared.note}>{t("wellbeingCare.checkInPrivate")}</Text>
          )}

          <PrimaryButton
            label={t("wellbeingCare.next")}
            disabled={selected === undefined}
            onPress={next}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default CheckInScreen;

const styles = StyleSheet.create({
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.hairline,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Theme.colors.hairline,
  },
  dotOn: {
    width: 18,
    backgroundColor: Theme.colors.magenta,
  },
  question: {
    gap: 6,
  },
  counter: {
    fontSize: 11.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkFaint,
  },
  lead: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: Theme.typography.caption,
    color: Theme.colors.inkSoft,
  },
  questionText: {
    fontSize: 19,
    lineHeight: 27,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
  },
  options: {
    gap: 10,
  },
  summary: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: 4,
    paddingHorizontal: 16,
    ...Theme.shadows.card,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairline,
  },
  summaryNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryDone: {
    backgroundColor: Theme.colors.success,
  },
  summaryCurrent: {
    backgroundColor: Theme.colors.magenta,
  },
  summaryNumText: {
    fontSize: 11.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
  },
  summaryNumTextOn: {
    color: Theme.colors.surface,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: Theme.typography.caption,
    color: Theme.colors.ink,
  },
  summaryLabelFaint: {
    color: Theme.colors.inkFaint,
  },
});
