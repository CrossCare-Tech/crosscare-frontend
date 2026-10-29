import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import Toggle from "@/components/profile/Toggle";
import { Pill } from "@/components/vitals/VitalsUI";
import { daysAgo, fmtDate, GuideNote, metricStyles, ReadingList, SectionLabel } from "@/components/vitals/MetricUI";
import { SourceChip, sourceAction, styles as rowStyles, useToggleSource } from "@/components/devices/DeviceSourceRows";
import { useDeviceSources } from "@/hooks/useDeviceSources";
import { useDemoWatch, WatchDataType } from "@/utils/demo/demoWatch";
import { watchRestingHeartFor, watchSleepFor, watchStepsFor } from "@/utils/demo/demoWatchData";

const DATA_TYPES: { id: WatchDataType; icon: keyof typeof Feather.glyphMap }[] = [
  { id: "steps", icon: "trending-up" },
  { id: "heart", icon: "heart" },
  { id: "sleep", icon: "moon" },
];

// 5.4 Device Sync Indicator, 10.7 Historical Data View, 10.8 Permissions Management
export default function DevicesScreen() {
  const { t, i18n } = useTranslation();
  const sources = useDeviceSources();
  const toggleSource = useToggleSource(t("devices.title"));
  const watch = useDemoWatch();
  const [, setTick] = useState(0);

  // Keeps "Synced 2 min ago" honest while the screen stays open
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const connected = sources.filter((source) => source.connected);
  const demoWatch = sources.find((source) => source.id === "demoWatch");
  const watchOn = !!demoWatch?.connected;

  const ago = (iso: string | null) => {
    if (!iso) return t("devices.neverSynced");
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return t("devices.syncedNow");
    if (minutes < 60) return t("devices.syncedMinutes", { count: minutes });
    return t("devices.syncedAt", {
      time: new Date(iso).toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" }),
    });
  };

  const number = (value: number) => value.toLocaleString(i18n.language);
  const dayLabel = (date: string) =>
    date === fmtDate(daysAgo(0))
      ? t("bloodPressureLog.today")
      : new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { weekday: "short", month: "short", day: "numeric" });

  // The last seven days as the watch reports them (10.7), respecting what the patient allowed
  const days = Array.from({ length: 7 }, (_, i) => fmtDate(daysAgo(i))).map((date) => {
    const parts = [
      watch.permissions.heart ? `${watchRestingHeartFor(date)} bpm` : null,
      watch.permissions.sleep ? `${Math.round(watchSleepFor(date).duration / 360000) / 10} h` : null,
    ].filter(Boolean);
    return {
      key: date,
      value: watch.permissions.steps ? t("stepsLog.steps", { value: number(watchStepsFor(date)) }) : t("devices.stepsOff"),
      when: [dayLabel(date), ...parts].join(" · "),
      pill: { label: t("devices.demo"), tone: "teal" as const },
    };
  });

  const summary = connected.length
    ? t("devices.summaryConnected", { names: connected.map((source) => source.name).join(", ") })
    : t("devices.summaryNone");

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("devices.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          {/* 5.4 Sync indicator */}
          <View style={styles.card}>
            <View style={[rowStyles.row, styles.statusRow]}>
              <View style={[styles.dot, connected.length > 0 ? styles.dotOn : styles.dotOff]} />
              <View style={rowStyles.rowText}>
                <Text style={rowStyles.rowTitle}>{connected.length > 0 ? t("devices.connected") : t("devices.notConnected")}</Text>
                <Text style={rowStyles.rowSub}>{summary}</Text>
              </View>
              {watchOn && !watch.flow && (
                <TouchableOpacity onPress={watch.syncNow} accessibilityRole="button" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={rowStyles.link}>{t("devices.syncNow")}</Text>
                </TouchableOpacity>
              )}
            </View>
            {watchOn && (
              <Text style={styles.lastSync}>
                {t("devices.lastSync", { when: ago(watch.lastSyncAt) })}
              </Text>
            )}
          </View>

          {(watchOn || watch.flow) && (
            <>
              <View style={styles.card}>
                <View style={styles.syncHero}>
                  <View style={styles.syncIcon}>
                    <Feather name={watch.flow ? "refresh-cw" : "check"} size={24} color={Theme.colors.success} />
                  </View>
                  <Text style={styles.syncTitle}>
                    {watch.flow?.stage === "pairing"
                      ? t("devices.pairing")
                      : watch.flow
                        ? t("devices.syncing")
                        : t("devices.syncedWith")}
                  </Text>
                  <Text style={styles.syncSub}>
                    {watch.flow?.stage === "pairing"
                      ? t("devices.pairingHint")
                      : watch.flow
                        ? t("devices.syncingHint")
                        : t("devices.upToDate", { when: ago(watch.lastSyncAt) })}
                  </Text>
                </View>
              </View>
              {watch.flow?.stage !== "pairing" && (
                <View style={styles.card}>
                  {DATA_TYPES.filter((type) => watch.permissions[type.id]).map((type, index) => {
                    const finished = !watch.flow || (watch.flow.stage === "syncing" && watch.flow.done.includes(type.id));
                    return (
                      <View key={type.id} style={[rowStyles.row, index > 0 && rowStyles.divider]}>
                        <Feather
                          name={finished ? "check" : "clock"}
                          size={16}
                          color={finished ? Theme.colors.success : Theme.colors.inkFaint}
                        />
                        <Text style={[rowStyles.rowTitle, styles.syncItem]}>{t(`devices.type.${type.id}`)}</Text>
                        <Pill label={finished ? t("devices.synced") : t("devices.syncingPill")} tone={finished ? "success" : "teal"} />
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

          <SectionLabel>{t("devices.sources")}</SectionLabel>
          <View style={styles.card}>
            {sources.map((source, index) => (
              <View key={source.id} style={[rowStyles.row, index > 0 && rowStyles.divider]}>
                <SourceChip id={source.id} />
                <View style={rowStyles.rowText}>
                  <View style={styles.nameRow}>
                    <Text style={rowStyles.rowTitle}>{source.name}</Text>
                    {source.isDemo && <Pill label={t("devices.demo")} tone="teal" />}
                  </View>
                  <Text style={rowStyles.rowSub}>
                    {source.note ??
                      (source.connected
                        ? `${t("heartLog.connected")}${source.lastSyncAt ? ` · ${ago(source.lastSyncAt)}` : ""}`
                        : t("devices.notConnected"))}
                  </Text>
                </View>
                {source.available && (
                  <TouchableOpacity
                    onPress={() => toggleSource(source)}
                    disabled={source.loading}
                    accessibilityRole="button"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={rowStyles.link}>{sourceAction(source, t)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* 10.8 Permissions */}
          {watchOn ? (
            <>
              <SectionLabel>{t("devices.permissions")}</SectionLabel>
              <View style={styles.card}>
                {DATA_TYPES.map((type, index) => (
                  <View key={type.id} style={[rowStyles.row, index > 0 && rowStyles.divider]}>
                    <View style={rowStyles.iconChip}>
                      <Feather name={type.icon} size={18} color={Theme.colors.purple} />
                    </View>
                    <View style={rowStyles.rowText}>
                      <Text style={rowStyles.rowTitle}>{t(`devices.type.${type.id}`)}</Text>
                      <Text style={rowStyles.rowSub}>
                        {watch.permissions[type.id] ? t("devices.allowed") : t("devices.notAllowed")}
                      </Text>
                    </View>
                    <Toggle
                      value={watch.permissions[type.id]}
                      onChange={(allowed) => watch.setPermission(type.id, allowed)}
                      accessibilityLabel={t(`devices.type.${type.id}`)}
                    />
                  </View>
                ))}
              </View>

              {/* 10.7 History */}
              <SectionLabel>{t("devices.history")}</SectionLabel>
              <ReadingList items={days} />

              <SectionLabel>{t("devices.syncHistory")}</SectionLabel>
              <View style={styles.card}>
                {watch.history.slice(0, 5).map((entry, index) => (
                  <View key={entry.at} style={[rowStyles.row, index > 0 && rowStyles.divider]}>
                    <View style={rowStyles.rowText}>
                      <Text style={rowStyles.rowTitle}>
                        {new Date(entry.at).toLocaleString(i18n.language, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </Text>
                      <Text style={rowStyles.rowSub}>
                        {[
                          entry.steps !== null ? t("stepsLog.steps", { value: number(entry.steps) }) : null,
                          entry.heart !== null ? `${entry.heart} bpm` : null,
                          entry.sleepHours !== null ? `${entry.sleepHours} h` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || t("devices.nothingShared")}
                      </Text>
                    </View>
                    <Pill label={t("devices.synced")} tone="success" />
                  </View>
                ))}
              </View>
              <GuideNote text={t("devices.demoNote")} />
            </>
          ) : (
            <GuideNote text={t("devices.guide")} />
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  statusRow: {
    paddingVertical: 14,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotOn: {
    backgroundColor: Theme.colors.success,
  },
  dotOff: {
    backgroundColor: Theme.colors.hairline,
  },
  lastSync: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
    paddingBottom: 12,
  },
  syncHero: {
    alignItems: "center",
    gap: 6,
    paddingVertical: Theme.spacing.lg,
  },
  syncIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Theme.colors.successTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  syncTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 16,
    color: Theme.colors.ink,
  },
  syncSub: {
    fontFamily: Theme.typography.subheading,
    fontSize: 12,
    color: Theme.colors.inkFaint,
    textAlign: "center",
  },
  syncItem: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
