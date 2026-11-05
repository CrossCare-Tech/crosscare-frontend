import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import SessionExpiryModal from "@/components/security/SessionExpiryModal";
import { usePreviewScreens } from "@/utils/demo/demoMode";
import { metricStyles } from "@/components/vitals/MetricUI";
import { styles as rowStyles } from "@/components/devices/DeviceSourceRows";

// The entry to the prototype's 4.4 to 4.7: two-step verification, Face ID, the activity log and a preview of the
// session warning. The prototype does not show where these live, so they sit together under Profile > Security.
export default function SecurityScreen() {
  const { t } = useTranslation();
  const [warning, setWarning] = useState(false);
  const preview = usePreviewScreens();
  const rows: { icon: keyof typeof Feather.glyphMap; title: string; sub: string; onPress: () => void }[] = [
    { icon: "message-square", title: t("security.mfaTitle"), sub: t("security.mfaHint"), onPress: () => router.push("/patient/mfa") },
    { icon: "unlock", title: t("security.biometricRow"), sub: t("security.confirmItsYou"), onPress: () => router.push("/patient/biometric") },
    // The log lists sample events, so it only shows in the demo builds
    ...(preview ? [{ icon: "list" as const, title: t("security.activityLog"), sub: t("security.activityHint"), onPress: () => router.push("/patient/activity-log") }] : []),
    { icon: "clock", title: t("security.sessionPreview"), sub: t("security.sessionPreviewHint"), onPress: () => setWarning(true) },
  ];

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("security.title")} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <View style={styles.card}>
            {rows.map((row, index) => (
              <TouchableOpacity key={row.title} style={[rowStyles.row, index > 0 && rowStyles.divider]} onPress={row.onPress} accessibilityRole="button">
                <View style={rowStyles.iconChip}>
                  <Feather name={row.icon} size={18} color={Theme.colors.purple} />
                </View>
                <View style={rowStyles.rowText}>
                  <Text style={rowStyles.rowTitle}>{row.title}</Text>
                  <Text style={rowStyles.rowSub}>{row.sub}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Theme.colors.inkFaint} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <SessionExpiryModal visible={warning} onStay={() => setWarning(false)} onSignOut={() => setWarning(false)} />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.hairline, borderRadius: Theme.borderRadius.lg, paddingHorizontal: Theme.spacing.md, ...Theme.shadows.card },
});
