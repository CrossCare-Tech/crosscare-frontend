import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

interface AuthTopBarProps {
  title: string;
  onBack?: () => void; // defaults to router.back(), or /login when there is no history
  action?: { label: string; onPress: () => void }; // optional text action on the right (e.g. "Edit")
}

const AuthTopBar: React.FC<AuthTopBarProps> = ({ title, onBack, action }) => {
  const router = useRouter();
  const handleBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/login")));

  return (
  <View style={styles.topbar}>
    <TouchableOpacity
      style={styles.backButton}
      onPress={handleBack}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Feather name="chevron-left" size={18} color={Theme.colors.ink} />
    </TouchableOpacity>
    <Text style={styles.title}>{title}</Text>
    {action ? (
      <TouchableOpacity
        onPress={action.onPress}
        accessibilityRole="button"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.action}>{action.label}</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.spacer} />
    )}
  </View>
  );
};

const styles = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 16.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  spacer: {
    width: 40,
  },
  action: {
    fontSize: 13.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.magenta,
  },
});

export default AuthTopBar;
