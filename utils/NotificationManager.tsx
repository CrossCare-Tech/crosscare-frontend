import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DailyTriggerInput, SchedulableTriggerInputTypes } from 'expo-notifications';
import i18n from 'i18next';

// Define constants
const REMINDER_STORAGE_KEY = 'health_reminders';
const SCHEDULE_STORAGE_KEY = 'notification_schedule';
const APPOINTMENT_REMINDERS_ENABLED_KEY = 'appointment_reminders_enabled';
const MEDICATION_REMINDERS_ENABLED_KEY = 'medication_reminders_enabled';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // expo-notifications 0.31 (SDK 53) deprecated shouldShowAlert and made
    // shouldShowBanner and shouldShowList required. Omitting them left the
    // behaviour object invalid, so a delivered notification was not presented.
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface ReminderSettings {
  id: string;
  type: 'water' | 'steps' | 'medication' | 'sleep' | 'heart' | 'weight';
  time: string; // Format: 'HH:MM'
  enabled: boolean;
  days: number[]; // 0-6 for days of week (0 = Sunday)
  message: string;
}

// "Notification schedule": three fixed nudges (morning, midday, evening) the user can switch on and set to
// run daily, on weekdays or on chosen days. Separate from the health reminders above.
export type ScheduleFrequency = 'daily' | 'weekdays' | 'custom';
export interface ScheduleItem {
  id: 'morning' | 'midday' | 'evening';
  time: string; // 'HH:MM'
  enabled: boolean;
  frequency: ScheduleFrequency;
  days: number[]; // 0-6 (0 = Sunday), used when frequency is 'custom'
}
export type ScheduleCopy = Record<ScheduleItem['id'], { title: string; body: string }>;

export const WEEKDAYS = [1, 2, 3, 4, 5];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { id: 'morning', time: '08:00', enabled: true, frequency: 'daily', days: ALL_DAYS },
  { id: 'midday', time: '13:00', enabled: true, frequency: 'weekdays', days: WEEKDAYS },
  { id: 'evening', time: '20:30', enabled: false, frequency: 'daily', days: ALL_DAYS },
];

// Request permissions
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Schedule a daily reminder
export async function scheduleDailyReminder(reminder: ReminderSettings): Promise<string> {
  // Cancel any existing notification with this ID
  try {
    await Notifications.cancelScheduledNotificationAsync(reminder.id);
  } catch (error) {
    console.log("No existing notification to cancel");
  }
  
  if (!reminder.enabled) {
    return reminder.id;
  }
  
  // Parse time string
  const [hours, minutes] = reminder.time.split(':').map(Number);
  
  // Create trigger for daily notification at specified time
  
  try {
    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: getReminderTitle(reminder.type),
        body: reminderMessage(reminder),
        data: { 
          type: reminder.type,
          screen: getScreenForType(reminder.type)
        },
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
      identifier: reminder.id,
    });
    
    console.log(`Scheduled reminder: ${reminder.type} at ${hours}:${minutes}`);
    return reminder.id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

// Helper functions for notifications
// The three starter reminders are stored with their text, so one saved in English would stay in English after the
// language changes. Their text is read from the translations when it is shown or scheduled, unless the user edited it.
const DEFAULT_REMINDER_TEXT: Record<string, { key: string; english: string }> = {
  'water-morning': { key: 'pushText.defaultWater', english: 'Time to track your morning water intake!' },
  'steps-evening': { key: 'pushText.defaultSteps', english: "Don't forget to log your steps for today!" },
  'sleep-morning': { key: 'pushText.defaultSleep', english: 'How did you sleep last night? Tap to log your sleep.' },
};

export function reminderMessage(reminder: ReminderSettings): string {
  const starter = DEFAULT_REMINDER_TEXT[reminder.id];
  if (starter && (!reminder.message || reminder.message === starter.english)) return i18n.t(starter.key);
  return reminder.message || i18n.t('pushText.genericBody');
}

function getReminderTitle(type: string): string {
  const key = ['water', 'steps', 'medication', 'sleep', 'heart', 'weight'].includes(type) ? `${type}Title` : 'healthTitle';
  return i18n.t(`pushText.${key}`);
}

function getColorForType(type: string): string {
  switch (type) {
    case 'water':
      return '#67B6FF';
    case 'steps':
      return '#7B9E6B';
    case 'sleep':
      return '#9E6BB7';
    case 'heart':
      return '#E16262';
    case 'weight':
      return '#62A9E1';
    case 'medication':
      return '#E79D42';
    default:
      return '#E162BC';
  }
}

function getScreenForType(type: string): string {
  switch (type) {
    case 'water':
      return '/patient/water';
    case 'steps':
      return '/patient/steps';
    case 'sleep':
      return '/patient/sleep';
    case 'heart':
      return '/patient/heart';
    case 'weight':
      return '/patient/weight';
    default:
      return '/patient/(tabs)/home';
  }
}

// Save reminders to storage
export async function saveReminders(reminders: ReminderSettings[]) {
  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders));
}

// Load reminders from storage
// True once reminders were saved at least once (even if the user later deleted them all)
export async function hasSavedReminders(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(REMINDER_STORAGE_KEY)) !== null;
  } catch (error) {
    console.error('Error checking reminders:', error);
    return false;
  }
}

export async function loadReminders(): Promise<ReminderSettings[]> {
  try {
    const storedReminders = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    return storedReminders ? JSON.parse(storedReminders) : [];
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
}

export async function loadNotificationSchedule(): Promise<ScheduleItem[]> {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULE_STORAGE_KEY);
    const items: ScheduleItem[] = stored ? JSON.parse(stored).items : [];
    return DEFAULT_SCHEDULE.map((fallback) => items.find((i) => i.id === fallback.id) ?? fallback);
  } catch (error) {
    console.error('Error loading notification schedule:', error);
    return DEFAULT_SCHEDULE;
  }
}

// Weekday numbers (0 = Sunday) an item runs on, or null for every day
function scheduleDays(item: ScheduleItem): number[] | null {
  if (item.frequency === 'daily') return null;
  return item.frequency === 'weekdays' ? WEEKDAYS : item.days;
}

async function applyNotificationSchedule(items: ScheduleItem[], copy: ScheduleCopy) {
  for (const item of items) {
    // Clear the daily id and the seven weekly ids, then schedule what the item asks for now
    const ids = [`schedule-${item.id}`, ...ALL_DAYS.map((d) => `schedule-${item.id}-${d}`)];
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
    if (!item.enabled) continue;

    const [hour, minute] = item.time.split(':').map(Number);
    const content = {
      title: copy[item.id].title,
      body: copy[item.id].body,
      data: { screen: '/patient/(tabs)/home' },
      sound: true,
    };
    const days = scheduleDays(item);
    if (!days) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: SchedulableTriggerInputTypes.DAILY, hour, minute },
        identifier: `schedule-${item.id}`,
      });
    } else {
      for (const day of days) {
        await Notifications.scheduleNotificationAsync({
          content,
          // expo weekdays run 1-7 with Sunday as 1
          trigger: { type: SchedulableTriggerInputTypes.WEEKLY, weekday: day + 1, hour, minute },
          identifier: `schedule-${item.id}-${day}`,
        });
      }
    }
  }
}

// Saves the schedule with the texts it was written with (so it can be rebuilt later) and schedules it
export async function saveNotificationSchedule(items: ScheduleItem[], copy: ScheduleCopy) {
  await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify({ items, copy }));
  await applyNotificationSchedule(items, copy);
}

// Reschedule all active reminders (useful on app startup)
export async function rescheduleAllReminders() {
  try {
    const reminders = await loadReminders();
    
    // Cancel all existing notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Reschedule enabled reminders
    const activeReminders = reminders.filter(r => r.enabled);
    for (const reminder of activeReminders) {
      await scheduleDailyReminder(reminder);
    }

    // The notification schedule was cancelled above too: bring it back
    const stored = await AsyncStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (stored) {
      const { items, copy } = JSON.parse(stored);
      await applyNotificationSchedule(items, copy);
    }
    
    return activeReminders.length;
  } catch (error) {
    console.error('Error rescheduling reminders:', error);
    return 0;
  }
}

// Helper to generate default reminders for a user
export function generateDefaultReminders(): ReminderSettings[] {
  return [
    {
      id: 'water-morning',
      type: 'water',
      time: '09:00',
      enabled: true,
      days: [],
      message: i18n.t('pushText.defaultWater')
    },
    {
      id: 'steps-evening',
      type: 'steps',
      time: '19:00',
      enabled: true,
      days: [],
      message: i18n.t('pushText.defaultSteps')
    },
    {
      id: 'sleep-morning',
      type: 'sleep',
      time: '08:00',
      enabled: true,
      days: [],
      message: i18n.t('pushText.defaultSleep')
    }
  ];
}

// Listen for notification responses
export function setNotificationResponseHandler(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

// Display a test notification
export async function displayTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification",
      body: "This is a test notification from Expo Notifications",
      data: { screen: '/patient/(tabs)/home' },
      sound: true,
    },
    trigger: null, // null means the notification will fire immediately
  });
}

// Schedule a one-time appointment reminder
export async function scheduleAppointmentReminder(
  appointmentDateTime: Date, 
  description: string,
  appointmentId?: string
): Promise<string[] | null> {
  try {
    console.log('📅 Scheduling appointment reminder...');
    console.log('Appointment DateTime (from backend):', appointmentDateTime);
    console.log('Current time:', new Date());
    
    // Request notification permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('❌ Notification permissions not granted');
      return null;
    }

    const now = new Date();
    const reminderIds: string[] = [];

    // Ensure we're working with proper Date objects
    const appointmentDate = new Date(appointmentDateTime);
    
    // Calculate reminder times
    const oneHourBefore = new Date(appointmentDate.getTime() - (60 * 60 * 1000)); // 1 hour in milliseconds
    const oneDayBefore = new Date(appointmentDate.getTime() - (24 * 60 * 60 * 1000)); // 24 hours in milliseconds

    console.log('One hour before:', oneHourBefore);
    console.log('One day before:', oneDayBefore);

    // Schedule 1-hour reminder if it's in the future
    if (oneHourBefore > now) {
      const oneHourReminderId = `appointment-1h-${appointmentId || Date.now()}`;
      const secondsUntilReminder = Math.floor((oneHourBefore.getTime() - now.getTime()) / 1000);
      
      console.log(`⏰ Scheduling 1-hour reminder in ${secondsUntilReminder} seconds`);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('pushText.appointmentTitle'),
          body: i18n.t('pushText.appointmentInHour', { description }),
          data: { 
            screen: '/patient/calendar',
            appointmentId: appointmentId || 'unknown'
          },
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilReminder, // Fixed: Convert milliseconds to seconds
        },
        identifier: oneHourReminderId,
      });
      
      console.log('✅ 1-hour appointment reminder scheduled for:', oneHourBefore);
      reminderIds.push(oneHourReminderId);
    } else {
      console.log('⏭️ 1-hour reminder time has passed, skipping');
    }

    // Schedule 24-hour reminder if it's in the future
    if (oneDayBefore > now) {
      const oneDayReminderId = `appointment-24h-${appointmentId || Date.now()}`;
      const secondsUntilDayReminder = Math.floor((oneDayBefore.getTime() - now.getTime()) / 1000);
      
      console.log(`⏰ Scheduling 24-hour reminder in ${secondsUntilDayReminder} seconds`);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('pushText.appointmentTitle'),
          body: i18n.t('pushText.appointmentTomorrow', { description }),
          data: { 
            screen: '/patient/calendar',
            appointmentId: appointmentId || 'unknown'
          },
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilDayReminder, // Fixed: Proper time calculation
        },
        identifier: oneDayReminderId,
      });
      
      console.log('✅ 24-hour appointment reminder scheduled for:', oneDayBefore);
      reminderIds.push(oneDayReminderId);
    } else {
      console.log('⏭️ 24-hour reminder time has passed, skipping');
    }

    // Debug: Show what was scheduled
    const debugInfo = await debugNotifications();
    console.log('🔍 Current scheduled notifications:', debugInfo);

    return reminderIds.length > 0 ? reminderIds : null;
  } catch (error) {
    console.error('❌ Error scheduling appointment reminder:', error);
    return null;
  }
}

// One-off reminder to measure blood pressure again after a high reading (5.5 "Recheck in 15 minutes")
export async function scheduleBloodPressureRecheck(title: string, body: string, minutes = 15): Promise<boolean> {
  try {
    if (!(await requestNotificationPermissions())) {
      return false;
    }
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { screen: '/patient/bloodpressure' }, sound: true },
      trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: minutes * 60 },
      identifier: 'bp-recheck',
    });
    return true;
  } catch (error) {
    console.error('Error scheduling blood pressure recheck:', error);
    return false;
  }
}

export async function debugNotifications() {
  try {
    const permissions = await Notifications.getPermissionsAsync();
    console.log('Notification Permissions:', permissions);
    
    const scheduled = await getAllScheduledNotifications();
    console.log('Scheduled Notifications:', scheduled);
    
    return {
      permissions,
      scheduledCount: scheduled.length,
      scheduled: scheduled.map(n => ({
        identifier: n.identifier,
        trigger: n.trigger,
        content: n.content.title
      }))
    };
  } catch (error) {
    console.error('Error debugging notifications:', error);
    return null;
  }
}

// Get all scheduled notifications (for debugging)
export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Cancel all reminders for a specific appointment
export async function cancelAppointmentReminders(appointmentId: string): Promise<void> {
  try {
    // Get all scheduled notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Filter notifications related to this appointment
    const appointmentNotifications = scheduledNotifications.filter(
      notification => notification.identifier?.includes(`appointment-`) && 
                     notification.content.data?.appointmentId === appointmentId
    );
    
    // Cancel each notification
    for (const notification of appointmentNotifications) {
      if (notification.identifier) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log(`Canceled reminder: ${notification.identifier}`);
      }
    }
  } catch (error) {
    console.error('Error canceling appointment reminders:', error);
  }
}

// Check if appointment reminders are enabled
export async function areAppointmentRemindersEnabled(): Promise<boolean> {
  try {
    const reminderPreference = await AsyncStorage.getItem(APPOINTMENT_REMINDERS_ENABLED_KEY);
    // Default to true if the preference hasn't been set
    return reminderPreference !== 'false';
  } catch (error) {
    console.error('Error checking reminder preference:', error);
    // Default to true if there's an error
    return true;
  }
}

// Set appointment reminders enabled/disabled
export async function setAppointmentRemindersEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(APPOINTMENT_REMINDERS_ENABLED_KEY, enabled.toString());
    console.log(`Appointment reminders ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Error saving reminder preference:', error);
  }
}

// Schedule medication reminder
export async function scheduleMedicationReminder(
  medicationDateTime: Date, 
  medicationName: string,
  medicationId?: string
): Promise<string[] | null> {
  try {
    console.log('💊 Scheduling medication reminder...');
    console.log('Medication DateTime:', medicationDateTime);
    console.log('Current time:', new Date());
    
    // Request notification permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('❌ Notification permissions not granted');
      return null;
    }

    const now = new Date();
    const reminderIds: string[] = [];

    // Ensure we're working with proper Date objects
    const medicationDate = new Date(medicationDateTime);
    
    // Calculate reminder times
    const oneHourBefore = new Date(medicationDate.getTime() - (60 * 60 * 1000)); // 1 hour in milliseconds
    const exactTime = new Date(medicationDate);

    console.log('One hour before:', oneHourBefore);
    console.log('Exact time:', exactTime);

    // Schedule 1-hour reminder if it's in the future
    if (oneHourBefore > now) {
      const oneHourReminderId = `medication-1h-${medicationId || Date.now()}`;
      const secondsUntilReminder = Math.floor((oneHourBefore.getTime() - now.getTime()) / 1000);
      
      console.log(`⏰ Scheduling 1-hour reminder in ${secondsUntilReminder} seconds`);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('pushText.medicationTitle'),
          body: i18n.t('pushText.medicationInHour', { name: medicationName }),
          data: { 
            screen: '/patient/medication/medications',
            medicationId: medicationId || 'unknown'
          },
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilReminder,
        },
        identifier: oneHourReminderId,
      });
      
      console.log('✅ 1-hour medication reminder scheduled for:', oneHourBefore);
      reminderIds.push(oneHourReminderId);
    } else {
      console.log('⏭️ 1-hour reminder time has passed, skipping');
    }

    // Schedule exact time reminder if it's in the future
    if (exactTime > now) {
      const exactTimeReminderId = `medication-exact-${medicationId || Date.now()}`;
      const secondsUntilExactReminder = Math.floor((exactTime.getTime() - now.getTime()) / 1000);
      
      console.log(`⏰ Scheduling exact time reminder in ${secondsUntilExactReminder} seconds`);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('pushText.medicationTitle'),
          body: i18n.t('pushText.medicationNow', { name: medicationName }),
          data: { 
            screen: '/patient/medication/medications',
            medicationId: medicationId || 'unknown'
          },
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilExactReminder,
        },
        identifier: exactTimeReminderId,
      });
      
      console.log('✅ Exact time medication reminder scheduled for:', exactTime);
      reminderIds.push(exactTimeReminderId);
    } else {
      console.log('⏭️ Exact time reminder has passed, skipping');
    }

    return reminderIds.length > 0 ? reminderIds : null;
  } catch (error) {
    console.error('❌ Error scheduling medication reminder:', error);
    return null;
  }
}

// Cancel all reminders for a specific medication
export async function cancelMedicationReminders(medicationId: string): Promise<void> {
  try {
    // Get all scheduled notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Filter notifications related to this medication
    const medicationNotifications = scheduledNotifications.filter(
      notification => notification.identifier?.includes(`medication-`) && 
                     notification.content.data?.medicationId === medicationId
    );
    
    // Cancel each notification
    for (const notification of medicationNotifications) {
      if (notification.identifier) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log(`Canceled medication reminder: ${notification.identifier}`);
      }
    }
  } catch (error) {
    console.error('Error canceling medication reminders:', error);
  }
}

// Check if medication reminders are enabled
export async function areMedicationRemindersEnabled(): Promise<boolean> {
  try {
    const reminderPreference = await AsyncStorage.getItem(MEDICATION_REMINDERS_ENABLED_KEY);
    // Default to true if the preference hasn't been set
    return reminderPreference !== 'false';
  } catch (error) {
    console.error('Error checking medication reminder preference:', error);
    // Default to true if there's an error
    return true;
  }
}

// Set medication reminders enabled/disabled
export async function setMedicationRemindersEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(MEDICATION_REMINDERS_ENABLED_KEY, enabled.toString());
    console.log(`Medication reminders ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Error saving medication reminder preference:', error);
  }
}