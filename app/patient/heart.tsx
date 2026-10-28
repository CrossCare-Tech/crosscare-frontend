import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import HeartRateModal from "./modal/heartratemodal";

WebBrowser.maybeCompleteAuthSession();

type Source = "fitbit" | "apple" | "manual";

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

  const {
    isConnected: fitbitConnected,
    isLoading: fitbitLoading,
    connect: connectFitbit,
    disconnect: disconnectFitbit,
    getHeartRateData: getFitbitHeartRateData,
  } = useFitbit();

  const {
    isConnected: appleConnected,
    isLoading: appleLoading,
    connect: connectApple,
    disconnect: disconnectApple,
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
      } catch (error) {
        console.warn("Error fetching device heart rate:", error);
      }
      setDeviceReadings(readings);
    };
    loadDevices();
  }, [fitbitConnected, appleConnected]);

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

  const toggleDevice = async (
    name: string,
    connected: boolean,
    connect: () => Promise<boolean>,
    disconnect: () => Promise<void>
  ) => {
    if (connected) {
      await disconnect();
      Alert.alert(t("heartLog.title"), t("heartLog.disconnectedFrom", { name }));
      return;
    }
    const success = await connect();
    Alert.alert(
      t("heartLog.title"),
      success ? t("heartLog.connectedTo", { name }) : t("heartLog.connectFailed", { name })
    );
  };

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
    t(source === "fitbit" ? "heartLog.sourceFitbit" : source === "apple" ? "heartLog.sourceApple" : "metric.enteredByYou");
  const pill = (bpm: number) => {
    const category = getHeartCategory(bpm);
    return { label: t(`heartLog.${category.key}`), tone: category.tone };
  };

  const values = inRange.map((reading) => reading.bpm);

  const devices =
    Platform.OS === "ios"
      ? [{ name: "Apple Health", image: require("../../assets/images/applehealth.png"), connected: appleConnected, loading: appleLoading, connect: connectApple, disconnect: disconnectApple }]
      : [{ name: "Fitbit", image: require("../../assets/images/fitbit.png"), connected: fitbitConnected, loading: fitbitLoading, connect: connectFitbit, disconnect: disconnectFitbit }];

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
            {devices.map((device) => (
              <View key={device.name} style={styles.row}>
                <View style={styles.iconChip}>
                  <Image source={device.image} style={styles.deviceImage} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{device.name}</Text>
                  <Text style={styles.rowSub}>
                    {device.connected ? t("heartLog.connected") : t("heartLog.connectHint")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleDevice(device.name, device.connected, device.connect, device.disconnect)}
                  disabled={device.loading}
                  accessibilityRole="button"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.link}>
                    {device.loading
                      ? t("actions.Connecting")
                      : device.connected
                        ? t("actions.Disconnect")
                        : t("actions.Connect")}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
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
  deviceImage: {
    width: 22,
    height: 22,
  },
  link: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.magenta,
  },
});
