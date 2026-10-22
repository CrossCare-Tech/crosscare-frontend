// Fruit key (translation key under `fruits`) for each pregnancy week.
// Mirrors the names used by components/WeekSelector.tsx.
export const FRUIT_BY_WEEK: string[] = [
  "comingSoon", // 0
  "poppySeed",
  "sesameSeed",
  "lentilSeed",
  "lentilSeed",
  "appleSeed", // 5
  "pea",
  "blueberry",
  "raspberry",
  "grape",
  "kumquat", // 10
  "lime",
  "plum",
  "peach",
  "lemon",
  "apple", // 15
  "avocado",
  "pear",
  "sweetPotato",
  "mango",
  "banana", // 20
  "pomegranate",
  "papaya",
  "grapefruit",
  "cantaloupe",
  "cauliflower", // 25
  "lettuce",
  "eggplant",
  "coconut",
  "butternutSquash",
  "cabbage", // 30
  "pineapple",
  "squash",
  "durian",
  "honeyDewMelon",
  "coconut", // 35
  "watermelon",
  "swissChard",
  "pumpkin",
  "watermelon",
  "smallPumpkin", // 40
];

export const fruitForWeek = (week: number) =>
  FRUIT_BY_WEEK[Math.min(Math.max(week, 0), FRUIT_BY_WEEK.length - 1)];
