import React, { FC, useLayoutEffect, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  Linking,
  ScrollView,
} from "react-native";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import AuthTopBar from "@/components/ui/AuthTopBar";
import AuthSuccess from "@/components/ui/AuthSuccess";
import { useAuthDialog } from "@/components/ui/AuthDialog";
import InlineNotice, { Notice } from "@/components/ui/InlineNotice";
import OtpInput from "@/components/ui/OtpInput";

const officialLogo = require("@/assets/logo/logo-full.png");

const maskEmail = (value: string) => {
  const [local, domain] = value.split("@");
  if (!domain || local.length < 2) return value;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

const formatCountdown = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

const VerifyEmail: FC = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigation = useNavigation();
  const router = useRouter();
  const { dialog, show } = useAuthDialog();
  const [notice, setNotice] = useState<Notice>(null);
  const params = useLocalSearchParams();
  const email = (params.email as string) || "";

  const [otpError, setOtpError] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setOtpError("Please enter the verification code");
      return;
    }

    if (otp.length !== 6) {
      setOtpError("Verification code must be 6 digits");
      return;
    }

    setNotice(null);
    setLoading(true);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setVerified(true);
    } catch (error: any) {
      if (/otp/i.test(error.message || "")) {
        // Wrong or expired code: the red boxes and the message below are enough.
        setOtpError(error.message);
      } else {
        setNotice({
          variant: "error",
          message: error.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setNotice({
        variant: "error",
        message: "Missing email address for resending code.",
      });
      return;
    }

    setNotice(null);
    setResendLoading(true);

    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend code");
      }

      show({
        title: "Code Resent",
        message: "A new verification code has been sent to your email.",
        variant: "success",
      });
      setCountdown(60);
      setOtp("");
      setOtpError("");
    } catch (error: any) {
      setNotice({
        variant: "error",
        message: error.message || "Could not resend code",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleChangeOTP = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(numericText);
    if (otpError) {
      setOtpError("");
    }
  };

  if (verified) {
    return (
      <AuthSuccess
        title="Email verified"
        message="Your email has been verified. You can now log in."
        buttonLabel="Log in"
        onPress={() => router.replace("/login")}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AuthTopBar
          title="Verify email"
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header com Logo */}
          <View style={styles.header}>
            <Image
              source={officialLogo}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={styles.emailHighlight}>
                {email ? maskEmail(email) : "your email"}
              </Text>
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <OtpInput
              value={otp}
              onChangeText={handleChangeOTP}
              hasError={!!otpError}
            />
            {otpError ? <Text style={styles.otpError}>{otpError}</Text> : null}

            <InlineNotice notice={notice} />

            {/* Botão de Verificação */}
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyOTP}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>

            {/* Reenvio */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendPrompt}>Didn&apos;t receive the code? </Text>
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={countdown > 0 || resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator size="small" color={Theme.colors.magenta} />
                ) : (
                  <Text
                    style={[
                      styles.resendLink,
                      countdown > 0 && styles.resendLinkDisabled,
                    ]}
                  >
                    {countdown > 0 ? `Resend code in ${formatCountdown(countdown)}` : "Resend code"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              onPress={() =>
                Linking.openURL("https://crosscaretech.com/privacy-policy")
              }
            >
              <Text style={styles.footerText}>
                Terms & Conditions • Privacy Policy • Contact Us
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {dialog}
    </SafeAreaView>
  );
};

export default VerifyEmail;

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
    alignItems: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  logo: {
    width: 200,
    height: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
    textAlign: "center",
    lineHeight: 20,
  },
  emailHighlight: {
    fontFamily: Theme.typography.heading,
    color: Theme.colors.magenta,
  },
  form: {
    width: "100%",
    gap: 18,
  },
  verifyButton: {
    backgroundColor: Theme.colors.magenta,
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    ...Theme.shadows.card,
  },
  verifyButtonText: {
    fontSize: 16,
    fontFamily: Theme.typography.heading,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  otpError: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: Theme.typography.body,
    color: Theme.colors.danger,
    marginTop: -6,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  resendPrompt: {
    fontSize: 13.5,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
  },
  resendLink: {
    fontSize: 13.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.magenta,
  },
  resendLinkDisabled: {
    color: Theme.colors.inkFaint,
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
});
