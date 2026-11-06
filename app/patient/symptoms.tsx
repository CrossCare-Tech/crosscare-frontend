import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { SYMPTOM_TYPES, useSymptomStore } from "@/zustandStore/useSymptomStore";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { useAuthDialog } from "@/components/ui/AuthDialog";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { Pill, ReadingModal, Tone } from "@/components/vitals/VitalsUI";
import { daysAgo, fmtDate, GuideNote, metricParts, metricStyles, SectionLabel, toLocalDay } from "@/components/vitals/MetricUI";

type Severity = "MILD" | "MODERATE" | "SEVERE";

const SEVERITIES: { level: Severity; tone: Tone }[] = [
  { level: "MILD", tone: "teal" },
  { level: "MODERATE", tone: "warning" },
  { level: "SEVERE", tone: "danger" },
];
const toneOf = (severity: string): Tone => SEVERITIES.find((item) => item.level === severity)?.tone ?? "teal";
const iconOf = (type: string) => SYMPTOM_TYPES.find((item) => item.id === type)?.icon ?? "🔸";

// Symptoms: pick one to log it with a severity, then this week's list
export default function SymptomsScreen() {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  const { t, i18n } = useTranslation();
  const { dialog, show } = useAuthDialog();
  const { symptoms, summary, isLoading, fetchSymptoms, logSymptom, deleteSymptom } = useSymptomStore();
  const [picked, setPicked] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Severity>("MILD");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userId) fetchSymptoms(userId);
  }, [userId]);

  const name = (type: string) => t(`symptomLog.types.${type}`, { defaultValue: type });
  const todayStr = fmtDate(daysAgo(0));
  const dayLabel = (date: string) => {
    if (date === todayStr) return t("bloodPressureLog.today");
    if (date === fmtDate(daysAgo(1))) return t("bloodPressureLog.yesterday");
    return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  };
  // occurredAt carries the real moment; older entries only have the API's UTC day
  const dayOf = (symptom: any) => (symptom.occurredAt ? fmtDate(new Date(symptom.occurredAt)) : toLocalDay(symptom.date));

  const open = (type: string) => {
    setSeverity("MILD");
    setPicked(type);
  };

  const save = async () => {
    if (!userId) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.loginAgain"));
      return;
    }
    if (!picked) return;
    setSaving(true);
    const success = await logSymptom(userId, { symptomType: picked, severity });
    setSaving(false);
    if (success) setPicked(null);
    else Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
  };

  const confirmDelete = (symptom: any) => {
    if (!userId) return;
    show({
      variant: "delete",
      title: t("symptomLog.delete"),
      message: t("symptomLog.deleteConfirm", { name: name(symptom.symptomType) }),
      buttons: [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("symptomLog.delete"),
          // Reload so the weekly summary drops the deleted entry too
          onPress: async () => {
            await deleteSymptom(userId, symptom.id);
            fetchSymptoms(userId);
          },
        },
      ],
    });
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("symptomLog.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <View style={[metricParts.card, metricParts.hero, styles.pickCard]}>
            <Text style={styles.question}>{t("symptomLog.question")}</Text>
            <View style={styles.grid}>
              {SYMPTOM_TYPES.map((symptom) => (
                <TouchableOpacity
                  key={symptom.id}
                  style={styles.chip}
                  onPress={() => open(symptom.id)}
                  accessibilityRole="button"
                >
                  <Text style={styles.chipEmoji}>{symptom.icon}</Text>
                  <Text style={styles.chipLabel} numberOfLines={2}>
                    {name(symptom.id)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <GuideNote text={t("symptomLog.guide")} />

          {summary && summary.totalSymptoms > 0 && (
            <View style={[metricParts.card, styles.summary]}>
              <Text style={styles.summaryValue}>{summary.totalSymptoms}</Text>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{t("symptomLog.thisWeek")}</Text>
                {summary.mostCommon && (
                  <Text style={styles.rowSub}>{t("symptomLog.mostCommon", { name: name(summary.mostCommon) })}</Text>
                )}
              </View>
            </View>
          )}

          <SectionLabel>{t("symptomLog.recent")}</SectionLabel>
          {isLoading && symptoms.length === 0 ? (
            <ActivityIndicator color={Theme.colors.magenta} />
          ) : symptoms.length === 0 ? (
            <Text style={styles.empty}>{t("symptomLog.noHistory")}</Text>
          ) : (
            <View style={[metricParts.card, styles.list]}>
              {symptoms.map((symptom: any, index: number) => (
                <View key={symptom.id} style={[styles.row, index > 0 && styles.divider]}>
                  <Text style={styles.rowEmoji}>{iconOf(symptom.symptomType)}</Text>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{name(symptom.symptomType)}</Text>
                    <Text style={styles.rowSub}>{dayLabel(dayOf(symptom))}</Text>
                  </View>
                  <Pill label={t(`symptomLog.${symptom.severity}`, { defaultValue: symptom.severity })} tone={toneOf(symptom.severity)} />
                  <TouchableOpacity
                    onPress={() => confirmDelete(symptom)}
                    accessibilityRole="button"
                    accessibilityLabel={t("symptomLog.delete")}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="trash-2" size={17} color={Theme.colors.inkFaint} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <ReadingModal
          visible={!!picked}
          loading={saving}
          onSave={save}
          onClose={() => setPicked(null)}
          title={t("symptomLog.logTitle")}
          saveLabel={t("symptomLog.logButton")}
          showDateTime={false}
        >
          {picked && (
            <View style={styles.sheetHead}>
              <Text style={styles.sheetEmoji}>{iconOf(picked)}</Text>
              <Text style={styles.sheetTitle}>{name(picked)}</Text>
            </View>
          )}
          <Text style={styles.sheetLabel}>{t("symptomLog.howSevere")}</Text>
          <View style={styles.severities} accessibilityRole="radiogroup">
            {SEVERITIES.map((option) => {
              const selected = option.level === severity;
              return (
                <TouchableOpacity
                  key={option.level}
                  style={[styles.severity, selected && styles.severityOn]}
                  onPress={() => setSeverity(option.level)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                >
                  <Text style={[styles.severityText, selected && styles.severityTextOn]}>
                    {t(`symptomLog.${option.level}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ReadingModal>
        {dialog}
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pickCard: {
    gap: 12,
  },
  question: {
    fontFamily: Theme.typography.display,
    fontSize: 20,
    lineHeight: 26,
    color: Theme.colors.ink,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    width: "31.5%",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  chipEmoji: {
    fontSize: 22,
  },
  chipLabel: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11.5,
    color: Theme.colors.ink,
    textAlign: "center",
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: Theme.spacing.md,
  },
  summaryValue: {
    fontFamily: Theme.typography.display,
    fontSize: 32,
    color: Theme.colors.magenta,
  },
  empty: {
    fontFamily: Theme.typography.body,
    fontSize: 13,
    color: Theme.colors.inkFaint,
  },
  list: {
    paddingHorizontal: Theme.spacing.md,
  },
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
  rowEmoji: {
    fontSize: 22,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 14.5,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Theme.spacing.md,
  },
  sheetEmoji: {
    fontSize: 26,
  },
  sheetTitle: {
    fontFamily: Theme.typography.display,
    fontSize: 20,
    color: Theme.colors.ink,
  },
  sheetLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.inkSoft,
    marginBottom: Theme.spacing.sm,
  },
  severities: {
    flexDirection: "row",
    gap: 8,
  },
  severity: {
    flex: 1,
    height: 44,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.surface,
  },
  severityOn: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.magentaTint,
  },
  severityText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 13.5,
    color: Theme.colors.inkSoft,
  },
  severityTextOn: {
    color: Theme.colors.magenta,
  },
});
