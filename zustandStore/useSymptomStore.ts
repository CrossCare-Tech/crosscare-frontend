import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

type SymptomSeverity = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

interface Symptom {
  id: string;
  date: string;
  symptomType: string;
  severity: SymptomSeverity;
  bodyLocation?: string;
  duration?: number;
  notes?: string;
  occurredAt: string;
}

interface SymptomSummary {
  totalSymptoms: number;
  symptomCounts: Record<string, number>;
  mostCommon: string | null;
}

// Common pregnancy symptoms
export const SYMPTOM_TYPES = [
  { id: 'nausea', label: 'Nausea', icon: '🤢' },
  { id: 'headache', label: 'Headache', icon: '🤕' },
  { id: 'fatigue', label: 'Fatigue', icon: '😴' },
  { id: 'back_pain', label: 'Back Pain', icon: '🔙' },
  { id: 'swelling', label: 'Swelling', icon: '🦶' },
  { id: 'cramping', label: 'Cramping', icon: '💫' },
  { id: 'heartburn', label: 'Heartburn', icon: '🔥' },
  { id: 'dizziness', label: 'Dizziness', icon: '💫' },
  { id: 'mood_swings', label: 'Mood Swings', icon: '🎭' },
  { id: 'insomnia', label: 'Insomnia', icon: '🌙' },
  { id: 'breast_tenderness', label: 'Breast Tenderness', icon: '💗' },
  { id: 'constipation', label: 'Constipation', icon: '🚽' },
];

interface SymptomState {
  // State
  symptoms: Symptom[];
  summary: SymptomSummary | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  fetchSymptoms: (userId: string, days?: number) => Promise<void>;
  logSymptom: (userId: string, data: {
    symptomType: string;
    severity?: SymptomSeverity;
    bodyLocation?: string;
    duration?: number;
    notes?: string;
    date?: string;
  }) => Promise<boolean>;
  deleteSymptom: (userId: string, symptomId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useSymptomStore = create<SymptomState>()(
  persist(
    (set, get) => ({
      // Initial state
      symptoms: [],
      summary: null,
      isLoading: false,
      error: null,
      lastUpdated: null,

      clearError: () => set({ error: null }),

      fetchSymptoms: async (userId: string, days = 7) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `${API_URL}/api/user/metrics/${userId}/symptoms?days=${days}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch symptoms');
          }

          const data = await response.json();

          set({
            symptoms: data.symptoms || [],
            summary: data.summary || null,
            isLoading: false,
            lastUpdated: new Date().toISOString(),
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      logSymptom: async (userId, symptomData) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `${API_URL}/api/user/metrics/${userId}/symptom`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(symptomData),
            }
          );

          if (!response.ok) {
            throw new Error('Failed to log symptom');
          }

          set({ isLoading: false, lastUpdated: new Date().toISOString() });

          // Refresh symptoms list
          get().fetchSymptoms(userId);

          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
          return false;
        }
      },

      deleteSymptom: async (userId, symptomId) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `${API_URL}/api/user/metrics/${userId}/symptom/${symptomId}`,
            {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to delete symptom');
          }

          // Remove from local state
          set((state) => ({
            symptoms: state.symptoms.filter((s) => s.id !== symptomId),
            isLoading: false,
          }));

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
      name: 'symptom-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        symptoms: state.symptoms,
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

export default useSymptomStore;
