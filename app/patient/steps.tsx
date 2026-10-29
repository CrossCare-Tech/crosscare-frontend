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
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import { useFitbit } from "@/zustandStore/useFitbitStore";
import { useAppleHealth } from "@/zustandStore/useAppleHealthStore";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { Pill, ReadingModal } from "@/components/vitals/VitalsUI";
import {
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
  SectionLabel,
  Segmented,
  toLocalDay,
  useActivityHistory,
} from "@/components/vitals/MetricUI";

WebBrowser.maybeCompleteAuthSession();

type Source = "fitbit" | "apple" | "app";

interface Day {
  date: string; // YYYY-MM-DD, the patient's day
  steps: number;
  source: Source;
}

const DEFAULT_GOAL = 8000;
const BAR_WIDTH: Record<Period, number> = { "7": 14, "30": 6, "90": 3 };

// Fitbit and Apple Health both answer with `activities-steps` entries
const fromDevice = (data: any, source: Source): Day[] =>
  (data?.["activities-steps"] || [])
    .map((item: any) => {
      const steps = parseInt(item?.value, 10);
      return item?.dateTime && steps > 0 ? { date: String(item.dateTime).slice(0, 10), steps, source } : null;
    })
    .filter(Boolean);

// Steps: today against the goal, history, and the device that counts them
export default function StepsScreen() {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  const { t, i18n } = useTranslation();
  const { activities, loading, reload } = useActivityHistory();
  const [period, setPeriod] = useState<Period>("7");
  const [deviceDays, setDeviceDays] = useState<Day[]>([]);
  const [goalVisible, setGoalVisible] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);

  const {
    isConnected: fitbitConnected,
    isLoading: fitbitLoading,
    connect: connectFitbit,
    disconnect: disconnectFitbit,
    getDataForRange: getFitbitRange,
    syncStepsGoalWithBackend: syncFitbitGoal,
  } = useFitbit();

  const {
    isConnected: appleConnected,
    isLoading: appleLoading,
    connect: connectApple,
    disconnect: disconnectApple,
    checkConnection: checkAppleConnection,
    getDataForRange: getAppleRange,
    syncStepsWithBackend: syncAppleSteps,
    syncStepsGoalWithBackend: syncAppleGoal,
  } = useAppleHealth();

  useEffect(() => {
    AsyncStorage.setItem("step_6", "true");
  }, [userId]);

  useEffect(() => {
    if (Platform.OS === "ios") checkAppleConnection();
  }, []);

  // Pull the last 90 days from the connected device, and keep today's total and goal in the API
  useEffect(() => {
    const loadDevice = async () => {
      if (!userId) return;
      const start = fmtDate(daysAgo(89));
      const end = fmtDate(new Date());
      try {
        if (Platform.OS === "ios" && appleConnected) {
          setDeviceDays(fromDevice(await getAppleRange("activities/steps", start, end), "apple"));
          await syncAppleSteps(userId);
          await syncAppleGoal(userId);
          reload();
        } else if (Platform.OS !== "ios" && fitbitConnected) {
          const days = fromDevice(await getFitbitRange("activities/steps", start, end), "fitbit");
          setDeviceDays(days);
          const today = days.find((day) => day.date === end);
          if (today) {
            await fetch(`${CONFIG.API_BASE_URL}/user/activity/${userId}/steps`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ steps: today.steps }),
            });
          }
          await syncFitbitGoal(userId);
          reload();
        } else {
          setDeviceDays([]);
        }
      } catch (error) {
        console.warn("Error fetching device steps:", error);
      }
    };
    loadDevice();
  }, [fitbitConnected, appleConnected, userId]);

  // Steps logged in the app (or by the Concierge) come from the activity list; the device wins on the same day
  const byDate = new Map<string, Day>();
  let goal = 0;
  activities.forEach((activity) => {
    const date = toLocalDay(activity.date);
    if (activity.details?.steps > 0) byDate.set(date, { date, steps: activity.details.steps, source: "app" });
    if (activity.details?.stepsGoal > 0) goal = activity.details.stepsGoal; // the list is oldest first
  });
  deviceDays.forEach((day) => byDate.set(day.date, day));
  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  goal = goal || DEFAULT_GOAL;

  const todayStr = fmtDate(daysAgo(0));
  const today = byDate.get(todayStr);
  const count = today?.steps ?? 0;
  const left = Math.max(goal - count, 0);
  const number = (value: number) => value.toLocaleString(i18n.language);

  const dayLabel = (date: string) => {
    if (date === todayStr) return t("bloodPressureLog.today");
    if (date === fmtDate(daysAgo(1))) return t("bloodPressureLog.yesterday");
    return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  };
  const sourceLabel = (source: Source) =>
    t(source === "fitbit" ? "heartLog.sourceFitbit" : source === "apple" ? "heartLog.sourceApple" : "stepsLog.sourceApp");

  const toggleDevice = async (
    name: string,
    connected: boolean,
    connect: () => Promise<boolean>,
    disconnect: () => Promise<void>
  ) => {
    if (connected) {
      await disconnect();
      Alert.alert(t("stepsLog.title"), t("heartLog.disconnectedFrom", { name }));
      return;
    }
    const success = await connect();
    Alert.alert(
      t("stepsLog.title"),
      success ? t("heartLog.connectedTo", { name }) : t("heartLog.connectFailed", { name })
    );
  };

  const openGoal = () => {
    setGoalDraft(String(goal));
    setGoalVisible(true);
  };

  const saveGoal = async () => {
    const value = Number(goalDraft);
    if (!Number.isInteger(value) || value < 1000 || value > 50000) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("stepsLog.goalInvalid"));
      return;
    }
    setGoalSaving(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/user/activity/${userId}/stepsGoal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepsGoal: value }),
      });
      if (!response.ok) throw new Error(`API returned status ${response.status}`);
      setGoalVisible(false);
      reload();
    } catch (error: any) {
      console.warn("Error saving steps goal:", error?.message);
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
    } finally {
      setGoalSaving(false);
    }
  };

  const range = periodWindow(period);
  const inRange = days.filter((day) => range.contains(day.date));
  const chartMax = Math.max(goal, ...inRange.map((day) => day.steps)) * 1.1;

  const devices =
    Platform.OS === "ios"
      ? [{ name: "Apple Health", image: require("../../assets/images/applehealth.png"), connected: appleConnected, loading: appleLoading, connect: connectApple, disconnect: disconnectApple }]
      : [{ name: "Fitbit", image: require("../../assets/images/fitbit.png"), connected: fitbitConnected, loading: fitbitLoading, connect: connectFitbit, disconnect: disconnectFitbit }];

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("stepsLog.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          {loading && activities.length === 0 ? (
            <ActivityIndicator color={Theme.colors.magenta} style={styles.loader} />
          ) : (
            <View style={[metricParts.card, metricParts.hero, styles.today]}>
              <Text style={metricParts.when}>
                {today ? `${t("bloodPressureLog.today")} · ${sourceLabel(today.source)}` : t("bloodPressureLog.today")}
              </Text>
              <View style={styles.countRow}>
                <Text style={metricParts.big}>{number(count)}</Text>
                <Text style={metricParts.unit}>{t("stepsLog.ofGoal", { goal: number(goal) })}</Text>
              </View>
              <View style={styles.track}>
                <LinearGradient
                  colors={Theme.home.bars.steps}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.fill, { width: `${Math.min(count / goal, 1) * 100}%` }]}
                />
              </View>
              <View style={styles.metaRow}>
                <Pill
                  label={left === 0 ? t("waterLog.goalReached") : t("stepsLog.toGo", { value: number(left) })}
                  tone={left === 0 ? "success" : "teal"}
                />
                <TouchableOpacity onPress={openGoal} accessibilityRole="button" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.link}>{t("waterLog.editGoal")}</Text>
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

          <ChartCard axis={periodAxis(period, i18n.language)} legend={[{ mark: "line", label: t("stepsLog.legend") }]}>
            <RangeBarsChart
              bars={inRange.map((day) => ({ x: range.x(day.date), high: day.steps, low: 0 }))}
              min={0}
              max={chartMax}
              barWidth={BAR_WIDTH[period]}
            />
          </ChartCard>

          <GuideNote text={t("stepsLog.guide")} />

          {inRange.length > 0 && (
            <>
              <SectionLabel>{t("metric.recent")}</SectionLabel>
              <ReadingList
                items={[...inRange]
                  .reverse()
                  .slice(0, 7)
                  .map((day) => {
                    const met = day.steps >= goal;
                    return {
                      key: day.date,
                      value: t("stepsLog.steps", { value: number(day.steps) }),
                      when: `${dayLabel(day.date)} · ${sourceLabel(day.source)}`,
                      pill: { label: met ? t("waterLog.goalMet") : t("waterLog.belowGoal"), tone: met ? "success" : "teal" },
                    };
                  })}
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
                    {device.connected ? t("heartLog.connected") : t("stepsLog.connectHint")}
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
              onPress={() => router.push({ pathname: "/patient/settings/reminder", params: { type: "steps" } })}
              accessibilityRole="button"
            >
              <View style={styles.iconChip}>
                <Feather name="bell" size={18} color={Theme.colors.purple} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{t("stepsLog.reminder")}</Text>
                <Text style={styles.rowSub}>{t("stepsLog.reminderHint")}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Theme.colors.inkFaint} />
            </TouchableOpacity>
          </View>
        </ScrollView>

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
            label={t("stepsLog.goalLabel")}
            value={goalDraft}
            onChangeText={(value) => setGoalDraft(value.replace(/[^\d]/g, ""))}
            placeholder="8000"
            keyboardType="number-pad"
            maxLength={5}
          />
        </ReadingModal>
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
    fontSize: 13.5,
    color: Theme.colors.magenta,
  },
});
