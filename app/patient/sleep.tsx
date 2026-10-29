import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { Pill } from "@/components/vitals/VitalsUI";
import { GuideNote, metricParts, metricStyles, useActivityHistory } from "@/components/vitals/MetricUI";

// Sleep: last night at a glance, then the log and the bedtime calculator
const SleepScreen = () => {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  const { t, i18n } = useTranslation();
  const { activities } = useActivityHistory();

  useEffect(() => {
    AsyncStorage.setItem("sleep_7", "true");
  }, [userId]);

  // Most recent night with both a start and an end
  const last = [...activities]
    .reverse()
    .map((activity) => activity.details?.sleep)
    .find((sleep) => sleep?.start && sleep?.end);
  const start = last ? new Date(last.start) : null;
  const end = last ? new Date(last.end) : null;
  const minutes = start && end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : 0;
  const hours = Math.floor(minutes / 60);
  const format = (date: Date) => date.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" });
  const enough = minutes >= 7 * 60;

  const actions = [
    {
      key: "track",
      icon: "moon" as const,
      title: t("sleepLog.trackTitle"),
      hint: t("sleepLog.trackHint"),
      onPress: () => router.push("/patient/tracksleep"),
    },
    {
      key: "bedtime",
      icon: "clock" as const,
      title: t("sleepLog.bedtimeTitle"),
      hint: t("sleepLog.bedtimeHint"),
      onPress: () => router.push("/patient/bedtime"),
    },
  ];

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("sleepScreen.sleep")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <View style={[metricParts.card, metricParts.hero, styles.hero]}>
            <Text style={metricParts.when}>{t("sleepLog.lastNight")}</Text>
            {start && end ? (
              <>
                <View style={styles.countRow}>
                  <Text style={metricParts.big}>{hours}</Text>
                  <Text style={metricParts.unit}>h</Text>
                  <Text style={metricParts.big}>{String(minutes % 60).padStart(2, "0")}</Text>
                  <Text style={metricParts.unit}>min</Text>
                </View>
                <View style={styles.metaRow}>
                  <Pill label={enough ? t("sleepLog.goodNight") : t("sleepLog.shortNight")} tone={enough ? "success" : "warning"} />
                  <Text style={styles.range}>
                    {format(start)} – {format(end)}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.empty}>{t("sleepLog.noNights")}</Text>
            )}
          </View>

          <View style={[metricParts.card, styles.list]}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={action.key}
                style={[styles.row, index > 0 && styles.divider]}
                onPress={action.onPress}
                accessibilityRole="button"
              >
                <View style={styles.iconChip}>
                  <Feather name={action.icon} size={18} color={Theme.colors.purple} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{action.title}</Text>
                  <Text style={styles.rowSub}>{action.hint}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Theme.colors.inkFaint} />
              </TouchableOpacity>
            ))}
          </View>

          <GuideNote text={t("sleepLog.guide")} />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default SleepScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  hero: {
    gap: 10,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  range: {
    fontFamily: Theme.typography.subheading,
    fontSize: 13,
    color: Theme.colors.inkFaint,
  },
  empty: {
    fontFamily: Theme.typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.inkSoft,
  },
  list: {
    paddingHorizontal: Theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairlineLight,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
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
});
