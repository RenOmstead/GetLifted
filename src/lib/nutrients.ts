import { NUTRIENTS, type NutrientDef, type NutrientUnit, type Profile } from '../data/nutrients'
import type { Micros, Supplement } from '../db/types'

export type AmountUnit = NutrientUnit | 'IU'

/** Normalizes label units like "mcg DFE", "Gram(s)", "µg", "IU". */
export function normalizeUnit(raw: string): AmountUnit | null {
  const u = raw.trim().toLowerCase()
  if (/^i\.?u\.?\b|^international unit/.test(u)) return 'IU'
  if (/^(mcg|µg|μg|ug|microgram)/.test(u)) return 'mcg'
  if (/^(mg|milligram)/.test(u)) return 'mg'
  if (/^(g|gram|grams|gram\(s\))\b/.test(u) || u === 'g') return 'g'
  return null
}

const MASS: Record<NutrientUnit, number> = { g: 1, mg: 1e-3, mcg: 1e-6 }

/** Converts an amount into the nutrient's reference unit, or null if not convertible. */
export function convertAmount(amount: number, unit: AmountUnit, n: NutrientDef): number | null {
  if (unit === 'IU') return n.iu != null ? amount * n.iu : null
  return (amount * MASS[unit]) / MASS[n.unit]
}

export function matchNutrient(name: string): NutrientDef | null {
  return NUTRIENTS.find((n) => n.match.test(name)) ?? null
}

export interface SupplementContribution {
  supplementId?: number
  supplementName: string
  amount: number
}

/** Per-nutrient amounts from a list of supplements and serving counts. */
export function supplementTotals(
  items: { supplement: Supplement; servings: number }[],
): { totals: Record<string, number>; sources: Record<string, SupplementContribution[]>; unmatched: string[] } {
  const totals: Record<string, number> = {}
  const sources: Record<string, SupplementContribution[]> = {}
  const unmatched = new Set<string>()
  for (const { supplement, servings } of items) {
    if (servings <= 0) continue
    for (const ing of supplement.ingredients) {
      const n = matchNutrient(ing.name)
      const unit = normalizeUnit(ing.unit)
      const converted = n && unit ? convertAmount(ing.amount, unit, n) : null
      if (!n || converted == null) {
        unmatched.add(ing.name)
        continue
      }
      const amount = converted * servings
      totals[n.id] = (totals[n.id] ?? 0) + amount
      ;(sources[n.id] ??= []).push({ supplementId: supplement.id, supplementName: supplement.name, amount })
    }
  }
  return { totals, sources, unmatched: [...unmatched] }
}

export type IntakeStatus = 'over' | 'high' | 'met' | 'in-range' | 'below' | 'none'

export interface NutrientRow {
  nutrient: NutrientDef
  fromSupplements: number
  fromFood: number
  total: number
  target: number | null
  targetHigh: number | null
  ul: number | null
  /** The amount compared with the upper limit (supplements only for some nutrients). */
  ulBasis: number
  status: IntakeStatus
  sources: SupplementContribution[]
}

/** Within this share of the upper limit we flag the intake as getting high. */
export const NEAR_UL = 0.8

export function classify(n: NutrientDef, p: Profile, fromSupplements: number, fromFood: number): Omit<NutrientRow, 'nutrient' | 'sources'> {
  const total = fromSupplements + fromFood
  const target = n.target(p)
  const targetHigh = n.targetHigh?.(p) ?? null
  const ul = n.ul(p)
  const ulBasis = n.ulScope === 'supplements' ? fromSupplements : total
  let status: IntakeStatus
  if (ul != null && ulBasis > ul) status = 'over'
  else if (targetHigh != null && total > targetHigh) status = 'high'
  else if (ul != null && ulBasis >= ul * NEAR_UL) status = 'high'
  else if (n.targetType === 'range' && target != null) status = total >= target ? 'in-range' : 'below'
  else if (target != null) status = total >= target ? 'met' : 'below'
  else status = 'none'
  return { fromSupplements, fromFood, total, target, targetHigh, ul, ulBasis, status }
}

/** Compares supplement (and optionally food) intake with each nutrient's reference values. */
export function evaluateIntake(p: Profile, supplementAmounts: Record<string, number>, sources: Record<string, SupplementContribution[]>, foodMicros: Micros = {}): NutrientRow[] {
  const ids = new Set([...Object.keys(supplementAmounts), ...Object.keys(foodMicros)])
  const rows: NutrientRow[] = []
  for (const n of NUTRIENTS) {
    if (!ids.has(n.id)) continue
    rows.push({
      nutrient: n,
      sources: sources[n.id] ?? [],
      ...classify(n, p, supplementAmounts[n.id] ?? 0, foodMicros[n.id] ?? 0),
    })
  }
  const rank: Record<IntakeStatus, number> = { over: 0, high: 1, below: 2, met: 3, 'in-range': 3, none: 4 }
  return rows.sort((a, b) => rank[a.status] - rank[b.status])
}

/** Formats an amount in its unit, e.g. "1,000 mcg", "4.5 mg". */
export function formatAmount(amount: number, unit: string): string {
  const digits = amount >= 100 ? 0 : amount >= 10 ? 1 : 2
  return `${Number(amount.toFixed(digits)).toLocaleString()} ${unit}`
}

export const STATUS_TEXT: Record<IntakeStatus, string> = {
  over: 'Above upper limit',
  high: 'Close to upper limit',
  met: 'Meets daily target',
  'in-range': 'In studied range',
  below: 'Below daily target',
  none: 'No daily target',
}
