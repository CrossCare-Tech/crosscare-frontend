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
  Image,
  Pressable,
  Modal
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
import { FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CONFIG } from "@/constants/config";
import appLogo from "@/assets/images/Svg/appLogo.png"

const screenHeight = Dimensions.get("window").height;

const SignUp: FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("patient");
  const navigation = useNavigation();
  const router = useRouter();
  const [emailError, setEmailError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
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
    if (Platform.OS === "ios") {
      // For iOS, we keep the modal open until user confirms
      if (selectedDate) {
        setDateOfBirth(selectedDate);
        if (dobError) {
          setDobError("");
        }
      }
    } else {
      // For Android, close the picker immediately
      setShowDatePicker(false);
      if (selectedDate) {
        setDateOfBirth(selectedDate);
        if (dobError) {
          setDobError("");
        }
      }
    }
  };

  const handleDatePickerConfirm = () => {
    setShowDatePicker(false);
  };

  const handleDatePickerCancel = () => {
    setShowDatePicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const validateAge = (birthDate: Date) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      return age - 1;
    }
    return age;
  };

  const handleSignUp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/; // Basic international phone number regex
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

    if (phoneNumber && !phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
      newError.phoneNumber = "Invalid phone number format.";
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
      setPhoneNumberError(newError.phoneNumber || "");
      setPasswordError(newError.password || "");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dateOfBirth.toISOString(),
          email: email.toLowerCase().trim(),
          phoneNumber: phoneNumber.trim() || null,
          password: password,
        }),
      });

      const data = await response.json();
      console.log("This is the signup data", data);
      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // Navigate to email verification screen
      router.push({
        pathname: "/verify-email",
        params: { email: email.toLowerCase().trim() },
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

  const handleChangePhoneNumber = (text: string) => {
    setPhoneNumber(text);
    if (phoneNumberError) {
      setPhoneNumberError("");
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
      }}
    >
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
              <Image source={appLogo} style={{ width: 100, height: 100 }} resizeMode="contain" />
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
                  style={[
                    styles.dateInput,
                    dobError ? styles.errorInput : null,
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <FontAwesome5
                    name="calendar"
                    size={16}
                    color="#777"
                    style={styles.dateIcon}
                  />
                  <Text
                    style={[
                      styles.dateText,
                      !dateOfBirth && styles.placeholderText,
                    ]}
                  >
                    {formatDate(dateOfBirth)}
                  </Text>
                  <FontAwesome5 name="chevron-down" size={14} color="#777" />
                </TouchableOpacity>
                {dobError ? (
                  <Text style={styles.errorText}>{dobError}</Text>
                ) : null}
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

              {/* Phone Number */}
              <CustomTextInput
                icon="phone"
                type="phone"
                value={phoneNumber}
                onChangeText={handleChangePhoneNumber}
                placeholder="Phone Number"
                errorMessage={phoneNumberError}
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
        {Platform.OS === "ios" ? (
          <Modal
            animationType="slide"
            transparent={true}
            visible={showDatePicker}
            onRequestClose={handleDatePickerCancel}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainerIOS}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={handleDatePickerCancel}>
                    <Text style={styles.modalButton}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Select Date of Birth</Text>
                  <TouchableOpacity onPress={handleDatePickerConfirm}>
                    <Text style={styles.modalButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerWrapper}>
                  <DateTimePicker
                    value={dateOfBirth}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    style={styles.datePicker}
                  />
                </View>
              </View>
            </View>
          </Modal>
        ) : (
          showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )
        )}

        {/* Footer */}
        <Pressable onPress={() => Linking.openURL("https://crosscaretech.com/privacy-policy")}>
          <Text style={styles.footerText}>
            Terms & Conditions | Privacy Policy | Contact Us
          </Text>
        </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#fff",
  },
  errorInput: {
    borderColor: "#FF6B6B",
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
    color: "#FF6B6B",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainerIOS: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    minHeight: 350,
    padding: 0,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 18,
    marginBottom: 0,
  },
  modalButton: {
    fontSize: 16,
    color: "#E05FA0",
    fontFamily: "DMSans500",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "DMSans500",
    color: "#545454",
  },
  pickerWrapper: {
    backgroundColor: "#fff", // FIXED: Changed from "black" to "#fff"
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 20,
    width: "100%",
    height: 250, // FIXED: Changed from minHeight to fixed height
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  datePicker: {
    width: "100%",
    height: 200, // FIXED: Changed from minHeight to fixed height
    backgroundColor: "#fff", // FIXED: Ensured consistent white background
  },
});

export default SignUp;
