import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { useDemoMode } from "@/utils/demo/demoMode";

const TOTAL_PAGES = 3;

// Prototype 10.4 "PDF Data Collection Form": the patient intake, one page at a time.
// ponytail: the prototype only shows page 1. Pages 2 and 3 (health history, sign) are an assumption of the usual intake
// steps; confirm them with the design. Nothing is sent or stored yet: submitting only closes the form. The signed PDF
// will be generated and added to Documents once the backend does it.
export default function IntakeFormScreen() {
  const { t } = useTranslation();
  const user = useSelector((state: any) => state.user);
  const demo = useDemoMode((state) => state.enabled);
  const [page, setPage] = useState(1);
  const [name, setName] = useState(user?.user_name ?? "");
  // The demo shows the prototype's sample answers, a real account starts empty
  const [insurance, setInsurance] = useState(demo ? "Riverside Health Plan" : "");
  const [contact, setContact] = useState(demo ? "Sam Reyes · (555) 908-1123" : "");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [conditions, setConditions] = useState("");
  const [pregnancies, setPregnancies] = useState("");
  const [signature, setSignature] = useState("");

  const next = () => {
    if (page < TOTAL_PAGES) {
      setPage(page + 1);
      return;
    }
    if (!signature.trim()) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("intake.signatureMissing"));
      return;
    }
    Alert.alert(t("intake.title"), t("intake.submitted"), [{ text: "OK", onPress: () => router.back() }]);
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("intake.title")} onBack={page > 1 ? () => setPage(page - 1) : undefined} />

        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <Text style={styles.step}>{t("intake.pageOf", { page, total: TOTAL_PAGES })}</Text>

            {page === 1 && (
              <>
                <CustomTextInput
                  label={t("intake.fullName")}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("intake.fullNamePlaceholder")}
                  autoCapitalize="words"
                />
                <CustomTextInput
                  label={t("intake.insurance")}
                  value={insurance}
                  onChangeText={setInsurance}
                  placeholder={t("intake.insurancePlaceholder")}
                />
                <CustomTextInput
                  label={t("intake.emergencyContact")}
                  value={contact}
                  onChangeText={setContact}
                  placeholder={t("intake.emergencyContactPlaceholder")}
                />
                <CustomTextInput
                  label={t("intake.allergies")}
                  value={allergies}
                  onChangeText={setAllergies}
                  placeholder={t("intake.allergiesPlaceholder")}
                />
              </>
            )}

            {page === 2 && (
              <>
                <CustomTextInput
                  label={t("intake.medications")}
                  value={medications}
                  onChangeText={setMedications}
                  placeholder={t("intake.medicationsPlaceholder")}
                />
                <CustomTextInput
                  label={t("intake.conditions")}
                  value={conditions}
                  onChangeText={setConditions}
                  placeholder={t("intake.conditionsPlaceholder")}
                />
                <CustomTextInput
                  label={t("intake.pregnancies")}
                  value={pregnancies}
                  onChangeText={(value) => setPregnancies(value.replace(/\D/g, ""))}
                  placeholder="0"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </>
            )}

            {page === 3 && (
              <>
                <Text style={styles.consent}>{t("intake.consent")}</Text>
                <CustomTextInput
                  label={t("intake.signature")}
                  value={signature}
                  onChangeText={setSignature}
                  placeholder={t("intake.signaturePlaceholder")}
                  autoCapitalize="words"
                />
              </>
            )}

            <TouchableOpacity style={styles.button} onPress={next} accessibilityRole="button">
              <Text style={styles.buttonText}>{page < TOTAL_PAGES ? t("intake.continue") : t("intake.submit")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 14,
  },
  step: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkFaint,
  },
  consent: {
    fontFamily: Theme.typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: Theme.colors.inkSoft,
  },
  button: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Theme.spacing.xs,
  },
  buttonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.surface,
  },
});
