import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Circle, Path } from "react-native-svg";
import {
  areAppointmentRemindersEnabled,
  setAppointmentRemindersEnabled,
} from "../../utils/NotificationManager";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import LineIcon from "@/components/profile/LineIcon";
import { Pill } from "@/components/vitals/VitalsUI";
import AppointmentModal, { EditableAppointment } from "./modal/add-appointment";

// Define appointment type
interface Appointment {
  id: string;
  title: string;
  date: string;
  status?: "Completed" | "Upcoming";
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Sunday to Saturday of the current week, like the Home strip
const currentWeek = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

// 10.1 — Appointment Calendar
const Calendar = () => {
  const user = useSelector((state: any) => state.user);
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(true); // Default to enabled
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<EditableAppointment | null>(null);

  // Load reminder preference on mount
  useEffect(() => {
    const loadReminderPreference = async () => {
      try {
        const enabled = await areAppointmentRemindersEnabled();
        setRemindersEnabled(enabled);
      } catch (error) {
        console.error("Error loading reminder preference:", error);
      }
    };

    loadReminderPreference();
  }, []);

  // Toggle reminder setting
  const toggleReminders = async () => {
    try {
      const newValue = !remindersEnabled;
      setRemindersEnabled(newValue);
      await setAppointmentRemindersEnabled(newValue);
    } catch (error) {
      console.error("Error saving reminder preference:", error);
    }
  };

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const patientId = user.user_id;

      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/activity/${patientId}/appointments`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();

      // Process the appointments to add status
      const now = new Date();
      const processedAppointments = data.map((appointment: Appointment) => {
        const appointmentDate = new Date(appointment.date);
        const status = appointmentDate < now ? "Completed" : "Upcoming";
        return { ...appointment, status };
      });

      setAppointments(processedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", JSON.stringify(error, null, 2));
      setError(t("appointments.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Refresh every time the screen gets focus (also covers the first load)
  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const handleAddAppointment = () => {
    setEditing(null);
    setSheetVisible(true);
  };

  // Only upcoming appointments can be edited
  const handleAppointmentClick = (appointment: Appointment) => {
    if (appointment.status === "Upcoming") {
      setEditing({ id: appointment.id, title: appointment.title, date: appointment.date });
      setSheetVisible(true);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" });
  const formatShortDate = (date: Date) =>
    date.toLocaleDateString(i18n.language, { month: "short", day: "numeric" });

  const week = currentWeek();
  const byDate = (a: Appointment, b: Appointment) =>
    new Date(a.date).getTime() - new Date(b.date).getTime();
  const onSelectedDay = appointments
    .filter((appointment) => sameDay(new Date(appointment.date), selectedDay))
    .sort(byDate);
  const upcoming = appointments
    .filter((appointment) => appointment.status === "Upcoming" && !sameDay(new Date(appointment.date), selectedDay))
    .sort(byDate);
  const past = appointments
    .filter((appointment) => appointment.status === "Completed" && !sameDay(new Date(appointment.date), selectedDay))
    .sort((a, b) => byDate(b, a));

  const renderAppointment = (appointment: Appointment, showDate: boolean) => {
    const date = new Date(appointment.date);
    const when = showDate ? `${formatShortDate(date)}, ${formatTime(date)}` : formatTime(date);
    const isUpcoming = appointment.status === "Upcoming";
    return (
      <TouchableOpacity
        key={appointment.id}
        style={styles.row}
        onPress={() => handleAppointmentClick(appointment)}
        disabled={!isUpcoming}
        accessibilityRole={isUpcoming ? "button" : undefined}
      >
        <View style={styles.iconChip}>
          <LineIcon size={18} color={Theme.colors.purple}>
            <Path d="M5 3v5a5 5 0 0 0 10 0V3" />
            <Path d="M10 13v2.5a4.5 4.5 0 0 0 8.5 2" />
            <Circle cx="18.5" cy="16" r="2.2" />
          </LineIcon>
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {appointment.title}
          </Text>
          <Text style={styles.rowSub}>{when}</Text>
        </View>
        <Pill
          label={isUpcoming ? t("appointments.upcoming") : t("appointments.completed")}
          tone={isUpcoming ? "teal" : "success"}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("appointments.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Week selector */}
          <View style={styles.strip}>
            {week.map((day) => {
              const active = sameDay(day, selectedDay);
              const hasAppointment = appointments.some((appointment) =>
                sameDay(new Date(appointment.date), day)
              );
              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[styles.day, active && styles.dayActive]}
                  onPress={() => setSelectedDay(day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.dow, active && styles.dayTextActive]}>
                    {day.toLocaleDateString(i18n.language, { weekday: "short" }).replace(".", "").toUpperCase()}
                  </Text>
                  <Text style={[styles.dnum, active && styles.dayTextActive]}>{day.getDate()}</Text>
                  <View style={[styles.dot, hasAppointment && (active ? styles.dotOnActive : styles.dotOn)]} />
                </TouchableOpacity>
              );
            })}
          </View>

          {loading && appointments.length === 0 ? (
            <ActivityIndicator style={styles.loader} color={Theme.colors.magenta} />
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchAppointments} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>{t("appointments.retry")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>
                {selectedDay.toLocaleDateString(i18n.language, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
              {onSelectedDay.length > 0 ? (
                onSelectedDay.map((appointment) => renderAppointment(appointment, false))
              ) : (
                <Text style={styles.emptyDay}>{t("appointments.nothingBooked")}</Text>
              )}

              {upcoming.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>{t("appointments.upcoming")}</Text>
                  {upcoming.map((appointment) => renderAppointment(appointment, true))}
                </>
              )}

              {past.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>{t("appointments.past")}</Text>
                  {past.map((appointment) => renderAppointment(appointment, true))}
                </>
              )}
            </>
          )}

          {/* Appointment reminders */}
          <View style={styles.reminderCard}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t("appointments.reminders")}</Text>
              <Text style={styles.rowSub}>{t("appointments.remindersHint")}</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={toggleReminders}
              trackColor={{ false: Theme.colors.surfaceSunken, true: Theme.colors.magenta }}
              thumbColor={Theme.colors.surface}
            />
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddAppointment}
          accessibilityRole="button"
          accessibilityLabel={t("appointments.newTitle")}
        >
          <Ionicons name="add" size={26} color={Theme.colors.surface} />
        </TouchableOpacity>

        <AppointmentModal
          visible={sheetVisible}
          appointment={editing}
          onClose={() => setSheetVisible(false)}
          onSaved={fetchAppointments}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 180, // clears the floating avatar and the add button
    gap: 12,
  },
  strip: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 6,
  },
  day: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
  },
  dayActive: {
    backgroundColor: Theme.colors.magenta,
    borderColor: Theme.colors.magenta,
  },
  dow: {
    fontSize: 9.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkFaint,
  },
  dnum: {
    fontSize: 15,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  dayTextActive: {
    color: Theme.colors.surface,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotOn: {
    backgroundColor: Theme.colors.magenta,
  },
  dotOnActive: {
    backgroundColor: Theme.colors.surface,
  },
  sectionLabel: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkFaint,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 13.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontSize: 12,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkFaint,
  },
  emptyDay: {
    fontSize: 13,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkFaint,
  },
  loader: {
    marginTop: Theme.spacing.lg,
  },
  errorBox: {
    alignItems: "center",
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.lg,
  },
  errorText: {
    fontSize: 14,
    fontFamily: Theme.typography.body,
    color: Theme.colors.danger,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Theme.colors.magenta,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Theme.borderRadius.sm,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.surface,
  },
  reminderCard: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    ...Theme.shadows.card,
  },
  fab: {
    position: "absolute",
    right: 22,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.soft,
    elevation: 5,
  },
});

export default Calendar;
