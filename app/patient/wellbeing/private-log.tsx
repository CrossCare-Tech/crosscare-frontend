import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthTopBar from "@/components/ui/AuthTopBar";
import InlineNotice, { Notice } from "@/components/ui/InlineNotice";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { Chip, ChipRow, Field, PrimaryButton, wellbeingStyles as shared } from "@/components/wellbeing/WellbeingUI";
import { PrivateActivity, PrivateSymptom, dayKeyOf } from "@/components/wellbeing/model";
import { Theme } from "@/constants/theme";
import { useDemoWellbeing } from "@/utils/demo/demoWellbeing";

const ACTIVITIES: PrivateActivity[] = ["protected", "unprotected", "none"];
const SYMPTOMS: PrivateSymptom[] = ["discomfort", "spotting", "none"];

// 9.2: sexual activity and symptoms
const PrivateLogScreen = () => {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ day?: string }>();
  const day = params.day ?? dayKeyOf(new Date());

  const saved = useDemoWellbeing((state) => state.privateLogs[day]);
  const savePrivateLog = useDemoWellbeing((state) => state.savePrivateLog);

  const [activity, setActivity] = useState<PrivateActivity | null>(saved?.activity ?? null);
  const [symptoms, setSymptoms] = useState<PrivateSymptom[]>(saved?.symptoms ?? []);
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [notice, setNotice] = useState<Notice>(null);

  // "None" cannot be picked together with a symptom
  const toggleSymptom = (symptom: PrivateSymptom) => {
    setNotice(null);
    setSymptoms((current) => {
      if (current.includes(symptom)) return current.filter((item) => item !== symptom);
      if (symptom === "none") return ["none"];
      return [...current.filter((item) => item !== "none"), symptom];
    });
  };

  const save = () => {
    savePrivateLog(day, { activity, symptoms, notes: notes.trim() });
    setNotice({ variant: "info", message: t("wellbeingCare.saved") });
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={shared.safeArea}>
        <AuthTopBar title={t("wellbeingCare.privateLog")} />
        <KeyboardAvoidingView style={shared.safeArea} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={shared.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={shared.note}>{t("wellbeingCare.privateNote")}</Text>

            <Field label={t("wellbeingCare.activity")}>
              <ChipRow>
                {ACTIVITIES.map((item) => (
                  <Chip
                    key={item}
                    label={t(`wellbeingCare.activities.${item}`)}
                    selected={activity === item}
                    onPress={() => {
                      setNotice(null);
                      setActivity(activity === item ? null : item);
                    }}
                  />
                ))}
              </ChipRow>
            </Field>

            <Field label={t("wellbeingCare.symptoms")}>
              <ChipRow>
                {SYMPTOMS.map((item) => (
                  <Chip
                    key={item}
                    label={t(`wellbeingCare.privateSymptoms.${item}`)}
                    selected={symptoms.includes(item)}
                    onPress={() => toggleSymptom(item)}
                  />
                ))}
              </ChipRow>
            </Field>

            <Field label={t("wellbeingCare.notes")}>
              <TextInput
                style={styles.notes}
                value={notes}
                onChangeText={(text) => {
                  setNotice(null);
                  setNotes(text);
                }}
                placeholder={t("wellbeingCare.notesPlaceholder")}
                placeholderTextColor={Theme.colors.inkFaint}
                multiline
                textAlignVertical="top"
              />
            </Field>

            <InlineNotice notice={notice} />
            <PrimaryButton label={t("wellbeingCare.save")} onPress={save} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default PrivateLogScreen;

const styles = StyleSheet.create({
  notes: {
    minHeight: 96,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Theme.colors.inputBorder,
    backgroundColor: Theme.colors.inputBg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14.5,
    fontFamily: Theme.typography.body,
    color: Theme.colors.ink,
  },
});
