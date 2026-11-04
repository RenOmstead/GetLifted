import type { FoodSnapshot, Micros } from '../db/types'
import { NUTRIENT_BY_ID } from '../data/nutrients'

/** Open Food Facts: a free, open database of packaged foods (world.openfoodfacts.org). */
const OFF = 'https://world.openfoodfacts.org'
const FIELDS = 'code,product_name,brands,stores,serving_size,serving_quantity,nutriments'

/**
 * Aldi US house brands. Aldi sells almost only its own labels, so a product under one of these
 * (or tagged with the Aldi store) is an Aldi product.
 */
export const ALDI_BRANDS = [
  'aldi',
  'simply nature',
  'fit & active',
  'friendly farms',
  'kirkwood',
  'never any!',
  'millville',
  'specially selected',
  'happy farms',
  "clancy's",
  "baker's corner",
  "l'oven fresh",
  'earthly grains',
  "season's choice",
  "chef's cupboard",
  'southern grove',
  'park street deli',
  'appleton farms',
  'fremont fish market',
  "nature's nectar",
  "burman's",
  'stonemill',
  'countryside creamery',
  'casa mamita',
  "mama cozzi's",
  'reggano',
  'savoritz',
  'sundae shoppe',
  "benton's",
  'choceur',
  'moser roth',
  'barissimo',
  'goldhen',
  "dakota's pride",
  'happy harvest',
  'northern catch',
  'peanut delight',
  'carlini',
  'little salad bar',
  'lunch mate',
  'priano',
  'deutsche küche',
  'emporium selection',
  'livegfree',
  'little journey',
  'bremer',
  "cattlemen's ranch",
]
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9ü&]+/g, ' ').trim()
const ALDI_NORM = new Set(ALDI_BRANDS.map(norm))

export function isAldi(brands?: string, stores?: string): boolean {
  if (stores && /\baldi\b/i.test(stores)) return true
  return (brands ?? '').split(',').some((b) => ALDI_NORM.has(norm(b)))
}

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
  stores?: string
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
  const opt = <K extends string>(field: K, key: string): Partial<Record<K, number>> => {
    const v = num(n[`${key}_100g`])
    return v == null ? {} : ({ [field]: v * factor } as Record<K, number>)
  }

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
    ...opt('sugar', 'sugars'),
    ...opt('addedSugar', 'added-sugars'),
    ...opt('satFat', 'saturated-fat'),
    micros,
    source: 'off',
    ...(isAldi(p.brands, p.stores) ? { store: 'Aldi' } : {}),
  }
}

async function search(params: string, signal?: AbortSignal): Promise<FoodSnapshot[]> {
  const res = await fetch(`${OFF}/cgi/search.pl?${params}&search_simple=1&action=process&json=1&fields=${FIELDS}`, { signal })
  if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`)
  const data = (await res.json()) as { products?: OffProduct[] }
  return (data.products ?? []).map(parseOffProduct).filter((f): f is FoodSnapshot => f != null)
}

export async function searchFoods(query: string, signal?: AbortSignal): Promise<FoodSnapshot[]> {
  return search(`search_terms=${encodeURIComponent(query)}&page_size=25`, signal)
}

/**
 * Aldi products only: products tagged with the Aldi store, plus a wider search kept to Aldi's
 * house brands (many US Aldi products aren't store-tagged).
 */
export async function searchAldi(query: string, signal?: AbortSignal): Promise<FoodSnapshot[]> {
  const q = encodeURIComponent(query)
  const [tagged, wide] = await Promise.allSettled([
    search(`search_terms=${q}&tagtype_0=stores&tag_contains_0=contains&tag_0=aldi&page_size=30`, signal),
    search(`search_terms=${q}&page_size=100`, signal),
  ])
  if (tagged.status === 'rejected' && wide.status === 'rejected') throw tagged.reason
  const all = [...(tagged.status === 'fulfilled' ? tagged.value.map((f) => ({ ...f, store: 'Aldi' })) : []), ...(wide.status === 'fulfilled' ? wide.value.filter((f) => f.store === 'Aldi') : [])]
  const seen = new Set<string>()
  return all.filter((f) => {
    const key = f.barcode ?? `${f.name}|${f.brand}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<FoodSnapshot | null> {
  const res = await fetch(`${OFF}/api/v2/product/${encodeURIComponent(code.trim())}.json?fields=${FIELDS}`, { signal })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`)
  const data = (await res.json()) as { status?: number; product?: OffProduct }
  return data.status === 1 && data.product ? parseOffProduct({ ...data.product, code: data.product.code ?? code }) : null
}
