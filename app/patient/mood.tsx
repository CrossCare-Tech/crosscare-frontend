import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { useMoodStore } from '@/zustandStore/useMoodStore';
import Slider from '@react-native-community/slider';

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
  } = useMoodStore();

  const [localStress, setLocalStress] = useState(currentStress);
  const [localEnergy, setLocalEnergy] = useState(currentEnergy);

  useEffect(() => {
    if (userId) {
      fetchMoodHistory(userId);
    }
  }, [userId]);

  useEffect(() => {
    setLocalStress(currentStress);
    setLocalEnergy(currentEnergy);
  }, [currentStress, currentEnergy]);

  const handleMoodSelect = async (moodLevel: MoodLevel) => {
    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    setCurrentMood(moodLevel);
    const success = await logMood(userId, {
      moodLevel,
      stressLevel: localStress,
      energyLevel: localEnergy,
    });

    if (success) {
      Alert.alert('Success', 'Mood logged successfully!');
    } else {
      Alert.alert('Error', 'Failed to log mood. Please try again.');
    }
  };

  const handleSaveMetrics = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    const success = await logMood(userId, {
      stressLevel: localStress,
      energyLevel: localEnergy,
    });

    if (success) {
      Alert.alert('Success', 'Stress and energy levels saved!');
    } else {
      const storeError = useMoodStore.getState().error;
      Alert.alert('Error', `Failed to save metrics: ${storeError || 'Unknown error'}`);
    }
  };

  const getMoodEmoji = (level: MoodLevel | null): string => {
    const mood = MOOD_OPTIONS.find((m) => m.level === level);
    return mood?.emoji || '😐';
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
            <Text style={styles.saveButtonText}>Save Stress & Energy</Text>
          )}
        </TouchableOpacity>

        {/* History Section */}
        <Text style={styles.sectionTitle}>Recent Moods</Text>
        {moodHistory.length > 0 ? (
          <View style={styles.historyContainer}>
            {moodHistory.slice(0, 7).map((entry, index) => (
              <View key={entry.id || index} style={styles.historyItem}>
                <Text style={styles.historyDate}>{entry.day}</Text>
                <Text style={styles.historyEmoji}>{getMoodEmoji(entry.moodLevel)}</Text>
                {entry.stressLevel && (
                  <Text style={styles.historyMetric}>S: {entry.stressLevel}</Text>
                )}
                {entry.energyLevel && (
                  <Text style={styles.historyMetric}>E: {entry.energyLevel}</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>No mood data yet. Start tracking!</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  historyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
  },
  historyItem: {
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  historyEmoji: {
    fontSize: 24,
  },
  historyMetric: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
});
