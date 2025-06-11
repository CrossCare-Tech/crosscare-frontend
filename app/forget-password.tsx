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
} from "react-native";
import React, { FC, useLayoutEffect, useState } from "react";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { fontSize } from "@/constants/helper";
import { Colors } from "@/constants/Colors";
import { useNavigation, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LogoSvg from "@/assets/images/Svg/LogoSvg";
import { LinearGradient } from "expo-linear-gradient";

const ForgetScreen: FC = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email entry, 2: OTP verification

  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/forgot-password`,
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
        throw new Error(data.message || "Failed to send OTP");
      }

      Alert.alert("Success", "OTP sent to your email");
      setStep(2);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp, newPassword }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      Alert.alert("Success", "Password reset successfully", [
        { text: "OK", onPress: () => router.push("/login") }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
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
          
          <Text style={styles.title}>
            {step === 1 
              ? "Forgot Password" 
              : "Reset Password"
            }
          </Text>
          
          <View style={styles.formContainer}>
            {step === 1 ? (
              <>
                <Text style={styles.subtitle}>
                  Enter your email address and we'll send you a verification code
                </Text>
                <CustomTextInput
                  placeholder="Email"
                  icon="mail"
                  value={email}
                  onChangeText={setEmail}
                  type="email"
                />
              </>
            ) : (
              <>
                <Text style={styles.subtitle}>
                  Enter the verification code sent to {email}
                </Text>
                <CustomTextInput
                  type="number"
                  placeholder="Verification Code"
                  icon="key"
                  value={otp}
                  onChangeText={setOtp}
                />
                
                <CustomTextInput
                  type="password"
                  placeholder="New Password"
                  icon="lock"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                
                <CustomTextInput
                  type="password"
                  placeholder="Confirm Password"
                  icon="lock"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </>
            )}
            
            <TouchableOpacity
              style={styles.button}
              onPress={step === 1 ? handleSendOTP : handleResetPassword}
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
                  <Text style={styles.buttonText}>
                    {step === 1 ? "Send Code" : "Reset Password"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push("/login")}
            style={styles.loginLinkContainer}
          >
            <Text style={styles.loginText}>
              Back to{" "}
              <Text style={styles.loginLink}>
                Login
              </Text>
            </Text>
          </TouchableOpacity>
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
    marginBottom: 20,
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
  loginLinkContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#545454",
    fontFamily: "DMSans400",
    textAlign: "center",
  },
  loginLink: {
    fontFamily: "DMSans500",
    color: "#E05FA0",
    textDecorationLine: "underline",
  },
  footerText: {
    textAlign: "center",
    fontFamily: "DMSans400",
    fontSize: 12,
    color: "#545454",
    paddingBottom: 20,
  },
});

export default ForgetScreen;