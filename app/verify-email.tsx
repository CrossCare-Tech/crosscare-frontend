import React, { FC, useLayoutEffect, useState, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LogoSvg from "@/assets/images/Svg/LogoSvg";
import { LinearGradient } from "expo-linear-gradient";
import CustomTextInput from "@/components/ui/CustomTextInput";

const VerifyEmail: FC = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;

  const [otpError, setOtpError] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Countdown timer for resend button
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

    setLoading(true);

    try {
      const response = await fetch(
        `http://10.0.2.2:8000/api/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            otp: otp.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      Alert.alert(
        "Success!",
        "Your email has been verified successfully. You can now login.",
        [
          {
            text: "Login",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message);
      if (error.message.includes("OTP")) {
        setOtpError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

    try {
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend code");
      }

      Alert.alert("Success", "New verification code sent to your email");
      setCountdown(60); // 60 second countdown
      setOtp(""); // Clear current OTP
      setOtpError("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleChangeOTP = (text: string) => {
    // Only allow numbers and limit to 6 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(numericText);
    if (otpError) {
      setOtpError("");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <LogoSvg />
          </View>
          
          <Text style={styles.title}>Verify Your Email</Text>
          
          <Text style={styles.subtitle}>
            We've sent a 6-digit verification code to{"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
          
          <View style={styles.formContainer}>
            <CustomTextInput
              type="number"
              placeholder="Enter 6-digit code"
              icon="key"
              value={otp}
              onChangeText={handleChangeOTP}
              errorMessage={otpError}
              maxLength={6}
              keyboardType="numeric"
            />
            
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              <LinearGradient
                colors={["#EF99D9", "#E35ABB"]}
                start={{ x: Math.cos((117 * Math.PI) / 180), y: Math.sin((117 * Math.PI) / 180) }}
                end={{ x: Math.cos(((117 + 180) * Math.PI) / 180), y: Math.sin(((117 + 180) * Math.PI) / 180) }}
                style={styles.gradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity 
              onPress={handleResendOTP}
              disabled={countdown > 0 || resendLoading}
              style={styles.resendButton}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color="#E05FA0" />
              ) : (
                <Text style={[
                  styles.resendLink,
                  (countdown > 0) && styles.disabledLink
                ]}>
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.footerText}>
          Terms & Conditions | Privacy Policy | Contact Us
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1, 
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 40,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flex: 1,
    justifyContent: "center",
    marginTop: 40,
  },
  logoContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    fontFamily: "DMSans500",
    color: "#545454",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "DMSans400",
    color: "#8A8A8A",
    marginTop: 20,
    lineHeight: 20,
  },
  emailText: {
    fontFamily: "DMSans500",
    color: "#E05FA0",
  },
  formContainer: {
    width: "100%",
    marginTop: 40,
    flexDirection: "column",
    gap: 20,
  },
  button: {
    backgroundColor: "#87247D",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 20,
    color: "#fff",
    letterSpacing: 0.2,
    fontFamily: "DMSans600",
  },
  resendContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: "#8A8A8A",
    fontFamily: "DMSans400",
    textAlign: "center",
  },
  resendButton: {
    marginTop: 8,
  },
  resendLink: {
    fontFamily: "DMSans500",
    color: "#E05FA0",
    textDecorationLine: "underline",
    fontSize: 14,
  },
  disabledLink: {
    color: "#CCCCCC",
    textDecorationLine: "none",
  },
  footerText: {
    textAlign: "center",
    fontFamily: "DMSans400",
    fontSize: 12,
    color: "#545454",
    paddingBottom: 20,
  },
});

export default VerifyEmail; 