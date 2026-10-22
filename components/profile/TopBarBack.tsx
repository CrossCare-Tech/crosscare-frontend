import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Path } from "react-native-svg";
import { router } from "expo-router";
import LineIcon from "./LineIcon";
import { C } from "./theme";

// Prototype `.topbar-back`: bordered back button with a left-aligned title
const TopBarBack = ({ title }: { title: string }) => (
  <View style={styles.bar}>
    <TouchableOpacity
      style={styles.backBtn}
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <LineIcon size={18} color={C.ink}>
        <Path d="M15 18l-6-6 6-6" />
      </LineIcon>
    </TouchableOpacity>
    <Text style={styles.title}>{title}</Text>
    <View style={styles.spacer} />
  </View>
);

export default TopBarBack;

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontFamily: "Manrope700",
    fontSize: 16.5,
    color: C.ink,
  },
  spacer: {
    width: 36,
  },
});
