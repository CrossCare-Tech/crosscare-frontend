import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import DayStrip, { DayMarks, dayKey } from "@/components/appointments/DayStrip";
import MonthSheet from "@/components/appointments/MonthSheet";

// Define appointment type
interface Appointment {
  id: string;
  title: string;
  date: string;
  status?: "Completed" | "Upcoming";
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// 10.1 — Appointment Calendar
const Calendar = () => {
  const user = useSelector((state: any) => state.user);
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [visibleDay, setVisibleDay] = useState(() => new Date()); // centre of the strip, for the month label
  const [monthVisible, setMonthVisible] = useState(false);
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

  const selectDay = (day: Date) => {
    setSelectedDay(day);
    setVisibleDay(day);
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

  // Dots on the strip and the month view: how many upcoming and completed appointments each day has
  const marks = useMemo(() => {
    const result: Record<string, DayMarks> = {};
    appointments.forEach((appointment) => {
      const key = dayKey(new Date(appointment.date));
      const mark = (result[key] ??= { upcoming: 0, completed: 0 });
      if (appointment.status === "Upcoming") mark.upcoming += 1;
      else mark.completed += 1;
    });
    return result;
  }, [appointments]);
  const isToday = sameDay(selectedDay, new Date());
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
          {/* Month, Today and the month view */}
          <View style={styles.calendarHeader}>
            <Text style={styles.monthLabel}>
              {visibleDay.toLocaleDateString(i18n.language, { month: "long", year: "numeric" })}
            </Text>
            {!isToday && (
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() => selectDay(new Date())}
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.todayText}>{t("appointments.today")}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.monthButton}
              onPress={() => setMonthVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t("appointments.openMonth")}
            >
              <LineIcon size={20} color={Theme.colors.purple}>
                <Path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z" />
                <Path d="M4 10h16M8 3v4M16 3v4" />
              </LineIcon>
            </TouchableOpacity>
          </View>

          {/* Swipeable days */}
          <View style={styles.stripBleed}>
            <DayStrip selected={selectedDay} marks={marks} onSelect={selectDay} onVisibleDayChange={setVisibleDay} />
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
                {[
                  isToday ? t("appointments.today") : null,
                  selectedDay.toLocaleDateString(i18n.language, { weekday: "long", month: "long", day: "numeric" }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {onSelectedDay.length > 0 ? (
                onSelectedDay.map((appointment) => renderAppointment(appointment, false))
              ) : (
                <View style={styles.emptyCard}>
                  <View style={styles.iconChip}>
                    <LineIcon size={20} color={Theme.colors.purple}>
                      <Path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z" />
                      <Path d="M4 10h16M8 3v4M16 3v4M12 13v4M10 15h4" />
                    </LineIcon>
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{t("appointments.emptyTitle")}</Text>
                    <Text style={styles.rowSub}>{t("appointments.emptyHint")}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.emptyAction}
                    onPress={handleAddAppointment}
                    accessibilityRole="button"
                    accessibilityLabel={t("appointments.addForDay")}
                  >
                    <Text style={styles.emptyActionText}>{t("appointments.add")}</Text>
                  </TouchableOpacity>
                </View>
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
          initialDate={selectedDay}
          onClose={() => setSheetVisible(false)}
          onSaved={fetchAppointments}
        />

        <MonthSheet
          visible={monthVisible}
          selected={selectedDay}
          marks={marks}
          onSelect={selectDay}
          onClose={() => setMonthVisible(false)}
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
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  monthLabel: {
    flex: 1,
    fontSize: 20,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
  },
  todayButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.magentaTint,
  },
  todayText: {
    fontSize: 13,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.magenta,
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  stripBleed: {
    marginHorizontal: -22,
    marginBottom: 4,
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
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  emptyAction: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.magenta,
  },
  emptyActionText: {
    fontSize: 13,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.surface,
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
