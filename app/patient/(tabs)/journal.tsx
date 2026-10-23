import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Path } from "react-native-svg";
import { router, useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import LineIcon from "@/components/profile/LineIcon";
import { JournalEntryParam } from "@/components/journal/entry";

const DAY_MS = 24 * 60 * 60 * 1000;
const ROW_HEIGHT = 92;
const GAP = 3;

type Entry = {
  id: string;
  kind: "photo" | "note";
  date: Date;
  title: string;
  description?: string;
  imageUrl?: string;
};

type Day = { key: string; date: Date; entries: Entry[] };

// The API returns formatted strings instead of ISO dates:
// notes   "10/23/2026, 1:16 PM" (month first), photos "23/10/2026, 1:16 PM" (day first)
const parseApiDate = (value: string, order: "mdy" | "dmy"): Date | null => {
  const match = value?.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i
  );
  if (!match) return null;
  const [, a, b, year, h, min, ampm] = match;
  const month = Number(order === "mdy" ? a : b) - 1;
  const day = Number(order === "mdy" ? b : a);
  let hours = Number(h) % 12;
  if (ampm?.toUpperCase() === "PM") hours += 12;
  return new Date(Number(year), month, day, hours, Number(min));
};

const flattenSections = (sections: any[]): any[] =>
  Array.isArray(sections) ? sections.flatMap((section) => section?.items ?? []) : [];

const groupByDay = (entries: Entry[]): Day[] => {
  const days = new Map<string, Day>();
  for (const entry of [...entries].sort((a, b) => b.date.getTime() - a.date.getTime())) {
    const key = entry.date.toDateString();
    if (!days.has(key)) days.set(key, { key, date: entry.date, entries: [] });
    days.get(key)!.entries.push(entry);
  }
  return [...days.values()];
};

// 4.3 — Entry
const openEntry = (entry: Entry) => {
  const item: JournalEntryParam = {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    description: entry.description,
    imageUrl: entry.imageUrl,
    date: entry.date.toISOString(),
  };
  router.push({ pathname: "/patient/entry", params: { item: JSON.stringify(item) } });
};

const PhotoTile = ({ entry, style }: { entry: Entry; style: any }) => (
  <TouchableOpacity
    style={[styles.tile, style]}
    activeOpacity={0.85}
    onPress={() => openEntry(entry)}
  >
    <Image source={{ uri: entry.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
    {entry.title ? (
      <LinearGradient
        colors={["transparent", Theme.colors.photoShade]}
        style={styles.caption}
      >
        <Text style={styles.captionText} numberOfLines={2}>
          {entry.title}
        </Text>
      </LinearGradient>
    ) : null}
  </TouchableOpacity>
);

const NoteTile = ({ entry, style, tag }: { entry: Entry; style: any; tag: string }) => (
  <TouchableOpacity
    style={[styles.tile, styles.noteTile, style]}
    activeOpacity={0.85}
    onPress={() => openEntry(entry)}
  >
    <Text style={styles.tagPill}>{tag}</Text>
    <Text style={styles.noteText} numberOfLines={4}>
      {entry.description || entry.title}
    </Text>
  </TouchableOpacity>
);

export default function Journal() {
  const user = useSelector((state: any) => state.user);
  const token = useSelector((state: any) => state.user.token);
  const { t, i18n } = useTranslation();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [lmp, setLmp] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const dayOffsets = useRef<Record<string, number>>({});

  useEffect(() => {
    // Used by the Explorer badge to know the journal was visited
    AsyncStorage.setItem("journal", "true");
  }, []);

  const load = useCallback(async () => {
    if (!user?.user_id) return;
    setError(false);
    try {
      const [notesRes, photosRes, profileRes] = await Promise.all([
        fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/notes`),
        fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/journal`),
        fetch(`${CONFIG.API_BASE_URL}/user/${user.user_id}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [notesData, photosData, profile] = await Promise.all([
        notesRes.json(),
        photosRes.json(),
        profileRes.json().catch(() => null),
      ]);

      const notes: Entry[] = flattenSections(notesData?.data).flatMap((item) => {
        const date = parseApiDate(item.date, "mdy");
        return date
          ? [{ id: item.id, kind: "note" as const, date, title: item.title, description: item.description }]
          : [];
      });
      const photos: Entry[] = flattenSections(photosData?.data).flatMap((item) => {
        const date = parseApiDate(item.date, "dmy");
        return date && item.imageUrl
          ? [{ id: item.id, kind: "photo" as const, date, title: (item.title ?? "").trim(), imageUrl: item.imageUrl }]
          : [];
      });
      setEntries([...notes, ...photos]);

      // Last menstrual period, used to label each day with its pregnancy week
      const totalDays = profile?.pregnancyData?.totalDays;
      setLmp(typeof totalDays === "number" ? new Date(Date.now() - totalDays * DAY_MS) : null);
    } catch (err) {
      console.error("Error loading journal:", err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.user_id, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const days = groupByDay(entries);

  // Month index on the right edge, one item per month that has entries
  const months: { label: string; dayKey: string }[] = [];
  for (const day of days) {
    const label = day.date.toLocaleDateString(i18n.language, { month: "short" });
    if (!months.some((month) => month.label === label)) {
      months.push({ label, dayKey: day.key });
    }
  }

  const dayTitle = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return t("journalTimeline.today");
    if (date.toDateString() === new Date(today.getTime() - DAY_MS).toDateString())
      return t("journalTimeline.yesterday");
    return date.toLocaleDateString(i18n.language, {
      month: "short",
      day: "numeric",
      ...(date.getFullYear() !== today.getFullYear() && { year: "numeric" }),
    });
  };

  const weekOf = (date: Date) => {
    if (!lmp) return null;
    const week = Math.floor((date.getTime() - lmp.getTime()) / DAY_MS / 7);
    return week >= 1 ? week : null;
  };

  const col = (gridWidth - GAP * 2) / 3;

  const renderTile = (entry: Entry, style: any) =>
    entry.kind === "photo" ? (
      <PhotoTile key={entry.id} entry={entry} style={style} />
    ) : (
      <NoteTile key={entry.id} entry={entry} style={style} tag={t("journalTimeline.noteTag")} />
    );

  // Prototype grid: 3 columns of 92px rows. When a day has a multiple of 3 entries and
  // a photo, that photo opens the day as a 2x2 tile with two small tiles beside it.
  const renderGrid = (dayEntries: Entry[]) => {
    const rows: React.ReactNode[] = [];
    let rest = dayEntries;
    const heroIndex = dayEntries.findIndex((entry) => entry.kind === "photo");

    if (dayEntries.length % 3 === 0 && heroIndex !== -1) {
      const hero = dayEntries[heroIndex];
      const others = dayEntries.filter((_, index) => index !== heroIndex);
      const side = others.slice(0, 2);
      rest = others.slice(2);
      rows.push(
        <View key="hero" style={styles.row}>
          {renderTile(hero, { width: col * 2 + GAP, height: ROW_HEIGHT * 2 + GAP })}
          <View style={styles.sideColumn}>
            {side.map((entry) => renderTile(entry, { width: col, height: ROW_HEIGHT }))}
          </View>
        </View>
      );
    }

    for (let i = 0; i < rest.length; i += 3) {
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {rest.slice(i, i + 3).map((entry) => renderTile(entry, { width: col, height: ROW_HEIGHT }))}
        </View>
      );
    }
    return rows;
  };

  const openNew = () => router.push("/patient/newentry");

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.header}>{t("journalTimeline.title")}</Text>

        {loading ? (
          <ActivityIndicator color={Theme.colors.magenta} style={styles.loader} />
        ) : (
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load();
                }}
                tintColor={Theme.colors.magenta}
                colors={[Theme.colors.magenta]}
              />
            }
          >
            {error ? (
              <Text style={styles.error}>{t("journalTimeline.loadError")}</Text>
            ) : days.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <LineIcon size={30} color={Theme.colors.purple}>
                    <Path d="M6 4h10a2 2 0 0 1 2 2v13a1 1 0 0 1-1.5.87L12 17l-4.5 2.87A1 1 0 0 1 6 19V4Z" />
                  </LineIcon>
                </View>
                <Text style={styles.emptyTitle}>{t("journalTimeline.emptyTitle")}</Text>
                <Text style={styles.emptyText}>{t("journalTimeline.emptyText")}</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={openNew}>
                  <Text style={styles.emptyButtonText}>{t("journalTimeline.addFirst")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={styles.timeline}
                onLayout={(event) =>
                  // Grid leaves room on the right for the month index
                  setGridWidth(event.nativeEvent.layout.width)
                }
              >
                {gridWidth > 0 &&
                  days.map((day) => {
                    const week = weekOf(day.date);
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    const badge = [
                      week ? t("journalTimeline.week", { week }) : null,
                      isToday
                        ? day.date.toLocaleDateString(i18n.language, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <View
                        key={day.key}
                        onLayout={(event) => {
                          dayOffsets.current[day.key] = event.nativeEvent.layout.y;
                        }}
                      >
                        <View style={styles.dayHeader}>
                          <Text style={styles.dayTitle}>{dayTitle(day.date)}</Text>
                          {badge ? <Text style={styles.dayBadge}>{badge}</Text> : null}
                          <Text style={styles.dayCount}>
                            {t("journalTimeline.entries", { count: day.entries.length })}
                          </Text>
                        </View>
                        <View style={styles.grid}>{renderGrid(day.entries)}</View>
                      </View>
                    );
                  })}
              </View>
            )}
          </ScrollView>
        )}

        {months.length > 1 && (
          <View style={styles.scrub} pointerEvents="box-none">
            {months.map((month, index) => (
              <React.Fragment key={month.dayKey}>
                {index > 0 && <View style={styles.scrubDot} />}
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 10, right: 6 }}
                  onPress={() =>
                    scrollRef.current?.scrollTo({
                      y: dayOffsets.current[month.dayKey] ?? 0,
                      animated: true,
                    })
                  }
                >
                  <Text style={styles.scrubLabel}>{month.label}</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={openNew}
          accessibilityRole="button"
          accessibilityLabel={t("journalTimeline.newEntry")}
        >
          <LineIcon size={24} color={Theme.colors.surface} strokeWidth={2.4}>
            <Path d="M12 5v14M5 12h14" />
          </LineIcon>
        </TouchableOpacity>

      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontFamily: Theme.typography.heading,
    fontSize: 16.5,
    color: Theme.colors.ink,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 6,
  },
  loader: {
    marginTop: Theme.spacing.xl,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  timeline: {
    // Right padding leaves space for the month index
    marginLeft: 22,
    marginRight: 34,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Theme.spacing.sm,
    paddingTop: 12,
    paddingBottom: Theme.spacing.sm,
  },
  dayTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  dayBadge: {
    fontFamily: Theme.typography.heading,
    fontSize: 11,
    color: Theme.colors.magenta,
    backgroundColor: Theme.colors.magentaTint,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
  },
  dayCount: {
    marginLeft: "auto",
    fontFamily: Theme.typography.heading,
    fontSize: 10.5,
    color: Theme.colors.inkFaint,
  },
  grid: {
    gap: GAP,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
  },
  sideColumn: {
    gap: GAP,
  },
  tile: {
    borderRadius: Theme.borderRadius.sm,
    overflow: "hidden",
    backgroundColor: Theme.colors.surfaceSunken,
  },
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingHorizontal: 7,
    paddingBottom: 6,
  },
  captionText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 10,
    lineHeight: 13,
    color: Theme.colors.surface,
  },
  noteTile: {
    backgroundColor: Theme.colors.purpleTint,
    padding: Theme.spacing.sm,
  },
  tagPill: {
    alignSelf: "flex-start",
    fontFamily: Theme.typography.heading,
    fontSize: 9,
    color: Theme.colors.purple,
    backgroundColor: Theme.colors.tagOnPhoto,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  noteText: {
    marginTop: 6,
    fontFamily: Theme.typography.subheading,
    fontSize: 10.5,
    lineHeight: 14,
    color: Theme.colors.ink,
  },
  scrub: {
    position: "absolute",
    right: 6,
    top: 110,
    // Ends above the add button
    bottom: 170,
    alignItems: "center",
    justifyContent: "space-between",
  },
  scrubDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Theme.colors.hairline,
  },
  scrubLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 8.5,
    color: Theme.colors.inkFaint,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 96,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.soft,
    elevation: 6,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: 80,
    gap: Theme.spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.purpleTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.sm,
  },
  emptyTitle: {
    fontFamily: Theme.typography.display,
    fontSize: 18,
    color: Theme.colors.ink,
  },
  emptyText: {
    fontFamily: Theme.typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: Theme.colors.inkFaint,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: Theme.spacing.sm,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 18,
    backgroundColor: Theme.colors.magenta,
  },
  emptyButtonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 12.5,
    color: Theme.colors.surface,
  },
  error: {
    fontFamily: Theme.typography.body,
    fontSize: 13,
    color: Theme.colors.inkFaint,
    textAlign: "center",
    padding: Theme.spacing.xl,
  },
});
