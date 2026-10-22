import type { Fast } from '../db/types'
import { dateKey } from './dates'

export const FAST_PRESETS = [
  { hours: 13, label: '13h', name: 'Circadian' },
  { hours: 16, label: '16:8', name: 'Lean gains' },
  { hours: 18, label: '18:6', name: '' },
  { hours: 20, label: '20:4', name: 'Warrior' },
  { hours: 24, label: '24h', name: 'OMAD' },
  { hours: 36, label: '36h', name: 'Extended' },
]

/**
 * Rough phases since your last meal. Timing varies a lot between people
 * (activity, the last meal, metabolic health), so the app labels them as approximate.
 */
export const FAST_STAGES = [
  { from: 0, title: 'Digesting', text: 'Blood sugar and insulin rise as your body uses and stores energy from your last meal.' },
  { from: 4, title: 'Post-absorptive', text: 'Insulin falls back toward baseline; your liver starts releasing stored glycogen to keep blood sugar steady.' },
  { from: 12, title: 'Fat burning ramps up', text: 'Liver glycogen runs lower and your body relies more on fat; ketone levels begin to rise.' },
  { from: 18, title: 'Ketosis building', text: 'Ketones keep rising and become a bigger share of your fuel.' },
  { from: 24, title: 'Extended fast', text: 'Glycogen is largely used up. Drink water and consider electrolytes (sodium, potassium, magnesium).' },
  { from: 48, title: 'Prolonged fast', text: 'Fasts this long are best done with medical supervision, especially with medications or health conditions.' },
]

export function fastStage(hours: number) {
  let stage = FAST_STAGES[0]
  for (const s of FAST_STAGES) if (hours >= s.from) stage = s
  return stage
}

export const fastHours = (f: Fast, now = Date.now()) => ((f.end ?? now) - f.start) / 3_600_000

export interface FastStats {
  completed: number
  averageHours: number
  longestHours: number
  /** Consecutive days (ending today or yesterday) with a fast that reached its goal. */
  streak: number
}

export function fastStats(fasts: Fast[], now = Date.now()): FastStats {
  const done = fasts.filter((f) => f.end != null)
  const hours = done.map((f) => fastHours(f))
  const goalDays = new Set(done.filter((f) => fastHours(f) >= f.goalHours).map((f) => dateKey(f.end!)))
  let streak = 0
  const day = new Date(now)
  if (!goalDays.has(dateKey(day))) day.setDate(day.getDate() - 1)
  while (goalDays.has(dateKey(day))) {
    streak++
    day.setDate(day.getDate() - 1)
  }
  return {
    completed: done.length,
    averageHours: hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : 0,
    longestHours: hours.length ? Math.max(...hours) : 0,
    streak,
  }
}
