import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { metricStyles, SectionLabel } from "@/components/vitals/MetricUI";
import { styles as rowStyles } from "@/components/devices/DeviceSourceRows";

type Entry = { icon: keyof typeof Feather.glyphMap | "building"; title: string; sub: string; when: string };

// Prototype 4.7 "User Activity & Audit Log": sign-ins and security events, newest first.
// ponytail: sample events, there is no audit endpoint yet. Replace with the account's real log.
export default function ActivityLogScreen() {
  const { t } = useTranslation();
  const today: Entry[] = [
    { icon: "unlock", title: t("security.signedIn"), sub: "iPhone 15 Pro · Riverside, CA", when: "9:02 AM" },
    { icon: "key", title: t("security.passwordChanged"), sub: t("security.requestedByYou"), when: "8:41 AM" },
  ];
  const week: Entry[] = [
    { icon: "building", title: t("security.joinedClinic", { clinic: "Riverside OB-GYN" }), sub: t("security.viaQr"), when: "Oct 30" },
    { icon: "smartphone", title: t("security.newDevice"), sub: "iPad · unrecognized location", when: "Oct 28" },
  ];

  const list = (items: Entry[]) =>
    items.map((entry) => (
      <View key={entry.title} style={[styles.card, rowStyles.row]}>
        <View style={rowStyles.iconChip}>
          {entry.icon === "building" ? (
            <Ionicons name="business-outline" size={19} color={Theme.colors.purple} />
          ) : (
            <Feather name={entry.icon} size={18} color={Theme.colors.purple} />
          )}
        </View>
        <View style={rowStyles.rowText}>
          <Text style={rowStyles.rowTitle}>{entry.title}</Text>
          <Text style={rowStyles.rowSub}>{entry.sub}</Text>
        </View>
        <Text style={styles.when}>{entry.when}</Text>
      </View>
    ));

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("security.activityLog")} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <SectionLabel>{t("security.today")}</SectionLabel>
          {list(today)}
          <SectionLabel>{t("security.thisWeek")}</SectionLabel>
          {list(week)}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  when: { fontFamily: Theme.typography.heading, fontSize: 11.5, color: Theme.colors.inkFaint },
});
