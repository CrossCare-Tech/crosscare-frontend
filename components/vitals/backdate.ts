import { Alert } from "react-native";
import type { TFunction } from "i18next";
import { CONFIG } from "@/constants/config";

const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// The API may still ignore `recorded_at` and stamp the reading with today. After saving a reading
// for an earlier day, check that the day now has one, and tell her when it does not.
export const warnIfBackdateIgnored = async ({
  recordedAt,
  user,
  hasReading,
  t,
}: {
  recordedAt: Date | null;
  user: { user_id?: string; token?: string };
  hasReading: (details: any) => boolean;
  t: TFunction;
}) => {
  if (!CONFIG.BACKDATED_READINGS || !recordedAt || !user?.user_id) return;
  const day = localDay(recordedAt);
  if (day === localDay(new Date())) return;

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}`, {
      headers: {
        Accept: "application/json",
        ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
      },
    });
    if (!response.ok) return;
    const result = await response.json();
    const found = (result?.activities || []).some(
      (activity: { date: string; details: any }) => activity.date === day && hasReading(activity.details)
    );
    if (!found) {
      Alert.alert(t("vitalsEntry.backdateIgnoredTitle"), t("vitalsEntry.backdateIgnoredBody"));
    }
  } catch (error) {
    console.warn("Could not check the reading date:", error);
  }
};
