import React, { FC, useLayoutEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  View,
  StatusBar,
  ScrollView,
  Dimensions,
} from "react-native";
import { supabase } from "@/supabase/supabase";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { makeRedirectUri } from "expo-auth-session";
import { fontSize, height, width } from "@/constants/helper";
import CustomTextInput from "@/components/ui/CustomTextInput";
import LogoSvg from "@/assets/images/Svg/LogoSvg";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const screenHeight = Dimensions.get("window").height;

const SignUp: FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("patient");
  const navigation = useNavigation();
  const router = useRouter();
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const redirectTo = makeRedirectUri();

  // Error states
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [dobError, setDobError] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const openEmail = () => {
    Linking.openURL("mailto:");
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      if (dobError) {
        setDobError("");
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const validateAge = (birthDate: Date) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleSignUp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newError: any = {};

    // Validation
    if (!firstName.trim()) {
      newError.firstName = "First name is required.";
    }

    if (!lastName.trim()) {
      newError.lastName = "Last name is required.";
    }

    const age = validateAge(dateOfBirth);
    if (age < 13) {
      newError.dob = "You must be at least 13 years old to sign up.";
    }

    if (!email) {
      newError.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      newError.email = "Invalid email format.";
    }

    if (!password) {
      newError.password = "Password is required.";
    } else if (password.length < 6) {
      newError.password = "Password must be at least 6 characters long.";
    }

    if (Object.keys(newError).length > 0) {
      setFirstNameError(newError.firstName || "");
      setLastNameError(newError.lastName || "");
      setDobError(newError.dob || "");
      setEmailError(newError.email || "");
      setPasswordError(newError.password || "");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            dateOfBirth: dateOfBirth.toISOString(),
            email: email.toLowerCase().trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // Navigate to email verification screen
      router.push({
        pathname: "/verify-email",
        params: { email: email.toLowerCase().trim() }
      });

    } catch (error: any) {
      Alert.alert("Signup Failed", error.message);
      console.log(JSON.stringify(error, null, 2));
      if (error.message.includes("email")) {
        setEmailError("Email already exists or is invalid");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeFirstName = (text: string) => {
    setFirstName(text);
    if (firstNameError) {
      setFirstNameError("");
    }
  };

  const handleChangeLastName = (text: string) => {
    setLastName(text);
    if (lastNameError) {
      setLastNameError("");
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
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: "#fff",
    }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <LogoSvg />
            </View>
            <Text style={styles.title}>Create Your Account</Text>
            
            <View style={styles.formContainer}>
              {/* First Name */}
              <CustomTextInput
                icon="user"
                type="username"
                value={firstName}
                onChangeText={handleChangeFirstName}
                placeholder="First Name"
                errorMessage={firstNameError}
              />

              {/* Last Name */}
              <CustomTextInput
                icon="user"
                type="username"
                value={lastName}
                onChangeText={handleChangeLastName}
                placeholder="Last Name"
                errorMessage={lastNameError}
              />

              {/* Date of Birth */}
              <View style={styles.inputContainer}>
                <TouchableOpacity 
                  style={[styles.dateInput, dobError ? styles.errorInput : null]} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <FontAwesome5 name="calendar" size={16} color="#777" style={styles.dateIcon} />
                  <Text style={[styles.dateText, !dateOfBirth && styles.placeholderText]}>
                    {formatDate(dateOfBirth)}
                  </Text>
                  <FontAwesome5 name="chevron-down" size={14} color="#777" />
                </TouchableOpacity>
                {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}
              </View>

              {/* Email */}
              <CustomTextInput
                icon="envelope"
                type="email"
                value={email}
                onChangeText={handleChangeEmail}
                placeholder="Email Address"
                errorMessage={emailError}
              />

              {/* Password */}
              <CustomTextInput
                icon="lock"
                type="password"
                value={password}
                onChangeText={handleChangePassword}
                placeholder="Password"
                secureTextEntry={true}
                errorMessage={passwordError}
              />

              {/* Signup Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleSignUp}
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
                    <Text style={styles.buttonText}>Sign Up</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text
                  style={styles.loginLink}
                  onPress={() => router.push("/login")}
                >
                  Login
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Footer */}
        <Text style={styles.footerText}>
          Terms & Conditions | Privacy Policy | Contact Us
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 40,
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
  formContainer: {
    width: "100%",
    marginTop: 40,
    flexDirection: "column",
    gap: 20,
  },
  inputContainer: {
    marginBottom: 0,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  errorInput: {
    borderColor: '#FF6B6B',
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontFamily: "DMSans400",
  },
  placeholderText: {
    color: "#999",
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 5,
    fontFamily: "DMSans400",
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
    marginTop: 10,
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
    marginTop: 20,
  },
});

export default SignUp;