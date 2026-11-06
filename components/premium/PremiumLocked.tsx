import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { PremiumBadge, PremiumIcon } from "@/components/premium/PremiumUI";

// Shown instead of the AI Concierge chat when Premium access is not active
const PremiumLocked = () => {
  const { t } = useTranslation();

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("premium.concierge")} />
        <View style={styles.content}>
          <View style={styles.card}>
            <PremiumIcon status="inactive" size={56} />
            <PremiumBadge status="inactive" style={styles.badge} />
            <Text style={styles.head}>{t("premium.lockedHead")}</Text>
            <Text style={styles.body}>{t("premium.lockedBody")}</Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/patient/profile-setting/premium")}
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{t("premium.viewPremium")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default PremiumLocked;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: Theme.spacing.xxl,
    gap: 16,
  },
  card: {
    alignItems: "center",
    gap: 12,
    padding: 24,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.card,
  },
  badge: {
    alignSelf: "center",
  },
  head: {
    textAlign: "center",
    fontFamily: Theme.typography.display,
    fontSize: 22,
    lineHeight: 28,
    color: Theme.colors.ink,
  },
  body: {
    textAlign: "center",
    fontFamily: Theme.typography.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: Theme.colors.inkSoft,
  },
  button: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.card,
  },
  buttonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.surface,
  },
});
