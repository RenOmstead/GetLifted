import { describe, expect, it } from 'vitest'
import { CHALLENGE_BY_ID } from '../data/challenges'
import { EXERCISES } from '../data/exercises'
import { STARTER_ROUTINES } from '../data/starterRoutines'
import type { Workout } from '../db/types'
import { lerpCloseup, type HandSide } from '../figures/closeup'
import { CLOSEUPS } from '../figures/closeupPoses'
import { closeupBounds } from '../figures/CloseupShape'
import { hitsArea } from './areas'
import { challengeEntries, dayText, dayValue, mobilitySeconds } from './gamify'

const byId = new Map(EXERCISES.map((e) => [e.id, e]))
const get = (id: string) => byId.get(id)!

const workout = (entries: [string, { reps?: number; durationSec?: number }[]][]): Workout => ({
  id: 1,
  date: '2026-11-04',
  name: 'w',
  startedAt: 0,
  endedAt: 1,
  entries: entries.map(([exerciseId, sets], i) => ({ id: `e${i}`, exerciseId, sets: sets.map((s, j) => ({ id: `s${i}${j}`, done: true, ...s })) })),
})

describe('wrist and foot exercises', () => {
  it('has plenty for each new area', () => {
    expect(EXERCISES.filter((e) => hitsArea(e.muscles, 'Wrists & hands')).length).toBeGreaterThanOrEqual(15)
    expect(EXERCISES.filter((e) => hitsArea(e.muscles, 'Feet & ankles')).length).toBeGreaterThanOrEqual(20)
  })

  it('gives every close-up figure an exercise and steps', () => {
    for (const id of Object.keys(CLOSEUPS)) {
      const e = EXERCISES.find((x) => x.figure === id)
      expect(e, id).toBeDefined()
      expect(e!.steps?.length, id).toBeGreaterThan(1)
    }
  })

  it('frames close-ups at the picture ratio', () => {
    for (const [id, def] of Object.entries(CLOSEUPS)) {
      const b = closeupBounds(def)
      expect(b.w / b.h, id).toBeCloseTo(1.2, 5)
      expect(Number.isFinite(b.x) && Number.isFinite(b.y), id).toBe(true)
    }
  })

  it('blends close-up poses', () => {
    const a = CLOSEUPS['wrist-flex-ext'].poses[0] as HandSide
    const b = CLOSEUPS['wrist-flex-ext'].poses[1] as HandSide
    const mid = lerpCloseup(a, b, 0.5) as HandSide
    expect(mid.palm).toBeCloseTo((a.palm + b.palm) / 2, 6)
    expect(mid.at).toEqual(a.at)
  })
})

describe('starter routines', () => {
  it('only use real exercises', () => {
    for (const r of STARTER_ROUTINES) for (const e of r.entries) expect(byId.has(e.exerciseId), `${r.name}: ${e.exerciseId}`).toBe(true)
  })
})

describe('area challenges', () => {
  const feet = CHALLENGE_BY_ID['happy-feet-14']

  it('count only work for that area, in any category', () => {
    const w = workout([
      ['toe-yoga', [{ reps: 10 }, { reps: 10 }]],
      ['tib-raise', [{ reps: 12 }]],
      ['kneeling-toe-stretch', [{ durationSec: 30 }]],
      ['pigeon', [{ durationSec: 60 }]],
    ])
    expect(mobilitySeconds([w], get, 'Feet & ankles')).toBe(30 + 30 + 30 + 30)
    expect(dayValue(feet, [w], get)).toBe(2)
    // Without an area, every mobility or stretch counts (but not the tibialis raise, a strength move).
    expect(mobilitySeconds([w], get)).toBe(30 + 30 + 30 + 60)
  })

  it('starts its own routine, repeated to fill the day', () => {
    const five = challengeEntries(feet, 5)
    expect(five.map((e) => e.exerciseId)).toEqual(STARTER_ROUTINES.find((r) => r.name === 'Happy Feet')!.entries.map((e) => e.exerciseId))
    const sec = (es: typeof five) => es.reduce((n, e) => n + e.sets * (e.durationSec ?? 30), 0)
    expect(sec(five)).toBeGreaterThanOrEqual(5 * 60)
    expect(sec(challengeEntries(feet, 10))).toBeGreaterThanOrEqual(10 * 60)
    expect(dayText(feet, 5)).toBe('5 minutes of feet & ankles work')
    expect(challengeEntries(CHALLENGE_BY_ID['wrist-ready-21'], 5)[0].exerciseId).toBe('wrist-circles')
  })
})
