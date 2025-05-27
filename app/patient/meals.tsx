import { StyleSheet, Text, View, StatusBar, ScrollView, Animated, Dimensions, Modal } from "react-native"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { ActivityIndicator, TouchableOpacity } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons"
import FoodIcon from "@/assets/images/Svg/FoodIcon"
import { LinearGradient } from "expo-linear-gradient"
import CalorieGoalModal from "./modal/caloriegoalmodal"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSelector } from "react-redux"
import { useTranslation } from "react-i18next"
import FoodQualityCircle from "@/components/FoodQualityCircle"
import { useMealStore, FoodItem } from "@/zustandStore/mealStore"

const MAX_HEIGHT = 200
const BAR_WIDTH = 20
const SPACING = (Dimensions.get("window").width - BAR_WIDTH * 10) / 8

interface DataItem {
  day: string
  calories: number
  date: string
  isRangeLabel?: boolean
  rangeLabel?: string
  id?: string
}

interface CustomBarProps {
  item: DataItem
  index: number
  isSelected: boolean
  roundedMax: number
  roundedMin: number
  timeRange: string
}

interface Meal {
  title: string
  goalCalories: number
  totalCalories: number
  foods: FoodItem[]
  description: string
}

// Time range options type
type TimeRangeOption = {
  id: string
  label: string
}

const CustomProgressBar = ({ progress }: { progress: number }) => {
  // Cap the progress at 100% to prevent overflow
  const cappedProgress = Math.min(progress, 1)

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${cappedProgress * 100}%` }]} />
      </View>
    </View>
  )
}

const FoodItems = ({ name, portion, calories, classification, onDelete }: FoodItem & { onDelete: () => void }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (menuVisible) {
      timeoutId = setTimeout(() => {
        setMenuVisible(false)
      }, 3000) // Close after 3 seconds
    }

    // Clean up the timeout when component unmounts or menuVisible changes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [menuVisible])

  return (
    <View style={styles.foodItem}>
      <View style={styles.foodItemLeft}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          flex: 1,
        }}>
          <View style={[
            styles.classificationDot,
            {
              backgroundColor: classification === 'BAD' ? 'rgba(252, 49, 48, 1)' : 'rgba(64, 206, 35, 1)'
            }
          ]} />
          <Text style={styles.foodName}>{name}</Text>
        </View>
        <Text style={styles.foodPortion}>{portion}</Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={styles.foodCalories}>{calories} Cal</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Feather name="more-vertical" size={14} color="#E5E5E5" />
        </TouchableOpacity>

        {/* Popup Menu */}
        {menuVisible && (
          <View style={styles.popupMenuOverlay}>
            <TouchableOpacity style={styles.popupMenuBackdrop} onPress={() => setMenuVisible(false)} />
            <View style={styles.popupMenu}>
              <TouchableOpacity
                style={styles.popupMenuItem}
                onPress={() => {
                  onDelete()
                  setMenuVisible(false)
                }}
              >
                <Text style={styles.popupMenuItemTextDelete}>{t('meals.popupMenuDelete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

const MealItem = ({
  meal,
  index,
  onAddPress,
  onDeleteFood,
}: {
  meal: Meal
  index: number
  onAddPress: (mealType: string) => void
  onDeleteFood: (mealType: string, foodIndex: number) => void
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false)
  const hasFoods = meal.foods && meal.foods.length > 0

  return (
    <View style={[styles.mealItem, index !== 0 && styles.mealItemWithBorder]}>
      <TouchableOpacity style={styles.mealHeader} onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.7}>
        <Text style={styles.mealTitle}>{t(meal.title)}</Text>
        <View style={styles.mealCaloriesContainer}>
          <Text style={styles.mealCalories}>
            {meal.totalCalories} Cal
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={() => onAddPress(meal.title)}>
            <Ionicons name="add-circle" size={20} color="#38C472" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Show description by default if no foods */}
      {!hasFoods && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.mealDescription}>{t(meal.description)}</Text>
        </View>
      )}

      {/* Show foods only when expanded and foods exist */}
      {hasFoods && (
        <View style={styles.expandedContent}>
          {meal.foods.map((food, idx) => (
            <FoodItems
              key={idx}
              name={food.name}
              portion={food.portion}
              calories={food.calories}
              classification={food.classification}
              onDelete={() => onDeleteFood(meal.title, idx)}
            />
          ))}
          <TouchableOpacity style={styles.saveAsMealButton}>
            <Text style={styles.saveAsMealText}>{t('meals.saveAsMeal')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#434343" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const meals = () => {
  const params = useLocalSearchParams()
  const selectedFoodJson = params.selectedFood as string
  const selectedFood = selectedFoodJson ? JSON.parse(selectedFoodJson) : null
  const mealType = params.mealType as string
  
  // Use the Zustand store
  const { 
    calorieGoal, 
    caloriesConsumed, 
    goodFoodCount, 
    badFoodCount,
    meals: storeMeals,
    chartData,
    currentTimeRange,
    isLoading, 
    error,
    fetchMeals,
    updateCalorieGoal,
    addFoodItem,
    fetchMealsForDate,
    deleteFoodItem,
    getFoodQualityRatio,
    fetchCalorieHistory
  } = useMealStore();
  
  const [progress, setProgress] = useState(0)
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false)
  const [customCalorieGoal, setCustomCalorieGoal] = useState("")
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const [timeRange, setTimeRange] = useState("week")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [tooltipAnim] = useState(new Animated.Value(0))
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const periodSelectorRef = useRef<View>(null)
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [filteredData, setFilteredData] = useState<DataItem[]>([])

  const { t } = useTranslation();

  // Time range options - matching weight.tsx
  const timeRangeOptions: TimeRangeOption[] = [
    { id: "today", label: t('today') },
    { id: "week", label: t('last7Days') },
    { id: "month", label: t('thisMonth') },
    { id: "lastMonth", label: t('lastMonth') },
  ]

  // Format the meal data from the store to the format expected by the UI
  const formattedMealData = useMemo(() => {
    if (!storeMeals) return [];
    
    // Default structure with translations
    const defaultMealData = [
      {
        title: "meals.mealTitles.Breakfast",
        goalCalories: 0, // No individual goal
        totalCalories: 0,
        foods: [],
        description: "meals.mealDescriptions.Breakfast",
      },
      {
        title: "meals.mealTitles.Lunch",
        goalCalories: 0, // No individual goal
        totalCalories: 0,
        foods: [],
        description: "meals.mealDescriptions.Lunch",
      },
      {
        title: "meals.mealTitles.Snacks",
        goalCalories: 0, // No individual goal
        totalCalories: 0,
        foods: [],
        description: "meals.mealDescriptions.Snacks",
      },
      {
        title: "meals.mealTitles.Dinner",
        goalCalories: 0, // No individual goal
        totalCalories: 0,
        foods: [],
        description: "meals.mealDescriptions.Dinner",
      },
    ];
    
    // Map store meals to UI format
    const mappedBreakfast = storeMeals.BREAKFAST?.length > 0 ? {
      title: "meals.mealTitles.Breakfast",
      goalCalories: 0, // No individual goal
      totalCalories: storeMeals.BREAKFAST.reduce((sum, meal) => sum + meal.totalCalories, 0),
      foods: storeMeals.BREAKFAST.flatMap(meal => meal.foodItems || []),
      description: "meals.mealDescriptions.Breakfast",
    } : defaultMealData[0];
    
    const mappedLunch = storeMeals.LUNCH?.length > 0 ? {
      title: "meals.mealTitles.Lunch",
      goalCalories: 0, // No individual goal
      totalCalories: storeMeals.LUNCH.reduce((sum, meal) => sum + meal.totalCalories, 0),
      foods: storeMeals.LUNCH.flatMap(meal => meal.foodItems || []),
      description: "meals.mealDescriptions.Lunch",
    } : defaultMealData[1];
    
    const mappedSnacks = storeMeals.SNACK?.length > 0 ? {
      title: "meals.mealTitles.Snacks",
      goalCalories: 0, // No individual goal
      totalCalories: storeMeals.SNACK.reduce((sum, meal) => sum + meal.totalCalories, 0),
      foods: storeMeals.SNACK.flatMap(meal => meal.foodItems || []),
      description: "meals.mealDescriptions.Snacks",
    } : defaultMealData[2];
    
    const mappedDinner = storeMeals.DINNER?.length > 0 ? {
      title: "meals.mealTitles.Dinner",
      goalCalories: 0, // No individual goal
      totalCalories: storeMeals.DINNER.reduce((sum, meal) => sum + meal.totalCalories, 0),
      foods: storeMeals.DINNER.flatMap(meal => meal.foodItems || []),
      description: "meals.mealDescriptions.Dinner",
    } : defaultMealData[3];
    
    return [mappedBreakfast, mappedLunch, mappedSnacks, mappedDinner];
  }, [storeMeals, calorieGoal]);

  // Generate all days for the selected time range - matching weight.tsx logic
  const generateAllDays = (timeRange: string): DataItem[] => {
    const today = new Date()
    const days = []
    let startDate: Date
    let endDate: Date

    if (timeRange === "today") {
      // Today view - just show today
      const todayStr = today.toISOString().split("T")[0]

      return [
        {
          id: `today-${todayStr}`,
          date: todayStr,
          day: "Today",
          calories: 0,
        },
      ]
    } else if (timeRange === "week") {
      // Weekly view - show each day
      startDate = new Date(today)
      const dayOfWeek = startDate.getDay()
      startDate.setDate(startDate.getDate() - dayOfWeek)

      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)

      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split("T")[0]
        days.push({
          id: `empty-${dateString}`,
          date: dateString,
          day: currentDate.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
          calories: 0,
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else if (timeRange === "month" || timeRange === "lastMonth") {
      // For month views, create date ranges around key dates
      const dateRanges = [
        { label: "1", start: 1, end: 4 },
        { label: "5", start: 5, end: 9 },
        { label: "10", start: 10, end: 14 },
        { label: "15", start: 15, end: 19 },
        { label: "20", start: 20, end: 24 },
        { label: "25", start: 25, end: 29 },
        { label: "30", start: 30, end: 31 },
      ]

      if (timeRange === "month") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      } else {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0)
      }

      const lastDay = endDate.getDate()

      // Generate entries for each date range
      for (const range of dateRanges) {
        if (range.start <= lastDay) {
          // Add the main label date
          const labelDate = new Date(startDate)
          labelDate.setDate(range.start)
          const labelDateString = labelDate.toISOString().split("T")[0]

          days.push({
            id: `label-${labelDateString}`,
            date: labelDateString,
            day: range.label,
            calories: 0,
            isRangeLabel: true, // Mark this as a label for the range
          })

          // Add individual days in the range
          for (let day = range.start; day <= Math.min(range.end, lastDay); day++) {
            const currentDate = new Date(startDate)
            currentDate.setDate(day)
            const dateString = currentDate.toISOString().split("T")[0]

            days.push({
              id: `day-${dateString}`,
              date: dateString,
              day: "", // Empty string for non-label days
              calories: 0,
              rangeLabel: range.label, // Reference to which label this belongs to
            })
          }
        }
      }
    }

    return days
  }

  // Process and filter data based on time range - matching weight.tsx
  const processDataForTimeRange = (data: DataItem[], timeRange: string) => {
    const allDays = generateAllDays(timeRange)

    if (data.length === 0) {
      return allDays
    }

    const dataMap = new Map()
    data.forEach((item) => {
      if (item.date) {
        // Ensure we're working with a string date
        const dateKey =
          typeof item.date === "string" ? item.date.split("T")[0] : new Date(item.date).toISOString().split("T")[0]
        dataMap.set(dateKey, item)
      }
    })

    // For "today" view, we need to specifically check if today's data exists
    if (timeRange === "today") {
      const todayStr = new Date().toISOString().split("T")[0]
      const todayData = dataMap.get(todayStr)

      if (todayData) {
        return [
          {
            id: `today-${todayStr}`,
            date: todayStr,
            day: t('today'),
            calories: todayData.calories || 0,
          },
        ]
      } else {
        return allDays // Return empty today template
      }
    }

    // For week view, ensure we map data to the correct days
    if (timeRange === "week") {
      return allDays.map((day) => {
        const existingData = dataMap.get(day.date)
        if (existingData) {
          return {
            ...day,
            calories: existingData.calories || 0,
          }
        }
        return day
      })
    }

    // For month views, handle the date ranges
    return allDays.map((day) => {
      // For range labels, just return as is
      if (day.isRangeLabel) {
        return day
      }

      const existingData = dataMap.get(day.date)
      if (existingData) {
        return {
          ...day,
          calories: existingData.calories || 0,
          isRangeLabel: day.isRangeLabel,
          rangeLabel: day.rangeLabel,
        }
      }
      return day
    })
  }

  // Keep this useEffect but modify it to only fetch calorie history when timeRange changes
  useEffect(() => {
    if (userId && timeRange) {
      // Only fetch calorie history when time range changes
      fetchCalorieHistory(userId, timeRange);
    }
  }, [timeRange, fetchCalorieHistory, userId]);

  // Update filtered data when time range changes
  useEffect(() => {
    const filtered = processDataForTimeRange(chartData, timeRange)
    setFilteredData(filtered)

    // Reset selected index when changing time range
    setSelectedIndex(null)
  }, [timeRange, chartData])

  // Add a separate useEffect for badge tracking that only runs once
  useEffect(() => {
    // Mark as visited for badge tracking
    AsyncStorage.setItem('meal_1', 'true');
  }, []);

  // Handle adding selected food from params
  useEffect(() => {
    if (selectedFood && mealType && userId) {
      // Convert from UI format to store format
      const newFoodItem: FoodItem = {
        name: selectedFood.name,
        portion: selectedFood.portion,
        calories: selectedFood.calories,
        classification: selectedFood.classification === 'good' ? 'GOOD' : 'BAD'
      };
      
      // Add the food item via the store
      addFoodItem(userId, mealType, newFoodItem);
      
      // Clear URL parameters
      router.setParams({});
    }
  }, [selectedFood, mealType, userId, addFoodItem]);

  // Update progress when calorie data changes
  useEffect(() => {
    const newProgress = calorieGoal > 0 ? caloriesConsumed / calorieGoal : 0;
    setProgress(newProgress);
  }, [caloriesConsumed, calorieGoal]);

  const handleOpenGoalModal = () => {
    setIsGoalModalVisible(true)
  }

  const handleCloseGoalModal = () => {
    setIsGoalModalVisible(false)
  }

  const handleSaveGoal = (newGoal: string) => {
    setCustomCalorieGoal(newGoal)
    if (userId) {
      updateCalorieGoal(userId, Number(newGoal));
    }
    setIsGoalModalVisible(false)
  }

  const handleAddFood = (mealType: string) => {
    // Navigate to food search screen with meal type
    router.push({
      pathname: "/patient/addmeals",
      params: { mealType },
    })
  }

  const handleDeleteFood = (mealType: string, foodIndex: number) => {
    // Get the correct meal type for the API
    const apiMealType = mealType === "meals.mealTitles.Breakfast" ? "BREAKFAST" :
                       mealType === "meals.mealTitles.Lunch" ? "LUNCH" :
                       mealType === "meals.mealTitles.Dinner" ? "DINNER" : "SNACK";
    
    // Find the meal and food item IDs from the store
    const meals = storeMeals[apiMealType];
    if (!meals || meals.length === 0) return;
    
    // Find which meal contains this food item
    let foodItemId = null;
    let mealId = null;
    
    // We need to find the specific meal and food item by index
    let currentIndex = 0;
    for (const meal of meals) {
      const foodItems = meal.foodItems || [];
      if (currentIndex + foodItems.length > foodIndex) {
        // This meal contains our target food
        const itemIndex = foodIndex - currentIndex;
        foodItemId = foodItems[itemIndex]?.id;
        mealId = meal.id;
        break;
      }
      currentIndex += foodItems.length;
    }
    
    if (userId && mealId && foodItemId) {
      deleteFoodItem(userId, mealId, foodItemId);
    }
  }

  // Calculate y-axis values using useMemo to prevent recalculation on every render - matching weight.tsx
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    if (!filteredData.length) {
      return { yAxisLabels: ["2.0", "1.5", "1.0", "0.5", "0.0"], roundedMax: 2000, roundedMin: 0 }
    }

    // Filter out zero calories for calculation
    const nonZeroCalories = filteredData
      .filter((item) => !item.isRangeLabel && item.calories > 0)
      .map((item) => item.calories)

    // If no non-zero calories, use default range
    if (nonZeroCalories.length === 0) {
      return { yAxisLabels: ["2.0", "1.5", "1.0", "0.5", "0.0"], roundedMax: 2000, roundedMin: 0 }
    }

    const maxCalories = Math.max(...nonZeroCalories)
    const minCalories = Math.min(...nonZeroCalories)

    // Convert to kcal for rounding
    const maxKcal = maxCalories / 1000
    const minKcal = minCalories / 1000

    // Add padding to the range
    const paddedMax = maxKcal + 0.2
    const paddedMin = Math.max(0, minKcal - 0.2)

    // Round to nearest 0.1 for kcal
    const roundedMaxKcal = Math.ceil(paddedMax * 10) / 10
    const roundedMinKcal = Math.floor(paddedMin * 10) / 10

    // Convert back to calories for internal calculations
    const roundedMax = roundedMaxKcal * 1000
    const roundedMin = roundedMinKcal * 1000

    // Create appropriate y-axis labels based on data range
    const rangeKcal = roundedMaxKcal - roundedMinKcal
    const stepKcal = rangeKcal / 4 // We want about 4 labels

    const labels = []
    for (let i = 0; i <= 4; i++) {
      const valueKcal = roundedMinKcal + stepKcal * i
      if (valueKcal <= roundedMaxKcal) {
        // Format to 1 decimal place
        labels.push(valueKcal.toFixed(1))
      }
    }

    // Make sure max value is included
    if (Number.parseFloat(labels[labels.length - 1]) < roundedMaxKcal) {
      labels.push(roundedMaxKcal.toFixed(1))
    }

    return {
      yAxisLabels: labels.reverse(), // Reverse for top-to-bottom display
      roundedMax,
      roundedMin,
    }
  }, [filteredData]) // Only recalculate when data changes

  // Function to hide tooltip after a delay - matching weight.tsx
  const hideTooltipAfterDelay = () => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }

    // Set a new timeout to hide the tooltip after 3 seconds
    tooltipTimeoutRef.current = setTimeout(() => {
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSelectedIndex(null)
      })
    }, 3000)
  }

  const handleBarPress = (index: number): void => {
    // Get the actual item
    const item = filteredData[index]

    // Skip if it's a range label or has no data
    if (item.isRangeLabel || item.calories <= 0) {
      return
    }

    if (selectedIndex === index) {
      setSelectedIndex(null) // Deselect if already selected
      return
    }

    // Animate tooltip disappearing and reappearing
    Animated.sequence([
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    setSelectedIndex(index)

    // Set timeout to hide tooltip after delay
    hideTooltipAfterDelay()
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  // Get the current selected time range label
  const getTimeRangeLabel = () => {
    const option = timeRangeOptions.find((option) => option.id === timeRange)
    return option ? option.label : "Last 7 Days"
  }

  // Convert calories to kilocalories for display
  const formatToKcal = (calories: number) => {
    return (calories / 1000).toFixed(1)
  }

  // Fixed CustomBar component - matching weight.tsx
  const CustomBar = ({ item, index, isSelected, timeRange }: CustomBarProps) => {
    // Check if this is a month view
    const isMonthView = timeRange !== "week" && timeRange !== "today"

    // Skip rendering for range labels in month view - they're just for organization
    if (isMonthView && item.isRangeLabel) {
      return (
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeLabel}>{item.day}</Text>
        </View>
      )
    }

    // Check if the bar has calorie data
    const hasCalories = item.calories > 0

    // Calculate bar height based on data range
    const dataRange = roundedMax - roundedMin
    const normalizedCalories = hasCalories ? item.calories - roundedMin : 0 // Adjust for minimum value

    // Ensure we don't get NaN or negative values for barHeight
    let barHeight = 0
    if (dataRange > 0 && normalizedCalories > 0) {
      barHeight = (normalizedCalories / dataRange) * MAX_HEIGHT
      // Ensure minimum visible height for bars with very small values
      barHeight = Math.max(barHeight, 2)
    }

    // Use thinner bars for month views, wider for today view
    let barWidth = BAR_WIDTH
    if (isMonthView) {
      barWidth = 4
    } else if (timeRange === "today") {
      barWidth = BAR_WIDTH * 2 // Wider bar for today view
    }

    // Format the date for display
    const formatDate = (dateString: string) => {
      if (!dateString) return ""
      try {
        const date = new Date(dateString)
        return date
          .toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
          .toUpperCase()
      } catch (e) {
        return dateString // Return original if parsing fails
      }
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => (hasCalories ? handleBarPress(index) : null)}
        style={[
          styles.barContainer,
          timeRange === "today" && {
            width: barWidth,
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-end",
          },
          isMonthView && {
            width: barWidth,
            marginRight: 2, // Tighter spacing for clustered bars
            marginLeft: item.rangeLabel && index > 0 && filteredData[index - 1].rangeLabel !== item.rangeLabel ? 10 : 0, // Add space between ranges
          },
        ]}
        disabled={!hasCalories} // Disable touch for bars with no calories
      >
        {/* Show day label for week view and today view */}
        {(timeRange === "week" || timeRange === "today") && (
          <View style={styles.barLabelContainer}>
            <Text style={styles.barLabel}>{item.day}</Text>
          </View>
        )}

        {/* Only render the bar if there's calorie data */}
        {hasCalories && (
          <View style={[styles.barWrapper, { height: barHeight }, { width: barWidth }]}>
            <LinearGradient
              colors={isSelected ? ["#38C472", "#38C472"] : ["#A3E4BE", "#A3E4BE"]}
              style={[
                styles.bar,
                { height: "100%" },
                isMonthView && { borderTopLeftRadius: 2, borderTopRightRadius: 2 },
              ]}
            />
          </View>
        )}

        {/* Only show tooltip for selected bars with calories */}
        {isSelected && hasCalories && (
          <Animated.View style={[styles.tooltip, { opacity: tooltipAnim }]}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>{t('meals.calories')}</Text>
              <Text style={styles.tooltipWeight}>
                {formatToKcal(item.calories)}{" "}
                <Text
                  style={{
                    fontSize: 16,
                    color: "#38C472",
                  }}
                >
                  kcal
                </Text>
              </Text>
              <Text style={styles.tooltipDate}>{formatDate(item.date)}</Text>
            </View>
            <View style={[styles.tooltipArrow, { borderTopColor: "#38C472" }]} />
          </Animated.View>
        )}
      </TouchableOpacity>
    )
  }

  // Handle date change
  const handleDateChange = (event, date) => {
    setShowDatePicker(false)
    if (date && userId) {
      setSelectedDate(date)
      
      // Format the date to YYYY-MM-DD format for the API
      const formattedDate = date.toISOString().split('T')[0];
      
      // Fetch meals for the selected date
      fetchMealsForDate(userId, formattedDate);
    }
  }

  useEffect(() => {
    if (userId) {
      // Fetch meals for today initially
      const today = new Date().toISOString().split('T')[0];
      fetchMealsForDate(userId, today);
    }
  }, [userId, fetchMealsForDate]);

  
  // Get the food quality ratio for the circle visualization
  const { goodRatio, badRatio } = getFoodQualityRatio();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('food')}</Text>
        <TouchableOpacity>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Food Icon Section */}
        <View style={styles.mealContainer}>
          <View style={styles.mealCircleContainer}>
            <View style={styles.mealCircle}>
              <FoodQualityCircle goodCount={goodFoodCount} badCount={badFoodCount} />
            </View>
          </View>

          <CustomProgressBar progress={progress} />

          <View style={styles.calorieInfoContainer}>
            <Text style={styles.calorieText}>
              {caloriesConsumed}{" "}
              <Text
                style={{
                  color: "#333",
                  fontSize: 14,
                  fontFamily: "Inter400",
                }}
              >
                {t('meals.caloriesConsumed', { displayCalorieGoal: calorieGoal.toString() })}
              </Text>
            </Text>
            <TouchableOpacity style={styles.editButton} onPress={handleOpenGoalModal}>
              <FontAwesome5 name="pen" size={15} color="#707070" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date picker button */}
        <TouchableOpacity style={styles.todayContainer} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.todayText}>
            {selectedDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: selectedDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
            })}
          </Text>
          <View
            style={{
              width: 16,
              height: 16,
              backgroundColor: "#E5E5E5",
              borderRadius: 50,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialIcons name="keyboard-arrow-down" size={13} color="#666666" />
          </View>
        </TouchableOpacity>

        {/* Meal List */}
        <View style={styles.mealList}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#38C472" />
              <Text style={styles.loadingText}>{t('meals.loadingMeals')}</Text>
            </View>
          ) : (
            formattedMealData.map((meal, index) => (
              <MealItem
                key={index}
                meal={meal}
                index={index}
                onAddPress={handleAddFood}
                onDeleteFood={handleDeleteFood}
              />
            ))
          )}
        </View>

        {/* Timeline Section - matching weight.tsx */}
        <View style={styles.timelineContainer}>
          <View style={styles.timelineHeader}>
            <View style={styles.timelineIconContainer}>
              <MaterialIcons name="bar-chart" size={18} color="#A3E4BE" />
              <Text style={styles.timelineTitle}>{t('meals.analysis')}</Text>
            </View>

            <TouchableOpacity
              ref={periodSelectorRef}
              style={styles.periodSelector}
              onPress={() => {
                // Measure the position of the period selector button
                if (periodSelectorRef.current) {
                  periodSelectorRef.current.measure(
                    (x: any, y: any, width: number, height: any, pageX: any, pageY: any) => {
                      setDropdownPosition({
                        top: pageY + 10, // Position below the button with a small gap
                        right: width > 0 ? Dimensions.get("window").width - (pageX + width) : 20,
                      })
                      setDropdownVisible(true)
                    },
                  )
                } else {
                  setDropdownVisible(false)
                }
              }}
            >
              <Text style={styles.periodText}>{getTimeRangeLabel()}</Text>
              <Ionicons name="chevron-down" size={14} color="#38C472" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.customChartContainer}>
          {/* Y-axis labels */}
          <View style={styles.yAxisContainer}>
            {yAxisLabels.map((label, index) => (
              <Text key={index} style={styles.yAxisLabel}>
                {label}
              </Text>
            ))}
          </View>

          {/* Chart area */}
          <View style={styles.chartContainer}>
            {/* Horizontal grid lines */}
            {yAxisLabels.map((_, index) => (
              <View key={index} style={[styles.gridLine, { top: (index / (yAxisLabels.length - 1)) * MAX_HEIGHT }]} />
            ))}

            {/* For month views, render date labels at the bottom */}
            {timeRange !== "week" && timeRange !== "today" && (
              <View style={styles.dateLabelsContainer}>
                {filteredData
                  .filter((item) => item.isRangeLabel)
                  .map((item, index) => (
                    <Text key={index} style={styles.monthDateLabel}>
                      {item.day}
                    </Text>
                  ))}
              </View>
            )}

            {/* Bars */}
            <View
              style={[
                styles.barsContainer,
                timeRange === "today" && styles.todayBarsContainer,
                timeRange !== "week" && timeRange !== "today" && { paddingHorizontal: 10 },
              ]}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#38C472" />
                </View>
              ) : filteredData.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>{t('meals.noDataAvailable')}</Text>
                </View>
              ) : (
                // For month views, filter out the range labels as they're shown separately
                filteredData
                  .filter((item) => timeRange === "week" || timeRange === "today" || !item.isRangeLabel)
                  .map((item, index) => (
                    <CustomBar
                      key={index}
                      item={item}
                      index={filteredData.findIndex((d) => d.date === item.date)} // Use original index for reference
                      isSelected={selectedIndex === filteredData.findIndex((d) => d.date === item.date)}
                      roundedMax={roundedMax}
                      roundedMin={roundedMin}
                      timeRange={timeRange}
                    />
                  ))
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageTitle} numberOfLines={1}>{t('meals.trackWeightProgress')}</Text>
            <Text style={styles.messageSubtitle} numberOfLines={1}>{t('meals.setReminder')}</Text>
          </View>
          <TouchableOpacity style={styles.reminderButton}>
            <Ionicons name="alarm" size={16} color="white" />
            <Text style={styles.reminderButtonText}>{t('meals.setReminderButton')}</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "android" ? "calendar" : "default"}
            onChange={handleDateChange}
            // iOS specific props
            textColor="#38C472"
            accentColor="#38C472"
            // Android specific props
            themeVariant="light"
            // For Android, you can use the style prop for basic styling
            style={{ backgroundColor: "#FFFFFF" }}
          />
        )}

        <CalorieGoalModal visible={isGoalModalVisible} onClose={handleCloseGoalModal} onSave={handleSaveGoal} />
      </ScrollView>

      {/* Time Range Dropdown Modal - matching weight.tsx */}
      <Modal
        transparent={true}
        visible={dropdownVisible}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
          <View style={[styles.dropdownContainer, { top: dropdownPosition.top, right: dropdownPosition.right }]}>
            {timeRangeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.dropdownItem, timeRange === option.id && styles.dropdownItemSelected]}
                onPress={() => {
                  setTimeRange(option.id)
                  setDropdownVisible(false)
                }}
              >
                <Text style={[styles.dropdownItemText, timeRange === option.id && styles.dropdownItemTextSelected]}>
                  {option.label}
                </Text>
                {timeRange === option.id && <Ionicons name="checkmark" size={16} color="#38C472" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

export default meals;

// ... existing code ...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loaderText: {
    marginTop: 10,
    color: '#38C472',
    fontFamily: 'Inter500',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Inter600",
  },
  mealContainer: {
    paddingHorizontal: 30,
    marginTop: 10,
    marginBottom: 20,
  },
  mealCircleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  mealCircle: {
    width: 180,
    height: 180,
    borderWidth: 4,
    borderColor: "#FFF",
    borderRadius: 100,
    backgroundColor: "#EBF9F1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBarContainer: {
    width: "100%",
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#E6E6E6",
    borderRadius: 999,
  },
  progressBarFill: {
    height: "100%",
    width: "100%",
    backgroundColor: "#38C472",
    borderRadius: 999,
  },
  calorieInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  calorieText: {
    fontSize: 17,
    fontFamily: "Inter600",
    color: "#333",
  },
  editButton: {
    padding: 4,
  },
  todayContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 8,
    gap: 2,
    width: '30%',
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "rgba(229, 229, 229, 0.39)",
  },
  todayText: {
    fontSize: 16,
    fontFamily: "Inter600",
    color: "#373737",
    marginRight: 4,
  },
  mealList: {
    paddingHorizontal: 16,
  },
  mealItem: {
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  mealItemWithBorder: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  mealTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#434343",
  },
  mealCaloriesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mealCalories: {
    fontSize: 12,
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  addButton: {
    padding: 2,
  },
  expandedContent: {
    backgroundColor: "rgba(232, 232, 232, 0.25)",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#E8E8E8",
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
  },
  foodItemLeft: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontFamily: "Inter400",
    color: "#373737",
  },
  classificationDot: {
    width: 10,
    height: 10,
    borderRadius: 50,
  },
  foodPortion: {
    fontSize: 12,
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  foodCalories: {
    fontSize: 12,
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  saveAsMealButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#E6E6E6",
  },
  saveAsMealText: {
    fontSize: 14,
    fontFamily: "Inter500",
    color: "#38C472",
  },
  descriptionContainer: {
    backgroundColor: "rgba(232, 232, 232, 0.25)",
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#E8E8E8",
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  mealDescription: {
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  // Timeline styles - matching weight.tsx
  timelineContainer: {
    marginTop: 25,
    marginHorizontal: 16,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timelineIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timelineTitle: {
    fontSize: 14,
    fontFamily: "Inter500",
    letterSpacing: 0.28,
    marginLeft: 5,
    color: "#373737",
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EBF9F1",
    borderWidth: 1,
    borderColor: "#A3E4BE",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    letterSpacing: 0.28,
    fontFamily: "Inter500",
    color: "#38C472",
  },
  // Chart styles - matching weight.tsx
  customChartContainer: {
    flexDirection: "row",
    marginTop: 10,
    height: MAX_HEIGHT + 40, // Add extra height for labels
    marginRight: 16,
  },
  yAxisContainer: {
    width: 40,
    height: MAX_HEIGHT,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 5,
  },
  yAxisLabel: {
    color: "#AAAAAA",
    fontSize: 12,
    fontFamily: "Inter400",
  },
  chartContainer: {
    flex: 1,
    height: MAX_HEIGHT,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    paddingLeft: SPACING,
  },
  todayBarsContainer: {
    justifyContent: "center",
    paddingLeft: 0,
  },
  barContainer: {
    width: BAR_WIDTH,
    marginRight: SPACING,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barWrapper: {
    width: BAR_WIDTH,
    borderRadius: 0,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barLabelContainer: {
    position: "absolute",
    bottom: -25,
    alignItems: "center",
  },
  barLabel: {
    fontSize: 14,
    color: "#888888",
    fontFamily: "Inter400",
  },
  tooltip: {
    position: "absolute",
    top: -60, // Positioned above the bar
    alignItems: "center",
    width: 120,
    zIndex: 10, // Ensure tooltip is above other elements
  },
  tooltipContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#38C472",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#38C472",
    marginTop: -1,
  },
  tooltipTitle: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  tooltipWeight: {
    fontSize: 22,
    color: "#38C472",
    marginVertical: 2,
    fontFamily: "Inter700",
  },
  tooltipDate: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#38C472',
    fontFamily: 'Inter500',
    fontSize: 14,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: MAX_HEIGHT,
  },
  noDataText: {
    color: "#999",
    fontFamily: "Inter400",
    fontSize: 14,
  },
  dateRangeContainer: {
    alignItems: "center",
    width: 20,
    height: "100%",
  },
  dateRangeLabel: {
    position: "absolute",
    bottom: -25,
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter500",
  },
  dateLabelsContainer: {
    position: "absolute",
    bottom: -25,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  monthDateLabel: {
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter500",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "android" ? "auto" : 5,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 14,
    color: "#38C472",
    textTransform: "capitalize",
    fontFamily: "Inter500",
  },
  messageSubtitle: {
    fontSize: 12,
    color: "#7B7B7B",
    fontFamily: "Inter400",
  },
  reminderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#38C472",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#60D08E",
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  reminderButtonText: {
    color: "#FEF8FD",
    marginLeft: 8,
    fontSize: 12,
    maxWidth: 130,
    fontFamily: "Inter500",
  },
  popupMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  popupMenuBackdrop: {
    position: "absolute",
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
    backgroundColor: "transparent",
  },
  popupMenu: {
    position: "absolute",
    right: 0,
    top: 20,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    width: 120,
    zIndex: 1001,
  },
  popupMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
  },
  popupMenuItemTextDelete: {
    color: "#FF3B30",
    fontSize: 14,
    fontFamily: "Inter400",
  },
  // Dropdown styles - matching weight.tsx
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  dropdownContainer: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A3E4BE",
    width: 160,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(56, 196, 114, 0.1)",
  },
  dropdownItemSelected: {
    backgroundColor: "#EBF9F1",
  },
  dropdownItemText: {
    color: "#373737",
    fontSize: 14,
    fontFamily: "Inter400",
  },
  dropdownItemTextSelected: {
    color: "#38C472",
    fontFamily: "Inter600",
  },
})