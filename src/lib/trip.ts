import type { SkillMark, Workout } from '../db/types'
import { addDays, dateKey, daysBetween, parseDateKey } from './dates'
import { M_PER_MI } from './units'

/**
 * A hiking-trip training plan: weekly long walks that grow by about 10% a
 * week, with an easier week every fourth week, then a peak block of
 * back-to-back days with a daypack, then a short taper before the trip.
 */
export type Phase = 'base' | 'build' | 'peak' | 'taper'

export const PHASE_INFO: Record<Phase, { name: string; text: string }> = {
  base: { name: 'Base', text: 'Easy, regular walks to build the habit and toughen up your feet.' },
  build: { name: 'Build', text: 'Longer weekend walks, hills or stairs once a week, and your daypack on.' },
  peak: { name: 'Peak', text: 'Trip rehearsal: back-to-back long days with a 10–15 lb pack and real climbs.' },
  taper: { name: 'Taper', text: 'Ease off so you arrive fresh. Short walks, stretching and lots of sleep.' },
}

export interface PlanWeek {
  index: number
  monday: string
  phase: Phase
  /** Easier week to let your body catch up. */
  recovery: boolean
  longMi: number
  /** Second long day (peak block): walk this the day after the long walk. */
  backToBackMi: number
  walks: number
  /** Minutes for each shorter weekday walk. */
  easyMin: number
  strength: number
  hills: boolean
  packLb: number
}

/** Walking, hiking and other on-your-feet cardio that counts toward the plan. */
export const TRAIL_IDS = ['walk', 'hike', 'ruck-walk', 'incline-walk', 'jog', 'run', 'stair-climber']

const round = (x: number, step = 0.5) => Math.round(x / step) * step

export function mondayKey(key: string): string {
  return addDays(key, -((parseDateKey(key).getDay() + 6) % 7))
}

/** Full training weeks between this Monday and the trip. */
export function weeksUntil(tripDate: string, today = dateKey()): number {
  return Math.max(0, Math.floor(daysBetween(mondayKey(today), tripDate) / 7))
}

export function buildPlan(tripDate: string, startLongMi: number, today = dateKey(), peakLongMi = 10): PlanWeek[] {
  const total = weeksUntil(tripDate, today)
  if (total <= 0) return []
  const taper = total >= 12 ? 2 : total >= 4 ? 1 : 0
  const peak = Math.min(4, Math.max(0, total - taper - 2))
  const growth = total - taper - peak
  const base = Math.max(1, Math.round(growth * 0.35))
  const weeks: PlanWeek[] = []
  let long = Math.max(1, startLongMi)
  let lastHard = long
  for (let i = 0; i < total; i++) {
    const phase: Phase = i >= total - taper ? 'taper' : i >= growth ? 'peak' : i < base ? 'base' : 'build'
    const recovery = phase !== 'taper' && phase !== 'peak' && (i + 1) % 4 === 0
    if (phase === 'taper') long = lastHard * (i === total - 1 ? 0.4 : 0.6)
    else if (phase === 'peak') long = Math.min(peakLongMi, Math.max(lastHard, lastHard * 1.1))
    else if (recovery) long = lastHard * 0.8
    else long = Math.min(peakLongMi * 0.85, i === 0 ? long : lastHard * 1.1)
    if (!recovery && phase !== 'taper') lastHard = long
    weeks.push({
      index: i,
      monday: addDays(mondayKey(today), i * 7),
      phase,
      recovery,
      longMi: round(long),
      backToBackMi: phase === 'peak' ? round(long * 0.65) : 0,
      walks: phase === 'base' ? 3 : phase === 'taper' ? 2 : 4,
      easyMin: phase === 'base' ? 30 : phase === 'taper' ? 25 : recovery ? 35 : 45,
      strength: phase === 'taper' ? 1 : 2,
      hills: phase === 'build' || phase === 'peak',
      packLb: phase === 'peak' ? 15 : phase === 'build' ? (i - base < (growth - base) / 2 ? 5 : 10) : 0,
    })
  }
  return weeks
}

/** One on-your-feet session: when, how far and how long. */
export interface TrailSession {
  date: string
  miles: number
  minutes: number
}

export function trailSessions(workouts: Workout[]): TrailSession[] {
  const out: TrailSession[] = []
  for (const w of workouts) {
    if (w.endedAt == null) continue
    let m = 0
    let sec = 0
    for (const e of w.entries)
      if (TRAIL_IDS.includes(e.exerciseId))
        for (const s of e.sets)
          if (s.done) {
            m += s.distanceM ?? 0
            sec += s.durationSec ?? 0
          }
    if (m > 0 || sec > 0) out.push({ date: w.date, miles: m / M_PER_MI, minutes: sec / 60 })
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

export function weekStats(sessions: TrailSession[], monday: string) {
  const week = sessions.filter((s) => s.date >= monday && s.date <= addDays(monday, 6))
  return {
    walks: new Set(week.map((s) => s.date)).size,
    miles: week.reduce((n, s) => n + s.miles, 0),
    minutes: week.reduce((n, s) => n + s.minutes, 0),
    longest: Math.max(0, ...week.map((s) => s.miles)),
  }
}

/* ── Stepping stones ──────────────────────────────────────────────── */

export interface Stone {
  id: string
  title: string
  text: string
  /** Checked automatically from your logged walks; otherwise you tick it yourself. */
  auto?: (sessions: TrailSession[]) => boolean
}

const longest = (s: TrailSession[]) => Math.max(0, ...s.map((x) => x.miles))
const backToBack = (s: TrailSession[], mi: number) => {
  const days = new Set(s.filter((x) => x.miles >= mi).map((x) => x.date))
  return [...days].some((d) => days.has(addDays(d, 1)))
}
const bestWeek = (s: TrailSession[], mi: number) =>
  s.some((x) => new Set(s.filter((y) => y.miles >= mi && y.date >= x.date && y.date <= addDays(x.date, 6)).map((y) => y.date)).size >= 3)

export const STONES: Stone[] = [
  { id: 'walk30', title: 'Walk 30 minutes without stopping', text: 'At any pace. This is where it starts.', auto: (s) => s.some((x) => x.minutes >= 30) },
  { id: 'week3', title: 'Walk on 3 days in one week', text: 'Consistency matters more than any single big day.', auto: (s) => s.some((x) => new Set(s.filter((y) => y.date >= x.date && y.date <= addDays(x.date, 6)).map((y) => y.date)).size >= 3) },
  { id: 'mi3', title: 'Walk 3 miles in one go', text: 'Like Old Faithful to Morning Glory Pool and back.', auto: (s) => longest(s) >= 3 },
  { id: 'mi5', title: 'Walk 5 miles', text: 'Most popular Yellowstone day hikes are 3–7 miles.', auto: (s) => longest(s) >= 5 },
  { id: 'hill500', title: 'Climb 500 ft in one walk', text: 'Hills, a stair climber or stadium steps all count. Uncle Tom’s Trail alone is 328 steps.' },
  { id: 'pack6', title: '6 miles with a 10 lb daypack', text: 'Wear the boots and pack you’ll take on the trip.' },
  { id: 'mi8', title: 'Walk 8 miles', text: 'You can now do almost any day hike in the park.', auto: (s) => longest(s) >= 8 },
  { id: 'b2b6', title: 'Back-to-back: 6 miles two days in a row', text: 'Proof you can recover overnight and go again.', auto: (s) => backToBack(s, 6) },
  { id: 'climb1500', title: '10 miles with 1,500 ft of climbing and a 15 lb pack', text: 'Like Mount Washburn (6.2 mi, about 1,400 ft) with miles to spare.' },
  { id: 'tripweek', title: 'Trip-ready week: three 5-mile days in 7 days', text: 'A rehearsal of your week in the park.', auto: (s) => bestWeek(s, 5) },
]

export function stoneDone(stone: Stone, sessions: TrailSession[], marks: SkillMark[]): boolean {
  return (stone.auto?.(sessions) ?? false) || marks.some((m) => m.id === `trip:${stone.id}`)
}

/* ── Weight ───────────────────────────────────────────────────────── */

export interface WeightPlan {
  weeks: number
  /** Loss needed per week to reach the goal by the trip. */
  neededKgPerWeek: number
  /** What we plan for: at most about 0.75% of body weight a week. */
  planKgPerWeek: number
  /** Where that pace gets you by the trip. */
  byTripKg: number
  tooFast: boolean
  /** Daily calories to aim for, when maintenance is known. */
  kcal: number | null
  checkpoints: { date: string; kg: number }[]
}

/** Safe, steady loss: 0.5–1% of body weight a week is the usual guidance; we plan for 0.75% at most. */
export function weightPlan(currentKg: number, goalKg: number, tripDate: string, maintenance: number | null, sex: 'male' | 'female', today = dateKey()): WeightPlan {
  const weeks = Math.max(1, daysBetween(today, tripDate) / 7)
  const toLose = Math.max(0, currentKg - goalKg)
  const needed = toLose / weeks
  const cap = currentKg * 0.0075
  const plan = Math.min(needed, cap)
  // ~7,700 kcal per kg of fat; never below the usual minimums.
  const kcal = maintenance ? Math.max(sex === 'female' ? 1200 : 1500, Math.round((maintenance - (plan * 7700) / 7) / 10) * 10) : null
  const checkpoints: { date: string; kg: number }[] = []
  for (let d = 28; d < daysBetween(today, tripDate); d += 28) checkpoints.push({ date: addDays(today, d), kg: Math.max(goalKg, currentKg - (plan * d) / 7) })
  return { weeks, neededKgPerWeek: needed, planKgPerWeek: plan, byTripKg: Math.max(goalKg, currentKg - plan * weeks), tooFast: needed > currentKg * 0.01, kcal, checkpoints }
}
