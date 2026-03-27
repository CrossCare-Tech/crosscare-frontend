import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { useMoodStore } from '@/zustandStore/useMoodStore';
import Slider from '@react-native-community/slider';
import { Calendar, DateData } from 'react-native-calendars';

type MoodLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

const MOOD_OPTIONS: { level: MoodLevel; emoji: string; label: string; color: string }[] = [
  { level: 'VERY_LOW', emoji: '😢', label: 'Very Low', color: '#E74C3C' },
  { level: 'LOW', emoji: '😔', label: 'Low', color: '#E67E22' },
  { level: 'MODERATE', emoji: '😐', label: 'Okay', color: '#F1C40F' },
  { level: 'HIGH', emoji: '😊', label: 'Good', color: '#2ECC71' },
  { level: 'VERY_HIGH', emoji: '😄', label: 'Great', color: '#27AE60' },
];

export default function MoodScreen() {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;

  const {
    currentMood,
    currentStress,
    currentEnergy,
    moodHistory,
    isLoading,
    error,
    setCurrentMood,
    setStressLevel,
    setEnergyLevel,
    fetchMoodHistory,
    logMood,
    updateMood,
    deleteMood,
  } = useMoodStore();

  const [localStress, setLocalStress] = useState(currentStress);
  const [localEnergy, setLocalEnergy] = useState(currentEnergy);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editMood, setEditMood] = useState<MoodLevel | null>(null);
  const [editStress, setEditStress] = useState(5);
  const [editEnergy, setEditEnergy] = useState(5);

  useEffect(() => {
    if (userId) {
      fetchMoodHistory(userId, 30);
    }
  }, [userId]);

  const getMoodColor = (level: MoodLevel): string => {
    const mood = MOOD_OPTIONS.find((m) => m.level === level);
    return mood?.color || '#999';
  };

  const calendarMarks = useMemo(() => {
    const marks: Record<string, any> = {};
    moodHistory.forEach((entry) => {
      marks[entry.date] = {
        marked: true,
        dotColor: getMoodColor(entry.moodLevel),
        selected: entry.date === selectedDate,
        selectedColor: getMoodColor(entry.moodLevel) + '30',
        selectedTextColor: '#333',
      };
    });
    return marks;
  }, [moodHistory, selectedDate]);

  const selectedEntry = useMemo(() => {
    if (!selectedDate) return null;
    return moodHistory.find((entry) => entry.date === selectedDate) || null;
  }, [moodHistory, selectedDate]);

  useEffect(() => {
    setLocalStress(currentStress);
    setLocalEnergy(currentEnergy);
  }, [currentStress, currentEnergy]);

  const handleMoodSelect = (moodLevel: MoodLevel) => {
    setCurrentMood(moodLevel);
  };

  const handleSaveMetrics = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    if (!currentMood) {
      Alert.alert('Error', 'Please select a mood first.');
      return;
    }

    const success = await logMood(userId, {
      moodLevel: currentMood,
      stressLevel: localStress,
      energyLevel: localEnergy,
    });

    if (success) {
      Alert.alert('Success', 'Mood logged successfully!');
    } else {
      Alert.alert('Error', 'Failed to log mood. Please try again.');
    }
  };

  const getMoodEmoji = (level: MoodLevel | null): string => {
    const mood = MOOD_OPTIONS.find((m) => m.level === level);
    return mood?.emoji || '😐';
  };

  const handleEditPress = () => {
    if (!selectedEntry) return;
    setEditMood(selectedEntry.moodLevel);
    setEditStress(selectedEntry.stressLevel || 5);
    setEditEnergy(selectedEntry.energyLevel || 5);
    setEditModalVisible(true);
  };

  const handleEditSave = async () => {
    if (!userId || !selectedEntry || !editMood) return;

    const success = await updateMood(userId, selectedEntry.id, {
      moodLevel: editMood,
      stressLevel: editStress,
      energyLevel: editEnergy,
    });

    if (success) {
      setEditModalVisible(false);
      Alert.alert('Success', 'Mood updated successfully!');
    } else {
      Alert.alert('Error', 'Failed to update mood. Please try again.');
    }
  };

  const handleDeletePress = () => {
    if (!selectedEntry) return;
    Alert.alert(
      'Delete Mood',
      `Are you sure you want to delete the mood entry for ${selectedEntry.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!userId) return;
            const success = await deleteMood(userId, selectedEntry.id);
            if (success) {
              setSelectedDate(null);
              Alert.alert('Success', 'Mood deleted successfully!');
            } else {
              Alert.alert('Error', 'Failed to delete mood. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mood Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Mood Display */}
        <View style={styles.currentMoodContainer}>
          <Text style={styles.currentMoodEmoji}>{getMoodEmoji(currentMood)}</Text>
          <Text style={styles.currentMoodLabel}>
            {currentMood ? MOOD_OPTIONS.find((m) => m.level === currentMood)?.label : 'How are you feeling?'}
          </Text>
        </View>

        {/* Mood Selection */}
        <Text style={styles.sectionTitle}>Select Your Mood</Text>
        <View style={styles.moodGrid}>
          {MOOD_OPTIONS.map((mood) => (
            <TouchableOpacity
              key={mood.level}
              style={[
                styles.moodOption,
                currentMood === mood.level && { borderColor: mood.color, borderWidth: 3 },
              ]}
              onPress={() => handleMoodSelect(mood.level)}
              disabled={isLoading}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stress Level Slider */}
        <View style={styles.sliderSection}>
          <Text style={styles.sliderLabel}>Stress Level: {localStress}/10</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={localStress}
            onValueChange={setLocalStress}
            minimumTrackTintColor="#E74C3C"
            maximumTrackTintColor="#DDDDDD"
            thumbTintColor="#E74C3C"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderMinMax}>Low</Text>
            <Text style={styles.sliderMinMax}>High</Text>
          </View>
        </View>

        {/* Energy Level Slider */}
        <View style={styles.sliderSection}>
          <Text style={styles.sliderLabel}>Energy Level: {localEnergy}/10</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={localEnergy}
            onValueChange={setLocalEnergy}
            minimumTrackTintColor="#2ECC71"
            maximumTrackTintColor="#DDDDDD"
            thumbTintColor="#2ECC71"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderMinMax}>Low</Text>
            <Text style={styles.sliderMinMax}>High</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveMetrics}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Mood</Text>
          )}
        </TouchableOpacity>

        {/* Mood Calendar */}
        <Text style={styles.sectionTitle}>Mood History</Text>
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={calendarMarks}
            onDayPress={(day: DateData) => {
              setSelectedDate(day.dateString === selectedDate ? null : day.dateString);
            }}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#999',
              selectedDayBackgroundColor: '#5E4FA2',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#5E4FA2',
              dayTextColor: '#333',
              textDisabledColor: '#D9E1E8',
              dotColor: '#5E4FA2',
              arrowColor: '#5E4FA2',
              monthTextColor: '#333',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
        </View>

        {/* Selected Day Detail */}
        {selectedEntry && (
          <View style={styles.dayDetailCard}>
            <Text style={styles.dayDetailEmoji}>{getMoodEmoji(selectedEntry.moodLevel)}</Text>
            <View style={styles.dayDetailInfo}>
              <Text style={styles.dayDetailDate}>{selectedEntry.date}</Text>
              <Text style={styles.dayDetailMood}>
                {MOOD_OPTIONS.find((m) => m.level === selectedEntry.moodLevel)?.label}
              </Text>
              <View style={styles.dayDetailMetrics}>
                {selectedEntry.stressLevel != null && (
                  <Text style={styles.dayDetailMetric}>Stress: {selectedEntry.stressLevel}/10</Text>
                )}
                {selectedEntry.energyLevel != null && (
                  <Text style={styles.dayDetailMetric}>Energy: {selectedEntry.energyLevel}/10</Text>
                )}
              </View>
            </View>
            <View style={styles.dayDetailActions}>
              <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
                <Ionicons name="pencil" size={18} color="#5E4FA2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
                <Ionicons name="trash-outline" size={18} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedDate && !selectedEntry && (
          <Text style={styles.noDataText}>No mood logged on this day</Text>
        )}

        {!selectedDate && moodHistory.length === 0 && (
          <Text style={styles.noDataText}>No mood data yet. Start tracking!</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Mood</Text>

            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map((mood) => (
                <TouchableOpacity
                  key={mood.level}
                  style={[
                    styles.moodOption,
                    editMood === mood.level && { borderColor: mood.color, borderWidth: 3 },
                  ]}
                  onPress={() => setEditMood(mood.level)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sliderSection}>
              <Text style={styles.sliderLabel}>Stress Level: {editStress}/10</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={editStress}
                onValueChange={setEditStress}
                minimumTrackTintColor="#E74C3C"
                maximumTrackTintColor="#DDDDDD"
                thumbTintColor="#E74C3C"
              />
            </View>

            <View style={styles.sliderSection}>
              <Text style={styles.sliderLabel}>Energy Level: {editEnergy}/10</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={editEnergy}
                onValueChange={setEditEnergy}
                minimumTrackTintColor="#2ECC71"
                maximumTrackTintColor="#DDDDDD"
                thumbTintColor="#2ECC71"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleEditSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currentMoodContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    marginBottom: 20,
  },
  currentMoodEmoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  currentMoodLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodOption: {
    width: '18%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  sliderSection: {
    marginBottom: 25,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  sliderMinMax: {
    fontSize: 12,
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#5E4FA2',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  dayDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  dayDetailEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  dayDetailInfo: {
    flex: 1,
  },
  dayDetailDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  dayDetailMood: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  dayDetailMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  dayDetailMetric: {
    fontSize: 13,
    color: '#666',
  },
  dayDetailActions: {
    flexDirection: 'column',
    gap: 10,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EBF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#5E4FA2',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
});
