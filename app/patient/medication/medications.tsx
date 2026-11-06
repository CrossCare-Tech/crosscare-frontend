import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Path } from "react-native-svg";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import {
  scheduleMedicationReminder,
  cancelMedicationReminders,
  areMedicationRemindersEnabled,
  setMedicationRemindersEnabled,
} from "@/utils/NotificationManager";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { useAuthDialog } from "@/components/ui/AuthDialog";
import AuthTopBar from "@/components/ui/AuthTopBar";
import LineIcon from "@/components/profile/LineIcon";
import { AddReadingButton, daysAgo, fmtDate, metricParts, metricStyles, SectionLabel } from "@/components/vitals/MetricUI";

interface MedicationTime {
  time: string;
  isCompleted: boolean;
}

interface Medication {
  id: string;
  name: string;
  date: string; // Add date field
  originalDate: string;
  times: MedicationTime[];
}

const PILL_ICON = (
  <>
    <Path d="M10.5 20.5 3.5 13.5a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7Z" />
    <Path d="M8.5 8.5l7 7" />
  </>
);

// Medication: today's doses, the schedule by day, reminders, and a way to add one
export default function MedicationsScreen() {
  const [activeTab, setActiveTab] = useState<"All" | "Upcoming">("All");
  const user = useSelector((state: any) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const userId = user?.user_id;
  const { t, i18n } = useTranslation();
  const { dialog, show } = useAuthDialog();
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  useEffect(() => {
    const setMedicationVisited = async () => {
      await AsyncStorage.setItem("medication_3", "true");
    };

    setMedicationVisited();
  }, [userId]);

  // Load reminder preference on mount
  useEffect(() => {
    const loadReminderPreference = async () => {
      try {
        const enabled = await areMedicationRemindersEnabled();
        console.log("Medication Reminders Enabled:", enabled);
        setRemindersEnabled(enabled);
      } catch (error) {
        console.error("Error loading medication reminder preference:", error);
      }
    };

    loadReminderPreference();
  }, []);

  // Toggle reminder setting
  const toggleReminders = async () => {
    try {
      const newValue = !remindersEnabled;
      setRemindersEnabled(newValue);
      await setMedicationRemindersEnabled(newValue);
    } catch (error) {
      console.error("Error saving medication reminder preference:", error);
    }
  };

  // Update the medications data structure
  const [medications, setMedications] = useState<Medication[]>([]);


  const handleToggleComplete = (medicationId: string, timeToToggle: string) => {
    const medication = medications?.find((m) => m.id === medicationId);
    const time = medication?.times.find((t) => t.time === timeToToggle);

    if (!time?.isCompleted) {
      show({
        variant: "success",
        title: t("medicationLog.confirmTitle"),
        message: t("medicationLog.confirmBody", { name: medication?.name ?? "", time: timeToToggle }),
        buttons: [
          { text: t("cancel"), style: "cancel" },
          { text: t("medicationLog.markTaken"), onPress: () => updateMedicationStatus(medicationId, timeToToggle) },
        ],
      });
    } else {
      updateMedicationStatus(medicationId, timeToToggle);
    }
  };

  // Update the updateMedicationStatus function to call the API endpoint
  const updateMedicationStatus = async (
    medicationId: string,
    timeToToggle: string
  ) => {
    if (!medications) return;

    try {
      // The medicationId format is "uuid-date" (e.g., "ff3fefb7-65de-4ded-9741-628b3a25318c-2025-03-16")
      // We need to extract the UUID and date correctly

      // Extract the base medication ID and date
      // Look for the pattern where the date (YYYY-MM-DD) is at the end of the string
      const datePattern = /(\d{4}-\d{2}-\d{2})$/;
      const match = medicationId.match(datePattern);

      let baseMedicationId = medicationId;
      let medicationDate = fmtDate(new Date()); // Default to today

      if (match && match[1]) {
        // If we found a date pattern at the end
        medicationDate = match[1];
        // Find the position where the date starts (including the hyphen)
        const dateStartPos = medicationId.lastIndexOf(medicationDate) - 1;
        // Extract the base ID (everything before the date)
        baseMedicationId = medicationId.substring(0, dateStartPos);
      }

      console.log(`Base Medication ID: ${baseMedicationId}`);
      console.log(`Medication Date: ${medicationDate}`);

      // Find the medication and time to determine current completion status
      const medication = medications.find((m) => m.id === medicationId);
      const time = medication?.times.find((t) => t.time === timeToToggle);

      // Toggle the completion status
      const newCompletionStatus = !time?.isCompleted;

      // Prepare the API request
      const userId = user?.user_id;
      const endpoint = `${CONFIG.API_BASE_URL}/user/activity/${userId}/updateStatus/${baseMedicationId}/completed`;

      console.log(`Sending request to: ${endpoint}`);
      console.log(`Request body:`, {
        completed: newCompletionStatus,
        date: medicationDate,
        time: timeToToggle,
      });

      // Make the API call - using PUT method as specified
      const response = await fetch(endpoint, {
        method: "PATCH", // Changed from POST to PUT
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: newCompletionStatus,
          date: medicationDate, // Using the YYYY-MM-DD format
          time: timeToToggle,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      // Update local state after successful API call
      setMedications((prevMedications) =>
        prevMedications.map((medication) => {
          if (medication.id === medicationId) {
            return {
              ...medication,
              times: medication.times.map((time) => {
                if (time.time === timeToToggle) {
                  return { ...time, isCompleted: newCompletionStatus };
                }
                return time;
              }),
            };
          }
          return medication;
        })
      );

      return true; // Return success
    } catch (error) {
      console.error("Error updating medication status:", error);
      // You could add error handling here, such as showing a toast notification
      return false; // Return failure
    }
  };

  // Render medication time item
  const getUpcomingMedications = () => {
    if (!medications || !Array.isArray(medications)) {
      return [];
    }

    const now = new Date();
    return medications.filter((medication) => {
      const medicationDate = new Date(medication.originalDate);

      // Check if the medication date is in the future
      if (medicationDate.toDateString() === now.toDateString()) {
        // If it's today, check if any times are incomplete and in the future
        return medication.times.some((time) => {
          if (time.isCompleted) return false;

          // Parse the time and create a date object for today
          const [timeStr, period] = time.time.split(" ");
          const [hours, minutes] = timeStr.split(":").map(Number);
          let hour24 = hours;

          if (period === "PM" && hours !== 12) hour24 += 12;
          if (period === "AM" && hours === 12) hour24 = 0;

          const timeToday = new Date();
          timeToday.setHours(hour24, minutes, 0, 0);

          return timeToday > now;
        });
      } else if (medicationDate > now) {
        // If it's a future date, include if not all times are completed
        return medication.times.some((time) => !time.isCompleted);
      }

      return false;
    });
  };

  // Add this helper function at the top of your component (before the return statement)
  const getDayOfWeekAbbr = (dayIndex: number): string => {
    const dayAbbreviations = ["SU", "M", "T", "W", "TH", "F", "SA"];
    return dayAbbreviations[dayIndex];
  };

  const getMedicationList = async () => {
    setIsLoading(true);
    try {
      if (!user || !user.user_id) {
        console.log("User ID not available");
        setIsLoading(false);
        return;
      }

      // Construct API URL (without date filters - we'll filter client-side)
      const apiUrl = `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/getMedication`;

      console.log("Fetching medications from:", apiUrl);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("API response:", responseData.data);

      if (
        responseData &&
        responseData.data &&
        Array.isArray(responseData.data)
      ) {
        const formattedMedications: Medication[] = [];

        // Mapping days to JS Date object days
        const dayMapping: { [key: string]: number } = {
          SU: 0,
          M: 1,
          T: 2,
          W: 3,
          TH: 4,
          F: 5,
          S: 6,
          SA: 6, // the add screen saves Saturday as "SA"
        };

        responseData.data.forEach((item: any) => {
          // The API sends calendar days as UTC midnight; read them as days in the patient's timezone
          const startDate = new Date(`${String(item.startDate).slice(0, 10)}T00:00:00`);
          const endDate = new Date(`${String(item.endDate).slice(0, 10)}T23:59:59`);
          const allowedDays = item.days.map((d: string) => dayMapping[d]); // Convert days to numbers

          // Get the completed days of week for checking
          const completedDaysOfWeek = item.completedDaysOfWeek || [];

          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            if (allowedDays.includes(currentDate.getDay())) {
              // Store original date in "YYYY-MM-DD" format for sorting
              const originalDateStr = fmtDate(currentDate);

              // Format date as "18 Mar, 2025" with abbreviated month
              const day = currentDate.getDate();
              const month = currentDate.toLocaleString("en-US", {
                month: "short",
              });
              const year = currentDate.getFullYear();
              const formattedDate = `${day} ${month}, ${year}`;

              // Get the day of week abbreviation for the current date
              const dayOfWeekAbbr = getDayOfWeekAbbr(currentDate.getDay());

              // Check if this specific date is in completedDates
              const dateStr = fmtDate(currentDate);
              const isDateCompleted =
                item.completedDates &&
                item.completedDates.some(
                  (d: string) => d === dateStr || d.startsWith(dateStr)
                );

              // Check if the day of week is in completedDaysOfWeek
              const isDayOfWeekCompleted =
                completedDaysOfWeek.includes(dayOfWeekAbbr);

              // A medication is completed if either the specific date or the day of week is marked as completed
              const isCompleted =
                isDateCompleted || isDayOfWeekCompleted || item.completed;

              // Create a medication object for the allowed day
              const medicationEntry = {
                id: `${item.id}-${originalDateStr}`, // Unique ID
                name: item.medicationName,
                date: formattedDate, // Display formatted date
                originalDate: originalDateStr, // Keep original date for sorting
                times: Array.isArray(item.times)
                  ? item.times.map((timeString: string) => ({
                      time: timeString,
                      isCompleted: isCompleted,
                    }))
                  : [],
              };

              formattedMedications.push(medicationEntry);

              // Schedule reminders for this medication if reminders are enabled
              if (remindersEnabled) {
                // Schedule reminders for each time
                item.times.forEach(async (timeString: string) => {
                  try {
                    // Parse the time string to create a proper date object
                    const [timeStr, period] = timeString.split(" ");
                    const [hours, minutes] = timeStr.split(":").map(Number);
                    let hour24 = hours;

                    if (period === "PM" && hours !== 12) hour24 += 12;
                    if (period === "AM" && hours === 12) hour24 = 0;

                    // Create date object for this medication time
                    const medicationDateTime = new Date(currentDate);
                    medicationDateTime.setHours(hour24, minutes, 0, 0);

                    // Only schedule if it's in the future
                    if (medicationDateTime > new Date()) {
                      const reminderIds = await scheduleMedicationReminder(
                        medicationDateTime,
                        item.medicationName,
                        `${item.id}-${originalDateStr}-${timeString}`
                      );

                      if (reminderIds && reminderIds.length > 0) {
                        console.log(
                          `✅ Scheduled ${reminderIds.length} reminders for ${item.medicationName} on ${formattedDate} at ${timeString}`
                        );
                      }
                    }
                  } catch (error) {
                    console.error(
                      "Error scheduling individual medication reminder:",
                      error
                    );
                  }
                });
              }
            }
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });

        // Sort medications by originalDate (which is still "YYYY-MM-DD")
        formattedMedications.sort(
          (a, b) =>
            new Date(a.originalDate).getTime() -
            new Date(b.originalDate).getTime()
        );

        setMedications(formattedMedications);
      } else {
        console.error(
          "API did not return expected data structure:",
          responseData
        );
        setMedications([]);
      }
    } catch (error: any) {
      console.log("Error fetching medications:", error.message);
      setMedications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("Medications screen focused");
      getMedicationList();
    }, [user, remindersEnabled])
  );

  const upcomingMedications = getUpcomingMedications();

  // Add a function to group medications by date
  const groupMedicationsByDate = (meds: Medication[]) => {
    if (!meds || !Array.isArray(meds) || meds.length === 0) {
      return [];
    }

    const grouped = meds.reduce((acc, med) => {
      if (!acc[med.date]) {
        acc[med.date] = [];
      }
      acc[med.date].push(med);
      return acc;
    }, {} as Record<string, Medication[]>);

    return Object.entries(grouped);
  };

  const todayStr = fmtDate(daysAgo(0));
  const todayDoses = medications.filter((medication) => medication.originalDate === todayStr).flatMap((medication) => medication.times);
  const takenToday = todayDoses.filter((time) => time.isCompleted).length;
  const shown = activeTab === "All" ? medications : upcomingMedications;

  const dayLabel = (date: string) => {
    if (date === todayStr) return t("bloodPressureLog.today");
    if (date === fmtDate(daysAgo(-1))) return t("medicationLog.tomorrow");
    if (date === fmtDate(daysAgo(1))) return t("bloodPressureLog.yesterday");
    return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { weekday: "short", month: "short", day: "numeric" });
  };

  const groups = groupMedicationsByDate(shown);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("medicationLog.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <View style={[metricParts.card, metricParts.hero, styles.today]}>
            <Text style={metricParts.when}>{t("bloodPressureLog.today")}</Text>
            {todayDoses.length > 0 ? (
              <>
                <View style={styles.countRow}>
                  <Text style={metricParts.big}>{takenToday}</Text>
                  <Text style={metricParts.unit}>{t("medicationLog.ofDoses", { count: todayDoses.length })}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(takenToday / todayDoses.length) * 100}%` }]} />
                </View>
              </>
            ) : (
              <Text style={styles.noneToday}>{t("medicationLog.noneToday")}</Text>
            )}
          </View>

          <View style={styles.segmented}>
            {(["All", "Upcoming"] as const).map((tab) => {
              const selected = tab === activeTab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.segment, selected && styles.segmentOn]}
                  onPress={() => setActiveTab(tab)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>
                    {tab === "All" ? t("medicationLog.all") : t("medicationLog.upcoming")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isLoading ? (
            <ActivityIndicator color={Theme.colors.magenta} style={styles.loader} />
          ) : groups.length === 0 ? (
            <Text style={styles.empty}>
              {activeTab === "All" ? t("medicationLog.noMedications") : t("medicationLog.noUpcoming")}
            </Text>
          ) : (
            groups.map(([, meds]) => (
              <View key={meds[0].originalDate} style={styles.group}>
                <SectionLabel>{dayLabel(meds[0].originalDate)}</SectionLabel>
                <View style={[metricParts.card, styles.list]}>
                  {meds.map((medication, index) => {
                    const times = activeTab === "All" ? medication.times : medication.times.filter((time) => !time.isCompleted);
                    return (
                      <View key={medication.id} style={[styles.medication, index > 0 && styles.divider]}>
                        <View style={styles.medHead}>
                          <View style={styles.iconChip}>
                            <LineIcon size={18} color={Theme.colors.purple}>
                              {PILL_ICON}
                            </LineIcon>
                          </View>
                          <Text style={styles.medName}>{medication.name}</Text>
                        </View>
                        {times.map((time) => (
                          <View key={time.time} style={styles.dose}>
                            <Text style={styles.doseTime}>{time.time}</Text>
                            <TouchableOpacity
                              style={[styles.doseButton, time.isCompleted && styles.doseButtonOn]}
                              onPress={() => handleToggleComplete(medication.id, time.time)}
                              accessibilityRole="button"
                              accessibilityState={{ checked: time.isCompleted }}
                            >
                              <Feather
                                name="check"
                                size={14}
                                color={time.isCompleted ? Theme.colors.success : Theme.colors.inkFaint}
                              />
                              <Text style={[styles.doseText, time.isCompleted && styles.doseTextOn]}>
                                {time.isCompleted ? t("medicationLog.taken") : t("medicationLog.markTaken")}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}

          <View style={[metricParts.card, styles.reminder]}>
            <View style={styles.iconChip}>
              <Feather name="bell" size={18} color={Theme.colors.purple} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.reminderTitle}>{t("medicationLog.reminders")}</Text>
              <Text style={styles.reminderHint}>{t("medicationLog.remindersHint")}</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={toggleReminders}
              trackColor={{ false: Theme.colors.hairline, true: Theme.colors.magenta }}
              thumbColor={Theme.colors.surface}
            />
          </View>
        </ScrollView>

        <AddReadingButton label={t("medicationLog.add")} onPress={() => router.push("/patient/medication/addmedication")} />
        {dialog}
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loader: {
    marginVertical: Theme.spacing.lg,
  },
  today: {
    gap: 10,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.surfaceSunken,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: Theme.colors.purple,
  },
  noneToday: {
    fontFamily: Theme.typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.inkSoft,
  },
  segmented: {
    flexDirection: "row",
    gap: 4,
    padding: 3,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surfaceSunken,
  },
  segment: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentOn: {
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.card,
  },
  segmentText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 13,
    color: Theme.colors.inkFaint,
  },
  segmentTextOn: {
    color: Theme.colors.purple,
  },
  empty: {
    fontFamily: Theme.typography.body,
    fontSize: 13,
    color: Theme.colors.inkFaint,
  },
  group: {
    gap: 8,
  },
  list: {
    paddingHorizontal: Theme.spacing.md,
  },
  medication: {
    paddingVertical: 12,
    gap: 8,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairlineLight,
  },
  medHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  medName: {
    flex: 1,
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  dose: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 52,
  },
  doseTime: {
    fontFamily: Theme.typography.subheading,
    fontSize: 13.5,
    color: Theme.colors.inkSoft,
  },
  doseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  doseButtonOn: {
    borderColor: Theme.colors.successTint,
    backgroundColor: Theme.colors.successTint,
  },
  doseText: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkSoft,
  },
  doseTextOn: {
    color: Theme.colors.success,
  },
  reminder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: Theme.spacing.md,
  },
  reminderTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  reminderHint: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
});
