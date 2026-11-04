import type { ActivityLevel, MealEntry, Micros, Sex } from '../db/types'

export interface Totals {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  addedSugar: number
  satFat: number
  micros: Micros
  /** How many logged foods carried each optional nutrient, to say how complete a total is. */
  known: { entries: number; fiber: number; sugar: number; addedSugar: number; satFat: number; sodium: number }
}

export const emptyTotals = (): Totals => ({
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  addedSugar: 0,
  satFat: 0,
  micros: {},
  known: { entries: 0, fiber: 0, sugar: 0, addedSugar: 0, satFat: 0, sodium: 0 },
})

export function mealTotals(entries: MealEntry[]): Totals {
  const t = emptyTotals()
  for (const e of entries) {
    const k = e.servings
    const f = e.food
    t.kcal += f.kcal * k
    t.protein += f.protein * k
    t.carbs += f.carbs * k
    t.fat += f.fat * k
    t.known.entries++
    for (const key of ['fiber', 'sugar', 'addedSugar', 'satFat'] as const) {
      const v = f[key]
      if (v == null) continue
      t[key] += v * k
      t.known[key]++
    }
    if (f.micros?.sodium != null) t.known.sodium++
    for (const [id, v] of Object.entries(f.micros ?? {})) t.micros[id] = (t.micros[id] ?? 0) + v * k
  }
  return t
}

/* ── Daily nutrient checks ─────────────────────────────────────────── */

export type CheckStatus = 'good' | 'low' | 'high' | 'unknown'

export interface NutrientCheck {
  id: 'fiber' | 'sodium' | 'sugar' | 'satFat'
  label: string
  value: number
  unit: 'g' | 'mg'
  /** A minimum to reach (fiber) or a limit to stay under (the rest). */
  kind: 'min' | 'max'
  target: number
  status: CheckStatus
  why: string
  /** Logged foods without data for this nutrient. */
  missing: number
}

/**
 * Checks from the Dietary Guidelines for Americans 2020–2025: fiber 14 g per 1,000 kcal; sodium
 * under 2,300 mg; added sugars and saturated fat each under 10% of calories (your calorie goal).
 */
export function dailyChecks(t: Totals, calorieGoal: number): NutrientCheck[] {
  const n = t.known.entries
  const fiberTarget = Math.round((calorieGoal / 1000) * 14)
  const sugarLimit = Math.round((calorieGoal * 0.1) / 4)
  const satLimit = Math.round((calorieGoal * 0.1) / 9)
  const sodium = t.micros.sodium ?? 0
  const useAdded = t.known.addedSugar > 0
  const status = (kind: 'min' | 'max', value: number, target: number, known: number): CheckStatus =>
    !n || !known ? 'unknown' : kind === 'min' ? (value >= target ? 'good' : 'low') : value > target ? 'high' : 'good'
  return [
    {
      id: 'fiber',
      label: 'Fiber',
      value: t.fiber,
      unit: 'g',
      kind: 'min',
      target: fiberTarget,
      status: status('min', t.fiber, fiberTarget, t.known.fiber),
      why: `14 g per 1,000 calories. Fiber keeps you full on fewer calories. Beans, oats, berries, vegetables and whole grains are the easy wins.`,
      missing: n - t.known.fiber,
    },
    {
      id: 'sodium',
      label: 'Sodium',
      value: sodium,
      unit: 'mg',
      kind: 'max',
      target: 2300,
      status: status('max', sodium, 2300, t.known.sodium),
      why: 'Under 2,300 mg a day for adults. Restaurant meals, deli meat, soups and sauces are the big sources. On long sweaty hikes you need more; see Fuel for long walks.',
      missing: n - t.known.sodium,
    },
    {
      id: 'sugar',
      label: useAdded ? 'Added sugars' : 'Sugars (total)',
      value: useAdded ? t.addedSugar : t.sugar,
      unit: 'g',
      kind: 'max',
      target: sugarLimit,
      status: useAdded ? status('max', t.addedSugar, sugarLimit, t.known.addedSugar) : 'unknown',
      why: useAdded
        ? `Under 10% of your ${calorieGoal.toLocaleString()} calories. Added sugar is the sugar put in during processing, not what’s naturally in fruit or milk.`
        : `The limit (under 10% of calories, ${sugarLimit} g) is for added sugar. Most foods here only list total sugars, which include fruit and milk sugar, so this is shown for information.`,
      missing: n - (useAdded ? t.known.addedSugar : t.known.sugar),
    },
    {
      id: 'satFat',
      label: 'Saturated fat',
      value: t.satFat,
      unit: 'g',
      kind: 'max',
      target: satLimit,
      status: status('max', t.satFat, satLimit, t.known.satFat),
      why: `Under 10% of calories. Mostly from fatty meat, cheese, butter and fried food.`,
      missing: n - t.known.satFat,
    },
  ]
}

/** Share of calories from each macro, with the Acceptable Macronutrient Distribution Ranges. */
export function macroSplit(t: Pick<Totals, 'protein' | 'carbs' | 'fat'>) {
  const kcal = t.protein * 4 + t.carbs * 4 + t.fat * 9
  const pct = (v: number) => (kcal > 0 ? (v / kcal) * 100 : 0)
  return [
    { id: 'protein', label: 'Protein', pct: pct(t.protein * 4), low: 10, high: 35 },
    { id: 'carbs', label: 'Carbs', pct: pct(t.carbs * 4), low: 45, high: 65 },
    { id: 'fat', label: 'Fat', pct: pct(t.fat * 9), low: 20, high: 35 },
  ] as const
}

/* ── Weekly averages ───────────────────────────────────────────────── */

export interface DaySummary {
  date: string
  kcal: number
  protein: number
  fiber: number
  sodium: number
  logged: boolean
}

export interface WeekSummary {
  days: DaySummary[]
  logged: number
  avgKcal: number
  avgProtein: number
  avgFiber: number
  avgSodium: number
  /** Days within ±10% of the calorie goal. */
  kcalOnTarget: number
  /** Days reaching at least 90% of the protein goal. */
  proteinMet: number
}

/** Averages over the days you logged food, so a forgotten day doesn't drag the average down. */
export function weekSummary(meals: MealEntry[], dates: string[], calorieGoal: number, proteinGoal: number): WeekSummary {
  const days = dates.map((date): DaySummary => {
    const t = mealTotals(meals.filter((m) => m.date === date))
    return { date, kcal: t.kcal, protein: t.protein, fiber: t.fiber, sodium: t.micros.sodium ?? 0, logged: t.known.entries > 0 }
  })
  const logged = days.filter((d) => d.logged)
  const avg = (f: (d: DaySummary) => number) => (logged.length ? logged.reduce((n, d) => n + f(d), 0) / logged.length : 0)
  return {
    days,
    logged: logged.length,
    avgKcal: avg((d) => d.kcal),
    avgProtein: avg((d) => d.protein),
    avgFiber: avg((d) => d.fiber),
    avgSodium: avg((d) => d.sodium),
    kcalOnTarget: logged.filter((d) => Math.abs(d.kcal - calorieGoal) <= calorieGoal * 0.1).length,
    proteinMet: logged.filter((d) => d.protein >= proteinGoal * 0.9).length,
  }
}

export const ACTIVITY: Record<ActivityLevel, { factor: number; label: string }> = {
  sedentary: { factor: 1.2, label: 'Sedentary (desk job, little exercise)' },
  light: { factor: 1.375, label: 'Light (exercise 1–3 days a week)' },
  moderate: { factor: 1.55, label: 'Moderate (exercise 3–5 days a week)' },
  active: { factor: 1.725, label: 'Active (hard exercise 6–7 days a week)' },
  very_active: { factor: 1.9, label: 'Very active (physical job plus training)' },
}

/** Resting energy use (Mifflin-St Jeor). */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161)
}

export function tdee(sex: Sex, weightKg: number, heightCm: number, age: number, activity: ActivityLevel): number {
  return bmr(sex, weightKg, heightCm, age) * ACTIVITY[activity].factor
}

export type GoalKind = 'lose' | 'maintain' | 'gain'

/**
 * Suggested daily targets: ~20% deficit or ~10% surplus; protein 1.8 g/kg
 * (within the ISSN's 1.4–2.0 g/kg for people who train, a little higher while cutting);
 * fat 27% of calories; the rest carbs.
 */
export function suggestGoals(maintenance: number, weightKg: number, goal: GoalKind) {
  const kcal = Math.round((goal === 'lose' ? maintenance * 0.8 : goal === 'gain' ? maintenance * 1.1 : maintenance) / 10) * 10
  const protein = Math.round(weightKg * (goal === 'lose' ? 2.0 : 1.8))
  const fat = Math.round((kcal * 0.27) / 9)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  return { kcal, protein, fat, carbs }
}
