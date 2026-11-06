import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import Toggle from "@/components/profile/Toggle";
import { Pill } from "@/components/vitals/VitalsUI";
import { metricStyles } from "@/components/vitals/MetricUI";
import { styles as rowStyles } from "@/components/devices/DeviceSourceRows";
import { useDeviceSources } from "@/hooks/useDeviceSources";
import { useDemoWatch } from "@/utils/demo/demoWatch";

// Prototype 5.4 "Device sync": the state of the connected device, its battery and Auto-sync.
// Opened from Devices; the list of sources and permissions stays there.
export default function DeviceSyncScreen() {
  const { t, i18n } = useTranslation();
  const device = useDeviceSources().find((source) => source.id === "demoWatch");
  const watch = useDemoWatch();
  const [, setTick] = useState(0);
  // ponytail: Auto-sync is only a switch for now, it does not change how the watch syncs
  const [autoSync, setAutoSync] = useState(true);

  // Keeps "Last synced 4 min ago" honest while the screen stays open
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const ago = (iso: string | null) => {
    if (!iso) return t("devices.neverSynced");
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return t("devices.syncedNow");
    if (minutes < 60) return t("devices.syncedMinutes", { count: minutes });
    return t("devices.syncedAt", {
      time: new Date(iso).toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" }),
    });
  };

  // Forgetting the device leaves a screen with nothing to show, so go back to Devices
  const forget = async () => {
    await device?.disconnect();
    router.back();
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("devices.syncTitle")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <View style={[styles.card, styles.hero]}>
            <View style={styles.heroIcon}>
              <Feather name="bluetooth" size={24} color={Theme.colors.success} />
            </View>
            <Text style={styles.heroTitle}>{t("devices.deviceConnectedName", { name: device?.name ?? "" })}</Text>
            <Text style={styles.heroSub}>{t("devices.lastSynced", { when: ago(watch.lastSyncAt) })}</Text>
          </View>

          <View style={styles.card}>
            <View style={rowStyles.row}>
              <View style={rowStyles.iconChip}>
                <Feather name="battery" size={18} color={Theme.colors.purple} />
              </View>
              <Text style={[rowStyles.rowTitle, styles.rowLabel]}>{t("devices.battery")}</Text>
              {/* ponytail: fixed demo value, the watch does not report its battery yet */}
              <Pill label="82%" tone="success" />
            </View>
          </View>

          <View style={styles.card}>
            <View style={rowStyles.row}>
              <View style={rowStyles.iconChip}>
                <Feather name="refresh-cw" size={18} color={Theme.colors.purple} />
              </View>
              <Text style={[rowStyles.rowTitle, styles.rowLabel]}>{t("devices.autoSync")}</Text>
              <Toggle value={autoSync} onChange={setAutoSync} accessibilityLabel={t("devices.autoSync")} />
            </View>
          </View>

          <TouchableOpacity style={styles.forget} onPress={forget} accessibilityRole="button">
            <Text style={styles.forgetText}>{t("devices.forgetDevice")}</Text>
          </TouchableOpacity>
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
  hero: {
    alignItems: "center",
    gap: 4,
    paddingTop: 20,
    paddingBottom: 18,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Theme.colors.successTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
    textAlign: "center",
  },
  heroSub: {
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    color: Theme.colors.inkFaint,
    textAlign: "center",
  },
  rowLabel: {
    flex: 1,
  },
  forget: {
    minHeight: 52,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Theme.colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  forgetText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.purple,
  },
});
