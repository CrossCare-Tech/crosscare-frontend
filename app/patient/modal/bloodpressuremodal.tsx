import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import { API_URL } from "@/constants/api";

interface BloodPressureModalProps {
  visible: boolean;
  onClose: () => void;
  reload: () => void;
}

const BloodPressureModal = ({ visible, onClose, reload }: BloodPressureModalProps) => {
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useSelector((state: any) => state.user);

  const handleSave = async () => {
    if (!systolic || !diastolic) {
      Alert.alert("Error", "Please enter both systolic and diastolic values.");
      return;
    }
    if (isNaN(Number(systolic)) || isNaN(Number(diastolic))) {
      Alert.alert("Error", "Please enter valid numbers.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/user/activity/${user.user_id}/bloodpressure`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systolic: parseInt(systolic),
            diastolic: parseInt(diastolic),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save.");

      setSystolic("");
      setDiastolic("");
      onClose();
      reload();
    } catch (error: any) {
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
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Blood Pressure Log</Text>

          <Text style={styles.label}>Systolic (mmHg)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={systolic}
              onChangeText={setSystolic}
              keyboardType="numeric"
              placeholder="e.g. 120"
              placeholderTextColor="#ccc"
            />
          </View>

          <Text style={styles.label}>Diastolic (mmHg)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={diastolic}
              onChangeText={setDiastolic}
              keyboardType="numeric"
              placeholder="e.g. 80"
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "DMSans600",
    color: "#373737",
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    fontFamily: "DMSans500",
    color: "#666",
    marginBottom: 4,
    marginTop: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    marginBottom: 4,
  },
  input: {
    padding: 14,
    fontSize: 16,
    fontFamily: "DMSans400",
    color: "#373737",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  cancelButtonText: {
    fontFamily: "DMSans500",
    color: "#666",
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#E57373",
    alignItems: "center",
  },
  saveButtonText: {
    fontFamily: "DMSans600",
    color: "#fff",
    fontSize: 15,
  },
});

export default BloodPressureModal;
