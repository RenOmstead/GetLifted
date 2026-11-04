import type { ProgramLog, Workout } from '../db/types'
import { KG_PER_LB, M_PER_MI } from './units'

/**
 * Walking and hiking energy estimates.
 *
 * Walking: ACSM metabolic equation, VO2 (ml/kg/min) = 3.5 + 0.1·S + 1.8·S·G, with S in m/min and
 * G the uphill grade as a fraction; 1 L of oxygen ≈ 5 kcal. It's validated for about 1.9–3.7 mph.
 * The pack is added to the body mass it moves, and the movement part is scaled by a terrain factor
 * (Pandolf/Soule & Goldman: paved 1.0, dirt road 1.1, trail 1.2, rough 1.5). Downhill is counted as
 * flat, which slightly overstates it.
 *
 * Strength training: 3.5 METs (Compendium of Physical Activities, moderate resistance training).
 *
 * "Net" leaves out what you'd burn sitting still anyway (1 MET), which is what extra food covers.
 */

export type Terrain = 'paved' | 'dirt' | 'trail' | 'rough'
export const TERRAIN: Record<Terrain, { label: string; factor: number }> = {
  paved: { label: 'Paved or treadmill', factor: 1 },
  dirt: { label: 'Dirt road or gravel', factor: 1.1 },
  trail: { label: 'Hiking trail', factor: 1.2 },
  rough: { label: 'Rough, rocky or snow', factor: 1.5 },
}

export interface WalkInput {
  weightKg: number
  minutes: number
  /** Miles per hour; 3.0 if unknown. */
  mph?: number | null
  /** Average uphill grade, %. */
  gradePct?: number | null
  packKg?: number | null
  terrain?: Terrain
}

export function walkBurn(w: WalkInput): { gross: number; net: number } {
  const mph = Math.min(4.5, Math.max(1, w.mph ?? 3))
  const s = (mph * M_PER_MI) / 60
  const g = Math.max(0, (w.gradePct ?? 0) / 100)
  const move = (0.1 * s + 1.8 * s * g) * TERRAIN[w.terrain ?? 'paved'].factor
  const massKg = w.weightKg + Math.max(0, w.packKg ?? 0)
  const kcalPerMin = (vo2: number) => ((vo2 * massKg) / 1000) * 5
  return { gross: kcalPerMin(3.5 + move) * w.minutes, net: kcalPerMin(move) * w.minutes }
}

export const STRENGTH_METS = 3.5

export function strengthBurn(weightKg: number, minutes: number): { gross: number; net: number } {
  const perMin = (mets: number) => (mets * 3.5 * weightKg) / 200
  return { gross: perMin(STRENGTH_METS) * minutes, net: perMin(STRENGTH_METS - 1) * minutes }
}

export interface ActivityLine {
  label: string
  minutes: number
  net: number
}

/** Activity logged on a day: walks from the Yellowstone plan and finished workouts. */
export function dayActivity(date: string, weightKg: number, logs: ProgramLog[], workouts: Workout[]): ActivityLine[] {
  const lines: ActivityLine[] = []
  for (const l of logs) {
    if (l.date !== date || !l.walkMin || l.status === 'skipped') continue
    const mph = l.distanceM ? l.distanceM / M_PER_MI / (l.walkMin / 60) : null
    const grade = l.inclinePct ?? (l.elevationFt && l.distanceM ? ((l.elevationFt * 0.3048) / l.distanceM) * 100 : null)
    const net = walkBurn({ weightKg, minutes: l.walkMin, mph, gradePct: grade, packKg: l.packLb ? l.packLb * KG_PER_LB : 0, terrain: l.session === 'easyOutdoor' ? 'trail' : 'paved' }).net
    lines.push({ label: l.kind === 'walk' ? 'Walk' : l.session === 'easyOutdoor' ? 'Easy outdoor walk' : 'Walk and hills', minutes: l.walkMin, net })
  }
  for (const w of workouts) {
    if (w.date !== date || !w.endedAt) continue
    const minutes = Math.min(180, (w.endedAt - w.startedAt) / 60000)
    if (minutes < 5) continue
    lines.push({ label: w.name || 'Workout', minutes, net: strengthBurn(weightKg, minutes).net })
  }
  return lines
}

/* ── Fueling a long walk or hike ───────────────────────────────────── */

export interface FuelPlan {
  hours: number
  net: number
  /** Carbs to eat per hour while moving, as a range in g. */
  carbsPerHour: [number, number]
  /** Water per hour in ml, as a range. */
  waterPerHour: [number, number]
  salty: boolean
  /** Extra food to add on the day, as a calorie range. */
  eatBack: [number, number]
  notes: string[]
}

/**
 * Sports-nutrition guidance (ACSM/Academy of Nutrition and Dietetics/Dietitians of Canada 2016):
 * no fuel needed under an hour; 30–60 g of carbs an hour beyond that; fluids to limit losses to
 * under 2% of body weight, about 0.4–0.8 L an hour for most hikers, more in heat; sodium on long or
 * sweaty days. Activity estimates run high and your calorie goal already covers normal activity,
 * so on a weight-loss plan the suggestion is to eat back about half of a big day's extra burn.
 */
export function fuelPlan(hours: number, net: number, hot: boolean, losingWeight: boolean): FuelPlan {
  const notes: string[] = []
  let carbs: [number, number] = [0, 0]
  if (hours > 2.5) carbs = [30, 60]
  else if (hours > 1) carbs = [20, 30]
  const water: [number, number] = hot ? [600, 1000] : [400, 750]
  const salty = hours >= 3 || (hot && hours >= 1.5)
  const share = losingWeight ? [0.4, 0.6] : [0.8, 1]
  const eatBack: [number, number] = hours < 1 ? [0, 0] : [Math.round((net * share[0]) / 50) * 50, Math.round((net * share[1]) / 50) * 50]
  if (hours < 1) notes.push('Under an hour: water is enough. Eat your normal meals around it.')
  else notes.push('Eat a little every hour instead of one big stop. Small, frequent snacks keep energy steady.')
  if (hours >= 2) notes.push('Have a meal with carbs and some protein 2–3 hours before you start, or a small snack 30–60 minutes before.')
  if (salty) notes.push('Bring salty snacks (pretzels, salted nuts) or an electrolyte mix. Sweat costs sodium, and plain water alone on long hot days can leave you queasy or crampy.')
  notes.push('Afterward, have a meal with 20–40 g of protein plus carbs within a couple of hours. It refills your muscles for tomorrow.')
  if (losingWeight && hours >= 1) notes.push('Your daily calorie goal already includes everyday activity, and burn estimates run high. On big days, eat back about half of the extra so you stay fueled and still lose.')
  return { hours, net, carbsPerHour: carbs, waterPerHour: water, salty, eatBack, notes }
}
