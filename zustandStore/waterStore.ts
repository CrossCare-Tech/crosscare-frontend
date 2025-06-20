import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "@/constants/config";

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split("T")[0];

interface WaterStore {
  glassCount: number;
  maxGlasses: number;
  lastAccessedDate: string | null;
  baseUrl: string;

  // Actions
  setGlassCount: (count: number) => void;
  setMaxGlasses: (max: number) => void;
  setLastAccessedDate: (date: string) => void;
  fetchUserGoals: (userId: string) => Promise<void>;
  checkAndResetForNewDay: () => void; // New action to check and reset for new day
  resetDailyProgress: () => void; // New action to manually reset daily progress
}

export const useWaterStore = create<WaterStore>()(
  persist(
    (set, get) => ({
      baseUrl: `${CONFIG.API_BASE_URL}`,
      glassCount: 0,
      maxGlasses: 0,
      lastAccessedDate: null,

      // New action to check and reset for new day
      checkAndResetForNewDay: () => {
        const today = getTodayDate();
        const lastDate = get().lastAccessedDate;

        console.log(
          "💧 Checking water date change - Today:",
          today,
          "Last accessed:",
          lastDate
        );

        if (!lastDate || lastDate !== today) {
          console.log("💧 New day detected! Resetting water progress...");

          // Reset daily progress but keep the goal
          const currentGoal = get().maxGlasses;

          set({
            glassCount: 0, // Reset daily water intake
            maxGlasses: currentGoal, // Persist the goal
            lastAccessedDate: today,
          });

          console.log(
            "✅ Water daily progress reset completed. Goal preserved:",
            currentGoal
          );
        } else {
          console.log("💧 Same day - no water reset needed");
        }
      },

      // Action to manually reset daily progress
      resetDailyProgress: () => {
        const currentGoal = get().maxGlasses;
        const today = getTodayDate();

        set({
          glassCount: 0, // Reset daily water intake
          maxGlasses: currentGoal, // Preserve the goal
          lastAccessedDate: today,
        });

        console.log(
          "🔄 Manual water daily progress reset completed. Goal preserved:",
          currentGoal
        );
      },

      setGlassCount: (count) => {
        // Check for new day before setting glass count
        get().checkAndResetForNewDay();

        set({
          glassCount: Number(count),
          lastAccessedDate: getTodayDate(),
        });
      },

      setMaxGlasses: (max) => {
        set({
          maxGlasses: Number(max),
          lastAccessedDate: getTodayDate(),
        });
      },

      setLastAccessedDate: (date) => set({ lastAccessedDate: date }),

      fetchUserGoals: async (userId: string) => {
        // Check for new day before fetching goals
        get().checkAndResetForNewDay();

        try {
          const response = await fetch(
            `${get().baseUrl}/api/user/activity/${userId}/goals`
          );
          const data = await response.json();

          // Only update maxGlasses if we don't have a goal set or if the API returns a different goal
          const currentGoal = get().maxGlasses;
          const apiGoal = data.waterGoal;

          set({
            maxGlasses: apiGoal || currentGoal, // Use API goal or preserve current
            lastAccessedDate: getTodayDate(),
          });

          console.log("💧 Water goals fetched successfully:", data);
        } catch (error) {
          console.error("💧 Error fetching water goals:", error);
        }
      },
    }),
    {
      name: "water-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Ensure values are numbers when rehydrating from storage
        if (state) {
          state.glassCount = Number(state.glassCount);
          state.maxGlasses = Number(state.maxGlasses);

          // Check for new day immediately after rehydration
          state.checkAndResetForNewDay();
        }
      },
      partialize: (state) => ({
        glassCount: state.glassCount, // This will be reset on new day
        maxGlasses: state.maxGlasses, // This will persist
        lastAccessedDate: state.lastAccessedDate, // Track last access
      }),
    }
  )
);
