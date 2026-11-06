import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";

const PRIVACY_POLICY_URL = "https://crosscaretech.com/privacy-policy";

// End User License Agreement, copied verbatim from the bottom of
// https://crosscaretech.com/privacy-policy. Legal copy stays in English and
// must be kept in sync with the website.
const EFFECTIVE_DATE = "June 25, 2025";
const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. License Grant",
    body: "We grant you a non-transferable, non-exclusive license to use the App on your device in accordance with this EULA.",
  },
  {
    title: "2. Restrictions",
    body: "You may not:\n• Reverse-engineer, decompile or modify the App.\n• Use the App for unlawful purposes.\n• Share login credentials.",
  },
  {
    title: "3. Updates and Availability",
    body: "We may update the App periodically. Some features may be limited or discontinued.",
  },
  {
    title: "4. Termination",
    body: "We may terminate your access if you violate this EULA. You may stop using the app at any time.",
  },
  {
    title: "5. Subscription Terms",
    body: "This app does not offer in-app purchases or subscriptions. Users can sign up and use the app's features without any payment requirements.",
  },
  {
    title: "6. Liability",
    body: "We make no medical guarantees. The App provides informational support, not a substitute for professional medical advice. Always consult a healthcare provider before making decisions based on the app.",
  },
  {
    title: "7. Governing Law",
    body: "This EULA shall be governed by the laws of New Jersey.",
  },
];

const TermsAndConditions = () => {
  const { t } = useTranslation();

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <AuthTopBar title={t("profile.tnc")} />
          <View style={styles.content}>
            <Text style={styles.updated}>Effective {EFFECTIVE_DATE}</Text>
            <Text style={styles.body}>
              This EULA governs your use of the CrossCare mobile application.
            </Text>

            {SECTIONS.map((section) => (
              <View key={section.title}>
                <Text style={styles.heading}>{section.title}</Text>
                <Text style={styles.body}>{section.body}</Text>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
              accessibilityRole="link"
              hitSlop={{ top: 12, bottom: 12 }}
            >
              <Text style={styles.link}>{t("profile.readPrivacyPolicy")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default TermsAndConditions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 18,
  },
  updated: {
    fontFamily: Theme.typography.heading,
    fontSize: 11,
    color: Theme.colors.inkFaint,
  },
  heading: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.ink,
    marginBottom: 6,
  },
  body: {
    fontFamily: Theme.typography.body,
    fontSize: 12,
    lineHeight: 20,
    color: Theme.colors.inkSoft,
  },
  link: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.magenta,
  },
});
