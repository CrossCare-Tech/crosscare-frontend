// zustandStore/mealStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { devtools } from 'zustand/middleware';
import { Platform } from 'react-native';

// Type definitions
export type FoodClassification = 'GOOD' | 'BAD';

export interface FoodItem {
  id?: string;
  name: string;
  portion: string;
  calories: number;
  classification: FoodClassification;
}

export interface Meal {
  id?: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  totalCalories: number;
  foodItemsCount: number;
  isSavedAsMeal: boolean;
  foodItems: FoodItem[];
}

interface DataItem {
    day: string
    calories: number
    date: string
  }

export interface MealProgress {
  calorieGoal: number;
  caloriesConsumed: number;
  goodFoodCount: number;
  badFoodCount: number;
}

// Helper function to normalize meal type
const normalizeMealType = (mealType: string): 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' => {
  const type = mealType.toUpperCase();
  if (['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].includes(type)) {
    return type as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  }
  return 'BREAKFAST'; // Default
};

// Interface for the store
interface MealStore extends MealProgress {
  // Meal data by type
  meals: {
    BREAKFAST: Meal[];
    LUNCH: Meal[];
    DINNER: Meal[];
    SNACK: Meal[];
  };
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // API URLs
  baseUrl: string;
  
  // New properties for chart data
  chartData: DataItem[];
  currentTimeRange: string;
  
  // Add selectedDate to track current viewing date
  selectedDate: string;
  
  // Actions
  fetchMeals: (userId: string) => Promise<void>;
  fetchMealsForDate: (userId: string, date: string) => Promise<void>;
  updateCalorieGoal: (userId: string, goal: number, date?: string) => Promise<boolean>;
  addFoodItem: (userId: string, mealType: string, foodItem: FoodItem, date?: string) => Promise<boolean>;
  deleteFoodItem: (userId: string, mealId: string, foodItemId: string) => Promise<boolean>;
  getFoodQualityRatio: () => { goodRatio: number, badRatio: number };
  resetState: () => void;
  fetchCalorieHistory: (userId: string, timeRange?: string) => Promise<void>;
  setSelectedDate: (date: string) => void; // New action to track selected date
}

export const useMealStore = create<MealStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        calorieGoal: 0,
        caloriesConsumed: 0,
        goodFoodCount: 0,
        badFoodCount: 0,
        selectedDate: new Date().toISOString().split('T')[0], // Today by default
        meals: {
          BREAKFAST: [],
          LUNCH: [],
          DINNER: [],
          SNACK: []
        },
        isLoading: false,
        error: null,
        baseUrl: Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://10.0.2.2:8000/api',
        chartData: [],
        currentTimeRange: 'week',
        
        // New action to set selected date
        setSelectedDate: (date: string) => {
          set({ selectedDate: date });
        },
        
        // Action to fetch all meals for a user
        fetchMeals: async (userId: string) => {
          if (!userId) {
            console.error("Cannot fetch meals: User ID is required");
            return;
          }
          
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch(`${get().baseUrl}/user/activity/${userId}/foodItem`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch meals: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update state with fetched data
            set({
              calorieGoal: data.calorieGoal || 0,
              caloriesConsumed: data.caloriesConsumed || 0,
              goodFoodCount: data.goodFoodCount || 0,
              badFoodCount: data.badFoodCount || 0,
              meals: {
                BREAKFAST: data.meals?.BREAKFAST || [],
                LUNCH: data.meals?.LUNCH || [],
                DINNER: data.meals?.DINNER || [],
                SNACK: data.meals?.SNACK || []
              },
              isLoading: false
            });
            
            console.log("Meals fetched successfully:", data);
          } catch (error) {
            console.error("Error fetching meals:", error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : "Unknown error fetching meals" 
            });
          }
        },
        
        fetchMealsForDate: async (userId: string, date: string) => {
            if (!userId || !date) {
              console.error("Cannot fetch meals for date: User ID and date are required");
              return;
            }
            
            set({ isLoading: true, error: null });
            
            try {
              const response = await fetch(`${get().baseUrl}/user/activity/${userId}/foodItem?date=${date}`);
              
              if (!response.ok) {
                throw new Error(`Failed to fetch meals for date: ${response.status}`);
              }
              
              const data = await response.json();
              
              // Update state with fetched data for the specific date
              set({
                calorieGoal: data.calorieGoal || 0,
                caloriesConsumed: data.caloriesConsumed || 0,
                goodFoodCount: data.goodFoodCount || 0,
                badFoodCount: data.badFoodCount || 0,
                meals: {
                  BREAKFAST: data.meals?.BREAKFAST || [],
                  LUNCH: data.meals?.LUNCH || [],
                  DINNER: data.meals?.DINNER || [],
                  SNACK: data.meals?.SNACK || []
                },
                isLoading: false
              });
              
              console.log("Meals for date fetched successfully:", data);
            } catch (error) {
              console.error("Error fetching meals for date:", error);
              set({ 
                isLoading: false, 
                error: error instanceof Error ? error.message : "Unknown error fetching meals for date" 
              });
            }
          },

        // Updated updateCalorieGoal to accept date parameter
        updateCalorieGoal: async (userId: string, goal: number, date?: string) => {
          if (!userId) {
            console.error("Cannot update calorie goal: User ID is required");
            return false;
          }
          
          set({ isLoading: true, error: null });
          
          try {
            const targetDate = date || get().selectedDate;
            const response = await fetch(`${get().baseUrl}/user/activity/${userId}/caloriesGoal`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                calorieGoal: goal,
                date: targetDate // Pass the date to backend
              })
            });
            
            if (!response.ok) {
              throw new Error(`Failed to update calorie goal: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Only update local state if we're updating the currently viewed date
            if (targetDate === get().selectedDate) {
              set({ calorieGoal: goal, isLoading: false });
            } else {
              set({ isLoading: false });
            }
            
            console.log("Calorie goal updated successfully for date:", targetDate);
            return true;
          } catch (error) {
            console.error("Error updating calorie goal:", error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : "Unknown error updating calorie goal" 
            });
            return false;
          }
        },
        
        // Updated addFoodItem to accept date parameter
        addFoodItem: async (userId: string, mealType: string, foodItem: FoodItem, date?: string) => {
          if (!userId) {
            console.error("Cannot add food item: User ID is required");
            return false;
          }
          
          const normalizedMealType = normalizeMealType(mealType);
          
          set({ isLoading: true, error: null });
          
          try {
            const targetDate = date || get().selectedDate;
            const response = await fetch(`${get().baseUrl}/user/activity/${userId}/foodItem`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                mealType: normalizedMealType,
                name: foodItem.name,
                portion: foodItem.portion,
                calories: foodItem.calories,
                classification: foodItem.classification,
                date: targetDate // Pass the date to backend
              })
            });
            
            if (!response.ok) {
              throw new Error(`Failed to add food item: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Only update local state if we're adding to the currently viewed date
            if (targetDate === get().selectedDate) {
              // Update local state with the new daily progress
              if (data.dailyProgress) {
                set({
                  caloriesConsumed: data.dailyProgress.caloriesConsumed || 0,
                  goodFoodCount: data.dailyProgress.goodFoodCount || 0,
                  badFoodCount: data.dailyProgress.badFoodCount || 0,
                  isLoading: false
                });
              } else {
                set({ isLoading: false });
              }
              
              // Update meals in local state
              if (data.foodItem) {
                const normalizedType = normalizeMealType(normalizedMealType);
                const currentMeals = { ...get().meals };
                
                if (!currentMeals[normalizedType]) {
                  currentMeals[normalizedType] = [];
                }
                
                if (currentMeals[normalizedType].length > 0) {
                  const updatedMeal = { 
                    ...currentMeals[normalizedType][0],
                    foodItems: [
                      ...currentMeals[normalizedType][0].foodItems,
                      data.foodItem
                    ],
                    totalCalories: currentMeals[normalizedType][0].totalCalories + (data.foodItem.calories || 0),
                    foodItemsCount: currentMeals[normalizedType][0].foodItemsCount + 1
                  };
                  
                  currentMeals[normalizedType] = [
                    updatedMeal,
                    ...currentMeals[normalizedType].slice(1)
                  ];
                } else {
                  const newMeal = {
                    id: data.mealId || 'temp-id',
                    mealType: normalizedType,
                    totalCalories: data.foodItem.calories || 0,
                    foodItemsCount: 1,
                    isSavedAsMeal: false,
                    foodItems: [data.foodItem]
                  };
                  
                  currentMeals[normalizedType] = [newMeal];
                }
                
                set({ meals: currentMeals });
              }
            } else {
              set({ isLoading: false });
            }
            
            console.log("Food item added successfully for date:", targetDate);
            return true;
          } catch (error) {
            console.error("Error adding food item:", error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : "Unknown error adding food item" 
            });
            return false;
          }
        },
        
        // Delete a food item
        deleteFoodItem: async (userId: string, mealId: string, foodItemId: string) => {
          if (!userId || !mealId || !foodItemId) {
            console.error("Cannot delete food item: Missing required IDs");
            return false;
          }
          
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch(`${get().baseUrl}/user/${userId}/meals/${mealId}/fooditems/${foodItemId}`, {
              method: 'DELETE'
            });
            
            if (!response.ok) {
              throw new Error(`Failed to delete food item: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
              throw new Error(data.error || "Unknown error deleting food item");
            }
            
            // Update local state with the new daily progress
            set({
              caloriesConsumed: data.dailyProgress.caloriesConsumed,
              goodFoodCount: data.dailyProgress.goodFoodCount,
              badFoodCount: data.dailyProgress.badFoodCount,
              isLoading: false
            });
            
            // Re-fetch all meals to get the updated data
            await get().fetchMeals(userId);
            
            console.log("Food item deleted successfully:", data);
            return true;
          } catch (error) {
            console.error("Error deleting food item:", error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : "Unknown error deleting food item" 
            });
            return false;
          }
        },
        
        // Calculate food quality ratio
        getFoodQualityRatio: () => {
          const { goodFoodCount, badFoodCount } = get();
          const total = goodFoodCount + badFoodCount;
          
          if (total === 0) {
            return { goodRatio: 0.5, badRatio: 0.5 }; // Default 50/50 when no data
          }
          
          return {
            goodRatio: goodFoodCount / total,
            badRatio: badFoodCount / total
          };
        },
        
        // Reset state
        resetState: () => {
          set({
            calorieGoal: 0,
            caloriesConsumed: 0,
            goodFoodCount: 0,
            badFoodCount: 0,
            meals: {
              BREAKFAST: [],
              LUNCH: [],
              DINNER: [],
              SNACK: []
            },
            isLoading: false,
            error: null
          });
        },
        
        // New action to fetch calorie history
        fetchCalorieHistory: async (userId: string, timeRange: string = 'week') => {
          if (!userId) {
            console.error("Cannot fetch calorie history: User ID is required");
            return;
          }
          
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch(`${get().baseUrl}/user/activity/${userId}/calorieHistory?timeRange=${timeRange}`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch calorie history: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
              set({
                chartData: data.chartData || [],
                currentTimeRange: timeRange,
                isLoading: false
              });
            } else {
              throw new Error(data.error || "Unknown error fetching calorie history");
            }
            
            console.log("Calorie history fetched successfully:", data);
          } catch (error) {
            console.error("Error fetching calorie history:", error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : "Unknown error fetching calorie history",
              chartData: [] // Set empty array on error
            });
          }
        }
      }),
      {
        name: 'meal-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          calorieGoal: state.calorieGoal,
          caloriesConsumed: state.caloriesConsumed,
          goodFoodCount: state.goodFoodCount,
          badFoodCount: state.badFoodCount,
          meals: state.meals,
          selectedDate: state.selectedDate // Persist selected date
        })
      }
    )
  )
);