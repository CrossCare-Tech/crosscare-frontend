import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import {
  loadReminders,
  saveReminders,
  requestNotificationPermissions,
  scheduleDailyReminder,
  generateDefaultReminders,
  ReminderSettings,
  displayTestNotification,
  getAllScheduledNotifications,
  hasSavedReminders,
} from '../../../utils/NotificationManager';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/theme';
import ScreenBackground from '@/components/ui/ScreenBackground';
import CustomTextInput from '@/components/ui/CustomTextInput';

// Calendar, heart and leaf drawn next to the illustration (prototype empty state)
const EmptyIllustration = () => (
  <View style={styles.emptyArt}>
    <View style={styles.emptyHalo} />
    <Image
      source={require('@/assets/images/reminders/empty-mother.png')}
      style={styles.emptyMother}
      resizeMode="contain"
    />
    <Svg width={140} height={190} viewBox="0 0 140 190" style={styles.emptyDecor}>
      {/* Heart */}
      <Path
        d="M78 22c-3-6-12-6-13 1-1 6 6 11 13 16 7-5 14-10 13-16-1-7-10-7-13-1z"
        fill="none"
        stroke={Theme.reminderEmpty.heart}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Calendar */}
      <Rect x={20} y={60} width={92} height={78} rx={8} fill={Theme.colors.surface} />
      <Rect x={20} y={60} width={92} height={22} rx={8} fill={Theme.reminderEmpty.calendarTop} />
      <Rect x={20} y={74} width={92} height={8} fill={Theme.reminderEmpty.calendarTop} />
      {[38, 56, 74, 92].map((x) => (
        <Rect key={x} x={x - 2} y={52} width={4} height={14} rx={2} fill={Theme.reminderEmpty.calendarTop} />
      ))}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) =>
          row === 2 && col > 1 ? null : (
            <Rect
              key={`${row}-${col}`}
              x={30 + col * 18}
              y={92 + row * 14}
              width={9}
              height={8}
              rx={2}
              fill={Theme.reminderEmpty.calendarDot}
            />
          )
        )
      )}
      <Circle cx={90} cy={118} r={12} fill={Theme.reminderEmpty.check} />
      <Path d="M84 118l4.5 4.5L96 114" fill="none" stroke={Theme.colors.surface} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Leaf */}
      <Path d="M78 186c8-20 22-36 44-48" fill="none" stroke={Theme.reminderEmpty.leaf} strokeWidth={2} strokeLinecap="round" />
      <Path d="M122 138c-2 12-10 18-20 18 2-10 10-17 20-18z" fill={Theme.reminderEmpty.leaf} />
      <Path d="M100 156c-2 10-9 15-17 15 1-9 8-14 17-15z" fill={Theme.reminderEmpty.leaf} />
      <Path d="M96 158c-10-3-16-10-15-19 9 2 15 9 15 19z" fill={Theme.reminderEmpty.leaf} opacity={0.75} />
    </Svg>
  </View>
);

const REMINDER_TYPES: ReminderSettings['type'][] = ['water', 'steps', 'sleep', 'heart', 'weight', 'medication'];

// "HH:MM" for the current time
const currentTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export default function RemindersScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const [reminders, setReminders] = useState<ReminderSettings[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminderType, setNewReminderType] = useState<ReminderSettings['type']>(
    (params.type as any) || 'water'
  );
  const {t} = useTranslation();
  const [newReminderMessage, setNewReminderMessage] = useState('');
  const [newReminderTime, setNewReminderTime] = useState(currentTime());
  const [showNewTimePicker, setShowNewTimePicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ReminderSettings['type'] | 'all'>(
    (params.type as any) || 'all'
  );

  // Load reminders on mount
  useEffect(() => {
    loadExistingReminders();
  }, []);

  async function loadExistingReminders() {
    try {
      setLoading(true);

      // Check for permissions first
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          t('permissionRequired'),
          t('allowNotifications'),
          [{ text: 'OK' }]
        );
      }

      // Load saved reminders
      let savedReminders = await loadReminders();

      // Create the defaults only on the first visit, so deleting every reminder shows the empty state
      if (savedReminders.length === 0 && !(await hasSavedReminders())) {
        savedReminders = generateDefaultReminders();
        await saveReminders(savedReminders);
      }

      setReminders(savedReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Error', 'Could not load reminder settings');
    } finally {
      setLoading(false);
    }
  }

  async function toggleReminder(id: string) {
    const updatedReminders = reminders.map(reminder => {
      if (reminder.id === id) {
        return { ...reminder, enabled: !reminder.enabled };
      }
      return reminder;
    });

    setReminders(updatedReminders);
    await saveReminders(updatedReminders);

    // Schedule or cancel the reminder based on its new state
    const reminder = updatedReminders.find(r => r.id === id);
    if (reminder) {
      await scheduleDailyReminder(reminder);
    }
  }

  function showTimePickerFor(reminder: ReminderSettings) {
    setCurrentReminder(reminder);
    setShowTimePicker(true);
  }

  async function handleTimeChange(event: any, selectedDate?: Date) {
    setShowTimePicker(false);

    if (event.type === 'dismissed' || !selectedDate || !currentReminder) {
      return;
    }

    // Format time as HH:MM
    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
    const newTime = `${hours}:${minutes}`;

    // Update the reminder
    const updatedReminders = reminders.map(reminder => {
      if (reminder.id === currentReminder.id) {
        return { ...reminder, time: newTime };
      }
      return reminder;
    });

    setReminders(updatedReminders);
    await saveReminders(updatedReminders);

    // Reschedule the updated reminder
    const updatedReminder = updatedReminders.find(r => r.id === currentReminder.id);
    if (updatedReminder) {
      await scheduleDailyReminder(updatedReminder);
    }
  }

  function handleNewTimeChange(event: any, selectedDate?: Date) {
    setShowNewTimePicker(false);
    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }
    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
    setNewReminderTime(`${hours}:${minutes}`);
  }

  function openAddModal() {
    setNewReminderMessage('');
    setNewReminderTime(currentTime());
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setShowNewTimePicker(false);
  }

  async function addNewReminder() {
    // Generate a unique ID
    const id = `${newReminderType}-${Date.now()}`;

    // Create new reminder
    const newReminder: ReminderSettings = {
      id,
      type: newReminderType,
      time: newReminderTime,
      enabled: true,
      days: [], // Empty array means every day
      message: newReminderMessage || `Time to track your ${newReminderType}!`,
    };

    // Add to list
    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);

    // Schedule the new reminder
    await scheduleDailyReminder(newReminder);

    // Close modal and reset fields
    closeAddModal();
    setNewReminderMessage('');
  }

  async function deleteReminder(id: string) {
    Alert.alert(
      t('deleteReminder'),
      t('deleteConfirmation'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          onPress: async () => {
            const updatedReminders = reminders.filter(reminder => reminder.id !== id);
            setReminders(updatedReminders);
            await saveReminders(updatedReminders);
            await Notifications.cancelScheduledNotificationAsync(id);
          },
          style: 'destructive',
        },
      ]
    );
  }

  // Format time for display
  function formatTime(timeString: string) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // "HH:MM" as a Date for the time pickers
  function timeToDate(timeString: string) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Get reminder title
  function getReminderTitle(type: string) {
    switch(type) {
      case 'water': return t('reminder.water');
case 'steps': return t('reminder.steps');
case 'weight': return t('reminder.weight');
case 'sleep': return t('reminder.sleep');
case 'heart': return t('reminder.heart');
case 'medication': return t('reminder.medication');
default: return t('reminder.healthTracking');
    }
  }


  // Get icon for reminder type
  function getIconForType(type: string) {
    switch(type) {
      case 'water': return 'water-outline';
      case 'steps': return 'fitness-outline';
      case 'weight': return 'body-outline';
      case 'sleep': return 'moon-outline';
      case 'heart': return 'heart-outline';
      case 'medication': return 'medkit-outline';
      default: return 'notifications-outline';
    }
  }


  // Get color for reminder type
  function getColorForType(type: string): string {
    return Theme.reminderTypes[type] ?? Theme.colors.magenta;
  }

  // Debug function to show all scheduled notifications
  async function showAllScheduledNotifications() {
    const scheduledNotifications = await getAllScheduledNotifications();
    console.log('All scheduled notifications:', JSON.stringify(scheduledNotifications, null, 2));

    Alert.alert(
      t('scheduledNotifications'),
      t('foundScheduledNotifications', {count: scheduledNotifications.length}),
      [{ text: 'OK' }]
    );
  }

  // Filter reminders based on active filter
  const filteredReminders = activeFilter === 'all'
    ? reminders
    : reminders.filter(reminder => reminder.type === activeFilter);

  // Render a reminder item
  const renderReminderItem = ({ item }: { item: ReminderSettings }) => (
    <View style={styles.reminderItem}>
      <View style={[styles.reminderIconContainer, { backgroundColor: `${getColorForType(item.type)}1A` }]}>
        <Ionicons
          name={getIconForType(item.type) as any}
          size={22}
          color={getColorForType(item.type)}
        />
      </View>

      <View style={styles.reminderInfo}>
        <Text style={styles.reminderTitle}>
          {getReminderTitle(item.type)}
        </Text>

        <TouchableOpacity onPress={() => showTimePickerFor(item)}>
          <Text style={styles.reminderTime}>{formatTime(item.time)}</Text>
        </TouchableOpacity>

        <Text style={styles.reminderMessage}>{item.message}</Text>
      </View>

      <View style={styles.reminderActions}>
        <Switch
          value={item.enabled}
          onValueChange={() => toggleReminder(item.id)}
          trackColor={{ false: Theme.colors.surfaceSunken, true: Theme.colors.magenta }}
          thumbColor={Theme.colors.surface}
        />

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteReminder(item.id)}
          accessibilityRole="button"
          accessibilityLabel={t('deleteReminder')}
        >
          <Ionicons name="trash-outline" size={18} color={Theme.colors.inkFaint} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render filter buttons
 const renderFilterButton = (type: 'all' | ReminderSettings['type'], labelKey: string) => (
  <TouchableOpacity
    style={[styles.filterButton, activeFilter === type && styles.filterButtonActive]}
    onPress={() => setActiveFilter(type)}
  >
    <Text style={[styles.filterButtonText, activeFilter === type && styles.filterButtonTextActive]}>
      {t(labelKey)} {/* This dynamically loads the translated label */}
    </Text>
  </TouchableOpacity>
);


  return (
    <ScreenBackground>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={20} color={Theme.colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('healthReminders')}</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => {
          displayTestNotification();
          showAllScheduledNotifications();
        }}>
          <Ionicons name="notifications-outline" size={20} color={Theme.colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
         {renderFilterButton('all', 'all')}
{renderFilterButton('water', 'water')}
{renderFilterButton('steps', 'steps')}
{renderFilterButton('sleep', 'sleep')}
{renderFilterButton('heart', 'heart')}
{renderFilterButton('weight', 'weight')}
{renderFilterButton('medication', 'medication')}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Theme.colors.magenta} />
          <Text style={styles.loaderText}>{t('loadingReminders')}</Text>
        </View>
      ) : reminders.length === 0 ? (
        <>
          <ScrollView contentContainerStyle={styles.emptyState}>
            <EmptyIllustration />
            <Text style={styles.emptyTitle}>{t('reminderEmpty.title')}</Text>
            <Text style={styles.emptyBody}>{t('reminderEmpty.body')}</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal} accessibilityRole="button">
              <Ionicons name="add" size={20} color={Theme.colors.surface} />
              <Text style={styles.emptyButtonText}>{t('reminderEmpty.cta')}</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity 
            style={styles.addButton}
            onPress={openAddModal}
            accessibilityRole="button"
            accessibilityLabel={t('reminderForm.newReminder')}
          >
            <Ionicons name="add" size={26} color={Theme.colors.surface} />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <FlatList
            data={filteredReminders}
            renderItem={renderReminderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('noRemindersFound')}</Text>
                <Text style={styles.emptySubtext}>{t('tapAddButton')}</Text>
              </View>
            }
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddModal}
            accessibilityRole="button"
            accessibilityLabel={t('reminderForm.newReminder')}
          >
            <Ionicons name="add" size={26} color={Theme.colors.surface} />
          </TouchableOpacity>
        </>
      )}

      {/* Time Picker */}
      {showTimePicker && currentReminder && (
        <DateTimePicker
          value={timeToDate(currentReminder.time)}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={handleTimeChange}
        />
      )}

      {/* Add Reminder sheet (prototype "New reminder") */}
      <Modal
        visible={showAddModal}
        transparent={true}
        statusBarTranslucent
        animationType="slide"
        onRequestClose={closeAddModal}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalOverlay} onPress={closeAddModal}>
            <Pressable style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.modalTitle}>{t('reminderForm.newReminder')}</Text>
                <TouchableOpacity
                  onPress={closeAddModal}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('cancel')}
                >
                  <Ionicons name="close" size={20} color={Theme.colors.inkFaint} />
                </TouchableOpacity>
              </View>

              <CustomTextInput
                label={t('reminderForm.title')}
                value={newReminderMessage}
                onChangeText={(text: string) => setNewReminderMessage(text)}
                placeholder={t('newremainder', { type: t(newReminderType) })}
                maxLength={80}
              />

              <View style={styles.field}>
                <Text style={styles.modalLabel}>{t('reminderType')}</Text>
                <View style={styles.typeButtons}>
                  {REMINDER_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeButton, newReminderType === type && styles.typeButtonActive]}
                      onPress={() => setNewReminderType(type)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: newReminderType === type }}
                    >
                      <Ionicons
                        name={getIconForType(type) as any}
                        size={22}
                        color={getColorForType(type)}
                      />
                      <Text
                        numberOfLines={1}
                        style={[styles.typeButtonText, newReminderType === type && styles.typeButtonTextActive]}
                      >
                        {t(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.modalLabel}>{t('reminderForm.time')}</Text>
                <TouchableOpacity
                  style={styles.timeField}
                  onPress={() => setShowNewTimePicker(true)}
                  accessibilityRole="button"
                >
                  <Text style={styles.timeFieldText}>{formatTime(newReminderTime)}</Text>
                  <Ionicons name="time-outline" size={18} color={Theme.colors.inkFaint} />
                </TouchableOpacity>
              </View>

              {showNewTimePicker && (
                <DateTimePicker
                  value={timeToDate(newReminderTime)}
                  mode="time"
                  is24Hour={false}
                  display="spinner"
                  onChange={handleNewTimeChange}
                />
              )}

              <TouchableOpacity
                style={styles.createButton}
                onPress={addNewReminder}
                accessibilityRole="button"
              >
                <Text style={styles.createButtonText}>{t('reminderForm.save')}</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.full,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  filterButtonActive: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.magentaTint,
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.inkSoft,
  },
  filterButtonTextActive: {
    color: Theme.colors.magenta,
  },
  listContent: {
    padding: 20,
    paddingBottom: 96, // Space for floating button
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    marginBottom: 12,
    ...Theme.shadows.card,
  },
  reminderIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
    marginBottom: 2,
  },
  reminderTime: {
    fontSize: 24,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
    marginBottom: 4,
  },
  reminderMessage: {
    fontSize: 13,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkFaint,
  },
  reminderActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  deleteButton: {
    padding: 8,
    marginTop: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkFaint,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.ink,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkFaint,
  },
  emptyState: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 96,
  },
  emptyArt: {
    width: 270,
    height: 240,
    marginBottom: Theme.spacing.lg,
  },
  emptyHalo: {
    position: 'absolute',
    left: 20,
    top: 10,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Theme.reminderEmpty.halo,
  },
  emptyMother: {
    position: 'absolute',
    left: 18,
    top: 0,
    width: 150,
    height: 234,
  },
  emptyDecor: {
    position: 'absolute',
    right: 0,
    top: 20,
  },
  emptyTitle: {
    maxWidth: 260, // breaks after "Your reminders," as in the prototype
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkFaint,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    height: 52,
    paddingHorizontal: 28,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.magenta,
    ...Theme.shadows.soft,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.surface,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.magenta,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.soft,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Theme.colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
    gap: Theme.spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.hairline,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
  },
  field: {
    gap: 7,
  },
  modalLabel: {
    fontSize: 12.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  typeButton: {
    width: '31.5%',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1.5,
    borderColor: Theme.colors.hairline,
  },
  typeButtonActive: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.magentaTint,
  },
  typeButtonText: {
    fontSize: 12,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.inkSoft,
    marginTop: 6,
  },
  typeButtonTextActive: {
    color: Theme.colors.magenta,
  },
  timeField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Theme.colors.inputBorder,
    backgroundColor: Theme.colors.inputBg,
    paddingHorizontal: Theme.spacing.md,
  },
  timeFieldText: {
    fontSize: 15,
    fontFamily: Theme.typography.body,
    color: Theme.colors.ink,
  },
  createButton: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  createButtonText: {
    fontSize: 15,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.surface,
  },
});
