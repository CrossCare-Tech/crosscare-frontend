import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Path, Rect } from "react-native-svg";
import { router, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import LineIcon from "@/components/profile/LineIcon";
import { JournalEntryParam, entryText, isTruncatedNote } from "@/components/journal/entry";

const DAY_MS = 24 * 60 * 60 * 1000;

// 4.3 — Entry (photo only / note only / photo + note)
const Entry = () => {
  const params = useLocalSearchParams<{ item: string }>();
  const entry: JournalEntryParam = JSON.parse(params.item);
  const user = useSelector((state: any) => state.user);
  const token = useSelector((state: any) => state.user.token);
  const { t, i18n } = useTranslation();
  const [week, setWeek] = useState<number | null>(null);

  const date = new Date(entry.date);
  const text = entryText(entry);
  const hasPhoto = entry.kind === "photo" && !!entry.imageUrl;
  // A note cut short by the API can't be edited without losing its text
  const canEdit = !(entry.kind === "note" && isTruncatedNote(entry.description));

  useEffect(() => {
    const loadWeek = async () => {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/user/${user?.user_id}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        const totalDays = data?.pregnancyData?.totalDays;
        if (typeof totalDays !== "number") return;
        const lmp = Date.now() - totalDays * DAY_MS;
        const entryWeek = Math.floor((date.getTime() - lmp) / DAY_MS / 7);
        if (entryWeek >= 1) setWeek(entryWeek);
      } catch (error) {
        console.error("Error loading pregnancy week:", error);
      }
    };
    if (user?.user_id) loadWeek();
  }, [user?.user_id]);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <AuthTopBar title={t("newEntry.entryTitle")} />

          {hasPhoto && (
            <Image source={{ uri: entry.imageUrl }} style={styles.photo} resizeMode="cover" />
          )}

          <View style={styles.when}>
            <LineIcon size={16} color={Theme.colors.inkSoft}>
              <Rect x="4" y="5" width="16" height="15" rx="2" />
              <Path d="M4 10h16M9 3v4M15 3v4" />
            </LineIcon>
            <Text style={styles.whenDate}>
              {date.toLocaleDateString(i18n.language, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
            {week ? (
              <>
                <Text style={styles.whenDot}>·</Text>
                <Text style={styles.whenWeek}>{t("newEntry.week", { week })}</Text>
              </>
            ) : null}
          </View>

          {text ? (
            // With a photo the note sits flat under it; on its own it is the hero card
            <View style={[styles.noteCard, hasPhoto && styles.noteFlat]}>
              <Text style={hasPhoto ? styles.noteTextFlat : styles.noteText}>{text}</Text>
            </View>
          ) : null}

          {canEdit && (
            <TouchableOpacity
              style={styles.edit}
              onPress={() =>
                router.push({
                  pathname: "/patient/newentry",
                  params: { item: params.item },
                })
              }
              accessibilityRole="button"
            >
              <LineIcon size={16} color={Theme.colors.magenta}>
                <Path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <Path d="m15 5 4 4" />
              </LineIcon>
              <Text style={styles.editText}>{t("newEntry.editEntry")}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default Entry;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Theme.spacing.xl,
  },
  photo: {
    marginHorizontal: 22,
    height: 300,
    borderRadius: 22,
    backgroundColor: Theme.colors.surfaceSunken,
  },
  when: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginTop: 14,
    marginHorizontal: 22,
    marginBottom: Theme.spacing.sm,
  },
  whenDate: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  whenDot: {
    color: Theme.colors.inkFaint,
  },
  whenWeek: {
    fontFamily: Theme.typography.heading,
    fontSize: 11,
    color: Theme.colors.magenta,
    backgroundColor: Theme.colors.magentaTint,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  noteCard: {
    marginTop: Theme.spacing.xs,
    marginHorizontal: 22,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: 22,
    padding: 20,
  },
  noteFlat: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 2,
  },
  noteText: {
    fontFamily: Theme.typography.display,
    fontSize: 20,
    lineHeight: 28,
    color: Theme.colors.ink,
  },
  noteTextFlat: {
    fontFamily: Theme.typography.caption,
    fontSize: 15,
    lineHeight: 23,
    color: Theme.colors.ink,
  },
  edit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.sm,
    marginTop: 18,
    marginHorizontal: 22,
    minHeight: 48,
    borderRadius: Theme.borderRadius.full,
    // White instead of the prototype's magenta tint, which blends into the Lilac Mist canvas
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    ...Theme.shadows.card,
  },
  editText: {
    fontFamily: Theme.typography.heading,
    fontSize: 14,
    color: Theme.colors.magenta,
  },
});
