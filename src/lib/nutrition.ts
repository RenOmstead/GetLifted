import type { ActivityLevel, MealEntry, Micros, Sex } from '../db/types'

export interface Totals {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  micros: Micros
}

export const emptyTotals = (): Totals => ({ kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, micros: {} })

export function mealTotals(entries: MealEntry[]): Totals {
  const t = emptyTotals()
  for (const e of entries) {
    const k = e.servings
    t.kcal += e.food.kcal * k
    t.protein += e.food.protein * k
    t.carbs += e.food.carbs * k
    t.fat += e.food.fat * k
    t.fiber += (e.food.fiber ?? 0) * k
    for (const [id, v] of Object.entries(e.food.micros ?? {})) t.micros[id] = (t.micros[id] ?? 0) + v * k
  }
  return t
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
