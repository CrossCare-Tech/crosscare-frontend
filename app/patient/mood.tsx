import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { useMoodStore } from "@/zustandStore/useMoodStore";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { useAuthDialog } from "@/components/ui/AuthDialog";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { Pill, ReadingModal, Tone } from "@/components/vitals/VitalsUI";
import {
  AddReadingButton,
  daysAgo,
  fmtDate,
  GuideNote,
  metricParts,
  metricStyles,
  SectionLabel,
  toLocalDay,
} from "@/components/vitals/MetricUI";

type MoodLevel = "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";

const MOODS: { level: MoodLevel; emoji: string; tone: Tone }[] = [
  { level: "VERY_LOW", emoji: "😢", tone: "warning" },
  { level: "LOW", emoji: "😔", tone: "warning" },
  { level: "MODERATE", emoji: "😐", tone: "teal" },
  { level: "HIGH", emoji: "😊", tone: "success" },
  { level: "VERY_HIGH", emoji: "😄", tone: "success" },
];
const moodOf = (level: MoodLevel) => MOODS.find((mood) => mood.level === level) ?? MOODS[2];

// Mood picker and the two 0–10 scales, shared by today's card and the edit sheet
const MoodForm = ({
  mood,
  stress,
  energy,
  onMood,
  onStress,
  onEnergy,
}: {
  mood: MoodLevel | null;
  stress: number;
  energy: number;
  onMood: (level: MoodLevel) => void;
  onStress: (value: number) => void;
  onEnergy: (value: number) => void;
}) => {
  const { t } = useTranslation();
  const scale = (label: string, value: number, onChange: (value: number) => void) => (
    <View style={styles.scale}>
      <View style={styles.scaleTop}>
        <Text style={styles.scaleLabel}>{label}</Text>
        <Text style={styles.scaleValue}>{value}/10</Text>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={Theme.colors.magenta}
        maximumTrackTintColor={Theme.colors.hairline}
        thumbTintColor={Theme.colors.magenta}
        accessibilityLabel={label}
      />
      <View style={styles.scaleEnds}>
        <Text style={styles.scaleEnd}>{t("moodLog.low")}</Text>
        <Text style={styles.scaleEnd}>{t("moodLog.high")}</Text>
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.moods} accessibilityRole="radiogroup">
        {MOODS.map((option) => {
          const selected = option.level === mood;
          return (
            <TouchableOpacity
              key={option.level}
              style={[styles.mood, selected && styles.moodOn]}
              onPress={() => onMood(option.level)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
            >
              <Text style={styles.moodEmoji}>{option.emoji}</Text>
              <Text style={[styles.moodLabel, selected && styles.moodLabelOn]}>{t(`moodLog.${option.level}`)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {scale(t("moodLog.stress"), stress, onStress)}
      {scale(t("moodLog.energy"), energy, onEnergy)}
    </>
  );
};

type Entry = { id: string; date: string; moodLevel: MoodLevel; stressLevel?: number; energyLevel?: number };

// Mood: how she feels today, then the last 30 days
export default function MoodScreen() {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  const token = user?.token;
  const { t, i18n } = useTranslation();
  const { dialog, show } = useAuthDialog();
  const { currentMood, currentStress, currentEnergy, moodHistory, isLoading, fetchMoodHistory, logMood, updateMood, deleteMood } =
    useMoodStore();

  const [mood, setMood] = useState<MoodLevel | null>(currentMood);
  const [stress, setStress] = useState(currentStress);
  const [energy, setEnergy] = useState(currentEnergy);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [editMood, setEditMood] = useState<MoodLevel>("MODERATE");
  const [editStress, setEditStress] = useState(5);
  const [editEnergy, setEditEnergy] = useState(5);

  useEffect(() => {
    if (userId) fetchMoodHistory(userId, 30, token);
  }, [userId, token]);

  const todayStr = fmtDate(daysAgo(0));
  const entries: Entry[] = [...moodHistory]
    .map((entry: any) => ({ ...entry, date: toLocalDay(entry.date) }))
    .sort((a, b) => b.date.localeCompare(a.date));
  const todayEntry = entries.find((entry) => entry.date === todayStr);

  // Start today's card from today's entry when there is one
  useEffect(() => {
    if (!todayEntry) return;
    setMood(todayEntry.moodLevel);
    setStress(todayEntry.stressLevel ?? 5);
    setEnergy(todayEntry.energyLevel ?? 5);
  }, [todayEntry?.id]);

  const dayLabel = (date: string) => {
    if (date === todayStr) return t("bloodPressureLog.today");
    if (date === fmtDate(daysAgo(1))) return t("bloodPressureLog.yesterday");
    return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  };

  const save = async () => {
    if (!userId) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.loginAgain"));
      return;
    }
    if (!mood) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("moodLog.pickFirst"));
      return;
    }
    setSaving(true);
    const success = todayEntry
      ? await updateMood(userId, todayEntry.id, { moodLevel: mood, stressLevel: stress, energyLevel: energy }, token)
      : await logMood(userId, { moodLevel: mood, stressLevel: stress, energyLevel: energy }, token);
    setSaving(false);
    show({
      variant: success ? "success" : "error",
      title: success ? t("moodLog.title") : t("vitalsEntry.errorTitle"),
      message: success ? t("moodLog.saved") : t("vitalsEntry.saveFailed"),
    });
  };

  const openEdit = (entry: Entry) => {
    setEditMood(entry.moodLevel);
    setEditStress(entry.stressLevel ?? 5);
    setEditEnergy(entry.energyLevel ?? 5);
    setEditing(entry);
  };

  const saveEdit = async () => {
    if (!userId || !editing) return;
    setSaving(true);
    const success = await updateMood(
      userId,
      editing.id,
      { moodLevel: editMood, stressLevel: editStress, energyLevel: editEnergy },
      token
    );
    setSaving(false);
    if (success) setEditing(null);
    else Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
  };

  // Close the edit sheet first so the confirmation is not stacked on top of it
  const confirmDelete = () => {
    if (!userId || !editing) return;
    const entry = editing;
    setEditing(null);
    show({
      variant: "delete",
      title: t("moodLog.delete"),
      message: t("moodLog.deleteConfirm", { date: dayLabel(entry.date) }),
      buttons: [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("moodLog.delete"),
          onPress: async () => {
            const success = await deleteMood(userId, entry.id, token);
            if (!success) Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
          },
        },
      ],
    });
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("moodLog.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <View style={[metricParts.card, metricParts.hero, styles.today]}>
            <Text style={metricParts.when}>
              {todayEntry ? `${t("bloodPressureLog.today")} · ${t("moodLog.logged")}` : t("bloodPressureLog.today")}
            </Text>
            <Text style={styles.question}>{t("moodLog.question")}</Text>
            <MoodForm mood={mood} stress={stress} energy={energy} onMood={setMood} onStress={setStress} onEnergy={setEnergy} />
          </View>

          <GuideNote text={t("moodLog.guide")} />

          <SectionLabel>{t("moodLog.history")}</SectionLabel>
          {isLoading && entries.length === 0 ? (
            <ActivityIndicator color={Theme.colors.magenta} />
          ) : entries.length === 0 ? (
            <Text style={styles.empty}>{t("moodLog.noHistory")}</Text>
          ) : (
            <View style={[metricParts.card, styles.list]}>
              {entries.map((entry, index) => {
                const option = moodOf(entry.moodLevel);
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={[styles.row, index > 0 && styles.divider]}
                    onPress={() => openEdit(entry)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.rowEmoji}>{option.emoji}</Text>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{dayLabel(entry.date)}</Text>
                      <Text style={styles.rowSub}>
                        {t("moodLog.stressValue", { value: entry.stressLevel ?? "–" })} ·{" "}
                        {t("moodLog.energyValue", { value: entry.energyLevel ?? "–" })}
                      </Text>
                    </View>
                    <Pill label={t(`moodLog.${entry.moodLevel}`)} tone={option.tone} />
                    <Feather name="chevron-right" size={18} color={Theme.colors.inkFaint} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        <AddReadingButton label={todayEntry ? t("moodLog.update") : t("moodLog.save")} onPress={save} />

        <ReadingModal
          visible={!!editing}
          loading={saving}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          title={t("moodLog.editTitle")}
          saveLabel={t("moodLog.saveChanges")}
          showDateTime={false}
        >
          {editing && <Text style={styles.editDate}>{dayLabel(editing.date)}</Text>}
          <MoodForm
            mood={editMood}
            stress={editStress}
            energy={editEnergy}
            onMood={setEditMood}
            onStress={setEditStress}
            onEnergy={setEditEnergy}
          />
          <TouchableOpacity onPress={confirmDelete} style={styles.deleteButton} accessibilityRole="button">
            <Feather name="trash-2" size={16} color={Theme.colors.danger} />
            <Text style={styles.deleteText}>{t("moodLog.delete")}</Text>
          </TouchableOpacity>
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
  today: {
    gap: 12,
  },
  question: {
    fontFamily: Theme.typography.display,
    fontSize: 20,
    lineHeight: 26,
    color: Theme.colors.ink,
  },
  moods: {
    flexDirection: "row",
    gap: 6,
  },
  mood: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  moodOn: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.magentaTint,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontFamily: Theme.typography.subheading,
    fontSize: 10.5,
    color: Theme.colors.inkFaint,
    textAlign: "center",
  },
  moodLabelOn: {
    color: Theme.colors.magenta,
  },
  scale: {
    gap: 2,
  },
  scaleTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scaleLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
  scaleValue: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.magenta,
  },
  scaleEnds: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scaleEnd: {
    fontFamily: Theme.typography.body,
    fontSize: 11,
    color: Theme.colors.inkFaint,
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
    fontSize: 24,
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
  editDate: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
    marginBottom: Theme.spacing.sm,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Theme.spacing.md,
    paddingVertical: 6,
  },
  deleteText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.danger,
  },
});
