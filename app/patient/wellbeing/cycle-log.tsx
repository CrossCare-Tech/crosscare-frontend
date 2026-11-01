import React, { useMemo, useState } from "react";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthTopBar from "@/components/ui/AuthTopBar";
import InlineNotice, { Notice } from "@/components/ui/InlineNotice";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { Chip, ChipRow, Field, LinkRow, PrimaryButton, wellbeingStyles as shared } from "@/components/wellbeing/WellbeingUI";
import { CycleSymptom, Flow, cycleDayOn, dateOf, dayKeyOf, summarizeCycle } from "@/components/wellbeing/model";
import { Theme } from "@/constants/theme";
import { useDemoWellbeing } from "@/utils/demo/demoWellbeing";

const FLOWS: Flow[] = ["light", "medium", "heavy", "spotting"];
const SYMPTOMS: CycleSymptom[] = ["cramps", "headache", "bloating", "fatigue"];

// 9.1: today's log, or the day picked on the calendar
const CycleLogScreen = () => {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{ day?: string }>();
  const today = dayKeyOf(new Date());
  const day = params.day ?? today;

  const logs = useDemoWellbeing((state) => state.cycleLogs);
  const saveCycleLog = useDemoWellbeing((state) => state.saveCycleLog);

  const [flow, setFlow] = useState<Flow | null>(logs[day]?.flow ?? null);
  const [symptoms, setSymptoms] = useState<CycleSymptom[]>(logs[day]?.symptoms ?? []);
  const [notice, setNotice] = useState<Notice>(null);

  const toggleSymptom = (symptom: CycleSymptom) => {
    setNotice(null);
    setSymptoms((current) =>
      current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom]
    );
  };

  const save = () => {
    saveCycleLog(day, { flow, symptoms });
    setNotice({ variant: "info", message: t("wellbeingCare.saved") });
  };

  // Includes the flow picked on screen, so choosing one on a new period day shows day 1 right away
  const cycleDay = useMemo(() => {
    const { starts } = summarizeCycle({ ...logs, [day]: { flow, symptoms } }, today);
    return cycleDayOn(starts, day);
  }, [logs, day, flow, symptoms, today]);

  const dateLabel = dateOf(day).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });

  return (
    <ScreenBackground>
      <SafeAreaView style={shared.safeArea}>
        <AuthTopBar title={t("wellbeingCare.cycleLog")} />
        <ScrollView contentContainerStyle={shared.content} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[Theme.colors.magentaTint, Theme.colors.purpleTint]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={shared.hero}
          >
            <Text style={shared.heroLabel}>{day === today ? t("wellbeingCare.cycleDay") : dateLabel}</Text>
            <Text style={shared.heroValue}>
              {cycleDay ? t("wellbeingCare.dayNumber", { day: cycleDay }) : t("wellbeingCare.noCycleDay")}
            </Text>
          </LinearGradient>

          <Field label={t("wellbeingCare.flow")}>
            <ChipRow>
              {FLOWS.map((item) => (
                <Chip
                  key={item}
                  label={t(`wellbeingCare.flows.${item}`)}
                  selected={flow === item}
                  onPress={() => {
                    setNotice(null);
                    setFlow(flow === item ? null : item);
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
                  label={t(`wellbeingCare.cycleSymptoms.${item}`)}
                  selected={symptoms.includes(item)}
                  onPress={() => toggleSymptom(item)}
                />
              ))}
            </ChipRow>
          </Field>

          <InlineNotice notice={notice} />
          <PrimaryButton label={day === today ? t("wellbeingCare.saveToday") : t("wellbeingCare.saveDay")} onPress={save} />

          <LinkRow
            icon="calendar"
            label={t("wellbeingCare.cycleCalendar")}
            onPress={() => router.push("/patient/wellbeing/cycle-calendar")}
          />
          <LinkRow
            icon="lock"
            label={t("wellbeingCare.privateLog")}
            onPress={() => router.push({ pathname: "/patient/wellbeing/private-log", params: { day } })}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default CycleLogScreen;
