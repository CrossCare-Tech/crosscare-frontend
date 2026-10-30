import { BABY_WEEKS } from "@/constants/babyWeeks";

// Size comparison pictures for the Compare tab, one per pregnancy week (4 to 40).
const FRUIT_IMAGES: Record<number, any> = {
  4: require("@/assets/images/fruits/week04-poppy-seed.png"),
  5: require("@/assets/images/fruits/week05-sesame-seed.png"),
  6: require("@/assets/images/fruits/week06-lentil.png"),
  7: require("@/assets/images/fruits/week07-blueberry.png"),
  8: require("@/assets/images/fruits/week08-raspberry.png"),
  9: require("@/assets/images/fruits/week09-cherry.png"),
  10: require("@/assets/images/fruits/week10-kumquat.png"),
  11: require("@/assets/images/fruits/week11-fig.png"),
  12: require("@/assets/images/fruits/week12-lime.png"),
  13: require("@/assets/images/fruits/week13-peach.png"),
  14: require("@/assets/images/fruits/week14-lemon.png"),
  15: require("@/assets/images/fruits/week15-apple.png"),
  16: require("@/assets/images/fruits/week16-avocado.png"),
  17: require("@/assets/images/fruits/week17-pear.png"),
  18: require("@/assets/images/fruits/week18-bell-pepper.png"),
  19: require("@/assets/images/fruits/week19-heirloom-tomato.png"),
  20: require("@/assets/images/fruits/week20-banana.png"),
  21: require("@/assets/images/fruits/week21-carrot.png"),
  22: require("@/assets/images/fruits/week22-mango.png"),
  23: require("@/assets/images/fruits/week23-grapefruit.png"),
  24: require("@/assets/images/fruits/week24-ear-of-corn.png"),
  25: require("@/assets/images/fruits/week25-cauliflower.png"),
  26: require("@/assets/images/fruits/week26-lettuce-head.png"),
  27: require("@/assets/images/fruits/week27-cabbage.png"),
  28: require("@/assets/images/fruits/week28-eggplant.png"),
  29: require("@/assets/images/fruits/week29-butternut-squash.png"),
  30: require("@/assets/images/fruits/week30-cucumber.png"),
  31: require("@/assets/images/fruits/week31-pineapple.png"),
  32: require("@/assets/images/fruits/week32-coconut.png"),
  33: require("@/assets/images/fruits/week33-large-pineapple.png"),
  34: require("@/assets/images/fruits/week34-cantaloupe.png"),
  35: require("@/assets/images/fruits/week35-honeydew-melon.png"),
  36: require("@/assets/images/fruits/week36-romaine-heart.png"),
  37: require("@/assets/images/fruits/week37-swiss-chard.png"),
  38: require("@/assets/images/fruits/week38-leek.png"),
  39: require("@/assets/images/fruits/week39-mini-watermelon.png"),
  40: require("@/assets/images/fruits/week40-small-watermelon.png"),
};

const clampWeek = (week: number) => Math.min(Math.max(week, 4), 40);

export const fruitImageForWeek = (week: number) => FRUIT_IMAGES[clampWeek(week)];

// Translation key (under `babyObjects`) of the object the Compare picture shows, so the Home and Profile
// name the same thing: "Small watermelon" -> "smallWatermelon"
export const babyObjectKeyForWeek = (week: number) =>
  BABY_WEEKS[clampWeek(week)].object
    .toLowerCase()
    .replace(/ (\w)/g, (_, letter: string) => letter.toUpperCase());
