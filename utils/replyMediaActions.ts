import axios from "axios";
import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { CONFIG } from "@/constants/config";

// "Save to journal" and "Remind me" under a reply that carries media.

export const saveToJournal = async (userId: string, title: string, link?: string) => {
  await axios.post(`${CONFIG.API_BASE_URL}/user/activity/${userId}/note`, {
    title,
    description: link ? `${title}\n${link}` : title,
  });
};

// Next 6 PM: today if it is still before, otherwise tomorrow
export const nextSixPm = (now = new Date()) => {
  const at = new Date(now);
  at.setHours(18, 0, 0, 0);
  if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
  return at;
};

// Returns the id to cancel it, or null when notifications are not allowed
export const remindAtSixPm = async (title: string): Promise<string | null> => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return null;
  return Notifications.scheduleNotificationAsync({
    content: { title: "CrossCare Concierge", body: title },
    trigger: { type: SchedulableTriggerInputTypes.DATE, date: nextSixPm() },
  });
};

export const cancelReminder = (id: string) => Notifications.cancelScheduledNotificationAsync(id);
