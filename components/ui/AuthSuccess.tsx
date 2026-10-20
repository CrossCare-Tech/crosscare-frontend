import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

interface AuthSuccessProps {
  title: string;
  message: string;
  buttonLabel: string;
  onPress: () => void;
}

const AuthSuccess: React.FC<AuthSuccessProps> = ({
  title,
  message,
  buttonLabel,
  onPress,
}) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.content}>
      <View style={styles.chip}>
        <Feather name="check" size={34} color={Theme.colors.success} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
    >
      <Text style={styles.buttonText}>{buttonLabel}</Text>
    </TouchableOpacity>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.bg,
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: Theme.colors.successTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 280,
  },
  button: {
    backgroundColor: Theme.colors.magenta,
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    ...Theme.shadows.card,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Theme.typography.heading,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});

export default AuthSuccess;
