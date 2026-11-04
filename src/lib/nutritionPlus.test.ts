import { describe, expect, it } from 'vitest'
import { ALDI_STAPLES, STAPLE_BY_ID } from '../data/aldi'
import { COMMON_FOODS } from '../data/commonFoods'
import { BUILTIN_RECIPES } from '../data/recipes'
import { CHAINS, MENU } from '../data/restaurants'
import type { MealEntry } from '../db/types'
import { parseFdcFood } from './fdc'
import { dayActivity, fuelPlan, strengthBurn, walkBurn } from './fuel'
import { builtinToRecipe, costPerServing, ingredientAmount, priceBook, proteinPerDollar, recipeCost, recipeFood, stapleFood } from './grocery'
import { dailyChecks, macroSplit, mealTotals, weekSummary } from './nutrition'
import { isAldi, parseOffProduct } from './off'
import { menuFood } from './restaurants'

const meal = (date: string, food: Partial<MealEntry['food']>, servings = 1): MealEntry => ({
  date,
  meal: 'lunch',
  servings,
  createdAt: 0,
  food: { name: 'x', servingLabel: '1', servingGrams: null, kcal: 0, protein: 0, carbs: 0, fat: 0, source: 'manual', ...food },
})

describe('built-in data', () => {
  it('Aldi staples have sane nutrition, packages and estimates', () => {
    expect(ALDI_STAPLES.length).toBeGreaterThan(40)
    for (const s of ALDI_STAPLES) {
      expect(s.packageServings, s.id).toBeGreaterThan(0)
      expect(s.estPrice, s.id).toBeGreaterThan(0)
      expect(s.facts.kcal, s.id).toBeGreaterThanOrEqual(0)
      // Energy roughly matches the macros (4/4/9), within label tolerance.
      const fromMacros = s.facts.protein * 4 + s.facts.carbs * 4 + s.facts.fat * 9
      expect(Math.abs(fromMacros - s.facts.kcal), s.id).toBeLessThan(Math.max(15, s.facts.kcal * 0.2))
    }
    expect(STAPLE_BY_ID['eggs'].facts.protein).toBeCloseTo(6.3, 1)
  })

  it('common foods carry sodium and saturated fat from USDA', () => {
    const egg = COMMON_FOODS.find((f) => f.name === 'Egg, large')!
    expect(egg.kcal).toBe(72)
    expect(egg.micros?.sodium).toBe(71)
    expect(egg.satFat).toBeCloseTo(1.6, 1)
  })

  it('every built-in recipe uses known staples', () => {
    for (const r of BUILTIN_RECIPES) for (const [id] of r.ingredients) expect(STAPLE_BY_ID[id], `${r.id}: ${id}`).toBeDefined()
  })

  it('restaurant menu rows point at real chains and have energy', () => {
    expect(MENU.length).toBeGreaterThan(600)
    for (const r of MENU) {
      expect(CHAINS[r[0]], r[1]).toBeDefined()
      expect(r[4]).toBeGreaterThanOrEqual(0)
    }
    const names = new Set(CHAINS.map((c) => c.name))
    for (const n of ['Taco Bell', 'Subway', 'Chick-fil-A', "Arby's", 'KFC', "Applebee's", 'Cracker Barrel']) expect(names.has(n), n).toBe(true)
    const row = MENU.find((r) => CHAINS[r[0]].name === 'Taco Bell')!
    const food = menuFood(CHAINS[row[0]], row)
    expect(food.brand).toBe('Taco Bell')
    expect(food.sourceNote).toBe('2018 menu data')
  })
})

describe('recipe cost', () => {
  const book = new Map(priceBook([]).map((i) => [i.id, i]))
  const bowls = builtinToRecipe(BUILTIN_RECIPES.find((r) => r.id === 'burrito-bowls')!)

  it('scales with servings and buys whole packages at checkout', () => {
    const four = recipeCost(bowls, 4, book)
    const eight = recipeCost(bowls, 8, book)
    expect(four.total).toBeGreaterThan(0)
    expect(eight.total).toBeCloseTo(four.total * 2, 6)
    expect(eight.perServing).toBeCloseTo(four.perServing, 6)
    expect(four.checkout).toBeGreaterThanOrEqual(four.total)
    // 4 servings use 4 of the 12 chicken servings in a family pack: one pack.
    expect(four.lines.find((l) => l.item.id === 'aldi:chicken-breast')!.packages).toBe(1)
    expect(four.estimates).toBe(four.lines.length)
    expect(four.unpriced).toEqual([])
  })

  it('uses your price instead of the estimate', () => {
    const mine = priceBook([{ id: 'aldi:chicken-breast', name: 'c', store: 'Aldi', food: stapleFood(STAPLE_BY_ID['chicken-breast']), packageLabel: '3 lb', packageServings: 12, price: 12, updatedAt: 1 }])
    const item = mine.find((i) => i.id === 'aldi:chicken-breast')!
    expect(item.yours).toBe(true)
    expect(costPerServing(item)).toBe(1)
    expect(proteinPerDollar(item)).toBeCloseTo(STAPLE_BY_ID['chicken-breast'].facts.protein, 6)
    const cost = recipeCost(bowls, 4, new Map(mine.map((i) => [i.id, i])))
    expect(cost.lines.find((l) => l.item.id === 'aldi:chicken-breast')!.usedCost).toBeCloseTo(4, 6)
  })

  it('reports ingredients without a price', () => {
    const r = { ...bowls, ingredients: [...bowls.ingredients, { food: stapleFood(STAPLE_BY_ID['eggs']), servings: 1 }] }
    expect(recipeCost(r, 4, book).unpriced).toEqual(['Large eggs'])
  })

  it('gives per-serving nutrition', () => {
    const f = recipeFood(bowls)
    const total = bowls.ingredients.reduce((n, i) => n + i.food.kcal * i.servings, 0)
    expect(f.kcal).toBeCloseTo(total / 4, 6)
    expect(f.source).toBe('recipe')
  })

  it('shows weights for weighed foods and counts for the rest', () => {
    expect(ingredientAmount(stapleFood(STAPLE_BY_ID['chicken-breast']), 4, true)).toBe('1 lb (452 g)')
    expect(ingredientAmount(stapleFood(STAPLE_BY_ID['chicken-breast']), 8, true)).toBe('2 lb (904 g)')
    expect(ingredientAmount(stapleFood(STAPLE_BY_ID['chicken-breast']), 4, false)).toBe('452 g')
    expect(ingredientAmount(stapleFood(STAPLE_BY_ID['eggs']), 4, true)).toBe('4 × large egg (50 g)')
    expect(ingredientAmount(stapleFood(STAPLE_BY_ID['rice-white']), 8, true)).toBe('2 cups dry (368 g)')
    expect(ingredientAmount(stapleFood(STAPLE_BY_ID['rice-white']), 1, true)).toBe('¼ cup dry (46 g)')
    expect(ingredientAmount(stapleFood(STAPLE_BY_ID['romaine']), 2, true)).toBe('3 cups shredded (170 g)')
    expect(ingredientAmount(stapleFood(STAPLE_BY_ID['peanut-butter']), 2, true)).toBe('4 tbsp (64 g)')
    expect(ingredientAmount(stapleFood(STAPLE_BY_ID['milk-2']), 2, true)).toBe('2 cups (488 g)')
    expect(ingredientAmount(stapleFood(STAPLE_BY_ID['tortilla-corn']), 4, true)).toBe('8 tortillas (6 in) (192 g)')
  })
})

describe('nutrient checks', () => {
  it('flags sodium and saturated fat, and counts missing data', () => {
    const t = mealTotals([meal('d', { kcal: 900, fat: 40, satFat: 30, fiber: 5, micros: { sodium: 2600 } }), meal('d', { kcal: 100 })])
    const c = Object.fromEntries(dailyChecks(t, 2000).map((x) => [x.id, x]))
    expect(c.sodium.status).toBe('high')
    expect(c.satFat.target).toBe(22)
    expect(c.satFat.status).toBe('high')
    expect(c.fiber.target).toBe(28)
    expect(c.fiber.status).toBe('low')
    expect(c.fiber.missing).toBe(1)
    // Only total sugars known: shown for information, not judged.
    expect(c.sugar.status).toBe('unknown')
  })

  it('uses added sugars when labels have them', () => {
    const t = mealTotals([meal('d', { kcal: 500, sugar: 40, addedSugar: 30 })])
    const sugar = dailyChecks(t, 2000).find((x) => x.id === 'sugar')!
    expect(sugar.label).toBe('Added sugars')
    expect(sugar.status).toBe('good')
  })

  it('splits calories by macro', () => {
    const [p, c, f] = macroSplit({ protein: 100, carbs: 200, fat: 400 / 9 })
    expect(p.pct).toBeCloseTo(25, 6)
    expect(c.pct).toBeCloseTo(50, 6)
    expect(f.pct).toBeCloseTo(25, 6)
  })
})

describe('weekly averages', () => {
  it('averages only logged days and counts days on target', () => {
    const dates = ['a', 'b', 'c']
    const w = weekSummary([meal('a', { kcal: 2000, protein: 150 }), meal('b', { kcal: 2500, protein: 100 })], dates, 2000, 150)
    expect(w.logged).toBe(2)
    expect(w.avgKcal).toBe(2250)
    expect(w.kcalOnTarget).toBe(1)
    expect(w.proteinMet).toBe(1)
    expect(w.days[2].logged).toBe(false)
  })
})

describe('walking burn and fuel', () => {
  it('matches the ACSM walking equation', () => {
    // 100 kg, 3 mph flat, 60 min: VO2 = 3.5 + 0.1 × 80.47 = 11.55 ml/kg/min.
    const b = walkBurn({ weightKg: 100, minutes: 60 })
    expect(b.gross).toBeCloseTo(11.547 * 0.1 * 5 * 60, 0)
    expect(b.net).toBeCloseTo(8.047 * 0.1 * 5 * 60, 0)
  })

  it('costs more uphill, with a pack and on trail', () => {
    const base = walkBurn({ weightKg: 100, minutes: 60 }).net
    expect(walkBurn({ weightKg: 100, minutes: 60, gradePct: 5 }).net).toBeGreaterThan(base * 1.8)
    expect(walkBurn({ weightKg: 100, minutes: 60, packKg: 10 }).net).toBeCloseTo(base * 1.1, 6)
    expect(walkBurn({ weightKg: 100, minutes: 60, terrain: 'trail' }).net).toBeCloseTo(base * 1.2, 6)
  })

  it('estimates strength training at 3.5 METs', () => {
    expect(strengthBurn(100, 60).gross).toBeCloseTo((3.5 * 3.5 * 100 * 60) / 200, 6)
  })

  it('reads walks and finished workouts for a day', () => {
    const lines = dayActivity(
      '2026-06-01',
      100,
      [{ date: '2026-06-01', kind: 'walk', walkMin: 45, inclinePct: 3 }, { date: '2026-06-01', kind: 'session', session: 'walkHills', status: 'skipped', walkMin: 30 }],
      [{ date: '2026-06-01', name: 'Strength A', startedAt: 0, endedAt: 40 * 60000, entries: [] }],
    )
    expect(lines.map((l) => l.label)).toEqual(['Walk', 'Strength A'])
  })

  it('scales fuel advice with time', () => {
    expect(fuelPlan(0.75, 200, false, true).carbsPerHour).toEqual([0, 0])
    const long = fuelPlan(6, 1500, true, true)
    expect(long.carbsPerHour).toEqual([30, 60])
    expect(long.salty).toBe(true)
    expect(long.eatBack).toEqual([600, 900])
    expect(fuelPlan(6, 1500, false, false).eatBack).toEqual([1200, 1500])
  })
})

describe('food sources', () => {
  it('spots Aldi products by house brand or store', () => {
    expect(isAldi('Simply Nature')).toBe(true)
    expect(isAldi("L'oven Fresh")).toBe(true)
    expect(isAldi('Kraft', 'Walmart, ALDI')).toBe(true)
    expect(isAldi('Kraft', 'Walmart')).toBe(false)
  })

  it('reads sugars, saturated fat and the Aldi store from Open Food Facts', () => {
    const f = parseOffProduct({
      code: '1',
      product_name: 'Protein bar',
      brands: 'Elevation, Millville',
      serving_size: '1 bar (60 g)',
      serving_quantity: 60,
      nutriments: { 'energy-kcal_100g': 350, proteins_100g: 33, carbohydrates_100g: 40, fat_100g: 12, sugars_100g: 10, 'saturated-fat_100g': 5, sodium_100g: 0.3 },
    })!
    expect(f.store).toBe('Aldi')
    expect(f.sugar).toBeCloseTo(6, 6)
    expect(f.satFat).toBeCloseTo(3, 6)
    expect(f.micros?.sodium).toBeCloseTo(180, 6)
  })

  it('parses USDA search results per 100 g or per labeled serving', () => {
    const generic = parseFdcFood({
      fdcId: 1,
      description: 'RICE, WHITE, COOKED',
      dataType: 'SR Legacy',
      foodNutrients: [
        { nutrientNumber: '208', unitName: 'KCAL', value: 130 },
        { nutrientNumber: '203', unitName: 'G', value: 2.7 },
        { nutrientNumber: '205', unitName: 'G', value: 28 },
        { nutrientNumber: '204', unitName: 'G', value: 0.3 },
        { nutrientNumber: '307', unitName: 'MG', value: 1 },
      ],
    })!
    expect(generic.name).toBe('Rice, White, Cooked')
    expect(generic.servingLabel).toBe('100 g')
    expect(generic.kcal).toBe(130)
    expect(generic.micros?.sodium).toBe(1)

    const branded = parseFdcFood({
      fdcId: 2,
      description: 'Greek yogurt',
      dataType: 'Branded',
      brandOwner: 'ALDI',
      servingSize: 170,
      servingSizeUnit: 'g',
      householdServingFullText: '3/4 cup',
      foodNutrients: [
        { nutrientId: 1008, unitName: 'KCAL', value: 59 },
        { nutrientId: 1003, unitName: 'G', value: 10 },
        { nutrientId: 1235, unitName: 'G', value: 0 },
      ],
    })!
    expect(branded.servingLabel).toBe('3/4 cup (170 g)')
    expect(branded.kcal).toBeCloseTo(100.3, 6)
    expect(branded.protein).toBeCloseTo(17, 6)
    expect(branded.addedSugar).toBe(0)
    expect(branded.brand).toBe('Aldi')
  })
})
