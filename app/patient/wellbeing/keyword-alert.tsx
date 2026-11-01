import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AuthTopBar from "@/components/ui/AuthTopBar";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { NextStep } from "@/components/wellbeing/WellbeingUI";
import { Theme } from "@/constants/theme";
import { SAMPLE_CLINICS, useClinicStore } from "@/zustandStore/clinicStore";

// Prototype 8.7 "Mood Keyword Alert": a careful message with a direct path to support, shown after a journal
// entry that mentions feeling overwhelmed. It never labels the person.
export default function KeywordAlertScreen() {
  const { t } = useTranslation();
  const { joined, activeId } = useClinicStore();
  // Only reachable in demo mode (see the wellbeing layout), so the sample clinics apply
  const clinics = [...SAMPLE_CLINICS, ...joined];
  const clinic = clinics.find((c) => c.id === activeId) ?? clinics[0];
  const office = t("wellbeingCare.keyword.office", { provider: clinic.provider });

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("wellbeingCare.keyword.title")} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.notice} accessibilityRole="alert">
            <View style={styles.bar} />
            <Feather name="info" size={18} color={Theme.colors.warning} style={styles.noticeIcon} />
            <View style={styles.noticeText}>
              <Text style={styles.noticeTitle}>{t("wellbeingCare.keyword.noticeTitle")}</Text>
              <Text style={styles.body}>{t("wellbeingCare.keyword.noticeBody")}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("wellbeingCare.keyword.notAloneTitle")}</Text>
            <Text style={styles.body}>{t("wellbeingCare.keyword.notAloneBody")}</Text>
          </View>

          <NextStep
            icon="stethoscope"
            title={t("wellbeingCare.keyword.messageTitle")}
            description={t("wellbeingCare.keyword.messageSub", { office })}
            action={t("wellbeingCare.keyword.messageAction")}
            // ponytail: there is no messaging to the care team yet; this only confirms the request
            onPress={() => Alert.alert(t("wellbeingCare.keyword.messageTitle"), t("wellbeingCare.keyword.messageSent", { office }))}
          />
          <NextStep
            icon="phone-outline"
            title={t("wellbeingCare.keyword.talkTitle")}
            description={t("wellbeingCare.keyword.talkSub")}
            action={t("wellbeingCare.keyword.talkAction")}
            onPress={() => Linking.openURL("tel:988")}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 40, gap: 14 },
  notice: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    overflow: "hidden",
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 14,
  },
  // The coloured edge of the prototype notice (a border would not follow the rounded corner on Android)
  bar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: Theme.colors.warning },
  noticeIcon: { marginTop: 2 },
  noticeText: { flex: 1, gap: 4 },
  noticeTitle: { fontFamily: Theme.typography.heading, fontSize: 14, lineHeight: 19, color: Theme.colors.ink },
  card: { backgroundColor: Theme.colors.surface, borderRadius: 18, padding: 16, gap: 6, ...Theme.shadows.card },
  cardTitle: { fontFamily: Theme.typography.heading, fontSize: 13.5, color: Theme.colors.ink },
  body: { fontFamily: Theme.typography.body, fontSize: 13, lineHeight: 19.5, color: Theme.colors.inkSoft },
});
