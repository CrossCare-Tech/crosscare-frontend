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
import BloodPressureModal from "./modal/bpmodal";

interface BloodPressureEntry {
  day: string;
  date: string;
  systolic: number | null;
  diastolic: number | null;
  unit: string;
}

interface BloodPressureStatusResponse {
  message?: string;
  data: {
    lastBloodPressure: {
      systolic: number;
      diastolic: number;
      unit: string;
    } | null;
    todayBloodPressure: {
      systolic: number;
      diastolic: number;
      unit: string;
    } | null;
    bloodPressureData: BloodPressureEntry[];
  };
}

const MAX_HEIGHT = 200;
const BAR_WIDTH = 10;
const BAR_GAP = 4;
const COLUMN_WIDTH = 28;
const SPACING = (Dimensions.get("window").width - COLUMN_WIDTH * 10) / 8;

const BloodPressureScreen = () => {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  const token = user?.token;
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bpData, setBpData] = useState<BloodPressureEntry[]>([]);
  const [lastBloodPressure, setLastBloodPressure] = useState<{
    systolic: number;
    diastolic: number;
    unit: string;
  } | null>(null);
  const [todayBloodPressure, setTodayBloodPressure] = useState<{
    systolic: number;
    diastolic: number;
    unit: string;
  } | null>(null);

  const { yAxisLabels, roundedMax } = useMemo(() => {
    const maxValue = Math.max(
      ...bpData.map((item) => Math.max(item.systolic ?? 0, item.diastolic ?? 0)),
      140
    );
    const rounded = Math.ceil(maxValue / 20) * 20;
    const labels = [];

    for (let value = 0; value <= rounded; value += 20) {
      labels.push(value);
    }

    return {
      yAxisLabels: labels.reverse(),
      roundedMax: rounded,
    };
  }, [bpData]);

  useEffect(() => {
    const setVisited = async () => {
      await AsyncStorage.setItem("blood-pressure", "true");
    };

    setVisited();
  }, [userId]);

  const getBloodPressureStatus = async () => {
    if (!userId || !token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/user/activity/${userId}/bpstatus`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result: BloodPressureStatusResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch blood pressure status");
      }

      setBpData(result.data.bloodPressureData || []);
      setLastBloodPressure(result.data.lastBloodPressure ?? null);
      setTodayBloodPressure(result.data.todayBloodPressure ?? null);
    } catch (error) {
      console.error("Error fetching blood pressure status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getBloodPressureStatus();
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
          <MaterialCommunityIcons name="heart-pulse" size={28} color="#EC4899" />
          <Text style={styles.title}>Blood Pressure</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Latest Reading</Text>
          <Text style={styles.summaryValue}>
            {lastBloodPressure
              ? `${lastBloodPressure.systolic}/${lastBloodPressure.diastolic} ${lastBloodPressure.unit}`
              : "No readings yet"}
          </Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>
            {todayBloodPressure ? "Edit Today's Reading" : "Add Blood Pressure"}
          </Text>
        </TouchableOpacity>

        <View style={styles.analysisContainer}>
          <View style={styles.analysisHeader}>
            <View style={styles.analysisTab}>
              <MaterialCommunityIcons name="chart-bar" size={18} color="#EC4899" />
              <Text style={styles.analysisTabText}>Analysis</Text>
            </View>
            <View style={styles.periodSelector}>
              <Text style={styles.periodSelectorText}>Last 7 Days</Text>
            </View>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#EC4899" }]} />
              <Text style={styles.legendText}>Systolic</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#F9A8D4" }]} />
              <Text style={styles.legendText}>Diastolic</Text>
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#EC4899" style={styles.loader} />
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
                  {bpData.map((entry) => {
                    const systolicHeight =
                      entry.systolic !== null
                        ? Math.max(((entry.systolic ?? 0) / roundedMax) * MAX_HEIGHT, 2)
                        : 0;
                    const diastolicHeight =
                      entry.diastolic !== null
                        ? Math.max(((entry.diastolic ?? 0) / roundedMax) * MAX_HEIGHT, 2)
                        : 0;

                    return (
                      <View key={entry.date} style={styles.barColumn}>
                        <View style={styles.bpBars}>
                          <View
                            style={[
                              styles.systolicBar,
                              systolicHeight > 0 ? { height: systolicHeight } : styles.emptyBar,
                            ]}
                          />
                          <View
                            style={[
                              styles.diastolicBar,
                              diastolicHeight > 0 ? { height: diastolicHeight } : styles.emptyBar,
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabel}>{entry.day}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <BloodPressureModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        reload={getBloodPressureStatus}
        initialSystolic={todayBloodPressure?.systolic ?? null}
        initialDiastolic={todayBloodPressure?.diastolic ?? null}
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
    backgroundColor: "#FFF1F6",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "Inter500",
    color: "#DB2777",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontFamily: "DMSans700",
    color: "#1B2559",
  },
  addButton: {
    backgroundColor: "#DB2777",
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
    marginBottom: 12,
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
    borderColor: "#F9A8D4",
    backgroundColor: "#FFF1F6",
  },
  periodSelectorText: {
    color: "#DB2777",
    fontFamily: "Inter500",
    fontSize: 14,
  },
  legendRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    marginLeft: 42,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter500",
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
    backgroundColor: "#FCE7F3",
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
    width: COLUMN_WIDTH + SPACING / 2,
  },
  bpBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: BAR_GAP,
    height: MAX_HEIGHT,
  },
  systolicBar: {
    width: BAR_WIDTH,
    backgroundColor: "#EC4899",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 2,
  },
  diastolicBar: {
    width: BAR_WIDTH,
    backgroundColor: "#F9A8D4",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
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
});

export default BloodPressureScreen;
