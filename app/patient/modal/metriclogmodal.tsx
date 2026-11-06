import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { useSelector } from "react-redux";
import { CONFIG } from "@/constants/config";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { ReadingModal } from "@/components/vitals/VitalsUI";

/**
 * A numeric log entry for one health metric.
 *
 * Steps have no manual entry path of their own: they arrive solely from Fitbit
 * or Apple Health, and the Fitbit Web API was switched off on 30 October 2026,
 * so an Android user would have no way to record them. The write endpoint
 * already exists and is used by the Doula chat, so this is the same POST behind
 * a form.
 *
 * The behaviour (request, bounds, double-tap guard, messages) is the client's
 * original. Only the look changed: it renders through ReadingModal, like the
 * other manual-entry pop-ups, instead of drawing its own card and colours.
 */
interface MetricLogModalProps {
  visible: boolean;
  onClose: () => void;
  /** Re-fetch the screen's data after a successful save. */
  reload: () => void;
  title: string;
  /** Label above the input. */
  label: string;
  placeholder: string;
  /** Path segment under `/user/activity/{userId}/`. */
  path: string;
  /** Request body for an accepted value. */
  buildBody: (value: number) => Record<string, unknown>;
  /** Inclusive bounds; a value outside them is rejected before the request. */
  min: number;
  max: number;
  /** Shown when the input is empty or outside the bounds. */
  invalidMessage: string;
}

const MetricLogModal = ({
  visible,
  onClose,
  reload,
  title,
  label,
  placeholder,
  path,
  buildBody,
  min,
  max,
  invalidMessage,
}: MetricLogModalProps) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useSelector((state: any) => state.user);
  const { t } = useTranslation();

  const close = () => {
    setInput("");
    onClose();
  };

  const handleSave = async () => {
    // Guard re-entry: the save button stays mounted while the request is in
    // flight, and a second tap would post a duplicate entry.
    if (loading) {
      return;
    }

    const value = Number(input.trim());
    if (!input.trim() || !Number.isFinite(value) || value < min || value > max) {
      Alert.alert(t("metricLog.error"), invalidMessage);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/${path}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildBody(value)),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || t("metricLog.failedToSave"));
      }

      close();
      reload();
    } catch (error: any) {
      Alert.alert(
        t("metricLog.error"),
        error?.message || t("metricLog.failedToSave")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReadingModal
      visible={visible}
      loading={loading}
      onSave={handleSave}
      onClose={close}
      title={title}
      showDateTime={false}
    >
      <CustomTextInput
        label={label}
        value={input}
        onChangeText={(value) => setInput(value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        keyboardType="number-pad"
        maxLength={String(max).length}
      />
    </ReadingModal>
  );
};

export default MetricLogModal;
