import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlucoseModal, { GLUCOSE_CONTEXTS } from "./modal/glucosemodal";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { Tone } from "@/components/vitals/VitalsUI";
import {
  AddReadingButton,
  ChartCard,
  daysAgo,
  fmtDate,
  GuideNote,
  MetricEmpty,
  MetricHero,
  metricStyles,
  Period,
  periodAxis,
  periodWindow,
  ReadingList,
  SectionLabel,
  Segmented,
  TrendChart,
  useActivityHistory,
} from "@/components/vitals/MetricUI";

const isMmol = (unit: string) => unit?.toLowerCase().includes("mmol");

// Pregnancy glucose targets (ACOG): fasting below 95 mg/dL, after meals below 140 mg/dL.
// Readings that are not marked as fasting use the after-meal target.
const getGlucoseCategory = (
  level: number,
  unit: string,
  context: string | null
): { key: string; tone: Tone } => {
  const mgdl = isMmol(unit) ? level * 18 : level;
  if (mgdl < 70) return { key: "low", tone: "warning" };
  const limit = context === "Fasting" ? 95 : 140;
  return mgdl < limit ? { key: "normal", tone: "success" } : { key: "elevated", tone: "warning" };
};

// 5.2 — Glucose
const GlucoseScreen = () => {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<Period>("7");
  const [modalVisible, setModalVisible] = useState(false);
  const { activities, loading, reload } = useActivityHistory();

  useEffect(() => {
    const setVisited = async () => {
      await AsyncStorage.setItem("glucose", "true");
    };

    setVisited();
  }, [userId]);

  // Days with a reading, oldest first
  const readings = activities
    .filter((activity) => activity.details?.glucose?.value > 0)
    .map((activity) => ({
      date: activity.date,
      level: activity.details.glucose.value as number,
      unit: (activity.details.glucose.unit as string) || "mg/dL",
      context: (activity.details.glucose.mealContext as string | null) || null,
    }));
  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const unit = latest?.unit || "mg/dL";
  const todayStr = fmtDate(daysAgo(0));

  const contextLabel = (context: string | null) => {
    const option = GLUCOSE_CONTEXTS.find((item) => item.value === context);
    return option ? t(`vitalsEntry.${option.key}`) : null;
  };

  const dayLabel = (date: string) => {
    if (date === todayStr) return t("bloodPressureLog.today");
    if (date === fmtDate(daysAgo(1))) return t("bloodPressureLog.yesterday");
    return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  };
  const pill = (reading: { level: number; unit: string; context: string | null }) => {
    const category = getGlucoseCategory(reading.level, reading.unit, reading.context);
    return { label: t(`glucoseLog.${category.key}`), tone: category.tone };
  };

  // Fasting target band, in the unit the readings use
  const band: [number, number] = isMmol(unit) ? [3.9, 5.3] : [70, 95];
  const range = periodWindow(period);
  const inRange = readings.filter((reading) => range.contains(reading.date));
  const values = inRange.map((reading) => reading.level);
  const floor = isMmol(unit) ? 3.3 : 60;
  const ceiling = isMmol(unit) ? 6.7 : 120;
  const margin = isMmol(unit) ? 0.3 : 5;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("glucoseLog.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          {loading && readings.length === 0 ? (
            <ActivityIndicator color={Theme.colors.magenta} style={styles.loader} />
          ) : latest ? (
            <MetricHero
              when={`${contextLabel(latest.context) || t("metric.latest")} · ${dayLabel(latest.date)}`}
              value={String(latest.level)}
              unit={latest.unit}
              pill={pill(latest)}
              source={t("metric.enteredByYou")}
              manual
            />
          ) : (
            <MetricEmpty text={t("glucoseLog.noReadings")} />
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

          <ChartCard
            axis={periodAxis(period, i18n.language)}
            legend={[
              { mark: "line", label: t("glucoseLog.legendReadings") },
              { mark: "band", label: t("glucoseLog.legendTarget", { range: `${band[0]}–${band[1]}` }) },
            ]}
          >
            <TrendChart
              points={inRange.map((reading) => ({ x: range.x(reading.date), value: reading.level }))}
              min={Math.min(floor, ...values) - margin}
              max={Math.max(ceiling, ...values) + margin}
              band={band}
            />
          </ChartCard>

          <GuideNote text={t("glucoseLog.guide")} />

          {inRange.length > 0 && (
            <>
              <SectionLabel>{t("metric.recent")}</SectionLabel>
              <ReadingList
                items={[...inRange]
                  .reverse()
                  .slice(0, 7)
                  .map((reading) => {
                    const context = contextLabel(reading.context);
                    return {
                      key: reading.date,
                      value: `${reading.level} ${reading.unit}`,
                      when: context ? `${dayLabel(reading.date)} · ${context}` : dayLabel(reading.date),
                      pill: pill(reading),
                    };
                  })}
              />
            </>
          )}
        </ScrollView>

        <AddReadingButton label={t("metric.addReading")} onPress={() => setModalVisible(true)} />

        <GlucoseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          reload={reload}
          initialGlucoseLevel={latest?.date === todayStr ? latest.level : null}
          initialMealContext={latest?.date === todayStr ? latest.context : null}
          initialGlucoseUnit={unit}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default GlucoseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginVertical: Theme.spacing.lg,
  },
});
