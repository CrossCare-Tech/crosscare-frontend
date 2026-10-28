import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useUnitStore, convertWeight } from "@/zustandStore/unitStore";
import { warnIfBackdateIgnored } from "@/components/vitals/backdate";
import { CONFIG } from "@/constants/config";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { ReadingModal, useRecordedAt } from "@/components/vitals/VitalsUI";

interface WeightModalProps {
  visible: boolean;
  onClose: () => void;
  reload: () => void;
  initialWeight?: number | null; // in the unit the user picked
}

// 5.4 — Manual entry for weight (pop-up). The API always stores kilograms.
const WeightModal = ({ visible, onClose, reload, initialWeight = null }: WeightModalProps) => {
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const reading = useRecordedAt();
  const user = useSelector((state: any) => state.user);
  const { weightUnit } = useUnitStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!visible) {
      return;
    }

    setWeight(initialWeight ? String(initialWeight) : "");
  }, [initialWeight, visible]);

  const handleSave = async () => {
    if (!weight) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("weightLog.missing"));
      return;
    }

    const value = Number(weight.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("weightLog.invalid"));
      return;
    }

    if (!user?.user_id) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.loginAgain"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/weight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({
          weight: weightUnit === "lbs" ? convertWeight(value, "lbs", "kg") : value,
          weight_unit: "kg",
          ...reading.payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save weight (${response.status}).`);
      }

      setWeight("");
      const savedAt = reading.recordedAt;
      reading.reset();
      onClose();
      reload();
      warnIfBackdateIgnored({
        recordedAt: savedAt,
        user,
        hasReading: (details) => details?.weight?.value > 0,
        t,
      });
    } catch (error: any) {
      console.warn("Error adding weight:", error?.message);
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setWeight("");
    reading.reset();
    onClose();
  };

  return (
    <ReadingModal
      visible={visible}
      loading={loading}
      onSave={handleSave}
      onClose={handleCancel}
      recordedAt={reading.recordedAt}
      onRecordedAtChange={reading.setRecordedAt}
    >
      <CustomTextInput
        label={t("weightLog.inputLabel", { unit: weightUnit })}
        value={weight}
        onChangeText={(value) => setWeight(value.replace(/[^\d.,]/g, ""))}
        placeholder={weightUnit === "lbs" ? "148" : "67"}
        keyboardType="decimal-pad"
        maxLength={5}
      />
    </ReadingModal>
  );
};

export default WeightModal;
