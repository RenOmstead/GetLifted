import type { FoodItem } from '../db/types'

/**
 * Everyday whole foods with typical values per serving, rounded from USDA
 * FoodData Central. Packaged foods come from Open Food Facts search instead.
 */
type Common = Pick<FoodItem, 'name' | 'servingLabel' | 'servingGrams' | 'kcal' | 'protein' | 'carbs' | 'fat' | 'fiber'>

const f = (name: string, servingLabel: string, servingGrams: number | null, kcal: number, protein: number, carbs: number, fat: number, fiber = 0): Common => ({
  name,
  servingLabel,
  servingGrams,
  kcal,
  protein,
  carbs,
  fat,
  fiber,
})

export const COMMON_FOODS: Common[] = [
  f('Chicken breast, cooked', '100 g', 100, 165, 31, 0, 3.6),
  f('Egg, large', '1 egg', 50, 72, 6.3, 0.4, 4.8),
  f('Egg whites', '100 g', 100, 52, 10.9, 0.7, 0.2),
  f('Ground beef 90% lean, cooked', '100 g', 100, 217, 26, 0, 11.7),
  f('Salmon, cooked', '100 g', 100, 206, 22, 0, 12.4),
  f('Tuna, canned in water', '100 g', 100, 116, 25.5, 0, 0.8),
  f('Shrimp, cooked', '100 g', 100, 99, 24, 0.2, 0.3),
  f('Tofu, firm', '100 g', 100, 144, 17.3, 2.8, 8.7, 2.3),
  f('Greek yogurt, plain nonfat', '170 g cup', 170, 100, 17, 6, 0.7),
  f('Cottage cheese, 2%', '100 g', 100, 82, 10.5, 4.8, 2.3),
  f('Milk, whole', '1 cup (244 g)', 244, 149, 7.7, 11.7, 7.9),
  f('Milk, skim', '1 cup (245 g)', 245, 83, 8.3, 12.2, 0.2),
  f('Cheddar cheese', '28 g slice', 28, 113, 7, 0.4, 9.3),
  f('Whey protein (typical scoop)', '1 scoop (30 g)', 30, 120, 24, 3, 1.5),
  f('White rice, cooked', '1 cup (158 g)', 158, 205, 4.3, 44.5, 0.4, 0.6),
  f('Brown rice, cooked', '1 cup (195 g)', 195, 218, 4.5, 45.8, 1.6, 3.5),
  f('Quinoa, cooked', '1 cup (185 g)', 185, 222, 8.1, 39.4, 3.6, 5.2),
  f('Oats, dry', '40 g', 40, 152, 5.3, 27, 2.6, 4),
  f('Pasta, cooked', '1 cup (140 g)', 140, 221, 8.1, 43.2, 1.3, 2.5),
  f('Whole wheat bread', '1 slice (32 g)', 32, 80, 4, 14, 1.1, 2),
  f('Potato, baked with skin', '1 medium (173 g)', 173, 161, 4.3, 36.6, 0.2, 3.8),
  f('Sweet potato, baked', '1 medium (114 g)', 114, 103, 2.3, 23.6, 0.2, 3.8),
  f('Black beans, cooked', '1/2 cup (86 g)', 86, 114, 7.6, 20.4, 0.5, 7.5),
  f('Lentils, cooked', '1/2 cup (99 g)', 99, 115, 8.9, 19.9, 0.4, 7.8),
  f('Banana', '1 medium (118 g)', 118, 105, 1.3, 27, 0.4, 3.1),
  f('Apple', '1 medium (182 g)', 182, 95, 0.5, 25.1, 0.3, 4.4),
  f('Orange', '1 medium (131 g)', 131, 62, 1.2, 15.4, 0.2, 3.1),
  f('Blueberries', '1 cup (148 g)', 148, 84, 1.1, 21.4, 0.5, 3.6),
  f('Strawberries', '1 cup (152 g)', 152, 49, 1, 11.7, 0.5, 3),
  f('Avocado', '1/2 fruit (100 g)', 100, 160, 2, 8.5, 14.7, 6.7),
  f('Broccoli, raw', '1 cup (91 g)', 91, 31, 2.5, 6, 0.3, 2.4),
  f('Spinach, raw', '1 cup (30 g)', 30, 7, 0.9, 1.1, 0.1, 0.7),
  f('Mixed salad greens', '2 cups (85 g)', 85, 15, 1.2, 2.9, 0.2, 1.7),
  f('Almonds', '28 g (about 23)', 28, 164, 6, 6.1, 14.2, 3.5),
  f('Peanut butter', '2 tbsp (32 g)', 32, 190, 7, 7, 16, 2),
  f('Olive oil', '1 tbsp (13.5 g)', 13.5, 119, 0, 0, 13.5),
  f('Butter', '1 tbsp (14 g)', 14, 102, 0.1, 0, 11.5),
  f('Honey', '1 tbsp (21 g)', 21, 64, 0.1, 17.3, 0),
  f('Coffee, black', '1 cup (240 ml)', 240, 2, 0.3, 0, 0),
]
