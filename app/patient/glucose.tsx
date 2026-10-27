import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Path } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlucoseModal, { GLUCOSE_CONTEXTS } from "./modal/glucosemodal";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import LineIcon from "@/components/profile/LineIcon";
import { Pill, Sparkline, Tone } from "@/components/vitals/VitalsUI";

interface GlucoseEntry {
  day: string;
  date: string;
  glucoseLevel: number | null;
  glucoseUnit: string;
  glucoseMealContext: string | null;
}

interface GlucoseStatusResponse {
  message?: string;
  data: {
    glucoseData: GlucoseEntry[];
    lastGlucose: number | null;
    glucoseUnit: string;
    glucoseMealContext: string | null;
    todayGlucose: number | null;
    todayGlucoseUnit: string;
    todayGlucoseMealContext: string | null;
  };
}

// Pregnancy glucose targets (ACOG): fasting below 95 mg/dL, after meals below 140 mg/dL.
// Readings that are not marked as fasting use the after-meal target.
const getGlucoseCategory = (
  level: number,
  unit: string,
  context: string | null
): { key: string; tone: Tone } => {
  const mgdl = unit?.toLowerCase().includes("mmol") ? level * 18 : level;
  if (mgdl < 70) return { key: "low", tone: "warning" };
  const limit = context === "Fasting" ? 95 : 140;
  return mgdl < limit ? { key: "normal", tone: "success" } : { key: "elevated", tone: "warning" };
};

// 5.2 — Glucose Log
const GlucoseScreen = () => {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  const token = user?.token;
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [glucoseData, setGlucoseData] = useState<GlucoseEntry[]>([]);
  const [glucoseUnit, setGlucoseUnit] = useState("mg/dL");
  const [todayGlucose, setTodayGlucose] = useState<number | null>(null);
  const [todayMealContext, setTodayMealContext] = useState<string | null>(null);

  useEffect(() => {
    const setVisited = async () => {
      await AsyncStorage.setItem("glucose", "true");
    };

    setVisited();
  }, [userId]);

  const getGlucoseStatus = async () => {
    if (!userId || !token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/activity/${userId}/glucosestatus`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch glucose status (${response.status})`);
      }

      const result: GlucoseStatusResponse = await response.json();

      if (!result?.data) {
        throw new Error("Unexpected server response while fetching glucose status.");
      }

      setGlucoseData(result.data.glucoseData || []);
      setGlucoseUnit(result.data.glucoseUnit || "mg/dL");
      setTodayGlucose(result.data.todayGlucose ?? null);
      setTodayMealContext(result.data.todayGlucoseMealContext || null);
    } catch (error) {
      setGlucoseData([]);
      setGlucoseUnit("mg/dL");
      setTodayGlucose(null);
      setTodayMealContext(null);
      console.warn("Error fetching glucose status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getGlucoseStatus();
  }, [token, userId]);

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = fmt(today);

  // Same UTC-midnight off-by-one workaround as before: detect by looking at
  // the most recent entry that actually has a reading.
  const latestWithReading = [...glucoseData].reverse().find((entry) => entry.glucoseLevel !== null);
  const shouldShift = !!latestWithReading && latestWithReading.date < todayStr;
  const shiftDate = (date: string) => {
    if (!shouldShift) return date;
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + 1);
    return fmt(d);
  };

  // Days with a reading, oldest first
  const readings = glucoseData
    .filter((entry) => entry.glucoseLevel !== null)
    .map((entry) => ({ ...entry, date: shiftDate(entry.date), level: entry.glucoseLevel as number }));
  const latest = readings.length > 0 ? readings[readings.length - 1] : null;

  const contextLabel = (context: string | null) => {
    const option = GLUCOSE_CONTEXTS.find((item) => item.value === context);
    return option ? t(`vitalsEntry.${option.key}`).toLowerCase() : null;
  };

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

  const latestCategory = latest
    ? getGlucoseCategory(latest.level, latest.glucoseUnit || glucoseUnit, latest.glucoseMealContext)
    : null;
  const latestContext = latest ? contextLabel(latest.glucoseMealContext) : null;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <AuthTopBar title={t("glucoseLog.title")} />
          <View style={styles.content}>
            {isLoading && readings.length === 0 ? (
              <ActivityIndicator color={Theme.colors.magenta} />
            ) : latest && latestCategory ? (
              <View style={styles.current}>
                <Text style={styles.currentLabel}>
                  {t("glucoseLog.currentReading")}
                  {latestContext ? ` · ${latestContext}` : ""}
                </Text>
                <Text style={styles.currentValue}>
                  {latest.level}
                  <Text style={styles.currentUnit}> {latest.glucoseUnit || glucoseUnit}</Text>
                </Text>
                <Pill
                  label={
                    latestCategory.key === "normal"
                      ? t("glucoseLog.normalRange")
                      : t(`glucoseLog.${latestCategory.key}`)
                  }
                  tone={latestCategory.tone}
                />
              </View>
            ) : (
              <Text style={styles.empty}>{t("glucoseLog.noReadings")}</Text>
            )}

            {readings.length > 0 && (
              <>
                <View style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionLabel}>{t("glucoseLog.lastReadings")}</Text>
                    <LineIcon size={16} color={Theme.colors.ink}>
                      <Path d="M4 16l5-5 4 4 7-8" />
                      <Path d="M15 6h5v5" />
                    </LineIcon>
                  </View>
                  <Sparkline values={readings.map((entry) => entry.level)} />
                </View>

                <View style={[styles.card, styles.listCard]}>
                  {[...readings].reverse().map((entry, index, list) => {
                    const unit = entry.glucoseUnit || glucoseUnit;
                    const category = getGlucoseCategory(entry.level, unit, entry.glucoseMealContext);
                    const context = contextLabel(entry.glucoseMealContext);
                    return (
                      <View
                        key={entry.date}
                        style={[styles.reading, index === list.length - 1 && styles.readingLast]}
                      >
                        <Text style={styles.readingDate} numberOfLines={1}>
                          {dayLabel(entry.date)}
                          {context ? `, ${context}` : ""}
                        </Text>
                        <Text style={styles.readingValue}>
                          {entry.level} {unit}
                        </Text>
                        <Pill label={t(`glucoseLog.${category.key}`)} tone={category.tone} />
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
              <Text style={styles.buttonText}>{t("glucoseLog.logNew")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <GlucoseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          reload={getGlucoseStatus}
          initialGlucoseLevel={todayGlucose}
          initialMealContext={todayMealContext}
          initialGlucoseUnit={glucoseUnit}
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
  currentUnit: {
    fontSize: 18,
    color: Theme.colors.inkFaint,
  },
  empty: {
    fontFamily: Theme.typography.body,
    fontSize: 13,
    color: Theme.colors.inkFaint,
    textAlign: "center",
    paddingVertical: Theme.spacing.lg,
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
    gap: Theme.spacing.sm,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  readingLast: {
    borderBottomWidth: 0,
  },
  readingDate: {
    flex: 1.3,
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
