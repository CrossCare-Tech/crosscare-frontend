import React, { FC, useLayoutEffect, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Provider, useDispatch } from "react-redux";
import { setToken, setUser } from "@/store/userSlice";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { SafeAreaView } from "react-native-safe-area-context";
import { CONFIG } from "@/constants/config";
import { store } from "../store/store";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { useAuthDialog } from "@/components/ui/AuthDialog";
import InlineNotice, { Notice } from "@/components/ui/InlineNotice";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// Logo oficial com o coração 3D e "CROSSCARE TECH" em ameixa
const officialLogo = require("@/assets/logo/logo-full.png");

const LoginContent: FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { dialog, show } = useAuthDialog();
  const [notice, setNotice] = useState<Notice>(null);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleLogin = async () => {
    const newError: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newError.email = "Email is required.";
    }

    if (!password) {
      newError.password = "Password is required.";
    }

    if (Object.keys(newError).length > 0) {
      setEmailError(newError.email || "");
      setPasswordError(newError.password || "");
      setLoading(false);
      return;
    }

    setNotice(null);
    setLoading(true);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresVerification) {
          show({
            title: "Email Verification Required",
            message: "Please verify your email address before logging in.",
            variant: "info",
            buttons: [
              {
                text: "Verify Now",
                onPress: () =>
                  router.push({
                    pathname: "/verify-email",
                    params: { email: data.email || email },
                  }),
              },
              { text: "Cancel", style: "cancel" },
            ],
          });
          setLoading(false);
          return;
        }

        const apiError: any = new Error(data.message || "Login failed");
        apiError.status = response.status;
        apiError.isCredentialError = [400, 401, 404].includes(response.status);
        throw apiError;
      }

      if (data) {
        dispatch(
          setUser({
            user_id: data.userId || data.patientId,
            user_email: data.email,
            user_name: data.name,
            user_photo: data.profilePicture || "",
            token: data.accessToken,
          })
        );

        dispatch(setToken(data.accessToken));
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            user_id: data.userId || data.patientId,
            user_email: data.email,
            user_name: data.name,
            user_photo: data.profilePicture || "",
            token: data.accessToken,
          })
        );

        await AsyncStorage.setItem("userToken", data.accessToken);
        router.replace("/patient/(tabs)/home");
      }

      setLoading(false);
    } catch (error: any) {
      if (error?.isCredentialError) {
        // Shown on the fields themselves, no popup.
        if (error.status === 404) {
          setEmailError("No account found with this email.");
        } else if (error.status === 401) {
          setPasswordError("Incorrect password.");
        } else {
          setEmailError("Invalid email or password");
          setPasswordError("Invalid email or password");
        }
      } else if (error instanceof TypeError) {
        setNotice({
          variant: "error",
          message: "We couldn't reach the server. Check your connection and try again.",
        });
      } else {
        setNotice({
          variant: "error",
          message: error?.message || "Something went wrong. Please try again.",
        });
      }
      setLoading(false);
    }
  };

  const handleChangeEmail = (text: string) => {
    setEmail(text);
    if (notice) setNotice(null);
    if (emailError) {
      setEmailError("");
    }
  };

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (notice) setNotice(null);
    if (passwordError) {
      setPasswordError("");
    }
  };

  const handleBiometricAuth = () => {
    setNotice({
      variant: "info",
      message:
        "Face ID / Biometric login will be enabled once your device is registered with your account.",
    });
  };

  const handleSocialAuth = (provider: "Apple" | "Google") => {
    setNotice({
      variant: "info",
      message: `${provider} authentication will connect to your clinical profile.`,
    });
  };

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header com Logo Oficial */}
          <View style={styles.header}>
            <Image
              source={officialLogo}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your care journey with your concierge.
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <CustomTextInput
              label="Email"
              icon="mail"
              type="email"
              value={email}
              onChangeText={handleChangeEmail}
              placeholder="maya.reyes@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              errorMessage={emailError}
            />

            <View style={styles.passwordContainer}>
              <CustomTextInput
                label="Password"
                icon="lock"
                type="password"
                value={password}
                onChangeText={handleChangePassword}
                placeholder="Enter your password"
                secureTextEntry={true}
                errorMessage={passwordError}
              />
              <TouchableOpacity
                onPress={() => router.push("/forget-password")}
                style={styles.forgotPasswordButton}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <InlineNotice notice={notice} />

            {/* Botão Principal Log in */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Log in</Text>
              )}
            </TouchableOpacity>

            {/* Face ID / Biometria */}
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
              accessibilityRole="button"
              accessibilityLabel="Use Face ID instead"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="fingerprint"
                size={18}
                color={Theme.colors.inkFaint}
              />
              <Text style={styles.biometricText}>Use Face ID instead</Text>
            </TouchableOpacity>

            {/* Divisor "or continue with" */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botões Sociais */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialAuth("Apple")}
                accessibilityRole="button"
                accessibilityLabel="Continue with Apple"
                activeOpacity={0.8}
              >
                <Ionicons name="logo-apple" size={18} color={Theme.colors.ink} />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialAuth("Google")}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                activeOpacity={0.8}
              >
                <FontAwesome5 name="google" size={16} color={Theme.colors.ink} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
            </View>

            {/* Cadastro */}
            <View style={styles.signupRow}>
              <Text style={styles.signupPrompt}>New here? </Text>
              <TouchableOpacity onPress={() => router.push("/signup")}>
                <Text style={styles.signupLink}>Create account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Disclaimer e Rodapé Clínico */}
          <View style={styles.footer}>
            <Pressable
              onPress={() =>
                Linking.openURL("https://crosscaretech.com/privacy-policy")
              }
            >
              <Text style={styles.disclaimerText}>
                DISCLAIMER: CrossCare Concierge is an AI-powered pregnancy guide
                and does not replace professional medical advice, diagnosis, or
                treatment.
              </Text>
              <Text style={styles.legalLinks}>
                Terms & Conditions • Privacy Policy • Contact Us
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {dialog}
    </SafeAreaView>
    </ScreenBackground>
  );
};

const Login: FC = () => {
  return (
    <Provider store={store}>
      <LoginContent />
    </Provider>
  );
};

export default Login;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
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
    width: 210,
    height: 70,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
  form: {
    width: "100%",
    gap: 16,
  },
  passwordContainer: {
    width: "100%",
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    paddingVertical: 2,
  },
  forgotPasswordText: {
    fontSize: 13.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.magenta,
  },
  loginButton: {
    backgroundColor: Theme.colors.magenta,
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    ...Theme.shadows.card,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: Theme.typography.heading,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 6,
    marginTop: 2,
  },
  biometricText: {
    fontSize: 13,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.inkFaint,
    letterSpacing: -0.1,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.hairline,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 11.5,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.inkFaint,
    textTransform: "lowercase",
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  socialButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1.5,
    borderColor: Theme.colors.socialBorder,
    borderRadius: Theme.borderRadius.sm,
  },
  socialButtonText: {
    fontSize: 14,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  signupPrompt: {
    fontSize: 13.5,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
  },
  signupLink: {
    fontSize: 13.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.magenta,
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 8,
  },
  disclaimerText: {
    textAlign: "center",
    fontFamily: Theme.typography.caption,
    fontSize: 11,
    color: Theme.colors.inkFaint,
    lineHeight: 16,
    marginBottom: 6,
  },
  legalLinks: {
    textAlign: "center",
    fontFamily: Theme.typography.caption,
    fontSize: 11,
    color: Theme.colors.inkSoft,
  },
});