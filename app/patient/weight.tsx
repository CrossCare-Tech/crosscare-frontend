import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WeightModal from "./modal/weightmodal";
import { useUnitStore, convertWeight } from "@/zustandStore/unitStore";
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
  ReminderCard,
  SectionLabel,
  Segmented,
  TrendChart,
  useActivityHistory,
} from "@/components/vitals/MetricUI";

const round = (value: number) => Math.round(value * 10) / 10;

// 5.4 — Weight. No target band is drawn: the care team sets it, and the guide says so.
const WeightScreen = () => {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  const { t, i18n } = useTranslation();
  const { weightUnit } = useUnitStore();
  const [period, setPeriod] = useState<Period>("7");
  const [modalVisible, setModalVisible] = useState(false);
  const { activities, loading, reload } = useActivityHistory();

  useEffect(() => {
    const setWeightVisited = async () => {
      await AsyncStorage.setItem("weight_4", "true");
    };

    setWeightVisited();
  }, [userId]);

  // Days with a weight, oldest first, in the unit the user picked
  const readings = activities
    .filter((activity) => activity.details?.weight?.value > 0)
    .map((activity) => {
      const from = activity.details.weight.unit === "lbs" ? "lbs" : "kg";
      return { date: activity.date, weight: round(convertWeight(activity.details.weight.value, from, weightUnit)) };
    });
  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const todayStr = fmtDate(daysAgo(0));

  const dayLabel = (date: string) => {
    if (date === todayStr) return t("bloodPressureLog.today");
    if (date === fmtDate(daysAgo(1))) return t("bloodPressureLog.yesterday");
    return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  };
  const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(round(value))} ${weightUnit}`;

  // Change against the reading before it, the only comparison the app can make without a target
  const changePill = (index: number): { label: string; tone: Tone } => {
    if (index === 0) return { label: t("weightLog.firstReading"), tone: "teal" };
    const change = round(readings[index].weight - readings[index - 1].weight);
    return change === 0
      ? { label: t("weightLog.sameAsLast"), tone: "teal" }
      : { label: t("weightLog.sinceLast", { value: signed(change) }), tone: "teal" };
  };

  const source =
    readings.length > 1
      ? `${t("metric.enteredByYou")} · ${t("weightLog.soFar", { value: signed(latest!.weight - readings[0].weight) })}`
      : t("metric.enteredByYou");

  const range = periodWindow(period);
  const inRange = readings
    .map((reading, index) => ({ ...reading, index }))
    .filter((reading) => range.contains(reading.date));
  const values = inRange.map((reading) => reading.weight);
  const padding = weightUnit === "lbs" ? 4 : 2;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar
          title={t("weightLog.title")}
          action={{ label: t("weightLog.units"), onPress: () => router.push("/patient/weightunit") }}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          {loading && readings.length === 0 ? (
            <ActivityIndicator color={Theme.colors.magenta} style={styles.loader} />
          ) : latest ? (
            <MetricHero
              when={`${t("metric.latest")} · ${dayLabel(latest.date)}`}
              value={String(latest.weight)}
              unit={weightUnit}
              pill={changePill(readings.length - 1)}
              source={source}
              manual
            />
          ) : (
            <MetricEmpty text={t("weightLog.noReadings")} />
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

          <ChartCard axis={periodAxis(period, i18n.language)} legend={[{ mark: "line", label: t("weightLog.legend") }]}>
            <TrendChart
              points={inRange.map((reading) => ({ x: range.x(reading.date), value: reading.weight }))}
              min={values.length ? Math.min(...values) - padding : 0}
              max={values.length ? Math.max(...values) + padding : 1}
            />
          </ChartCard>

          <GuideNote text={t("weightLog.guide")} />

          {inRange.length > 0 && (
            <>
              <SectionLabel>{t("metric.recent")}</SectionLabel>
              <ReadingList
                items={[...inRange]
                  .reverse()
                  .slice(0, 7)
                  .map((reading) => ({
                    key: reading.date,
                    value: `${reading.weight} ${weightUnit}`,
                    when: `${dayLabel(reading.date)} · ${t("metric.enteredByYou")}`,
                    pill: changePill(reading.index),
                  }))}
              />
            </>
          )}

          <ReminderCard
            title={t("weightLog.reminder")}
            hint={t("weightLog.reminderHint")}
            onPress={() => router.push({ pathname: "/patient/settings/reminder", params: { type: "weight" } })}
          />
        </ScrollView>

        <AddReadingButton label={t("metric.addReading")} onPress={() => setModalVisible(true)} />

        <WeightModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          reload={reload}
          initialWeight={latest?.date === todayStr ? latest.weight : null}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default WeightScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginVertical: Theme.spacing.lg,
  },
});
