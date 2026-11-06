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
import { styles as rowStyles } from "@/components/devices/DeviceSourceRows";
import { SAMPLE_CLINICS, useClinicStore } from "@/zustandStore/clinicStore";
import { useDemoMode } from "@/utils/demo/demoMode";

// Prototype 4.3 "Active Clinic Selector": the connected clinics and which one receives the active data.
export default function ClinicsScreen() {
  const { t } = useTranslation();
  const demo = useDemoMode((state) => state.enabled);
  const { joined, activeId, setActive } = useClinicStore();
  const clinics = [...(demo ? SAMPLE_CLINICS : []), ...joined];
  const active = activeId ?? clinics[0]?.id;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("clinic.yourClinics")} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <Text style={styles.intro}>
            {clinics.length > 0 ? t("clinic.connectedTo", { count: clinics.length }) : t("clinic.none")}
          </Text>

          {clinics.map((clinic) => {
            const selected = clinic.id === active;
            return (
              <TouchableOpacity
                key={clinic.id}
                style={[styles.card, rowStyles.row]}
                onPress={() => setActive(clinic.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View style={rowStyles.iconChip}>
                  <Ionicons name="business-outline" size={20} color={Theme.colors.purple} />
                </View>
                <View style={rowStyles.rowText}>
                  <Text style={rowStyles.rowTitle}>{clinic.name}</Text>
                  <Text style={rowStyles.rowSub}>
                    {selected ? t("clinic.activePrimary") : t("clinic.secondaryReadOnly")}
                  </Text>
                </View>
                <View style={[styles.radio, selected && styles.radioOn]}>{selected && <View style={styles.radioDot} />}</View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.outline} onPress={() => router.push("/patient/clinic-scan")} accessibilityRole="button">
            <Ionicons name="qr-code-outline" size={18} color={Theme.colors.purple} />
            <Text style={styles.outlineText}>{t("clinic.joinAnother")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: { fontFamily: Theme.typography.body, fontSize: 12.5, lineHeight: 18, color: Theme.colors.inkFaint },
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Theme.colors.hairline, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: Theme.colors.magenta },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Theme.colors.magenta },
  outline: {
    height: 50,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Theme.colors.purple, backgroundColor: Theme.colors.surface,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineText: { fontFamily: Theme.typography.heading, fontSize: 14.5, color: Theme.colors.purple },
});
