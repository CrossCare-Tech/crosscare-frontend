import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

interface ConciergeTopBarProps {
  title: string;
  onBack?: () => void; // defaults to router.back()
  action?: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }; // round icon button on the right
}

// Top bar of the Concierge screens: round back button, centred title, optional round icon button (prototype .gs-tb).
const ConciergeTopBar: React.FC<ConciergeTopBarProps> = ({ title, onBack, action }) => {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View style={styles.bar}>
      <TouchableOpacity
        style={[styles.round, styles.fill]}
        onPress={onBack ?? (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel={t("back")}
      >
        <Feather name="chevron-left" size={18} color={Theme.colors.ink} />
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      {action ? (
        <TouchableOpacity style={[styles.round, styles.fill]} onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label}>
          <Feather name={action.icon} size={18} color={Theme.colors.purple} />
        </TouchableOpacity>
      ) : (
        <View style={styles.round} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Theme.spacing.md, paddingVertical: 10 },
  round: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  fill: { backgroundColor: Theme.colors.surface },
  title: { flex: 1, textAlign: "center", fontFamily: Theme.typography.heading, fontSize: 16, color: Theme.colors.ink },
});

export default ConciergeTopBar;
