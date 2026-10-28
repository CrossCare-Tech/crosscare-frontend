import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { ChipSelect, ReadingModal, vitalsStyles } from "@/components/vitals/VitalsUI";

interface GlucoseModalProps {
  visible: boolean;
  onClose: () => void;
  reload: () => void;
  initialGlucoseLevel?: number | null;
  initialMealContext?: string | null;
  initialGlucoseUnit?: string;
}

// Values stored by the API (in English) and their translation keys
export const GLUCOSE_CONTEXTS = [
  { value: "Daily check-in", key: "ctxDaily" },
  { value: "Fasting", key: "ctxFasting" },
  { value: "Morning", key: "ctxMorning" },
  { value: "Afternoon", key: "ctxAfternoon" },
  { value: "Evening", key: "ctxEvening" },
  { value: "Before bed", key: "ctxBeforeBed" },
];

// 5.3 — Manual entry for glucose (pop-up)
const GlucoseModal = ({
  visible,
  onClose,
  reload,
  initialGlucoseLevel = null,
  initialMealContext = null,
  initialGlucoseUnit = "mg/dL",
}: GlucoseModalProps) => {
  const [glucoseLevel, setGlucoseLevel] = useState("");
  const [glucoseMealContext, setGlucoseMealContext] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useSelector((state: any) => state.user);
  const { t } = useTranslation();

  useEffect(() => {
    if (!visible) {
      return;
    }

    setGlucoseLevel(
      initialGlucoseLevel !== null && initialGlucoseLevel !== undefined
        ? String(initialGlucoseLevel)
        : ""
    );
    setGlucoseMealContext(initialMealContext || "");
  }, [initialGlucoseLevel, initialMealContext, visible]);

  const handleSave = async () => {
    if (!glucoseLevel) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.glucoseMissing"));
      return;
    }

    const parsedGlucoseLevel = Number(glucoseLevel);
    if (!Number.isFinite(parsedGlucoseLevel) || parsedGlucoseLevel <= 0) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.glucoseInvalid"));
      return;
    }

    if (!user?.token) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.loginAgain"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/glucose`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            glucoseLevel: parsedGlucoseLevel,
            glucoseUnit: initialGlucoseUnit,
            glucoseMealContext: glucoseMealContext.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(
          raw
            ? `Failed to save glucose (${response.status}). ${raw.slice(0, 120)}`
            : `Failed to save glucose (${response.status}).`
        );
      }

      setGlucoseLevel("");
      setGlucoseMealContext("");
      onClose();
      reload();
    } catch (error: any) {
      console.warn("Error adding glucose:", error?.message);
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setGlucoseLevel("");
    setGlucoseMealContext("");
    onClose();
  };

  return (
    <ReadingModal visible={visible} loading={loading} onSave={handleSave} onClose={handleCancel}>
      <CustomTextInput
        label={t("vitalsEntry.glucoseLevel", { unit: initialGlucoseUnit })}
        value={glucoseLevel}
        onChangeText={(value) => setGlucoseLevel(value.replace(/[^\d.]/g, ""))}
        placeholder="92"
        keyboardType="decimal-pad"
        maxLength={5}
      />
      <View style={vitalsStyles.field}>
        <Text style={vitalsStyles.label}>{t("vitalsEntry.readingType")}</Text>
        <View style={vitalsStyles.chips}>
          {GLUCOSE_CONTEXTS.map((option) => (
            <ChipSelect
              key={option.value}
              label={t(`vitalsEntry.${option.key}`)}
              selected={glucoseMealContext === option.value}
              onPress={() =>
                setGlucoseMealContext(glucoseMealContext === option.value ? "" : option.value)
              }
            />
          ))}
        </View>
      </View>
    </ReadingModal>
  );
};

export default GlucoseModal;
