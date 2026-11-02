import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DailyTriggerInput, SchedulableTriggerInputTypes } from 'expo-notifications';

// Define constants
const REMINDER_STORAGE_KEY = 'health_reminders';
const APPOINTMENT_REMINDERS_ENABLED_KEY = 'appointment_reminders_enabled';
const MEDICATION_REMINDERS_ENABLED_KEY = 'medication_reminders_enabled';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
        body: reminder.message || `Time to track your ${reminder.type}!`,
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
function getReminderTitle(type: string): string {
  switch (type) {
    case 'water':
      return '💧 Water Reminder';
    case 'steps':
      return '👟 Steps Reminder';
    case 'medication':
      return '💊 Medication Reminder';
    case 'sleep':
      return '😴 Sleep Reminder';
    case 'heart':
      return '❤️ Heart Rate Reminder';
    case 'weight':
      return '⚖️ Weight Reminder';
    default:
      return 'Health Reminder';
  }
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
export async function loadReminders(): Promise<ReminderSettings[]> {
  try {
    const storedReminders = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    return storedReminders ? JSON.parse(storedReminders) : [];
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
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
      message: 'Time to track your morning water intake!'
    },
    {
      id: 'steps-evening',
      type: 'steps',
      time: '19:00',
      enabled: true,
      days: [],
      message: 'Don\'t forget to log your steps for today!'
    },
    {
      id: 'sleep-morning',
      type: 'sleep',
      time: '08:00',
      enabled: true,
      days: [],
      message: 'How did you sleep last night? Tap to log your sleep.'
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
          title: '📅 Appointment Reminder',
          body: `You have an appointment "${description}" in 1 hour`,
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
          title: '📅 Appointment Reminder',
          body: `You have an appointment "${description}" tomorrow`,
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
          title: '💊 Medication Reminder',
          body: `Time to take "${medicationName}" in 1 hour`,
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
          title: '💊 Medication Reminder',
          body: `It's time to take "${medicationName}"`,
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