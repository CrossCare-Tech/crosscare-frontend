import React from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { DeviceSource, DeviceSourceId, useDeviceSources } from "@/hooks/useDeviceSources";

const LOGOS: Partial<Record<DeviceSourceId, any>> = {
  apple: require("../../assets/images/applehealth.png"),
  fitbit: require("../../assets/images/fitbit.png"),
};

const ICONS: Record<DeviceSourceId, keyof typeof Feather.glyphMap> = {
  apple: "heart",
  healthConnect: "activity",
  fitbit: "activity",
  demoWatch: "watch",
};

export const SourceChip = ({ id }: { id: DeviceSourceId }) => (
  <View style={styles.iconChip}>
    {LOGOS[id] ? (
      <Image source={LOGOS[id]} style={styles.logo} />
    ) : (
      <Feather name={ICONS[id]} size={18} color={Theme.colors.purple} />
    )}
  </View>
);

export const useToggleSource = (alertTitle: string) => {
  const { t } = useTranslation();
  return async (source: DeviceSource) => {
    // The Demo Watch shows its own progress instead of an alert
    if (source.isDemo) {
      await (source.connected ? source.disconnect() : source.connect());
      return;
    }
    if (source.connected) {
      await source.disconnect();
      Alert.alert(alertTitle, t("heartLog.disconnectedFrom", { name: source.name }));
      return;
    }
    const success = await source.connect();
    Alert.alert(
      alertTitle,
      success ? t("heartLog.connectedTo", { name: source.name }) : t("heartLog.connectFailed", { name: source.name })
    );
  };
};

export const sourceAction = (source: DeviceSource, t: (key: string) => string) =>
  source.loading ? t("actions.Connecting") : source.connected ? t("actions.Disconnect") : t("actions.Connect");

// The connection rows shared by Heart rate and Steps: the sources this phone can use, then a link to Devices.
// Put it inside a white card.
export default function DeviceSourceRows({ alertTitle, hint }: { alertTitle: string; hint: string }) {
  const { t } = useTranslation();
  const sources = useDeviceSources().filter((source) => source.available);
  const toggle = useToggleSource(alertTitle);

  return (
    <>
      {sources.map((source) => (
        <View key={source.id} style={styles.row}>
          <SourceChip id={source.id} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>
              {source.name}
              {source.isDemo ? `  ·  ${t("devices.demo")}` : ""}
            </Text>
            <Text style={styles.rowSub}>{source.connected ? t("heartLog.connected") : hint}</Text>
          </View>
          <TouchableOpacity
            onPress={() => toggle(source)}
            disabled={source.loading}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.link}>{sourceAction(source, t)}</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={[styles.row, styles.divider]}
        onPress={() => router.push("/patient/devices")}
        accessibilityRole="button"
      >
        <View style={styles.iconChip}>
          <Feather name="smartphone" size={18} color={Theme.colors.purple} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{t("devices.manage")}</Text>
          <Text style={styles.rowSub}>{t("devices.manageHint")}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={Theme.colors.inkFaint} />
      </TouchableOpacity>
    </>
  );
}

export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairlineLight,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 22,
    height: 22,
  },
  link: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.magenta,
  },
});
