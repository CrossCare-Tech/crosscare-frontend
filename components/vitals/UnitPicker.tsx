import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import LineIcon from "@/components/profile/LineIcon";

// Units & Measurements: one section with the options as rows in a white card, the same look as the Language screen.
// The choice is applied with Save, so leaving without it changes nothing.
export default function UnitPicker<T extends string>({
  section,
  options,
  selected,
  onSelect,
  onSave,
}: {
  section: string;
  options: { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("title")} action={{ label: t("save"), onPress: onSave }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.section}>{section}</Text>
          <View style={styles.card}>
            {options.map((option, index) => {
              const isSelected = option.id === selected;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.row, index === options.length - 1 && styles.rowLast]}
                  onPress={() => onSelect(option.id)}
                  activeOpacity={0.6}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={styles.name}>{option.label}</Text>
                  {isSelected && (
                    <LineIcon size={17} color={Theme.colors.magenta}>
                      <Path d="M5 12.5l4.5 4.5L19 7" />
                    </LineIcon>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 10,
  },
  section: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.inkSoft,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  name: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
});
