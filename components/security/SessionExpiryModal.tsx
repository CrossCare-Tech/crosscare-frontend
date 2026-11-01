import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

const SECONDS = 60;

// Prototype 4.6 "Session Expiry Warning": a card with a countdown and the choice to stay signed in.
// ponytail: only shown from Profile > Security as a preview. There is no inactivity timer yet; once there is one,
// show this from it and make onSignOut really sign out.
export default function SessionExpiryModal({ visible, onStay, onSignOut }: { visible: boolean; onStay: () => void; onSignOut: () => void }) {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(SECONDS);

  useEffect(() => {
    if (!visible) return;
    setSeconds(SECONDS);
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [visible]);

  useEffect(() => {
    if (visible && seconds <= 0) onSignOut();
  }, [visible, seconds, onSignOut]);

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={onStay}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Feather name="clock" size={22} color={Theme.colors.warning} />
          </View>
          <Text style={styles.title}>{t("security.sessionTitle")}</Text>
          <Text style={styles.body}>{t("security.sessionBody", { seconds: Math.max(seconds, 0) })}</Text>
          <TouchableOpacity style={styles.primary} onPress={onStay} accessibilityRole="button">
            <Text style={styles.primaryText}>{t("security.stay")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.line} onPress={onSignOut} accessibilityRole="button">
            <Text style={styles.lineText}>{t("security.signOutNow")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Theme.colors.scrim, justifyContent: "flex-start", paddingHorizontal: 18, paddingTop: 64 },
  card: { backgroundColor: Theme.colors.surface, borderRadius: 20, padding: 20, gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Theme.colors.warningTint, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: Theme.typography.display, fontSize: 21, lineHeight: 26, color: Theme.colors.ink },
  body: { fontFamily: Theme.typography.body, fontSize: 13.5, lineHeight: 20, color: Theme.colors.inkSoft },
  primary: { height: 50, borderRadius: Theme.borderRadius.sm, backgroundColor: Theme.colors.magenta, alignItems: "center", justifyContent: "center", marginTop: 4 },
  primaryText: { fontFamily: Theme.typography.heading, fontSize: 14.5, color: Theme.colors.surface },
  line: { height: 50, borderRadius: Theme.borderRadius.sm, borderWidth: 1.5, borderColor: Theme.colors.inputBorder, alignItems: "center", justifyContent: "center" },
  lineText: { fontFamily: Theme.typography.heading, fontSize: 14.5, color: Theme.colors.purple },
});
