import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Path } from "react-native-svg";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import LineIcon from "@/components/profile/LineIcon";
import { LockPath, PremiumBadge, PremiumIcon } from "@/components/premium/PremiumUI";
import { hasPremiumAccess, PremiumStatus, usePremiumStore } from "@/zustandStore/premiumStore";

const STATUSES: PremiumStatus[] = ["active", "expiring", "inactive"];

// Premium access: what the patient has, and that it comes from her clinic or provider
const PremiumScreen = () => {
  const { t } = useTranslation();
  const { status, setStatus } = usePremiumStore();
  const access = hasPremiumAccess(status);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("premium.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <PremiumIcon status={status} size={48} />
            <PremiumBadge status={status} style={styles.badge} />
            <Text style={styles.head}>{t(`premium.head_${status}`)}</Text>
            <Text style={styles.body}>{t(`premium.body_${status}`)}</Text>
          </View>

          <Text style={styles.sectionLabel}>{t("premium.included")}</Text>
          <View style={[styles.card, styles.featureRow]}>
            <View style={[styles.featureIcon, !access && styles.featureIconOff]}>
              <LineIcon size={20} color={access ? Theme.colors.purple : Theme.colors.inkFaint}>
                <Path d="M12 2.5l2.2 6.8L21 11.5l-6.8 2.2L12 20.5l-2.2-6.8L3 11.5l6.8-2.2z" />
              </LineIcon>
            </View>
            <View style={styles.flex}>
              <Text style={styles.featureTitle}>{t("premium.concierge")}</Text>
              <Text style={styles.featureSub}>
                {access ? t("premium.conciergeOn") : t("premium.conciergeOff")}
              </Text>
            </View>
            <LineIcon size={18} color={access ? Theme.colors.purple : Theme.colors.inkFaint}>
              {access ? <Path d="M5 12.5l4.5 4.5L19 7.5" /> : <LockPath />}
            </LineIcon>
          </View>

          {access && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push({ pathname: "/patient/askdoula", params: { from_modal: "true" } })}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>{t("premium.openConcierge")}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.note}>{t("premium.note")}</Text>

          {/* Prototype only: there is no Premium data from the API yet */}
          <View style={styles.demo}>
            <Text style={styles.demoTitle}>{t("premium.demoTitle")}</Text>
            <Text style={styles.demoHint}>{t("premium.demoHint")}</Text>
            <View style={styles.segmented} accessibilityRole="radiogroup">
              {STATUSES.map((option) => {
                const selected = option === status;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.segment, selected && styles.segmentOn]}
                    onPress={() => setStatus(option)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                  >
                    <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>
                      {t(`premium.status_${option}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default PremiumScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: Theme.spacing.xl,
    gap: 14,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 10,
    ...Theme.shadows.card,
  },
  badge: {
    alignSelf: "flex-start",
  },
  head: {
    fontFamily: Theme.typography.display,
    fontSize: 22,
    lineHeight: 28,
    color: Theme.colors.ink,
  },
  body: {
    fontFamily: Theme.typography.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: Theme.colors.inkSoft,
  },
  sectionLabel: {
    marginTop: 6,
    marginBottom: -4,
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.purpleTint,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIconOff: {
    backgroundColor: Theme.colors.surfaceSunken,
  },
  featureTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  featureSub: {
    marginTop: 1,
    fontFamily: Theme.typography.body,
    fontSize: 12,
    color: Theme.colors.inkFaint,
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
  note: {
    fontFamily: Theme.typography.body,
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.inkFaint,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  demo: {
    marginTop: 10,
    padding: 14,
    gap: 6,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Theme.colors.dropzoneBorder,
  },
  demoTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 12.5,
    color: Theme.colors.ink,
  },
  demoHint: {
    fontFamily: Theme.typography.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: Theme.colors.inkFaint,
  },
  segmented: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
    padding: 3,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surfaceSunken,
  },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentOn: {
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.card,
  },
  segmentText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 12,
    color: Theme.colors.inkFaint,
  },
  segmentTextOn: {
    color: Theme.colors.ink,
  },
});
