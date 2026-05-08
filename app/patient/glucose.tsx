import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlucoseModal from "./modal/glucosemodal";
import { CONFIG } from "@/constants/config";

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

const MAX_HEIGHT = 200;
const BAR_WIDTH = 28;
const SPACING = (Dimensions.get("window").width - BAR_WIDTH * 10) / 8;

const GlucoseScreen = () => {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  const token = user?.token;
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [glucoseData, setGlucoseData] = useState<GlucoseEntry[]>([]);
  const [lastGlucose, setLastGlucose] = useState<number | null>(null);
  const [glucoseUnit, setGlucoseUnit] = useState("mg/dL");
  const [mealContext, setMealContext] = useState<string | null>(null);
  const [todayGlucose, setTodayGlucose] = useState<number | null>(null);
  const [todayGlucoseUnit, setTodayGlucoseUnit] = useState("mg/dL");
  const [todayMealContext, setTodayMealContext] = useState<string | null>(null);

  const { yAxisLabels, roundedMax } = useMemo(() => {
    const maxGlucose = Math.max(...glucoseData.map((item) => item.glucoseLevel ?? 0), 120);
    const rounded = Math.ceil(maxGlucose / 20) * 20;
    const step = rounded <= 120 ? 20 : Math.ceil(rounded / 4 / 10) * 10;
    const labels = [];

    for (let value = 0; value <= rounded; value += step) {
      labels.push(value);
    }

    return {
      yAxisLabels: labels.reverse(),
      roundedMax: rounded,
    };
  }, [glucoseData]);

  const chartData = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const todayStr = fmt(today);

    // Backend stores activities at UTC midnight then formats dates with local
    // components, which produces dates one day before the actual local logging
    // day for users west of UTC during most hours. Detect by looking at the
    // most recent entry that actually has a value: if its date string is
    // strictly before today, the off-by-one is active and we shift everything
    // forward by 1 for column matching.
    const latestNonNull = [...glucoseData]
      .reverse()
      .find((e) => e.glucoseLevel != null);
    const shouldShift = !!latestNonNull && latestNonNull.date < todayStr;
    const dataByDate = new Map<string, GlucoseEntry>();
    glucoseData.forEach((entry) => {
      let key = entry.date;
      if (shouldShift) {
        const d = new Date(`${entry.date}T12:00:00`);
        d.setDate(d.getDate() + 1);
        key = fmt(d);
      }
      dataByDate.set(key, entry);
    });

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = fmt(d);
      const entry = dataByDate.get(dateStr);
      return {
        date: dateStr,
        glucoseLevel: entry?.glucoseLevel ?? null,
        glucoseUnit: entry?.glucoseUnit ?? "mg/dL",
        glucoseMealContext: entry?.glucoseMealContext ?? null,
        displayDay: d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
      };
    });
  }, [glucoseData]);

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
      setLastGlucose(result.data.lastGlucose ?? null);
      setGlucoseUnit(result.data.glucoseUnit || "mg/dL");
      setMealContext(result.data.glucoseMealContext || null);
      setTodayGlucose(result.data.todayGlucose ?? null);
      setTodayGlucoseUnit(result.data.todayGlucoseUnit || "mg/dL");
      setTodayMealContext(result.data.todayGlucoseMealContext || null);
    } catch (error) {
      setGlucoseData([]);
      setLastGlucose(null);
      setGlucoseUnit("mg/dL");
      setMealContext(null);
      setTodayGlucose(null);
      setTodayGlucoseUnit("mg/dL");
      setTodayMealContext(null);
      console.warn("Error fetching glucose status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getGlucoseStatus();
  }, [token, userId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="chart-line" size={28} color="#8E44AD" />
          <Text style={styles.title}>Glucose</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Latest Reading</Text>
          <Text style={styles.summaryValue}>
            {lastGlucose !== null ? `${lastGlucose} ${glucoseUnit}` : "No readings yet"}
          </Text>
          {mealContext ? <Text style={styles.summaryHint}>{mealContext}</Text> : null}
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>
            {todayGlucose !== null ? "Edit Today's Reading" : "Add Glucose Reading"}
          </Text>
        </TouchableOpacity>

        <View style={styles.analysisContainer}>
          <View style={styles.analysisHeader}>
            <View style={styles.analysisTab}>
              <MaterialCommunityIcons name="chart-bar" size={18} color="#C084FC" />
              <Text style={styles.analysisTabText}>Analysis</Text>
            </View>
            <View style={styles.periodSelector}>
              <Text style={styles.periodSelectorText}>Last 7 Days</Text>
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#8E44AD" style={styles.loader} />
          ) : (
            <View style={styles.chartContainer}>
              <View style={styles.yAxisContainer}>
                {yAxisLabels.map((label) => (
                  <Text key={label} style={styles.yAxisLabel}>
                    {label}
                  </Text>
                ))}
              </View>

              <View style={styles.chartArea}>
                {yAxisLabels.map((_, index) => (
                  <View
                    key={`grid-${index}`}
                    style={[
                      styles.gridLine,
                      { top: (MAX_HEIGHT / (yAxisLabels.length - 1 || 1)) * index },
                    ]}
                  />
                ))}

                <View style={styles.barsRow}>
                  {chartData.map((entry) => {
                    const hasReading = entry.glucoseLevel !== null;
                    const height =
                      hasReading && roundedMax > 0
                        ? Math.max(((entry.glucoseLevel ?? 0) / roundedMax) * MAX_HEIGHT, 2)
                        : 0;

                    return (
                      <View key={entry.date} style={styles.barColumn}>
                        <View
                          style={[
                            styles.bar,
                            hasReading ? { height } : styles.emptyBar,
                          ]}
                        />
                        <Text style={styles.barLabel}>{entry.displayDay}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <GlucoseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        reload={getGlucoseStatus}
        initialGlucoseLevel={todayGlucose}
        initialMealContext={todayMealContext}
        initialGlucoseUnit={todayGlucoseUnit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "DMSans700",
    color: "#1B2559",
  },
  summaryCard: {
    backgroundColor: "#F8F1FC",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "Inter500",
    color: "#8E44AD",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontFamily: "DMSans700",
    color: "#1B2559",
  },
  summaryHint: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter400",
  },
  addButton: {
    backgroundColor: "#8E44AD",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter600",
  },
  loader: {
    marginTop: 32,
  },
  analysisContainer: {
    marginTop: 8,
    paddingBottom: 24,
  },
  analysisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  analysisTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  analysisTabText: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#1B2559",
  },
  periodSelector: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    backgroundColor: "#FAF5FF",
  },
  periodSelectorText: {
    color: "#A855F7",
    fontFamily: "Inter500",
    fontSize: 14,
  },
  chartContainer: {
    flexDirection: "row",
    minHeight: MAX_HEIGHT + 30,
  },
  yAxisContainer: {
    width: 34,
    height: MAX_HEIGHT,
    justifyContent: "space-between",
    marginRight: 8,
  },
  yAxisLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter400",
  },
  chartArea: {
    flex: 1,
    height: MAX_HEIGHT + 26,
    justifyContent: "flex-end",
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: MAX_HEIGHT + 22,
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: "center",
    width: BAR_WIDTH + SPACING / 2,
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: "#C084FC",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    minHeight: 2,
  },
  emptyBar: {
    backgroundColor: "transparent",
    minHeight: 0,
    height: 0,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter500",
  },
  entryValue: {
    fontSize: 16,
    fontFamily: "DMSans700",
    color: "#8E44AD",
  },
});

export default GlucoseScreen;
