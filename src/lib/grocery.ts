import { ALDI_STAPLES, type Staple, type StapleCategory } from '../data/aldi'
import type { BuiltinRecipe } from '../data/recipes'
import type { FoodSnapshot, GroceryPrice, Micros, NutritionFacts, Recipe } from '../db/types'

export const stapleFood = (s: Staple): FoodSnapshot => ({
  name: s.name,
  ...(s.brand ? { brand: s.brand } : {}),
  servingLabel: s.servingLabel,
  servingGrams: s.servingGrams,
  ...s.facts,
  source: 'staple',
  store: 'Aldi',
})

export const stapleGroceryId = (stapleId: string) => `aldi:${stapleId}`

/** A priced grocery item: a built-in Aldi staple (your price or its starter estimate) or one you added. */
export interface PriceItem {
  id: string
  name: string
  brand?: string
  store: string
  category: StapleCategory | 'Your items'
  food: FoodSnapshot
  packageLabel: string
  packageServings: number
  price: number
  /** true when the price is one you entered; false for a starter estimate. */
  yours: boolean
  updatedAt?: number
  staple?: Staple
}

export function priceBook(saved: GroceryPrice[]): PriceItem[] {
  const byId = new Map(saved.map((p) => [p.id, p]))
  const staples: PriceItem[] = ALDI_STAPLES.map((s) => {
    const mine = byId.get(stapleGroceryId(s.id))
    return {
      id: stapleGroceryId(s.id),
      name: s.name,
      brand: s.brand,
      store: 'Aldi',
      category: s.category,
      food: stapleFood(s),
      packageLabel: mine?.packageLabel ?? s.packageLabel,
      packageServings: mine?.packageServings ?? s.packageServings,
      price: mine?.price ?? s.estPrice,
      yours: !!mine,
      updatedAt: mine?.updatedAt,
      staple: s,
    }
  })
  const own: PriceItem[] = saved
    .filter((p) => !p.id.startsWith('aldi:'))
    .map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.food.brand,
      store: p.store,
      category: 'Your items',
      food: p.food,
      packageLabel: p.packageLabel,
      packageServings: p.packageServings,
      price: p.price,
      yours: true,
      updatedAt: p.updatedAt,
    }))
  return [...staples, ...own]
}

export const costPerServing = (p: Pick<PriceItem, 'price' | 'packageServings'>) => (p.packageServings > 0 ? p.price / p.packageServings : 0)

/** Grams of protein you get for one dollar. */
export function proteinPerDollar(p: PriceItem): number | null {
  const c = costPerServing(p)
  return c > 0 && p.food.protein > 0 ? p.food.protein / c : null
}

export function money(n: number, estimate = false): string {
  return `${estimate ? '~' : ''}$${n.toFixed(2)}`
}

/* ── Nutrition sums ────────────────────────────────────────────────── */

const OPTIONAL = ['fiber', 'sugar', 'addedSugar', 'satFat'] as const

/** Adds `k` × facts into `into`. Optional nutrients stay undefined until some food has them. */
export function addFacts(into: NutritionFacts, f: NutritionFacts, k: number): NutritionFacts {
  into.kcal += f.kcal * k
  into.protein += f.protein * k
  into.carbs += f.carbs * k
  into.fat += f.fat * k
  for (const key of OPTIONAL) {
    const v = f[key]
    if (v != null) into[key] = (into[key] ?? 0) + v * k
  }
  if (f.micros) {
    const m: Micros = (into.micros ??= {})
    for (const [id, v] of Object.entries(f.micros)) m[id] = (m[id] ?? 0) + v * k
  }
  return into
}

export const emptyFacts = (): NutritionFacts => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 })

/* ── Recipes ───────────────────────────────────────────────────────── */

export function builtinToRecipe(b: BuiltinRecipe): Recipe {
  return {
    name: b.name,
    servings: b.servings,
    steps: b.steps,
    notes: b.blurb,
    createdAt: 0,
    ingredients: b.ingredients.flatMap(([id, servings, note]) => {
      const s = ALDI_STAPLES.find((x) => x.id === id)
      return s ? [{ groceryId: stapleGroceryId(id), food: stapleFood(s), servings, ...(note ? { note } : {}) }] : []
    }),
  }
}

/** Nutrition for one serving of the recipe. */
export function recipeServing(r: Recipe): NutritionFacts {
  const total = emptyFacts()
  for (const i of r.ingredients) addFacts(total, i.food, i.servings)
  const per = emptyFacts()
  return addFacts(per, total, 1 / Math.max(1, r.servings))
}

export function recipeFood(r: Recipe): FoodSnapshot {
  const grams = r.ingredients.every((i) => i.food.servingGrams) ? r.ingredients.reduce((n, i) => n + (i.food.servingGrams ?? 0) * i.servings, 0) / r.servings : null
  return {
    name: r.name,
    servingLabel: grams ? `1 serving (about ${Math.round(grams)} g)` : '1 serving',
    servingGrams: grams ? Math.round(grams) : null,
    ...recipeServing(r),
    source: 'recipe',
  }
}

export interface ShoppingLine {
  item: PriceItem
  /** Servings of the item the recipe uses at this size. */
  servings: number
  /** Cost of the amount used. */
  usedCost: number
  /** Whole packages to buy. */
  packages: number
}

export interface RecipeCost {
  servings: number
  /** Cost of what goes in the pot. */
  total: number
  perServing: number
  /** What you'd pay at the register buying whole packages. */
  checkout: number
  lines: ShoppingLine[]
  /** Ingredients with no price yet. */
  unpriced: string[]
  /** Lines priced with a starter estimate. */
  estimates: number
}

/** Cost of making `servings` servings of a recipe. */
export function recipeCost(r: Recipe, servings: number, book: Map<string, PriceItem>): RecipeCost {
  const scale = servings / Math.max(1, r.servings)
  const lines: ShoppingLine[] = []
  const unpriced: string[] = []
  for (const ing of r.ingredients) {
    const item = ing.groceryId ? book.get(ing.groceryId) : undefined
    if (!item) {
      unpriced.push(ing.food.name)
      continue
    }
    const amount = ing.servings * scale
    const existing = lines.find((l) => l.item.id === item.id)
    if (existing) existing.servings += amount
    else lines.push({ item, servings: amount, usedCost: 0, packages: 0 })
  }
  for (const l of lines) {
    l.usedCost = costPerServing(l.item) * l.servings
    l.packages = l.item.packageServings > 0 ? Math.max(1, Math.ceil(l.servings / l.item.packageServings - 1e-6)) : 1
  }
  const total = lines.reduce((n, l) => n + l.usedCost, 0)
  return {
    servings,
    total,
    perServing: servings > 0 ? total / servings : 0,
    checkout: lines.reduce((n, l) => n + l.packages * l.item.price, 0),
    lines,
    unpriced,
    estimates: lines.filter((l) => !l.item.yours).length,
  }
}

/**
 * A readable amount: weight for foods measured by weight ("1 lb (452 g)"), otherwise a count of
 * servings ("4 × large egg (50 g)").
 */
export function ingredientAmount(food: FoodSnapshot, servings: number, imperial: boolean): string {
  const label = food.servingLabel
  const grams = food.servingGrams ? ` (${Math.round(food.servingGrams * servings)} g)` : ''
  // Cups and spoons: "1/4 cup dry" × 8 → "2 cups dry".
  const vol = label.match(/^(\d+ \d\/\d|\d\/\d|\d+(?:\.\d+)?) (cups?|tbsp|tsp)\b([^(]*)/)
  if (vol) {
    let n = parseQty(vol[1]) * servings
    let unit = vol[2].replace(/s$/, '')
    if (unit === 'tbsp' && n >= 8) {
      n /= 16
      unit = 'cup'
    }
    const rest = vol[3].trim()
    return `${fraction(n, unit === 'cup' ? 4 : 2)} ${unit === 'cup' && n > 1 ? 'cups' : unit}${rest ? ` ${rest}` : ''}${grams}`
  }
  const byWeight = /^\d+(\.\d+)? (oz|g|lb)\b/.test(label)
  if (!food.servingGrams || !byWeight) {
    // "2 tortillas (6 in)" × 4 → "8 tortillas (6 in)"
    const count = label.replace(/ \(\d+(\.\d+)? g\)$/, '').match(/^(\d+) ([a-z].*)$/)
    if (count && Number(count[1]) > 1) return `${fraction(Number(count[1]) * servings, 2)} ${count[2]}${grams}`
    return `${Number(servings.toFixed(2))} × ${label.replace(/^1 /, '')}`
  }
  const g = food.servingGrams * servings
  if (!imperial) return `${Math.round(g)} g`
  const oz = g / 28.3495
  if (oz >= 15.5) return `${Number((oz / 16).toFixed(1))} lb (${Math.round(g)} g)`
  return `${oz >= 4 ? Math.round(oz * 2) / 2 : Number(oz.toFixed(1))} oz (${Math.round(g)} g)`
}

const parseQty = (s: string) => s.split(' ').reduce((n, part) => n + (part.includes('/') ? Number(part.split('/')[0]) / Number(part.split('/')[1]) : Number(part)), 0)

const GLYPH: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' }

/** Rounds to the nearest 1/steps and writes it as a mixed number: 2.25 → "2¼". */
function fraction(n: number, steps: number): string {
  const r = Math.max(1 / steps, Math.round(n * steps) / steps)
  const whole = Math.floor(r)
  const part = GLYPH[Number((r - whole).toFixed(2))] ?? ''
  return whole ? `${whole}${part}` : part || '0'
}
