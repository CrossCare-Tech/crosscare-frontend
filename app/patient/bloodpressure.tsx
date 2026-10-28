import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import BloodPressureModal from "./modal/bloodpressuremodal";
import { scheduleBloodPressureRecheck } from "../../utils/NotificationManager";
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
  RangeBarsChart,
  ReadingList,
  SectionLabel,
  Segmented,
  UrgentAlert,
  useActivityHistory,
} from "@/components/vitals/MetricUI";

// Same ranges the app already used. Stage 2 (140/90 or higher) is the pregnancy safe limit,
// shown in yellow with words rather than red (prototype 5.5)
const getBPCategory = (sys: number, dia: number): { key: string; tone: Tone } => {
  if (sys < 120 && dia < 80) return { key: "normal", tone: "success" };
  if (sys < 130 && dia < 80) return { key: "elevated", tone: "warning" };
  if (sys < 140 && dia < 90) return { key: "high1", tone: "warning" };
  return { key: "high2", tone: "warning" };
};

const BAR_WIDTH: Record<Period, number> = { "7": 14, "30": 6, "90": 3 };

// The alert can be hidden for one reading: until the recheck reminder, or for the rest of the day
const ALERT_STATE_KEY = "bp-alert-state";
const RECHECK_MINUTES = 15;
type AlertState = { reading: string; until: number };

// 5.1 — Blood pressure, with the 5.5 high reading alert
const BloodPressureScreen = () => {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<Period>("7");
  const [modalVisible, setModalVisible] = useState(false);
  const { activities, loading, reload } = useActivityHistory();

  // Days with a reading, oldest first
  const readings = activities
    .filter((activity) => activity.details?.bloodPressure?.systolic > 0)
    .map((activity) => ({
      date: activity.date,
      systolic: activity.details.bloodPressure.systolic as number,
      diastolic: (activity.details.bloodPressure.diastolic as number) || 0,
    }));
  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const latestCategory = latest ? getBPCategory(latest.systolic, latest.diastolic) : null;
  const todayStr = fmtDate(daysAgo(0));
  const readingKey = latest ? `${latest.date} ${latest.systolic}/${latest.diastolic}` : "";
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [now, setNow] = useState(Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      AsyncStorage.getItem(ALERT_STATE_KEY)
        .then((value) => setAlertState(value ? JSON.parse(value) : null))
        .catch(() => setAlertState(null));
    }, [])
  );

  const hidden = !!alertState && alertState.reading === readingKey && alertState.until > now;

  // Bring the alert back when the recheck time comes while the screen is open
  useEffect(() => {
    if (!hidden || !alertState) return;
    const timer = setTimeout(() => setNow(Date.now()), alertState.until - now);
    return () => clearTimeout(timer);
  }, [hidden, alertState, now]);

  const hideAlert = async (until: number) => {
    const state = { reading: readingKey, until };
    setAlertState(state);
    setNow(Date.now());
    await AsyncStorage.setItem(ALERT_STATE_KEY, JSON.stringify(state)).catch(() => undefined);
  };

  const showAlert = !!latest && latest.date === todayStr && latestCategory?.key === "high2" && !hidden;

  const dayLabel = (date: string) => {
    if (date === todayStr) return t("bloodPressureLog.today");
    if (date === fmtDate(daysAgo(1))) return t("bloodPressureLog.yesterday");
    return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  };

  const handleRecheck = async () => {
    const scheduled = await scheduleBloodPressureRecheck(
      t("bloodPressureLog.recheckTitle"),
      t("bloodPressureLog.recheckBody"),
      RECHECK_MINUTES
    );
    if (scheduled) {
      await hideAlert(Date.now() + RECHECK_MINUTES * 60000);
    }
    Alert.alert(
      t("bloodPressureLog.title"),
      scheduled ? t("bloodPressureLog.recheckScheduled") : t("bloodPressureLog.recheckFailed")
    );
  };

  const handleDismiss = () => {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    hideAlert(endOfDay.getTime());
  };

  const range = periodWindow(period);
  const inRange = readings.filter((reading) => range.contains(reading.date));

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("bloodPressureLog.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          {showAlert && latest && (
            <UrgentAlert
              title={t("bloodPressureLog.alertTitle")}
              body={t("bloodPressureLog.alertBody", { value: `${latest.systolic}/${latest.diastolic}` })}
              primary={{
                label: t("bloodPressureLog.alertContact"),
                onPress: () => router.push({ pathname: "/patient/askdoula", params: { from_modal: "true" } }),
              }}
              secondary={{ label: t("bloodPressureLog.alertRecheck"), onPress: handleRecheck }}
              onDismiss={handleDismiss}
              dismissLabel={t("bloodPressureLog.alertDismiss")}
            />
          )}

          {loading && readings.length === 0 ? (
            <ActivityIndicator color={Theme.colors.magenta} style={styles.loader} />
          ) : latest && latestCategory ? (
            <MetricHero
              when={`${t("metric.latest")} · ${dayLabel(latest.date)}`}
              value={`${latest.systolic}/${latest.diastolic}`}
              unit="mmHg"
              pill={{
                label:
                  latestCategory.key === "high2"
                    ? t("bloodPressureLog.aboveSafe")
                    : t(`bloodPressureLog.${latestCategory.key}`),
                tone: latestCategory.tone,
              }}
              source={t("metric.enteredByYou")}
              manual
            />
          ) : (
            <MetricEmpty text={t("bloodPressureLog.noReadings")} />
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
              { mark: "line", label: t("bloodPressureLog.legendLatest") },
              { mark: "earlier", label: t("bloodPressureLog.legendEarlier") },
              { mark: "band", label: t("bloodPressureLog.legendNormal") },
            ]}
          >
            <RangeBarsChart
              bars={inRange.map((reading) => ({
                x: range.x(reading.date),
                high: reading.systolic,
                low: reading.diastolic,
              }))}
              min={Math.min(60, ...inRange.map((reading) => reading.diastolic)) - 5}
              max={Math.max(150, ...inRange.map((reading) => reading.systolic)) + 5}
              band={[60, 120]}
              barWidth={BAR_WIDTH[period]}
            />
          </ChartCard>

          <GuideNote text={t("bloodPressureLog.guide")} />

          {inRange.length > 0 && (
            <>
              <SectionLabel>{t("metric.recent")}</SectionLabel>
              <ReadingList
                items={[...inRange]
                  .reverse()
                  .slice(0, 7)
                  .map((reading) => {
                    const category = getBPCategory(reading.systolic, reading.diastolic);
                    return {
                      key: reading.date,
                      value: `${reading.systolic}/${reading.diastolic} mmHg`,
                      when: `${dayLabel(reading.date)} · ${t("metric.enteredByYou")}`,
                      pill: { label: t(`bloodPressureLog.${category.key}`), tone: category.tone },
                    };
                  })}
              />
            </>
          )}
        </ScrollView>

        <AddReadingButton label={t("metric.addReading")} onPress={() => setModalVisible(true)} />

        <BloodPressureModal visible={modalVisible} onClose={() => setModalVisible(false)} reload={reload} />
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default BloodPressureScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginVertical: Theme.spacing.lg,
  },
});
