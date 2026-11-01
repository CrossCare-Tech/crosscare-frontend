import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthTopBar from "@/components/ui/AuthTopBar";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { wellbeingStyles as shared } from "@/components/wellbeing/WellbeingUI";
import { dateOf, dayKeyOf, summarizeCycle } from "@/components/wellbeing/model";
import { Theme } from "@/constants/theme";
import { useDemoWellbeing } from "@/utils/demo/demoWellbeing";

const CELL_GAP = 6;
const CELL_WIDTH = "14.28%";

// 9.3: month view with the periods, the fertile window and the next prediction. Past days open their log.
const CycleCalendarScreen = () => {
  const { t, i18n } = useTranslation();
  const logs = useDemoWellbeing((state) => state.cycleLogs);
  const now = new Date();
  const today = dayKeyOf(now);
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  const summary = useMemo(() => summarizeCycle(logs, today), [logs, today]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const cells = useMemo(() => {
    const blanks: (string | null)[] = Array.from({ length: month.getDay() }, () => null);
    const count = new Date(year, monthIndex + 1, 0).getDate();
    const days = Array.from({ length: count }, (_, index) => dayKeyOf(new Date(year, monthIndex, index + 1)));
    return [...blanks, ...days];
  }, [month, year, monthIndex]);

  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Date(2026, 1, 1 + index).toLocaleDateString(i18n.language, { weekday: "narrow" }) // Feb 1, 2026 is a Sunday
      ),
    [i18n.language]
  );

  const shortDate = (key: string) => dateOf(key).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });

  return (
    <ScreenBackground>
      <SafeAreaView style={shared.safeArea}>
        <AuthTopBar title={t("wellbeingCare.cycleCalendar")} />
        <ScrollView contentContainerStyle={shared.content} showsVerticalScrollIndicator={false}>
          <View style={styles.monthRow}>
            <TouchableOpacity
              onPress={() => setMonth(new Date(year, monthIndex - 1, 1))}
              accessibilityRole="button"
              accessibilityLabel={t("wellbeingCare.previousMonth")}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="chevron-left" size={18} color={Theme.colors.ink} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {month.toLocaleDateString(i18n.language, { month: "long", year: "numeric" })}
            </Text>
            <TouchableOpacity
              onPress={() => setMonth(new Date(year, monthIndex + 1, 1))}
              accessibilityRole="button"
              accessibilityLabel={t("wellbeingCare.nextMonth")}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="chevron-right" size={18} color={Theme.colors.ink} />
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {weekdays.map((label, index) => (
              <View key={index} style={styles.labelCell}>
                <Text style={styles.weekday}>{label}</Text>
              </View>
            ))}
            {cells.map((key, index) => {
              if (!key) return <View key={`blank-${index}`} style={styles.cellSlot} />;
              const kind = summary.days[key];
              const isFuture = key > today;
              return (
                <View key={key} style={styles.cellSlot}>
                  <TouchableOpacity
                    style={[
                      styles.cell,
                      kind === "period" && styles.cellPeriod,
                      kind === "fertile" && styles.cellFertile,
                      kind === "predicted" && styles.cellPredicted,
                      key === today && kind !== "period" && styles.cellToday,
                    ]}
                    disabled={isFuture}
                    onPress={() => router.push({ pathname: "/patient/wellbeing/cycle-log", params: { day: key } })}
                    accessibilityRole="button"
                    accessibilityLabel={[
                      dateOf(key).toLocaleDateString(i18n.language, { month: "long", day: "numeric" }),
                      kind ? t(`wellbeingCare.legend.${kind}`) : "",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        kind === "period" && styles.cellTextPeriod,
                        kind === "fertile" && styles.cellTextFertile,
                        kind === "predicted" && styles.cellTextPredicted,
                      ]}
                    >
                      {dateOf(key).getDate()}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.cellPeriod]} />
              <Text style={styles.legendText}>{t("wellbeingCare.legend.period")}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendFertile]} />
              <Text style={styles.legendText}>{t("wellbeingCare.legend.fertile")}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.cellPredicted]} />
              <Text style={styles.legendText}>{t("wellbeingCare.legend.predicted")}</Text>
            </View>
          </View>

          <View style={shared.card}>
            <Text style={shared.cardTitle}>{t("wellbeingCare.nextPeriod")}</Text>
            <Text style={shared.cardText}>
              {summary.nextStart && summary.nextEnd
                ? t("wellbeingCare.nextPeriodRange", {
                    from: shortDate(summary.nextStart),
                    to: shortDate(summary.nextEnd),
                    count: summary.cycleCount,
                  })
                : t("wellbeingCare.nextPeriodEmpty")}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default CycleCalendarScreen;

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthTitle: {
    fontSize: 14,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  labelCell: {
    width: CELL_WIDTH,
    alignItems: "center",
    paddingBottom: CELL_GAP,
  },
  weekday: {
    fontSize: 11,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkFaint,
  },
  cellSlot: {
    width: CELL_WIDTH,
    aspectRatio: 1,
    padding: CELL_GAP / 2,
  },
  cell: {
    flex: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cellPeriod: {
    backgroundColor: Theme.colors.magenta,
  },
  cellFertile: {
    backgroundColor: Theme.colors.tealTint,
  },
  cellPredicted: {
    borderWidth: 1.6,
    borderStyle: "dashed",
    borderColor: Theme.colors.magenta,
  },
  cellToday: {
    borderWidth: 1.6,
    borderColor: Theme.colors.purple,
  },
  cellText: {
    fontSize: 13,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.ink,
  },
  cellTextPeriod: {
    color: Theme.colors.surface,
  },
  cellTextFertile: {
    color: Theme.colors.teal,
  },
  cellTextPredicted: {
    color: Theme.colors.magenta,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendFertile: {
    backgroundColor: Theme.colors.tealTint,
    borderWidth: 1.5,
    borderColor: Theme.colors.teal,
  },
  legendText: {
    fontSize: 11,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
  },
});
