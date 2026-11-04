import type { Chain, MenuRow, RestaurantGroup } from '../data/restaurants'
import type { FoodSnapshot } from '../db/types'

export const GROUP_LABELS: Record<RestaurantGroup, string> = {
  mexican: 'Mexican & bowls',
  sandwich: 'Sandwich & chicken',
  burger: 'Burgers',
  pizza: 'Pizza',
  sitdown: 'Sit-down',
}

export const SOURCE_NOTES: Record<Chain['source'], string> = {
  '2018': '2018 menu data',
  usda: 'USDA lab analysis, 2006–2013',
}

export function menuFood(c: Chain, r: MenuRow): FoodSnapshot {
  const [, name, servingLabel, servingGrams, kcal, protein, carbs, fat, fiber, sugar, satFat, sodium] = r
  return {
    name,
    brand: c.name,
    servingLabel,
    servingGrams,
    kcal,
    protein,
    carbs: carbs ?? 0,
    fat: fat ?? 0,
    ...(fiber != null ? { fiber } : {}),
    ...(sugar != null ? { sugar } : {}),
    ...(satFat != null ? { satFat } : {}),
    micros: sodium != null ? { sodium } : {},
    source: 'restaurant',
    sourceNote: SOURCE_NOTES[c.source],
  }
}

/** Every word of the query must appear in the chain or item name. */
export function matches(query: string, ...fields: (string | undefined)[]): boolean {
  const hay = fields.join(' ').toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w))
}
