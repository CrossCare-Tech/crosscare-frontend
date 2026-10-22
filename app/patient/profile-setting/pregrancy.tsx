import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Path } from "react-native-svg";
import { useSelector } from "react-redux";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";
import { fruitForWeek } from "@/constants/babySize";
import { Theme } from "@/constants/theme";
import LineIcon from "@/components/profile/LineIcon";
import AuthTopBar from "@/components/ui/AuthTopBar";
import ScreenBackground from "@/components/ui/ScreenBackground";

const DAY_MS = 24 * 60 * 60 * 1000;

const TRIMESTERS = [
  { key: "firstTrimester", from: 1, to: 13 },
  { key: "secondTrimester", from: 14, to: 27 },
  { key: "thirdTrimester", from: 28, to: 40 },
];

// How much of the timeline rail is filled for each current trimester
const RAIL_FILL = [0.15, 0.6, 1];

const trimesterIndex = (week: number) => (week >= 28 ? 2 : week >= 14 ? 1 : 0);

type Appointment = { id: string; title: string; date: string };

// Show at most this many appointment titles per trimester, then "+N"
const MAX_EVENTS = 2;

const StatChip = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.statChip}>
    <Text style={styles.statValue} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

type Stage = "done" | "now" | "next";

const TimelineDot = ({ stage }: { stage: Stage }) => {
  if (stage === "now") {
    return (
      <View style={styles.dotRing}>
        <View style={[styles.dot, styles.dotNow]} />
      </View>
    );
  }
  return (
    <View style={[styles.dot, stage === "done" ? styles.dotDone : styles.dotNext]} />
  );
};

const YourPregnancy = () => {
  const user = useSelector((state: any) => state.user);
  const token = useSelector((state: any) => state.user.token);
  const { t, i18n } = useTranslation();

  const [week, setWeek] = useState(0);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [lmp, setLmp] = useState<Date | null>(null);
  const [editing, setEditing] = useState(false);
  const [weekInput, setWeekInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

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
      setWeek(data.week || 0);

      const pregnancy = data.pregnancyData;
      if (pregnancy?.dueDate) setDueDate(new Date(pregnancy.dueDate));
      // Last menstrual period = today minus the days of pregnancy so far
      if (pregnancy?.totalDays !== undefined) {
        setLmp(new Date(Date.now() - pregnancy.totalDays * DAY_MS));
      }
    } catch (error) {
      console.error("Error fetching pregnancy data:", error);
    }
  };

  const getAppointments = async () => {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/activity/${user?.user_id}/appointments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      getProfile();
      getAppointments();
    }
  }, [user?.user_id]);

  // Group the user's appointments by the trimester they fall in, using the LMP
  const eventsByTrimester: string[][] = TRIMESTERS.map(() => []);
  if (lmp) {
    for (const appointment of appointments) {
      const days = (new Date(appointment.date).getTime() - lmp.getTime()) / DAY_MS;
      if (days < 0) continue;
      eventsByTrimester[trimesterIndex(Math.floor(days / 7))].push(
        appointment.title
      );
    }
  }

  const describeTrimester = (index: number) => {
    const { from, to } = TRIMESTERS[index];
    const range = t("profile.weeksRange", { from, to });
    const events = eventsByTrimester[index];
    if (events.length === 0) return range;
    const shown = events.slice(0, MAX_EVENTS).join(", ");
    const extra = events.length > MAX_EVENTS ? ` +${events.length - MAX_EVENTS}` : "";
    return `${range} · ${shown}${extra}`;
  };

  const openEdit = () => {
    setWeekInput(week ? String(week) : "");
    setEditing(true);
  };

  const saveWeek = async () => {
    const newWeek = Number.parseInt(weekInput, 10);
    if (Number.isNaN(newWeek) || newWeek < 1 || newWeek > 42) {
      Alert.alert(t("profile.error"), t("profile.weekRangeError"));
      return;
    }

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
          body: JSON.stringify({ week: newWeek }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || t("profile.saveError"));
      }

      setEditing(false);
      getProfile();
    } catch (error: any) {
      console.error("Error updating pregnancy week:", error);
      Alert.alert(t("profile.error"), error?.message || t("profile.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) =>
    date.toLocaleDateString(i18n.language, options);

  const current = trimesterIndex(week);
  const fruit = fruitForWeek(week);

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AuthTopBar
          title={t("profile.yourpregnancy")}
          action={{ label: t("profile.edit"), onPress: openEdit }}
        />
        <View style={styles.content}>
          <LinearGradient
            colors={[Theme.colors.magentaTint, Theme.colors.purpleTint]}
            start={{ x: 0.25, y: 0.07 }}
            end={{ x: 0.75, y: 0.93 }}
            style={styles.hero}
          >
            <Text style={styles.heroLabel}>
              {t("profile.estimatedDueDate")}
            </Text>
            <Text style={styles.heroDate}>
              {dueDate
                ? formatDate(dueDate, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </Text>
            <View style={styles.statRow}>
              <StatChip value={String(week)} label={t("profile.weeksShort")} />
              <StatChip
                value={t(`profile.trimester${current + 1}`)}
                label={t("profile.trimesterShort")}
              />
              <StatChip
                value={
                  lmp ? formatDate(lmp, { month: "short", day: "numeric" }) : "—"
                }
                label={t("profile.lmpShort")}
              />
            </View>
          </LinearGradient>

          <Text style={styles.sectionLabel}>{t("profile.journeySoFar")}</Text>
          <View style={styles.card}>
            <View style={styles.timeline}>
              <LinearGradient
                colors={[Theme.colors.magentaVivid, Theme.colors.purple, Theme.colors.hairline, Theme.colors.hairline]}
                locations={[0, RAIL_FILL[current], RAIL_FILL[current], 1]}
                style={styles.rail}
              />
              {TRIMESTERS.map((trimester, index) => {
                const stage: Stage =
                  index < current ? "done" : index === current ? "now" : "next";
                return (
                  <View
                    key={trimester.key}
                    style={[
                      styles.tlItem,
                      index === TRIMESTERS.length - 1 && styles.tlItemLast,
                    ]}
                  >
                    <View style={styles.dotSlot}>
                      <TimelineDot stage={stage} />
                    </View>
                    <Text style={styles.tlTitle}>
                      {t(`profile.${trimester.key}`)}
                    </Text>
                    <Text style={styles.tlDesc}>{describeTrimester(index)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={styles.flatRow}
            activeOpacity={0.6}
            onPress={() =>
              router.push({
                pathname: "/patient/track",
                params: { weeksComplete: String(week) },
              })
            }
          >
            <View style={styles.iconChip}>
              <LineIcon size={19} color={Theme.colors.teal}>
                <Path d="M12 3v3M6 6h12M6 6l-3 7a3.5 3.5 0 0 0 7 0L6 6ZM18 6l-3 7a3.5 3.5 0 0 0 7 0L18 6Z" />
                <Path d="M9 21h6M12 18v3" />
              </LineIcon>
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{t("profile.babySizeTitle")}</Text>
              <Text style={styles.rowSub}>
                {week > 0
                  ? t("profile.babySizeDesc", {
                      fruit: t(`fruits.${fruit}`).toLowerCase(),
                    })
                  : t("profile.babySizeComingSoon")}
              </Text>
            </View>
            <LineIcon size={16} color={Theme.colors.ink}>
              <Path d="M9 6l6 6-6 6" />
            </LineIcon>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={editing}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.label}>{t("profile.currentWeek")}</Text>
            <TextInput
              style={styles.input}
              value={weekInput}
              onChangeText={(value) => setWeekInput(value.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={2}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonGhost]}
                onPress={() => setEditing(false)}
              >
                <Text style={[styles.buttonText, { color: Theme.colors.ink }]}>
                  {t("profile.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={saveWeek}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Theme.colors.surface} />
                ) : (
                  <Text style={styles.buttonText}>{t("save")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
    </ScreenBackground>
  );
};

export default YourPregnancy;

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
  hero: {
    borderRadius: 26,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  heroLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    color: Theme.colors.inkSoft,
  },
  heroDate: {
    fontFamily: Theme.typography.display,
    fontSize: 28,
    color: Theme.colors.ink,
    marginTop: 4,
    marginBottom: 10,
    textAlign: "center",
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
  },
  statChip: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statValue: {
    fontFamily: Theme.typography.display,
    fontSize: 19,
    color: Theme.colors.ink,
  },
  statLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 10,
    color: Theme.colors.inkFaint,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkFaint,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    ...Theme.shadows.card,
  },
  timeline: {
    paddingLeft: 26,
  },
  rail: {
    position: "absolute",
    left: 7,
    top: 4,
    bottom: 4,
    width: 2,
    borderRadius: 2,
  },
  tlItem: {
    paddingBottom: 22,
  },
  tlItemLast: {
    paddingBottom: 0,
  },
  dotSlot: {
    position: "absolute",
    left: -26,
    top: 2,
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
  },
  dotDone: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.magenta,
  },
  dotNow: {
    borderColor: Theme.colors.magentaVivid,
    backgroundColor: Theme.colors.surface,
  },
  dotNext: {
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  dotRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.magentaTint,
    alignItems: "center",
    justifyContent: "center",
  },
  tlTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
  tlDesc: {
    fontFamily: Theme.typography.body,
    fontSize: 12,
    color: Theme.colors.inkFaint,
    marginTop: 2,
  },
  flatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Theme.colors.tealTint,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.body,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Theme.colors.scrim,
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 20,
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
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 16,
    fontFamily: Theme.typography.body,
    fontSize: 14.5,
    color: Theme.colors.ink,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 11,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonGhost: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1.5,
    borderColor: Theme.colors.hairline,
  },
  buttonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.surface,
  },
});
