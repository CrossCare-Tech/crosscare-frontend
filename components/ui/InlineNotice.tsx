import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

export type Notice = { message: string; variant: "error" | "info" } | null;

interface InlineNoticeProps {
  notice: Notice;
}

// Non-blocking message shown inside the form. Errors use the caution look
// (dark icon on yellow), never red, as in the design system.
const InlineNotice: React.FC<InlineNoticeProps> = ({ notice }) => {
  if (!notice) return null;
  const isError = notice.variant === "error";

  return (
    <View
      style={[styles.box, isError ? styles.boxError : styles.boxInfo]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={[styles.chip, isError ? styles.chipError : styles.chipInfo]}>
        <Feather
          name={isError ? "alert-triangle" : "info"}
          size={15}
          color={isError ? Theme.colors.ink : Theme.colors.purple}
        />
      </View>
      <Text style={styles.text}>{notice.message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  boxError: {
    backgroundColor: Theme.colors.warningTint,
  },
  boxInfo: {
    backgroundColor: Theme.colors.purpleTint,
  },
  chip: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipError: {
    backgroundColor: Theme.colors.caution,
  },
  chipInfo: {
    backgroundColor: Theme.colors.surface,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: Theme.typography.body,
    color: Theme.colors.ink,
    lineHeight: 19,
    paddingTop: 3,
  },
});

export default InlineNotice;
