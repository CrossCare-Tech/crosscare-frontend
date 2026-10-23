import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Theme } from "@/constants/theme";

// Prototype `.toggle`: 42x25 track, magenta when on, white knob
const Toggle = ({
  value,
  onChange,
  disabled,
  accessibilityLabel,
}: {
  value: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) => (
  <Pressable
    onPress={() => onChange?.(!value)}
    disabled={disabled}
    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
    accessibilityRole="switch"
    accessibilityState={{ checked: value, disabled }}
    accessibilityLabel={accessibilityLabel}
  >
    <View style={[styles.track, value && styles.trackOn]}>
      <View style={[styles.knob, value && styles.knobOn]} />
    </View>
  </Pressable>
);

export default Toggle;

const styles = StyleSheet.create({
  track: {
    width: 42,
    height: 25,
    borderRadius: 14,
    backgroundColor: Theme.colors.hairline,
  },
  trackOn: {
    backgroundColor: Theme.colors.magenta,
  },
  knob: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.card,
  },
  knobOn: {
    left: 20,
  },
});
