import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { metricStyles } from "@/components/vitals/MetricUI";
import { EXTRA_CLINIC, SAMPLE_CLINICS, useClinicStore } from "@/zustandStore/clinicStore";
import { useDemoMode } from "@/utils/demo/demoMode";

// Prototype 4.2 "Clinic Confirmation": the clinic found by the scan, before it is connected.
// ponytail: the clinic comes from a fixed list (first one not connected yet) until a scan returns a real one.
export default function ClinicConfirmScreen() {
  const { t, i18n } = useTranslation();
  const demo = useDemoMode((state) => state.enabled);
  const { joined, join, setActive } = useClinicStore();
  const connected = [...(demo ? SAMPLE_CLINICS : []), ...joined];
  const clinic = [...SAMPLE_CLINICS, EXTRA_CLINIC].find((c) => !connected.some((x) => x.id === c.id)) ?? EXTRA_CLINIC;

  const confirm = () => {
    join(clinic);
    setActive(clinic.id);
    router.dismissTo("/patient/clinics");
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("clinic.confirmTitle")} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="business-outline" size={24} color={Theme.colors.purple} />
            </View>
            <Text style={styles.name}>{clinic.name}</Text>
            <Text style={styles.address}>{clinic.address}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>{t("clinic.provider")}</Text>
              <Text style={styles.value}>{clinic.provider}</Text>
            </View>
            <View style={[styles.row, styles.divider]}>
              <Text style={styles.label}>{t("clinic.patients")}</Text>
              <Text style={styles.value}>{clinic.patients.toLocaleString(i18n.language)}</Text>
            </View>
            <View style={[styles.row, styles.divider]}>
              <Text style={styles.label}>{t("clinic.verified")}</Text>
              <Ionicons name="shield-checkmark-outline" size={18} color={Theme.colors.success} />
            </View>
          </View>

          <Text style={styles.note}>{t("clinic.shareNote")}</Text>

          <TouchableOpacity style={styles.primary} onPress={confirm} accessibilityRole="button">
            <Text style={styles.primaryText}>{t("clinic.confirm")}</Text>
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
  hero: { backgroundColor: Theme.colors.magentaTint, borderRadius: 20, paddingVertical: 26, alignItems: "center", gap: 4 },
  heroIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: Theme.colors.surface, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  name: { fontFamily: Theme.typography.display, fontSize: 21, color: Theme.colors.ink },
  address: { fontFamily: Theme.typography.body, fontSize: 12.5, color: Theme.colors.inkFaint },
  card: { backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.hairline, borderRadius: Theme.borderRadius.lg, paddingHorizontal: Theme.spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 50 },
  divider: { borderTopWidth: 1, borderTopColor: Theme.colors.hairlineLight },
  label: { fontFamily: Theme.typography.body, fontSize: 13, color: Theme.colors.inkSoft },
  value: { fontFamily: Theme.typography.heading, fontSize: 13.5, color: Theme.colors.ink },
  note: { fontFamily: Theme.typography.body, fontSize: 12.5, lineHeight: 18, color: Theme.colors.inkFaint, textAlign: "center" },
  primary: { height: 52, borderRadius: Theme.borderRadius.sm, backgroundColor: Theme.colors.magenta, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: Theme.typography.heading, fontSize: 15, color: Theme.colors.surface },
  outline: { height: 50, borderRadius: Theme.borderRadius.sm, borderWidth: 1.5, borderColor: Theme.colors.purple, backgroundColor: Theme.colors.surface, alignItems: "center", justifyContent: "center" },
  outlineText: { fontFamily: Theme.typography.heading, fontSize: 14.5, color: Theme.colors.purple },
});
