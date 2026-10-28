import React, { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ConciergeTopBar from "@/components/ui/ConciergeTopBar";
import { Theme } from "@/constants/theme";
import { useGuide } from "@/constants/conciergeGuide";
import {
  CURRENT_THREAD_ID,
  Thread,
  archiveCurrentThread,
  loadArchivedThreads,
  loadCurrentThread,
  restoreThread,
} from "@/utils/conciergeThreads";

type Group = "today" | "yesterday" | "earlier";

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const groupOf = (iso: string): Group => {
  const days = Math.round((dayStart(new Date()) - dayStart(new Date(iso))) / 86400000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : "earlier";
};

const stamp = (iso: string, group: Group) =>
  group === "earlier"
    ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

// Conversations: where the chat's back arrow lands. Real threads: the running one plus the archived ones. The gear and the guide row open the guide settings,
// which is the avatar screen of Profile.
export default function ConciergeHistory() {
  const { t } = useTranslation();
  const router = useRouter();
  const guide = useGuide();

  const [threads, setThreads] = useState<Thread[]>([]);

  // The running thread first, then the archived ones (newest first).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([loadCurrentThread(), loadArchivedThreads()]).then(([current, archived]) => {
        if (active) setThreads(current ? [current, ...archived] : archived);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const openChat = () => router.push({ pathname: "/patient/askdoula", params: { from_modal: "true" } });
  // New conversation: the running thread goes to the archive and the chat opens empty.
  const startNew = async () => {
    await archiveCurrentThread();
    openChat();
  };
  const openThread = async (id: string) => {
    if (id !== CURRENT_THREAD_ID) await restoreThread(id);
    openChat();
  };
  const openSettings = () => router.push("/avatar");

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <ConciergeTopBar
          title={t("conciergeHistory.title")}
          action={{ icon: "settings", label: t("conciergeHistory.settings"), onPress: openSettings }}
        />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Pressable onPress={openSettings} accessibilityRole="button" style={styles.guideRow}>
            <Image source={guide.portrait} style={styles.avatar} />
            <View style={styles.rowText}>
              <Text style={styles.guideName}>{guide.name}</Text>
              <Text style={styles.guideSub}>{t("conciergeHistory.rowSub")}</Text>
            </View>
            <Feather name="edit-2" size={16} color={Theme.colors.purple} />
          </Pressable>

          <Pressable onPress={startNew} accessibilityRole="button" style={styles.newChat}>
            <Text style={styles.newChatText}>{t("conciergeHistory.newChat")}</Text>
          </Pressable>

          {threads.length === 0 && <Text style={styles.empty}>{t("conciergeHistory.empty")}</Text>}
          {threads.map((thread, i) => {
            const group = groupOf(thread.updatedAt);
            const showGroup = i === 0 || groupOf(threads[i - 1].updatedAt) !== group;
            return (
              <View key={thread.id}>
                {showGroup && <Text style={styles.group}>{t(`conciergeHistory.${group}`)}</Text>}
                <Pressable onPress={() => openThread(thread.id)} accessibilityRole="button" style={styles.hist}>
                  <Image source={guide.portrait} style={styles.avatar} />
                  <View style={styles.rowText}>
                    <Text style={styles.histTitle} numberOfLines={1}>
                      {thread.title}
                    </Text>
                    {!!thread.summary && (
                      <Text style={styles.histSummary} numberOfLines={2}>
                        {thread.summary}
                      </Text>
                    )}
                  </View>
                  <View style={styles.week}>
                    <Text style={styles.weekText}>{stamp(thread.updatedAt, group)}</Text>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Theme.spacing.md, paddingBottom: Theme.spacing.xl, gap: 8 },
  guideRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.purpleTint,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Theme.colors.surface },
  rowText: { flex: 1, gap: 2 },
  guideName: { fontFamily: Theme.typography.heading, fontSize: 15, color: Theme.colors.ink },
  guideSub: { fontFamily: Theme.typography.subheading, fontSize: 12, color: Theme.colors.purple },
  newChat: {
    height: 50,
    marginVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  newChatText: { fontFamily: Theme.typography.heading, fontSize: 15, color: Theme.colors.surface },
  empty: { fontFamily: Theme.typography.body, fontSize: 13, color: Theme.colors.inkFaint, textAlign: "center", marginTop: 24 },
  group: { fontFamily: Theme.typography.heading, fontSize: 12, color: Theme.colors.inkFaint, marginTop: 10, marginBottom: 6 },
  hist: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.card,
  },
  histTitle: { fontFamily: Theme.typography.heading, fontSize: 13.5, color: Theme.colors.ink },
  histSummary: { fontFamily: Theme.typography.body, fontSize: 12, lineHeight: 17, color: Theme.colors.inkFaint },
  week: { backgroundColor: Theme.colors.purpleTint, borderRadius: Theme.borderRadius.full, paddingHorizontal: 9, paddingVertical: 4 },
  weekText: { fontFamily: Theme.typography.heading, fontSize: 10.5, color: Theme.colors.purple },
});
