import React, { FC, useLayoutEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { useNavigation, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import AuthTopBar from "@/components/ui/AuthTopBar";
import OtpInput from "@/components/ui/OtpInput";

const ForgetScreen: FC = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email entry, 2: OTP verification & new password

  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset code");
      }

      setStep(2);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setOtpError("");
    setPasswordError("");

    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      Alert.alert("Success", "Your password has been reset successfully.", [
        { text: "Log in", onPress: () => router.push("/login") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AuthTopBar
          title={step === 1 ? "Forgot password" : "Reset password"}
          onBack={step === 2 ? () => setStep(1) : undefined}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 1 ? "Reset your password" : "Enter verification code"}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? "Enter your email address and we'll send you a secure verification code to reset your password."
                : `We sent a 6-digit verification code to ${email}.`}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {step === 2 && (
              <View style={styles.confirmCard}>
                <View style={styles.confirmChip}>
                  <Feather name="check" size={17} color={Theme.colors.success} />
                </View>
                <View style={styles.confirmBody}>
                  <Text style={styles.confirmTitle}>Check your email</Text>
                  <Text style={styles.confirmText}>
                    We sent a reset code. It can take a minute to arrive, so be
                    sure to check spam.
                  </Text>
                </View>
              </View>
            )}

            {step === 1 ? (
              <CustomTextInput
                label="Email"
                placeholder="maya.reyes@email.com"
                icon="mail"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError("");
                }}
                errorMessage={emailError}
                type="email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <>
                <View style={styles.otpGroup}>
                  <Text style={styles.otpLabel}>Verification code</Text>
                  <OtpInput
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text);
                      if (otpError) setOtpError("");
                    }}
                    hasError={!!otpError}
                  />
                  {otpError ? <Text style={styles.fieldError}>{otpError}</Text> : null}
                </View>

                <CustomTextInput
                  label="New password"
                  type="password"
                  placeholder="••••••••"
                  icon="lock"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <CustomTextInput
                  label="Confirm new password"
                  type="password"
                  placeholder="••••••••"
                  icon="lock"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (passwordError) setPasswordError("");
                  }}
                  errorMessage={passwordError}
                  secureTextEntry
                />
              </>
            )}

            {/* Botão de Ação */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={step === 1 ? handleSendOTP : handleResetPassword}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>
                  {step === 1 ? "Send reset code" : "Reset password"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Voltar para login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              <Text
                style={styles.legalLink}
                onPress={() =>
                  Linking.openURL("https://crosscaretech.com/privacy-policy")
                }
              >
                Terms & Conditions
              </Text>{" "}
              •{" "}
              <Text
                style={styles.legalLink}
                onPress={() =>
                  Linking.openURL("https://crosscaretech.com/privacy-policy")
                }
              >
                Privacy Policy
              </Text>{" "}
              • Contact Us
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgetScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.bg,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
  },
  header: {
    marginTop: 8,
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
    lineHeight: 20,
  },
  form: {
    width: "100%",
    gap: 16,
  },
  actionButton: {
    backgroundColor: Theme.colors.magenta,
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    ...Theme.shadows.card,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: Theme.typography.heading,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  fieldError: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: Theme.typography.body,
    color: Theme.colors.danger,
  },
  otpGroup: {
    gap: 10,
  },
  otpLabel: {
    fontSize: 12.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
  },
  confirmCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xl,
    paddingVertical: 18,
    paddingHorizontal: 20,
    ...Theme.shadows.card,
  },
  confirmChip: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Theme.colors.successTint,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBody: {
    flex: 1,
  },
  confirmTitle: {
    fontSize: 13,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
    marginBottom: 3,
  },
  confirmText: {
    fontSize: 12,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
    lineHeight: 19,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  loginPrompt: {
    fontSize: 13.5,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
  },
  loginLink: {
    fontSize: 13.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.magenta,
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    textAlign: "center",
    fontFamily: Theme.typography.caption,
    fontSize: 11,
    color: Theme.colors.inkFaint,
  },
  legalLink: {
    color: Theme.colors.inkSoft,
  },
});
