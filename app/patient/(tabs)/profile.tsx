import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Linking,
  StatusBar,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import { useDispatch, useSelector } from "react-redux";
import { router } from "expo-router";
import { removeToken, setUser } from "@/store/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";

// Prototype "Original" palette (lp-cross.vercel.app)
const C = {
  bg: "#F8F9FA",
  surface: "#FFFFFF",
  sunken: "#F1EFF1",
  hairline: "#E7E1E3",
  ink: "#191C1D",
  inkFaint: "#9C8890",
  magenta: "#B3006B",
  purple: "#5028A7",
  sosTint: "#FDE7F0",
  danger: "#B3261E",
  dangerTint: "#FBE9E7",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Español",
  ht: "Kreyòl Ayisyen",
  pt: "Português",
};

const LineIcon = ({
  size = 17,
  color,
  strokeWidth = 2,
  children,
}: {
  size?: number;
  color: string;
  strokeWidth?: number;
  children: React.ReactNode;
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Svg>
);

const ICONS: Record<string, React.ReactNode> = {
  account: (
    <>
      <Circle cx="12" cy="8.2" r="3.4" />
      <Path d="M4.8 19.5a7.2 7.2 0 0 1 14.4 0" />
    </>
  ),
  pregnancy: (
    <Path d="M12 20.5s-7.5-4.6-9.7-9.4C.9 7.6 3 4 6.5 4c2 0 3.5 1.1 4.5 2.6C12 5.1 13.5 4 15.5 4 19 4 21.1 7.6 19.7 11.1 17.5 15.9 12 20.5 12 20.5Z" />
  ),
  avatar: (
    <>
      <Rect x="4" y="4" width="7" height="7" rx="1.5" />
      <Rect x="13" y="4" width="7" height="7" rx="1.5" />
      <Rect x="4" y="13" width="7" height="7" rx="1.5" />
      <Rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  fame: (
    <Path d="M12 3.5l2.4 5 5.6.6-4.1 3.8 1.1 5.5L12 15.7l-5 2.7 1.1-5.5-4.1-3.8 5.6-.6Z" />
  ),
  language: (
    <>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M12 11v5.5M12 8v.1" />
    </>
  ),
  notifications: (
    <>
      <Path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <Path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  emergency: (
    <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  ),
  help: (
    <>
      <Path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <Path d="M14 3.5V8h4" />
    </>
  ),
  terms: (
    <>
      <Path d="M12 3.5 5 6v6c0 4.5 3 7.5 7 8.5 4-1 7-4 7-8.5V6l-7-2.5Z" />
      <Path d="M9 12l2 2 4-4.2" />
    </>
  ),
  citations: (
    <>
      <Path d="M6 4v6a4 4 0 0 0 8 0V4M6 4H4.5M14 4h1.5" />
      <Circle cx="18.5" cy="16" r="2.2" />
      <Path d="M10 14v1a4.5 4.5 0 0 0 6.5 4" />
    </>
  ),
  logout: (
    <>
      <Path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <Path d="M10 16l-4-4 4-4M6 12h10" />
    </>
  ),
  delete: (
    <>
      <Path d="M12 4 3 20h18Z" />
      <Path d="M12 10v4M12 17.2v.1" />
    </>
  ),
};

type RowTone = "default" | "sos" | "danger";

const CHIP_TONES: Record<RowTone, { bg: string; fg: string }> = {
  default: { bg: C.sunken, fg: C.purple },
  sos: { bg: C.sosTint, fg: C.magenta },
  danger: { bg: C.dangerTint, fg: C.danger },
};

const MenuRow = ({
  icon,
  title,
  subtitle,
  tone = "default",
  isLast,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  tone?: RowTone;
  isLast?: boolean;
  onPress: () => void;
}) => {
  const chip = CHIP_TONES[tone];
  return (
    <TouchableOpacity
      style={[styles.menuRow, isLast && styles.menuRowLast]}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
    >
      <View style={[styles.iconChip, { backgroundColor: chip.bg }]}>
        <LineIcon color={chip.fg}>{ICONS[icon]}</LineIcon>
      </View>
      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowTitle,
            tone === "danger" && { color: C.danger },
          ]}
        >
          {title}
        </Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <LineIcon size={16} color={C.ink}>
        <Path d="M9 6l6 6-6 6" />
      </LineIcon>
    </TouchableOpacity>
  );
};

const Profile = () => {
  const user = useSelector((state: any) => state.user);
  const token = useSelector((state: any) => state.user.token);
  const [name, setName] = useState(user?.user_name);
  const [pregnancyWeek, setPregnancyWeek] = useState(0);
  const [photo, setPhoto] = useState<string>(user?.user_photo || "");
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const isFocused = useIsFocused();

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
      setName(data.name || "");
      setPregnancyWeek(data.week || 0);
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
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to change your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) return;

      const selectedImage = result.assets[0];
      setPhoto(selectedImage.uri);

      const formData = new FormData();
      formData.append("imageUrl", {
        uri: selectedImage.uri,
        type: "image/jpeg",
        name: "profile-image.jpg",
      } as any);

      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/${user?.user_id}/profile/image`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      dispatch(setUser({ ...user, user_photo: selectedImage.uri }));
    } catch (error) {
      console.error("Error updating profile image:", error);
    }
  };

  const logout = async () => {
    Alert.alert(
      t("profile.confirmLogout"),
      t("profile.logoutMessage"),
      [
        {
          text: t("profile.no"),
          style: "cancel",
        },
        {
          text: t("profile.logoutSuccess"),
          onPress: async () => {
            await AsyncStorage.clear();
            dispatch(removeToken());
            router.replace("/login");
          },
        },
      ],
      { cancelable: false }
    );
  };

  const subtitle = pregnancyWeek
    ? t("profile.weekLabel", { week: pregnancyWeek })
    : user?.user_email;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Mounted only while focused so it wins over the other tabs' StatusBar */}
      {isFocused && (
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      )}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.8}
              accessibilityLabel="Edit photo"
            >
              <LinearGradient
                colors={["#F6D3E4", "#D9CCF3"]}
                start={{ x: 0.25, y: 0.07 }}
                end={{ x: 0.75, y: 0.93 }}
                style={styles.photo}
              >
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                ) : (
                  <Svg width="100%" height="100%" viewBox="0 0 56 56">
                    <Circle cx="28" cy="22" r="9.5" fill="#fff" opacity={0.88} />
                    <Path
                      d="M8 56c0-13 8-19 20-19s20 6 20 19z"
                      fill="#fff"
                      opacity={0.88}
                    />
                  </Svg>
                )}
              </LinearGradient>
              <View style={styles.editBadge}>
                <LineIcon size={14} color="#fff" strokeWidth={2.4}>
                  <Path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1z" />
                </LineIcon>
              </View>
            </TouchableOpacity>
            <Text style={styles.name}>{name}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <Text style={styles.sectionTitle}>{t("profile.account")}</Text>
          <View style={styles.card}>
            <MenuRow
              icon="account"
              title={t("profile.accountDetails")}
              onPress={() => router.push("/patient/profile-setting/name")}
            />
            <MenuRow
              icon="pregnancy"
              title={t("profile.yourpregnancy")}
              onPress={() => router.push("/patient/profile-setting/pregrancy")}
            />
            <MenuRow
              icon="avatar"
              title={t("profile.avatar")}
              onPress={() => router.push("/avatar")}
            />
            <MenuRow
              icon="fame"
              title={t("profile.halloffame")}
              isLast
              onPress={() => router.push("/patient/profile-setting/earnbadge")}
            />
          </View>

          <Text style={styles.sectionTitle}>{t("profile.preferences")}</Text>
          <View style={styles.card}>
            <MenuRow
              icon="language"
              title={t("profile.language")}
              subtitle={LANGUAGE_NAMES[i18n.language] || LANGUAGE_NAMES.en}
              onPress={() => router.push("/patient/profile-setting/language")}
            />
            <MenuRow
              icon="notifications"
              title={t("profile.notifications")}
              onPress={() =>
                router.push("/patient/profile-setting/notification")
              }
            />
            <MenuRow
              icon="emergency"
              tone="sos"
              title={t("profile.emergency")}
              subtitle={t("profile.emergencyDescription")}
              isLast
              onPress={() => Linking.openURL("tel:911")}
            />
          </View>

          <Text style={styles.sectionTitle}>{t("profile.support")}</Text>
          <View style={styles.card}>
            <MenuRow
              icon="help"
              title={t("profile.helpcenter")}
              onPress={() => router.push("/patient/profile-setting/help")}
            />
            <MenuRow
              icon="terms"
              title={t("profile.tnc")}
              onPress={() =>
                Linking.openURL("https://crosscaretech.com/privacy-policy")
              }
            />
            <MenuRow
              icon="citations"
              title={t("profile.sourcesCitations")}
              isLast
              onPress={() => router.push("/patient/profile-setting/citations")}
            />
          </View>

          <View style={styles.card}>
            <MenuRow
              icon="logout"
              title={t("profile.logoutLabel")}
              onPress={logout}
            />
            <MenuRow
              icon="delete"
              tone="danger"
              title={t("profile.deleteaccount")}
              isLast
              onPress={() =>
                router.push("/patient/profile-setting/delete-account")
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 18,
  },
  header: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 4,
  },
  photo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.magenta,
    borderWidth: 2,
    borderColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: "Manrope700",
    fontSize: 16,
    color: C.ink,
    marginTop: 10,
  },
  subtitle: {
    fontFamily: "Manrope400",
    fontSize: 12,
    color: C.inkFaint,
  },
  sectionTitle: {
    fontFamily: "Manrope700",
    fontSize: 11.5,
    color: C.inkFaint,
    marginTop: 2,
    marginBottom: -6,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 14,
    shadowColor: "#190A19",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: "Manrope700",
    fontSize: 13.5,
    color: C.ink,
  },
  rowSub: {
    fontFamily: "Manrope400",
    fontSize: 11.5,
    color: C.inkFaint,
    marginTop: 1,
  },
});
