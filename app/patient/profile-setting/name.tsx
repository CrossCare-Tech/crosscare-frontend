import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import DateTimePicker from "@react-native-community/datetimepicker";
import { setUser } from "@/store/userSlice";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import CustomTextInput from "@/components/ui/CustomTextInput";
import ProfilePhoto, {
  usePickProfileImage,
} from "@/components/profile/ProfilePhoto";

type AccountForm = {
  name: string;
  email: string;
  phoneNumber: string;
};

const EMPTY_FORM: AccountForm = { name: "", email: "", phoneNumber: "" };

const Account = () => {
  const user = useSelector((state: any) => state.user);
  const token = useSelector((state: any) => state.user.token);
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const pickProfileImage = usePickProfileImage();

  const [photo, setPhoto] = useState<string>(user?.user_photo || "");
  const [saved, setSaved] = useState<AccountForm>(EMPTY_FORM);
  const [form, setForm] = useState<AccountForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const setField = (key: keyof AccountForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const getProfile = async () => {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/${user?.user_id}/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      const loaded: AccountForm = {
        name: data.name || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
      };
      setSaved(loaded);
      setForm(loaded);
      if (data.profileImage) setPhoto(data.profileImage);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      getProfile();
    }
  }, [user?.user_id]);

  const pickImage = async () => {
    const uri = await pickProfileImage();
    if (uri) setPhoto(uri);
  };

  // Only send fields that actually changed
  const changes = (Object.keys(form) as (keyof AccountForm)[]).filter(
    (key) => form[key].trim() !== saved[key]
  );

  const saveChanges = async () => {
    const email = form.email.trim();
    if (changes.includes("email") && !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert(t("profile.error"), t("profile.invalidEmail"));
      return;
    }

    const updateData: Record<string, string> = {};
    for (const key of changes) {
      const value = form[key].trim();
      if (key !== "name" || value) updateData[key] = value;
    }

    if (Object.keys(updateData).length === 0) return;

    setSaving(true);
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/${user.user_id}/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || t("profile.saveError"));
      }

      dispatch(
        setUser({
          ...user,
          user_name: (updateData.name as string) ?? user.user_name,
          user_email: (updateData.email as string) ?? user.user_email,
        })
      );
      router.back();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert(t("profile.error"), error?.message || t("profile.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const canSave = changes.length > 0 && !saving;

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthTopBar title={t("profile.account")} />
          <View style={styles.content}>
            <View style={styles.photoBlock}>
              <ProfilePhoto uri={photo} onPress={pickImage} />
              <TouchableOpacity onPress={pickImage}>
                <Text style={styles.changePhoto}>
                  {t("profile.changePhoto")}
                </Text>
              </TouchableOpacity>
            </View>

            <CustomTextInput
              label={t("profile.fullName")}
              value={form.name}
              onChangeText={setField("name")}
              placeholder={t("profile.fullName")}
              autoCapitalize="words"
              textContentType="name"
            />
            <CustomTextInput
              label={t("profile.email")}
              type="email"
              value={form.email}
              onChangeText={setField("email")}
              placeholder="name@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />
            <CustomTextInput
              label={t("profile.phone")}
              type="phone"
              value={form.phoneNumber}
              onChangeText={setField("phoneNumber")}
              placeholder="(555) 214-0087"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
            />
            {/* Visual only: the backend has no date-of-birth field yet, so this is not saved */}
            <View style={styles.field}>
              <Text style={styles.label}>{t("profile.dateOfBirth")}</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.inputText,
                    !dateOfBirth && { color: Theme.colors.placeholder },
                  ]}
                >
                  {dateOfBirth
                    ? dateOfBirth.toLocaleDateString(i18n.language, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : t("profile.selectDate")}
                </Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth || new Date(1995, 0, 1)}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setDateOfBirth(date);
                }}
              />
            )}

            <TouchableOpacity
              style={[styles.button, !canSave && styles.buttonDisabled]}
              onPress={saveChanges}
              disabled={!canSave}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color={Theme.colors.surface} />
              ) : (
                <Text style={styles.buttonText}>
                  {t("profile.saveChanges")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ScreenBackground>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 18,
  },
  photoBlock: {
    alignItems: "center",
  },
  changePhoto: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.magenta,
    marginTop: 8,
  },
  field: {
    gap: 7,
  },
  label: {
    fontFamily: Theme.typography.heading,
    fontSize: 12.5,
    color: Theme.colors.inkSoft,
  },
  input: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Theme.colors.inputBorder,
    backgroundColor: Theme.colors.inputBg,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  inputText: {
    fontFamily: Theme.typography.body,
    fontSize: 15,
    // Match the inner padding Android adds to CustomTextInput's TextInput
    paddingHorizontal: 4,
    color: Theme.colors.ink,
  },
  button: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.surface,
  },
});
