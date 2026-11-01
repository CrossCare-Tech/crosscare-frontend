import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";

// Prototype 4.5 "Biometric Authentication": confirm it is you before unlocking.
// ponytail: visual only. Tapping the icon stands in for a successful Face ID; wire expo-local-authentication when
// the unlock is turned on (needs a new Android build).
export default function BiometricScreen() {
  const { t } = useTranslation();

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.body}>
          <TouchableOpacity style={styles.icon} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("security.confirmItsYou")}>
            <Ionicons name="finger-print" size={48} color={Theme.colors.magenta} />
          </TouchableOpacity>
          <Text style={styles.title}>{t("security.confirmItsYou")}</Text>
          <Text style={styles.sub}>{t("security.biometricBody")}</Text>
          <TouchableOpacity style={styles.outline} onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.outlineText}>{t("security.usePasscode")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 22, paddingTop: 96, alignItems: "center", gap: 10 },
  icon: { width: 104, height: 104, borderRadius: 30, backgroundColor: Theme.colors.magentaTint, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontFamily: Theme.typography.display, fontSize: 24, color: Theme.colors.ink },
  sub: { fontFamily: Theme.typography.body, fontSize: 13.5, color: Theme.colors.inkSoft, textAlign: "center" },
  outline: { alignSelf: "stretch", height: 50, borderRadius: Theme.borderRadius.sm, borderWidth: 1.5, borderColor: Theme.colors.inputBorder, alignItems: "center", justifyContent: "center", marginTop: 26 },
  outlineText: { fontFamily: Theme.typography.heading, fontSize: 14.5, color: Theme.colors.purple },
});
