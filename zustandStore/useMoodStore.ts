import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

type MoodLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

interface MoodEntry {
  id: string;
  date: string;
  day: string;
  moodLevel: MoodLevel;
  stressLevel?: number;
  anxietyLevel?: number;
  energyLevel?: number;
  notes?: string;
}

interface MoodSummary {
  totalEntries: number;
  averageStress: string | null;
  averageEnergy: string | null;
}

interface MoodState {
  // State
  currentMood: MoodLevel | null;
  currentStress: number;
  currentAnxiety: number;
  currentEnergy: number;
  moodHistory: MoodEntry[];
  summary: MoodSummary | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  setCurrentMood: (mood: MoodLevel) => void;
  setStressLevel: (level: number) => void;
  setAnxietyLevel: (level: number) => void;
  setEnergyLevel: (level: number) => void;
  fetchMoodHistory: (userId: string, days?: number) => Promise<void>;
  logMood: (userId: string, data: {
    moodLevel?: MoodLevel;
    stressLevel?: number;
    anxietyLevel?: number;
    energyLevel?: number;
    notes?: string;
  }) => Promise<boolean>;
  clearError: () => void;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentMood: null,
      currentStress: 5,
      currentAnxiety: 5,
      currentEnergy: 5,
      moodHistory: [],
      summary: null,
      isLoading: false,
      error: null,
      lastUpdated: null,

      // Actions
      setCurrentMood: (mood) => set({ currentMood: mood }),
      setStressLevel: (level) => set({ currentStress: level }),
      setAnxietyLevel: (level) => set({ currentAnxiety: level }),
      setEnergyLevel: (level) => set({ currentEnergy: level }),
      clearError: () => set({ error: null }),

      fetchMoodHistory: async (userId: string, days = 7) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `${API_URL}/api/user/metrics/${userId}/mood?days=${days}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch mood history');
          }

          const data = await response.json();

          set({
            moodHistory: data.moodHistory || [],
            summary: data.summary || null,
            isLoading: false,
            lastUpdated: new Date().toISOString(),
          });

          // Update current mood from today's entry if exists
          const today = new Date().toISOString().split('T')[0];
          const todayEntry = data.moodHistory?.find((m: MoodEntry) => m.date === today);
          if (todayEntry) {
            set({
              currentMood: todayEntry.moodLevel,
              currentStress: todayEntry.stressLevel || 5,
              currentAnxiety: todayEntry.anxietyLevel || 5,
              currentEnergy: todayEntry.energyLevel || 5,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      logMood: async (userId, moodData) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `${API_URL}/api/user/metrics/${userId}/mood`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(moodData),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server error: ${response.status}`);
          }

          const result = await response.json();

          // Update local state
          if (moodData.moodLevel) set({ currentMood: moodData.moodLevel });
          if (moodData.stressLevel) set({ currentStress: moodData.stressLevel });
          if (moodData.anxietyLevel) set({ currentAnxiety: moodData.anxietyLevel });
          if (moodData.energyLevel) set({ currentEnergy: moodData.energyLevel });

          set({ isLoading: false, lastUpdated: new Date().toISOString() });

          // Refresh history
          get().fetchMoodHistory(userId);

          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
          return false;
        }
      },
    }),
    {
      name: 'mood-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentMood: state.currentMood,
        currentStress: state.currentStress,
        currentAnxiety: state.currentAnxiety,
        currentEnergy: state.currentEnergy,
        moodHistory: state.moodHistory,
        summary: state.summary,
        lastUpdated: state.lastUpdated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.error = null;
        }
      },
    }
  )
);

export default useMoodStore;
