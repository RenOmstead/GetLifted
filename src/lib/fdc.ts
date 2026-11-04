import type { FoodSnapshot, Micros } from '../db/types'
import { NUTRIENT_BY_ID } from '../data/nutrients'

/**
 * USDA FoodData Central search (fdc.nal.usda.gov). Free; the shared DEMO_KEY allows about 30
 * searches an hour per network, so the app searches only when you press Search. A free personal
 * key from api.data.gov raises that to 1,000 an hour.
 */
const FDC = 'https://api.nal.usda.gov/fdc/v1/foods/search'
export const DEMO_KEY = 'DEMO_KEY'
export const KEY_SIGNUP_URL = 'https://fdc.nal.usda.gov/api-key-signup'

interface FdcNutrient {
  nutrientId?: number
  nutrientNumber?: string
  unitName?: string
  value?: number
}

export interface FdcFood {
  fdcId: number
  description: string
  dataType?: string
  brandOwner?: string
  brandName?: string
  servingSize?: number
  servingSizeUnit?: string
  householdServingFullText?: string
  foodNutrients?: FdcNutrient[]
}

/** USDA nutrient numbers → our fields. */
const MACROS: Record<string, 'kcal' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar' | 'addedSugar' | 'satFat'> = {
  '208': 'kcal',
  '957': 'kcal',
  '958': 'kcal',
  '203': 'protein',
  '205': 'carbs',
  '204': 'fat',
  '291': 'fiber',
  '269': 'sugar',
  '539': 'addedSugar',
  '606': 'satFat',
}
/** nutrient number → [our id, factor from USDA's unit to ours] */
const MICROS: Record<string, [string, number]> = {
  '307': ['sodium', 1],
  '301': ['calcium', 1],
  '303': ['iron', 1],
  '306': ['potassium', 1],
  '304': ['magnesium', 1],
  '309': ['zinc', 1],
  '305': ['phosphorus', 1],
  '312': ['copper', 1000],
  '317': ['selenium', 1],
  '401': ['vitamin-c', 1],
  '320': ['vitamin-a', 1],
  '328': ['vitamin-d', 1],
  '323': ['vitamin-e', 1],
  '430': ['vitamin-k', 1],
  '404': ['thiamin', 1],
  '405': ['riboflavin', 1],
  '406': ['niacin', 1],
  '415': ['vitamin-b6', 1],
  '418': ['vitamin-b12', 1],
  '435': ['folate', 1],
  '421': ['choline', 1],
  '262': ['caffeine', 1],
}
/** Newer records sometimes omit nutrientNumber; map the common nutrient ids too. */
const ID_TO_NUMBER: Record<number, string> = { 1008: '208', 2047: '957', 2048: '958', 1003: '203', 1005: '205', 1004: '204', 1079: '291', 2000: '269', 1235: '539', 1258: '606', 1093: '307' }

const DATA_TYPES: Record<string, string> = {
  Branded: 'USDA branded label',
  'Survey (FNDDS)': 'USDA survey food',
  'SR Legacy': 'USDA SR Legacy',
  Foundation: 'USDA Foundation',
}

/** Values in search results are per 100 g (branded foods are converted from the label). */
export function parseFdcFood(f: FdcFood): FoodSnapshot | null {
  const per100: Partial<Record<(typeof MACROS)[string], number>> = {}
  const micros100: Micros = {}
  for (const n of f.foodNutrients ?? []) {
    const num = n.nutrientNumber ?? (n.nutrientId != null ? ID_TO_NUMBER[n.nutrientId] : undefined)
    if (!num || n.value == null || !Number.isFinite(n.value)) continue
    const macro = MACROS[num]
    if (macro) {
      if (macro === 'kcal' && n.unitName && n.unitName.toUpperCase() !== 'KCAL') continue
      // Prefer 208 (energy) over the Atwater variants when both are present.
      if (macro === 'kcal' && per100.kcal != null && num !== '208') continue
      per100[macro] = n.value
      continue
    }
    const micro = MICROS[num]
    if (micro && NUTRIENT_BY_ID[micro[0]] && n.value > 0) micros100[micro[0]] = n.value * micro[1]
  }
  if (per100.kcal == null || !f.description) return null
  const unit = (f.servingSizeUnit ?? '').toLowerCase()
  const servingG = f.dataType === 'Branded' && f.servingSize && (unit === 'g' || unit === 'grm') ? f.servingSize : null
  const grams = servingG ?? 100
  const k = grams / 100
  const scaled = (v: number | undefined) => (v == null ? undefined : v * k)
  const micros: Micros = {}
  for (const [id, v] of Object.entries(micros100)) micros[id] = v * k
  const name = titleCase(f.description)
  const brand = f.brandName || f.brandOwner
  return {
    name,
    ...(brand ? { brand: titleCase(brand) } : {}),
    servingLabel: servingG ? (f.householdServingFullText ? `${f.householdServingFullText} (${Math.round(servingG)} g)` : `${Math.round(servingG)} g`) : '100 g',
    servingGrams: grams,
    kcal: per100.kcal * k,
    protein: (per100.protein ?? 0) * k,
    carbs: (per100.carbs ?? 0) * k,
    fat: (per100.fat ?? 0) * k,
    fiber: scaled(per100.fiber),
    sugar: scaled(per100.sugar),
    addedSugar: scaled(per100.addedSugar),
    satFat: scaled(per100.satFat),
    micros,
    source: 'usda',
    sourceNote: DATA_TYPES[f.dataType ?? ''] ?? 'USDA FoodData Central',
  }
}

/** USDA writes many names in capitals; soften them without touching mixed-case names. */
function titleCase(s: string): string {
  return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s,(/-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase()) : s
}

export class UsdaLimitError extends Error {}

export async function searchUsda(query: string, apiKey: string | undefined, signal?: AbortSignal): Promise<FoodSnapshot[]> {
  const key = apiKey?.trim() || DEMO_KEY
  const params = new URLSearchParams({ api_key: key, query, pageSize: '30', dataType: 'Foundation,SR Legacy,Survey (FNDDS),Branded' })
  const res = await fetch(`${FDC}?${params.toString()}`, { signal })
  if (res.status === 429) throw new UsdaLimitError(key === DEMO_KEY ? 'The shared demo key has hit its hourly limit.' : 'Your key has hit its hourly limit.')
  if (res.status === 403) throw new Error('USDA rejected the API key. Check it in Settings.')
  if (!res.ok) throw new Error(`USDA returned ${res.status}`)
  const data = (await res.json()) as { foods?: FdcFood[] }
  return (data.foods ?? []).map(parseFdcFood).filter((f): f is FoodSnapshot => f != null)
}
