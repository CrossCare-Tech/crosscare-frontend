import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { useFitbit } from "@/zustandStore/useFitbitStore";
import { useAppleHealth } from "@/zustandStore/useAppleHealthStore";
import { demoWatchReaders, useDemoWatch, useDemoWatchActive } from "@/utils/demo/demoWatch";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import DeviceSourceRows from "@/components/devices/DeviceSourceRows";
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
import HeartRateModal from "./modal/heartratemodal";

WebBrowser.maybeCompleteAuthSession();

type Source = "fitbit" | "apple" | "demo" | "manual";

interface Reading {
  date: string; // YYYY-MM-DD
  bpm: number;
  source: Source;
}

// Typical resting heart rate (60–100 bpm), the band drawn on the chart
const TYPICAL: [number, number] = [60, 100];

const getHeartCategory = (bpm: number): { key: string; tone: Tone } => {
  if (bpm < TYPICAL[0]) return { key: "low", tone: "warning" };
  if (bpm > TYPICAL[1]) return { key: "high", tone: "warning" };
  return { key: "normal", tone: "success" };
};

// Fitbit and Apple Health both answer with `activities-heart` entries
const fromDevice = (data: any, source: Source): Reading[] =>
  (data?.["activities-heart"] || [])
    .map((item: any) => {
      const bpm = item?.value?.restingHeartRate;
      return item?.dateTime && bpm > 0
        ? { date: String(item.dateTime).slice(0, 10), bpm: Math.round(bpm), source }
        : null;
    })
    .filter(Boolean);

// 5.3 — Heart rate
export default function HeartRateScreen() {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<Period>("7");
  const [deviceReadings, setDeviceReadings] = useState<Reading[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const { activities, loading, reload } = useActivityHistory();

  const { isConnected: fitbitConnected, getHeartRateData: getFitbitHeartRateData } = useFitbit();

  // The Demo Watch (Simulated data) feeds the screen while it is paired and heart rate is allowed
  const watchActive = useDemoWatchActive();
  const watchAllowed = useDemoWatch((state) => state.permissions.heart);

  const {
    isConnected: appleConnected,
    checkConnection: checkAppleConnection,
    getHeartRateDataForRange: getAppleHeartRateData,
  } = useAppleHealth();

  useEffect(() => {
    const setHeartVisited = async () => {
      if (userId) {
        await AsyncStorage.setItem("heart_2", "true");
      }
    };
    setHeartVisited();
  }, [userId]);

  useEffect(() => {
    if (Platform.OS === "ios") {
      checkAppleConnection();
    }
  }, []);

  useEffect(() => {
    const loadDevices = async () => {
      const readings: Reading[] = [];
      try {
        if (fitbitConnected) {
          readings.push(...fromDevice(await getFitbitHeartRateData(fmtDate(new Date()), "3m"), "fitbit"));
        }
        if (appleConnected && Platform.OS === "ios") {
          readings.push(...fromDevice(await getAppleHeartRateData("month"), "apple"));
        }
        if (watchActive) {
          readings.push(...fromDevice(demoWatchReaders.heart(fmtDate(daysAgo(89)), fmtDate(new Date())), "demo"));
        }
      } catch (error) {
        console.warn("Error fetching device heart rate:", error);
      }
      setDeviceReadings(readings);
    };
    loadDevices();
  }, [fitbitConnected, appleConnected, watchActive, watchAllowed]);

  // Manual readings come from the daily activity list; device readings win on the same day
  const byDate = new Map<string, Reading>();
  activities.forEach((activity) => {
    const bpm = activity.details?.heart;
    if (bpm > 0) {
      byDate.set(activity.date, { date: activity.date, bpm: Math.round(bpm), source: "manual" });
    }
  });
  deviceReadings.forEach((reading) => byDate.set(reading.date, reading));
  const readings = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  const range = periodWindow(period);
  const inRange = readings.filter((reading) => range.contains(reading.date));
  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const todayStr = fmtDate(daysAgo(0));

  const dayLabel = (date: string) => {
    if (date === todayStr) return t("bloodPressureLog.today");
    if (date === fmtDate(daysAgo(1))) return t("bloodPressureLog.yesterday");
    return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  };
  const sourceLabel = (source: Source) =>
    t(
      source === "fitbit"
        ? "heartLog.sourceFitbit"
        : source === "apple"
          ? "heartLog.sourceApple"
          : source === "demo"
            ? "heartLog.sourceDemo"
            : "metric.enteredByYou"
    );
  const pill = (bpm: number) => {
    const category = getHeartCategory(bpm);
    return { label: t(`heartLog.${category.key}`), tone: category.tone };
  };

  const values = inRange.map((reading) => reading.bpm);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("heartLog.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          {loading && readings.length === 0 ? (
            <ActivityIndicator color={Theme.colors.magenta} style={styles.loader} />
          ) : latest ? (
            <MetricHero
              when={`${t("heartLog.resting")} · ${dayLabel(latest.date)}`}
              value={String(latest.bpm)}
              unit="bpm"
              pill={pill(latest.bpm)}
              source={sourceLabel(latest.source)}
              manual={latest.source === "manual"}
            />
          ) : (
            <MetricEmpty text={t("heartLog.noReadings")} />
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
              { mark: "line", label: t("heartLog.legendResting") },
              { mark: "band", label: t("heartLog.legendTypical") },
            ]}
          >
            <TrendChart
              points={inRange.map((reading) => ({ x: range.x(reading.date), value: reading.bpm }))}
              min={Math.min(50, ...values) - 5}
              max={Math.max(110, ...values) + 5}
              band={TYPICAL}
            />
          </ChartCard>

          <GuideNote text={t("heartLog.guide")} />

          {inRange.length > 0 && (
            <>
              <SectionLabel>{t("metric.recent")}</SectionLabel>
              <ReadingList
                items={[...inRange]
                  .reverse()
                  .slice(0, 7)
                  .map((reading) => ({
                    key: reading.date,
                    value: `${reading.bpm} bpm`,
                    when: `${dayLabel(reading.date)} · ${sourceLabel(reading.source)}`,
                    pill: pill(reading.bpm),
                  }))}
              />
            </>
          )}

          <SectionLabel>{t("heartLog.devices")}</SectionLabel>
          <View style={styles.card}>
            <DeviceSourceRows alertTitle={t("heartLog.title")} hint={t("heartLog.connectHint")} />
            <TouchableOpacity
              style={[styles.row, styles.divider]}
              onPress={() => router.push({ pathname: "/patient/settings/reminder", params: { type: "heart" } })}
              accessibilityRole="button"
            >
              <View style={styles.iconChip}>
                <Feather name="bell" size={18} color={Theme.colors.purple} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{t("heartLog.reminder")}</Text>
                <Text style={styles.rowSub}>{t("heartLog.reminderHint")}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Theme.colors.inkFaint} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <AddReadingButton label={t("metric.addReading")} onPress={() => setModalVisible(true)} />

        <HeartRateModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          reload={reload}
          initialHeartRate={latest?.date === todayStr && latest.source === "manual" ? latest.bpm : null}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginVertical: Theme.spacing.lg,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairlineLight,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
});
