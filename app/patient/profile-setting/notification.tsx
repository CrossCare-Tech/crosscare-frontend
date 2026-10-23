import {
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import {
  areMedicationRemindersEnabled,
  generateDefaultReminders,
  loadReminders,
  requestNotificationPermissions,
  saveReminders,
  scheduleDailyReminder,
  setMedicationRemindersEnabled,
} from "@/utils/NotificationManager";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import InlineNotice from "@/components/ui/InlineNotice";
import Toggle from "@/components/profile/Toggle";

// Concierge suggestions and the weekly email do not exist yet; these toggles only
// remember the user's choice on the device until the features are built.
const PROACTIVE_SUGGESTIONS_KEY = "pref_proactive_suggestions";
const WEEKLY_SUMMARY_KEY = "pref_weekly_summary";

const Row = ({
  title,
  channel,
  value,
  onChange,
  disabled,
  isLast,
}: {
  title: string;
  channel: string;
  value: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  isLast?: boolean;
}) => (
  <View style={[styles.row, isLast && styles.rowLast]}>
    <View style={styles.rowText}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSub}>{channel}</Text>
    </View>
    <Toggle
      value={value}
      onChange={onChange}
      disabled={disabled}
      accessibilityLabel={title}
    />
  </View>
);

const NotificationSettings = () => {
  const { t } = useTranslation();

  const [permissionGranted, setPermissionGranted] = useState(true);
  const [medication, setMedication] = useState(true);
  const [hydration, setHydration] = useState(true);
  const [proactive, setProactive] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  const checkPermission = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === "granted");
    } catch (error) {
      console.error("Error checking notification permissions:", error);
    }
  }, []);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setMedication(await areMedicationRemindersEnabled());

        const reminders = await loadReminders();
        const water = (reminders.length ? reminders : generateDefaultReminders()).filter(
          (reminder) => reminder.type === "water"
        );
        setHydration(water.some((reminder) => reminder.enabled));

        const [savedProactive, savedWeekly] = await Promise.all([
          AsyncStorage.getItem(PROACTIVE_SUGGESTIONS_KEY),
          AsyncStorage.getItem(WEEKLY_SUMMARY_KEY),
        ]);
        if (savedProactive !== null) setProactive(savedProactive === "true");
        if (savedWeekly !== null) setWeeklySummary(savedWeekly === "true");
      } catch (error) {
        console.error("Error loading notification preferences:", error);
      }
    };

    checkPermission();
    loadPreferences();

    // Re-check when the user comes back from the system settings
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") checkPermission();
    });
    return () => subscription.remove();
  }, [checkPermission]);

  const turnOnNotifications = async () => {
    const granted = await requestNotificationPermissions();
    if (granted) {
      setPermissionGranted(true);
    } else {
      // Android only shows the prompt once; after that it has to be changed in settings
      Linking.openSettings();
    }
  };

  const toggleMedication = async (value: boolean) => {
    setMedication(value);
    await setMedicationRemindersEnabled(value);
  };

  // Turns every daily water reminder on or off and (re)schedules them
  const toggleHydration = async (value: boolean) => {
    setHydration(value);
    try {
      const saved = await loadReminders();
      const reminders = (saved.length ? saved : generateDefaultReminders()).map(
        (reminder) =>
          reminder.type === "water" ? { ...reminder, enabled: value } : reminder
      );
      await saveReminders(reminders);
      for (const reminder of reminders.filter((r) => r.type === "water")) {
        await scheduleDailyReminder(reminder);
      }
    } catch (error) {
      console.error("Error updating hydration reminders:", error);
    }
  };

  const toggleLocalPreference =
    (key: string, setter: (value: boolean) => void) => (value: boolean) => {
      setter(value);
      AsyncStorage.setItem(key, String(value)).catch((error) =>
        console.error("Error saving notification preference:", error)
      );
    };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <AuthTopBar title={t("profile.notifications")} />
          <View style={styles.content}>
            {!permissionGranted && (
              <View style={styles.permission}>
                <InlineNotice
                  notice={{ message: t("profile.notificationsOffNotice"), variant: "info" }}
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={turnOnNotifications}
                  accessibilityRole="button"
                >
                  <Text style={styles.buttonText}>
                    {t("profile.turnOnNotifications")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionTitle}>{t("profile.healthReminders")}</Text>
            <View style={styles.card}>
              <Row
                title={t("profile.medicationReminders")}
                channel={t("profile.pushChannel")}
                value={medication}
                onChange={toggleMedication}
              />
              <Row
                title={t("profile.hydrationNudges")}
                channel={t("profile.pushChannel")}
                value={hydration}
                onChange={toggleHydration}
                isLast
              />
            </View>

            <Text style={styles.sectionTitle}>{t("profile.conciergeSection")}</Text>
            <View style={styles.card}>
              <Row
                title={t("profile.proactiveSuggestions")}
                channel={t("profile.pushChannel")}
                value={proactive}
                onChange={toggleLocalPreference(PROACTIVE_SUGGESTIONS_KEY, setProactive)}
              />
              <Row
                title={t("profile.weeklySummary")}
                channel={t("profile.emailChannel")}
                value={weeklySummary}
                onChange={toggleLocalPreference(WEEKLY_SUMMARY_KEY, setWeeklySummary)}
                isLast
              />
            </View>

            <Text style={styles.sectionTitle}>{t("profile.clinicalAlerts")}</Text>
            <View style={styles.card}>
              <Row
                title={t("profile.acogAlerts")}
                channel={t("profile.alwaysOn")}
                value
                disabled
                isLast
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default NotificationSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 18,
  },
  permission: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
    marginTop: 2,
    marginBottom: -6,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.body,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
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
