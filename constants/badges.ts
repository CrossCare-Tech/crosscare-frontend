// Badge catalogue shared by the Hall of Fame screen.
// Moved from app/patient/profile-setting/earnbadge.tsx.


const REGULAR_BADGE_TYPES = [
  "HYDRATED_QUEEN",
  "SNAPSHOT",
  "GETTING_TO_KNOW_YOU",
  "HEART_SCRIBE",
  "RESTED_DIVA",
  "EXPLORER",
];

const STREAK_BADGE_TYPES = [
  "HOT_MAMA",
  "SLEEP_WIZARD_I",
  "SLEEP_WIZARD_II",
  "SLEEP_WIZARD_III",
  "SLEEP_WIZARD_IV",
  "SLEEP_WIZARD_V",
  "SLEEP_WIZARD_VI",
  "SLEEP_WIZARD_VII",
  "SLEEP_WIZARD_VIII",
  "SLEEP_WIZARD_IX",
  "WATER_WIZARD_I",
  "WATER_WIZARD_II",
  "WATER_WIZARD_III",
  "WATER_WIZARD_IV",
  "WATER_WIZARD_V",
  "WATER_WIZARD_VI",
  "WATER_WIZARD_VII",
  "WATER_WIZARD_VIII",
  "WATER_WIZARD_IX",
  "HEALTH_QUEEN_I",
  "HEALTH_QUEEN_II",
  "HEALTH_QUEEN_III",
  "HEALTH_QUEEN_IV",
  "HEALTH_QUEEN_V",
  "HEALTH_QUEEN_VI",
  "HEALTH_QUEEN_VII",
  "HEALTH_QUEEN_VIII",
  "HEALTH_QUEEN_IX",
  "ON_THE_MOVE_I",
  "ON_THE_MOVE_II",
  "ON_THE_MOVE_III",
  "ON_THE_MOVE_IV",
  "ON_THE_MOVE_V",
  "ON_THE_MOVE_VI",
  "ON_THE_MOVE_VII",
  "ON_THE_MOVE_VIII",
  "ON_THE_MOVE_IX",
];

export const ALL_BADGE_TYPES = [...REGULAR_BADGE_TYPES, ...STREAK_BADGE_TYPES];

// Artwork shown once a badge is earned

export const BADGE_IMAGES: Record<string, any> = {
  GETTING_TO_KNOW_YOU: require("@/assets/images/badge/trivia.png"),
  HOT_MAMA: require("@/assets/images/badge/Hot Mama.png"),
  SNAPSHOT: require("@/assets/images/badge/snapshot queen.png"),
  HYDRATED_QUEEN: require("@/assets/images/badge/Hydrated Queen.png"),
  HEART_SCRIBE: require("@/assets/images/badge/heart.png"),
  EXPLORER: require("@/assets/images/badge/explorer.png"),
  RESTED_DIVA: require("@/assets/images/badge/diva.png"),
  SLEEP_WIZARD_I: require("@/assets/images/badge/Sleep Wizard 1.png"),
  SLEEP_WIZARD_II: require("@/assets/images/badge/Sleep Wizard 2.png"),
  SLEEP_WIZARD_III: require("@/assets/images/badge/Sleep Wizard 3.png"),
  SLEEP_WIZARD_IV: require("@/assets/images/badge/Sleep Wizard 4.png"),
  SLEEP_WIZARD_V: require("@/assets/images/badge/Sleep Wizard 5.png"),
  SLEEP_WIZARD_VI: require("@/assets/images/badge/Sleep Wizard 6.png"),
  SLEEP_WIZARD_VII: require("@/assets/images/badge/Sleep Wizard 7.png"),
  SLEEP_WIZARD_VIII: require("@/assets/images/badge/Sleep Wizard 8.png"),
  SLEEP_WIZARD_IX: require("@/assets/images/badge/Sleep Wizard 9.png"),
  WATER_WIZARD_I: require("@/assets/images/badge/Water Wizard 1.png"),
  WATER_WIZARD_II: require("@/assets/images/badge/Water Wizard 2.png"),
  WATER_WIZARD_III: require("@/assets/images/badge/Water Wizard 3.png"),
  WATER_WIZARD_IV: require("@/assets/images/badge/Water Wizard 4.png"),
  WATER_WIZARD_V: require("@/assets/images/badge/Water Wizard 5.png"),
  WATER_WIZARD_VI: require("@/assets/images/badge/Water Wizard 6.png"),
  WATER_WIZARD_VII: require("@/assets/images/badge/Water Wizard 7.png"),
  WATER_WIZARD_VIII: require("@/assets/images/badge/Water Wizard 8.png"),
  WATER_WIZARD_IX: require("@/assets/images/badge/Water Wizard 9.png"),
  HEALTH_QUEEN_I: require("@/assets/images/badge/Health Wizard 1.png"),
  HEALTH_QUEEN_II: require("@/assets/images/badge/Health Wizard 2.png"),
  HEALTH_QUEEN_III: require("@/assets/images/badge/Health Wizard 3.png"),
  HEALTH_QUEEN_IV: require("@/assets/images/badge/Health Wizard 4.png"),
  HEALTH_QUEEN_V: require("@/assets/images/badge/Health Wizard 5.png"),
  HEALTH_QUEEN_VI: require("@/assets/images/badge/Health Wizard 6.png"),
  HEALTH_QUEEN_VII: require("@/assets/images/badge/Health Wizard 7.png"),
  HEALTH_QUEEN_VIII: require("@/assets/images/badge/Health Wizard 8.png"),
  HEALTH_QUEEN_IX: require("@/assets/images/badge/Health Wizard 9.png"),
  ON_THE_MOVE_I: require("@/assets/images/badge/On The Move 1.png"),
  ON_THE_MOVE_II: require("@/assets/images/badge/On The Move 2.png"),
  ON_THE_MOVE_III: require("@/assets/images/badge/On The Move 3.png"),
  ON_THE_MOVE_IV: require("@/assets/images/badge/On The Move 4.png"),
  ON_THE_MOVE_V: require("@/assets/images/badge/On The Move 5.png"),
  ON_THE_MOVE_VI: require("@/assets/images/badge/On The Move 6.png"),
  ON_THE_MOVE_VII: require("@/assets/images/badge/On The Move 7.png"),
  ON_THE_MOVE_VIII: require("@/assets/images/badge/On The Move 8.png"),
  ON_THE_MOVE_IX: require("@/assets/images/badge/On The Move 9.png"),
};

// Greyed-out artwork for badges not earned yet (falls back to BADGE_IMAGES)

export const LOCKED_BADGE_IMAGES: Record<string, any> = {
  HYDRATED_QUEEN: require("@/assets/images/badge/Hydrated Queen locked.png"),
  RESTED_DIVA: require("@/assets/images/badge/diva locked.png"),
  HEART_SCRIBE: require("@/assets/images/badge/heart locked.png"),
  HOT_MAMA: require("@/assets/images/badge/Hot Mama(lock).png"),
  GETTING_TO_KNOW_YOU: require("@/assets/images/badge/trivia lcoked.png"),
  SNAPSHOT: require("@/assets/images/badge/snapshot queen locked.png"),
  EXPLORER: require("@/assets/images/badge/explorer locked.png"),
  SLEEP_WIZARD_I: require("@/assets/images/badge/Sleep Wizard 1(lock).png"),
  SLEEP_WIZARD_II: require("@/assets/images/badge/Sleep Wizard 2(lock).png"),
  SLEEP_WIZARD_III: require("@/assets/images/badge/Sleep Wizard 3(lock).png"),
  SLEEP_WIZARD_IV: require("@/assets/images/badge/Sleep Wizard 4(lock).png"),
  SLEEP_WIZARD_V: require("@/assets/images/badge/Sleep Wizard 5(lock).png"),
  SLEEP_WIZARD_VI: require("@/assets/images/badge/Sleep Wizard 6(lock).png"),
  SLEEP_WIZARD_VII: require("@/assets/images/badge/Sleep Wizard 7(lock).png"),
  SLEEP_WIZARD_VIII: require("@/assets/images/badge/Sleep Wizard 8(lock).png"),
  SLEEP_WIZARD_IX: require("@/assets/images/badge/Sleep Wizard 9(lock).png"),
  HEALTH_QUEEN_I: require("@/assets/images/badge/Health Wizard 1(lock).png"),
  HEALTH_QUEEN_II: require("@/assets/images/badge/Health Wizard 2(lock).png"),
  HEALTH_QUEEN_III: require("@/assets/images/badge/Health Wizard 3(lock).png"),
  HEALTH_QUEEN_IV: require("@/assets/images/badge/Health Wizard 4(lock).png"),
  HEALTH_QUEEN_V: require("@/assets/images/badge/Health Wizard 5(lock).png"),
  HEALTH_QUEEN_VI: require("@/assets/images/badge/Health Wizard 6(lock).png"),
  HEALTH_QUEEN_VII: require("@/assets/images/badge/Health Wizard 7(lock).png"),
  HEALTH_QUEEN_VIII: require("@/assets/images/badge/Health Wizard 8(lock).png"),
  HEALTH_QUEEN_IX: require("@/assets/images/badge/Health Wizard 9(lock).png"),
  WATER_WIZARD_I: require("@/assets/images/badge/Water Wizard 1(lock).png"),
  WATER_WIZARD_II: require("@/assets/images/badge/Water Wizard 2(lock).png"),
  WATER_WIZARD_III: require("@/assets/images/badge/Water Wizard 3(lock).png"),
  WATER_WIZARD_IV: require("@/assets/images/badge/Water Wizard 4(lock).png"),
  WATER_WIZARD_V: require("@/assets/images/badge/Water Wizard 5(lock).png"),
  WATER_WIZARD_VI: require("@/assets/images/badge/Water Wizard 6(lock).png"),
  WATER_WIZARD_VII: require("@/assets/images/badge/Water Wizard 7(lock).png"),
  WATER_WIZARD_VIII: require("@/assets/images/badge/Water Wizard 8(lock).png"),
  WATER_WIZARD_IX: require("@/assets/images/badge/Water Wizard 9(lock).png"),
  ON_THE_MOVE_I: require("@/assets/images/badge/On The Move 1(lock).png"),
  ON_THE_MOVE_II: require("@/assets/images/badge/On The Move 2(lock).png"),
  ON_THE_MOVE_III: require("@/assets/images/badge/On The Move 3(lock).png"),
  ON_THE_MOVE_IV: require("@/assets/images/badge/On The Move 4(lock).png"),
  ON_THE_MOVE_V: require("@/assets/images/badge/On The Move 5(lock).png"),
  ON_THE_MOVE_VI: require("@/assets/images/badge/On The Move 6(lock).png"),
  ON_THE_MOVE_VII: require("@/assets/images/badge/On The Move 7(lock).png"),
  ON_THE_MOVE_VIII: require("@/assets/images/badge/On The Move 8(lock).png"),
  ON_THE_MOVE_IX: require("@/assets/images/badge/On The Move 9(lock).png"),
};

// Translation keys. GETTING_TO_KNOW_YOU uses the TRIVIA_QUEEN copy.
const copyKey = (type: string) =>
  type === "GETTING_TO_KNOW_YOU" ? "TRIVIA_QUEEN" : type;

export const badgeDescriptionKey = (type: string) =>
  `badgeDescription.${copyKey(type)}`;

export const badgeTipKey = (type: string) => `badgeTips.${copyKey(type)}`;

// SLEEP_WIZARD_III -> "Sleep Wizard III"
export const badgeTitle = (type: string) =>
  type
    .split("_")
    .map((word) =>
      /^[IVX]+$/.test(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
