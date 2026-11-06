import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeToken, removeUser } from "@/store/userSlice";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";

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
                dispatch(removeUser()); // setUser(null) throws in the reducer, so the user was never cleared
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
                  t("uiText.accountDeleted"),
                  t("uiText.accountDeletedMsg"),
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

  const canDelete = confirmationText.trim().toUpperCase() === "DELETE";

  // Layout from the design prototype (Delete account): warning card, confirmation field, two buttons
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <AuthTopBar title={t("deleteAccount.title")} />

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.warning}>
              <View style={styles.warningEdge} />
              <View style={styles.warningHead}>
                <Feather name="alert-triangle" size={20} color={Theme.colors.danger} />
                <Text style={styles.warningTitle}>{t("deleteAccount.undoneTitle")}</Text>
              </View>
              <Text style={styles.warningText}>{t("deleteAccount.undoneText")}</Text>
            </View>

            <Text style={styles.label}>{t("deleteAccount.typeToConfirm")}</Text>
            <TextInput
              style={styles.input}
              value={confirmationText}
              onChangeText={setConfirmationText}
              placeholder="DELETE"
              placeholderTextColor={Theme.colors.placeholder}
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel={t("deleteAccount.typeToConfirm")}
            />

            <TouchableOpacity
              style={[styles.deleteButton, !canDelete && styles.deleteButtonOff]}
              onPress={handleDeleteAccount}
              disabled={!canDelete || isDeleting}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canDelete || isDeleting }}
            >
              {isDeleting ? (
                <ActivityIndicator color={Theme.colors.surface} size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>{t("deleteAccount.button")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>{t("deleteAccount.cancel")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default DeleteAccount;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: Theme.spacing.xl,
  },
  // White card with a red edge on the left. The edge is its own view: a thick left border with a
  // rounded corner blends into the hairline border and looks lilac.
  warning: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    paddingLeft: Theme.spacing.md + 4,
    overflow: "hidden",
    ...Theme.shadows.card,
  },
  warningEdge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: Theme.colors.danger,
  },
  warningHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  warningTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 16,
    color: Theme.colors.ink,
  },
  warningText: {
    fontFamily: Theme.typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: Theme.colors.inkSoft,
  },
  label: {
    marginTop: Theme.spacing.lg,
    marginBottom: 8,
    fontFamily: Theme.typography.heading,
    fontSize: 14,
    color: Theme.colors.inkSoft,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
    fontFamily: Theme.typography.body,
    fontSize: 16,
    color: Theme.colors.ink,
  },
  deleteButton: {
    minHeight: 54,
    marginTop: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonOff: { opacity: 0.55 },
  deleteButtonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 16,
    color: Theme.colors.surface,
  },
  cancelButton: {
    minHeight: 54,
    marginTop: 12,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.purple,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 16,
    color: Theme.colors.purple,
  },
});
