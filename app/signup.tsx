import React, { FC, useLayoutEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  View,
  ScrollView,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { useAuthDialog } from "@/components/ui/AuthDialog";
import InlineNotice, { Notice } from "@/components/ui/InlineNotice";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { useTranslation } from "react-i18next";

const SignUp: FC = () => {
  const { t, i18n } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const router = useRouter();
  const { dialog, show } = useAuthDialog();
  const [notice, setNotice] = useState<Notice>(null);

  // Estados de erro
  const [emailError, setEmailError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [dobError, setDobError] = useState("");
  const [termsError, setTermsError] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Opens on a plausible birth year instead of today.
  const pickerDate = dateOfBirth ?? new Date(new Date().getFullYear() - 28, 0, 1);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "ios") {
      if (selectedDate) {
        setDateOfBirth(selectedDate);
        if (dobError) {
          setDobError("");
        }
      }
    } else {
      setShowDatePicker(false);
      if (event?.type === "set" && selectedDate) {
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
    return date.toLocaleDateString(i18n.language === "ht" ? "fr" : i18n.language, {
      year: "numeric",
      month: "short",
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
    let isValid = true;

    if (!firstName.trim()) {
      setFirstNameError(t("authFlow.signup.firstNameRequired"));
      isValid = false;
    }
    if (!lastName.trim()) {
      setLastNameError(t("authFlow.signup.lastNameRequired"));
      isValid = false;
    }
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailError(t("authFlow.signup.invalidEmail"));
      isValid = false;
    }
    // Same rules as the team's app: the phone is optional (international format), the password needs 6 characters
    if (phoneNumber.trim() && !/^[+]?[1-9][\d]{0,15}$/.test(phoneNumber.replace(/\s/g, ""))) {
      setPhoneNumberError(t("authFlow.signup.invalidPhone"));
      isValid = false;
    }
    if (!password || password.length < 6) {
      setPasswordError(t("authFlow.common.passwordRule"));
      isValid = false;
    }
    if (!agreedToTerms) {
      setTermsError(t("authFlow.signup.mustAgree"));
      isValid = false;
    } else {
      setTermsError("");
    }

    if (!dateOfBirth) {
      setDobError(t("authFlow.signup.dobRequired"));
      isValid = false;
    } else if (validateAge(dateOfBirth) < 13) {
      setDobError(t("authFlow.signup.tooYoung"));
      isValid = false;
    }

    if (!isValid) return;

    setNotice(null);
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
          email: email.toLowerCase().trim(),
          phoneNumber: phoneNumber.trim() || null,
          password: password,
          dateOfBirth: dateOfBirth!.toISOString().split("T")[0],
          role: "patient",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("authFlow.signup.failed"));
      }

      show({
        title: t("authFlow.signup.sentTitle"),
        message: t("authFlow.signup.sentMessage"),
        variant: "success",
        buttons: [
          {
            text: t("authFlow.common.verifyNow"),
            onPress: () =>
              router.push({
                pathname: "/verify-email",
                params: { email: email.toLowerCase().trim() },
              }),
          },
        ],
      });
    } catch (error: any) {
      const message = error.message || t("authFlow.common.somethingWrong");
      if (/email/i.test(message)) {
        setEmailError(message);
      } else {
        setNotice({ variant: "error", message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeFirstName = (text: string) => {
    setFirstName(text);
    if (firstNameError) setFirstNameError("");
  };

  const handleChangeLastName = (text: string) => {
    setLastName(text);
    if (lastNameError) setLastNameError("");
  };

  const handleChangeEmail = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError("");
  };

  const handleChangePhoneNumber = (text: string) => {
    setPhoneNumber(text);
    if (phoneNumberError) setPhoneNumberError("");
  };

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError("");
  };

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AuthTopBar
          title={t("authFlow.signup.title")}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t("authFlow.signup.heading")}</Text>
            <Text style={styles.subtitle}>{t("authFlow.signup.subtitle")}</Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            {/* Nome e Sobrenome lado a lado */}
            <View style={styles.row}>
              <View style={styles.flexHalf}>
                <CustomTextInput
                  label={t("authFlow.signup.firstName")}
                  type="username"
                  value={firstName}
                  onChangeText={handleChangeFirstName}
                  placeholder="Maya"
                  errorMessage={firstNameError}
                />
              </View>
              <View style={styles.flexHalf}>
                <CustomTextInput
                  label={t("authFlow.signup.lastName")}
                  type="username"
                  value={lastName}
                  onChangeText={handleChangeLastName}
                  placeholder="Reyes"
                  errorMessage={lastNameError}
                />
              </View>
            </View>

            {/* Data de Nascimento */}
            <View style={styles.datePickerContainer}>
              <Text style={styles.fieldLabel}>{t("authFlow.signup.dob")}</Text>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  dobError ? styles.dateInputError : null,
                ]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Feather
                  name="calendar"
                  size={18}
                  color={dobError ? Theme.colors.danger : Theme.colors.inkFaint}
                  style={styles.dateIcon}
                />
                <Text
                  style={[styles.dateText, !dateOfBirth && styles.datePlaceholder]}
                >
                  {dateOfBirth ? formatDate(dateOfBirth) : t("authFlow.signup.selectDate")}
                </Text>
                <Feather name="chevron-down" size={16} color={Theme.colors.inkFaint} />
              </TouchableOpacity>
              {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}
            </View>

            {/* Email */}
            <CustomTextInput
              label={t("authFlow.common.email")}
              icon="mail"
              type="email"
              value={email}
              isValid={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
              onChangeText={handleChangeEmail}
              placeholder="maya.reyes@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              errorMessage={emailError}
            />

            {/* Telefone */}
            <CustomTextInput
              label={t("authFlow.signup.phone")}
              icon="phone"
              type="phone"
              value={phoneNumber}
              onChangeText={handleChangePhoneNumber}
              placeholder="+1 (555) 019-2834"
              keyboardType="phone-pad"
              errorMessage={phoneNumberError}
            />

            {/* Senha */}
            <View>
              <CustomTextInput
                label={t("authFlow.common.password")}
                icon="lock"
                type="password"
                value={password}
                onChangeText={handleChangePassword}
                placeholder="••••••••"
                secureTextEntry={true}
                errorMessage={passwordError}
              />
              <Text style={styles.helperText}>
                {t("authFlow.signup.passwordHelper")}
              </Text>
            </View>

            {/* Checkbox de Termos */}
            <TouchableOpacity
              style={styles.checkboxRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreedToTerms }}
              onPress={() => {
                setAgreedToTerms(!agreedToTerms);
                if (termsError) setTermsError("");
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkboxBox,
                  agreedToTerms && styles.checkboxBoxChecked,
                  termsError ? styles.checkboxBoxError : null,
                ]}
              >
                {agreedToTerms && (
                  <Feather name="check" size={14} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxText}>
                {t("authFlow.signup.agreePrefix")}{" "}
                <Text
                  style={styles.linkText}
                  onPress={() =>
                    Linking.openURL("https://crosscaretech.com/terms")
                  }
                >
                  {t("authFlow.signup.termsOfService")}
                </Text>{" "}
                {t("authFlow.signup.and")}{" "}
                <Text
                  style={styles.linkText}
                  onPress={() =>
                    Linking.openURL("https://crosscaretech.com/privacy-policy")
                  }
                >
                  {t("authFlow.common.privacy")}
                </Text>
                .
              </Text>
            </TouchableOpacity>
            {termsError ? (
              <Text style={styles.errorText}>{termsError}</Text>
            ) : null}

            <InlineNotice notice={notice} />

            {/* Botão Create account */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>{t("authFlow.signup.createAccount")}</Text>
              )}
            </TouchableOpacity>

            {/* Link Log in */}
            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>{t("authFlow.signup.already")}</Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.loginLink}>{t("authFlow.common.logIn")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal de DatePicker no iOS */}
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
                    <Text style={styles.modalCancelButton}>{t("authFlow.common.cancel")}</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>{t("authFlow.signup.modalTitle")}</Text>
                  <TouchableOpacity onPress={handleDatePickerConfirm}>
                    <Text style={styles.modalDoneButton}>{t("authFlow.common.done")}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={pickerDate}
                  textColor={Theme.colors.ink}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              </View>
            </View>
          </Modal>
        ) : (
          showDatePicker && (
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )
        )}
      </KeyboardAvoidingView>
      {dialog}
    </SafeAreaView>
    </ScreenBackground>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flexHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
    marginBottom: 7,
    letterSpacing: -0.1,
  },
  datePickerContainer: {
    width: "100%",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1.5,
    borderColor: Theme.colors.inputBorder,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 16,
    height: 52,
  },
  dateInputError: {
    borderColor: Theme.colors.danger,
  },
  dateIcon: {
    marginRight: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: Theme.colors.ink,
    fontFamily: Theme.typography.body,
  },
  datePlaceholder: {
    color: Theme.colors.placeholder,
  },
  errorText: {
    color: Theme.colors.danger,
    fontSize: 12,
    marginTop: 4,
    fontFamily: Theme.typography.body,
    paddingHorizontal: 2,
  },
  helperText: {
    fontSize: 11.5,
    fontFamily: Theme.typography.caption,
    color: Theme.colors.inkFaint,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.6,
    borderColor: Theme.colors.purple,
    backgroundColor: Theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: Theme.colors.purple,
    borderColor: Theme.colors.purple,
  },
  checkboxBoxError: {
    borderColor: Theme.colors.danger,
  },
  checkboxText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
    lineHeight: 18,
  },
  linkText: {
    color: Theme.colors.purple,
    fontFamily: Theme.typography.subheading,
  },
  createButton: {
    backgroundColor: Theme.colors.magenta,
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    ...Theme.shadows.card,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: Theme.typography.heading,
    color: "#FFFFFF",
    letterSpacing: 0.2,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(25, 28, 29, 0.4)",
  },
  modalContainerIOS: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  modalCancelButton: {
    fontSize: 15,
    color: Theme.colors.inkSoft,
    fontFamily: Theme.typography.subheading,
  },
  modalDoneButton: {
    fontSize: 15,
    color: Theme.colors.magenta,
    fontFamily: Theme.typography.heading,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
});
