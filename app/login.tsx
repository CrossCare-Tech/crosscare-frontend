import React, {
  FC,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Pressable,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Provider, useDispatch } from "react-redux";
import { setToken, setUser } from "@/store/userSlice";
import LogoSvg from "@/assets/images/Svg/LogoSvg";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { width } from "@/constants/helper";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { CONFIG } from "@/constants/config";
import appLogo from "@/assets/images/Svg/appLogo.png";
import { store } from "../store/store";

const height = Dimensions.get("window").height;

const LoginContent: FC = memo(() => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigation = useNavigation();
  const router = useRouter();
  const dispatch = useDispatch();
  const loginInProgress = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const validateInput = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!email) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    return errors;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (loginInProgress.current) return;

    setEmailError("");
    setPasswordError("");

    const errors = validateInput();
    if (Object.keys(errors).length > 0) {
      setEmailError(errors.email || "");
      setPasswordError(errors.password || "");
      return;
    }

    try {
      loginInProgress.current = true;
      setLoading(true);

      const response = await fetch(`${CONFIG.API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresVerification) {
          Alert.alert(
            "Email Verification Required",
            "Please verify your email address before logging in.",
            [
              {
                text: "Verify Now",
                onPress: () =>
                  router.push({
                    pathname: "/verify-email",
                    params: { email: data.email || email },
                  }),
              },
              { text: "Cancel", style: "cancel" },
            ]
          );
          return;
        }
        throw new Error(data.message || "Login failed");
      }

      const userPayload = {
        user_id: data.userId || data.patientId,
        user_email: data.email,
        user_name: data.name,
        user_photo: data.profilePicture || "",
        token: data.accessToken,
      };

      dispatch(setUser(userPayload));
      dispatch(setToken(data.accessToken));

      try {
        await AsyncStorage.setItem("user", JSON.stringify(userPayload));
        await AsyncStorage.setItem("userToken", data.accessToken);
      } catch (storageErr) {
        console.warn("AsyncStorage Error:", storageErr);
      }

      router.replace("/patient/(tabs)/home");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
      setEmailError("Invalid email or password");
      setPasswordError("Invalid email or password");
    } finally {
      setLoading(false);
      loginInProgress.current = false;
    }
  }, [email, password, router, dispatch, validateInput]);

  const handleChangeEmail = useCallback((text: string) => {
    setEmail(text);
    if (emailError) setEmailError("");
  }, [emailError]);

  const handleChangePassword = useCallback((text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError("");
  }, [passwordError]);

  const footerText = useMemo(
    () =>
      "Terms & Conditions | Privacy Policy | Contact Us",
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ justifyContent: "center", marginTop: 40 }}>
          <View style={{ alignItems: "center" }}>
            <Image
              source={appLogo}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Welcome, Get Started!</Text>
          <View style={{ width: "100%", marginTop: 56, gap: 20 }}>
            <CustomTextInput
              icon="user"
              type="email"
              value={email}
              onChangeText={handleChangeEmail}
              placeholder="Email"
              errorMessage={emailError}
            />
            <CustomTextInput
              icon="lock"
              type="password"
              value={password}
              onChangeText={handleChangePassword}
              placeholder="Password"
              secureTextEntry={true}
              errorMessage={passwordError}
            />
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.5 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#EF99D9", "#E35ABB"]}
                start={{
                  x: Math.cos((117 * Math.PI) / 180),
                  y: Math.sin((117 * Math.PI) / 180),
                }}
                end={{
                  x: Math.cos(((117 + 180) * Math.PI) / 180),
                  y: Math.sin(((117 + 180) * Math.PI) / 180),
                }}
                style={styles.gradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Log In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("/forget-password")}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "column", gap: 12, marginTop: 12 }}>
            <Text style={styles.signup}>
              New patient?{' '}
              <Text
                style={styles.signupLink}
                onPress={() => router.push("/signup")}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </View>

        <Pressable onPress={() => Linking.openURL("https://crosscaretech.com/privacy-policy")}>
          <Text style={styles.footerText}>{footerText}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});

const Login: FC = () => (
  <Provider store={store}>
    <LoginContent />
  </Provider>
);

export default Login;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    fontFamily: "DMSans500",
    color: "#545454",
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#87247D",
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
  footerText: {
    textAlign: "center",
    fontFamily: "DMSans400",
    fontSize: 12,
    color: "#545454",
    paddingBottom: 20,
  },
  forgot: {
    fontSize: 14,
    width: "100%",
    textAlign: "left",
    color: "#E05FA0",
    fontFamily: "DMSans400",
    marginTop: 17,
    textDecorationLine: "underline",
  },
  signup: {
    fontSize: 14,
    color: "#545454",
    fontFamily: "DMSans400",
    textAlign: "center",
    marginTop: 8,
  },
  signupLink: {
    fontFamily: "DMSans500",
    color: "#E05FA0",
    textDecorationLine: "underline",
  },
});