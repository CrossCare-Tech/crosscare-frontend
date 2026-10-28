import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { warnIfBackdateIgnored } from "@/components/vitals/backdate";
import { CONFIG } from "@/constants/config";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { ReadingModal, useRecordedAt } from "@/components/vitals/VitalsUI";

interface HeartRateModalProps {
  visible: boolean;
  onClose: () => void;
  reload: () => void;
  initialHeartRate?: number | null;
}

// 5.3 — Manual entry for heart rate (pop-up)
const HeartRateModal = ({ visible, onClose, reload, initialHeartRate = null }: HeartRateModalProps) => {
  const [heartRate, setHeartRate] = useState("");
  const [loading, setLoading] = useState(false);
  const reading = useRecordedAt();
  const user = useSelector((state: any) => state.user);
  const { t } = useTranslation();

  useEffect(() => {
    if (!visible) {
      return;
    }

    setHeartRate(initialHeartRate ? String(initialHeartRate) : "");
  }, [initialHeartRate, visible]);

  const handleSave = async () => {
    if (!heartRate) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("heartLog.missing"));
      return;
    }

    const bpm = Number(heartRate);
    if (!Number.isFinite(bpm) || bpm < 30 || bpm > 220) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("heartLog.invalid"));
      return;
    }

    if (!user?.user_id) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.loginAgain"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/heart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({ heartRate: bpm, ...reading.payload }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save heart rate (${response.status}).`);
      }

      setHeartRate("");
      const savedAt = reading.recordedAt;
      reading.reset();
      onClose();
      reload();
      warnIfBackdateIgnored({
        recordedAt: savedAt,
        user,
        hasReading: (details) => details?.heart > 0,
        t,
      });
    } catch (error: any) {
      console.warn("Error adding heart rate:", error?.message);
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setHeartRate("");
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
        label={t("heartLog.inputLabel")}
        value={heartRate}
        onChangeText={(value) => setHeartRate(value.replace(/[^\d]/g, ""))}
        placeholder="84"
        keyboardType="number-pad"
        maxLength={3}
      />
    </ReadingModal>
  );
};

export default HeartRateModal;
