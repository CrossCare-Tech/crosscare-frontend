import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface WaterStore {
  glassCount: number
  maxGlasses: number
  lastAccessedDate: string | null
  baseUrl: string;

  setGlassCount: (count: number) => void
  setMaxGlasses: (max: number) => void
  setLastAccessedDate: (date: string) => void
  fetchUserGoals: (userId: string) => Promise<void>;
}

export const useWaterStore = create<WaterStore>()(
    persist(
      (set, get) => ({
        baseUrl: 'https://crosscare-backends.onrender.com',
        glassCount: 0,
        maxGlasses: 0,
        lastAccessedDate: null,
        
        setGlassCount: (count) => set({ glassCount: Number(count) }),
        setMaxGlasses: (max) => set({ maxGlasses: Number(max) }),
        setLastAccessedDate: (date) => set({ lastAccessedDate: date }),
        fetchUserGoals: async (userId: string) => {
          const response = await fetch(`${get().baseUrl}/user/activity/${userId}/goals`);
          const data = await response.json();
          set({ maxGlasses: data.waterGoal });
        }
      }),
      {
        name: 'water-storage', // unique name for this storage
        storage: createJSONStorage(() => AsyncStorage), // Use AsyncStorage for React Native
        onRehydrateStorage: () => (state) => {
            // Ensure values are numbers when rehydrating from storage
            if (state) {
              state.glassCount = Number(state.glassCount);
              state.maxGlasses = Number(state.maxGlasses);
            }
        }
      }
    )
  )