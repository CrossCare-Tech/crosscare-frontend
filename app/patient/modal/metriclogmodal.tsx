import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { CONFIG } from "@/constants/config";

/**
 * A numeric log entry for one health metric.
 *
 * Steps and heart rate are the only metrics with no manual entry path: both
 * arrive solely from Fitbit or Apple Health, and the Fitbit Web API was
 * switched off on 30 October 2026. The write endpoints already exist and are
 * used by the Doula chat, so this is the same POST behind a form.
 *
 * Shared rather than copied per metric because the two differ only in their
 * accent colour, bounds and request body.
 */
interface MetricLogModalProps {
  visible: boolean;
  onClose: () => void;
  /** Re-fetch the screen's data after a successful save. */
  reload: () => void;
  title: string;
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
  accent: string;
  accentBorder: string;
  inputBorder: string;
}

const MetricLogModal = ({
  visible,
  onClose,
  reload,
  title,
  placeholder,
  path,
  buildBody,
  min,
  max,
  invalidMessage,
  accent,
  accentBorder,
  inputBorder,
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
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: accent }]}>{title}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { borderColor: inputBorder }]}
              value={input}
              onChangeText={setInput}
              keyboardType="numeric"
              placeholder={placeholder}
              placeholderTextColor="#CCCCCC"
              editable={!loading}
              autoFocus
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={close}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>
                {t("metricLog.cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: accent, borderColor: accentBorder },
                loading && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText} numberOfLines={1}>
                  {t("metricLog.save")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter600",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    width: "60%",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Inter500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: "#7B7B7B",
    fontSize: 14,
    fontFamily: "Inter500",
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 32,
    borderWidth: 1,
    minWidth: 118,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    maxWidth: 130,
    fontFamily: "Inter500",
  },
});

export default MetricLogModal;
