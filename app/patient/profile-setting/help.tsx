import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Circle, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import LineIcon from "@/components/profile/LineIcon";

const SUPPORT_EMAIL = "support@crosscaretech.com";
const SUPPORT_PHONE = "+1-551-314-4149";
const WEBSITE = "https://crosscaretech.com/";

// Translation key prefixes: profile.<id>Q / profile.<id>A
const FAQS = ["faqDueDate", "faqLanguage", "faqReminders", "faqLogData"];

const SUPPORT = [
  {
    key: "email",
    titleKey: "profile.emailSupport",
    detail: SUPPORT_EMAIL,
    url: `mailto:${SUPPORT_EMAIL}`,
    tint: Theme.colors.purpleTint,
    color: Theme.colors.purple,
    icon: (
      <>
        <Path d="M4 6.5h16v11H4z" />
        <Path d="M4 7l8 6 8-6" />
      </>
    ),
  },
  {
    key: "phone",
    titleKey: "profile.callUs",
    detail: SUPPORT_PHONE,
    url: `tel:${SUPPORT_PHONE}`,
    tint: Theme.colors.tealTint,
    color: Theme.colors.teal,
    icon: (
      <Path d="M6.5 4.5h3l1.5 4-2 1.5a10 10 0 0 0 5 5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 5 5.9 1.5 1.5 0 0 1 6.5 4.5Z" />
    ),
  },
  {
    key: "website",
    titleKey: "profile.websiteLabel",
    detail: "crosscaretech.com",
    url: WEBSITE,
    tint: Theme.colors.magentaTint,
    color: Theme.colors.magenta,
    icon: (
      <>
        <Circle cx="12" cy="12" r="8.5" />
        <Path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z" />
      </>
    ),
  },
];

const HelpCentre = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(FAQS[0]);

  const search = query.trim().toLowerCase();
  const faqs = FAQS.filter(
    (id) =>
      !search ||
      t(`profile.${id}Q`).toLowerCase().includes(search) ||
      t(`profile.${id}A`).toLowerCase().includes(search)
  );

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthTopBar title={t("profile.helpcenter")} />
          <View style={styles.content}>
            <View style={styles.search}>
              <LineIcon size={16} color={Theme.colors.inkFaint}>
                <Circle cx="10.5" cy="10.5" r="6.5" />
                <Path d="M19 19l-4-4" />
              </LineIcon>
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder={t("profile.searchHelp")}
                placeholderTextColor={Theme.colors.placeholder}
                returnKeyType="search"
              />
            </View>

            <Text style={styles.sectionLabel}>{t("profile.frequentlyAsked")}</Text>
            {faqs.length === 0 ? (
              <Text style={styles.empty}>{t("profile.noHelpResults")}</Text>
            ) : (
              <View style={styles.accordion}>
                {faqs.map((id, index) => {
                  // Searching opens every match so the answers are visible
                  const isOpen = search ? true : openFaq === id;
                  const isLast = index === faqs.length - 1;
                  return (
                    <View key={id} style={!isLast && styles.faqDivider}>
                      <TouchableOpacity
                        style={styles.question}
                        onPress={() => setOpenFaq(isOpen ? null : id)}
                        activeOpacity={0.6}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isOpen }}
                      >
                        <Text style={styles.questionText}>{t(`profile.${id}Q`)}</Text>
                        <LineIcon size={16} color={Theme.colors.ink}>
                          <Path d={isOpen ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
                        </LineIcon>
                      </TouchableOpacity>
                      {isOpen && (
                        <Text style={styles.answer}>{t(`profile.${id}A`)}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={styles.sectionLabel}>{t("profile.stillNeedHelp")}</Text>
            {SUPPORT.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.flatRow}
                onPress={() => Linking.openURL(item.url)}
                activeOpacity={0.6}
                accessibilityRole="button"
              >
                <View style={[styles.iconChip, { backgroundColor: item.tint }]}>
                  <LineIcon size={18} color={item.color}>
                    {item.icon}
                  </LineIcon>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{t(item.titleKey)}</Text>
                  <Text style={styles.rowSub}>{item.detail}</Text>
                </View>
                <LineIcon size={16} color={Theme.colors.ink}>
                  <Path d="M9 6l6 6-6 6" />
                </LineIcon>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default HelpCentre;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 18,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Theme.colors.inputBorder,
    backgroundColor: Theme.colors.inputBg,
    paddingHorizontal: Theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontFamily: Theme.typography.body,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  sectionLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkFaint,
    marginBottom: -6,
  },
  empty: {
    fontFamily: Theme.typography.body,
    fontSize: 13,
    color: Theme.colors.inkFaint,
  },
  accordion: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    overflow: "hidden",
  },
  faqDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  question: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 15,
    paddingHorizontal: Theme.spacing.md,
  },
  questionText: {
    flex: 1,
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
  },
  answer: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: 15,
    marginTop: -8,
    fontFamily: Theme.typography.body,
    fontSize: 12,
    lineHeight: 19,
    color: Theme.colors.inkSoft,
  },
  flatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.md,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.body,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
});
