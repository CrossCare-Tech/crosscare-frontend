import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Polyline, Rect, Stop } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import LineIcon from "@/components/profile/LineIcon";

// Shared pieces of the vital sign screens (prototype 5.1–5.3)

export type Tone = "success" | "warning" | "danger";

const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: Theme.colors.successTint, fg: Theme.colors.success },
  warning: { bg: Theme.colors.warningTint, fg: Theme.colors.warning },
  danger: { bg: Theme.colors.dangerTint, fg: Theme.colors.danger },
};

// Prototype `.pill` with a semantic color
export const Pill = ({ label, tone }: { label: string; tone: Tone }) => (
  <Text style={[styles.pill, { backgroundColor: TONES[tone].bg, color: TONES[tone].fg }]}>
    {label}
  </Text>
);

// Prototype sparkline: one value per reading, drawn in a 260 x 64 viewBox
export const Sparkline = ({ values }: { values: number[] }) => {
  if (values.length === 0) return null;
  const min = Math.min(...values) - 10;
  const max = Math.max(...values) + 10;
  const step = values.length > 1 ? 245 / (values.length - 1) : 0;
  const points = values
    .map((value, index) => {
      const x = values.length > 1 ? index * step : 122;
      const y = 56 - ((value - min) / (max - min)) * 48;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `M${points.split(" ").join(" L")} L245,64 L0,64 Z`;

  return (
    <Svg width="100%" height={64} viewBox="0 0 260 64" preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={Theme.colors.magenta} stopOpacity={0.12} />
          <Stop offset="1" stopColor={Theme.colors.surface} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      {values.length > 1 && <Path d={area} fill="url(#sg)" />}
      {/* A single reading has no line to draw, so show it as a dot */}
      {values.length === 1 && <Circle cx={122} cy={32} r={4} fill={Theme.colors.magenta} />}
      <Polyline
        points={points}
        fill="none"
        stroke={Theme.colors.magenta}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Prototype 5.3 "Manual entry", shown as a pop-up. The date and time are informative only:
// the API always stores the reading on the current day.
export const ReadingModal = ({
  visible,
  loading,
  onSave,
  onClose,
  children,
}: {
  visible: boolean;
  loading: boolean;
  onSave: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const { t, i18n } = useTranslation();
  const time = new Date().toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" });

  return (
    <Modal transparent statusBarTranslucent visible={visible} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.card}>
            <Text style={styles.title}>{t("vitalsEntry.manualEntry")}</Text>
            {children}
            <View style={styles.field}>
              <Text style={styles.label}>{t("vitalsEntry.dateTime")}</Text>
              <View style={styles.readOnly}>
                <Text style={styles.readOnlyText}>{t("vitalsEntry.todayAt", { time })}</Text>
                <LineIcon size={16} color={Theme.colors.inkFaint}>
                  <Rect x="4" y="5" width="16" height="15" rx="2" />
                  <Path d="M4 10h16M9 3v4M15 3v4" />
                </LineIcon>
              </View>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={onSave}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={Theme.colors.surface} />
              ) : (
                <Text style={styles.buttonText}>{t("vitalsEntry.saveReading")}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancel} onPress={onClose} accessibilityRole="button">
              <Text style={styles.cancelText}>{t("vitalsEntry.cancel")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Prototype `.chip-select`
export const ChipSelect = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipOn]}
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
  >
    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
  </TouchableOpacity>
);

export const vitalsStyles = StyleSheet.create({
  field: {
    gap: 7,
  },
  label: {
    fontFamily: Theme.typography.heading,
    fontSize: 12.5,
    color: Theme.colors.inkSoft,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.sm,
  },
});

const styles = StyleSheet.create({
  ...vitalsStyles,
  flex: {
    flex: 1,
  },
  pill: {
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: Theme.colors.scrim,
    justifyContent: "center",
    padding: 22,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: Theme.spacing.md,
  },
  title: {
    fontFamily: Theme.typography.display,
    fontSize: 20,
    color: Theme.colors.ink,
  },
  readOnly: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Theme.colors.inputBorder,
    backgroundColor: Theme.colors.surfaceSubtle,
    paddingHorizontal: Theme.spacing.md,
  },
  readOnlyText: {
    fontFamily: Theme.typography.body,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  button: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.surface,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: Theme.spacing.xs,
    marginTop: -Theme.spacing.xs,
  },
  cancelText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.inkSoft,
  },
  chip: {
    paddingVertical: Theme.spacing.sm,
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
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkSoft,
  },
  chipTextOn: {
    color: Theme.colors.magenta,
  },
});
