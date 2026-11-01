import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import OtpInput from "@/components/ui/OtpInput";
import { metricStyles } from "@/components/vitals/MetricUI";

// Prototype 4.4 "MFA via SMS": the 6-digit code sent by SMS.
// ponytail: no SMS is sent and any complete code is accepted. Verify with the backend once it sends the code.
export default function MfaScreen() {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);

  const verify = () => Alert.alert(t("security.mfaTitle"), t("security.verifiedMsg"), [{ text: "OK", onPress: () => router.back() }]);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("security.mfaTitle")} />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={metricStyles.content}>
          <Text style={styles.title}>{t("security.enterCode")}</Text>
          <Text style={styles.sub}>{t("security.sentTo", { phone: "(555) •••-0087" })}</Text>
          <View style={styles.otp}>
            <OtpInput value={code} onChangeText={setCode} length={6} />
          </View>
          <TouchableOpacity
            style={[styles.primary, code.length < 6 && styles.disabled]}
            onPress={verify}
            disabled={code.length < 6}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryText, code.length < 6 && styles.disabledText]}>{t("security.verify")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setResent(true)} accessibilityRole="button">
            <Text style={styles.resend}>{resent ? t("security.resent") : t("security.resend")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontFamily: Theme.typography.display, fontSize: 26, color: Theme.colors.ink },
  sub: { fontFamily: Theme.typography.body, fontSize: 13.5, color: Theme.colors.inkSoft },
  otp: { marginVertical: 6 },
  primary: { height: 52, borderRadius: Theme.borderRadius.sm, backgroundColor: Theme.colors.magenta, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: Theme.typography.heading, fontSize: 15, color: Theme.colors.surface },
  disabled: { backgroundColor: Theme.colors.disabledBg },
  disabledText: { color: Theme.colors.disabledText },
  resend: { fontFamily: Theme.typography.heading, fontSize: 13.5, color: Theme.colors.magenta, textAlign: "center" },
});
