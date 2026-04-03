import React, { useEffect, useState } from "react";
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

interface BloodPressureModalProps {
  visible: boolean;
  onClose: () => void;
  reload: () => void;
  initialSystolic?: number | null;
  initialDiastolic?: number | null;
}

const BloodPressureModal = ({
  visible,
  onClose,
  reload,
  initialSystolic = null,
  initialDiastolic = null,
}: BloodPressureModalProps) => {
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useSelector((state: any) => state.user);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSystolic(
      initialSystolic !== null && initialSystolic !== undefined
        ? String(initialSystolic)
        : ""
    );
    setDiastolic(
      initialDiastolic !== null && initialDiastolic !== undefined
        ? String(initialDiastolic)
        : ""
    );
  }, [initialDiastolic, initialSystolic, visible]);

  const handleSave = async () => {
    const parsedSystolic = Number(systolic);
    const parsedDiastolic = Number(diastolic);

    if (
      !Number.isFinite(parsedSystolic) ||
      !Number.isFinite(parsedDiastolic) ||
      parsedSystolic <= 0 ||
      parsedDiastolic <= 0
    ) {
      Alert.alert("Error", "Please enter valid systolic and diastolic values.");
      return;
    }

    if (!user?.token) {
      Alert.alert("Error", "Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/user/activity/${user.user_id}/bp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          systolic: parsedSystolic,
          diastolic: parsedDiastolic,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to save blood pressure.");
      }

      setSystolic("");
      setDiastolic("");
      onClose();
      reload();
    } catch (error: any) {
      console.error("Error saving blood pressure:", error);
      Alert.alert("Error", error.message || "Failed to save blood pressure.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSystolic("");
    setDiastolic("");
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {initialSystolic !== null && initialDiastolic !== null
              ? "Edit Blood Pressure"
              : "Add Blood Pressure"}
          </Text>
          <Text style={styles.modalSubtitle}>
            One blood pressure reading is saved each day.
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Systolic</Text>
              <TextInput
                style={styles.input}
                value={systolic}
                onChangeText={setSystolic}
                keyboardType="numeric"
                placeholder="120"
                placeholderTextColor="#ccc"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Diastolic</Text>
              <TextInput
                style={styles.input}
                value={diastolic}
                onChangeText={setDiastolic}
                keyboardType="numeric"
                placeholder="80"
                placeholderTextColor="#ccc"
              />
            </View>
          </View>

          <Text style={styles.unitLabel}>Unit: mmHg</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "88%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter600",
    color: "#8E44AD",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6B7280",
    fontFamily: "Inter400",
    textAlign: "center",
    marginBottom: 18,
  },
  inputRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter500",
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E8D6F2",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Inter500",
  },
  unitLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter500",
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
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
    backgroundColor: "#8E44AD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 32,
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter500",
  },
});

export default BloodPressureModal;
