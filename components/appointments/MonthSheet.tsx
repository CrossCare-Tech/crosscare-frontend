import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { DayMarks, dayKey } from "./DayStrip";

interface MonthSheetProps {
  visible: boolean;
  selected: Date;
  marks: Record<string, DayMarks>; // by dayKey
  onSelect: (day: Date) => void;
  onClose: () => void;
}

// Month and day names in the app language, built from Intl so no list has to be kept per language
const setCalendarLocale = (language: string) => {
  if (LocaleConfig.locales[language]) {
    LocaleConfig.defaultLocale = language;
    return;
  }
  const month = (index: number, style: "long" | "short") =>
    new Date(2026, index, 1).toLocaleDateString(language, { month: style });
  const weekday = (index: number, style: "long" | "short") =>
    new Date(2026, 1, 1 + index).toLocaleDateString(language, { weekday: style }); // Feb 1, 2026 is a Sunday
  const range = (length: number) => Array.from({ length }, (_, index) => index);
  LocaleConfig.locales[language] = {
    monthNames: range(12).map((index) => month(index, "long")),
    monthNamesShort: range(12).map((index) => month(index, "short")),
    dayNames: range(7).map((index) => weekday(index, "long")),
    dayNamesShort: range(7).map((index) => weekday(index, "short").replace(".", "")),
    today: "",
  };
  LocaleConfig.defaultLocale = language;
};

const DOT_UPCOMING = { key: "upcoming", color: Theme.colors.teal, selectedDotColor: Theme.colors.surface };
const DOT_COMPLETED = { key: "completed", color: Theme.colors.success, selectedDotColor: Theme.colors.surface };

// Full month view, opened from the calendar button: pick a date and the strip jumps to it
const MonthSheet = ({ visible, selected, marks, onSelect, onClose }: MonthSheetProps) => {
  const { t, i18n } = useTranslation();
  setCalendarLocale(i18n.language);

  const selectedKey = dayKey(selected);
  const markedDates = useMemo(() => {
    const result: Record<string, any> = {};
    Object.entries(marks).forEach(([key, mark]) => {
      const dots = [mark.upcoming ? DOT_UPCOMING : null, mark.completed ? DOT_COMPLETED : null].filter(Boolean);
      if (dots.length) result[key] = { dots };
    });
    result[selectedKey] = { ...result[selectedKey], selected: true, selectedColor: Theme.colors.magenta };
    return result;
  }, [marks, selectedKey]);

  const pick = (day: Date) => {
    onSelect(day);
    onClose();
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{t("appointments.chooseDate")}</Text>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => pick(new Date())}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.todayText}>{t("appointments.today")}</Text>
            </TouchableOpacity>
          </View>
          <Calendar
            key={`${i18n.language}-${selectedKey}`}
            current={selectedKey}
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={(day: DateData) => pick(new Date(day.year, day.month - 1, day.day))}
            enableSwipeMonths
            theme={{
              calendarBackground: Theme.colors.surface,
              textSectionTitleColor: Theme.colors.inkFaint,
              dayTextColor: Theme.colors.ink,
              todayTextColor: Theme.colors.magenta,
              selectedDayBackgroundColor: Theme.colors.magenta,
              selectedDayTextColor: Theme.colors.surface,
              textDisabledColor: Theme.colors.placeholder,
              monthTextColor: Theme.colors.ink,
              arrowColor: Theme.colors.purple,
              textDayFontFamily: Theme.typography.caption,
              textMonthFontFamily: Theme.typography.display,
              textDayHeaderFontFamily: Theme.typography.heading,
              textDayFontSize: 15,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 11,
            }}
          />
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Theme.colors.teal }]} />
              <Text style={styles.legendText}>{t("appointments.upcoming")}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Theme.colors.success }]} />
              <Text style={styles.legendText}>{t("appointments.completed")}</Text>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default MonthSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Theme.colors.scrim,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
    gap: Theme.spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.hairline,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
  },
  todayButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.magentaTint,
  },
  todayText: {
    fontSize: 13,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.magenta,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Theme.spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: Theme.typography.caption,
    color: Theme.colors.inkFaint,
  },
});
