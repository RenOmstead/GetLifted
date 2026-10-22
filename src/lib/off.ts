import type { FoodSnapshot, Micros } from '../db/types'
import { NUTRIENT_BY_ID } from '../data/nutrients'

/** Open Food Facts: a free, open database of packaged foods (world.openfoodfacts.org). */
const OFF = 'https://world.openfoodfacts.org'
const FIELDS = 'code,product_name,brands,serving_size,serving_quantity,nutriments'

/** Open Food Facts nutriment keys → our nutrient ids. OFF stores these per 100 g in grams. */
const OFF_MICROS: Record<string, string> = {
  'vitamin-a': 'vitamin-a',
  'vitamin-d': 'vitamin-d',
  'vitamin-e': 'vitamin-e',
  'vitamin-k': 'vitamin-k',
  'vitamin-c': 'vitamin-c',
  'vitamin-b1': 'thiamin',
  'vitamin-b2': 'riboflavin',
  'vitamin-pp': 'niacin',
  'pantothenic-acid': 'pantothenic-acid',
  'vitamin-b6': 'vitamin-b6',
  biotin: 'biotin',
  'vitamin-b9': 'folate',
  'vitamin-b12': 'vitamin-b12',
  calcium: 'calcium',
  chromium: 'chromium',
  copper: 'copper',
  iodine: 'iodine',
  iron: 'iron',
  magnesium: 'magnesium',
  manganese: 'manganese',
  molybdenum: 'molybdenum',
  phosphorus: 'phosphorus',
  potassium: 'potassium',
  selenium: 'selenium',
  sodium: 'sodium',
  zinc: 'zinc',
  caffeine: 'caffeine',
}

const GRAMS_PER_UNIT = { g: 1, mg: 1e-3, mcg: 1e-6 } as const

type Nutriments = Record<string, number | string | undefined>

interface OffProduct {
  code?: string
  product_name?: string
  brands?: string
  serving_size?: string
  serving_quantity?: number | string
  nutriments?: Nutriments
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

/** Converts an Open Food Facts product into a food with nutrition for one serving. */
export function parseOffProduct(p: OffProduct): FoodSnapshot | null {
  const n = p.nutriments ?? {}
  const name = p.product_name?.trim()
  if (!name) return null
  const kcal100 = num(n['energy-kcal_100g']) ?? (num(n['energy_100g']) != null ? num(n['energy_100g'])! / 4.184 : null)
  if (kcal100 == null) return null
  const servingGrams = num(p.serving_quantity)
  const hasServing = servingGrams != null && servingGrams > 0
  const factor = hasServing ? servingGrams / 100 : 1
  const per = (key: string) => (num(n[`${key}_100g`]) ?? 0) * factor

  const micros: Micros = {}
  for (const [offKey, id] of Object.entries(OFF_MICROS)) {
    const grams100 = num(n[`${offKey}_100g`])
    const def = NUTRIENT_BY_ID[id]
    if (grams100 == null || grams100 <= 0 || !def) continue
    micros[id] = (grams100 * factor) / GRAMS_PER_UNIT[def.unit]
  }

  return {
    name,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    servingLabel: hasServing ? p.serving_size?.trim() || `${servingGrams} g` : '100 g',
    servingGrams: hasServing ? servingGrams : 100,
    barcode: p.code,
    kcal: kcal100 * factor,
    protein: per('proteins'),
    carbs: per('carbohydrates'),
    fat: per('fat'),
    fiber: per('fiber'),
    micros,
    source: 'off',
  }
}

export async function searchFoods(query: string, signal?: AbortSignal): Promise<FoodSnapshot[]> {
  const url = `${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=25&fields=${FIELDS}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`)
  const data = (await res.json()) as { products?: OffProduct[] }
  return (data.products ?? []).map(parseOffProduct).filter((f): f is FoodSnapshot => f != null)
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<FoodSnapshot | null> {
  const res = await fetch(`${OFF}/api/v2/product/${encodeURIComponent(code.trim())}.json?fields=${FIELDS}`, { signal })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`)
  const data = (await res.json()) as { status?: number; product?: OffProduct }
  return data.status === 1 && data.product ? parseOffProduct({ ...data.product, code: data.product.code ?? code }) : null
}
