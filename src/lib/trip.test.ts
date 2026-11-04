import { describe, expect, it } from 'vitest'
import type { Workout } from '../db/types'
import { buildPlan, STONES, stoneDone, trailSessions, weekStats, weightPlan, weeksUntil } from './trip'
import { M_PER_MI } from './units'

const TODAY = '2026-11-04'
const TRIP = '2027-07-12'

const walk = (date: string, miles: number, minutes: number): Workout => ({
  id: Math.random(),
  date,
  name: 'Walk',
  startedAt: 0,
  endedAt: 1,
  entries: [{ id: 'e', exerciseId: 'walk', sets: [{ id: 's', done: true, distanceM: miles * M_PER_MI, durationSec: minutes * 60 }] }],
})

describe('trip plan', () => {
  const plan = buildPlan(TRIP, 2, TODAY)

  it('fills every week to the trip, in phase order', () => {
    expect(plan.length).toBe(weeksUntil(TRIP, TODAY))
    const order = ['base', 'build', 'peak', 'taper']
    plan.forEach((w, i) => i && expect(order.indexOf(w.phase)).toBeGreaterThanOrEqual(order.indexOf(plan[i - 1].phase)))
    expect(plan.at(-1)!.phase).toBe('taper')
  })

  it('never grows the long walk by more than about 10% a week', () => {
    // Compared with the last full (non-recovery) week, since easy weeks dip on purpose.
    const hard = plan.filter((w) => !w.recovery && w.phase !== 'taper')
    for (let i = 1; i < hard.length; i++) expect(hard[i].longMi).toBeLessThanOrEqual(hard[i - 1].longMi * 1.1 + 0.5)
  })

  it('peaks at 10 miles with back-to-back days and a pack', () => {
    const peak = plan.filter((w) => w.phase === 'peak')
    expect(peak.length).toBe(4)
    expect(Math.max(...plan.map((w) => w.longMi))).toBe(10)
    expect(peak.every((w) => w.backToBackMi > 0 && w.packLb === 15)).toBe(true)
  })

  it('reads walks from workouts and checks stepping stones', () => {
    const s = trailSessions([walk('2026-11-02', 3.2, 65), walk('2026-11-03', 6, 120), walk('2026-11-04', 6.1, 125)])
    expect(weekStats(s, '2026-11-02')).toMatchObject({ walks: 3 })
    expect(stoneDone(STONES.find((x) => x.id === 'mi5')!, s, [])).toBe(true)
    expect(stoneDone(STONES.find((x) => x.id === 'b2b6')!, s, [])).toBe(true)
    expect(stoneDone(STONES.find((x) => x.id === 'mi8')!, s, [])).toBe(false)
  })
})

describe('weight plan', () => {
  it('caps loss at a safe pace and never plans below the calorie floor', () => {
    const p = weightPlan(90, 60, TRIP, 2000, 'female', TODAY)
    expect(p.planKgPerWeek).toBeCloseTo(0.675)
    expect(p.tooFast).toBe(false)
    expect(p.kcal).toBeGreaterThanOrEqual(1200)
    expect(weightPlan(90, 60, '2027-01-01', 2000, 'female', TODAY).tooFast).toBe(true)
  })
})
