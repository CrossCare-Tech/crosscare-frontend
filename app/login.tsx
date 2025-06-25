import React, { FC, useLayoutEffect, useState } from "react";
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
  Switch,
  Dimensions,
  Image
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

// Separate component that uses Redux hooks
const LoginContent: FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const router = useRouter();
  const dispatch = useDispatch();
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleLogin = async () => {
    const newError: any = {};

    if (!email) {
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
      console.log("API Response:", data);

      if (!response.ok) {
        // Check if email verification is required
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
              {
                text: "Cancel",
                style: "cancel",
              },
            ]
          );
          setLoading(false);
          return;
        }

        throw new Error(data.message || "Login failed");
      }

      if (data) {
        console.log("Dispatching User Data to Redux:", data);
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
      Alert.alert("Login Failed", error.message);
      setEmailError("Invalid email or password");
      setPasswordError("Invalid email or password");
      setLoading(false);
    }
  };

  const handleChangeEmail = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError("");
    }
  };

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError("");
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{
            justifyContent: "center",
            marginTop: 40,
          }}
        >
          <View
            style={{
              alignItems: "center",
            }}
          >
            <Image source={appLogo} style={{ width: 100, height: 100 }} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Welcome, Get Started!</Text>
          <View
            style={{
              width: "100%",
              marginTop: 56,
              flexDirection: "column",
              gap: 20,
            }}
          >
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
              style={styles.button}
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
            <Text
              style={{
                fontSize: 14,
                width: "100%",
                textAlign: "left",
                color: "#E05FA0",
                fontFamily: "DMSans400",
                marginTop: 17,
                textDecorationLine: "underline",
              }}
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>
          <View
            style={{
              flexDirection: "column",
              gap: 12,
              marginTop: 12,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: "#545454",
                fontFamily: "DMSans400",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              New patient?{" "}
              <Text
                style={{
                  fontFamily: "DMSans500",
                  color: "#E05FA0",
                  textDecorationLine: "underline",
                }}
                onPress={() => router.push("/signup")}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </View>
        <Text style={styles.footerText}>
          Terms & Conditions | Privacy Policy | Contact Us
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Main component that wraps Redux Provider
const Login: FC = () => {
  return (
    <Provider store={store}>
      <LoginContent />
    </Provider>
  );
};

export default Login;

const styles = StyleSheet.create({
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
  subtitle: {
    color: "#555",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
    color: "#333",
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  googleButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 15,
  },
  googleButtonText: {
    fontSize: 18,
    color: "black",
    fontWeight: "bold",
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
  link: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: "48%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  selectedRole: {
    backgroundColor: "#4CAF50",
  },
  roleText: {
    fontSize: 16,
    color: "#4CAF50",
    textAlign: "center",
  },
  selectedRoleText: {
    color: "#fff",
  },
});