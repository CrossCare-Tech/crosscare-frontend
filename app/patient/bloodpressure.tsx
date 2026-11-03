import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import BloodPressureModal from "./modal/bloodpressuremodal";
import { CONFIG } from "@/constants/config";

const { width } = Dimensions.get("window");

interface BPRecord {
  date: string;
  systolic: number;
  diastolic: number;
}

const BloodPressureScreen = () => {
  const user = useSelector((state: any) => state.user);
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

  const latest = records.length > 0 ? records[records.length - 1] : null;

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = fmt(today);

  // Same UTC-midnight off-by-one workaround as glucose: detect by looking at
  // the most recent record that actually has a non-zero reading.
  const latestNonZero = [...records]
    .reverse()
    .find((r) => r.systolic > 0 || r.diastolic > 0);
  const shouldShift = !!latestNonZero && latestNonZero.date < todayStr;
  const recordsByDate = new Map<string, BPRecord>();
  records.forEach((r) => {
    let key = r.date;
    if (shouldShift) {
      const d = new Date(`${r.date}T12:00:00`);
      d.setDate(d.getDate() + 1);
      key = fmt(d);
    }
    recordsByDate.set(key, r);
  });

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = fmt(d);
    const record = recordsByDate.get(dateStr);
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
      date: dateStr,
      systolic: record?.systolic ?? 0,
      diastolic: record?.diastolic ?? 0,
    };
  });

  const maxVal = Math.max(...chartData.map((d) => d.systolic || 0), 160);
  const BAR_WIDTH = 18;
  const MAX_BAR_HEIGHT = 160;

  const getBPCategory = (sys: number, dia: number) => {
    if (sys < 120 && dia < 80) return { label: "Normal", color: "#4CAF50" };
    if (sys < 130 && dia < 80) return { label: "Elevated", color: "#FFC107" };
    if (sys < 140 || dia < 90) return { label: "High Stage 1", color: "#FF9800" };
    return { label: "High Stage 2", color: "#F44336" };
  };

  const category = latest ? getBPCategory(latest.systolic, latest.diastolic) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#373737" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blood Pressure</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={["#E57373", "#C62828"]} style={styles.card}>
          <Text style={styles.cardLabel}>Latest Reading</Text>
          {latest ? (
            <>
              <Text style={styles.cardValue}>
                {latest.systolic}/{latest.diastolic}
                <Text style={styles.cardUnit}> mmHg</Text>
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: category?.color + "33" }]}>
                <Text style={[styles.categoryText, { color: "#fff" }]}>
                  {category?.label}
                </Text>
              </View>
              <Text style={styles.cardDate}>{latest.date}</Text>
            </>
          ) : (
            <Text style={styles.noDataText}>No readings yet</Text>
          )}
        </LinearGradient>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>
          {loading ? (
            <ActivityIndicator color="#E57373" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.chartContainer}>
              {chartData.map((item, index) => {
                const barHeight = maxVal > 0
                  ? Math.max((item.systolic / maxVal) * MAX_BAR_HEIGHT, item.systolic > 0 ? 6 : 0)
                  : 0;
                const diaHeight = maxVal > 0
                  ? Math.max((item.diastolic / maxVal) * MAX_BAR_HEIGHT, item.diastolic > 0 ? 4 : 0)
                  : 0;
                const hasData = item.systolic > 0;

                return (
                  <View key={index} style={styles.barColumn}>
                    <View style={styles.barsRow}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight || 4,
                            backgroundColor: hasData ? "#E57373" : "#f0f0f0",
                            width: BAR_WIDTH / 2 - 1,
                            borderRadius: 4,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.bar,
                          {
                            height: diaHeight || 4,
                            backgroundColor: hasData ? "#C62828" : "#f0f0f0",
                            width: BAR_WIDTH / 2 - 1,
                            borderRadius: 4,
                          },
                        ]}
                      />
                    </View>
                    {hasData && (
                      <Text style={styles.barValue}>{item.systolic}</Text>
                    )}
                    <Text style={styles.barDay}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#E57373" }]} />
              <Text style={styles.legendText}>Systolic</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#C62828" }]} />
              <Text style={styles.legendText}>Diastolic</Text>
            </View>
          </View>
        </View>

        <View style={styles.referenceSection}>
          <Text style={styles.sectionTitle}>Reference Ranges</Text>
          {[
            { label: "Normal", range: "< 120/80", color: "#4CAF50" },
            { label: "Elevated", range: "120–129 / < 80", color: "#FFC107" },
            { label: "High Stage 1", range: "130–139 / 80–89", color: "#FF9800" },
            { label: "High Stage 2", range: "≥ 140 / ≥ 90", color: "#F44336" },
          ].map((ref) => (
            <View key={ref.label} style={styles.refRow}>
              <View style={[styles.refDot, { backgroundColor: ref.color }]} />
              <Text style={styles.refLabel}>{ref.label}</Text>
              <Text style={styles.refRange}>{ref.range}</Text>
            </View>
          ))}
        </View>

        {records.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>History</Text>
            {[...records].reverse().map((r, i) => (
              <View key={i} style={styles.historyRow}>
                <Ionicons name="heart" size={16} color="#E57373" />
                <Text style={styles.historyDate}>{r.date}</Text>
                <Text style={styles.historyValue}>
                  {r.systolic}/{r.diastolic} <Text style={styles.historyUnit}>mmHg</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Log</Text>
        </TouchableOpacity>
      </View>

      <BloodPressureModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        reload={fetchHistory}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontFamily: "DMSans600", color: "#373737" },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  cardLabel: { fontSize: 13, fontFamily: "DMSans400", color: "rgba(255,255,255,0.8)", marginBottom: 6 },
  cardValue: { fontSize: 48, fontFamily: "DMSans700", color: "#fff" },
  cardUnit: { fontSize: 16, fontFamily: "DMSans400", color: "rgba(255,255,255,0.8)" },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  categoryText: { fontSize: 13, fontFamily: "DMSans600" },
  cardDate: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 6, fontFamily: "DMSans400" },
  noDataText: { fontSize: 16, color: "rgba(255,255,255,0.7)", fontFamily: "DMSans400", marginTop: 8 },
  chartSection: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 15, fontFamily: "DMSans600", color: "#373737", marginBottom: 16 },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 200,
    paddingBottom: 8,
  },
  barColumn: { alignItems: "center", flex: 1 },
  barsRow: { flexDirection: "row", alignItems: "flex-end", gap: 1, justifyContent: "center" },
  bar: { alignSelf: "flex-end" },
  barValue: { fontSize: 8, color: "#E57373", fontFamily: "DMSans500", marginTop: 2 },
  barDay: { fontSize: 11, color: "#999", fontFamily: "DMSans400", marginTop: 2 },
  legend: { flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontFamily: "DMSans400", color: "#666" },
  referenceSection: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  refRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  refDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  refLabel: { fontSize: 13, fontFamily: "DMSans500", color: "#373737", width: 110 },
  refRange: { fontSize: 13, fontFamily: "DMSans400", color: "#666" },
  historySection: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 10,
  },
  historyDate: { flex: 1, fontSize: 13, fontFamily: "DMSans400", color: "#666" },
  historyValue: { fontSize: 15, fontFamily: "DMSans600", color: "#373737" },
  historyUnit: { fontSize: 12, fontFamily: "DMSans400", color: "#999" },
  addButtonContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E57373",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: "#E57373",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: { fontSize: 16, fontFamily: "DMSans600", color: "#fff" },
});

export default BloodPressureScreen;
