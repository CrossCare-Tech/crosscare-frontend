import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useSelector } from "react-redux";

interface GlucoseModalProps {
  visible: boolean;
  onClose: () => void;
  reload: () => void;
  initialGlucoseLevel?: number | null;
  initialMealContext?: string | null;
  initialGlucoseUnit?: string;
}

const GLUCOSE_CONTEXT_OPTIONS = [
  { label: "Select reading type", value: "" },
  { label: "Daily check-in", value: "Daily check-in" },
  { label: "Fasting", value: "Fasting" },
  { label: "Morning", value: "Morning" },
  { label: "Afternoon", value: "Afternoon" },
  { label: "Evening", value: "Evening" },
  { label: "Before bed", value: "Before bed" },
];

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
  const [showContextPicker, setShowContextPicker] = useState(false);
  const user = useSelector((state: any) => state.user);

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
    setShowContextPicker(false);
  }, [initialGlucoseLevel, initialMealContext, visible]);

  const handleSave = async () => {
    if (!glucoseLevel) {
      Alert.alert("Error", "Please enter your glucose reading.");
      return;
    }

    const parsedGlucoseLevel = Number(glucoseLevel);
    if (!Number.isFinite(parsedGlucoseLevel) || parsedGlucoseLevel <= 0) {
      Alert.alert("Error", "Please enter a valid glucose reading.");
      return;
    }

    if (!user?.token) {
      Alert.alert("Error", "Please log in again to save glucose.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/user/activity/${user.user_id}/glucose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          glucoseLevel: parsedGlucoseLevel,
          glucoseUnit: initialGlucoseUnit,
          glucoseMealContext: glucoseMealContext.trim() || null,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to save glucose.");
      }

      setGlucoseLevel("");
      setGlucoseMealContext("");
      onClose();
      reload();
    } catch (error: any) {
      console.error("Error adding glucose:", error);
      Alert.alert("Error", error.message || "Failed to save glucose.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setGlucoseLevel("");
    setGlucoseMealContext("");
    setShowContextPicker(false);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {initialGlucoseLevel !== null ? "Edit Glucose Reading" : "Add Glucose Reading"}
          </Text>
          <Text style={styles.modalSubtitle}>
            One glucose reading is saved each day. Saving again updates today&apos;s entry.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={glucoseLevel}
              onChangeText={setGlucoseLevel}
              keyboardType="numeric"
              placeholder={`-- ${initialGlucoseUnit}`}
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.inputContainer}>
            <Pressable style={styles.selector} onPress={() => setShowContextPicker((value) => !value)}>
              <Text
                style={[
                  styles.selectorText,
                  !glucoseMealContext && styles.selectorPlaceholder,
              ]}
              >
                {glucoseMealContext || "Select reading type"}
              </Text>
            </Pressable>

            {showContextPicker ? (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={glucoseMealContext}
                  onValueChange={(value) => {
                    setGlucoseMealContext(value);
                    setShowContextPicker(false);
                  }}
                >
                  {GLUCOSE_CONTEXT_OPTIONS.map((option) => (
                    <Picker.Item key={option.value || "empty"} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            ) : null}
          </View>

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
    width: "85%",
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
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 14,
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
  selector: {
    borderWidth: 1,
    borderColor: "#E8D6F2",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorText: {
    fontSize: 16,
    fontFamily: "Inter500",
    color: "#1B2559",
  },
  selectorPlaceholder: {
    color: "#ccc",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E8D6F2",
    borderRadius: 10,
    marginTop: 10,
    overflow: "hidden",
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

export default GlucoseModal;
