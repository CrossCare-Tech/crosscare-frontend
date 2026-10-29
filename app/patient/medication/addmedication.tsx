import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  scheduleMedicationReminder,
  areMedicationRemindersEnabled,
} from "@/utils/NotificationManager";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { AddReadingButton, fmtDate, metricStyles } from "@/components/vitals/MetricUI";

interface MedicationState {
  setMedicationName: string;
  selectedDays: string[];
  isStartDatePickerVisible: boolean;
  isEndDatePickerVisible: boolean;
  isTimePickerVisible: boolean;
  startDate: Date | null;
  endDate: Date | null;
  selectedTimes: string[];
}

// Day codes sent to the API, in the order of Date.getDay()
const DAY_INDEX: Record<string, number> = { SU: 0, M: 1, T: 2, W: 3, TH: 4, F: 5, SA: 6 };

// Add medication: name, dates, days of the week and dose times
export default function AddMedicationScreen() {
  const [state, setState] = useState<MedicationState>({
    setMedicationName: "",
    selectedDays: ["T"],
    isStartDatePickerVisible: false,
    isEndDatePickerVisible: false,
    isTimePickerVisible: false,
    startDate: null,
    endDate: null,
    selectedTimes: [],
  });

  const user = useSelector((state: any) => state.user);
  const { t, i18n } = useTranslation();

  const days = ["SU", "M", "T", "W", "TH", "F", "SA"];

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const toggleDay = (day: string): void => {
    setState((prevState) => ({
      ...prevState,
      selectedDays: prevState.selectedDays.includes(day)
        ? prevState.selectedDays.filter((d) => d !== day)
        : [...prevState.selectedDays, day],
    }));
  };

  const showDatePicker = (pickerType: "start" | "end"): void => {
    setState((prevState) => ({
      ...prevState,
      isStartDatePickerVisible: pickerType === "start",
      isEndDatePickerVisible: pickerType === "end",
    }));
  };

  const hideDatePicker = (): void => {
    setState((prevState) => ({
      ...prevState,
      isStartDatePickerVisible: false,
      isEndDatePickerVisible: false,
    }));
  };

  const handleDateConfirm = (
    event: any,
    selectedDate: Date | undefined,
    dateType: "start" | "end"
  ): void => {
    if (Platform.OS === "android") {
      hideDatePicker();
    }
    if (selectedDate) {
      setState((prevState) => ({
        ...prevState,
        [dateType === "start" ? "startDate" : "endDate"]: selectedDate,
      }));
    }
  };

  const handleTimeConfirm = (
    event: any,
    selectedTime: Date | undefined
  ): void => {
    if (Platform.OS === "android") {
      setState((prevState) => ({ ...prevState, isTimePickerVisible: false }));
    }
    if (selectedTime) {
      const timeString = selectedTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      setState((prevState) => ({
        ...prevState,
        selectedTimes: [...prevState.selectedTimes, timeString],
      }));
    }
  };

  const removeTime = (timeToRemove: string) => {
    setState((prevState) => ({
      ...prevState,
      selectedTimes: prevState.selectedTimes.filter(
        (time) => time !== timeToRemove
      ),
    }));
  };

  const handleSubmit = async () => {
    if (!state.setMedicationName.trim()) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("medicationLog.errName"));
      return;
    }

    if (!state.startDate) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("medicationLog.errStart"));
      return;
    }

    if (!state.endDate) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("medicationLog.errEnd"));
      return;
    }

    if (state.selectedDays.length === 0) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("medicationLog.errDays"));
      return;
    }

    if (state.selectedTimes.length === 0) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("medicationLog.errTimes"));
      return;
    }

    try {
      const apiUrl = `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/addMedication`;

      const payload = {
        medicationName: state.setMedicationName,
        days: state.selectedDays,
        startDate: fmtDate(state.startDate),
        endDate: fmtDate(state.endDate),
        times: state.selectedTimes,
      };

      console.log("Submitting Data: ", payload);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Success:", data);

        // Schedule reminders for the new medication
        try {
          const remindersEnabled = await areMedicationRemindersEnabled();
          console.log("Medication reminders enabled:", remindersEnabled);

          if (remindersEnabled) {
            // Map day abbreviations to numbers
            const dayMapping: { [key: string]: number } = {
              SU: 0,
              M: 1,
              T: 2,
              W: 3,
              TH: 4,
              F: 5,
              SA: 6,
            };

            const allowedDays = state.selectedDays.map(
              (d: string) => dayMapping[d]
            );
            console.log("Allowed days:", allowedDays);
            console.log("Selected times:", state.selectedTimes);

            // For each day in the date range that matches selected days
            const currentDate = new Date(state.startDate);
            const endDate = new Date(state.endDate);

            while (currentDate <= endDate) {
              if (allowedDays.includes(currentDate.getDay())) {
                console.log(`Processing date: ${currentDate.toDateString()}`);

                // For each selected time, schedule reminders
                for (const timeString of state.selectedTimes) {
                  try {
                    // Parse the time string (format: "HH:MM")
                    const [hours, minutes] = timeString.split(":").map(Number);

                    // Create a new date object for this medication time
                    const medicationDateTime = new Date(currentDate);
                    medicationDateTime.setHours(hours, minutes, 0, 0);

                    console.log(`Medication time: ${medicationDateTime}`);
                    console.log(`Current time: ${new Date()}`);

                    // Only schedule if it's in the future
                    if (medicationDateTime > new Date()) {
                      const medicationId =
                        data.data?.id || data.id || "new-medication";
                      const uniqueId = `${medicationId}-${
                        fmtDate(currentDate)
                      }-${timeString}`;

                      console.log(
                        `Scheduling reminder for: ${state.setMedicationName} at ${medicationDateTime} with ID: ${uniqueId}`
                      );

                      const reminderIds = await scheduleMedicationReminder(
                        medicationDateTime,
                        state.setMedicationName,
                        uniqueId
                      );

                      if (reminderIds && reminderIds.length > 0) {
                        console.log(
                          `✅ Scheduled ${reminderIds.length} reminders for ${
                            state.setMedicationName
                          } on ${currentDate.toDateString()} at ${timeString}`
                        );
                      } else {
                        console.log(
                          `⚠️ No reminders scheduled for ${
                            state.setMedicationName
                          } on ${currentDate.toDateString()} at ${timeString}`
                        );
                      }
                    } else {
                      console.log(
                        `⏭️ Skipping past time: ${medicationDateTime}`
                      );
                    }
                  } catch (error) {
                    console.error(
                      "Error scheduling individual medication reminder:",
                      error
                    );
                  }
                }
              }
              // Move to next day
              currentDate.setDate(currentDate.getDate() + 1);
            }
          } else {
            console.log(
              "Medication reminders are disabled, skipping reminder scheduling"
            );
          }
        } catch (reminderError) {
          console.error(
            "Error scheduling medication reminders:",
            reminderError
          );
          // Don't fail the entire operation if reminder scheduling fails
        }

        // Navigate back regardless of reminder scheduling success/failure
        router.back();
      } else {
        console.log("Error:", data);
        Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
      }
    } catch (error: any) {
      console.log("Error occurred", error.message);
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
    }
  };


  // Short weekday names in the app language (Sunday = Jan 4, 2026)
  const dayName = (code: string) =>
    new Date(2026, 0, 4 + DAY_INDEX[code]).toLocaleDateString(i18n.language, { weekday: "short" });
  const dateText = (date: Date | null) =>
    date ? date.toLocaleDateString(i18n.language, { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("medicationLog.add")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[metricStyles.content, styles.content]}>
          <View style={styles.card}>
            <CustomTextInput
              label={t("medicationLog.name")}
              value={state.setMedicationName}
              onChangeText={(text) => setState((prev) => ({ ...prev, setMedicationName: text }))}
              placeholder={t("medicationLog.namePlaceholder")}
            />

            <Text style={styles.label}>{t("medicationLog.dates")}</Text>
            <View style={styles.dates}>
              {(["start", "end"] as const).map((type) => {
                const value = type === "start" ? state.startDate : state.endDate;
                return (
                  <TouchableOpacity
                    key={type}
                    style={styles.dateField}
                    onPress={() => showDatePicker(type)}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.dateText, !value && styles.placeholder]} numberOfLines={1}>
                      {dateText(value) ?? (type === "start" ? t("medicationLog.start") : t("medicationLog.end"))}
                    </Text>
                    <Feather name="calendar" size={16} color={Theme.colors.inkFaint} />
                  </TouchableOpacity>
                );
              })}
            </View>
            {(state.isStartDatePickerVisible || state.isEndDatePickerVisible) && (
              <DateTimePicker
                value={(state.isStartDatePickerVisible ? state.startDate : state.endDate) || new Date()}
                mode="date"
                display="default"
                minimumDate={state.isEndDatePickerVisible && state.startDate ? state.startDate : undefined}
                onChange={(event, selectedDate) =>
                  handleDateConfirm(event, selectedDate, state.isStartDatePickerVisible ? "start" : "end")
                }
              />
            )}

            <Text style={styles.label}>{t("medicationLog.days")}</Text>
            <View style={styles.days}>
              {days.map((day) => {
                const selected = state.selectedDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.day, selected && styles.dayOn]}
                    onPress={() => toggleDay(day)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                  >
                    <Text style={[styles.dayText, selected && styles.dayTextOn]}>{dayName(day)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>{t("medicationLog.times")}</Text>
            <View style={styles.times}>
              {state.selectedTimes.map((time) => (
                <View key={time} style={styles.timeChip}>
                  <Text style={styles.timeText}>{time}</Text>
                  <TouchableOpacity
                    onPress={() => removeTime(time)}
                    accessibilityRole="button"
                    accessibilityLabel={t("medicationLog.removeTime", { time })}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={14} color={Theme.colors.purple} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addTime}
                onPress={() => setState((prev) => ({ ...prev, isTimePickerVisible: true }))}
                accessibilityRole="button"
              >
                <Feather name="plus" size={14} color={Theme.colors.magenta} />
                <Text style={styles.addTimeText}>{t("medicationLog.addTime")}</Text>
              </TouchableOpacity>
            </View>
            {state.isTimePickerVisible && (
              <DateTimePicker value={new Date()} mode="time" display="default" onChange={handleTimeConfirm} />
            )}
          </View>
        </ScrollView>

        <AddReadingButton label={t("medicationLog.save")} onPress={handleSubmit} />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    gap: 10,
    ...Theme.shadows.card,
  },
  label: {
    marginTop: 6,
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.inkSoft,
  },
  dates: {
    flexDirection: "row",
    gap: 10,
  },
  dateField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.inputBorder,
    backgroundColor: Theme.colors.inputBg,
  },
  dateText: {
    flex: 1,
    fontFamily: Theme.typography.body,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  placeholder: {
    color: Theme.colors.placeholder,
  },
  days: {
    flexDirection: "row",
    gap: 6,
  },
  day: {
    flex: 1,
    height: 40,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.surface,
  },
  dayOn: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.magentaTint,
  },
  dayText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11.5,
    color: Theme.colors.inkSoft,
  },
  dayTextOn: {
    color: Theme.colors.magenta,
  },
  times: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.purpleTint,
  },
  timeText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.purple,
  },
  addTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Theme.colors.magenta,
  },
  addTimeText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.magenta,
  },
});
