import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Circle, G, Path, Rect } from "react-native-svg";
import { useDispatch, useSelector } from "react-redux";
import { router } from "expo-router";
import { removeToken } from "@/store/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import LineIcon from "@/components/profile/LineIcon";
import ProfilePhoto, {
  usePickProfileImage,
} from "@/components/profile/ProfilePhoto";
import { PremiumBadge } from "@/components/premium/PremiumUI";
import { usePremiumStore } from "@/zustandStore/premiumStore";
import { DEV_TOOLS_VISIBLE, useDemoMode } from "@/utils/demo/demoMode";
import { GUIDE } from "@/constants/conciergeGuide";

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
  summary: (
    <>
      <Path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <Path d="M14 3.5V8h4" />
    </>
  ),
  // Person with a pencil: "edit your avatar"
  avatar: (
    <>
      <Circle cx="9" cy="8" r="3.3" />
      <Path d="M3 20a6 6 0 0 1 8.3-5.5" />
      <G transform="translate(11 11) scale(0.5)">
        <Path strokeWidth={4} d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </G>
    </>
  ),
  fame: (
    <Path d="M12 3.5l2.4 5 5.6.6-4.1 3.8 1.1 5.5L12 15.7l-5 2.7 1.1-5.5-4.1-3.8 5.6-.6Z" />
  ),
  premium: (
    <Path d="M12 2.5l2.2 6.8L21 11.5l-6.8 2.2L12 20.5l-2.2-6.8L3 11.5l6.8-2.2z" />
  ),
  documents: (
    <>
      <Path d="M14 3H7.5A1.5 1.5 0 0 0 6 4.5v15A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V7z" />
      <Path d="M14 3v4h4M9 12.5h6M9 16h6" />
    </>
  ),
  clinic: (
    <>
      <Rect x="5" y="3.5" width="14" height="17" rx="2" />
      <Path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 20.5v-3h4v3" />
    </>
  ),
  security: (
    <>
      <Path d="M12 3.5l7 2.5v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
      <Path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  devices: (
    <>
      <Rect x="7" y="7" width="10" height="10" rx="3" />
      <Path d="M9 7l.7-3.5h4.6L15 7M9 17l.7 3.5h4.6L15 17" />
      <Path d="M12 10v2.2l1.5 1" />
    </>
  ),
  // Translate symbol: an "A" box in front of a "文" box, with an arrow each way. Thinner stroke than the
  // other icons because it carries more detail in the same 17px.
  language: (
    <G strokeWidth={1.5}>
      <Rect x="2" y="2" width="10.5" height="10.5" rx="2.4" />
      <Path d="M4.9 10 7.25 4.8 9.6 10M5.8 8.2h2.9" />
      <Path d="M12.5 11.5H19.6a2.4 2.4 0 0 1 2.4 2.4V19.6a2.4 2.4 0 0 1-2.4 2.4H13.9a2.4 2.4 0 0 1-2.4-2.4V12.5" />
      <Path d="M16.75 13.4v1M14.6 14.6h4.3M15.1 14.6c.4 2.1 1.6 3.4 3.3 4.2M18.4 14.6c-.5 2.2-1.7 3.5-3.3 4.1" />
      <Path d="M21.5 8.2c0-2.1-1.1-3.4-3.2-3.4h-.9M18.8 3.3l-1.5 1.5 1.5 1.5" />
      <G transform="rotate(180 12 12)">
        <Path d="M21.5 8.2c0-2.1-1.1-3.4-3.2-3.4h-.9M18.8 3.3l-1.5 1.5 1.5 1.5" />
      </G>
    </G>
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
  developer: (
    <>
      <Path d="M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5" />
      <Path d="M13.2 5.5 10.8 18.5" />
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
  default: { bg: Theme.colors.surfaceSunken, fg: Theme.colors.purple },
  sos: { bg: Theme.colors.sosTint, fg: Theme.colors.magenta },
  danger: { bg: Theme.colors.dangerTint, fg: Theme.colors.danger },
};

const MenuRow = ({
  icon,
  title,
  subtitle,
  tone = "default",
  isLast,
  trailing,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  tone?: RowTone;
  isLast?: boolean;
  trailing?: React.ReactNode; // shown before the chevron (e.g. a status pill)
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
            tone === "danger" && { color: Theme.colors.danger },
          ]}
        >
          {title}
        </Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {trailing}
      <LineIcon size={16} color={Theme.colors.ink}>
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
  const { t } = useTranslation();
  // Original section hints ("Name, Age, Email"), built from the same keys in every language
  const hint = (...keys: string[]) => keys.map((key) => t(`profile.${key}`)).join(", ");
  const premiumStatus = usePremiumStore((state) => state.status);
  const demoMode = useDemoMode((state) => state.enabled);

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

  // Picks made on the Account screen land in Redux
  useEffect(() => {
    if (user?.user_photo) setPhoto(user.user_photo);
  }, [user?.user_photo]);

  const pickProfileImage = usePickProfileImage();
  const pickImage = async () => {
    const uri = await pickProfileImage();
    if (uri) setPhoto(uri);
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
    <ScreenBackground>
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} overScrollMode="always">
        <View style={styles.content}>
          <View style={styles.header}>
            <ProfilePhoto uri={photo} onPress={pickImage} />
            <Text style={styles.name}>{name}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <Text style={styles.sectionTitle}>{t("profile.account")}</Text>
          <View style={styles.card}>
            <MenuRow
              icon="emergency"
              tone="sos"
              title={t("profile.emergency")}
              subtitle={t("profile.emergencyDescription")}
              onPress={() => Linking.openURL("tel:911")}
            />
            <MenuRow
              icon="account"
              title={t("profile.account")}
              subtitle={hint("name", "age", "email")}
              onPress={() => router.push("/patient/profile-setting/name")}
            />
            <MenuRow
              icon="premium"
              title={t("premium.title")}
              trailing={<PremiumBadge status={premiumStatus} />}
              onPress={() => router.push("/patient/profile-setting/premium")}
            />
            <MenuRow
              icon="pregnancy"
              title={t("profile.yourpregnancy")}
              subtitle={hint("weekofpregnancy", "progresstracking")}
              onPress={() => router.push("/patient/profile-setting/pregrancy")}
            />
            <MenuRow
              icon="summary"
              title={t("pregnancySummary.title")}
              onPress={() => router.push("/patient/pregnancy-summary")}
            />
            <MenuRow
              icon="documents"
              title={t("documents.title")}
              subtitle={t("documents.profileHint")}
              onPress={() => router.push("/patient/documents")}
            />
            <MenuRow
              icon="avatar"
              title={GUIDE.name} // fixed: renaming the Concierge does not rename this section
              subtitle={hint("name", "hair", "dress", "skintone")}
              onPress={() => router.push("/avatar-studio")}
            />
            <MenuRow
              icon="clinic"
              title={t("clinic.yourClinics")}
              subtitle={t("clinic.profileHint")}
              onPress={() => router.push("/patient/clinics")}
            />
            <MenuRow
              icon="fame"
              title={t("profile.halloffame")}
              subtitle={hint("earnbadge", "rewards")}
              isLast
              onPress={() => router.push("/patient/profile-setting/earnbadge")}
            />
          </View>

          <Text style={styles.sectionTitle}>{t("profile.preferences")}</Text>
          <View style={styles.card}>
            <MenuRow
              icon="devices"
              title={t("devices.title")}
              subtitle={t("devices.profileHint")}
              onPress={() => router.push("/patient/devices")}
            />
            <MenuRow
              icon="security"
              title={t("security.title")}
              subtitle={t("security.profileHint")}
              onPress={() => router.push("/patient/security")}
            />
            <MenuRow
              icon="language"
              title={t("profile.language")}
              subtitle={t("profile.changedoulalanguage")}
              onPress={() => router.push("/patient/profile-setting/language")}
            />
            <MenuRow
              icon="notifications"
              title={t("profile.notifications")}
              subtitle={hint("messages", "alerts")}
              isLast
              onPress={() =>
                router.push("/patient/profile-setting/notification")
              }
            />
          </View>

          <Text style={styles.sectionTitle}>{t("profile.support")}</Text>
          <View style={styles.card}>
            <MenuRow
              icon="help"
              title={t("profile.help")}
              subtitle={hint("helpcenter", "support", "contactus")}
              onPress={() => router.push("/patient/profile-setting/help")}
            />
            <MenuRow
              icon="terms"
              title={t("profile.tnc")}
              subtitle={hint("privacy", "Termsofuse")}
              onPress={() => router.push("/patient/profile-setting/tnc")}
            />
            <MenuRow
              icon="citations"
              title={t("profile.sourcesCitations")}
              isLast
              onPress={() => router.push("/patient/profile-setting/citations")}
            />
          </View>

          {DEV_TOOLS_VISIBLE && (
            <>
              <Text style={styles.sectionTitle}>{t("developer.title")}</Text>
              <View style={styles.card}>
                <MenuRow
                  icon="developer"
                  title={t("developer.simulatedData")}
                  subtitle={demoMode ? t("developer.on") : t("developer.off")}
                  isLast
                  onPress={() => router.push("/developer")}
                />
              </View>
            </>
          )}

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
    </ScreenBackground>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  name: {
    fontFamily: Theme.typography.heading,
    fontSize: 16,
    color: Theme.colors.ink,
    marginTop: 10,
  },
  subtitle: {
    fontFamily: Theme.typography.body,
    fontSize: 12,
    color: Theme.colors.inkFaint,
  },
  sectionTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
    marginTop: 2,
    marginBottom: -6,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 14,
    ...Theme.shadows.card,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
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
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.body,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
    marginTop: 1,
  },
});
