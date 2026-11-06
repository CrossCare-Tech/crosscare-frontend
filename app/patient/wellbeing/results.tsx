import React, { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthTopBar from "@/components/ui/AuthTopBar";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { NextStep, PrimaryButton, wellbeingStyles as shared } from "@/components/wellbeing/WellbeingUI";
import { PHQ_ITEMS, PHQ_OPTIONS, askedForSupport, phq9Band, phqScore } from "@/components/wellbeing/model";
import { Theme } from "@/constants/theme";
import { useDemoWellbeing } from "@/utils/demo/demoWellbeing";

const openConcierge = async () => {
  const met = await AsyncStorage.getItem("concierge.met").catch(() => null);
  router.push(met ? "/patient/concierge-history" : "/patient/concierge-meet");
};

// 9.6: score and next steps, without alarm. Nothing is sent anywhere yet, so the screen does not say it was.
const ResultsScreen = () => {
  const { t } = useTranslation();
  const result = useDemoWellbeing((state) => state.phqResult);
  const [showAnswers, setShowAnswers] = useState(false);

  if (!result) return <Redirect href="/patient/wellbeing/check-in" />;

  const score = phqScore(result.answers);
  const isFull = result.kind === "phq9";
  const band = isFull ? phq9Band(score) : "phq2";
  const support = askedForSupport(result.answers);
  const calm = band === "phq2" || band === "minimal";

  const crisisStep = (
    <NextStep
      icon="phone-outline"
      title={t("wellbeingCare.results.talkNow")}
      description={t("wellbeingCare.results.talkNowText")}
      action={t("wellbeingCare.results.call988")}
      onPress={() => Linking.openURL("tel:988")}
    />
  );

  return (
    <ScreenBackground>
      <SafeAreaView style={shared.safeArea}>
        <AuthTopBar title={t("wellbeingCare.results.title")} onBack={() => router.replace("/patient/(tabs)/health")} />
        <ScrollView contentContainerStyle={shared.content} showsVerticalScrollIndicator={false}>
          {support && (
            <View style={styles.supportCard} accessibilityRole="alert">
              <View style={styles.supportAccent} />
              <View style={styles.supportBody}>
                <Text style={shared.cardTitle}>{t("wellbeingCare.results.supportTitle")}</Text>
                <Text style={shared.cardText}>{t("wellbeingCare.results.supportText")}</Text>
              </View>
            </View>
          )}
          {support && crisisStep}

          <LinearGradient
            colors={[Theme.colors.magentaTint, Theme.colors.purpleTint]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={shared.hero}
          >
            <Text style={shared.heroLabel}>
              {isFull ? t("wellbeingCare.results.phq9Score") : t("wellbeingCare.results.phq2Score")}
            </Text>
            <Text style={styles.score}>{score}</Text>
            <View style={[styles.pill, calm && styles.pillCalm]}>
              <Text style={[styles.pillText, calm && styles.pillTextCalm]}>
                {t(`wellbeingCare.results.bands.${band}.label`)}
              </Text>
            </View>
          </LinearGradient>

          <View style={shared.card}>
            <Text style={shared.cardTitle}>{t("wellbeingCare.results.meaning")}</Text>
            <Text style={shared.cardText}>{t(`wellbeingCare.results.bands.${band}.text`)}</Text>
          </View>

          <Text style={shared.sectionLabel}>{t("wellbeingCare.results.nextSteps")}</Text>
          <NextStep
            icon="stethoscope"
            title={t("wellbeingCare.results.share")}
            description={t("wellbeingCare.results.shareText")}
            action={showAnswers ? t("wellbeingCare.results.hideAnswers") : t("wellbeingCare.results.viewAnswers")}
            onPress={() => setShowAnswers(!showAnswers)}
          />
          {showAnswers && (
            <View style={shared.card}>
              {result.answers.map((answer, index) => (
                <View key={PHQ_ITEMS[index]} style={styles.answerRow}>
                  <Text style={styles.answerLabel}>{t(`wellbeingCare.phq.${PHQ_ITEMS[index]}.short`)}</Text>
                  <Text style={styles.answerValue}>{t(`wellbeingCare.options.${PHQ_OPTIONS[answer]}`)}</Text>
                </View>
              ))}
            </View>
          )}
          <NextStep
            icon="message-text-outline"
            title={t("wellbeingCare.results.concierge")}
            description={t("wellbeingCare.results.conciergeText")}
            action={t("wellbeingCare.results.startChat")}
            onPress={openConcierge}
          />
          {!support && crisisStep}

          <PrimaryButton label={t("wellbeingCare.results.done")} onPress={() => router.replace("/patient/(tabs)/health")} />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default ResultsScreen;

const styles = StyleSheet.create({
  supportCard: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    flexDirection: "row",
    overflow: "hidden",
  },
  supportAccent: {
    width: 4,
    backgroundColor: Theme.colors.warning,
  },
  supportBody: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 6,
  },
  score: {
    fontSize: 40,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
    marginVertical: 4,
  },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.warningTint,
  },
  pillText: {
    fontSize: 12,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.warning,
  },
  pillCalm: {
    backgroundColor: Theme.colors.successTint,
  },
  pillTextCalm: {
    color: Theme.colors.success,
  },
  answerRow: {
    gap: 2,
    paddingVertical: 6,
  },
  answerLabel: {
    fontSize: 12.5,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.ink,
  },
  answerValue: {
    fontSize: 12,
    fontFamily: Theme.typography.caption,
    color: Theme.colors.inkFaint,
  },
});
