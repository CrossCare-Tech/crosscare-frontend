import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { metricStyles } from "@/components/vitals/MetricUI";
import { styles as rowStyles } from "@/components/devices/DeviceSourceRows";

const CORNER = { position: "absolute" as const, width: 40, height: 40, borderColor: Theme.colors.magenta };

// Prototype 4.1 "QR Scanner · Join Clinic".
// ponytail: static viewfinder, no camera yet (expo-camera needs the permission flow). Tapping the frame, or the
// manual row, goes on as if a code was read. Swap in a real scan and read the clinic from the code.
export default function ClinicScanScreen() {
  const { t } = useTranslation();
  const next = () => router.push("/patient/clinic-confirm");

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("clinic.joinTitle")} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <TouchableOpacity style={styles.viewfinder} onPress={next} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel={t("clinic.scanHint")}>
            <Text style={styles.hint}>{t("clinic.scanHint")}</Text>
            <View style={styles.frame}>
              <View style={[CORNER, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 }]} />
              <View style={[CORNER, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 }]} />
              <View style={[CORNER, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 }]} />
              <View style={[CORNER, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 }]} />
              <View style={styles.line} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, rowStyles.row]} onPress={next} accessibilityRole="button">
            <View style={rowStyles.iconChip}>
              <Ionicons name="qr-code-outline" size={19} color={Theme.colors.purple} />
            </View>
            <View style={rowStyles.rowText}>
              <Text style={rowStyles.rowTitle}>{t("clinic.noQr")}</Text>
              <Text style={rowStyles.rowSub}>{t("clinic.enterManually")}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Theme.colors.inkFaint} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.outline} onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.outlineText}>{t("clinic.cancel")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // full width like the prototype, so it cancels the horizontal padding of the content
  viewfinder: { backgroundColor: Theme.colors.viewfinder, marginHorizontal: -22, height: 360, paddingTop: 30, alignItems: "center", gap: 24 },
  hint: { fontFamily: Theme.typography.heading, fontSize: 13, color: Theme.colors.surface },
  frame: { width: 230, height: 230, alignItems: "center", justifyContent: "center" },
  line: { width: "92%", height: 2, backgroundColor: Theme.colors.magenta },
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  outline: { height: 50, borderRadius: Theme.borderRadius.sm, borderWidth: 1.5, borderColor: Theme.colors.purple, backgroundColor: Theme.colors.surface, alignItems: "center", justifyContent: "center" },
  outlineText: { fontFamily: Theme.typography.heading, fontSize: 14.5, color: Theme.colors.purple },
});
