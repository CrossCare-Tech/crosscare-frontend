// Baby illustrations: one every two weeks from the design prototype (8 to 40), plus week 39.
const BABY_IMAGES: Record<number, any> = {
  8: require("@/assets/images/baby/w08.jpg"),
  10: require("@/assets/images/baby/w10.jpg"),
  12: require("@/assets/images/baby/w12.jpg"),
  14: require("@/assets/images/baby/w14.jpg"),
  16: require("@/assets/images/baby/w16.jpg"),
  18: require("@/assets/images/baby/w18.jpg"),
  20: require("@/assets/images/baby/w20.jpg"),
  22: require("@/assets/images/baby/w22.jpg"),
  24: require("@/assets/images/baby/w24.jpg"),
  26: require("@/assets/images/baby/w26.jpg"),
  28: require("@/assets/images/baby/w28.jpg"),
  30: require("@/assets/images/baby/w30.jpg"),
  32: require("@/assets/images/baby/w32.jpg"),
  34: require("@/assets/images/baby/w34.jpg"),
  36: require("@/assets/images/baby/w36.jpg"),
  38: require("@/assets/images/baby/w38.jpg"),
  39: require("@/assets/images/baby/w39.jpg"),
  40: require("@/assets/images/baby/w40.jpg"),
};

// The illustration of the week when there is one, else the closest one below (weeks before 8 use week 8)
export const babyImageForWeek = (week: number) => {
  const clamped = Math.min(Math.max(week, 8), 40);
  return BABY_IMAGES[clamped] ?? BABY_IMAGES[clamped - (clamped % 2)];
};
