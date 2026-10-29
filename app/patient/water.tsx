import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import { useWaterStore } from "@/zustandStore/waterStore";
import { convertMlToFlOz, useUnitStore } from "@/zustandStore/unitStore";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { Pill, ReadingModal } from "@/components/vitals/VitalsUI";
import {
  AddReadingButton,
  ChartCard,
  daysAgo,
  fmtDate,
  GuideNote,
  metricParts,
  metricStyles,
  Period,
  periodAxis,
  periodWindow,
  RangeBarsChart,
  ReadingList,
  ReminderCard,
  SectionLabel,
  Segmented,
  toLocalDay,
  useActivityHistory,
} from "@/components/vitals/MetricUI";

const GLASS_ML = 250;
const BAR_WIDTH: Record<Period, number> = { "7": 14, "30": 6, "90": 3 };

// Water: today's glasses against the goal, then the same history layout as the vitals
const WaterScreen = () => {
  const user = useSelector((state: any) => state.user);
  const { t, i18n } = useTranslation();
  const { waterUnit } = useUnitStore();
  const { glassCount, setGlassCount, maxGlasses, setMaxGlasses } = useWaterStore();
  const { activities, loading, reload } = useActivityHistory();
  const [period, setPeriod] = useState<Period>("7");
  const [saving, setSaving] = useState(false);
  const [goalVisible, setGoalVisible] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.setItem("water_5", "true");
  }, [user?.user_id]);

  const todayStr = fmtDate(daysAgo(0));
  const days = activities
    .map((activity) => ({ ...activity, date: toLocalDay(activity.date) }))
    .filter((activity) => activity.details?.water > 0 || activity.date === todayStr)
    .map((activity) => ({
      date: activity.date as string,
      glasses: (activity.details?.water as number) || 0,
      goal: (activity.details?.waterGoal as number) || 0,
    }));
  const today = days.find((day) => day.date === todayStr);

  // The API is the source of truth; the store keeps the Home tile in step
  useEffect(() => {
    if (today) setGlassCount(today.glasses);
    if (today?.goal) setMaxGlasses(today.goal);
  }, [today?.glasses, today?.goal]);

  const count = today ? today.glasses : glassCount;
  const goal = today?.goal || maxGlasses || 10;
  const left = Math.max(goal - count, 0);

  const volume = (glasses: number) => {
    const ml = glasses * GLASS_ML;
    if (waterUnit === "fl.oz") return `${Math.round(convertMlToFlOz(ml))} fl oz`;
    return ml >= 1000 ? `${Number((ml / 1000).toFixed(2))} L` : `${ml} ml`;
  };
  const glassesLabel = (glasses: number) =>
    glasses === 1 ? t("waterLog.oneGlass") : t("waterLog.glasses", { count: glasses });

  const dayLabel = (date: string) => {
    if (date === todayStr) return t("bloodPressureLog.today");
    if (date === fmtDate(daysAgo(1))) return t("bloodPressureLog.yesterday");
    return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  };

  // Same request as the Home tile: the API stores today's total, not an increment
  const saveCount = async (next: number) => {
    if (!user?.user_id || next < 0 || saving) return;
    const previous = count;
    setSaving(true);
    setGlassCount(next);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/water`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ water: next }),
      });
      if (!response.ok) throw new Error(`API returned status ${response.status}`);
      reload();
    } catch (error: any) {
      console.warn("Error updating water intake:", error?.message);
      setGlassCount(previous);
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const openGoal = () => {
    setGoalDraft(String(goal));
    setGoalVisible(true);
  };

  const saveGoal = async () => {
    const value = Number(goalDraft);
    if (!Number.isInteger(value) || value < 1 || value > 30) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("waterLog.goalInvalid"));
      return;
    }
    setGoalSaving(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/waterGoal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waterGoal: value }),
      });
      if (!response.ok) throw new Error(`API returned status ${response.status}`);
      setMaxGlasses(value);
      setGoalVisible(false);
      reload();
    } catch (error: any) {
      console.warn("Error saving water goal:", error?.message);
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
    } finally {
      setGoalSaving(false);
    }
  };

  const range = periodWindow(period);
  const inRange = days.filter((day) => day.glasses > 0 && range.contains(day.date));
  const chartMax = Math.max(goal, ...inRange.map((day) => day.glasses)) + 1;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar
          title={t("waterLog.title")}
          action={{ label: t("weightLog.units"), onPress: () => router.push("/patient/unitscreen") }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          {loading && activities.length === 0 ? (
            <ActivityIndicator color={Theme.colors.magenta} style={styles.loader} />
          ) : (
            <View style={[metricParts.card, metricParts.hero, styles.today]}>
              <Text style={metricParts.when}>{t("bloodPressureLog.today")}</Text>
              <View style={styles.countRow}>
                <Text style={metricParts.big}>{count}</Text>
                <Text style={metricParts.unit}>{t("waterLog.ofGoal", { goal })}</Text>
              </View>
              <View style={styles.track}>
                <LinearGradient
                  colors={Theme.home.bars.water}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.fill, { width: `${Math.min(count / goal, 1) * 100}%` }]}
                />
              </View>
              <View style={styles.metaRow}>
                <Pill
                  label={left === 0 ? t("waterLog.goalReached") : t("waterLog.toGo", { count: left })}
                  tone={left === 0 ? "success" : "teal"}
                />
                <Text style={styles.volume}>{volume(count)}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => saveCount(count - 1)}
                  disabled={count === 0 || saving}
                  style={[styles.textButton, count === 0 && styles.disabled]}
                  accessibilityRole="button"
                >
                  <Text style={styles.textButtonLabel}>{t("waterLog.removeGlass")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={openGoal} style={styles.textButton} accessibilityRole="button">
                  <Text style={styles.textButtonLabel}>{t("waterLog.editGoal")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Segmented
            options={[
              { id: "7", label: t("metric.days7") },
              { id: "30", label: t("metric.days30") },
              { id: "90", label: t("metric.days90") },
            ]}
            value={period}
            onChange={setPeriod}
          />

          <ChartCard axis={periodAxis(period, i18n.language)} legend={[{ mark: "line", label: t("waterLog.legend") }]}>
            <RangeBarsChart
              bars={inRange.map((day) => ({ x: range.x(day.date), high: day.glasses, low: 0 }))}
              min={0}
              max={chartMax}
              barWidth={BAR_WIDTH[period]}
            />
          </ChartCard>

          <GuideNote text={t("waterLog.guide")} />

          {inRange.length > 0 && (
            <>
              <SectionLabel>{t("metric.recent")}</SectionLabel>
              <ReadingList
                items={[...inRange]
                  .reverse()
                  .slice(0, 7)
                  .map((day) => {
                    const met = day.glasses >= (day.goal || goal);
                    return {
                      key: day.date,
                      value: glassesLabel(day.glasses),
                      when: `${dayLabel(day.date)} · ${volume(day.glasses)}`,
                      pill: { label: met ? t("waterLog.goalMet") : t("waterLog.belowGoal"), tone: met ? "success" : "teal" },
                    };
                  })}
              />
            </>
          )}

          <ReminderCard
            title={t("waterLog.reminder")}
            hint={t("waterLog.reminderHint")}
            onPress={() => router.push({ pathname: "/patient/settings/reminder", params: { type: "water" } })}
          />
        </ScrollView>

        <AddReadingButton label={t("waterLog.addGlass")} onPress={() => saveCount(count + 1)} />

        <ReadingModal
          visible={goalVisible}
          loading={goalSaving}
          onSave={saveGoal}
          onClose={() => setGoalVisible(false)}
          title={t("metric.dailyGoal")}
          saveLabel={t("metric.saveGoal")}
          showDateTime={false}
        >
          <CustomTextInput
            label={t("waterLog.goalLabel")}
            value={goalDraft}
            onChangeText={(value) => setGoalDraft(value.replace(/[^\d]/g, ""))}
            placeholder="10"
            keyboardType="number-pad"
            maxLength={2}
          />
        </ReadingModal>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default WaterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginVertical: Theme.spacing.lg,
  },
  today: {
    gap: 10,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.surfaceSunken,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  volume: {
    fontFamily: Theme.typography.subheading,
    fontSize: 13,
    color: Theme.colors.inkFaint,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairline,
  },
  textButton: {
    paddingVertical: 4,
  },
  textButtonLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.magenta,
  },
  disabled: {
    opacity: 0.4,
  },
});
