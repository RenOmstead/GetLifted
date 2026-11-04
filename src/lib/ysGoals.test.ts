import { describe, expect, it } from 'vitest'
import type { ProgramLog, Workout } from '../db/types'
import { derive, ridingStone, STONES, stoneProgress } from './ysGoals'
import { KG_PER_LB } from './units'

const START = '2026-11-02'
const walk = (date: string, walkMin: number, extra: Partial<ProgramLog> = {}): ProgramLog => ({ date, kind: 'session', session: 'walkHills', status: 'done', walkMin, ...extra })
const stone = (id: string) => STONES.find((s) => s.id === id)!
const base = { workouts: [] as Workout[], weights: [], startDate: START, ridingTargetKg: null, goalWalkMin: 180 }

describe('Yellowstone stepping stones', () => {
  it('ticks walking stones off from check-ins and extra walks', () => {
    const d = derive({ ...base, logs: [walk('2026-11-03', 22), { date: '2026-11-04', kind: 'walk', walkMin: 31 }] })
    expect(stoneProgress(stone('walk20'), d, new Set()).done).toBe(true)
    expect(stoneProgress(stone('walk30'), d, new Set()).done).toBe(true)
    expect(stoneProgress(stone('walk45'), d, new Set()).label).toBe('31 / 45 min')
  })

  it('counts walks inside workouts, back-to-back days and incline', () => {
    const w: Workout = { id: 1, date: '2026-11-07', name: 'Yellowstone', startedAt: 0, endedAt: 1, entries: [{ id: 'e', exerciseId: 'walk', sets: [{ id: 's', done: true, durationSec: 50 * 60 }] }] }
    const d = derive({ ...base, workouts: [w], logs: [walk('2026-11-06', 48, { inclinePct: 5 })] })
    expect(d.backToBack).toBe(48)
    expect(stoneProgress(stone('b2b45'), d, new Set()).done).toBe(true)
    expect(d.bestInclineMin(5)).toBe(48)
  })

  it('tracks weight from the 7-day average, with no dates attached', () => {
    const weights = [
      { date: '2026-11-01', kg: 250 * KG_PER_LB, createdAt: 0 },
      { date: '2026-12-20', kg: 244 * KG_PER_LB, createdAt: 0 },
    ]
    const d = derive({ ...base, logs: [], weights })
    expect(stoneProgress(stone('lb5'), d, new Set()).done).toBe(true)
    expect(stoneProgress(ridingStone(230 * KG_PER_LB), d, new Set()).done).toBe(false)
  })

  it('lets you tick manual stones yourself', () => {
    const d = derive({ ...base, logs: [] })
    expect(stoneProgress(stone('stepdowns'), d, new Set(['stepdowns'])).done).toBe(true)
  })
})
