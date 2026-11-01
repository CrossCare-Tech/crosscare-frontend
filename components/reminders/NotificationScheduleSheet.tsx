import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/theme';
import Toggle from '@/components/profile/Toggle';
import {
  ALL_DAYS,
  DEFAULT_SCHEDULE,
  ScheduleCopy,
  ScheduleFrequency,
  ScheduleItem,
  WEEKDAYS,
  loadNotificationSchedule,
  saveNotificationSchedule,
} from '@/utils/NotificationManager';

// Prototype 2.5 "Notification schedule": three fixed nudges, each with a switch, and the
// Frequency chips for the one that is selected.
const FREQUENCIES: ScheduleFrequency[] = ['daily', 'weekdays', 'custom'];

// Sunday 2023-01-01 + day index gives the weekday name in the app language
const dayName = (day: number, language: string, style: 'short' | 'narrow') =>
  new Date(2023, 0, 1 + day).toLocaleDateString(language, { weekday: style });

export default function NotificationScheduleSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [selectedId, setSelectedId] = useState<ScheduleItem['id']>('morning');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedId('morning');
      loadNotificationSchedule().then(setItems);
    }
  }, [visible]);

  const selected = items.find((i) => i.id === selectedId)!;

  const update = (id: ScheduleItem['id'], patch: Partial<ScheduleItem>) =>
    setItems((current) => current.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  function formatTime(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  }

  function cadence(item: ScheduleItem) {
    const time = formatTime(item.time);
    if (item.frequency === 'daily') return `${time} ${t('notificationSchedule.dailyLower')}`;
    if (item.frequency === 'weekdays') return `${time} · ${t('notificationSchedule.weekdaysOnly')}`;
    const days = [...item.days].sort().map((d) => dayName(d, i18n.language, 'short')).join(', ');
    return `${time} · ${days}`;
  }

  function chooseFrequency(frequency: ScheduleFrequency) {
    // Custom starts from the days the item already runs on, so it never begins empty
    const days = frequency === 'custom' ? (selected.frequency === 'weekdays' ? WEEKDAYS : ALL_DAYS) : selected.days;
    update(selected.id, { frequency, days });
  }

  function toggleDay(day: number) {
    const has = selected.days.includes(day);
    if (has && selected.days.length === 1) return; // at least one day stays on
    update(selected.id, { days: has ? selected.days.filter((d) => d !== day) : [...selected.days, day] });
  }

  async function save() {
    setSaving(true);
    try {
      const copy = {} as ScheduleCopy;
      for (const id of ['morning', 'midday', 'evening'] as const) {
        copy[id] = { title: t(`notificationSchedule.${id}`), body: t(`notificationSchedule.${id}Body`) };
      }
      await saveNotificationSchedule(items, copy);
      onClose();
    } catch (error) {
      console.error('Error saving notification schedule:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('notificationSchedule.title')}</Text>

          <View>
            {items.map((item, index) => {
              const isSelected = item.id === selectedId;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.row, index < items.length - 1 && styles.rowDivider]}
                  onPress={() => setSelectedId(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, isSelected && styles.rowTitleSelected]}>
                      {t(`notificationSchedule.${item.id}`)}
                    </Text>
                    <Text style={styles.rowSub}>{cadence(item)}</Text>
                  </View>
                  <Toggle
                    value={item.enabled}
                    onChange={(enabled) => update(item.id, { enabled })}
                    accessibilityLabel={t(`notificationSchedule.${item.id}`)}
                  />
                </Pressable>
              );
            })}
          </View>

          <View style={styles.frequency}>
            <Text style={styles.label}>
              {t('notificationSchedule.frequency')} · {t(`notificationSchedule.${selected.id}`)}
            </Text>
            <View style={styles.chips}>
              {FREQUENCIES.map((frequency) => {
                const active = selected.frequency === frequency;
                return (
                  <TouchableOpacity
                    key={frequency}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => chooseFrequency(frequency)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {t(`notificationSchedule.${frequency}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selected.frequency === 'custom' && (
              <View style={styles.days}>
                {ALL_DAYS.map((day) => {
                  const on = selected.days.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.day, on && styles.dayActive]}
                      onPress={() => toggleDay(day)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={dayName(day, i18n.language, 'short')}
                    >
                      <Text style={[styles.dayText, on && styles.dayTextActive]}>{dayName(day, i18n.language, 'narrow')}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.save} onPress={save} disabled={saving} accessibilityRole="button">
            <Text style={styles.saveText}>{t('notificationSchedule.save')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
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
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.hairline,
  },
  title: {
    marginTop: 4,
    fontSize: 22,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontSize: 14.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  rowTitleSelected: {
    color: Theme.colors.magenta, // the row whose Frequency is being edited
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12.5,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkFaint,
  },
  frequency: {
    gap: 10,
  },
  label: {
    fontSize: 12.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  chipActive: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.magentaTint,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.inkSoft,
  },
  chipTextActive: {
    color: Theme.colors.magenta,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  dayActive: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.magenta,
  },
  dayText: {
    fontSize: 13,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.inkSoft,
  },
  dayTextActive: {
    color: Theme.colors.surface,
  },
  save: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 15,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.surface,
  },
});
