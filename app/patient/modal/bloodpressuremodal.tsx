import React, { useState } from "react";
import { Alert, View } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { warnIfBackdateIgnored } from "@/components/vitals/backdate";
import { CONFIG } from "@/constants/config";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { ReadingModal, useRecordedAt, vitalsStyles } from "@/components/vitals/VitalsUI";

interface BloodPressureModalProps {
  visible: boolean;
  onClose: () => void;
  reload: () => void;
}

// 5.3 — Manual entry for blood pressure (pop-up)
const BloodPressureModal = ({ visible, onClose, reload }: BloodPressureModalProps) => {
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [loading, setLoading] = useState(false);
  const reading = useRecordedAt();
  const user = useSelector((state: any) => state.user);
  const { t } = useTranslation();

  const handleSave = async () => {
    if (!systolic || !diastolic) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.bpMissing"));
      return;
    }
    if (isNaN(Number(systolic)) || isNaN(Number(diastolic))) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.bpInvalid"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/bp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            systolic: parseInt(systolic),
            diastolic: parseInt(diastolic),
            ...reading.payload,
          }),
        }
      );

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(
          raw
            ? `Request failed (${response.status}). ${raw.slice(0, 120)}`
            : `Request failed (${response.status})`
        );
      }

      setSystolic("");
      setDiastolic("");
      const savedAt = reading.recordedAt;
      reading.reset();
      onClose();
      reload();
      warnIfBackdateIgnored({
        recordedAt: savedAt,
        user,
        hasReading: (details) => details?.bloodPressure?.systolic > 0,
        t,
      });
    } catch (error: any) {
      console.warn("Error saving blood pressure:", error?.message);
      Alert.alert(t("vitalsEntry.errorTitle"), t("vitalsEntry.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSystolic("");
    setDiastolic("");
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
      <View style={vitalsStyles.row}>
        <View style={{ flex: 1 }}>
          <CustomTextInput
            label={t("vitalsEntry.systolic")}
            value={systolic}
            onChangeText={(value) => setSystolic(value.replace(/\D/g, ""))}
            placeholder="118"
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
        <View style={{ flex: 1 }}>
          <CustomTextInput
            label={t("vitalsEntry.diastolic")}
            value={diastolic}
            onChangeText={(value) => setDiastolic(value.replace(/\D/g, ""))}
            placeholder="76"
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
      </View>
    </ReadingModal>
  );
};

export default BloodPressureModal;
