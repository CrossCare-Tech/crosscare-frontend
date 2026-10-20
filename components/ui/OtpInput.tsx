import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Theme } from "@/constants/theme";

interface OtpInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  hasError?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChangeText,
  length = 6,
  hasError = false,
}) => {
  const inputRef = useRef<TextInput>(null);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable
      style={styles.row}
      onPress={() => inputRef.current?.focus()}
      accessibilityLabel={`${length}-digit verification code`}
    >
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.box,
            value[i] ? styles.boxFilled : null,
            i === activeIndex && value.length < length ? styles.boxActive : null,
            hasError ? styles.boxError : null,
          ]}
        >
          <Text style={[styles.digit, hasError ? styles.digitError : null]}>
            {value[i] || ""}
          </Text>
        </View>
      ))}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={(text) =>
          onChangeText(text.replace(/[^0-9]/g, "").slice(0, length))
        }
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 9,
  },
  box: {
    width: 44,
    height: 54,
    borderRadius: 11,
    borderWidth: 1.6,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxFilled: {
    borderColor: Theme.colors.purple,
  },
  boxActive: {
    borderColor: Theme.colors.magenta,
  },
  boxError: {
    borderColor: Theme.colors.danger,
  },
  digit: {
    fontSize: 19,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.purple,
  },
  digitError: {
    color: Theme.colors.danger,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default OtpInput;
