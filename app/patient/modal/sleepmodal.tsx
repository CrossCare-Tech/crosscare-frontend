import React, { useState, useEffect } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import { ReadingModal } from "@/components/vitals/VitalsUI";

interface SleepLogModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (date: Date, sleepTime: Date, wakeTime: Date) => void;
  reload: () => void;
}

// Add a night: the date, when she fell asleep and when she woke up
const SleepLogModal: React.FC<SleepLogModalProps> = ({
  isVisible,
  onClose,
  onSave,
  reload,
}) => {
  const [date, setDate] = useState(new Date());
  const [sleepTime, setSleepTime] = useState(
    new Date(new Date().setHours(23, 0, 0, 0))
  );

  const { t, i18n } = useTranslation();
  const [wakeTime, setWakeTime] = useState(
    new Date(new Date().setHours(9, 0, 0, 0))
  );

  const user = useSelector((state: any) => state.user);
  const [showSleepPicker, setShowSleepPicker] = useState(false);
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isVisible) {
      // Keep the current values when reopening
    }
  }, [isVisible]);

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0"); // Ensure 2-digit minutes
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12; // Convert 24-hour format to 12-hour format
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Ensure 2-digit month
    const day = String(date.getDate()).padStart(2, "0"); // Ensure 2-digit day
    return `${year}-${month}-${day}`;
  };

  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
    const Date = formatDate(date);
    const Time = formatTime(sleepTime);
    const End = formatTime(wakeTime);
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/sleep`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: Date,
          sleepStart: Time,
          sleepEnd: End,
        }),
      }
    );
    await response.json();
    reload();
    onClose();
    } catch (error) {
      console.warn("Error saving sleep log:", error);
    } finally {
      setSaving(false);
    }
  };

  const onChangeSleepTime = (event: any, selectedDate?: Date) => {
    setShowSleepPicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setSleepTime(selectedDate);

    // For iOS, we need to manually hide the picker
    if (Platform.OS === "ios") {
      setTimeout(() => {
        setShowSleepPicker(false);
      }, 0);
    }
  };

  const onChangeWakeTime = (event: any, selectedDate?: Date) => {
    setShowWakePicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setWakeTime(selectedDate);

    // For iOS, we need to manually hide the picker
    if (Platform.OS === "ios") {
      setTimeout(() => {
        setShowWakePicker(false);
      }, 0);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    // Create a new date object to avoid reference issues
    const newDate = new Date(selectedDate.getTime());
    setDate(newDate);

    // For iOS, we need to manually hide the picker
    if (Platform.OS === "ios") {
      setTimeout(() => {
        setShowDatePicker(false);
      }, 0);
    }
  };

  // Handle picker display
  const showPicker = (pickerType: "date" | "sleep" | "wake") => {
    // Close any open pickers first
    setShowDatePicker(false);
    setShowSleepPicker(false);
    setShowWakePicker(false);

    // Open the requested picker
    if (pickerType === "date") setShowDatePicker(true);
    if (pickerType === "sleep") setShowSleepPicker(true);
    if (pickerType === "wake") setShowWakePicker(true);
  };

  const timeText = (value: Date) => value.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" });
  const dateText = (value: Date) => value.toLocaleDateString(i18n.language, { weekday: "short", month: "short", day: "numeric" });
  const fields: { key: "date" | "sleep" | "wake"; label: string; value: string; icon: "calendar" | "moon" | "sun" }[] = [
    { key: "date", label: t("sleepLog.date"), value: dateText(date), icon: "calendar" },
    { key: "sleep", label: t("sleepLog.fellAsleep"), value: timeText(sleepTime), icon: "moon" },
    { key: "wake", label: t("sleepLog.wokeUp"), value: timeText(wakeTime), icon: "sun" },
  ];

  return (
    <ReadingModal
      visible={isVisible}
      loading={saving}
      onSave={handleSave}
      onClose={onClose}
      title={t("sleepLog.addLog")}
      saveLabel={t("sleepLog.saveLog")}
      showDateTime={false}
    >
      {fields.map((field) => (
        <View key={field.key} style={styles.field}>
          <Text style={styles.label}>{field.label}</Text>
          <TouchableOpacity style={styles.input} onPress={() => showPicker(field.key)} accessibilityRole="button">
            <Text style={styles.value}>{field.value}</Text>
            <Feather name={field.icon} size={16} color={Theme.colors.inkFaint} />
          </TouchableOpacity>
        </View>
      ))}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          maximumDate={new Date()}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangeDate}
        />
      )}
      {showSleepPicker && (
        <DateTimePicker value={sleepTime} mode="time" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onChangeSleepTime} />
      )}
      {showWakePicker && (
        <DateTimePicker value={wakeTime} mode="time" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onChangeWakeTime} />
      )}
    </ReadingModal>
  );
};

export default SleepLogModal;

const styles = StyleSheet.create({
  field: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.inkSoft,
    marginBottom: 6,
  },
  input: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.inputBorder,
    backgroundColor: Theme.colors.inputBg,
  },
  value: {
    fontFamily: Theme.typography.body,
    fontSize: 14.5,
    color: Theme.colors.ink,
  },
});
