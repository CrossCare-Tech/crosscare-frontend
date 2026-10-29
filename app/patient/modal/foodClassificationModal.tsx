import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { ReadingModal } from "@/components/vitals/VitalsUI";

interface FoodClassificationModalProps {
  visible: boolean;
  foodName: string;
  onClose: () => void;
  onClassify: (classification: "good" | "bad", quantity: number) => void;
}

// Before adding a food: how many portions, and whether it was a healthy choice or a treat
const FoodClassificationModal = ({ visible, foodName, onClose, onClassify }: FoodClassificationModalProps) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [kind, setKind] = useState<"good" | "bad">("good");

  useEffect(() => {
    if (!visible) return;
    setQuantity(1);
    setKind("good");
  }, [visible]);

  return (
    <ReadingModal
      visible={visible}
      loading={false}
      onSave={() => onClassify(kind, quantity)}
      onClose={onClose}
      title={foodName}
      saveLabel={t("foodLog.addFood")}
      showDateTime={false}
    >
      <Text style={styles.label}>{t("foodLog.portions")}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.stepButton, quantity <= 1 && styles.disabled]}
          onPress={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          accessibilityRole="button"
          accessibilityLabel={t("foodLog.less")}
        >
          <Feather name="minus" size={16} color={Theme.colors.ink} />
        </TouchableOpacity>
        <Text style={styles.stepValue}>{quantity}</Text>
        <TouchableOpacity
          style={styles.stepButton}
          onPress={() => setQuantity(quantity + 1)}
          accessibilityRole="button"
          accessibilityLabel={t("foodLog.more")}
        >
          <Feather name="plus" size={16} color={Theme.colors.ink} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t("foodLog.kindQuestion")}</Text>
      <View style={styles.kinds} accessibilityRole="radiogroup">
        {(["good", "bad"] as const).map((option) => {
          const selected = option === kind;
          const color = option === "good" ? Theme.colors.success : Theme.colors.warning;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.kind, selected && { borderColor: color, backgroundColor: option === "good" ? Theme.colors.successTint : Theme.colors.warningTint }]}
              onPress={() => setKind(option)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
            >
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={[styles.kindText, selected && { color }]}>
                {option === "good" ? t("foodLog.healthyChoice") : t("foodLog.treat")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ReadingModal>
  );
};

export default FoodClassificationModal;

const styles = StyleSheet.create({
  label: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.inkSoft,
    marginBottom: Theme.spacing.sm,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: Theme.spacing.md,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.4,
  },
  stepValue: {
    minWidth: 24,
    textAlign: "center",
    fontFamily: Theme.typography.display,
    fontSize: 22,
    color: Theme.colors.ink,
  },
  kinds: {
    flexDirection: "row",
    gap: 8,
  },
  kind: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kindText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 13.5,
    color: Theme.colors.inkSoft,
  },
});
