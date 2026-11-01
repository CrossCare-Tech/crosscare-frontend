import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { Pill } from "@/components/vitals/VitalsUI";
import { metricStyles } from "@/components/vitals/MetricUI";

type Appointment = { id: string; title: string; date: string };

// Prototype 10.3 "NextGen Sync Indicator": the sync state of the appointments with the NextGen system.
// ponytail: the API has no NextGen sync yet, so the status is simulated: the next appointment shows as synced and
// the one after it as still syncing. Replace with the real sync state once the backend reports it.
export default function NextGenSyncScreen() {
  const { t, i18n } = useTranslation();
  const user = useSelector((state: any) => state.user);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // The next two appointments, as in the prototype
  useFocusEffect(
    useCallback(() => {
      if (!user?.user_id) return;
      fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/appointments`)
        .then((response) => (response.ok ? response.json() : []))
        .then((data: Appointment[]) =>
          setAppointments(
            data
              .filter((appointment) => new Date(appointment.date) > new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 2)
          )
        )
        .catch(() => setAppointments([]));
    }, [user?.user_id])
  );

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("nextGen.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <View style={[styles.card, styles.hero]}>
            <View style={styles.heroIcon}>
              <Feather name="refresh-cw" size={24} color={Theme.colors.success} />
            </View>
            <Text style={styles.heroTitle}>{t("nextGen.synced")}</Text>
            <Text style={styles.heroSub}>{t("nextGen.upToDate", { when: t("nextGen.twoMinutes") })}</Text>
          </View>

          {appointments.length === 0 && <Text style={styles.empty}>{t("nextGen.empty")}</Text>}
          {appointments.map((appointment, index) => {
            const done = index === 0;
            const date = new Date(appointment.date).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
            return (
              <View key={appointment.id} style={[styles.card, styles.item]}>
                <Feather
                  name={done ? "check" : "clock"}
                  size={16}
                  color={done ? Theme.colors.success : Theme.colors.inkFaint}
                />
                <Text style={styles.itemText}>{`${appointment.title} · ${date}`}</Text>
                <Pill label={done ? t("devices.synced") : t("devices.syncingPill")} tone={done ? "success" : "neutral"} />
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  hero: {
    alignItems: "center",
    gap: 4,
    paddingTop: 22,
    paddingBottom: 18,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Theme.colors.successTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
    textAlign: "center",
  },
  heroSub: {
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Theme.colors.inkFaint,
    textAlign: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  itemText: {
    flex: 1,
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    lineHeight: 18,
    color: Theme.colors.ink,
  },
  empty: {
    fontFamily: Theme.typography.body,
    fontSize: 13,
    color: Theme.colors.inkFaint,
    textAlign: "center",
  },
});
