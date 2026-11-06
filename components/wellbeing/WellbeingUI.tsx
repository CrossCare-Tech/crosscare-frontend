import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

// Pieces shared by the cycle and check-in screens (prototype 9.1–9.6)

export const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipOn]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
  >
    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
  </TouchableOpacity>
);

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

export const ChipRow = ({ children }: { children: React.ReactNode }) => <View style={styles.chipRow}>{children}</View>;

export const PrimaryButton = ({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.primary, disabled && styles.primaryDisabled]}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityState={{ disabled: !!disabled }}
  >
    <Text style={[styles.primaryText, disabled && styles.primaryTextDisabled]}>{label}</Text>
  </TouchableOpacity>
);

export const LinkRow = ({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.linkRow} onPress={onPress} accessibilityRole="button">
    <View style={styles.iconChip}>
      <Feather name={icon} size={18} color={Theme.colors.teal} />
    </View>
    <Text style={styles.linkLabel}>{label}</Text>
    <Feather name="chevron-right" size={18} color={Theme.colors.inkFaint} />
  </TouchableOpacity>
);

export const AnswerOption = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.option, selected && styles.optionOn]}
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
  >
    <Text style={[styles.optionText, selected && styles.optionTextOn]}>{label}</Text>
    <View style={[styles.radio, selected && styles.radioOn]}>{selected && <View style={styles.radioDot} />}</View>
  </TouchableOpacity>
);

export const NextStep = ({
  icon,
  title,
  description,
  action,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  description: string;
  action: string;
  onPress: () => void;
}) => (
  <View style={styles.step}>
    <View style={styles.iconChip}>
      <MaterialCommunityIcons name={icon} size={20} color={Theme.colors.teal} />
    </View>
    <View style={styles.stepBody}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
      <TouchableOpacity onPress={onPress} accessibilityRole="button" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.stepAction}>{action}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export const wellbeingStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: Theme.spacing.xl,
    gap: 18,
  },
  hero: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    alignItems: "center",
  },
  heroLabel: {
    fontSize: 11.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
  },
  heroValue: {
    fontSize: 34,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 6,
    ...Theme.shadows.card,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  cardText: {
    fontSize: 12,
    lineHeight: 20,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
  },
  note: {
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: "center",
    fontFamily: Theme.typography.caption,
    color: Theme.colors.inkFaint,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkFaint,
  },
});

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  chipOn: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.magentaTint,
  },
  chipText: {
    fontSize: 12,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
  },
  chipTextOn: {
    color: Theme.colors.magenta,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
  },
  primary: {
    minHeight: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Theme.spacing.md,
  },
  primaryDisabled: {
    backgroundColor: Theme.colors.disabledBg,
  },
  primaryText: {
    fontSize: 15,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.surface,
  },
  primaryTextDisabled: {
    color: Theme.colors.disabledText,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  linkLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.ink,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Theme.colors.tealTint,
    alignItems: "center",
    justifyContent: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.6,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  optionOn: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.magentaTint,
  },
  optionText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.ink,
  },
  optionTextOn: {
    color: Theme.colors.magenta,
  },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Theme.colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: {
    borderColor: Theme.colors.magenta,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Theme.colors.magenta,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  stepBody: {
    flex: 1,
    alignItems: "flex-start",
  },
  stepTitle: {
    fontSize: 13,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
    marginBottom: 3,
  },
  stepDescription: {
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: Theme.typography.caption,
    color: Theme.colors.inkFaint,
    marginBottom: 8,
  },
  stepAction: {
    fontSize: 13.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.magenta,
  },
});
