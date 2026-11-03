import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeToken, setUser } from "@/store/userSlice";
import { CONFIG } from "@/constants/config";

const DeleteAccount = () => {
  const { t } = useTranslation();
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const user = useSelector((state: any) => state.user);
  const token = useSelector((state: any) => state.user.token);
  const dispatch = useDispatch();

  const handleDeleteAccount = async () => {
    if (confirmationText.trim().toUpperCase() !== "DELETE") {
      Alert.alert(
        t("profile.error"),
        t("profile.invalidDeleteConfirmation")
      );
      return;
    }

    Alert.alert(
      t("profile.confirmDeleteAccount"),
      t("profile.deleteAccountWarning"),
      [
        {
          text: t("profile.cancel"),
          style: "cancel",
        },
        {
          text: t("profile.deleteaccount"),
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            
            // Store user info before clearing state
            const currentUserId = user?.user_id;
            const currentToken = token;
            
            // Defensive check
            if (!currentUserId || !currentToken) {
              console.error("Missing user ID or token for account deletion");
              Alert.alert(
                t("profile.error"),
                "Unable to delete account. Please try logging out and back in."
              );
              setIsDeleting(false);
              return;
            }

            let apiCallSuccessful = false;
            
            try {
              console.log("Starting account deletion for user:", currentUserId);
              
              // Call backend API to delete account
              const response = await fetch(
                `${CONFIG.API_BASE_URL}/user/${currentUserId}/delete-account`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${currentToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (!response.ok) {
                const errorText = await response.text();
                console.error("Delete account API error:", response.status, errorText);
                throw new Error(`API returned ${response.status}: ${errorText}`);
              }

              // Parse response to ensure it's valid JSON
              const result = await response.json();
              console.log("Account deletion API response:", result);
              
              if (!result.success) {
                throw new Error(result.message || "Account deletion failed");
              }

              apiCallSuccessful = true;
              console.log("Account deletion confirmed successful");

            } catch (error) {
              console.error("Account deletion failed:", error);
              Alert.alert(
                t("profile.error"),
                t("profile.deleteAccountError")
              );
              setIsDeleting(false);
              return; // Exit early on API failure
            }

            // Only proceed with cleanup if API call was successful
            if (apiCallSuccessful) {
              try {
                console.log("Starting cleanup process...");
                
                // Clear all localStorage items FIRST
                await AsyncStorage.clear();
                console.log("AsyncStorage cleared");
                
                // Clear Redux state SECOND  
                dispatch(removeToken());
                dispatch(setUser(null));
                console.log("Redux state cleared");

                // Use setTimeout to ensure state changes are processed
                setTimeout(() => {
                  // Show success message and redirect LAST
                  Alert.alert(
                    t("profile.deleteAccountSuccess"),
                    "",
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          console.log("Redirecting to login...");
                          // Use replace to ensure we can't navigate back
                          router.replace("/login");
                        },
                      },
                    ],
                    { cancelable: false }
                  );
                }, 100); // Small delay to ensure state updates are processed

              } catch (cleanupError) {
                console.error("Error during cleanup:", cleanupError);
                // Even if cleanup fails, still redirect since account is deleted
                Alert.alert(
                  "Account Deleted",
                  "Your account has been deleted",
                  [
                    {
                      text: "OK",
                      onPress: () => router.replace("/login"),
                    },
                  ]
                );
              }
            }
            
            setIsDeleting(false);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#373737" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("profile.deleteaccount")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Warning Icon */}
          <View style={styles.warningIconContainer}>
            <Ionicons name="warning" size={60} color="#FF4444" />
          </View>

          {/* Warning Title */}
          <Text style={styles.warningTitle}>
            {t("profile.confirmDeleteAccount")}
          </Text>

          {/* Warning Description */}
          <Text style={styles.warningDescription}>
            {t("profile.deleteAccountWarning")}
          </Text>

          {/* Features that will be lost */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>
              What will be permanently deleted:
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FF4444" />
                <Text style={styles.featureText}>Your pregnancy journey data</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FF4444" />
                <Text style={styles.featureText}>All earned badges and achievements</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FF4444" />
                <Text style={styles.featureText}>Journal entries and notes</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FF4444" />
                <Text style={styles.featureText}>Health tracking data</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FF4444" />
                <Text style={styles.featureText}>Avatar customizations</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FF4444" />
                <Text style={styles.featureText}>App preferences and settings</Text>
              </View>
            </View>
          </View>

          {/* Confirmation Input */}
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationLabel}>
              {t("profile.typeDeleteToConfirm")}
            </Text>
            <TextInput
              style={styles.confirmationInput}
              value={confirmationText}
              onChangeText={setConfirmationText}
              placeholder={t("profile.deleteAccountPlaceholder")}
              placeholderTextColor="#999"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>
                {t("profile.cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                confirmationText.trim().toUpperCase() !== "DELETE" && styles.deleteButtonDisabled,
              ]}
              onPress={handleDeleteAccount}
              disabled={confirmationText.trim().toUpperCase() !== "DELETE" || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>
                  {t("profile.deleteaccount")}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Additional Warning */}
          <View style={styles.additionalWarning}>
            <Text style={styles.additionalWarningText}>
              This action cannot be undone. Please make sure you want to permanently delete your account.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DeleteAccount;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "DMSans600",
    color: "#373737",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  warningIconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 24,
    fontFamily: "DMSans700",
    color: "#FF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  warningDescription: {
    fontSize: 16,
    fontFamily: "DMSans400",
    color: "#373737",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: "#FF4444",
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#373737",
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: "DMSans400",
    color: "#666",
    flex: 1,
  },
  confirmationContainer: {
    marginBottom: 32,
  },
  confirmationLabel: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#373737",
    marginBottom: 12,
  },
  confirmationInput: {
    borderWidth: 2,
    borderColor: "#FF4444",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: "DMSans500",
    color: "#373737",
    textAlign: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#666",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FF4444",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButtonDisabled: {
    backgroundColor: "#FFB3B3",
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "white",
  },
  additionalWarning: {
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  additionalWarningText: {
    fontSize: 12,
    fontFamily: "DMSans400",
    color: "#E65100",
    textAlign: "center",
    fontStyle: "italic",
  },
});
