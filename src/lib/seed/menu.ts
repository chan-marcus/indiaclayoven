import type { Category, MenuItem, BadgeKind } from "@/lib/types";
import { RESTAURANT_ID } from "@/lib/restaurant";

const img = (n: string) => `/images/${n}.jpg`;

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

const cat = (id: string, name: string, sort: number, note?: string): Category => ({
  id,
  restaurantId: RESTAURANT_ID,
  name,
  note,
  sort,
});

export const seedCategories: Category[] = [
  cat("appetizers", "Appetizers", 1, "Served with homemade mint chutney and hot 'n sour tamarind chutney."),
  cat("soups-salads", "Soups, Salads & Sides", 2),
  cat("breads", "Breads", 3, "Slapped against the wall of the clay oven and baked to order."),
  cat("vegetarian", "Vegetarian Entrees", 4, "Any dish can be prepared gluten free, vegan or dairy free on request."),
  cat("chicken", "Chicken Dishes", 5),
  cat("rice", "Rice Dishes", 6),
  cat("clay-oven", "Clay Oven Roasted", 7, "Cooked on charcoal fire in a clay pot and served on a sizzling platter."),
  cat("lamb", "Lamb Dishes", 8),
  cat("seafood", "Seafood Entrees", 9),
  cat("dinners", "Dinners", 10, "A great way to experience a taste of India."),
  cat("desserts", "Desserts", 11),
  cat("beverages", "Beverages", 12),
];

/* ------------------------------------------------------------------ */
/* Menu items                                                          */
/* ------------------------------------------------------------------ */

let seq = 0;
type Opts = {
  desc?: string;
  badges?: BadgeKind[];
  available?: boolean;
  signature?: boolean;
};

const item = (
  categoryId: string,
  name: string,
  price: number,
  image: string,
  opts: Opts = {},
): MenuItem => ({
  id: `itm_${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  restaurantId: RESTAURANT_ID,
  categoryId,
  name,
  description: opts.desc,
  price,
  image: img(image),
  available: opts.available ?? true,
  badges: opts.badges ?? [],
  signature: opts.signature,
  sort: ++seq,
});

export const seedMenuItems: MenuItem[] = [
  /* --- Appetizers ------------------------------------------------- */
  item("appetizers", "Papadams", 4.95, "papadam-leaf", {
    desc: "Crispy lentil wafers served with chutneys",
    badges: ["vegetarian"],
  }),
  item("appetizers", "Vegetable Samosas", 7.95, "samosa", {
    desc: "Golden pastry filled with spiced potatoes and peas",
    badges: ["popular", "vegetarian"],
  }),
  item("appetizers", "Onion Bhaji", 8.95, "samosa-board", {
    desc: "Crispy spiced onion fritters",
    badges: ["vegetarian"],
  }),
  item("appetizers", "Vegetable Pakora", 8.95, "dosa-platter", {
    desc: "Assorted vegetables in seasoned chickpea batter",
    badges: ["vegetarian"],
  }),
  item("appetizers", "Cheese Pakora", 9.95, "paneer-tikka-skewers", {
    desc: "Fresh paneer in crispy chickpea batter",
    badges: ["vegetarian"],
  }),
  item("appetizers", "Fish Pakora", 12.95, "seafood-curry", {
    desc: "Tender fish in spiced batter",
    available: false,
  }),
  item("appetizers", "Chicken Pakora", 11.95, "tandoori-chicken", {
    desc: "Boneless chicken in seasoned chickpea batter",
  }),
  item("appetizers", "Calamari Pakora", 13.95, "seafood-curry", {
    desc: "Tender calamari in spiced batter",
  }),
  item("appetizers", "Lamb Chops", 18.95, "clay-oven-platter", {
    desc: "Marinated clay oven roasted lamb chops",
  }),
  item("appetizers", "Assorted Clay Oven Meat Platter", 22.95, "clay-oven-platter", {
    desc: "A grand selection of our clay oven specialties, kababs, tikka and chops straight from the fire",
    badges: ["signature"],
    signature: true,
  }),

  /* --- Soups, Salads & Sides -------------------------------------- */
  item("soups-salads", "Dal Soup", 6.95, "dal-tadka", {
    desc: "Hearty lentil soup with aromatic spices",
    badges: ["vegetarian"],
  }),
  item("soups-salads", "Mulligatawny Soup", 7.95, "mulligatawny", {
    desc: "Classic South Indian spiced lentil soup",
  }),
  item("soups-salads", "Mixed House Salad", 6.95, "vegetable-bowl", {
    badges: ["vegetarian"],
  }),
  item("soups-salads", "Cucumber Salad", 5.95, "vegetable-bowl", { badges: ["vegetarian"] }),
  item("soups-salads", "Raita", 4.95, "raita", {
    desc: "Chilled yogurt with cucumber and spices",
    badges: ["vegetarian"],
  }),
  item("soups-salads", "Mango Chutney", 3.95, "spices-flatlay", { badges: ["vegetarian"] }),
  item("soups-salads", "Mixed Pickles", 3.95, "spices-flatlay", { badges: ["vegetarian"] }),
  item("soups-salads", "Mint Chutney", 3.95, "spices-flatlay", { badges: ["vegetarian"] }),
  item("soups-salads", "Tamarind Sauce", 3.95, "spices-flatlay", { badges: ["vegetarian"] }),

  /* --- Breads ------------------------------------------------------ */
  item("breads", "Nan", 3.95, "tandoor-fire", { desc: "Classic clay oven baked flatbread" }),
  item("breads", "Garlic Nan", 4.95, "tandoor-fire", {
    desc: "Brushed with garlic butter and fresh cilantro",
    badges: ["popular"],
  }),
  item("breads", "Goat Cheese Nan", 5.95, "tandoor-fire", { desc: "Stuffed with fresh goat cheese" }),
  item("breads", "Onion Kulcha", 4.95, "tandoor-fire", { desc: "Filled with caramelized onions" }),
  item("breads", "Kashmiri Nan", 5.95, "tandoor-fire", { desc: "Stuffed with dry fruits and coconut" }),
  item("breads", "Keema Nan", 6.95, "tandoor-fire", { desc: "Filled with spiced minced lamb" }),
  item("breads", "Chapati", 3.5, "tandoor-fire", { desc: "Whole wheat flatbread" }),
  item("breads", "Aloo Paratha", 5.95, "tandoor-fire", { desc: "Layered bread with spiced potato filling" }),
  item("breads", "Chili Nan", 4.95, "tandoor-fire", {
    desc: "Spiced with fresh green chili",
    badges: ["spicy"],
  }),
  item("breads", "Spinach Nan", 4.95, "tandoor-fire", { desc: "Baked with fresh spinach" }),
  item("breads", "Assorted Bread Basket", 12.95, "tandoor-fire", { desc: "Chef's selection of four breads" }),

  /* --- Vegetarian Entrees ------------------------------------------ */
  item("vegetarian", "Mixed Vegetable Masala", 15.95, "vegetable-bowl", {
    desc: "Seasonal vegetables in rich tomato-onion masala",
  }),
  item("vegetarian", "Aloo Gobi", 15.95, "vegetable-bowl", {
    desc: "Potatoes and cauliflower with aromatic spices",
  }),
  item("vegetarian", "Bengan Bhartha", 15.95, "lamb-rogan-josh", {
    desc: "Flame-roasted eggplant in spiced sauce",
  }),
  item("vegetarian", "Mushroom Mattar", 16.95, "curry-spread", { desc: "Mushrooms and peas in savory gravy" }),
  item("vegetarian", "Mattar Paneer", 17.95, "paneer-makhani", {
    desc: "Cottage cheese and peas in spiced tomato gravy",
  }),
  item("vegetarian", "Vegetable Korma", 16.95, "korma-rice", {
    desc: "Seasonal vegetables in a mild, creamy sauce",
  }),
  item("vegetarian", "Malai Kofta", 17.95, "korma-rice", { desc: "Vegetable dumplings in rich cream sauce" }),
  item("vegetarian", "Sag Paneer", 17.95, "sag-paneer", {
    desc: "Fresh spinach with house-made cottage cheese",
    badges: ["popular"],
  }),
  item("vegetarian", "Paneer Jal-Frazie", 17.95, "paneer-tikka-skewers", {
    desc: "Stir-fried paneer with peppers and onions",
  }),
  item("vegetarian", "Chana Masala", 15.95, "curry-spread", { desc: "Hearty chickpeas in tangy tomato gravy" }),
  item("vegetarian", "Daal", 14.95, "dal-tadka", { desc: "Slow-simmered lentils with tempered spices" }),
  item("vegetarian", "Paneer Makhni", 18.95, "paneer-makhani", {
    desc: "Cottage cheese in buttery tomato cream sauce",
  }),
  item("vegetarian", "Bhindi Bhaji Masala", 15.95, "vegetable-bowl", {
    desc: "Stir-fried okra with onion and spices",
  }),
  item("vegetarian", "Palak Dal", 15.95, "sag-paneer", { desc: "Spinach and lentil combination" }),

  /* --- Chicken Dishes ---------------------------------------------- */
  item("chicken", "Chicken Curry", 18.95, "curry-spread", {
    desc: "Classic bone-in chicken in aromatic curry sauce",
  }),
  item("chicken", "Chicken Vindaloo", 18.95, "lamb-rogan-josh", {
    desc: "Fiery Goan-style chicken with vinegar and chilies",
    badges: ["spicy"],
  }),
  item("chicken", "Chicken Tikka Masala", 20.95, "chicken-tikka-masala", {
    desc: "Clay-oven roasted chicken simmered in a velvety tomato cream sauce, the one everybody orders twice",
    badges: ["signature"],
    signature: true,
  }),
  item("chicken", "Chicken Korma", 19.95, "korma-rice", { desc: "Tender chicken in mild almond cream sauce" }),
  item("chicken", "Chicken Makhani", 20.95, "paneer-makhani", {
    desc: "Butter chicken in silky tomato-fenugreek sauce",
    badges: ["popular"],
  }),
  item("chicken", "Chicken Saag", 19.95, "sag-paneer", { desc: "Chicken in fresh spinach gravy" }),
  item("chicken", "Chicken Coconut Curry", 19.95, "korma-rice", { desc: "Tender chicken in creamy coconut curry" }),
  item("chicken", "Punjabi Chicken Curry", 18.95, "curry-spread", { desc: "Bold North Indian home-style chicken" }),
  item("chicken", "Hyderabadi Chicken Curry", 19.95, "curry-spread", { desc: "Rich Deccani-style chicken" }),
  item("chicken", "Velvet Chicken", 20.95, "korma-rice", { desc: "Silky smooth chicken in delicate cream sauce" }),
  item("chicken", "Kashmiri Chicken", 19.95, "korma-rice", { desc: "Chicken in mild, aromatic Kashmiri sauce" }),

  /* --- Rice Dishes -------------------------------------------------- */
  item("rice", "Rice Pilav", 5.95, "rice-pilav", { desc: "Fragrant basmati rice with whole spices" }),
  item("rice", "Vegetable Biryani", 17.95, "biryani-bowl", {
    desc: "Dum-cooked basmati with seasonal vegetables",
    badges: ["vegetarian"],
  }),
  item("rice", "Chicken Biryani", 21.95, "biryani-platter", {
    desc: "Aromatic dum-cooked rice with tender chicken",
  }),
  item("rice", "Lamb Biryani", 23.95, "lamb-biryani", {
    desc: "Royal-style basmati layered with slow-cooked lamb, sealed shut and finished slowly over the fire",
    badges: ["signature"],
    signature: true,
  }),
  item("rice", "Prawns Biryani", 24.95, "biryani-platter", { desc: "Coastal biryani with spiced prawns" }),
  item("rice", "Punjabi Fried Rice", 14.95, "rice-pilav", { desc: "Stir-fried rice with vegetables and spices" }),
  item("rice", "Calamari Biryani", 23.95, "biryani-bowl", {
    desc: "Tender calamari in aromatic dum rice",
    available: false,
  }),

  /* --- Clay Oven Roasted -------------------------------------------- */
  item("clay-oven", "Tandoori Chicken", 22.95, "tandoori-chicken", {
    desc: "Whole spring chicken marinated in yogurt and spices",
    badges: ["popular"],
  }),
  item("clay-oven", "Chicken Tikka Kabab", 21.95, "tandoori-closeup", {
    desc: "Boneless chicken marinated in house spices",
  }),
  item("clay-oven", "Boti Kabab", 23.95, "clay-oven-platter", { desc: "Tender lamb cubes in clay oven marinade" }),
  item("clay-oven", "Prawn Tandoori", 25.95, "seafood-curry", {
    desc: "Jumbo prawns in tandoori marinade on a sizzling platter",
  }),
  item("clay-oven", "Fish Tandoori", 24.95, "seafood-curry", { desc: "Fresh fish fillet in aromatic marinade" }),
  item("clay-oven", "Seekh Kabab", 22.95, "clay-oven-platter", {
    desc: "Minced lamb on skewer with ginger and cilantro",
  }),
  item("clay-oven", "Tandoori Mixed Grill", 29.95, "tandoori-closeup", {
    desc: "The chef's selection from the charcoal fire: tandoori chicken, seekh kabab, boti kabab and prawns on one sizzling platter",
    badges: ["signature"],
    signature: true,
  }),
  item("clay-oven", "Lamb Chops (Clay Oven)", 28.95, "clay-oven-platter", {
    desc: "Premium lamb chops in yogurt and spice marinade",
  }),

  /* --- Lamb Dishes --------------------------------------------------- */
  item("lamb", "Rogan Josh", 22.95, "lamb-rogan-josh", { desc: "Slow-braised lamb in Kashmiri spice gravy" }),
  item("lamb", "Hyderabadi Lamb", 23.95, "lamb-rogan-josh", { desc: "Deccani-style lamb in rich aromatic sauce" }),
  item("lamb", "Lamb Coconut", 22.95, "korma-rice", { desc: "Tender lamb in Keralan coconut curry" }),
  item("lamb", "Punjabi Lamb Curry", 22.95, "curry-spread", { desc: "Bold North Indian lamb in tomato-onion gravy" }),
  item("lamb", "Lamb Saag", 22.95, "sag-paneer", { desc: "Slow-cooked lamb in fresh spinach" }),
  item("lamb", "Lamb Vindaloo", 22.95, "lamb-rogan-josh", {
    desc: "Fiery Goan-style lamb",
    badges: ["spicy"],
  }),
  item("lamb", "Lamb Korma", 23.95, "korma-rice", { desc: "Tender lamb in mild almond cream sauce" }),
  item("lamb", "Lamb Tikka Masala", 23.95, "chicken-tikka-masala", { desc: "Marinated lamb in classic masala" }),
  item("lamb", "Kashmiri Lamb", 23.95, "korma-rice", { desc: "Lamb in a mild, aromatic Kashmiri sauce" }),

  /* --- Seafood Entrees ------------------------------------------------ */
  item("seafood", "Punjabi Prawn Curry", 25.95, "seafood-curry", {
    desc: "Jumbo prawns in North Indian tomato curry",
  }),
  item("seafood", "Prawn Vindaloo", 25.95, "seafood-curry", {
    desc: "Spicy Goan-style prawns",
    badges: ["spicy"],
  }),
  item("seafood", "Prawn Tikka Masala", 26.95, "chicken-tikka-masala", {
    desc: "Prawns in velvety tomato cream sauce",
  }),
  item("seafood", "Prawns Goa Curry", 25.95, "seafood-curry", { desc: "Coconut-based Goan coastal curry" }),
  item("seafood", "Fish Tikka Masala", 24.95, "chicken-tikka-masala", { desc: "Tender fish in classic masala sauce" }),
  item("seafood", "Punjabi Fish Curry", 23.95, "curry-spread", { desc: "Fish in bold North Indian spice gravy" }),
  item("seafood", "Calamari Curry", 24.95, "seafood-curry", { desc: "Tender calamari in coastal spice gravy" }),
  item("seafood", "Fish Vindaloo", 23.95, "lamb-rogan-josh", {
    desc: "Fiery Goan-style fish",
    badges: ["spicy"],
  }),
  item("seafood", "Kashmiri Fish", 23.95, "korma-rice", { desc: "Fish in mild aromatic Kashmiri sauce" }),

  /* --- Dinners --------------------------------------------------------- */
  item("dinners", "Clay Oven Thali Dinner for Two", 59.95, "thali-silver", {
    desc: "A grand feast for two: two entrees, dal, rice, fresh nan, raita and dessert. The best way to eat your way across the menu in one sitting.",
    badges: ["signature"],
  }),

  /* --- Desserts --------------------------------------------------------- */
  item("desserts", "Kheer", 6.95, "kheer", { desc: "Creamy rice pudding with cardamom and rose water" }),
  item("desserts", "Kulfi", 6.95, "kulfi", { desc: "Traditional Indian ice cream on a stick" }),
  item("desserts", "Gulab Jamun", 6.95, "gulab-jamun", {
    desc: "Warm milk dumplings in rose sugar syrup",
    badges: ["popular"],
  }),
  item("desserts", "Mango Kulfi", 7.95, "kulfi", { desc: "Alphonso mango ice cream" }),
  item("desserts", "Coconut Ice Cream", 6.95, "kulfi", { desc: "Housemade coconut ice cream" }),

  /* --- Beverages --------------------------------------------------------- */
  item("beverages", "Lassi", 5.95, "mango-lassi", { desc: "Traditional yogurt drink, sweet or salted" }),
  item("beverages", "Mango Lassi", 6.95, "mango-lassi", {
    desc: "Chilled Alphonso mango yogurt drink",
    badges: ["popular"],
  }),
  item("beverages", "Chai Tea", 4.95, "chai", { desc: "House-spiced Indian tea with milk" }),
  item("beverages", "Iced Tea", 3.95, "chai", {}),
  item("beverages", "Sodas", 3.5, "chai", {}),
  item("beverages", "Lemonade", 3.95, "mango-lassi", {}),
  item("beverages", "Pellegrino Water", 4.95, "chai", {}),
];
