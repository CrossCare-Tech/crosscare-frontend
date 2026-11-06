import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { Pill, Tone } from "@/components/vitals/VitalsUI";
import { Section, usePregnancySummary } from "@/hooks/usePregnancySummary";
import type { Feeling, MedicationRow, MedicationStatus, Milestone, VitalKind, VitalRow, VitalStatus } from "./model";

// The three data sections of the Pregnancy Summary, also meant for the PDF preview.

const STATUS_TONE: Record<VitalStatus, Tone> = { outOfRange: "warning", attention: "warning", normal: "success", noRange: "teal" };
const MEDICATION_TONE: Record<MedicationStatus, Tone> = { takenToday: "success", overdue: "warning", takenEarlier: "teal", never: "teal" };

const useDates = () => {
  const { i18n } = useTranslation();
  const day = (key: string) => {
    const [year, month, date] = key.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, date).toLocaleDateString(i18n.language, { dateStyle: "medium" });
  };
  const moment = (iso: string) => new Date(iso).toLocaleString(i18n.language, { dateStyle: "medium", timeStyle: "short" });
  // The day alone when the API did not keep the time; the section explains it once, in a note
  const when = (key: string, iso: string | null) => (iso ? moment(iso) : day(key));
  return { day, when };
};

// The heading, plus what to show while there is nothing to list
const SectionCard = <T,>({
  title,
  section,
  isEmpty,
  emptyText,
  onRetry,
  tag,
  plain,
  children,
}: {
  title: string;
  section: Section<T>;
  isEmpty: (data: T) => boolean;
  emptyText: string;
  onRetry: () => void;
  tag?: React.ReactNode;
  plain?: boolean; // the content brings its own cards
  children: (data: T) => React.ReactNode;
}) => {
  const { t } = useTranslation();
  const { state, data } = section;
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.heading} accessibilityRole="header">
          {title}
        </Text>
        {tag}
      </View>
      <View style={[styles.card, plain && state === "ready" && styles.cardPlain]}>
        {state === "loading" ? (
          <ActivityIndicator color={Theme.colors.magenta} accessibilityLabel={t("pregnancySummary.loading")} />
        ) : state === "error" ? (
          <View style={styles.message}>
            <Text style={styles.secondary}>{t("pregnancySummary.loadFailed")}</Text>
            <TouchableOpacity style={styles.retry} onPress={onRetry} accessibilityRole="button">
              <Text style={styles.retryText}>{t("pregnancySummary.retry")}</Text>
            </TouchableOpacity>
          </View>
        ) : state === "unavailable" ? (
          <Text style={styles.secondary}>{t("pregnancySummary.demoOnly")}</Text>
        ) : data === null || isEmpty(data) ? (
          <Text style={styles.secondary}>{emptyText}</Text>
        ) : (
          children(data)
        )}
      </View>
    </View>
  );
};

const VITAL_ICONS: Record<VitalKind, keyof typeof MaterialCommunityIcons.glyphMap> = {
  bloodPressure: "heart-pulse",
  glucose: "water-outline",
  heartRate: "heart-outline",
  weight: "scale-bathroom",
};

export const VitalsSection = ({ section, onRetry }: { section: Section<VitalRow[]>; onRetry: () => void }) => {
  const { t } = useTranslation();
  const { when } = useDates();
  const outOfRange = (section.data || []).filter((row) => row.status === "outOfRange").length;
  return (
    <SectionCard
      title={t("pregnancySummary.vitals")}
      tag={outOfRange > 0 ? <Pill label={t("pregnancySummary.outOfRangeNotice", { count: outOfRange })} tone="warning" /> : undefined}
      plain
      section={section}
      isEmpty={(rows) => rows.every((row) => row.value === null)}
      emptyText={t("pregnancySummary.noVitals")}
      onRetry={onRetry}
    >
      {(rows) => (
        <>
          <View style={styles.tiles}>
            {rows.map((row) => {
              const flagged = row.status === "outOfRange";
              const color = flagged ? Theme.colors.warning : Theme.colors.purple;
              return (
                <View key={row.id} style={[styles.tile, flagged && styles.tileFlagged]}>
                  <View style={styles.tileTop}>
                    <MaterialCommunityIcons name={VITAL_ICONS[row.kind]} size={20} color={color} />
                    {flagged && <Feather name="alert-triangle" size={16} color={Theme.colors.warning} />}
                  </View>
                  <Text style={styles.tileLabel}>{t(`pregnancySummary.${row.kind}`)}</Text>
                  <Text style={styles.value}>
                    {row.value ?? "--"} {row.value !== null && <Text style={styles.unit}>{row.unit}</Text>}
                  </Text>
                  {row.value !== null && (
                    <View style={styles.tilePill}>
                      <Pill label={t(`pregnancySummary.status.${row.status}`)} tone={STATUS_TONE[row.status]} />
                    </View>
                  )}
                  <Text style={styles.tileDate}>
                    {row.value === null
                      ? t("pregnancySummary.noReading")
                      : [when(row.day!, row.recordedAt), row.fasting ? t("pregnancySummary.fasting") : null].filter(Boolean).join(" · ")}
                  </Text>
                </View>
              );
            })}
          </View>
          {rows.some((row) => row.value !== null && !row.recordedAt) && <Text style={styles.note}>{t("pregnancySummary.timesNote")}</Text>}
        </>
      )}
    </SectionCard>
  );
};

const MEDICATION_ICONS: Record<MedicationStatus, keyof typeof Feather.glyphMap> = {
  takenToday: "check",
  overdue: "clock",
  takenEarlier: "check",
  never: "minus",
};

export const MedicationsSection = ({ section, onRetry }: { section: Section<MedicationRow[]>; onRetry: () => void }) => {
  const { t } = useTranslation();
  const { when } = useDates();
  return (
    <SectionCard
      title={t("pregnancySummary.medications")}
      section={section}
      isEmpty={(rows) => rows.length === 0}
      emptyText={t("pregnancySummary.noMedications")}
      onRetry={onRetry}
    >
      {(rows) => (
        <>
          {rows.map((med, index) => (
            <View key={med.id} style={[styles.row, index > 0 && styles.divider]}>
              <View style={styles.iconChip}>
                <MaterialCommunityIcons name="pill" size={20} color={Theme.colors.purple} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>{med.name}</Text>
                <Text style={styles.secondary}>
                  {[
                    med.times.join(", "),
                    t("pregnancySummary.lastTaken", {
                      when: med.lastTakenDay ? when(med.lastTakenDay, med.lastTakenAt) : t("pregnancySummary.neverTaken"),
                    }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
              <View style={styles.rowEnd}>
                <Feather name={MEDICATION_ICONS[med.status]} size={16} color={med.status === "overdue" ? Theme.colors.warning : Theme.colors.inkFaint} />
                <Pill label={t(`pregnancySummary.medStatus.${med.status}`)} tone={MEDICATION_TONE[med.status]} />
              </View>
            </View>
          ))}
        </>
      )}
    </SectionCard>
  );
};

export const FeelingSection = ({ section, onRetry }: { section: Section<Feeling>; onRetry: () => void }) => {
  const { t } = useTranslation();
  const { day } = useDates();
  return (
    <SectionCard
      title={t("pregnancySummary.feeling")}
      section={section}
      isEmpty={(data) => !data.moodEntries && !data.symptomEntries && !data.noteTopics.length}
      emptyText={t("pregnancySummary.noFeeling")}
      onRetry={onRetry}
    >
      {(data) => {
        const sources = [
          data.moodEntries > 0 && t("pregnancySummary.source.mood"),
          data.symptomEntries > 0 && t("pregnancySummary.source.symptoms"),
          data.noteTopics.length > 0 && t("pregnancySummary.source.guide"),
        ].filter(Boolean);
        const chips = [
          ...data.symptomTypes.map((type) => t(`symptomLog.types.${type}`, { defaultValue: type.replace(/_/g, " ") })),
          ...data.noteTopics.map((topic) => t(`pregnancySummary.note.${topic}`)),
        ];
        return (
          <View style={styles.feeling}>
            <Text style={styles.secondary}>{t("pregnancySummary.period", { start: day(data.start), end: day(data.end) })}</Text>
            <View style={styles.moodRow}>
              <View style={styles.moodStat}>
                <Text style={styles.moodEmoji}>😊</Text>
                <Text style={styles.value}>{data.moodEntries - data.lowMoodEntries}</Text>
                <Text style={styles.secondary}>{t("pregnancySummary.feltOk")}</Text>
              </View>
              <View style={styles.moodStat}>
                <Text style={styles.moodEmoji}>😔</Text>
                <Text style={styles.value}>{data.lowMoodEntries}</Text>
                <Text style={styles.secondary}>{t("pregnancySummary.feltLow")}</Text>
              </View>
            </View>
            {chips.length > 0 && (
              <View style={styles.chips}>
                {chips.map((chip) => (
                  <Text key={chip} style={styles.chip}>
                    {chip}
                  </Text>
                ))}
              </View>
            )}
            <Text style={styles.note}>
              {t("pregnancySummary.sources", { sources: sources.join(", ") })} {t("pregnancySummary.notDiagnosis")}
            </Text>
          </View>
        );
      }}
    </SectionCard>
  );
};

// The health details, as Health details and the PDF preview show them
export const SummarySections = () => {
  const { vitals, medications, feeling, retry } = usePregnancySummary();
  return (
    <>
      <VitalsSection section={vitals} onRetry={retry} />
      <MedicationsSection section={medications} onRetry={retry} />
      <FeelingSection section={feeling} onRetry={retry} />
    </>
  );
};

export const MilestonesSection = ({ rows }: { rows: Milestone[] }) => {
  const { t, i18n } = useTranslation();
  const next = rows.findIndex((row) => !row.done);
  const done = rows.filter((row) => row.done).length;
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.heading} accessibilityRole="header">
          {t("summaryExport.milestones")}
        </Text>
        <Pill label={t("pregnancySummary.demo")} tone="teal" />
      </View>
      <View style={[styles.card, styles.cardSoft]}>
        <View style={styles.timeline}>
          <View style={styles.spine}>
            <LinearGradient
              colors={[Theme.colors.magentaVivid, Theme.colors.purple]}
              style={[styles.spineDone, { height: `${(done / rows.length) * 90}%` }]}
            />
          </View>
          {rows.map((row, index) => (
            <View key={row.key} style={[styles.milestone, index === rows.length - 1 && styles.milestoneLast]}>
              {index === next && <View style={styles.dotHalo} />}
              <View style={[styles.dot, row.done ? styles.dotDone : index === next ? styles.dotNow : null]} />
              <Text style={styles.label}>{t(`summaryExport.milestone.${row.key}`)}</Text>
              <Text style={styles.secondary}>
                {t(row.done ? "summaryExport.completed" : "summaryExport.scheduled")} ·{" "}
                {new Date(row.date).toLocaleDateString(
                  i18n.language,
                  row.done ? { month: "short", year: "numeric" } : { month: "short", day: "numeric", year: "numeric" }
                )}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timeline: {
    paddingVertical: Theme.spacing.sm,
    paddingLeft: 34,
    paddingRight: Theme.spacing.sm,
  },
  spine: {
    position: "absolute",
    left: 15,
    top: 12,
    bottom: 12,
    width: 2,
    borderRadius: 1,
    overflow: "hidden",
    backgroundColor: Theme.colors.hairline,
  },
  spineDone: {
    width: "100%",
  },
  milestone: {
    gap: 2,
    paddingBottom: 22,
  },
  milestoneLast: {
    paddingBottom: 0,
  },
  dot: {
    position: "absolute",
    left: -26,
    top: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  dotHalo: {
    position: "absolute",
    left: -30,
    top: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.magentaTint,
  },
  dotDone: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.magenta,
  },
  dotNow: {
    borderColor: Theme.colors.magentaVivid,
  },
  section: {
    gap: Theme.spacing.sm,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  heading: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkFaint,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    padding: Theme.spacing.sm,
    gap: Theme.spacing.xs,
    ...Theme.shadows.card,
  },
  cardSoft: {
    borderWidth: 0,
  },
  cardPlain: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  tile: {
    width: "48.5%",
    gap: Theme.spacing.xs,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.card,
  },
  tileFlagged: {
    borderColor: Theme.colors.warningTint,
    backgroundColor: Theme.colors.warningTint,
  },
  tileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 22,
  },
  tileLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkSoft,
  },
  tilePill: {
    alignSelf: "flex-start",
  },
  tileDate: {
    fontFamily: Theme.typography.body,
    fontSize: 11,
    color: Theme.colors.inkFaint,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.purpleTint,
    alignItems: "center",
    justifyContent: "center",
  },
  moodRow: {
    flexDirection: "row",
    gap: 10,
  },
  moodStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.bg,
  },
  moodEmoji: {
    fontSize: 22,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
    backgroundColor: Theme.colors.purpleTint,
    fontFamily: Theme.typography.subheading,
    fontSize: 12,
    color: Theme.colors.purple,
  },
  message: {
    alignItems: "flex-start",
    gap: Theme.spacing.sm,
    padding: Theme.spacing.sm,
  },
  retry: {
    minHeight: 44,
    justifyContent: "center",
  },
  retryText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.magenta,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.sm,
  },
  rowEnd: {
    alignItems: "flex-end",
    gap: Theme.spacing.xs,
  },
  note: {
    paddingHorizontal: Theme.spacing.sm,
    paddingBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: Theme.colors.inkFaint,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairlineLight,
  },
  label: {
    flexShrink: 1,
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
  value: {
    fontFamily: Theme.typography.display,
    fontSize: 22,
    color: Theme.colors.ink,
  },
  unit: {
    fontFamily: Theme.typography.body,
    fontSize: 12,
    color: Theme.colors.inkFaint,
  },
  secondary: {
    fontFamily: Theme.typography.body,
    fontSize: 12,
    lineHeight: 17,
    color: Theme.colors.inkFaint,
  },
  feeling: {
    gap: Theme.spacing.sm,
    padding: Theme.spacing.sm,
  },
});
