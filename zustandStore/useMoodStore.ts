import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildApiCandidates } from '../constants/api';

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

const parseResponseBody = async (response: Response) => {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    if (raw.trim().startsWith("<")) {
      return { message: "Server returned HTML instead of JSON. Check deployed backend route/version." };
    }
    return { message: "Invalid JSON response from server." };
  }
};

const moodBaseEndpoints = (userId: string) =>
  Array.from(
    new Set([
      ...buildApiCandidates(`/api/user/metrics/${userId}/mood`),
      ...buildApiCandidates(`/api/user/activity/${userId}/mood`),
    ])
  );

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

      fetchMoodHistory: async (userId: string, days = 7, token?: string | null) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          let data: any = null;
          let resolved = false;
          let lastError: Error | null = null;
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          };
          if (token) headers.Authorization = `Bearer ${token}`;

          for (const base of moodBaseEndpoints(userId)) {
            const response = await fetch(`${base}?days=${days}`, {
              method: 'GET',
              headers,
            });
            const body = await parseResponseBody(response);

            if (response.ok) {
              data = body || {};
              resolved = true;
              break;
            }

            lastError = new Error(body?.message || `Failed to fetch mood history (${response.status})`);
          }

          if (!resolved) {
            throw lastError || new Error('Failed to fetch mood history');
          }

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

      logMood: async (userId, moodData, token?: string | null) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          let resolved = false;
          let lastError: Error | null = null;
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          };
          if (token) headers.Authorization = `Bearer ${token}`;

          for (const endpoint of moodBaseEndpoints(userId)) {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify(moodData),
            });
            const body = await parseResponseBody(response);

            if (response.ok) {
              resolved = true;
              break;
            }

            lastError = new Error(body?.message || `Server error: ${response.status}`);
          }

          if (!resolved) {
            throw lastError || new Error('Failed to log mood. Endpoint not found.');
          }

          // Update local state
          if (moodData.moodLevel) set({ currentMood: moodData.moodLevel });
          if (moodData.stressLevel) set({ currentStress: moodData.stressLevel });
          if (moodData.anxietyLevel) set({ currentAnxiety: moodData.anxietyLevel });
          if (moodData.energyLevel) set({ currentEnergy: moodData.energyLevel });

          set({ isLoading: false, lastUpdated: new Date().toISOString() });

          // Refresh history
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
          const endpoints = moodBaseEndpoints(userId).map((base) => `${base}/${activityId}`);
          let resolved = false;
          let lastError: Error | null = null;
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          };
          if (token) headers.Authorization = `Bearer ${token}`;

          for (const endpoint of endpoints) {
            const response = await fetch(endpoint, {
              method: 'PUT',
              headers,
              body: JSON.stringify(moodData),
            });
            const body = await parseResponseBody(response);

            if (response.ok) {
              resolved = true;
              break;
            }

            lastError = new Error(body?.message || `Server error: ${response.status}`);
          }

          if (!resolved) {
            throw lastError || new Error('Failed to update mood. Endpoint not found.');
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
          const endpoints = moodBaseEndpoints(userId).map((base) => `${base}/${activityId}`);
          let resolved = false;
          let lastError: Error | null = null;
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          };
          if (token) headers.Authorization = `Bearer ${token}`;

          for (const endpoint of endpoints) {
            const response = await fetch(endpoint, {
              method: 'DELETE',
              headers,
            });
            const body = await parseResponseBody(response);

            if (response.ok) {
              resolved = true;
              break;
            }

            lastError = new Error(body?.message || `Server error: ${response.status}`);
          }

          if (!resolved) {
            throw lastError || new Error('Failed to delete mood. Endpoint not found.');
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
