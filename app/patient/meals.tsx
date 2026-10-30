import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import { foodImageByName } from "@/constants/foodCatalog";
import { useMealStore } from "@/zustandStore/mealStore";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { useAuthDialog } from "@/components/ui/AuthDialog";
import AuthTopBar from "@/components/ui/AuthTopBar";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { Pill, ReadingModal } from "@/components/vitals/VitalsUI";
import {
  ChartCard,
  daysAgo,
  fmtDate,
  GuideNote,
  metricParts,
  metricStyles,
  Period,
  periodAxis,
  periodWindow,
  RangeBarsChart,
  Segmented,
  toLocalDay,
} from "@/components/vitals/MetricUI";

// Store meal types, with the translation keys the add-food screen expects back
const MEALS = [
  { type: "BREAKFAST", key: "meals.mealTitles.Breakfast" },
  { type: "LUNCH", key: "meals.mealTitles.Lunch" },
  { type: "SNACK", key: "meals.mealTitles.Snacks" },
  { type: "DINNER", key: "meals.mealTitles.Dinner" },
] as const;

const BAR_WIDTH: Record<Period, number> = { "7": 14, "30": 6, "90": 3 };

// Food: calories for the chosen day against the goal, the four meals, then the history
export default function FoodScreen() {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  const { t, i18n } = useTranslation();
  const { dialog, show } = useAuthDialog();
  const {
    calorieGoal,
    caloriesConsumed,
    goodFoodCount,
    badFoodCount,
    meals,
    selectedDate,
    isLoading,
    updateCalorieGoal,
    fetchMealsForDate,
    deleteFoodItem,
    setSelectedDate,
    updateFoodItemQuantity,
  } = useMealStore();

  const [period, setPeriod] = useState<Period>("7");
  const [history, setHistory] = useState<{ date: string; calories: number }[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [goalVisible, setGoalVisible] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const todayStr = fmtDate(daysAgo(0));
  const day = selectedDate && selectedDate <= todayStr ? selectedDate : todayStr;

  useEffect(() => {
    AsyncStorage.setItem("meal_1", "true");
  }, []);

  // Always open on today, in the patient's timezone
  useEffect(() => {
    if (!userId) return;
    setSelectedDate(todayStr);
    fetchMealsForDate(userId, todayStr);
  }, [userId]);

  // Daily totals for the chart: this month and last month cover the 30-day window
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const ranges = await Promise.all(
          ["lastMonth", "month"].map(async (range) => {
            const response = await fetch(`${CONFIG.API_BASE_URL}/user/activity/${userId}/calorieHistory?timeRange=${range}`);
            const data = await response.json();
            return (data?.chartData || []) as { date: string; calories: number }[];
          })
        );
        const byDate = new Map<string, number>();
        ranges.flat().forEach((item) => {
          if (item?.date && item.calories > 0) byDate.set(toLocalDay(String(item.date).slice(0, 10)), item.calories);
        });
        setHistory([...byDate.entries()].map(([date, calories]) => ({ date, calories })).sort((a, b) => a.date.localeCompare(b.date)));
      } catch (error) {
        console.warn("Error fetching calorie history:", error);
      }
    };
    load();
  }, [userId, caloriesConsumed]);

  const showDay = (date: string) => {
    if (!userId) return;
    setSelectedDate(date);
    fetchMealsForDate(userId, date);
  };
  const shiftDay = (by: number) => {
    const d = new Date(`${day}T12:00:00`);
    d.setDate(d.getDate() + by);
    const next = fmtDate(d);
    if (next <= todayStr) showDay(next);
  };

  const dayLabel = (date: string) => {
    if (date === todayStr) return t("bloodPressureLog.today");
    if (date === fmtDate(daysAgo(1))) return t("bloodPressureLog.yesterday");
    return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { weekday: "short", month: "short", day: "numeric" });
  };
  const number = (value: number) => Math.round(value).toLocaleString(i18n.language);

  // The store keeps several saved meals per type; find the one that holds this food
  const locate = (type: string, foodId?: string) => {
    for (const meal of meals[type as keyof typeof meals] || []) {
      if ((meal.foodItems || []).some((food: any) => food.id === foodId)) return meal.id;
    }
    return null;
  };

  const changeQuantity = (type: string, food: any, quantity: number) => {
    const mealId = locate(type, food.id);
    if (userId && mealId && food.id && quantity >= 1) updateFoodItemQuantity(userId, mealId, food.id, quantity);
  };

  const confirmDelete = (type: string, food: any) => {
    const mealId = locate(type, food.id);
    if (!userId || !mealId || !food.id) return;
    show({
      variant: "delete",
      title: t("foodLog.delete"),
      message: t("foodLog.deleteConfirm", { name: food.name }),
      buttons: [
        { text: t("cancel"), style: "cancel" },
        { text: t("foodLog.delete"), onPress: () => deleteFoodItem(userId, mealId, food.id) },
      ],
    });
  };

  const openGoal = () => {
    setGoalDraft(String(calorieGoal || 2000));
    setGoalVisible(true);
  };
  const saveGoal = () => {
    const value = Number(goalDraft);
    if (!Number.isInteger(value) || value < 1000 || value > 5000) {
      Alert.alert(t("vitalsEntry.errorTitle"), t("foodLog.goalInvalid"));
      return;
    }
    if (userId) updateCalorieGoal(userId, value, day);
    setGoalVisible(false);
  };

  const goal = calorieGoal || 2000;
  const left = Math.max(goal - caloriesConsumed, 0);
  const range = periodWindow(period);
  const inRange = history.filter((item) => range.contains(item.date));
  const chartMax = Math.max(goal, ...inRange.map((item) => item.calories)) * 1.1;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("foodLog.title")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[metricStyles.content, styles.content]}>
          <View style={styles.dayRow}>
            <TouchableOpacity
              style={styles.dayArrow}
              onPress={() => shiftDay(-1)}
              accessibilityRole="button"
              accessibilityLabel={t("foodLog.previousDay")}
            >
              <Feather name="chevron-left" size={18} color={Theme.colors.ink} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.dayPicker} onPress={() => setPickerVisible(true)} accessibilityRole="button">
              <Feather name="calendar" size={15} color={Theme.colors.purple} />
              <Text style={styles.dayText}>{dayLabel(day)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dayArrow, day === todayStr && styles.disabled]}
              onPress={() => shiftDay(1)}
              disabled={day === todayStr}
              accessibilityRole="button"
              accessibilityLabel={t("foodLog.nextDay")}
            >
              <Feather name="chevron-right" size={18} color={Theme.colors.ink} />
            </TouchableOpacity>
          </View>
          {pickerVisible && (
            <DateTimePicker
              value={new Date(`${day}T12:00:00`)}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              maximumDate={new Date()}
              onChange={(event, value) => {
                setPickerVisible(false);
                if (event.type !== "dismissed" && value) showDay(fmtDate(value));
              }}
            />
          )}

          <View style={[metricParts.card, metricParts.hero, styles.today]}>
            <Text style={metricParts.when}>{dayLabel(day)}</Text>
            <View style={styles.countRow}>
              <Text style={metricParts.big}>{number(caloriesConsumed)}</Text>
              <Text style={metricParts.unit}>{t("foodLog.ofGoal", { goal: number(goal) })}</Text>
            </View>
            <View style={styles.track}>
              <LinearGradient
                colors={Theme.home.bars.default}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.fill, { width: `${Math.min(caloriesConsumed / goal, 1) * 100}%` }]}
              />
            </View>
            <View style={styles.metaRow}>
              <Pill
                label={left === 0 ? t("foodLog.goalReached") : t("foodLog.left", { value: number(left) })}
                tone={left === 0 ? "success" : "teal"}
              />
              <TouchableOpacity onPress={openGoal} accessibilityRole="button" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.link}>{t("waterLog.editGoal")}</Text>
              </TouchableOpacity>
            </View>
            {goodFoodCount + badFoodCount > 0 && (
              <View style={styles.quality}>
                <View style={[styles.qualityDot, { backgroundColor: Theme.colors.success }]} />
                <Text style={styles.qualityText}>{t("foodLog.healthy", { count: goodFoodCount })}</Text>
                <View style={[styles.qualityDot, { backgroundColor: Theme.colors.warning }]} />
                <Text style={styles.qualityText}>{t("foodLog.treats", { count: badFoodCount })}</Text>
              </View>
            )}
          </View>

          {isLoading && caloriesConsumed === 0 ? (
            <ActivityIndicator color={Theme.colors.magenta} style={styles.loader} />
          ) : (
            MEALS.map((meal) => {
              const foods = (meals[meal.type as keyof typeof meals] || []).flatMap((item: any) => item.foodItems || []);
              const total = (meals[meal.type as keyof typeof meals] || []).reduce((sum: number, item: any) => sum + (item.totalCalories || 0), 0);
              return (
                <View key={meal.type} style={[metricParts.card, styles.meal]}>
                  <View style={styles.mealHead}>
                    <View style={styles.flex}>
                      <Text style={styles.mealTitle}>{t(meal.key)}</Text>
                      <Text style={styles.mealSub}>
                        {foods.length > 0 ? t("foodLog.kcal", { value: number(total) }) : t("foodLog.nothingYet")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => router.push({ pathname: "/patient/addmeals", params: { mealType: meal.key, selectedDate: day } })}
                      accessibilityRole="button"
                      accessibilityLabel={t("foodLog.addTo", { meal: t(meal.key) })}
                    >
                      <Feather name="plus" size={15} color={Theme.colors.magenta} />
                      <Text style={styles.addText}>{t("foodLog.add")}</Text>
                    </TouchableOpacity>
                  </View>
                  {foods.map((food: any) => {
                    const quantity = food.quantity || 1;
                    const image = foodImageByName(food.name);
                    return (
                      <View key={food.id ?? food.name} style={styles.food}>
                        <View
                          style={[
                            styles.qualityDot,
                            { backgroundColor: food.classification === "BAD" ? Theme.colors.warning : Theme.colors.success },
                          ]}
                        />
                        {image && <Image source={image} style={styles.foodImage} resizeMode="contain" />}
                        <View style={styles.flex}>
                          <Text style={styles.foodName} numberOfLines={2}>
                            {food.name}
                          </Text>
                          <Text style={styles.foodSub}>
                            {food.portion ? `${food.portion} · ` : ""}
                            {t("foodLog.kcal", { value: number((food.calories || 0) * quantity) })}
                          </Text>
                        </View>
                        <View style={styles.stepper}>
                          <TouchableOpacity
                            onPress={() => changeQuantity(meal.type, food, quantity - 1)}
                            disabled={quantity <= 1}
                            style={[styles.stepButton, quantity <= 1 && styles.disabled]}
                            accessibilityRole="button"
                            accessibilityLabel={t("foodLog.less")}
                          >
                            <Feather name="minus" size={14} color={Theme.colors.ink} />
                          </TouchableOpacity>
                          <Text style={styles.stepValue}>{quantity}</Text>
                          <TouchableOpacity
                            onPress={() => changeQuantity(meal.type, food, quantity + 1)}
                            style={styles.stepButton}
                            accessibilityRole="button"
                            accessibilityLabel={t("foodLog.more")}
                          >
                            <Feather name="plus" size={14} color={Theme.colors.ink} />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          onPress={() => confirmDelete(meal.type, food)}
                          accessibilityRole="button"
                          accessibilityLabel={t("foodLog.delete")}
                          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                        >
                          <Feather name="trash-2" size={16} color={Theme.colors.inkFaint} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}

          <Segmented
            options={[
              { id: "7", label: t("metric.days7") },
              { id: "30", label: t("metric.days30") },
            ]}
            value={period}
            onChange={setPeriod}
          />

          <ChartCard axis={periodAxis(period, i18n.language)} legend={[{ mark: "line", label: t("foodLog.legend") }]}>
            <RangeBarsChart
              bars={inRange.map((item) => ({ x: range.x(item.date), high: item.calories, low: 0 }))}
              min={0}
              max={chartMax}
              barWidth={BAR_WIDTH[period]}
            />
          </ChartCard>

          <GuideNote text={t("foodLog.guide")} />
        </ScrollView>

        <ReadingModal
          visible={goalVisible}
          loading={false}
          onSave={saveGoal}
          onClose={() => setGoalVisible(false)}
          title={t("metric.dailyGoal")}
          saveLabel={t("metric.saveGoal")}
          showDateTime={false}
        >
          <CustomTextInput
            label={t("foodLog.goalLabel")}
            value={goalDraft}
            onChangeText={(value) => setGoalDraft(value.replace(/[^\d]/g, ""))}
            placeholder="2000"
            keyboardType="number-pad"
            maxLength={4}
          />
        </ReadingModal>
        {dialog}
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Theme.spacing.xxl,
  },
  flex: {
    flex: 1,
  },
  loader: {
    marginVertical: Theme.spacing.lg,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayArrow: {
    width: 40,
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPicker: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  dayText: {
    fontFamily: Theme.typography.heading,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  disabled: {
    opacity: 0.4,
  },
  today: {
    gap: 10,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.surfaceSunken,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  link: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.magenta,
  },
  quality: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairline,
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  qualityText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 12.5,
    color: Theme.colors.inkSoft,
    marginRight: 10,
  },
  meal: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 4,
  },
  mealHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
  },
  mealTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  mealSub: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magentaTint,
  },
  addText: {
    fontFamily: Theme.typography.heading,
    fontSize: 12.5,
    color: Theme.colors.magenta,
  },
  food: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairlineLight,
  },
  foodImage: {
    width: 32,
    height: 32,
  },
  foodName: {
    fontFamily: Theme.typography.subheading,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
  foodSub: {
    fontFamily: Theme.typography.body,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    minWidth: 14,
    textAlign: "center",
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
  },
});
