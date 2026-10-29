import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { Pill, Tone } from "@/components/vitals/VitalsUI";
import { GuideNote, metricParts, metricStyles, SectionLabel } from "@/components/vitals/MetricUI";

type Mode = "wake" | "sleep";

const CYCLE_MINUTES = 90;
const FALL_ASLEEP_MINUTES = 15;

// Fewer cycles mean a shorter night: 5–6 is best, 4 is fine, less is short
const quality = (cycles: number): { key: string; tone: Tone } =>
  cycles >= 5 ? { key: "best", tone: "success" } : cycles === 4 ? { key: "okay", tone: "teal" } : { key: "short", tone: "warning" };

// Bedtime calculator: pick when to wake up (or go to bed) and see times that end on a full sleep cycle
export default function BedtimeScreen() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<Mode>("wake");
  const [time, setTime] = useState(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    return d;
  });
  const [pickerVisible, setPickerVisible] = useState(false);

  const format = (date: Date) => date.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" });

  // From the picked time, walk back (wake mode) or forward (sleep mode) by whole cycles
  const options = [6, 5, 4, 3].map((cycles) => {
    const minutes = cycles * CYCLE_MINUTES + FALL_ASLEEP_MINUTES;
    const result = new Date(time.getTime() + (mode === "wake" ? -minutes : minutes) * 60000);
    return { cycles, hours: (cycles * CYCLE_MINUTES) / 60, time: result };
  });

  const switchMode = (next: Mode) => {
    setMode(next);
    const d = new Date();
    d.setHours(next === "wake" ? 7 : 22, 0, 0, 0);
    setTime(d);
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("sleepLog.bedtimeTitle")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <View style={[metricParts.card, metricParts.hero, styles.card]}>
            <View style={styles.segmented} accessibilityRole="tablist">
              {(["wake", "sleep"] as Mode[]).map((option) => {
                const selected = option === mode;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.segment, selected && styles.segmentOn]}
                    onPress={() => switchMode(option)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>
                      {option === "wake" ? t("sleepLog.modeWake") : t("sleepLog.modeSleep")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={metricParts.when}>{mode === "wake" ? t("sleepLog.wakeQuestion") : t("sleepLog.sleepQuestion")}</Text>
            <TouchableOpacity style={styles.timeField} onPress={() => setPickerVisible(true)} accessibilityRole="button">
              <Text style={metricParts.big}>{format(time)}</Text>
              <Feather name="clock" size={20} color={Theme.colors.purple} />
            </TouchableOpacity>
            {pickerVisible && (
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, value) => {
                  setPickerVisible(Platform.OS === "ios");
                  if (event.type !== "dismissed" && value) setTime(value);
                }}
              />
            )}
          </View>

          <SectionLabel>{mode === "wake" ? t("sleepLog.goToBedAt") : t("sleepLog.wakeUpAt")}</SectionLabel>
          <View style={[metricParts.card, styles.list]}>
            {options.map((option, index) => {
              const q = quality(option.cycles);
              return (
                <View key={option.cycles} style={[styles.row, index > 0 && styles.divider]}>
                  <View style={styles.flex}>
                    <Text style={styles.rowTime}>{format(option.time)}</Text>
                    <Text style={styles.rowSub}>
                      {t("sleepLog.cycles", { count: option.cycles, hours: option.hours })}
                    </Text>
                  </View>
                  <Pill label={t(`sleepLog.${q.key}`)} tone={q.tone} />
                </View>
              );
            })}
          </View>

          <GuideNote text={t("sleepLog.guide")} />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  card: {
    gap: 12,
  },
  segmented: {
    flexDirection: "row",
    gap: 4,
    padding: 3,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surfaceSunken,
  },
  segment: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentOn: {
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.card,
  },
  segmentText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 13,
    color: Theme.colors.inkFaint,
  },
  segmentTextOn: {
    color: Theme.colors.purple,
  },
  timeField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.inputBorder,
    backgroundColor: Theme.colors.inputBg,
  },
  list: {
    paddingHorizontal: Theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 62,
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairlineLight,
  },
  rowTime: {
    fontFamily: Theme.typography.display,
    fontSize: 22,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.subheading,
    fontSize: 12,
    color: Theme.colors.inkFaint,
  },
});
