import React, { useCallback, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

type DialogVariant = "error" | "success" | "info";

interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel";
}

interface DialogOptions {
  title: string;
  message: string;
  variant?: DialogVariant;
  buttons?: DialogButton[];
}

const VARIANTS: Record<
  DialogVariant,
  { icon: "alert-triangle" | "check" | "info"; background: string; color: string }
> = {
  // Caution look from the design system: dark icon on yellow, no red.
  error: { icon: "alert-triangle", background: Theme.colors.caution, color: Theme.colors.ink },
  success: { icon: "check", background: Theme.colors.successTint, color: Theme.colors.success },
  info: { icon: "info", background: Theme.colors.purpleTint, color: Theme.colors.purple },
};

// Drop-in replacement for Alert.alert: render `dialog` once in the screen and call `show`.
export const useAuthDialog = () => {
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const show = useCallback((next: DialogOptions) => setOptions(next), []);

  const buttons: DialogButton[] = options?.buttons?.length
    ? options.buttons
    : [{ text: "OK" }];
  const variant = VARIANTS[options?.variant ?? "info"];

  const close = (button?: DialogButton) => {
    setOptions(null);
    button?.onPress?.();
  };

  const primary = buttons.find((b) => b.style !== "cancel") ?? buttons[0];
  const cancel = buttons.find((b) => b.style === "cancel");

  const dialog = (
    <Modal
      transparent
      visible={!!options}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => close(cancel)}
    >
      <Pressable style={styles.backdrop} onPress={() => close(cancel)}>
        <Pressable
          style={styles.card}
          onPress={() => undefined}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          <View style={[styles.chip, { backgroundColor: variant.background }]}>
            <Feather name={variant.icon} size={26} color={variant.color} />
          </View>
          <Text style={styles.title}>{options?.title}</Text>
          <Text style={styles.message}>{options?.message}</Text>
          <TouchableOpacity
            style={styles.primary}
            onPress={() => close(primary)}
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>{primary.text}</Text>
          </TouchableOpacity>
          {cancel && cancel !== primary ? (
            <TouchableOpacity
              style={styles.secondary}
              onPress={() => close(cancel)}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{cancel.text}</Text>
            </TouchableOpacity>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );

  return { dialog, show };
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(25, 28, 29, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xl,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: "center",
    ...Theme.shadows.soft,
  },
  chip: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
    textAlign: "center",
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 22,
  },
  primary: {
    width: "100%",
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 15,
    fontFamily: Theme.typography.heading,
    color: "#FFFFFF",
  },
  secondary: {
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  secondaryText: {
    fontSize: 14,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
  },
});
