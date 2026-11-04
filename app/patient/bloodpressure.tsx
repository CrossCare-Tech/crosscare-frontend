import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { SAMPLE_CLINICS, useClinicStore } from "@/zustandStore/clinicStore";
import { useDemoMode } from "@/utils/demo/demoMode";
import BloodPressureModal from "./modal/bloodpressuremodal";
import { CONFIG } from "@/constants/config";
import { BP_READING_TIME_KEY } from "@/components/vitals/backdate";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { getBPCategory } from "@/utils/vitalCategories";
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
  UrgentAlert,
  useActivityHistory,
} from "@/components/vitals/MetricUI";


// The alert can be hidden for the rest of the day, for one reading
const ALERT_STATE_KEY = "bp-alert-state";
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
      recordedAt: (activity.details.bloodPressure.recorded_at as string | undefined) ?? null,
    }));
  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const latestCategory = latest ? getBPCategory(latest.systolic, latest.diastolic) : null;
  const todayStr = fmtDate(daysAgo(0));
  const readingKey = latest ? `${latest.date} ${latest.systolic}/${latest.diastolic}` : "";
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [now, setNow] = useState(Date.now());

  // The clinic that receives the active data: the reason text and the call row name it
  const demoMode = useDemoMode((state) => state.enabled);
  const { joined, activeId } = useClinicStore();
  const clinics = [...(demoMode ? SAMPLE_CLINICS : []), ...joined];
  const clinic = clinics.find((c) => c.id === activeId) ?? clinics[0];
  const [readingTime, setReadingTime] = useState<{ key: string; at: string } | null>(null);

  // Week of pregnancy for the alert text (same profile endpoint as the Home)
  const user = useSelector((state: any) => state.user);
  const [week, setWeek] = useState(0);
  useEffect(() => {
    if (!user?.user_id) return;
    fetch(`${CONFIG.API_BASE_URL}/user/${user.user_id}/profile`, {
      headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWeek(data?.week || 0))
      .catch(() => setWeek(0));
  }, [user?.user_id, user?.token]);

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      AsyncStorage.getItem(ALERT_STATE_KEY)
        .then((value) => setAlertState(value ? JSON.parse(value) : null))
        .catch(() => setAlertState(null));
    }, [])
  );

  // Read again whenever the readings reload, so a reading saved from this screen shows its time
  useEffect(() => {
    AsyncStorage.getItem(BP_READING_TIME_KEY)
      .then((value) => setReadingTime(value ? JSON.parse(value) : null))
      .catch(() => setReadingTime(null));
  }, [activities]);

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
              eyebrow={t("bloodPressureLog.alertEyebrow")}
              title={t("bloodPressureLog.alertHeadline")}
              reading={{
                label: t("bloodPressureLog.alertReadingLabel"),
                value: `${latest.systolic}/${latest.diastolic}`,
                unit: "mmHg",
                // The time comes from the reading itself; when the API does not send it, from the entry made on this phone
                // ponytail: readings from elsewhere without a time show the day only
                when: (() => {
                  const at = latest.recordedAt ?? (readingTime?.key === readingKey ? readingTime.at : null);
                  return at
                    ? `${dayLabel(latest.date)}, ${new Date(at).toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" })}`
                    : dayLabel(latest.date);
                })(),
                pill: week > 0 ? t("bloodPressureLog.alertPillWeek", { week }) : t("bloodPressureLog.aboveSafe"),
              }}
              body={week > 0 ? t("bloodPressureLog.alertBodyWeek", { week }) : t("bloodPressureLog.alertBodyNoWeek")}
              primary={{
                label: t("bloodPressureLog.alertContact"),
                onPress: () => router.push({ pathname: "/patient/askdoula", params: { from_modal: "true" } }),
              }}
              secondary={{ label: t("bloodPressureLog.alertLogAnother"), onPress: () => setModalVisible(true) }}
              onDismiss={handleDismiss}
              dismissLabel={t("bloodPressureLog.alertDismiss")}
              explain={{
                title: t("bloodPressureLog.alertWhatTitle"),
                body: clinic
                  ? t("bloodPressureLog.alertWhatBody", { clinic: clinic.name })
                  : t("bloodPressureLog.alertWhatBodyNoClinic"),
              }}
              clinic={
                clinic
                  ? {
                      name: clinic.name,
                      sub: t("bloodPressureLog.alertClinicSub", { phone: clinic.phone }),
                      onPress: () => Linking.openURL(`tel:${clinic.phone.replace(/[^\d+]/g, "")}`),
                    }
                  : undefined
              }
            />
          )}

          {loading && readings.length === 0 ? (
            <ActivityIndicator color={Theme.colors.magenta} style={styles.loader} />
          ) : latest && latestCategory ? (
            <MetricHero
              when={t("bloodPressureLog.currentReading")}
              value={`${latest.systolic}/${latest.diastolic}`}
              unit=""
              pill={{
                label:
                  latestCategory.key === "high2"
                    ? t("bloodPressureLog.aboveSafe")
                    : t(`bloodPressureLog.${latestCategory.key === "normal" ? "normalRange" : latestCategory.key}`),
                tone: latestCategory.tone,
              }}
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
            title={period === "7" ? t("bloodPressureLog.lastReadings") : t(`metric.days${period}`)}
            axis={periodAxis(period, i18n.language)}
            legend={[
              { mark: "trend", label: t("vitalsEntry.systolic") },
              { mark: "trendSecond", label: t("vitalsEntry.diastolic") },
              { mark: "band", label: t("bloodPressureLog.legendNormal") },
            ]}
          >
            <TrendChart
              points={inRange.map((reading) => ({ x: range.x(reading.date), value: reading.systolic }))}
              secondary={inRange.map((reading) => ({ x: range.x(reading.date), value: reading.diastolic }))}
              min={Math.min(60, ...inRange.map((reading) => reading.diastolic)) - 5}
              max={Math.max(150, ...inRange.map((reading) => reading.systolic)) + 5}
              band={[60, 120]}
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
