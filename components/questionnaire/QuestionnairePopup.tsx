import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { Theme } from "@/constants/theme";
import { QuestionnaireDomain } from "@/constants/questionaireData";
import { estimateTotal, isFreeTextStep, isInfoStep, nextQuestionId } from "@/utils/questionnairePopup";
import { PopupDomainState } from "@/utils/questionnairePopupStore";

type Props = {
  visible: boolean;
  domain: QuestionnaireDomain;
  userName: string;
  portrait: ImageSourcePropType;
  initial: PopupDomainState; // what was already answered (empty on the first run)
  startOver?: boolean; // "Review my answers": start again from the first question
  onSaveExit: (state: PopupDomainState) => void; // Save & exit, or the system back gesture
  onFinish: (state: PopupDomainState) => void; // the last question was answered
  onBackToChat: () => void; // the thank-you screen was dismissed
};

// The intake questionnaire as a pop-up over the chat: one question per screen, an explicit Next
// (nothing advances by itself), Save & exit at any point and a thank-you screen at the end.
export default function QuestionnairePopup({
  visible,
  domain,
  userName,
  portrait,
  initial,
  startOver,
  onSaveExit,
  onFinish,
  onBackToChat,
}: Props) {
  const { t } = useTranslation();
  const [path, setPath] = useState<string[]>([]);
  const [answers, setAnswers] = useState(initial.answers);
  const [done, setDone] = useState(false);

  // Each time the pop-up opens it picks up where the patient stopped
  useEffect(() => {
    if (!visible) return;
    setDone(false);
    setAnswers(initial.answers);
    const resume = !startOver && initial.path.length > 0;
    setPath(resume ? initial.path : [domain.questions[0].id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const question = domain.questions.find((q) => q.id === path[path.length - 1]);
  const answer = question ? answers[question.id]?.response ?? "" : "";
  const info = question ? isInfoStep(question) : false;
  const freeText = question ? isFreeTextStep(question) : false;

  const total = useMemo(() => estimateTotal(domain, path), [domain, path]);
  const percent = Math.round(((path.length - 1) / total) * 100);

  const snapshot = (): PopupDomainState => ({ answers, path, completed: false });

  const setAnswer = (value: string) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: { response: value, flag: question.flag } }));
  };

  // `skipped` follows the default branch and leaves the question unanswered
  const advance = (skipped: boolean) => {
    if (!question) return;
    if (skipped) {
      setAnswers((prev) => {
        const { [question.id]: _removed, ...rest } = prev;
        return rest;
      });
    }
    const nextId = nextQuestionId(domain, question, skipped || info ? null : answer);
    if (!nextId) {
      setDone(true);
      onFinish({ answers: skipped ? omit(answers, question.id) : answers, path, completed: true });
      return;
    }
    setPath((prev) => [...prev, nextId]);
  };

  const back = () => setPath((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const lastStep = question ? nextQuestionId(domain, question, info ? null : answer || null) === null : false;
  const canNext = info || answer.trim().length > 0;

  if (!question && !done) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => onSaveExit(snapshot())}>
      <ScreenBackground>
        <SafeAreaView style={styles.safeArea}>
          {done ? (
            <View style={styles.doneWrap}>
              <View style={styles.ring}>
                <Image source={portrait} style={styles.doneAvatar} />
              </View>
              <Text style={styles.doneTitle}>{t("questionnairePopup.thanks", { name: userName })}</Text>
              <Text style={styles.doneText}>{t("questionnairePopup.thanksText")}</Text>
              <View style={styles.doneSummary}>
                <Text style={styles.doneSummaryTitle}>{domain.description}</Text>
                <View style={styles.doneSummaryDone}>
                  <View style={styles.dot} />
                  <Text style={styles.doneSummaryText}>{t("questionnairePopup.complete")}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.primary} onPress={onBackToChat} accessibilityRole="button">
                <Text style={styles.primaryText}>{t("questionnairePopup.backToChat")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.textButton}
                onPress={() => {
                  setDone(false);
                  setPath([domain.questions[0].id]);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.textButtonLabel}>{t("questionnairePopup.review")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
              <View style={styles.topBar}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => onSaveExit(snapshot())}
                  accessibilityRole="button"
                  accessibilityLabel={t("questionnairePopup.saveExit")}
                >
                  <Feather name="chevron-left" size={20} color={Theme.colors.ink} />
                </TouchableOpacity>
                <Text style={styles.topTitle} numberOfLines={1}>
                  {domain.description}
                </Text>
                <TouchableOpacity onPress={() => onSaveExit(snapshot())} accessibilityRole="button">
                  <Text style={styles.saveExit}>{t("questionnairePopup.saveExit")}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>
                    {t("questionnairePopup.questionOf", { n: path.length, total })}
                  </Text>
                  <Text style={styles.progressText}>{t("questionnairePopup.percent", { percent })}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${percent}%` }]} />
                </View>

                <View style={styles.askRow}>
                  <Image source={portrait} style={styles.askAvatar} />
                  <View style={styles.bubble}>
                    <Text style={styles.bubbleText}>{question!.text}</Text>
                  </View>
                </View>

                {question!.options?.map((option) => {
                  const selected = answer === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.option, selected && styles.optionSelected]}
                      onPress={() => setAnswer(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {freeText && (
                  <TextInput
                    style={styles.input}
                    value={answer}
                    onChangeText={setAnswer}
                    placeholder={t("questionnairePopup.typeAnswer")}
                    placeholderTextColor={Theme.colors.placeholder}
                    multiline
                    accessibilityLabel={question!.text}
                  />
                )}

                {info && (
                  <View style={styles.infoCard}>
                    <Ionicons name="information-circle-outline" size={18} color={Theme.colors.teal} />
                    <Text style={styles.infoText}>{question!.text}</Text>
                  </View>
                )}

                <View style={styles.navRow}>
                  {path.length > 1 && (
                    <TouchableOpacity style={styles.secondary} onPress={back} accessibilityRole="button">
                      <Text style={styles.secondaryText}>{t("questionnairePopup.back")}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.primary, styles.navPrimary, !canNext && styles.primaryDisabled]}
                    onPress={() => advance(false)}
                    disabled={!canNext}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canNext }}
                  >
                    <Text style={[styles.primaryText, !canNext && styles.primaryTextDisabled]}>
                      {lastStep ? t("questionnairePopup.finish") : t("questionnairePopup.next")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {!info && (
                  <TouchableOpacity style={styles.textButton} onPress={() => advance(true)} accessibilityRole="button">
                    <Text style={styles.textButtonLabel}>{t("questionnairePopup.skip")}</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </ScreenBackground>
    </Modal>
  );
}

const omit = <T,>(record: Record<string, T>, id: string) => {
  const { [id]: _removed, ...rest } = record;
  return rest;
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { flex: 1, fontFamily: Theme.typography.heading, fontSize: 16, color: Theme.colors.ink },
  saveExit: { fontFamily: Theme.typography.heading, fontSize: 13, color: Theme.colors.magenta },
  content: { padding: Theme.spacing.md, gap: 12 },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressText: { fontFamily: Theme.typography.caption, fontSize: 12, color: Theme.colors.inkFaint },
  track: { height: 6, borderRadius: 3, backgroundColor: Theme.colors.hairline, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3, backgroundColor: Theme.colors.magenta },
  askRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 4 },
  askAvatar: { width: 30, height: 30, borderRadius: 15 },
  bubble: {
    flexShrink: 1,
    backgroundColor: Theme.colors.purpleTint,
    borderRadius: Theme.borderRadius.lg,
    borderBottomLeftRadius: Theme.borderRadius.xs,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleText: { fontFamily: Theme.typography.subheading, fontSize: 15, lineHeight: 21, color: Theme.colors.ink },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionSelected: { borderColor: Theme.colors.magenta, borderWidth: 1.5 },
  optionText: { fontFamily: Theme.typography.subheading, fontSize: 14, color: Theme.colors.ink },
  optionTextSelected: { color: Theme.colors.magenta },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Theme.colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: Theme.colors.magenta },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.colors.magenta },
  input: {
    minHeight: 96,
    textAlignVertical: "top",
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.inputBorder,
    borderRadius: Theme.borderRadius.md,
    padding: 14,
    fontFamily: Theme.typography.body,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  infoCard: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Theme.colors.tealTint,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
  },
  infoText: { flex: 1, fontFamily: Theme.typography.body, fontSize: 13, lineHeight: 19, color: Theme.colors.ink },
  navRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  navPrimary: { flex: 1 },
  primary: {
    backgroundColor: Theme.colors.magenta,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center",
    ...Theme.shadows.soft,
  },
  primaryDisabled: { backgroundColor: Theme.colors.disabledBg, shadowOpacity: 0, elevation: 0 },
  primaryText: { fontFamily: Theme.typography.heading, fontSize: 15, color: Theme.colors.surface },
  primaryTextDisabled: { color: Theme.colors.disabledText },
  secondary: {
    borderWidth: 1.5,
    borderColor: Theme.colors.purple,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
  },
  secondaryText: { fontFamily: Theme.typography.heading, fontSize: 15, color: Theme.colors.purple },
  textButton: { alignItems: "center", paddingVertical: 10 },
  textButtonLabel: { fontFamily: Theme.typography.heading, fontSize: 13, color: Theme.colors.magenta },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: Theme.spacing.lg, gap: 14 },
  ring: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 3,
    borderColor: Theme.colors.purpleSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.surface,
  },
  doneAvatar: { width: 104, height: 104, borderRadius: 52 },
  doneTitle: { fontFamily: Theme.typography.display, fontSize: 26, color: Theme.colors.ink, textAlign: "center" },
  doneText: {
    fontFamily: Theme.typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.inkSoft,
    textAlign: "center",
  },
  doneSummary: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    padding: 14,
  },
  doneSummaryTitle: { fontFamily: Theme.typography.subheading, fontSize: 14, color: Theme.colors.ink },
  doneSummaryDone: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.success },
  doneSummaryText: { fontFamily: Theme.typography.heading, fontSize: 12, color: Theme.colors.success },
});
