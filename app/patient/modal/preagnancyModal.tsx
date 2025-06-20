import React, { useEffect, useState } from "react";
import { Alert, TextInput } from "react-native";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { CONFIG } from "@/constants/config";

interface PregnancyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weekValue: number) => void; // Assuming you want to return total days
}

const PregnancyModal: React.FC<PregnancyModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [weeks, setWeeks] = useState("");
  const [days, setDays] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const userId = useSelector((state: any) => state.user.user_id);
  const token = useSelector((state: any) => state.user.token);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (visible && userId && token) {
      fetchCurrentPregnancyData();
    }
  }, [visible, userId, token]);

  const fetchCurrentPregnancyData = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/${userId}/pregnancy-week`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Pre-fill the form with existing data
        setWeeks(data.data.week ? data.data.week.toString() : "");
        setDays(data.data.day ? data.data.day.toString() : "");
      } else {
        // If no data exists or error, keep fields empty
        setWeeks("");
        setDays("");
      }
    } catch (error) {
      console.error("Error fetching pregnancy data:", error);
      // Keep fields empty on error
      setWeeks("");
      setDays("");
    } finally {
      setIsFetching(false);
    }
  };

  const validateInputs = () => {
    const weekValue = parseInt(weeks) || 0;
    const dayValue = parseInt(days) || 0;

    // Validate week range (1-42)
    if (weekValue < 1 || weekValue > 42) {
      Alert.alert("Invalid Week", "Please enter a week between 1 and 42");
      return false;
    }

    // Validate day range (1-7)
    if (dayValue < 1 || dayValue > 8) {
      Alert.alert("Invalid Day", "Please enter a day between 1 and 7");
      return false;
    }

    return true;
  };

  const updatePregnancyWeek = async (week: number, day: number) => {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/${userId}/pregnancy-week`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            week: week,
            day: day,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update pregnancy information"
        );
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!validateInputs()) {
      return;
    }

    const weekValue = parseInt(weeks) || 0;
    const dayValue = parseInt(days) || 0;

    setIsLoading(true);

    try {
      const result = await updatePregnancyWeek(weekValue, dayValue);
      console.log("API Response:", result);
      onSave(weekValue); // Call onSave with week and day values
      setTimeout(() => {
        onClose(); // Close the modal after saving
      }, 1000);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to update pregnancy information"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>How Far Along Are You?</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="-- Weeks"
                value={weeks}
                onChangeText={setWeeks}
                placeholderTextColor="#ccc"
              />
            </View>

            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="-- Days"
                value={days}
                onChangeText={setDays}
                placeholderTextColor="#ccc"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText} numberOfLines={1}>
                Save & Continue
              </Text>
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
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 40,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "DMSans600",
    color: "#F76CCF",
    textAlign: "center",
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    gap: 9,
  },
  inputBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    height: 41,
    borderRadius: 8,
    borderColor: "rgba(247, 108, 207, 1)",
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "DMSans500",
    color: "#666",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter500",
    color: "rgba(123, 123, 123, 1)",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "Inter400",
    color: "rgba(123, 123, 123, 1)",
  },
  saveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    height: 41,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "rgba(231, 119, 199, 1)",
    backgroundColor: "rgba(247, 108, 207, 1)",

    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.32,
    shadowRadius: 2.6,

    // Shadow for Android
    elevation: 1, // Adjusted to match the feel of the shadow
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: "Inter500",
    color: "white",
  },
});

export default PregnancyModal;
