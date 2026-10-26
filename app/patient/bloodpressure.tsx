import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Svg, { Defs, LinearGradient as SvgGradient, Path, Polyline, Stop } from "react-native-svg";
import BloodPressureModal from "./modal/bloodpressuremodal";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import LineIcon from "@/components/profile/LineIcon";

interface BPRecord {
  date: string;
  systolic: number;
  diastolic: number;
}

type Tone = "success" | "warning" | "danger";

// Same ranges the app already used; the pill tone follows the prototype's semantic colors
const getBPCategory = (sys: number, dia: number): { key: string; tone: Tone } => {
  if (sys < 120 && dia < 80) return { key: "normal", tone: "success" };
  if (sys < 130 && dia < 80) return { key: "elevated", tone: "warning" };
  if (sys < 140 || dia < 90) return { key: "high1", tone: "warning" };
  return { key: "high2", tone: "danger" };
};

const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: Theme.colors.successTint, fg: Theme.colors.success },
  warning: { bg: Theme.colors.warningTint, fg: Theme.colors.warning },
  danger: { bg: Theme.colors.dangerTint, fg: Theme.colors.danger },
};

const Pill = ({ label, tone }: { label: string; tone: Tone }) => (
  <Text style={[styles.pill, { backgroundColor: TONES[tone].bg, color: TONES[tone].fg }]}>
    {label}
  </Text>
);

// Prototype sparkline: systolic values over the last readings (viewBox 260 x 64)
const Sparkline = ({ values }: { values: number[] }) => {
  if (values.length === 0) return null;
  const min = Math.min(...values) - 10;
  const max = Math.max(...values) + 10;
  const step = values.length > 1 ? 245 / (values.length - 1) : 0;
  const points = values
    .map((value, index) => {
      const x = values.length > 1 ? index * step : 122;
      const y = 56 - ((value - min) / (max - min)) * 48;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `M${points.split(" ").join(" L")} L${values.length > 1 ? 245 : 122},64 L0,64 Z`;

  return (
    <Svg width="100%" height={64} viewBox="0 0 260 64" preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={Theme.colors.magenta} stopOpacity={0.12} />
          <Stop offset="1" stopColor={Theme.colors.surface} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      {values.length > 1 && <Path d={area} fill="url(#sg)" />}
      <Polyline
        points={points}
        fill="none"
        stroke={Theme.colors.magenta}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// 5.1 — Blood Pressure Log
const BloodPressureScreen = () => {
  const user = useSelector((state: any) => state.user);
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState<BPRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchHistory = async () => {
    if (!user?.user_id || !user?.token) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/bpstatus`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch BP history (${res.status})`);
      }

      const data = await res.json();

      if (data?.data?.bloodPressureData) {
        const mapped = data.data.bloodPressureData.map((entry: any) => ({
          date: entry.date,
          systolic: entry.systolic ?? 0,
          diastolic: entry.diastolic ?? 0,
        }));
        setRecords(mapped);
      }
    } catch (e) {
      console.warn("Failed to fetch BP history:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [user?.token, user?.user_id])
  );

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = fmt(today);

  // Same UTC-midnight off-by-one workaround as before: detect by looking at
  // the most recent record that actually has a non-zero reading.
  const latestNonZero = [...records].reverse().find((r) => r.systolic > 0 || r.diastolic > 0);
  const shouldShift = !!latestNonZero && latestNonZero.date < todayStr;
  const shiftDate = (date: string) => {
    if (!shouldShift) return date;
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + 1);
    return fmt(d);
  };

  // Days with a reading, oldest first
  const readings = records
    .filter((r) => r.systolic > 0 || r.diastolic > 0)
    .map((r) => ({ ...r, date: shiftDate(r.date) }));
  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const latestCategory = latest ? getBPCategory(latest.systolic, latest.diastolic) : null;

  const dayLabel = (date: string) => {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date === todayStr) return t("bloodPressureLog.today");
    if (date === fmt(yesterday)) return t("bloodPressureLog.yesterday");
    return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <AuthTopBar title={t("bloodPressureLog.title")} />
          <View style={styles.content}>
            {loading && readings.length === 0 ? (
              <ActivityIndicator color={Theme.colors.magenta} />
            ) : latest && latestCategory ? (
              <View style={styles.current}>
                <Text style={styles.currentLabel}>{t("bloodPressureLog.currentReading")}</Text>
                <Text style={styles.currentValue}>
                  {latest.systolic}
                  <Text style={styles.currentDiastolic}>/{latest.diastolic}</Text>
                </Text>
                <Pill
                  label={
                    latestCategory.key === "normal"
                      ? t("bloodPressureLog.normalRange")
                      : t(`bloodPressureLog.${latestCategory.key}`)
                  }
                  tone={latestCategory.tone}
                />
              </View>
            ) : (
              <Text style={styles.empty}>{t("bloodPressureLog.noReadings")}</Text>
            )}

            {readings.length > 0 && (
              <>
                <View style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionLabel}>{t("bloodPressureLog.lastReadings")}</Text>
                    <LineIcon size={16} color={Theme.colors.ink}>
                      <Path d="M4 16l5-5 4 4 7-8" />
                      <Path d="M15 6h5v5" />
                    </LineIcon>
                  </View>
                  <Sparkline values={readings.map((r) => r.systolic)} />
                </View>

                <View style={[styles.card, styles.listCard]}>
                  {[...readings].reverse().map((r, index, list) => {
                    const category = getBPCategory(r.systolic, r.diastolic);
                    return (
                      <View
                        key={r.date}
                        style={[styles.reading, index === list.length - 1 && styles.readingLast]}
                      >
                        <Text style={styles.readingDate}>{dayLabel(r.date)}</Text>
                        <Text style={styles.readingValue}>
                          {r.systolic}/{r.diastolic}
                        </Text>
                        <Pill label={t(`bloodPressureLog.${category.key}`)} tone={category.tone} />
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>{t("bloodPressureLog.logNew")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BloodPressureModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          reload={fetchHistory}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default BloodPressureScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: Theme.spacing.xl,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    gap: 18,
  },
  current: {
    alignItems: "center",
  },
  currentLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkSoft,
  },
  currentValue: {
    fontFamily: Theme.typography.display,
    fontSize: 40,
    lineHeight: 48,
    color: Theme.colors.ink,
    marginVertical: 2,
  },
  currentDiastolic: {
    fontSize: 22,
    color: Theme.colors.inkFaint,
  },
  empty: {
    fontFamily: Theme.typography.body,
    fontSize: 13,
    color: Theme.colors.inkFaint,
    textAlign: "center",
    paddingVertical: Theme.spacing.lg,
  },
  pill: {
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    ...Theme.shadows.card,
  },
  listCard: {
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Theme.spacing.sm,
  },
  sectionLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkFaint,
  },
  reading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  readingLast: {
    borderBottomWidth: 0,
  },
  readingDate: {
    flex: 1,
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    color: Theme.colors.inkSoft,
  },
  readingValue: {
    flex: 1,
    textAlign: "center",
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
  button: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.surface,
  },
});
