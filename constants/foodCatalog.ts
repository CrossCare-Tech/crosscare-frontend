import { ImageSourcePropType } from "react-native";

// Foods shown when the add-food screen opens, before any search. They are the USDA items the old
// "common foods" search returned, pinned by fdcId so the list does not change when USDA updates.
// Calories are kcal per 100 g, from USDA (nutrient 1008).
export type CatalogFood = {
  fdcId: number;
  name: string;
  calories: number;
};

export const COMMON_FOODS: CatalogFood[] = [
  { fdcId: 173044, name: "Guava", calories: 68 },
  { fdcId: 174218, name: "Octopus", calories: 82 },
  { fdcId: 168514, name: "Cabbage, cooked", calories: 23 },
  { fdcId: 173758, name: "Black-eyed peas", calories: 336 },
  { fdcId: 170189, name: "Tahini (sesame butter)", calories: 595 },
  { fdcId: 169705, name: "Oats", calories: 389 },
  { fdcId: 170302, name: "Biscuit", calories: 370 },
  { fdcId: 170300, name: "Coleslaw", calories: 153 },
  { fdcId: 2707854, name: "Angel food cake", calories: 257 },
  { fdcId: 2710037, name: "Jai (monk's food)", calories: 60 },
  { fdcId: 173414, name: "Cheddar cheese", calories: 403 },
  { fdcId: 171688, name: "Apple", calories: 52 },
  { fdcId: 173950, name: "Blueberries, frozen", calories: 51 },
  { fdcId: 173949, name: "Wild blueberries", calories: 57 },
  { fdcId: 169983, name: "Carrots, frozen", calories: 36 },
  { fdcId: 171723, name: "Dried cranberries", calories: 308 },
  { fdcId: 169098, name: "Orange juice", calories: 45 },
  { fdcId: 169917, name: "Orange", calories: 49 },
  { fdcId: 174294, name: "Peanut butter", calories: 588 },
  { fdcId: 167776, name: "Pear", calories: 63 },
  { fdcId: 168443, name: "Potato wedges", calories: 129 },
  { fdcId: 168165, name: "Raisins", calories: 299 },
  { fdcId: 168173, name: "Strawberries, frozen", calories: 35 },
  { fdcId: 172030, name: "Biscuit with ham", calories: 342 },
  { fdcId: 172031, name: "Biscuit with sausage", calories: 371 },
  { fdcId: 172038, name: "Burrito with beans", calories: 206 },
  { fdcId: 173321, name: "Chicken tenders", calories: 271 },
  { fdcId: 173272, name: "Scrambled eggs", calories: 212 },
  { fdcId: 170301, name: "Hush puppies", calories: 296 },
  { fdcId: 170291, name: "Nachos with cheese", calories: 343 },
  { fdcId: 170699, name: "Mashed potatoes", calories: 89 },
  { fdcId: 170765, name: "Quesadilla with chicken", calories: 294 },
  { fdcId: 173275, name: "Caramel sundae", calories: 196 },
  { fdcId: 172036, name: "Strawberry sundae", calories: 175 },
  { fdcId: 2705463, name: "Baby and toddler food", calories: 75 },
  { fdcId: 2705770, name: "Processed cheese", calories: 307 },
  { fdcId: 2709814, name: "Restaurant coleslaw", calories: 159 },
];

// Picture of each food, by fdcId (assets/images/foods, 192 px). Foods without one show a generic icon.
export const FOOD_IMAGES: Record<number, ImageSourcePropType> = {
  173044: require("@/assets/images/foods/guavas-common.png"),
  174218: require("@/assets/images/foods/mollusks-octopus.png"),
  168514: require("@/assets/images/foods/cabbage-common.png"),
  173758: require("@/assets/images/foods/cowpeas-common.png"),
  170189: require("@/assets/images/foods/seeds-sesame-butter.png"),
  169705: require("@/assets/images/foods/oats.png"),
  170302: require("@/assets/images/foods/biscuit.png"),
  170300: require("@/assets/images/foods/coleslaw.png"),
  2707854: require("@/assets/images/foods/cake-angel-food.png"),
  2710037: require("@/assets/images/foods/jai-monks-food.png"),
  173414: require("@/assets/images/foods/cheese-cheddar.png"),
  171688: require("@/assets/images/foods/apples-raw.png"),
  173950: require("@/assets/images/foods/blueberries-frozen.png"),
  173949: require("@/assets/images/foods/blueberries-wild.png"),
  169983: require("@/assets/images/foods/carrots-frozen.png"),
  171723: require("@/assets/images/foods/cranberries-dried.png"),
  169098: require("@/assets/images/foods/orange-juice-raw.png"),
  169917: require("@/assets/images/foods/oranges-raw.png"),
  174294: require("@/assets/images/foods/peanut-butter-smooth.png"),
  167776: require("@/assets/images/foods/pears-raw.png"),
  168443: require("@/assets/images/foods/potato-wedges-frozen.png"),
  168165: require("@/assets/images/foods/raisins-dark.png"),
  168173: require("@/assets/images/foods/strawberries-frozen.png"),
  172030: require("@/assets/images/foods/biscuit-with-ham.png"),
  172031: require("@/assets/images/foods/biscuit-with-sausage.png"),
  172038: require("@/assets/images/foods/burrito-with-beans.png"),
  173321: require("@/assets/images/foods/chicken-tenders.png"),
  173272: require("@/assets/images/foods/egg-scrambled.png"),
  170301: require("@/assets/images/foods/hush-puppies.png"),
  170291: require("@/assets/images/foods/nachos-with-cheese.png"),
  170699: require("@/assets/images/foods/potato-mashed.png"),
  170765: require("@/assets/images/foods/quesadilla-with-chicken.png"),
  173275: require("@/assets/images/foods/sundae-caramel.png"),
  172036: require("@/assets/images/foods/sundae-strawberry.png"),
  2705463: require("@/assets/images/foods/baby-toddler-food.png"),
  2705770: require("@/assets/images/foods/cheese-processed.png"),
  2709814: require("@/assets/images/foods/coleslaw-restaurant.png"),
};

const CATALOG_BY_ID = new Map(COMMON_FOODS.map((food) => [food.fdcId, food]));

export const catalogFood = (fdcId: number) => CATALOG_BY_ID.get(fdcId);

// Other names USDA gives the same foods ("Potato, mashed" for "Mashed potatoes"), so a search result from
// another USDA entry, or a food logged under that name, still gets the picture
const IMAGE_ALIASES: Record<number, string[]> = {
  173044: ["Guavas, common"],
  174218: ["Mollusks, octopus"],
  168514: ["Cabbage, common"],
  173758: ["Cowpeas, common"],
  170189: ["Seeds, sesame butter"],
  2707854: ["Cake, angel food"],
  173414: ["Cheese, cheddar"],
  171688: ["Apples, raw"],
  173949: ["Blueberries, wild"],
  171723: ["Cranberries, dried"],
  169098: ["Orange juice, raw"],
  169917: ["Oranges, raw"],
  174294: ["Peanut butter, smooth"],
  167776: ["Pears, raw"],
  168443: ["Potato wedges, frozen"],
  168165: ["Raisins, dark"],
  173272: ["Egg, scrambled"],
  170302: ["Biscuit, from fast food / restaurant"],
  170699: ["Potato, mashed"],
  173275: ["Sundae, caramel"],
  172036: ["Sundae, strawberry"],
  2705463: ["Baby toddler food"],
  2705770: ["Cheese, processed cheese food"],
  2709814: ["Coleslaw, fast food / restaurant"],
};

// Pictures for foods that only come up in searches (the "fast food" results). USDA lists each of them under
// several entries, so they are found by name
const SEARCH_FOOD_IMAGES: { image: ImageSourcePropType; names: string[] }[] = [
  { image: require("@/assets/images/foods/oatmeal.png"), names: ["Oatmeal", "Oatmeal, fast food"] },
  { image: require("@/assets/images/foods/apple-pie.png"), names: ["Apple pie", "Pie, apple"] },
  { image: require("@/assets/images/foods/milk-shake.png"), names: ["Milk shake", "Milkshake", "Shake, fast food", "Beverages, shake", "Milk shake, fast food"] },
  { image: require("@/assets/images/foods/waffle-plain.png"), names: ["Waffle", "Waffle, plain"] },
  { image: require("@/assets/images/foods/waffle-chocolate.png"), names: ["Chocolate waffle", "Waffle, chocolate"] },
  { image: require("@/assets/images/foods/waffle-fruit.png"), names: ["Fruit waffle", "Waffle, fruit"] },
  { image: require("@/assets/images/foods/pancakes-plain.png"), names: ["Pancakes", "Pancakes, plain"] },
  { image: require("@/assets/images/foods/pancakes-chocolate.png"), names: ["Chocolate pancakes", "Pancakes, chocolate"] },
  { image: require("@/assets/images/foods/pancakes-fruit.png"), names: ["Fruit pancakes", "Pancakes, fruit"] },
  { image: require("@/assets/images/foods/biscuit-with-egg.png"), names: ["Biscuit with egg", "Biscuit, with egg"] },
  { image: require("@/assets/images/foods/biscuit-with-egg-and-bacon.png"), names: ["Biscuit with egg and bacon", "Biscuit, with egg and bacon"] },
  { image: require("@/assets/images/foods/biscuit-with-egg-and-ham.png"), names: ["Biscuit with egg and ham", "Biscuit, with egg and ham"] },
  { image: require("@/assets/images/foods/biscuit-with-egg-and-sausage.png"), names: ["Biscuit with egg and sausage", "Biscuit, with egg and sausage"] },
  { image: require("@/assets/images/foods/biscuit-with-crispy-chicken.png"), names: ["Biscuit with crispy chicken", "Biscuit, with crispy chicken fillet"] },
  { image: require("@/assets/images/foods/burrito-with-beans-and-beef.png"), names: ["Burrito with beans and beef", "Burrito, with beans and beef"] },
  { image: require("@/assets/images/foods/burrito-with-beans-and-cheese.png"), names: ["Burrito with beans and cheese", "Burrito, with beans and cheese"] },
  { image: require("@/assets/images/foods/french-toast.png"), names: ["French toast", "French toast, fast food / restaurant"] },
  { image: require("@/assets/images/foods/french-toast-sticks.png"), names: ["French toast sticks"] },
  { image: require("@/assets/images/foods/cinnamon-rolls.png"), names: ["Cinnamon rolls", "Miniature cinnamon rolls"] },
  { image: require("@/assets/images/foods/fried-shrimp.png"), names: ["Fried shrimp", "Shrimp, breaded and fried"] },
  { image: require("@/assets/images/foods/sundae-hot-fudge.png"), names: ["Hot fudge sundae", "Sundae, hot fudge"] },
  { image: require("@/assets/images/foods/breadsticks.png"), names: ["Breadsticks", "Breadsticks, soft"] },
  { image: require("@/assets/images/foods/cheeseburger-slider.png"), names: ["Cheeseburger slider", "Cheeseburger slider, from fast food"] },
  { image: require("@/assets/images/foods/hamburger-slider.png"), names: ["Hamburger slider", "Hamburger slider, from fast food"] },
  { image: require("@/assets/images/foods/chicken-nuggets.png"), names: ["Chicken nuggets", "Chicken nuggets, from fast food"] },
  { image: require("@/assets/images/foods/potato-tots.png"), names: ["Potato tots", "Potato tots, fast food / restaurant"] },
  { image: require("@/assets/images/foods/french-fries.png"), names: ["French fries", "Potato, french fries"] },
  { image: require("@/assets/images/foods/croissant-with-egg.png"), names: ["Croissant with egg", "Croissant, with egg"] },
];

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const IMAGE_BY_NAME = new Map<string, ImageSourcePropType>();
COMMON_FOODS.forEach((food) => {
  [food.name, ...(IMAGE_ALIASES[food.fdcId] ?? [])].forEach((name) => IMAGE_BY_NAME.set(normalize(name), FOOD_IMAGES[food.fdcId]));
});
SEARCH_FOOD_IMAGES.forEach(({ image, names }) => names.forEach((name) => IMAGE_BY_NAME.set(normalize(name), image)));

export const foodImageByName = (name?: string) => (name ? IMAGE_BY_NAME.get(normalize(name)) : undefined);
