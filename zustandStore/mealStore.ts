import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { devtools } from "zustand/middleware";
import { Platform } from "react-native";
import { CONFIG } from "@/constants/config";
import { todayDateString } from "@/utils/date";

// Type definitions
export type FoodClassification = "GOOD" | "BAD";

export interface FoodItem {
  id?: string;
  name: string;
  portion: string;
  quantity?: number;
  calories: number;
  classification: FoodClassification;
}

export interface Meal {
  id?: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  totalCalories: number;
  foodItemsCount: number;
  isSavedAsMeal: boolean;
  foodItems: FoodItem[];
}

interface DataItem {
  day: string;
  calories: number;
  date: string;
}

export interface MealProgress {
  calorieGoal: number;
  caloriesConsumed: number;
  goodFoodCount: number;
  badFoodCount: number;
}

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => todayDateString();

// Helper function to normalize meal type
const normalizeMealType = (
  mealType: string
): "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" => {
  const type = mealType.toUpperCase();
  if (["BREAKFAST", "LUNCH", "DINNER", "SNACK"].includes(type)) {
    return type as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  }
  return "BREAKFAST";
};

// Interface for the store
interface MealStore extends MealProgress {
  meals: {
    BREAKFAST: Meal[];
    LUNCH: Meal[];
    DINNER: Meal[];
    SNACK: Meal[];
  };

  isLoading: boolean;
  error: string | null;
  baseUrl: string;
  chartData: DataItem[];
  currentTimeRange: string;
  selectedDate: string;
  lastAccessedDate: string | null; // Track last accessed date

  // Actions
  checkAndResetForNewDay: () => void; // New action to check and reset daily data
  fetchMeals: (userId: string) => Promise<void>;
  fetchMealsForDate: (userId: string, date: string) => Promise<void>;
  updateCalorieGoal: (
    userId: string,
    goal: number,
    date?: string
  ) => Promise<boolean>;
  addFoodItem: (
    userId: string,
    mealType: string,
    foodItem: FoodItem,
    date?: string
  ) => Promise<boolean>;
  deleteFoodItem: (
    userId: string,
    mealId: string,
    foodItemId: string
  ) => Promise<boolean>;
  updateFoodItemQuantity: (
    userId: string,
    mealId: string,
    foodItemId: string,
    quantity: number
  ) => Promise<boolean>;
  getFoodQualityRatio: () => { goodRatio: number; badRatio: number };
  resetState: () => void;
  fetchCalorieHistory: (userId: string, timeRange?: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  fetchUserGoals: (userId: string) => Promise<void>;
  resetDailyProgress: () => void; // New action to reset daily progress
}

export const useMealStore = create<MealStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        calorieGoal: 2000, // Default goal of 10
        caloriesConsumed: 0,
        goodFoodCount: 0,
        badFoodCount: 0,
        selectedDate: getTodayDate(),
        lastAccessedDate: null, // Track when the store was last accessed
        meals: {
          BREAKFAST: [],
          LUNCH: [],
          DINNER: [],
          SNACK: [],
        },
        isLoading: false,
        error: null,
        baseUrl:
          Platform.OS === "android"
            ? `${CONFIG.API_BASE_URL}`
            : `${CONFIG.API_BASE_URL}`,
        chartData: [],
        currentTimeRange: "week",

        // New action to check and reset for new day
        checkAndResetForNewDay: () => {
          const today = getTodayDate();
          const lastDate = get().lastAccessedDate;

          console.log(
            "🔍 Checking date change - Today:",
            today,
            "Last accessed:",
            lastDate
          );

          if (!lastDate || lastDate !== today) {
            console.log("📅 New day detected! Resetting daily progress...");

            // Reset daily progress but keep the goal
            const currentGoal = get().calorieGoal;

            set({
              caloriesConsumed: 0,
              goodFoodCount: 0,
              badFoodCount: 0,
              meals: {
                BREAKFAST: [],
                LUNCH: [],
                DINNER: [],
                SNACK: [],
              },
              selectedDate: today,
              lastAccessedDate: today,
              calorieGoal: currentGoal || 2000, // Preserve the goal, use default of 0 if none exists
            });

            console.log(
              "✅ Daily progress reset completed. Goal preserved:",
              currentGoal || 2000
            );
          } else {
            console.log("📊 Same day - no reset needed");
          }
        },

        // Action to manually reset daily progress
        resetDailyProgress: () => {
          const currentGoal = get().calorieGoal;
          const today = getTodayDate();

          set({
            caloriesConsumed: 0,
            goodFoodCount: 0,
            badFoodCount: 0,
            meals: {
              BREAKFAST: [],
              LUNCH: [],
              DINNER: [],
              SNACK: [],
            },
            selectedDate: today,
            lastAccessedDate: today,
            calorieGoal: currentGoal || 2000, // Preserve the goal, use default of 10 if none exists
          });

          console.log(
            "🔄 Manual daily progress reset completed. Goal preserved:",
            currentGoal || 2000
          );
        },

        setSelectedDate: (date: string) => {
          set({
            selectedDate: date,
            lastAccessedDate: getTodayDate(), // Update last accessed when date changes
          });
        },

        fetchMeals: async (userId: string) => {
          if (!userId) {
            console.error("Cannot fetch meals: User ID is required");
            return;
          }

          // Check for new day before fetching
          get().checkAndResetForNewDay();

          set({ isLoading: true, error: null });

          try {
            const response = await fetch(
              `${get().baseUrl}/user/activity/${userId}/foodItem`
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch meals: ${response.status}`);
            }

            const data = await response.json();
            console.log(
              "Meals calorie goal fetched successfully:",
              data.calorieGoal
            );

            // Update state with fetched data
            // Only update the goal if API returns one AND it's not zero
            const currentGoal = get().calorieGoal;
            const apiGoal = data.calorieGoal;
            const newGoal = apiGoal > 0 ? apiGoal : currentGoal || 2000;

            set({
              calorieGoal: newGoal, // Use API goal if valid, otherwise keep current or use default
              caloriesConsumed: data.caloriesConsumed || 0,
              goodFoodCount: data.goodFoodCount || 0,
              badFoodCount: data.badFoodCount || 0,
              meals: {
                BREAKFAST: data.meals?.BREAKFAST || [],
                LUNCH: data.meals?.LUNCH || [],
                DINNER: data.meals?.DINNER || [],
                SNACK: data.meals?.SNACK || [],
              },
              isLoading: false,
              lastAccessedDate: getTodayDate(), // Update last accessed
            });

            console.log("Meals fetched successfully:", data);
          } catch (error) {
            console.error("Error fetching meals:", error);
            set({
              isLoading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error fetching meals",
            });
          }
        },

        fetchMealsForDate: async (userId: string, date: string) => {
          if (!userId || !date) {
            console.error(
              "Cannot fetch meals for date: User ID and date are required"
            );
            return;
          }

          // Only reset if we're fetching data for today and it's a new day
          if (date === getTodayDate()) {
            get().checkAndResetForNewDay();
          }

          set({ isLoading: true, error: null });

          try {
            const response = await fetch(
              `${get().baseUrl}/user/activity/${userId}/foodItem?date=${date}`
            );

            if (!response.ok) {
              throw new Error(
                `Failed to fetch meals for date: ${response.status}`
              );
            }

            const data = await response.json();

            // Only update the goal if API returns one AND it's not zero
            const currentGoal = get().calorieGoal;
            const apiGoal = data.calorieGoal;
            const newGoal = apiGoal > 0 ? apiGoal : currentGoal || 2000;

            // Update state with fetched data for the specific date
            set({
              calorieGoal: newGoal, // Use API goal if valid, otherwise keep current or use default
              caloriesConsumed: data.caloriesConsumed || 0,
              goodFoodCount: data.goodFoodCount || 0,
              badFoodCount: data.badFoodCount || 0,
              meals: {
                BREAKFAST: data.meals?.BREAKFAST || [],
                LUNCH: data.meals?.LUNCH || [],
                DINNER: data.meals?.DINNER || [],
                SNACK: data.meals?.SNACK || [],
              },
              isLoading: false,
              lastAccessedDate: getTodayDate(), // Update last accessed
            });

            console.log("Meals for date fetched successfully:", data);
          } catch (error) {
            console.error("Error fetching meals for date:", error);
            set({
              isLoading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error fetching meals for date",
            });
          }
        },

        updateCalorieGoal: async (
          userId: string,
          goal: number,
          date?: string
        ) => {
          if (!userId) {
            console.error("Cannot update calorie goal: User ID is required");
            return false;
          }

          set({ isLoading: true, error: null });

          try {
            const targetDate = date || get().selectedDate;
            const response = await fetch(
              `${get().baseUrl}/user/activity/${userId}/caloriesGoal`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  calorieGoal: goal,
                  date: targetDate,
                }),
              }
            );

            if (!response.ok) {
              throw new Error(
                `Failed to update calorie goal: ${response.status}`
              );
            }

            const data = await response.json();

            // Always update the goal regardless of date - goals should persist
            set({
              calorieGoal: goal,
              isLoading: false,
              lastAccessedDate: getTodayDate(),
            });

            console.log(
              "Calorie goal updated successfully for date:",
              targetDate
            );
            return true;
          } catch (error) {
            console.error("Error updating calorie goal:", error);
            set({
              isLoading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error updating calorie goal",
            });
            return false;
          }
        },

        addFoodItem: async (
          userId: string,
          mealType: string,
          foodItem: FoodItem,
          date?: string
        ) => {
          if (!userId) {
            console.error("Cannot add food item: User ID is required");
            return false;
          }

          const normalizedMealType = normalizeMealType(mealType);

          set({ isLoading: true, error: null });

          try {
            const targetDate = date || get().selectedDate;
            const response = await fetch(
              `${get().baseUrl}/user/activity/${userId}/foodItem`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  mealType: normalizedMealType,
                  name: foodItem.name,
                  portion: foodItem.portion,
                  calories: foodItem.calories,
                  classification: foodItem.classification,
                  quantity: foodItem.quantity || 1,
                  date: targetDate,
                }),
              }
            );

            if (!response.ok) {
              throw new Error(`Failed to add food item: ${response.status}`);
            }

            const data = await response.json();

            // Only update local state if we're adding to the currently viewed date
            if (targetDate === get().selectedDate) {
              if (data.dailyProgress) {
                set({
                  caloriesConsumed: data.dailyProgress.caloriesConsumed || 0,
                  goodFoodCount: data.dailyProgress.goodFoodCount || 0,
                  badFoodCount: data.dailyProgress.badFoodCount || 0,
                  isLoading: false,
                  lastAccessedDate: getTodayDate(),
                });
              } else {
                set({
                  isLoading: false,
                  lastAccessedDate: getTodayDate(),
                });
              }

              await get().fetchMealsForDate(userId, targetDate);
            } else {
              set({
                isLoading: false,
                lastAccessedDate: getTodayDate(),
              });
            }

            console.log("Food item added successfully for date:", targetDate);
            return true;
          } catch (error) {
            console.error("Error adding food item:", error);
            set({
              isLoading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error adding food item",
            });
            return false;
          }
        },

        deleteFoodItem: async (
          userId: string,
          mealId: string,
          foodItemId: string
        ) => {
          if (!userId || !mealId || !foodItemId) {
            console.error("Cannot delete food item: Missing required IDs");
            return false;
          }

          set({ isLoading: true, error: null });

          try {
            const response = await fetch(
              `${
                get().baseUrl
              }/user/${userId}/meals/${mealId}/fooditems/${foodItemId}`,
              {
                method: "DELETE",
              }
            );

            if (!response.ok) {
              throw new Error(`Failed to delete food item: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
              throw new Error(data.error || "Unknown error deleting food item");
            }

            set({
              caloriesConsumed: data.dailyProgress.caloriesConsumed,
              goodFoodCount: data.dailyProgress.goodFoodCount,
              badFoodCount: data.dailyProgress.badFoodCount,
              isLoading: false,
              lastAccessedDate: getTodayDate(),
            });

            await get().fetchMeals(userId);

            console.log("Food item deleted successfully:", data);
            return true;
          } catch (error) {
            console.error("Error deleting food item:", error);
            set({
              isLoading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error deleting food item",
            });
            return false;
          }
        },

        getFoodQualityRatio: () => {
          const { goodFoodCount, badFoodCount } = get();
          const total = goodFoodCount + badFoodCount;

          if (total === 0) {
            return { goodRatio: 0.5, badRatio: 0.5 };
          }

          return {
            goodRatio: goodFoodCount / total,
            badRatio: badFoodCount / total,
          };
        },

        resetState: () => {
          const today = getTodayDate();
          set({
            calorieGoal: 0,
            caloriesConsumed: 0,
            goodFoodCount: 0,
            badFoodCount: 0,
            meals: {
              BREAKFAST: [],
              LUNCH: [],
              DINNER: [],
              SNACK: [],
            },
            isLoading: false,
            error: null,
            selectedDate: today,
            lastAccessedDate: today,
          });
        },

        fetchCalorieHistory: async (
          userId: string,
          timeRange: string = "week"
        ) => {
          if (!userId) {
            console.error("Cannot fetch calorie history: User ID is required");
            return;
          }

          set({ isLoading: true, error: null });

          try {
            const response = await fetch(
              `${
                get().baseUrl
              }/user/activity/${userId}/calorieHistory?timeRange=${timeRange}`
            );

            if (!response.ok) {
              throw new Error(
                `Failed to fetch calorie history: ${response.status}`
              );
            }

            const data = await response.json();

            if (data.success) {
              set({
                chartData: data.chartData || [],
                currentTimeRange: timeRange,
                isLoading: false,
                lastAccessedDate: getTodayDate(),
              });
            } else {
              throw new Error(
                data.error || "Unknown error fetching calorie history"
              );
            }

            console.log("Calorie history fetched successfully:", data);
          } catch (error) {
            console.error("Error fetching calorie history:", error);
            set({
              isLoading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error fetching calorie history",
              chartData: [],
            });
          }
        },

        updateFoodItemQuantity: async (
          userId: string,
          mealId: string,
          foodItemId: string,
          quantity: number
        ) => {
          if (!userId || !mealId || !foodItemId) {
            console.error(
              "Cannot update food item quantity: Missing required IDs"
            );
            return false;
          }

          set({ isLoading: true, error: null });

          try {
            const response = await fetch(
              `${
                get().baseUrl
              }/user/${userId}/meals/${mealId}/fooditems/${foodItemId}/quantity`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ quantity }),
              }
            );

            if (!response.ok) {
              throw new Error(
                `Failed to update food item quantity: ${response.status}`
              );
            }

            const data = await response.json();

            if (!data.success) {
              throw new Error(
                data.error || "Unknown error updating food item quantity"
              );
            }

            await get().fetchMeals(userId);

            console.log("Food item quantity updated successfully:", data);
            return true;
          } catch (error) {
            console.error("Error updating food item quantity:", error);
            set({
              isLoading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error updating food item quantity",
            });
            return false;
          }
        },

        fetchUserGoals: async (userId: string) => {
          if (!userId) {
            console.error("Cannot fetch user goals: User ID is required");
            return;
          }

          set({ isLoading: true, error: null });

          try {
            const response = await fetch(
              `${get().baseUrl}/user/activity/${userId}/goals`
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch goals: ${response.status}`);
            }

            const data = await response.json();

            // Only update the goal if API returns one AND it's not zero
            const currentGoal = get().calorieGoal;
            const apiGoal = data.calorieGoal;
            const newGoal = apiGoal > 0 ? apiGoal : currentGoal || 2000;

            set({
              calorieGoal: newGoal, // Use API goal if valid, otherwise keep current or use default
              isLoading: false,
              lastAccessedDate: getTodayDate(),
            });

            console.log("User goals fetched successfully:", data);
          } catch (error) {
            console.error("Error fetching user goals:", error);
            set({
              isLoading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error fetching goals",
            });
          }
        },
      }),
      {
        name: "meal-storage",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          calorieGoal: state.calorieGoal, // Persist goal
          caloriesConsumed: state.caloriesConsumed, // This will be reset on new day
          goodFoodCount: state.goodFoodCount, // This will be reset on new day
          badFoodCount: state.badFoodCount, // This will be reset on new day
          lastAccessedDate: state.lastAccessedDate, // Track last access
          selectedDate: state.selectedDate,
        }),
      }
    )
  )
);
