import type { NutritionFacts } from '../db/types'

/**
 * Everyday groceries most Aldi US stores carry, with the Aldi house brand they usually come under.
 * Nutrition is calculated from USDA Standard Reference (SR28) values for the plain food, so a
 * specific package can differ a little; scan the barcode for its exact label.
 *
 * estPrice is a rough starter estimate in US dollars, not a live Aldi price: Aldi does not publish
 * a price feed and prices vary by region and week. The app marks these as estimates until you
 * enter what you paid.
 */
export interface Staple {
  id: string
  name: string
  brand?: string
  category: StapleCategory
  servingLabel: string
  servingGrams: number
  packageLabel: string
  /** Servings in one package. */
  packageServings: number
  estPrice: number
  facts: NutritionFacts
}

export type StapleCategory = 'Meat & fish' | 'Dairy & eggs' | 'Grains & bread' | 'Pantry' | 'Frozen' | 'Produce' | 'Snacks'

export const STAPLE_CATEGORIES: StapleCategory[] = ['Meat & fish', 'Dairy & eggs', 'Grains & bread', 'Pantry', 'Frozen', 'Produce', 'Snacks']

const s = (id: string, name: string, brand: string | null, category: StapleCategory, servingLabel: string, servingGrams: number, packageLabel: string, packageServings: number, estPrice: number, facts: NutritionFacts): Staple => ({
  id,
  name,
  ...(brand ? { brand } : {}),
  category,
  servingLabel,
  servingGrams,
  packageLabel,
  packageServings,
  estPrice,
  facts,
})

export const ALDI_STAPLES: Staple[] = [
  s("chicken-breast", "Chicken breasts, boneless skinless", "Kirkwood", "Meat & fish", "4 oz raw (113 g)", 113, "Family pack, about 3 lb", 12.0, 8.67, {kcal: 136, protein: 25.4, carbs: 0.0, fat: 3.0, fiber: 0.0, sugar: 0.0, satFat: 0.6, micros: {sodium: 51, calcium: 5.65, iron: 0.418, potassium: 377.0, magnesium: 31.6, zinc: 0.768, "vitamin-a": 10.2, "vitamin-b12": 0.237, folate: 10.2}}),
  s("chicken-thighs", "Chicken thighs, boneless skinless", "Kirkwood", "Meat & fish", "4 oz raw (113 g)", 113, "Family pack, about 2.5 lb", 10.0, 6.23, {kcal: 137, protein: 22.2, carbs: 0.0, fat: 4.7, fiber: 0.0, sugar: 0.0, satFat: 1.2, micros: {sodium: 107, calcium: 7.91, iron: 0.915, potassium: 273.0, magnesium: 26.0, zinc: 1.79, "vitamin-a": 7.91, "vitamin-b12": 0.689, folate: 4.52}}),
  s("ground-turkey", "Ground turkey 93/7", "Kirkwood", "Meat & fish", "4 oz raw (113 g)", 113, "1 lb package", 4.0, 3.49, {kcal: 169, protein: 21.2, carbs: 0.0, fat: 9.4, fiber: 0.0, sugar: 0.0, satFat: 2.5, micros: {sodium: 78, calcium: 23.7, iron: 1.32, potassium: 241.0, magnesium: 23.7, zinc: 2.86, "vitamin-a": 24.9, "vitamin-d": 0.452, "vitamin-b12": 1.36, folate: 7.91}}),
  s("ground-beef-93", "Ground beef 93/7", null, "Meat & fish", "4 oz raw (113 g)", 113, "1 lb package", 4.0, 5.49, {kcal: 172, protein: 23.6, carbs: 0.0, fat: 7.9, fiber: 0.0, sugar: 0.0, satFat: 3.3, micros: {sodium: 75, calcium: 11.3, iron: 2.63, potassium: 380.0, magnesium: 23.7, zinc: 5.62, "vitamin-a": 4.52, "vitamin-d": 0.113, "vitamin-b12": 2.52, folate: 5.65}}),
  s("ground-beef-80", "Ground beef 80/20", null, "Meat & fish", "4 oz raw (113 g)", 113, "1 lb package", 4.0, 4.29, {kcal: 287, protein: 19.4, carbs: 0.0, fat: 22.6, fiber: 0.0, sugar: 0.0, satFat: 8.6, micros: {sodium: 75, calcium: 20.3, iron: 2.19, potassium: 305.0, magnesium: 19.2, zinc: 4.72, "vitamin-a": 4.52, "vitamin-d": 0.113, "vitamin-b12": 2.42, folate: 7.91}}),
  s("tilapia", "Tilapia fillets, frozen", "Fremont Fish Market", "Meat & fish", "4 oz raw (113 g)", 113, "2 lb bag", 8.0, 7.99, {kcal: 108, protein: 22.7, carbs: 0.0, fat: 1.9, fiber: 0.0, sugar: 0.0, satFat: 0.7, micros: {sodium: 59, calcium: 11.3, iron: 0.633, potassium: 341.0, magnesium: 30.5, zinc: 0.373, "vitamin-d": 3.5, "vitamin-b12": 1.79, folate: 27.1}}),
  s("salmon", "Atlantic salmon fillets, frozen", "Fremont Fish Market", "Meat & fish", "4 oz raw (113 g)", 113, "1 lb bag", 4.0, 6.79, {kcal: 235, protein: 23.1, carbs: 0.0, fat: 15.2, fiber: 0.0, sugar: 0.0, satFat: 3.4, micros: {sodium: 67, calcium: 10.2, iron: 0.384, potassium: 410.0, magnesium: 30.5, zinc: 0.407, "vitamin-c": 4.41, "vitamin-a": 65.5, "vitamin-d": 12.4, "vitamin-b12": 3.65, folate: 29.4}}),
  s("tuna", "Chunk light tuna in water", "Northern Catch", "Meat & fish", "2 oz drained (57 g)", 57, "5 oz can (about 4 oz drained)", 2.0, 0.95, {kcal: 49, protein: 11.1, carbs: 0.0, fat: 0.5, fiber: 0.0, sugar: 0.0, satFat: 0.1, micros: {sodium: 141, calcium: 9.69, iron: 0.929, potassium: 102.0, magnesium: 13.1, zinc: 0.393, "vitamin-a": 9.69, "vitamin-d": 0.684, "vitamin-b12": 1.45, folate: 2.28}}),
  s("eggs", "Large eggs", "Goldhen", "Dairy & eggs", "1 large egg (50 g)", 50, "1 dozen", 12.0, 3.49, {kcal: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0.0, sugar: 0.2, satFat: 1.6, micros: {sodium: 71, calcium: 28.0, iron: 0.875, potassium: 69.0, magnesium: 6.0, zinc: 0.645, "vitamin-a": 80.0, "vitamin-d": 1.0, "vitamin-b12": 0.445, folate: 23.5}}),
  s("greek-yogurt", "Greek yogurt, plain nonfat", "Friendly Farms", "Dairy & eggs", "3/4 cup (170 g)", 170, "32 oz tub", 5.3, 3.79, {kcal: 100, protein: 17.3, carbs: 6.1, fat: 0.7, fiber: 0.0, sugar: 5.5, satFat: 0.2, micros: {sodium: 61, calcium: 187.0, iron: 0.119, potassium: 240.0, magnesium: 18.7, zinc: 0.884, "vitamin-a": 1.7, "vitamin-b12": 1.27, folate: 11.9}}),
  s("cottage-cheese", "Cottage cheese, 2%", "Friendly Farms", "Dairy & eggs", "1/2 cup (113 g)", 113, "24 oz tub", 6.0, 2.99, {kcal: 92, protein: 11.8, carbs: 5.4, fat: 2.6, fiber: 0.0, sugar: 4.5, satFat: 1.4, micros: {sodium: 348, calcium: 125.0, iron: 0.147, potassium: 141.0, magnesium: 10.2, zinc: 0.576, "vitamin-a": 76.8, "vitamin-b12": 0.531, folate: 9.04}}),
  s("milk-2", "Milk, 2%", "Friendly Farms", "Dairy & eggs", "1 cup (244 g)", 244, "1 gallon", 16.0, 3.05, {kcal: 122, protein: 8.1, carbs: 11.7, fat: 4.8, fiber: 0.0, sugar: 12.3, satFat: 3.1, micros: {sodium: 115, calcium: 293.0, iron: 0.0488, potassium: 342.0, magnesium: 26.8, zinc: 1.17, "vitamin-c": 0.488, "vitamin-a": 134.0, "vitamin-d": 2.93, "vitamin-b12": 1.29, folate: 12.2}}),
  s("cheddar", "Shredded cheddar", "Happy Farms", "Dairy & eggs", "1/4 cup (28 g)", 28, "8 oz bag", 8.1, 2.15, {kcal: 113, protein: 6.4, carbs: 0.9, fat: 9.3, fiber: 0.0, sugar: 0.1, satFat: 5.3, micros: {sodium: 183, calcium: 199.0, iron: 0.0392, potassium: 21.3, magnesium: 7.56, zinc: 1.02, "vitamin-a": 92.4, "vitamin-d": 0.168, "vitamin-b12": 0.308, folate: 7.56}}),
  s("butter", "Butter, salted", "Countryside Creamery", "Dairy & eggs", "1 tbsp (14 g)", 14, "1 lb (4 sticks)", 32.4, 3.79, {kcal: 100, protein: 0.1, carbs: 0.0, fat: 11.4, fiber: 0.0, sugar: 0.0, satFat: 7.2, micros: {sodium: 90, calcium: 3.36, iron: 0.0028, potassium: 3.36, magnesium: 0.28, zinc: 0.0126, "vitamin-a": 95.8, "vitamin-b12": 0.0238, folate: 0.42}}),
  s("rice-white", "Long grain white rice (dry)", "Earthly Grains", "Grains & bread", "1/4 cup dry (about 3/4 cup cooked) (46 g)", 46, "3 lb bag", 29.6, 2.29, {kcal: 168, protein: 3.3, carbs: 36.8, fat: 0.3, fiber: 0.6, sugar: 0.1, satFat: 0.1, micros: {sodium: 2, calcium: 12.9, iron: 1.98, potassium: 52.9, magnesium: 11.5, zinc: 0.501, folate: 178.0}}),
  s("rice-brown", "Brown rice (dry)", "Earthly Grains", "Grains & bread", "1/4 cup dry (about 3/4 cup cooked) (46 g)", 46, "2 lb bag", 19.7, 1.99, {kcal: 169, protein: 3.5, carbs: 35.1, fat: 1.5, fiber: 1.7, sugar: 0.3, satFat: 0.3, micros: {sodium: 2, calcium: 4.14, iron: 0.593, potassium: 115.0, magnesium: 53.4, zinc: 0.98, folate: 10.6}}),
  s("quinoa", "Quinoa (dry)", "Simply Nature", "Grains & bread", "1/4 cup dry (43 g)", 43, "16 oz bag", 10.6, 3.69, {kcal: 158, protein: 6.1, carbs: 27.6, fat: 2.6, fiber: 3.0, satFat: 0.3, micros: {sodium: 2, calcium: 20.2, iron: 1.97, potassium: 242.0, magnesium: 84.7, zinc: 1.33, "vitamin-a": 0.43, folate: 79.1}}),
  s("oats", "Old fashioned oats", "Millville", "Grains & bread", "1/2 cup dry (40 g)", 40, "42 oz canister", 29.8, 3.49, {kcal: 152, protein: 5.3, carbs: 27.1, fat: 2.6, fiber: 4.0, sugar: 0.4, satFat: 0.4, micros: {sodium: 2, calcium: 20.8, iron: 1.7, potassium: 145.0, magnesium: 55.2, zinc: 1.46, folate: 12.8}}),
  s("pasta", "Spaghetti (dry)", "Reggano", "Grains & bread", "2 oz dry (57 g)", 57, "16 oz box", 8.0, 1.05, {kcal: 211, protein: 7.4, carbs: 42.6, fat: 0.9, fiber: 1.8, sugar: 1.5, satFat: 0.2, micros: {sodium: 3, calcium: 12.0, iron: 1.88, potassium: 127.0, magnesium: 30.2, zinc: 0.804, folate: 223.0}}),
  s("bread-ww", "100% whole wheat bread", "L'oven Fresh", "Grains & bread", "1 slice (32 g)", 32, "20 oz loaf", 17.7, 1.69, {kcal: 81, protein: 4.0, carbs: 13.7, fat: 1.1, fiber: 1.9, sugar: 1.4, satFat: 0.2, micros: {sodium: 146, calcium: 51.5, iron: 0.79, potassium: 81.3, magnesium: 24.0, zinc: 0.566, folate: 13.4}}),
  s("tortilla-flour", "Flour tortillas, burrito size", "Casa Mamita", "Grains & bread", "1 tortilla (10 in) (72 g)", 72, "8 count", 8.0, 1.99, {kcal: 220, protein: 5.9, carbs: 35.6, fat: 5.8, fiber: 2.5, sugar: 2.7, satFat: 2.1, micros: {sodium: 530, calcium: 105.0, iron: 2.61, potassium: 90.0, magnesium: 15.8, zinc: 0.382, folate: 107.0}}),
  s("tortilla-corn", "Corn tortillas", "Casa Mamita", "Grains & bread", "2 tortillas (6 in) (48 g)", 48, "30 count", 15.0, 1.69, {kcal: 105, protein: 2.7, carbs: 21.4, fat: 1.4, fiber: 3.0, sugar: 0.4, satFat: 0.2, micros: {sodium: 22, calcium: 38.9, iron: 0.59, potassium: 89.3, magnesium: 34.6, zinc: 0.629, folate: 2.4}}),
  s("black-beans", "Black beans, canned", "Dakota's Pride", "Pantry", "1/2 cup (120 g)", 120, "15.5 oz can (about 3 1/2 servings)", 3.5, 0.85, {kcal: 109, protein: 7.2, carbs: 19.9, fat: 0.3, fiber: 8.3, sugar: 0.3, satFat: 0.1, micros: {sodium: 461, calcium: 42.0, iron: 2.28, potassium: 370.0, magnesium: 42.0, zinc: 0.648, "vitamin-c": 3.24, folate: 73.2}}),
  s("chickpeas", "Chickpeas, canned, drained", "Dakota's Pride", "Pantry", "1/2 cup drained (82 g)", 82, "15.5 oz can", 3.1, 0.85, {kcal: 114, protein: 5.8, carbs: 18.5, fat: 2.3, fiber: 5.2, sugar: 3.3, satFat: 0.2, micros: {sodium: 202, calcium: 36.9, iron: 0.877, potassium: 103.0, magnesium: 21.3, zinc: 0.517, "vitamin-c": 0.082, "vitamin-a": 0.82, folate: 39.4}}),
  s("diced-tomatoes", "Diced tomatoes", "Happy Harvest", "Pantry", "1/2 cup (120 g)", 120, "14.5 oz can", 3.4, 0.75, {kcal: 19, protein: 0.9, carbs: 4.2, fat: 0.3, fiber: 2.3, sugar: 3.1, satFat: 0.0, micros: {sodium: 138, calcium: 39.6, iron: 0.684, potassium: 229.0, magnesium: 12.0, zinc: 0.144, "vitamin-c": 15.1, "vitamin-a": 24.0, folate: 9.6}}),
  s("corn", "Whole kernel corn, canned, drained", "Happy Harvest", "Pantry", "1/2 cup (82 g)", 82, "15.25 oz can", 3.0, 0.75, {kcal: 55, protein: 1.9, carbs: 11.8, fat: 1.0, fiber: 1.6, sugar: 3.6, satFat: 0.2, micros: {sodium: 168, calcium: 2.46, iron: 0.221, potassium: 108.0, magnesium: 10.7, zinc: 0.262, "vitamin-c": 1.48, "vitamin-a": 1.64, folate: 29.5}}),
  s("marinara", "Pasta sauce, marinara", "Reggano", "Pantry", "1/2 cup (132 g)", 132, "24 oz jar", 5.2, 1.65, {kcal: 66, protein: 1.8, carbs: 9.8, fat: 2.1, fiber: 2.4, sugar: 6.5, satFat: 0.3, micros: {sodium: 577, calcium: 34.3, iron: 0.964, potassium: 422.0, magnesium: 23.8, zinc: 0.264, "vitamin-c": 2.64, "vitamin-a": 40.9, folate: 17.2}}),
  s("salsa", "Chunky salsa", "Casa Mamita", "Pantry", "2 tbsp (36 g)", 36, "16 oz jar", 12.6, 1.89, {kcal: 10, protein: 0.5, carbs: 2.4, fat: 0.1, fiber: 0.7, sugar: 1.4, satFat: 0.0, micros: {sodium: 256, calcium: 10.8, iron: 0.151, potassium: 99.0, magnesium: 5.4, zinc: 0.0648, "vitamin-c": 0.684, "vitamin-a": 8.28, folate: 1.44}}),
  s("chicken-broth", "Chicken broth", "Chef's Cupboard", "Pantry", "1 cup (249 g)", 249, "32 oz carton", 4.0, 1.49, {kcal: 15, protein: 1.6, carbs: 1.1, fat: 0.5, fiber: 0.0, sugar: 1.1, satFat: 0.0, micros: {sodium: 924, calcium: 9.96, iron: 0.174, potassium: 44.8, magnesium: 2.49, zinc: 0.174, "vitamin-b12": 0.0498}}),
  s("peanut-butter", "Creamy peanut butter", "Peanut Delight", "Pantry", "2 tbsp (32 g)", 32, "16 oz jar", 14.2, 1.99, {kcal: 191, protein: 7.1, carbs: 7.1, fat: 16.4, fiber: 1.6, sugar: 3.4, satFat: 3.3, micros: {sodium: 136, calcium: 15.7, iron: 0.557, potassium: 179.0, magnesium: 53.8, zinc: 0.803, folate: 27.8}}),
  s("olive-oil", "Olive oil", "Carlini", "Pantry", "1 tbsp (13.5 g)", 13.5, "16.9 fl oz bottle", 34.1, 5.99, {kcal: 119, protein: 0.0, carbs: 0.0, fat: 13.5, fiber: 0.0, sugar: 0.0, satFat: 1.9, micros: {sodium: 0, calcium: 0.135, iron: 0.0756, potassium: 0.135}}),
  s("soy-sauce", "Soy sauce", null, "Pantry", "1 tbsp (16 g)", 16, "15 fl oz bottle", 26.6, 1.49, {kcal: 8, protein: 1.3, carbs: 0.8, fat: 0.1, fiber: 0.1, sugar: 0.1, satFat: 0.0, micros: {sodium: 879, calcium: 5.28, iron: 0.232, potassium: 69.6, magnesium: 11.8, zinc: 0.139, folate: 2.24}}),
  s("broccoli", "Broccoli florets, frozen", "Season's Choice", "Frozen", "1 cup (85 g)", 85, "12 oz bag", 4.0, 1.25, {kcal: 22, protein: 2.4, carbs: 4.1, fat: 0.2, fiber: 2.6, sugar: 1.1, satFat: 0.0, micros: {sodium: 20, calcium: 47.6, iron: 0.689, potassium: 180.0, magnesium: 15.3, zinc: 0.408, "vitamin-c": 47.9, "vitamin-a": 44.2, folate: 56.9}}),
  s("mixed-veg", "Mixed vegetables, frozen", "Season's Choice", "Frozen", "2/3 cup (89 g)", 89, "12 oz bag", 3.8, 1.05, {kcal: 64, protein: 3.0, carbs: 12.0, fat: 0.5, fiber: 3.6, satFat: 0.1, micros: {sodium: 42, calcium: 22.2, iron: 0.845, potassium: 189.0, magnesium: 21.4, zinc: 0.401, "vitamin-c": 9.26, "vitamin-a": 226.0, folate: 25.8}}),
  s("blueberries", "Blueberries, frozen", "Season's Choice", "Frozen", "1 cup (140 g)", 140, "16 oz bag", 3.2, 2.99, {kcal: 71, protein: 0.6, carbs: 17.0, fat: 0.9, fiber: 3.8, sugar: 11.8, satFat: 0.1, micros: {sodium: 1, calcium: 11.2, iron: 0.252, potassium: 75.6, magnesium: 7.0, zinc: 0.098, "vitamin-c": 3.5, "vitamin-a": 2.8, folate: 9.8}}),
  s("bananas", "Bananas", null, "Produce", "1 medium (118 g)", 118, "Bunch of about 6", 6.0, 0.85, {kcal: 105, protein: 1.3, carbs: 27.0, fat: 0.4, fiber: 3.1, sugar: 14.4, satFat: 0.1, micros: {sodium: 1, calcium: 5.9, iron: 0.307, potassium: 422.0, magnesium: 31.9, zinc: 0.177, "vitamin-c": 10.3, "vitamin-a": 3.54, folate: 23.6}}),
  s("apples", "Apples", null, "Produce", "1 medium (182 g)", 182, "3 lb bag (about 7)", 7.0, 3.29, {kcal: 95, protein: 0.5, carbs: 25.1, fat: 0.3, fiber: 4.4, sugar: 18.9, satFat: 0.1, micros: {sodium: 2, calcium: 10.9, iron: 0.218, potassium: 195.0, magnesium: 9.1, zinc: 0.0728, "vitamin-c": 8.37, "vitamin-a": 5.46, folate: 5.46}}),
  s("potatoes", "Russet potatoes", null, "Produce", "1 medium (213 g)", 213, "5 lb bag (about 10)", 10.0, 3.29, {kcal: 168, protein: 4.6, carbs: 38.5, fat: 0.2, fiber: 2.8, sugar: 1.3, satFat: 0.1, micros: {sodium: 11, calcium: 27.7, iron: 1.83, potassium: 888.0, magnesium: 49.0, zinc: 0.618, "vitamin-c": 12.1, folate: 29.8}}),
  s("sweet-potatoes", "Sweet potatoes", null, "Produce", "1 medium (130 g)", 130, "3 lb bag (about 9)", 9.0, 2.99, {kcal: 112, protein: 2.0, carbs: 26.2, fat: 0.1, fiber: 3.9, sugar: 5.4, satFat: 0.0, micros: {sodium: 72, calcium: 39.0, iron: 0.793, potassium: 438.0, magnesium: 32.5, zinc: 0.39, "vitamin-c": 3.12, "vitamin-a": 922.0, folate: 14.3}}),
  s("onions", "Yellow onions", null, "Produce", "1 medium (110 g)", 110, "3 lb bag (about 11)", 11.0, 2.69, {kcal: 44, protein: 1.2, carbs: 10.3, fat: 0.1, fiber: 1.9, sugar: 4.7, satFat: 0.0, micros: {sodium: 4, calcium: 25.3, iron: 0.231, potassium: 161.0, magnesium: 11.0, zinc: 0.187, "vitamin-c": 8.14, folate: 20.9}}),
  s("bell-pepper", "Green bell pepper", null, "Produce", "1 medium (119 g)", 119, "1 pepper", 1.0, 0.79, {kcal: 24, protein: 1.0, carbs: 5.5, fat: 0.2, fiber: 2.0, sugar: 2.9, satFat: 0.1, micros: {sodium: 4, calcium: 11.9, iron: 0.405, potassium: 208.0, magnesium: 11.9, zinc: 0.155, "vitamin-c": 95.7, "vitamin-a": 21.4, folate: 11.9}}),
  s("spinach", "Baby spinach", null, "Produce", "2 cups (60 g)", 60, "6 oz bag", 2.8, 1.99, {kcal: 14, protein: 1.7, carbs: 2.2, fat: 0.2, fiber: 1.3, sugar: 0.3, satFat: 0.0, micros: {sodium: 47, calcium: 59.4, iron: 1.63, potassium: 335.0, magnesium: 47.4, zinc: 0.318, "vitamin-c": 16.9, "vitamin-a": 281.0, folate: 116.0}}),
  s("romaine", "Romaine hearts", null, "Produce", "1 1/2 cups shredded (85 g)", 85, "3 hearts (about 18 oz)", 6.0, 2.69, {kcal: 14, protein: 1.0, carbs: 2.8, fat: 0.3, fiber: 1.8, sugar: 1.0, satFat: 0.0, micros: {sodium: 7, calcium: 28.1, iron: 0.825, potassium: 210.0, magnesium: 11.9, zinc: 0.196, "vitamin-c": 3.4, "vitamin-a": 371.0, folate: 116.0}}),
  s("baby-carrots", "Baby carrots", null, "Produce", "3 oz (about 8) (85 g)", 85, "1 lb bag", 5.3, 1.15, {kcal: 30, protein: 0.5, carbs: 7.0, fat: 0.1, fiber: 2.5, sugar: 4.0, satFat: 0.0, micros: {sodium: 66, calcium: 27.2, iron: 0.756, potassium: 201.0, magnesium: 8.5, zinc: 0.145, "vitamin-c": 2.21, "vitamin-a": 586.0, folate: 22.9}}),
  s("almonds", "Almonds", "Southern Grove", "Snacks", "1 oz (about 23) (28 g)", 28, "16 oz bag", 16.2, 5.49, {kcal: 162, protein: 5.9, carbs: 6.0, fat: 14.0, fiber: 3.5, sugar: 1.2, satFat: 1.1, micros: {sodium: 0, calcium: 75.3, iron: 1.04, potassium: 205.0, magnesium: 75.6, zinc: 0.874, folate: 12.3}}),
  s("raisins", "Raisins", null, "Snacks", "1/4 cup (40 g)", 40, "20 oz canister", 14.2, 3.49, {kcal: 120, protein: 1.2, carbs: 31.7, fat: 0.2, fiber: 1.5, sugar: 23.7, satFat: 0.0, micros: {sodium: 4, calcium: 20.0, iron: 0.752, potassium: 300.0, magnesium: 12.8, zinc: 0.088, "vitamin-c": 0.92, folate: 2.0}}),
  s("pretzels", "Pretzel twists", "Clancy's", "Snacks", "1 oz (28 g)", 28, "16 oz bag", 16.2, 1.69, {kcal: 108, protein: 2.8, carbs: 22.5, fat: 0.8, fiber: 1.0, sugar: 0.6, satFat: 0.1, micros: {sodium: 347, calcium: 7.56, iron: 1.28, potassium: 62.4, magnesium: 8.12, zinc: 0.291, "vitamin-c": 0.588, folate: 46.5}}),
]

export const STAPLE_BY_ID: Record<string, Staple> = Object.fromEntries(ALDI_STAPLES.map((x) => [x.id, x]))
