import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";
import {
  scheduleAppointmentReminder,
  areAppointmentRemindersEnabled,
  cancelAppointmentReminders,
  debugNotifications,
} from "../../../utils/NotificationManager";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { useAuthDialog } from "@/components/ui/AuthDialog";
import { ChipSelect, vitalsStyles } from "@/components/vitals/VitalsUI";

// Quick picks that fill the description (prototype 10.2 "Type"); the API only stores a title
const APPOINTMENT_TYPES = ["typeCheckup", "typeUltrasound", "typeLab"];

interface AppointmentForm {
  description: string;
  date: Date;
  time: Date;
}

export interface EditableAppointment {
  id: string;
  title: string;
  date: string;
}

interface AppointmentModalProps {
  visible: boolean;
  appointment?: EditableAppointment | null; // set when editing
  initialDate?: Date | null; // day picked on the calendar, for a new appointment
  onClose: () => void;
  onSaved: () => void; // reloads the calendar after a save or delete
}

// 10.2 — Add & Delete Appointment, shown as a sheet like the reminder one
const AppointmentModal = ({ visible, appointment, initialDate, onClose, onSaved }: AppointmentModalProps) => {
  const isEditing = !!appointment;
  const appointmentId = appointment?.id || "";

  const user = useSelector((state: any) => state.user);
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<AppointmentForm>({
    description: "",
    date: new Date(),
    time: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { dialog, show } = useAuthDialog();

  // Fill the form every time the sheet opens (empty for a new appointment)
  useEffect(() => {
    if (!visible) {
      return;
    }
    // A new appointment starts on the day picked on the calendar (never in the past), at the current time
    const now = new Date();
    const pickedDay = initialDate && initialDate > now ? new Date(initialDate) : now;
    pickedDay.setHours(now.getHours(), now.getMinutes(), 0, 0);
    const appointmentDate = appointment ? new Date(appointment.date) : pickedDay;
    setForm({
      description: appointment?.title || "",
      date: appointmentDate,
      time: appointmentDate,
    });
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, [visible, appointment, initialDate]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setForm({ ...form, date: selectedDate });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setForm({ ...form, time: selectedTime });
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString(i18n.language, { month: "short", day: "numeric", year: "numeric" });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" });

  // 10.2: "Delete appointment" asks in the app's delete dialog first
  const confirmDelete = () =>
    show({
      variant: "delete",
      title: t("appointments.cancelThis"),
      message: t("appointments.cancelThisHint", {
        title: appointment?.title,
        when: `${formatDate(form.date)}, ${formatTime(form.time)}`,
      }),
      buttons: [
        { text: t("appointments.keep"), style: "cancel" },
        { text: t("appointments.deleteButton"), onPress: handleDelete },
      ],
    });

  // Removes the appointment and its reminders
  const handleDelete = async () => {
    if (!isEditing || !appointmentId) return;
    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/appointments/${appointmentId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }

      // Cancel any scheduled reminders
      await cancelAppointmentReminders(appointmentId);

      onClose();
      onSaved();
    } catch (error) {
      console.error("Error deleting appointment:", JSON.stringify(error, null, 2));
      show({ variant: "error", title: t("appointments.errorTitle"), message: t("appointments.deleteFailed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAppointment = async () => {
    if (!form.description.trim()) {
      Alert.alert(t("appointments.errorTitle"), t("appointments.descriptionMissing"));
      return;
    }

    try {
      setIsSubmitting(true);

      // Create a combined date and time
      const appointmentDateTime = new Date(form.date);
      appointmentDateTime.setHours(form.time.getHours());
      appointmentDateTime.setMinutes(form.time.getMinutes());

      console.log("📅 Appointment DateTime (local):", appointmentDateTime);
      console.log(
        "📅 Appointment DateTime (ISO):",
        appointmentDateTime.toISOString()
      );

      // Get the patient ID from Redux store
      const patientId = user.user_id;

      let savedAppointmentId = appointmentId;

      if (isEditing) {
        // Update existing appointment
        const response = await fetch(
          `${CONFIG.API_BASE_URL}/user/activity/${patientId}/appointments/${appointmentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: form.description,
              appointmentDate: appointmentDateTime.toISOString(),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update appointment");
        }

        // Get the updated appointment data
        const appointmentData = await response.json();
        console.log("Updated appointment response:", appointmentData);

        // Cancel existing reminders for this appointment
        await cancelAppointmentReminders(appointmentId);
      } else {
        // Create new appointment
        const response = await fetch(
          `${CONFIG.API_BASE_URL}/user/activity/${patientId}/appointment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: form.description,
              appointmentDate: appointmentDateTime.toISOString(),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save appointment");
        }

        // Get the appointment data from the response
        const responseData = await response.json();
        console.log("Full appointment response data:", responseData);

        // Extract ID correctly from the response structure
        savedAppointmentId = responseData.id || responseData.data?.id || "";
        console.log("Extracted appointment ID:", savedAppointmentId);

        if (!savedAppointmentId) {
          console.error("Warning: No appointment ID found in response");
        }
      }

      // Check if reminders are enabled
      const remindersEnabled = await areAppointmentRemindersEnabled();
      console.log("Reminders Enabled:", remindersEnabled);

      // Debug the condition evaluation
      console.log("Checking reminder conditions:", {
        remindersEnabled,
        savedAppointmentId,
        shouldSchedule: Boolean(remindersEnabled && savedAppointmentId),
      });

      // Only schedule reminders if they're enabled and we have an appointment ID
      if (remindersEnabled && savedAppointmentId) {
        console.log("🔔 Scheduling reminders...");
        console.log("Appointment DateTime for reminders:", appointmentDateTime);
        console.log("Current time:", new Date());

        // Schedule reminders for this appointment using the utility function
        const reminderIds = await scheduleAppointmentReminder(
          appointmentDateTime,
          form.description,
          savedAppointmentId
        );

        if (reminderIds && reminderIds.length > 0) {
          console.log(
            `✅ Scheduled ${reminderIds.length} reminders for appointment:`,
            reminderIds
          );

          // Debug: Check what was actually scheduled
          const debugInfo = await debugNotifications();
          console.log("🔍 Debug info after scheduling:", debugInfo);
        } else {
          console.log("❌ No reminders were scheduled - check logs for errors");
        }
      } else {
        console.log(
          "⏭️ Reminders are disabled or no appointment ID. No reminders scheduled."
        );
      }

      onClose();
      onSaved();
    } catch (error) {
      console.error(
        "Error saving appointment:",
        JSON.stringify(error, null, 2)
      );
      Alert.alert(t("appointments.errorTitle"), t("appointments.saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.title}>
                {isEditing ? t("appointments.editTitle") : t("appointments.newTitle")}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={t("appointments.cancel")}
              >
                <Ionicons name="close" size={20} color={Theme.colors.inkFaint} />
              </TouchableOpacity>
            </View>

            <View style={vitalsStyles.field}>
              <Text style={vitalsStyles.label}>{t("appointments.type")}</Text>
              <View style={vitalsStyles.chips}>
                {APPOINTMENT_TYPES.map((key) => {
                  const label = t(`appointments.${key}`);
                  return (
                    <ChipSelect
                      key={key}
                      label={label}
                      selected={form.description.trim() === label}
                      onPress={() => setForm({ ...form, description: label })}
                    />
                  );
                })}
              </View>
            </View>

            <CustomTextInput
              label={t("appointments.description")}
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              placeholder={t("appointments.descriptionPlaceholder")}
            />

            <View style={vitalsStyles.row}>
              <View style={[vitalsStyles.field, styles.flex]}>
                <Text style={vitalsStyles.label}>{t("appointments.date")}</Text>
                <TouchableOpacity style={styles.picker} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.pickerText}>{formatDate(form.date)}</Text>
                  <Ionicons name="calendar-outline" size={17} color={Theme.colors.inkFaint} />
                </TouchableOpacity>
              </View>
              <View style={[vitalsStyles.field, styles.flex]}>
                <Text style={vitalsStyles.label}>{t("appointments.time")}</Text>
                <TouchableOpacity style={styles.picker} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.pickerText}>{formatTime(form.time)}</Text>
                  <Ionicons name="time-outline" size={17} color={Theme.colors.inkFaint} />
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={form.date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={form.time}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleTimeChange}
              />
            )}

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleSaveAppointment}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? t("appointments.saving") : t("appointments.save")}
              </Text>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                style={styles.deleteLink}
                onPress={confirmDelete}
                disabled={isSubmitting}
                accessibilityRole="button"
              >
                <Ionicons name="trash-outline" size={16} color={Theme.colors.magenta} />
                <Text style={styles.deleteText}>{t("appointments.deleteButton")}</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
      {dialog}
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: Theme.colors.scrim,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
    gap: Theme.spacing.md,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.hairline,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Theme.colors.inputBorder,
    backgroundColor: Theme.colors.inputBg,
    paddingHorizontal: 14,
  },
  pickerText: {
    fontSize: 14.5,
    fontFamily: Theme.typography.body,
    color: Theme.colors.ink,
  },
  button: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.surface,
  },
  deleteLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Theme.spacing.xs,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.magenta,
  },
});

export default AppointmentModal;
