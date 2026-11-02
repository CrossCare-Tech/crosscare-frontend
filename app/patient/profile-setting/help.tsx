import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Linking,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

const help = () => {
  const { t } = useTranslation();

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@crosscaretech.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+1-551-314-4149');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://crosscaretech.com/');
  };

  const SupportItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
    showArrow?: boolean;
  }) => {
    return (
      <TouchableOpacity style={styles.supportItem} onPress={onPress}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.supportTextContainer}>
          <Text style={styles.supportTitle}>{title}</Text>
          <Text style={styles.supportSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color="#E162BC" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={"white"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.helpcenter')}</Text>
        <View
          style={{
            width: 20,
          }}
        />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>Help & Support</Text>
          <Text style={styles.introText}>
            If you have questions, concerns, or technical issues, you may contact our support team:
          </Text>
        </View>

        <View style={styles.supportContainer}>
          <SupportItem
            icon={<Ionicons name="mail-outline" size={24} color="#E162BC" />}
            title="Email Support"
            subtitle="support@crosscaretech.com"
            onPress={handleEmailPress}
            showArrow={false}
          />

          <SupportItem
            icon={<Ionicons name="call-outline" size={24} color="#E162BC" />}
            title="Phone Support"
            subtitle="+1-551-314-4149"
            onPress={handlePhonePress}
            showArrow={false}
          />


          <SupportItem
            icon={<Ionicons name="globe-outline" size={24} color="#E162BC" />}
            title="Website"
            subtitle="https://crosscaretech.com/"
            onPress={handleWebsitePress}
            showArrow={false}
          />
        </View>

        
      </ScrollView>
    </SafeAreaView>
  );
};

export default help;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "DMSans600",
    color: "#373737",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introContainer: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 20,
    fontFamily: "DMSans600",
    color: "#373737",
    marginBottom: 12,
  },
  introText: {
    fontSize: 14,
    fontFamily: "DMSans400",
    color: "#7B7B7B",
    lineHeight: 20,
  },
  supportContainer: {
    marginBottom: 32,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "rgba(229, 229, 229, 0.20)",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  supportTextContainer: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#AF4D93",
    marginBottom: 4,
  },
  supportSubtitle: {
    fontSize: 14,
    fontFamily: "DMSans500",
    color: "#7B7B7B",
  },
  faqContainer: {
    marginBottom: 24,
  },
  faqTitle: {
    fontSize: 18,
    fontFamily: "DMSans600",
    color: "#373737",
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: "rgba(229, 229, 229, 0.20)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontFamily: "DMSans600",
    color: "#373737",
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: "DMSans400",
    color: "#7B7B7B",
    lineHeight: 20,
  },
});
