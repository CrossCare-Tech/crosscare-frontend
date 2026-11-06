import React, { useEffect, useMemo, useRef } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

export type DayMarks = { upcoming: number; completed: number };

const DAY_WIDTH = 52;
const GAP = 8;
const ITEM = DAY_WIDTH + GAP;
const DAYS_BEFORE = 365;
const DAYS_AFTER = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

interface DayStripProps {
  selected: Date;
  marks: Record<string, DayMarks>; // by dayKey
  onSelect: (day: Date) => void;
  onVisibleDayChange?: (day: Date) => void; // the day at the centre after a swipe, for the month label
}

// Swipeable strip of days, a year back and a year ahead. The selected day is kept in the centre and the strip
// snaps day by day. Dots mark days with upcoming (teal) and completed (green) appointments.
const DayStrip = ({ selected, marks, onSelect, onVisibleDayChange }: DayStripProps) => {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const list = useRef<FlatList<Date>>(null);

  const first = useMemo(() => {
    const day = startOfDay(new Date());
    day.setDate(day.getDate() - DAYS_BEFORE);
    return day;
  }, []);
  const days = useMemo(
    () =>
      Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, index) => {
        const day = new Date(first);
        day.setDate(first.getDate() + index);
        return day;
      }),
    [first]
  );
  // One stop per day, so a swipe always settles with a day in the centre (snapToInterval drifts on Android)
  const snapOffsets = useMemo(() => days.map((_, index) => ITEM * index), [days]);
  const indexOf = (day: Date) =>
    Math.min(Math.max(Math.round((startOfDay(day).getTime() - first.getTime()) / MS_PER_DAY), 0), days.length - 1);

  const selectedIndex = indexOf(selected);
  const today = dayKey(new Date());

  // With a side padding of half the screen minus one day, scrolling to ITEM * index puts that day in the centre
  useEffect(() => {
    list.current?.scrollToIndex({ index: selectedIndex, animated: true });
  }, [selectedIndex]);

  const renderDay = ({ item }: { item: Date }) => {
    const key = dayKey(item);
    const active = key === dayKey(selected);
    const isToday = key === today;
    const mark = marks[key];
    const count = (mark?.upcoming ?? 0) + (mark?.completed ?? 0);
    const label = item.toLocaleDateString(i18n.language, { weekday: "long", month: "long", day: "numeric" });
    return (
      <TouchableOpacity
        style={[styles.day, isToday && styles.dayToday, active && styles.dayActive]}
        onPress={() => onSelect(item)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={t("appointments.dayLabel", { date: label, count })}
      >
        <Text style={[styles.dow, active && styles.textActive]}>
          {item.toLocaleDateString(i18n.language, { weekday: "short" }).replace(".", "").toUpperCase()}
        </Text>
        <Text style={[styles.dnum, active && styles.textActive]}>{item.getDate()}</Text>
        <View style={styles.dots}>
          {!!mark?.upcoming && <View style={[styles.dot, active ? styles.dotActive : styles.dotUpcoming]} />}
          {!!mark?.completed && <View style={[styles.dot, active ? styles.dotActive : styles.dotCompleted]} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      ref={list}
      horizontal
      data={days}
      keyExtractor={dayKey}
      renderItem={renderDay}
      extraData={[selected, marks]}
      getItemLayout={(_, index) => ({ length: ITEM, offset: ITEM * index, index })}
      initialScrollIndex={selectedIndex}
      contentContainerStyle={{ paddingHorizontal: (width - DAY_WIDTH) / 2 }}
      snapToOffsets={snapOffsets}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      overScrollMode="never"
      initialNumToRender={15}
      windowSize={7}
      onMomentumScrollEnd={(event) =>
        onVisibleDayChange?.(days[Math.round(event.nativeEvent.contentOffset.x / ITEM)] ?? selected)
      }
    />
  );
};

export default DayStrip;

const styles = StyleSheet.create({
  day: {
    width: DAY_WIDTH,
    marginRight: GAP,
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 14,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
  },
  dayToday: {
    borderColor: Theme.colors.magenta,
  },
  dayActive: {
    backgroundColor: Theme.colors.magenta,
    borderColor: Theme.colors.magenta,
  },
  dow: {
    fontSize: 10,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkFaint,
  },
  dnum: {
    fontSize: 16,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  textActive: {
    color: Theme.colors.surface,
  },
  dots: {
    flexDirection: "row",
    gap: 3,
    height: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotUpcoming: {
    backgroundColor: Theme.colors.teal,
  },
  dotCompleted: {
    backgroundColor: Theme.colors.success,
  },
  dotActive: {
    backgroundColor: Theme.colors.surface,
  },
});
