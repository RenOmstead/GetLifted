import type { ProgramLog, WeightEntry, WeightGoals, Workout } from '../db/types'
import { addDays } from './dates'
import { KG_PER_LB } from './units'
import { weightTrend } from './yellowstone'

/**
 * Goals and stepping stones for the Yellowstone program. Stones tick
 * themselves off from your check-ins, workouts, weigh-ins and progress
 * checks; a few you tick yourself.
 */

export type Track = 'walk' | 'hills' | 'strength' | 'balance' | 'weight'

export const TRACKS: Record<Track, { name: string; icon: string }> = {
  walk: { name: 'Walking endurance', icon: '🚶' },
  hills: { name: 'Hills & downhill', icon: '⛰' },
  strength: { name: 'Strength', icon: '💪' },
  balance: { name: 'Balance & riding', icon: '🌿' },
  weight: { name: 'Weight', icon: '✦' },
}

export interface WalkRecord {
  date: string
  min: number
  inclinePct: number
  elevationFt: number
  packLb: number
}

const WALK_IDS = ['walk', 'hike', 'ruck-walk', 'incline-walk', 'stair-climber']

/** Every walk from check-ins and from finished workouts (one record per day per source, longest kept). */
export function walkRecords(logs: ProgramLog[], workouts: Workout[]): WalkRecord[] {
  const out: WalkRecord[] = []
  for (const l of logs)
    if ((l.kind === 'session' || l.kind === 'walk') && l.status !== 'skipped' && (l.walkMin ?? 0) > 0)
      out.push({ date: l.date, min: l.walkMin ?? 0, inclinePct: l.inclinePct ?? 0, elevationFt: l.elevationFt ?? 0, packLb: l.packLb ?? 0 })
  for (const w of workouts) {
    if (w.endedAt == null) continue
    for (const e of w.entries) {
      if (!WALK_IDS.includes(e.exerciseId)) continue
      const sec = e.sets.filter((s) => s.done).reduce((n, s) => n + (s.durationSec ?? 0), 0)
      if (sec > 0) out.push({ date: w.date, min: sec / 60, inclinePct: 0, elevationFt: 0, packLb: 0 })
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

export interface GoalContext {
  logs: ProgramLog[]
  workouts: Workout[]
  weights: WeightEntry[]
  startDate: string
  /** Riding target in kg, if you want the riding goal. */
  ridingTargetKg: number | null
  /** Where the trip-endurance goal sits, in minutes of walking in one day. */
  goalWalkMin: number
}

export interface Stone {
  id: string
  track: Track
  title: string
  hint: string
  /** Progress 0–1 toward the stone, when it can be measured. */
  measure?: (c: Derived) => { value: number; target: number; unit: string }
  /** For stones you tick yourself. */
  manual?: boolean
}

export interface Derived {
  walks: WalkRecord[]
  longestWalk: number
  /** Longest pair of walks on consecutive days: the shorter of the two. */
  backToBack: number
  bestInclineMin: (pct: number) => number
  bestElevation: number
  bestPackMin: (lb: number) => number
  strengthSessions: number
  bestWeightLb: (id: string, minReps: number) => number
  checks: ProgramLog[]
  bestCheck: (k: 'sitToStand30s' | 'balanceSec' | 'comfortableWalkMin') => number
  lostLb: number
  nowKg: number | null
  /** 7-day average when the program started. */
  startKg: number | null
  weeksWith3Walks: number
}

export function derive(c: GoalContext): Derived {
  const walks = walkRecords(c.logs, c.workouts).filter((w) => w.date >= c.startDate)
  const perDay = new Map<string, WalkRecord>()
  for (const w of walks) perDay.set(w.date, (perDay.get(w.date)?.min ?? 0) >= w.min ? perDay.get(w.date)! : w)
  let backToBack = 0
  for (const [d, w] of perDay) {
    const next = perDay.get(addDays(d, 1))
    if (next) backToBack = Math.max(backToBack, Math.min(w.min, next.min))
  }
  const sets = c.workouts
    .filter((w) => w.endedAt != null && w.date >= c.startDate)
    .flatMap((w) => w.entries.flatMap((e) => e.sets.filter((s) => s.done).map((s) => ({ ...s, id: e.exerciseId }))))
  const strengthSessions = c.logs.filter((l) => l.kind === 'session' && l.status !== 'skipped' && (l.session === 'strengthA' || l.session === 'strengthB')).length
  const checks = c.logs.filter((l) => l.kind === 'check')
  const trend = weightTrend(c.weights)
  const start = weightTrend(c.weights.filter((w) => w.date >= addDays(c.startDate, -7)))[0]?.avgKg
  const nowKg = trend.at(-1)?.avgKg ?? null
  const weeks = new Map<string, Set<string>>()
  for (const w of walks) {
    const d = new Date(`${w.date}T12:00:00`)
    const monday = addDays(w.date, -((d.getDay() + 6) % 7))
    weeks.set(monday, (weeks.get(monday) ?? new Set()).add(w.date))
  }
  return {
    walks,
    longestWalk: Math.max(0, ...walks.map((w) => w.min)),
    backToBack,
    bestInclineMin: (pct) => Math.max(0, ...walks.filter((w) => w.inclinePct >= pct).map((w) => w.min)),
    bestElevation: Math.max(0, ...walks.map((w) => w.elevationFt)),
    bestPackMin: (lb) => Math.max(0, ...walks.filter((w) => w.packLb >= lb).map((w) => w.min)),
    strengthSessions,
    bestWeightLb: (id, minReps) => Math.max(0, ...sets.filter((s) => s.id === id && (s.reps ?? 0) >= minReps).map((s) => (s.weightKg ?? 0) / KG_PER_LB)),
    checks,
    bestCheck: (k) => Math.max(0, ...checks.map((x) => x[k] ?? 0)),
    lostLb: start != null && nowKg != null ? Math.max(0, (start - nowKg) / KG_PER_LB) : 0,
    nowKg,
    startKg: start ?? null,
    weeksWith3Walks: [...weeks.values()].filter((s) => s.size >= 3).length,
  }
}

const walkStone = (min: number, hint: string): Stone => ({
  id: `walk${min}`,
  track: 'walk',
  title: min < 60 ? `Walk ${min} minutes without stopping` : `Walk ${min / 60 === Math.round(min / 60) ? `${min / 60} hour${min > 60 ? 's' : ''}` : `${Math.floor(min / 60)} h ${min % 60} min`}`,
  hint,
  measure: (d) => ({ value: d.longestWalk, target: min, unit: 'min' }),
})

export const STONES: Stone[] = [
  walkStone(20, 'Your first step past where you started.'),
  { id: 'week3', track: 'walk', title: 'Walk on 3 days in one week', hint: 'Steady habits beat big days.', measure: (d) => ({ value: Math.min(1, d.weeksWith3Walks), target: 1, unit: 'week' }) },
  walkStone(30, 'Half an hour: a lovely loop around a geyser basin.'),
  walkStone(45, 'Long enough for most boardwalk trails.'),
  { id: 'habit4', track: 'walk', title: '4 weeks with 3+ walks each', hint: 'A real habit now.', measure: (d) => ({ value: d.weeksWith3Walks, target: 4, unit: 'weeks' }) },
  walkStone(60, 'An hour on your feet, with breaks if you like.'),
  { id: 'b2b45', track: 'walk', title: '45 minutes on two days in a row', hint: 'Practice for back-to-back trip days.', measure: (d) => ({ value: d.backToBack, target: 45, unit: 'min' }) },
  walkStone(90, 'A big sightseeing morning.'),
  walkStone(120, 'Two hours: most Yellowstone day trails are within reach.'),
  { id: 'b2b90', track: 'walk', title: '90 minutes, then 60 the next day', hint: 'The real rehearsal.', measure: (d) => ({ value: d.backToBack, target: 60, unit: 'min' }) },
  walkStone(180, 'Your trip goal: 3 hours with breaks.'),

  { id: 'incline3', track: 'hills', title: 'First incline walk (3% or more)', hint: 'Log the incline in your check-in.', measure: (d) => ({ value: d.bestInclineMin(3), target: 10, unit: 'min' }) },
  { id: 'incline5', track: 'hills', title: '20 minutes at 5% incline', hint: 'Talking pace, alternating with flat is fine.', measure: (d) => ({ value: d.bestInclineMin(5), target: 20, unit: 'min' }) },
  { id: 'stepdowns', track: 'hills', title: '3 sets of step-downs with no knee pain', hint: 'Controlled downhill strength.', manual: true },
  { id: 'incline8', track: 'hills', title: '30 minutes at 8% incline', hint: 'Like a steady trail climb.', measure: (d) => ({ value: d.bestInclineMin(8), target: 30, unit: 'min' }) },
  { id: 'elev500', track: 'hills', title: 'Climb 500 ft in one walk', hint: 'Outdoor hills or stairs; log the elevation gain.', measure: (d) => ({ value: d.bestElevation, target: 500, unit: 'ft' }) },
  { id: 'pack60', track: 'hills', title: '60 minutes with a 5 lb daypack', hint: 'Wear the pack you’ll bring.', measure: (d) => ({ value: d.bestPackMin(5), target: 60, unit: 'min' }) },
  { id: 'elev1000', track: 'hills', title: 'Climb 1,000 ft in one walk', hint: 'A real trail day.', measure: (d) => ({ value: d.bestElevation, target: 1000, unit: 'ft' }) },
  { id: 'pack90', track: 'hills', title: '90 minutes with a 10 lb daypack', hint: 'Water, snacks and layers: trip-ready.', measure: (d) => ({ value: d.bestPackMin(10), target: 90, unit: 'min' }) },

  { id: 'str4', track: 'strength', title: 'Finish 4 strength sessions', hint: 'Short versions count.', measure: (d) => ({ value: d.strengthSessions, target: 4, unit: 'sessions' }) },
  { id: 'sts12', track: 'strength', title: '12 sit-to-stands in 30 seconds', hint: 'From your progress checks, at a steady pace.', measure: (d) => ({ value: d.bestCheck('sitToStand30s'), target: 12, unit: 'reps' }) },
  { id: 'goblet20', track: 'strength', title: 'Goblet squat 20 lb for 10 reps', hint: 'Log it in a Strength A workout.', measure: (d) => ({ value: d.bestWeightLb('goblet-squat', 10), target: 20, unit: 'lb' }) },
  { id: 'str16', track: 'strength', title: 'Finish 16 strength sessions', hint: 'Two months of showing up.', measure: (d) => ({ value: d.strengthSessions, target: 16, unit: 'sessions' }) },
  { id: 'kb35', track: 'strength', title: 'Kettlebell deadlift 35 lb for 10 reps', hint: 'Strong hips for climbs and mounting a horse.', measure: (d) => ({ value: d.bestWeightLb('kb-deadlift', 10), target: 35, unit: 'lb' }) },
  { id: 'carry25', track: 'strength', title: 'Suitcase carry 25 lb, 30 steps each side', hint: 'Carrying a daypack and bags with ease.', measure: (d) => ({ value: d.bestWeightLb('suitcase-carry', 30), target: 25, unit: 'lb' }) },
  { id: 'sts15', track: 'strength', title: '15 sit-to-stands in 30 seconds', hint: 'Strong, steady legs.', measure: (d) => ({ value: d.bestCheck('sitToStand30s'), target: 15, unit: 'reps' }) },
  { id: 'goblet35', track: 'strength', title: 'Goblet squat 35 lb for 10 reps', hint: 'Stairs and steps feel easier.', measure: (d) => ({ value: d.bestWeightLb('goblet-squat', 10), target: 35, unit: 'lb' }) },

  { id: 'bal10', track: 'balance', title: 'Balance on one leg for 10 seconds', hint: 'Your less steady leg, next to a counter.', measure: (d) => ({ value: d.bestCheck('balanceSec'), target: 10, unit: 's' }) },
  { id: 'hips', track: 'balance', title: 'Sit in a butterfly stretch comfortably for 45 seconds', hint: 'Inner-thigh comfort for the saddle.', manual: true },
  { id: 'bal20', track: 'balance', title: 'Balance on one leg for 20 seconds', hint: 'Uneven trail ground feels steadier.', measure: (d) => ({ value: d.bestCheck('balanceSec'), target: 20, unit: 's' }) },
  { id: 'mount', track: 'balance', title: 'Step up onto a 12″ box with no hands', hint: 'Like the step to mount a horse.', manual: true },
  { id: 'bal30', track: 'balance', title: 'Balance on one leg for 30 seconds', hint: 'Steady as a heron.', measure: (d) => ({ value: d.bestCheck('balanceSec'), target: 30, unit: 's' }) },

]

const WEIGHT_HINTS = ['No deadline. The 7-day average counts, not one weigh-in.', 'Walks start to feel lighter.', 'Steady wins.', 'A big, real change.', 'Look how far you’ve come.']

/**
 * Weight stepping stones built from your answers: a stone every few pounds
 * (if you asked for them) and your main goal, if you chose a number. Nothing
 * here if weight isn't a focus right now.
 */
export function weightStones(w: WeightGoals | undefined, ridingKg: number | null, startKg: number | null): Stone[] {
  if (!w || w.focus === 'not-now') return []
  const finalKg = w.aim === 'number' ? w.targetKg : w.aim === 'riding' ? ridingKg : null
  const totalLb = finalKg != null && startKg != null ? (startKg - finalKg) / KG_PER_LB : null
  const out: Stone[] = []
  if (w.milestoneLb > 0)
    for (let k = 1; k <= 12; k++) {
      const lb = k * w.milestoneLb
      if (totalLb != null ? lb >= totalLb : lb > 20) break
      out.push({
        id: `lb${lb}`,
        track: 'weight',
        title: k === 1 ? `First ${lb} lb (7-day average)` : `${lb} lb down`,
        hint: WEIGHT_HINTS[Math.min(k - 1, WEIGHT_HINTS.length - 1)],
        measure: (d) => ({ value: d.lostLb, target: lb, unit: 'lb' }),
      })
    }
  if (w.aim === 'number' && w.targetKg != null) {
    const target = w.targetKg
    out.push({
      id: 'goalweight',
      track: 'weight',
      title: `Reach ${Math.round(target / KG_PER_LB)} lb, your goal`,
      hint: 'Your own number. No deadline.',
      measure: (d) => ({ value: d.lostLb, target: d.startKg != null ? Math.max(0.1, (d.startKg - target) / KG_PER_LB) : 1, unit: 'lb' }),
    })
  }
  return out
}

export function stoneProgress(s: Stone, d: Derived, marks: Set<string>): { done: boolean; pct: number; label?: string } {
  if (s.manual) return { done: marks.has(s.id), pct: marks.has(s.id) ? 1 : 0 }
  const m = s.measure!(d)
  const pct = Math.min(1, m.target ? m.value / m.target : 0)
  const shown = m.unit === 'lb' || m.unit === 'min' ? Math.floor(m.value) : m.value
  return { done: pct >= 1, pct, label: m.unit ? `${shown} / ${m.target} ${m.unit}` : undefined }
}

/** The riding stone, built from your chosen target. */
export function ridingStone(targetKg: number): Stone {
  return {
    id: 'riding',
    track: 'weight',
    title: `Under ${Math.round(targetKg / KG_PER_LB)} lb (your riding target)`,
    hint: 'A comfortable margin under the operator’s limit. No deadline.',
    measure: (d) => ({ value: d.nowKg != null && d.nowKg <= targetKg ? 1 : 0, target: 1, unit: '' }),
  }
}
