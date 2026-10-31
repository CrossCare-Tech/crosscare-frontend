import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '@/constants/config';
import { todayDateString } from "@/utils/date";

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
  currentMood: MoodLevel | null;
  currentStress: number;
  currentAnxiety: number;
  currentEnergy: number;
  moodHistory: MoodEntry[];
  summary: MoodSummary | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  setCurrentMood: (mood: MoodLevel) => void;
  setStressLevel: (level: number) => void;
  setAnxietyLevel: (level: number) => void;
  setEnergyLevel: (level: number) => void;
  fetchMoodHistory: (userId: string, days?: number, token?: string | null) => Promise<void>;
  logMood: (userId: string, data: {
    moodLevel?: MoodLevel;
    stressLevel?: number;
    anxietyLevel?: number;
    energyLevel?: number;
    notes?: string;
  }, token?: string | null) => Promise<boolean>;
  updateMood: (userId: string, activityId: string, data: {
    moodLevel?: MoodLevel;
    stressLevel?: number;
    energyLevel?: number;
  }, token?: string | null) => Promise<boolean>;
  deleteMood: (userId: string, activityId: string, token?: string | null) => Promise<boolean>;
  clearError: () => void;
}

const moodEndpoint = (userId: string) =>
  `${CONFIG.API_BASE_URL}/user/activity/${userId}/mood`;

const buildHeaders = (token?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
      currentMood: null,
      currentStress: 5,
      currentAnxiety: 5,
      currentEnergy: 5,
      moodHistory: [],
      summary: null,
      isLoading: false,
      error: null,
      lastUpdated: null,

      setCurrentMood: (mood) => set({ currentMood: mood }),
      setStressLevel: (level) => set({ currentStress: level }),
      setAnxietyLevel: (level) => set({ currentAnxiety: level }),
      setEnergyLevel: (level) => set({ currentEnergy: level }),
      clearError: () => set({ error: null }),

      fetchMoodHistory: async (userId: string, days = 7, token?: string | null) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${moodEndpoint(userId)}?days=${days}`, {
            method: 'GET',
            headers: buildHeaders(token),
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch mood history (${response.status})`);
          }

          const data = await response.json();

          set({
            moodHistory: data.moodHistory || [],
            summary: data.summary || null,
            isLoading: false,
            lastUpdated: new Date().toISOString(),
          });

          const today = todayDateString();
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

      logMood: async (userId, moodData, token?: string | null) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(moodEndpoint(userId), {
            method: 'POST',
            headers: buildHeaders(token),
            body: JSON.stringify(moodData),
          });

          if (!response.ok) {
            throw new Error(`Failed to log mood (${response.status})`);
          }

          if (moodData.moodLevel) set({ currentMood: moodData.moodLevel });
          if (moodData.stressLevel) set({ currentStress: moodData.stressLevel });
          if (moodData.anxietyLevel) set({ currentAnxiety: moodData.anxietyLevel });
          if (moodData.energyLevel) set({ currentEnergy: moodData.energyLevel });

          set({ isLoading: false, lastUpdated: new Date().toISOString() });

          get().fetchMoodHistory(userId, 30, token);

          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
          return false;
        }
      },

      updateMood: async (userId, activityId, moodData, token?: string | null) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${moodEndpoint(userId)}/${activityId}`, {
            method: 'PUT',
            headers: buildHeaders(token),
            body: JSON.stringify(moodData),
          });

          if (!response.ok) {
            throw new Error(`Failed to update mood (${response.status})`);
          }

          set({ isLoading: false });
          get().fetchMoodHistory(userId, 30, token);
          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
          return false;
        }
      },

      deleteMood: async (userId, activityId, token?: string | null) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${moodEndpoint(userId)}/${activityId}`, {
            method: 'DELETE',
            headers: buildHeaders(token),
          });

          if (!response.ok) {
            throw new Error(`Failed to delete mood (${response.status})`);
          }

          set({ isLoading: false });
          get().fetchMoodHistory(userId, 30, token);
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
