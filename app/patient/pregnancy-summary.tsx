import { usePreviewScreens } from "@/utils/demo/demoMode";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { Pill } from "@/components/vitals/VitalsUI";
import { buildMilestones, latestReading } from "@/components/pregnancy-summary/model";
import { LockedSheet } from "@/components/pregnancy-summary/ExportSheets";
import { MilestonesSection } from "@/components/pregnancy-summary/Sections";
import { usePregnancySummary } from "@/hooks/usePregnancySummary";
import { hasPremiumAccess, usePremiumStatus } from "@/zustandStore/premiumStore";

// 6.1 — Pregnancy Summary (see docs/pregnancy-summary.md)
const PregnancySummary = () => {
  const { t } = useTranslation();
  const { patient, vitals, demo } = usePregnancySummary();
  const preview = usePreviewScreens();
  const premium = hasPremiumAccess(usePremiumStatus());
  // The demo switch only affects this export. Premium also gates the Concierge chat, so it is read, never changed.
  const [planIncludesExport, setPlanIncludesExport] = useState(true);
  const unlocked = premium && planIncludesExport;
  const [locked, setLocked] = useState(false);
  const openExport = (kind: "pdf" | "qr") => {
    if (unlocked) router.push(`/patient/pregnancy-summary/${kind}`);
    else setLocked(true);
  };
  const openDetails = () => router.push("/patient/pregnancy-summary/details");
  const managePlan = () => {
    setLocked(false);
    if (premium) setPlanIncludesExport(true);
    else router.push("/patient/profile-setting/premium");
  };
  const outOfRange = (vitals.data || []).filter((row) => row.status === "outOfRange").length;
  const [milestones] = useState(() => buildMilestones());
  const bloodPressure = latestReading(vitals.data, "bloodPressure");
  const glucose = latestReading(vitals.data, "glucose");
  const weight = latestReading(vitals.data, "weight");
  const chips = [
    { label: t("pregnancySummary.chip.bloodPressure"), value: bloodPressure?.value },
    { label: t("pregnancySummary.chip.glucose"), value: glucose?.value },
    { label: t("pregnancySummary.chip.weight"), value: weight && `${weight.value} ${weight.unit}` },
  ];
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("pregnancySummary.screenTitle")} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={[Theme.colors.magentaTint, Theme.colors.purpleTint]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.hero}>
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>{t("pregnancySummary.title")}</Text>
              {demo && <Pill label={t("pregnancySummary.demo")} tone="teal" />}
            </View>
            {!!patient && (
              <Text style={styles.name}>
                {[patient.name, patient.week ? t("homeB.week", { week: patient.week }) : null].filter(Boolean).join(" · ")}
              </Text>
            )}
            <View style={styles.chips}>
              {chips.map((chip) => (
                <View key={chip.label} style={styles.chip}>
                  <Text style={styles.chipValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {chip.value || "--"}
                  </Text>
                  <Text style={styles.chipLabel}>{chip.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
          {outOfRange > 0 && (
            <TouchableOpacity style={styles.alert} onPress={openDetails} accessibilityRole="button">
              <Feather name="alert-triangle" size={18} color={Theme.colors.warning} />
              <Text style={styles.alertText}>{t("pregnancySummary.outOfRangeNotice", { count: outOfRange })}</Text>
              <Feather name="chevron-right" size={16} color={Theme.colors.warning} />
            </TouchableOpacity>
          )}
          {/* The milestones are sample data (labelled Demo), so only demo and preview builds show them */}
          {preview && <MilestonesSection rows={milestones} />}
          {demo && (
            <View style={styles.planRow}>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{t("summaryExport.planRow")}</Text>
                <Text style={styles.rowSub}>{t("summaryExport.planHint")}</Text>
              </View>
              <Switch
                value={unlocked}
                disabled={!premium}
                onValueChange={setPlanIncludesExport}
                trackColor={{ false: Theme.colors.surfaceSunken, true: Theme.colors.magenta }}
                thumbColor={Theme.colors.surface}
                accessibilityLabel={t("summaryExport.planRow")}
              />
            </View>
          )}
          <TouchableOpacity style={styles.shareRow} onPress={openDetails} accessibilityRole="button">
            <View style={styles.shareIcon}>
              <Feather name="activity" size={19} color={Theme.colors.purple} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{t("pregnancySummary.detailsTitle")}</Text>
              <Text style={styles.rowSub}>{t("pregnancySummary.detailsHint")}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={Theme.colors.ink} />
          </TouchableOpacity>
          {/* The PDF and QR export are a demo (no file, link or message is created), so only demo and preview builds show them */}
          {preview && (
            <>
              <TouchableOpacity style={styles.shareRow} onPress={() => openExport("qr")} accessibilityRole="button">
                <View style={styles.shareIcon}>
                  <Feather name="file-text" size={19} color={Theme.colors.purple} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{t("summaryExport.shareTitle")}</Text>
                  <Text style={styles.rowSub}>{t("summaryExport.shareHint")}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={Theme.colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={() => openExport("pdf")} activeOpacity={0.88} accessibilityRole="button">
                <Text style={styles.exportText}>{t("summaryExport.export")}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
        {locked && <LockedSheet onClose={() => setLocked(false)} onManagePlan={managePlan} />}
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default PregnancySummary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.warningTint,
  },
  alertText: {
    flex: 1,
    fontFamily: Theme.typography.heading,
    fontSize: 12.5,
    color: Theme.colors.warning,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  shareIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Theme.colors.purpleTint,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.body,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  exportButton: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  exportText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.surface,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: Theme.spacing.xxl,
    gap: 18,
  },
  hero: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Theme.spacing.sm,
  },
  eyebrow: {
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    color: Theme.colors.inkSoft,
  },
  name: {
    marginTop: Theme.spacing.xs,
    fontFamily: Theme.typography.display,
    fontSize: 24,
    lineHeight: 30,
    color: Theme.colors.ink,
  },
  chips: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  chipValue: {
    fontFamily: Theme.typography.display,
    fontSize: 17,
    color: Theme.colors.ink,
  },
  chipLabel: {
    marginTop: 2,
    fontFamily: Theme.typography.heading,
    fontSize: 9,
    color: Theme.colors.inkFaint,
  },
});
