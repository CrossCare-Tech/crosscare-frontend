import React, { useEffect, useState } from "react";
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
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import LineIcon from "@/components/profile/LineIcon";

// Shared pieces of the vital sign screens (prototype 5.1–5.3)

export type Tone = "success" | "warning" | "danger" | "teal";

const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: Theme.colors.successTint, fg: Theme.colors.success },
  warning: { bg: Theme.colors.warningTint, fg: Theme.colors.warning },
  danger: { bg: Theme.colors.dangerTint, fg: Theme.colors.danger },
  teal: { bg: Theme.colors.tealTint, fg: Theme.colors.teal },
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

const MAX_BACKDATE_DAYS = 365;

// Date of a manual reading. `null` means "now", so the request stays the same as before
// unless she picks another moment. `payload` is spread into the request body.
export const useRecordedAt = () => {
  const [recordedAt, setRecordedAt] = useState<Date | null>(null);
  return {
    recordedAt,
    setRecordedAt,
    reset: () => setRecordedAt(null),
    payload: CONFIG.BACKDATED_READINGS && recordedAt ? { recorded_at: recordedAt.toISOString() } : {},
  };
};

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

// Prototype 5.3 "Manual entry", shown as a pop-up. When `onRecordedAtChange` is passed (and
// BACKDATED_READINGS is on) the date and time can be changed to an earlier moment, never a future one.
export const ReadingModal = ({
  visible,
  loading,
  onSave,
  onClose,
  recordedAt = null,
  onRecordedAtChange,
  children,
}: {
  visible: boolean;
  loading: boolean;
  onSave: () => void;
  onClose: () => void;
  recordedAt?: Date | null;
  onRecordedAtChange?: (value: Date | null) => void;
  children: React.ReactNode;
}) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<"date" | "time" | "datetime" | null>(null);
  const [draft, setDraft] = useState(new Date());
  useEffect(() => {
    if (!visible) setStep(null);
  }, [visible]);
  const editable = CONFIG.BACKDATED_READINGS && !!onRecordedAtChange;
  const shown = recordedAt ?? new Date();
  const time = shown.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" });
  const label = isSameDay(shown, new Date())
    ? t("vitalsEntry.todayAt", { time })
    : `${shown.toLocaleDateString(i18n.language, { month: "short", day: "numeric", year: "numeric" })}, ${time}`;

  const now = new Date();
  const earliest = new Date(now.getTime() - MAX_BACKDATE_DAYS * 24 * 60 * 60 * 1000);
  const commit = (value: Date) => onRecordedAtChange?.(value.getTime() >= Date.now() ? null : value);

  const openPicker = () => {
    setDraft(shown);
    setStep(step ? null : Platform.OS === "ios" ? "datetime" : "date");
  };

  const onPick = (event: DateTimePickerEvent, value?: Date) => {
    if (event.type === "dismissed" || !value) {
      setStep(null);
      return;
    }
    if (Platform.OS === "ios") {
      setDraft(value);
      commit(value);
      return;
    }
    if (step === "date") {
      setDraft(value);
      setStep("time");
      return;
    }
    const merged = new Date(draft);
    merged.setHours(value.getHours(), value.getMinutes(), 0, 0);
    commit(merged);
    setStep(null);
  };

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
              <TouchableOpacity
                style={styles.readOnly}
                onPress={openPicker}
                disabled={!editable}
                accessibilityRole={editable ? "button" : undefined}
                accessibilityLabel={editable ? t("vitalsEntry.changeDateTime") : undefined}
              >
                <Text style={styles.readOnlyText}>{label}</Text>
                <LineIcon size={16} color={Theme.colors.inkFaint}>
                  <Rect x="4" y="5" width="16" height="15" rx="2" />
                  <Path d="M4 10h16M9 3v4M15 3v4" />
                </LineIcon>
              </TouchableOpacity>
              {editable && step && (
                <DateTimePicker
                  value={draft}
                  mode={step}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={earliest}
                  maximumDate={now}
                  onChange={onPick}
                />
              )}
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
