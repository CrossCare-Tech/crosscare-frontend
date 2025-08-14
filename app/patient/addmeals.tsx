import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  UIManager,
  Animated,
  Easing,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import FoodClassificationModal from "./modal/foodClassificationModal";
import { useMealStore, FoodItem as MealStoreFoodItem } from "@/zustandStore/mealStore";
import { useSelector } from "react-redux";

// Enable LayoutAnimation for Android
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
  nutrient?: {
    name: string;
  };
}

interface FoodItem {
  fdcId: number;
  description: string;
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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const animatedValues = useRef<{ [key: number]: Animated.Value }>({});
  const user = useSelector((state: any) => state.user);
  const { addFoodItem, setSelectedDate } = useMealStore();
  const [foodClassifications, setFoodClassifications] = useState(new Map());
  const [classificationModalVisible, setClassificationModalVisible] = useState(false);
  const [selectedFoodForClassification, setSelectedFoodForClassification] = useState<ToggleSelectionItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  
  // Initial API call to get some default foods
  useEffect(() => {
    searchFood("common foods");
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
      setSelectedDate(selectedDate); // <-- Add this line
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
      setIsSearchMode(false);
      setDisplayData([]);
      setError(null);
      return;
    }

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
      console.error("Error searching for food:", error);
      setSearchResults([]);
      setDisplayData([]);
      setError(`Error searching for food: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const processSearchResults = (foods: FoodItem[]) => {
    const uniqueFoods = new Map();

    foods.forEach((food) => {
      const normalizedName = food.description.toLowerCase().trim();
      if (!uniqueFoods.has(normalizedName)) {
        // Extract a cleaner name from the description
        const cleanName = getCleanName(food.description);
        const score = calculateScore(food);
        const calories = getNutrientValue(food, ["energy", "calories"]);

        uniqueFoods.set(normalizedName, {
          ...food,
          // Add a name field derived from description
          name: cleanName,
          // Add default serving size if not present
          servingSize: food.servingSize || getDefaultServingSize(food.description),
          servingSizeUnit: food.servingSizeUnit || getDefaultServingUnit(food.description),
          category: food.foodCategory || "Unknown",
          yukaScore: score,
          calories: calories,
          carbs: getNutrientValue(food, ["carbohydrate", "carbs"]).toFixed(1),
          fat: getNutrientValue(food, ["fat", "total fat"]).toFixed(1),
          protein: getNutrientValue(food, ["protein"]).toFixed(1),
          expanded: false,
        });
      }
    });

    return Array.from(uniqueFoods.values()).slice(0, 50);
  };

  // Function to extract a cleaner name from the description
  const getCleanName = (description: string) => {
    // Remove brand names, UPC codes, and other unnecessary information
    let name = description;

    // Remove text in parentheses
    name = name.replace(/\([^)]*\)/g, "");

    // Remove text after comma, colon, or dash
    name = name.split(/[,:-]/)[0];

    // Capitalize first letter of each word
    name = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Trim extra spaces
    name = name.trim();

    // If the name is too long, truncate it
    if (name.length > 25) {
      name = name.substring(0, 22) + "...";
    }

    return name;
  };

  const getDefaultServingSize = (description: string) => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("coffee") || lowerDesc.includes("tea")) return 1;
    if (
      lowerDesc.includes("apple") ||
      lowerDesc.includes("banana") ||
      lowerDesc.includes("orange") ||
      lowerDesc.includes("guava")
    )
      return 1;
    if (lowerDesc.includes("almond")) return 5;
    if (lowerDesc.includes("egg")) return 1;
    if (lowerDesc.includes("milk")) return 0.75;
    if (lowerDesc.includes("walnut")) return 4;
    return 1;
  };

  const getDefaultServingUnit = (description: string) => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("coffee") || lowerDesc.includes("tea"))
      return "Tea cup";
    if (lowerDesc.includes("apple")) return 'Small (2-3/4" dia)';
    if (lowerDesc.includes("banana")) return 'Small (4.5" long)';
    if (lowerDesc.includes("orange")) return 'fruit (2-5/8" dia)';
    if (lowerDesc.includes("almond")) return "almond";
    if (lowerDesc.includes("guava")) return "fruit, with refuse";
    if (lowerDesc.includes("egg")) return "large";
    if (lowerDesc.includes("milk")) return "glass";
    if (lowerDesc.includes("walnut")) return "piece (half of one)";
    return "serving";
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
    const energy = getNutrientValue(foodItem, ["energy", "calories"]) * factor; // kcal
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

  const toggleExpanded = (id: number) => {
    // Initialize animation value if it doesn't exist
    if (!animatedValues.current[id]) {
      animatedValues.current[id] = new Animated.Value(0);
    }
    
    // Toggle expanded state
    const isExpanding = expandedId !== id;
    setExpandedId(isExpanding ? id : null);
    
    // Animate to expanded or collapsed state
    Animated.timing(animatedValues.current[id], {
      toValue: isExpanding ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false, // Set to false for height animations
    }).start();
  };

  // Update the renderFoodItem to use the new toggleSelection
  const renderFoodItem = ({ item }: { item: any }) => {
    const isSelected = selectedItems.has(item.fdcId);
    const calories = item.calories ?? 0;

    return (
      <View style={styles.foodItemContainer}>
        <TouchableOpacity
          onPress={() => toggleExpanded(item.fdcId)}
          style={styles.foodItem}
          activeOpacity={0.7}
        >
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>
              {isSelected && (
                <>
                  <View style={[
                    styles.classificationDot,
                    {
                      backgroundColor: foodClassifications.get(item.fdcId) === 'bad'
                        ? 'rgba(252, 49, 48, 1)'  // Red for bad food
                        : 'rgba(64, 206, 35, 1)'  // Green for good food
                    }
                  ]} />
                  <Text> </Text> {/* Small space after dot */}
                </>
              )}
              {item.name || item.description}
            </Text>
            
            <Text style={styles.servingSize}>
              <Text>{item.servingSize}</Text> 
              <Text>{item.servingSizeUnit}</Text>
            </Text>
          </View>

          <View style={styles.rightContent}>
            <Text style={styles.calories}>{calories} Cal</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => toggleSelection(item)}
            >
              {isSelected ? (
                <View
                  style={{
                    width: 20,
                    height: 20,
                    padding: 2,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#EBF9F1",
                    borderRadius: 50,
                  }}
                >
                  <Feather name="check" size={15} color="#38C472" />
                </View>
              ) : (
                <Feather name="plus" size={18} color="#38C472" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#434343" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#666666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('meals.searchPlaceholder')}
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length > 2) {
                searchFood(text);
              } else if (text.length === 0) {
                searchFood("common foods");
              }
            }}
          />
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#00A991" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.fdcId.toString()}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>{t('meals.sectionTitle')}</Text>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FoodClassificationModal
        visible={classificationModalVisible}
        foodName={selectedFoodForClassification?.name || selectedFoodForClassification?.description || ''}
        onClose={handleModalClose}
        onClassify={handleFoodClassification}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 4,
    backgroundColor: "#fff",
    height: 56,
  },
  backButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 50,
    paddingVertical: 12,
    marginLeft: 10,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 12,
    fontFamily: "Inter400",
    color: "#000",
  },
  loader: {
    marginTop: 50,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter600",
    color: "#373737",
    marginTop: 20,
    marginBottom: 10,
  },
  foodItemContainer: {
    marginBottom: 4,
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  expandedFoodItem: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 0,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontFamily: "Inter500",
    color: "#434343",
    marginBottom: 4,
  },
  classificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  servingSize: {
    fontSize: 12,
    flexDirection:'row',
    alignItems:'center',
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  calories: {
    fontSize: 14,
    fontFamily: "Inter500",
    color: "#434343",
    marginRight: 6,
  },
  expandedDetails: {
    backgroundColor: "#F9F9F9",
    padding: 12,
    borderRadius: 8,
    marginTop:10,
    marginBottom: 10,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: "Inter500",
    color: "#7B7B7B",
    marginRight: 4,
  },
  categoryValue: {
    fontSize: 12,
    fontFamily: "Inter400",
    color: "#434343",
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: "Inter400",
    color: "#7B7B7B",
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 14,
    fontFamily: "Inter600",
    color: "#434343",
  },
  addButton: {
    padding: 4,
  },
  expandedDetailsContainer: {
    overflow: 'hidden',
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#666666",
    textAlign: "center",
    fontFamily: "Inter400",
  },
});

export default addmeals;