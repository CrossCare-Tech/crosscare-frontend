import { ActivityIndicator, FlatList, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import FoodClassificationModal from "./modal/foodClassificationModal";
import { useMealStore, FoodItem as MealStoreFoodItem } from "@/zustandStore/mealStore";
import { useSelector } from "react-redux";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { COMMON_FOODS, FOOD_IMAGES, catalogFood, foodImageByName } from "@/constants/foodCatalog";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ToggleSelectionItem {
  fdcId: number;
  name?: string;
  description?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  calories?: number;
  foodNutrients?: FoodNutrient[];
}

interface FoodClassification {
  classification: 'good' | 'bad';
}

interface SelectedFood {
  name: string;
  portion: string;
  calories: number;
  classification: 'good' | 'bad';
}

// Define types for the API response
interface FoodNutrient {
  nutrientId: number;
  value: number;
  nutrientName?: string;
  unitName?: string;
  nutrient?: {
    name: string;
  };
}

interface FoodItem {
  fdcId: number;
  description: string;
  dataType?: string;
  name?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: FoodNutrient[];
  foodCategory?: string;
  carbs?: number;
  fat?: number;
  protein?: number;
  yukaScore?: {
    rawScore: number;
    grade: string;
    energy: number;
    saturatedFat: string;
    sugars: string;
    sodium: number;
    fiber: string;
    protein: string;
  };
}

interface FoodApiResponse {
  foods: FoodItem[];
  totalHits: number;
}

const API_KEY = "snfzY15agSASht2DEL9fJF5HhAxRntErPycnZvYq";

const addmeals = () => {
  const {t} = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealType = params.mealType as string;
  const selectedDate = params.selectedDate as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [displayData, setDisplayData] = useState<any[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const user = useSelector((state: any) => state.user);
  const { addFoodItem } = useMealStore();
  const [foodClassifications, setFoodClassifications] = useState(new Map());
  const [classificationModalVisible, setClassificationModalVisible] = useState(false);
  const [selectedFoodForClassification, setSelectedFoodForClassification] = useState<ToggleSelectionItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  
  // Latest search typed; answers to older searches that arrive late are ignored
  const latestQuery = useRef("");

  // Before any search: the pinned common foods, with their pictures
  const showCommonFoods = () => {
    latestQuery.current = "";
    setLoading(false);
    setIsSearchMode(false);
    setError(null);
    setDisplayData(
      COMMON_FOODS.map((food) => ({ ...food, description: food.name, servingSize: 100, servingSizeUnit: "g" }))
    );
  };

  useEffect(() => {
    showCommonFoods();
  }, []);

  // Handle item selection
  const toggleSelection = (item: ToggleSelectionItem): void => {
    const newSelected = new Set(selectedItems);
    if (selectedItems.has(item.fdcId)) {
      // If item is already selected, remove it
      newSelected.delete(item.fdcId);
      setSelectedItems(newSelected);
    } else {
      // If item is not selected, show classification modal first
      setSelectedFoodForClassification(item);
      setSelectedQuantity(1);
      setClassificationModalVisible(true);
    }
  };


  const handleFoodClassification = (classification: 'good' | 'bad', quantity: number): void => {
    if (!selectedFoodForClassification) return;
  
    const item: ToggleSelectionItem = selectedFoodForClassification;
    const newSelected: Set<number> = new Set(selectedItems);
    newSelected.add(item.fdcId);
    setSelectedItems(newSelected);
  
    // Store the classification
    const newClassifications = new Map(foodClassifications);
    newClassifications.set(item.fdcId, classification);
    setFoodClassifications(newClassifications);
  
    // Create food item for the store
    const storeFood: MealStoreFoodItem = {
      name: item.name || item.description || "",
      portion: `${item.servingSize} ${item.servingSizeUnit}`,
      calories: item.calories || 0,
      quantity: quantity,
      classification: classification === 'good' ? 'GOOD' : 'BAD'
    };
  
    // Convert UI meal type to API meal type
    const apiMealType = mealType === "meals.mealTitles.Breakfast" ? "BREAKFAST" :
                       mealType === "meals.mealTitles.Lunch" ? "LUNCH" :
                       mealType === "meals.mealTitles.Dinner" ? "DINNER" :
                       mealType === "meals.mealTitles.Snacks" ? "SNACK" : 
                       mealType.toUpperCase(); // Fallback to uppercase version
  
    console.log(`Converting meal type from "${mealType}" to "${apiMealType}"`);
  
    // If user is logged in, add the food directly via the store
    if (user?.user_id) {
      // Use the converted apiMealType instead of the raw mealType
      addFoodItem(user.user_id, apiMealType, storeFood, selectedDate);
    }
  
    router.back();
  
    setClassificationModalVisible(false);
    setSelectedFoodForClassification(null);
  };

  // Handle modal close without classification
  const handleModalClose = () => {
    setClassificationModalVisible(false);
    setSelectedFoodForClassification(null);
  };

  // Search food using USDA API only
  const searchFood = async (input: string) => {
    if (!input.trim()) {
      showCommonFoods();
      return;
    }

    latestQuery.current = input;
    setLoading(true);
    setError(null);
    setIsSearchMode(true);

    try {
      // Search USDA database by product name
      const usdaResponse = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(input)}&api_key=${API_KEY}`,
        { headers: { accept: "application/json" } }
      );

      if (!usdaResponse.ok) {
        throw new Error(`USDA API request failed with status ${usdaResponse.status}`);
      }

      const usdaData = await usdaResponse.json();
      if (latestQuery.current !== input) return;

      if (usdaData && Array.isArray(usdaData.foods) && usdaData.foods.length > 0) {
        const processedResults = processSearchResults(usdaData.foods);
        setSearchResults(processedResults);
        setDisplayData(processedResults);
      } else {
        setError("No results found in USDA for this product name");
        setSearchResults([]);
        setDisplayData([]);
      }
    } catch (error) {
      if (latestQuery.current !== input) return;
      console.error("Error searching for food:", error);
      setSearchResults([]);
      setDisplayData([]);
      setError(`Error searching for food: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (latestQuery.current === input) setLoading(false);
    }
  };

  const processSearchResults = (foods: FoodItem[]) => {
    const uniqueFoods = new Map();

    foods.forEach((food) => {
      // Skip research datasets and industrial ingredients that the search also returns
      if (food.dataType === "Experimental" || /ingredient in food/i.test(food.description)) return;
      const name = catalogFood(food.fdcId)?.name ?? getCleanName(food.description);
      const key = name.toLowerCase();
      if (!name || uniqueFoods.has(key)) return;

      uniqueFoods.set(key, {
        ...food,
        name,
        // USDA search values are per 100 g
        servingSize: 100,
        servingSizeUnit: "g",
        category: food.foodCategory || "Unknown",
        yukaScore: calculateScore(food),
        calories: getCalories(food),
        carbs: getNutrientValue(food, ["carbohydrate", "carbs"]).toFixed(1),
        fat: getNutrientValue(food, ["fat", "total fat"]).toFixed(1),
        protein: getNutrientValue(food, ["protein"]).toFixed(1),
        expanded: false,
      });
    });

    return Array.from(uniqueFoods.values()).slice(0, 50);
  };

  // USDA descriptions read "Category, food, detail" ("Fast foods, burrito, with beans"): keep the food and
  // its first detail so different items do not end up with the same name
  const getCleanName = (description: string) => {
    let parts = description
      .replace(/\([^)]*\)/g, "")
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part && part.toUpperCase() !== "NFS");
    if (parts.length > 1 && /^fast foods?$/i.test(parts[0])) parts = parts.slice(1);
    const name = parts.slice(0, 2).join(", ");
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Energy comes twice, in kJ and in kcal; only the kcal value is calories
  const getCalories = (foodItem: FoodItem) => {
    const kcal = foodItem.foodNutrients?.find(
      (n) => n.nutrientId === 1008 || (/energy/i.test(n.nutrientName ?? "") && n.unitName?.toUpperCase() === "KCAL")
    );
    return kcal?.value ?? 0;
  };

  const getNutrientValue = (foodItem: FoodItem, nutrientNames: string[]) => {
    if (!foodItem.foodNutrients) return 0;
    for (const name of nutrientNames) {
      const found = foodItem.foodNutrients.find(
        (n) =>
          (n.nutrientName && n.nutrientName.toLowerCase().includes(name)) ||
          (n.nutrient && n.nutrient.name.toLowerCase().includes(name))
      );
      if (found && found.value != null) {
        return found.value;
      }
    }
    return 0;
  };

  const calculateScore = (foodItem: FoodItem) => {
    const servingSize = foodItem.servingSize || 100; // default 100g if missing
    const factor = 100 / servingSize; // normalize to per 100g

    // Extract nutrient values normalized per 100g
    const energy = getCalories(foodItem) * factor; // kcal
    const saturatedFat = getNutrientValue(foodItem, ["saturated fat"]) * factor; // g
    const sugars = getNutrientValue(foodItem, ["sugars", "sugar"]) * factor; // g
    const sodium = getNutrientValue(foodItem, ["sodium"]) * factor; // mg
    const fiber = getNutrientValue(foodItem, ["fiber"]) * factor; // g
    const protein = getNutrientValue(foodItem, ["protein"]) * factor; // g

    // Negative points (penalties)
    const negativePoints =
      Math.min(Math.floor(energy / 100), 10) +
      Math.min(Math.floor(saturatedFat), 10) +
      Math.min(Math.floor(sugars / 4.5), 10) +
      Math.min(Math.floor(sodium / 90), 10);

    // Positive points (benefits)
    const positivePoints =
      Math.min(Math.floor(fiber / 0.9), 5) + Math.min(Math.floor(protein / 1.6), 5);

    // Raw score
    const rawScore = negativePoints - positivePoints;

    // Map rawScore to grade A-E
    let grade = "E";
    if (rawScore <= 0) grade = "A";
    else if (rawScore <= 5) grade = "B";
    else if (rawScore <= 10) grade = "C";
    else if (rawScore <= 15) grade = "D";

    return {
      rawScore,
      grade,
      energy: Math.round(energy),
      saturatedFat: saturatedFat.toFixed(1),
      sugars: sugars.toFixed(1),
      sodium: Math.round(sodium),
      fiber: fiber.toFixed(1),
      protein: protein.toFixed(1),
    };
  };

  const renderFoodItem = ({ item }: { item: any }) => {
    const isSelected = selectedItems.has(item.fdcId);
    const image = FOOD_IMAGES[item.fdcId] ?? foodImageByName(item.name);
    const kind = foodClassifications.get(item.fdcId);
    return (
      <TouchableOpacity style={styles.row} onPress={() => toggleSelection(item)} accessibilityRole="button" activeOpacity={0.7}>
        <View style={styles.thumb}>
          {image ? (
            <Image source={image} style={styles.thumbImage} resizeMode="contain" />
          ) : (
            <MaterialCommunityIcons name="food-apple-outline" size={22} color={Theme.colors.inkFaint} />
          )}
        </View>
        <View style={styles.flex}>
          <Text style={styles.foodName} numberOfLines={2}>
            {item.name || item.description}
          </Text>
          <Text style={styles.foodSub}>
            {item.servingSize} {item.servingSizeUnit} · {t("foodLog.kcal", { value: Math.round(item.calories ?? 0) })}
          </Text>
        </View>
        <View style={[styles.addChip, isSelected && (kind === "bad" ? styles.addChipTreat : styles.addChipGood)]}>
          <Feather
            name={isSelected ? "check" : "plus"}
            size={16}
            color={isSelected ? (kind === "bad" ? Theme.colors.warning : Theme.colors.success) : Theme.colors.magenta}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const mealName = mealType?.startsWith("meals.") ? t(mealType) : t("foodLog.title");

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("foodLog.addTo", { meal: mealName })} />

        <View style={styles.searchWrap}>
          <View style={styles.search}>
            <Feather name="search" size={17} color={Theme.colors.inkFaint} />
            <TextInput
              style={styles.searchInput}
              placeholder={t("meals.searchPlaceholder")}
              placeholderTextColor={Theme.colors.placeholder}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.length > 2) {
                  searchFood(text);
                } else if (text.length === 0) {
                  showCommonFoods();
                }
              }}
              returnKeyType="search"
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={Theme.colors.magenta} />
        ) : error ? (
          <Text style={styles.empty}>{t("foodLog.noResults")}</Text>
        ) : (
          <FlatList
            data={displayData}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.fdcId.toString()}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <Text style={styles.sectionLabel}>{searchQuery.length > 2 ? t("foodLog.results") : t("meals.sectionTitle")}</Text>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        <FoodClassificationModal
          visible={classificationModalVisible}
          foodName={selectedFoodForClassification?.name || selectedFoodForClassification?.description || ""}
          onClose={handleModalClose}
          onClassify={handleFoodClassification}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default addmeals;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.inputBorder,
    backgroundColor: Theme.colors.inputBg,
  },
  searchInput: {
    flex: 1,
    fontFamily: Theme.typography.body,
    fontSize: 14.5,
    color: Theme.colors.ink,
  },
  loader: {
    marginTop: Theme.spacing.xl,
  },
  empty: {
    paddingHorizontal: 22,
    paddingTop: Theme.spacing.md,
    fontFamily: Theme.typography.body,
    fontSize: 13.5,
    color: Theme.colors.inkFaint,
  },
  list: {
    marginHorizontal: 20,
    paddingBottom: Theme.spacing.xxl,
  },
  sectionLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
    marginTop: 6,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surface,
  },
  separator: {
    height: 8,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImage: {
    width: 36,
    height: 36,
  },
  foodName: {
    fontFamily: Theme.typography.heading,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  foodSub: {
    fontFamily: Theme.typography.body,
    fontSize: 12,
    color: Theme.colors.inkFaint,
  },
  addChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Theme.colors.magentaTint,
    alignItems: "center",
    justifyContent: "center",
  },
  addChipGood: {
    backgroundColor: Theme.colors.successTint,
  },
  addChipTreat: {
    backgroundColor: Theme.colors.warningTint,
  },
});
