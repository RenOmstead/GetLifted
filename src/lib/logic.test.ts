import { describe, expect, it } from 'vitest'
import { SKILL_BY_ID } from '../data/skills'
import type { SetEntry, Workout } from '../db/types'
import { addDays, dateKey, formatClock, formatDuration } from './dates'
import { fastHours, fastStage, fastStats } from './fasting'
import { parseDsldLabel, parseDsldSearch } from './dsld'
import { mealTotals, suggestGoals, tdee } from './nutrition'
import { parseOffProduct } from './off'
import { skillProgress } from './progression'
import { displayToKg, kgToDisplay } from './units'
import { e1rm, entriesFromRoutine, exerciseHistory, lastSets, personalRecords } from './workouts'

const set = (s: Partial<SetEntry>): SetEntry => ({ id: Math.random().toString(), done: true, ...s })
const workout = (id: number, day: string, entries: Workout['entries']): Workout => ({
  id,
  date: day,
  name: 'W',
  startedAt: new Date(`${day}T10:00:00`).getTime(),
  endedAt: new Date(`${day}T11:00:00`).getTime(),
  entries,
})

describe('dates and units', () => {
  it('formats durations and clocks', () => {
    expect(formatDuration(16 * 3_600_000 + 5 * 60_000)).toBe('16h 05m')
    expect(formatDuration(42 * 60_000)).toBe('42m')
    expect(formatClock(65_000)).toBe('01:05')
    expect(formatClock(3_725_000)).toBe('1:02:05')
  })
  it('adds days across month ends', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(dateKey(new Date(2026, 9, 22))).toBe('2026-10-22')
  })
  it('round-trips pounds', () => {
    expect(kgToDisplay(100, 'imperial')).toBeCloseTo(220.46, 2)
    expect(displayToKg(kgToDisplay(81.3, 'imperial'), 'imperial')).toBeCloseTo(81.3)
  })
})

describe('strength', () => {
  it('estimates 1RM with Epley', () => {
    expect(e1rm(100, 1)).toBe(100)
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 1)
    expect(e1rm(0, 5)).toBe(0)
  })

  const ws = [
    workout(1, '2026-10-01', [{ id: 'a', exerciseId: 'bench-press', sets: [set({ weightKg: 80, reps: 5 }), set({ weightKg: 80, reps: 4 })] }]),
    workout(2, '2026-10-05', [{ id: 'b', exerciseId: 'bench-press', sets: [set({ weightKg: 85, reps: 3 }), set({ weightKg: 90, reps: 1, done: false })] }]),
  ]

  it('builds history from completed sets only', () => {
    const h = exerciseHistory(ws, 'bench-press', 'weighted')
    expect(h).toHaveLength(2)
    expect(h[1].sets).toHaveLength(1)
    const pr = personalRecords(h, 'weighted')
    expect(pr.maxWeightKg).toBe(85)
    expect(pr.best).toBeCloseTo(e1rm(85, 3))
  })

  it('pre-fills routine weights from the last session', () => {
    expect(lastSets(ws, 'bench-press').map((s) => s.weightKg)).toEqual([85])
    const entries = entriesFromRoutine([{ exerciseId: 'bench-press', sets: 3, reps: 5 }], ws)
    expect(entries[0].sets).toHaveLength(3)
    expect(entries[0].sets.every((s) => s.weightKg === 85 && s.reps === 5 && !s.done)).toBe(true)
  })
})

describe('skill progression', () => {
  it('unlocks a level when the target is hit in one workout', () => {
    const skill = SKILL_BY_ID['pullup']
    const ws = [
      workout(1, '2026-10-01', [{ id: 'a', exerciseId: 'dead-hang', sets: [set({ durationSec: 30 }), set({ durationSec: 35 }), set({ durationSec: 31 })] }]),
      workout(2, '2026-10-03', [{ id: 'b', exerciseId: 'scap-pull', sets: [set({ reps: 10 }), set({ reps: 10 }), set({ reps: 8 })] }]),
    ]
    const p = skillProgress(skill, ws, [])
    expect(p.levels[0].achievedAt).not.toBeNull()
    expect(p.levels[1].achievedAt).toBeNull()
    expect(p.levels[1].bestQualifying).toBe(2)
    expect(p.levels[1].bestValue).toBe(10)
    expect(p.current).toBe(1)
  })

  it('honors manual marks', () => {
    const p = skillProgress(SKILL_BY_ID['planche'], [], [{ id: 'planche:2', skillId: 'planche', level: 2, achievedAt: 5 }])
    expect(p.current).toBe(3)
    expect(p.levels[2].manual).toBe(true)
  })
})

describe('fasting', () => {
  it('picks stages by hours', () => {
    expect(fastStage(2).title).toBe('Digesting')
    expect(fastStage(16).title).toBe('Fat burning ramps up')
    expect(fastStage(30).title).toBe('Extended fast')
  })
  it('computes stats and streaks', () => {
    const now = new Date('2026-10-22T12:00:00').getTime()
    const h = 3_600_000
    const fasts = [
      { id: 1, start: now - 26 * h - 16 * h, end: now - 26 * h, goalHours: 16 },
      { id: 2, start: now - 2 * h - 17 * h, end: now - 2 * h, goalHours: 16 },
      { id: 3, start: now - h, end: null, goalHours: 16 },
    ]
    const s = fastStats(fasts, now)
    expect(s.completed).toBe(2)
    expect(s.longestHours).toBeCloseTo(17)
    expect(s.streak).toBe(2)
    expect(fastHours(fasts[2], now)).toBeCloseTo(1)
  })
})

describe('nutrition', () => {
  it('totals meals by servings', () => {
    const t = mealTotals([
      { date: 'd', meal: 'lunch', servings: 2, createdAt: 0, food: { name: 'Egg', servingLabel: '1', servingGrams: 50, kcal: 72, protein: 6, carbs: 0, fat: 5, source: 'common', micros: { 'vitamin-d': 1 } } },
    ])
    expect(t.kcal).toBe(144)
    expect(t.micros['vitamin-d']).toBe(2)
  })
  it('suggests calorie and macro goals', () => {
    const maintenance = tdee('male', 80, 180, 30, 'moderate')
    expect(Math.round(maintenance)).toBe(2759)
    const g = suggestGoals(maintenance, 80, 'lose')
    expect(g.kcal).toBe(2210)
    expect(g.protein).toBe(160)
    expect(g.protein * 4 + g.fat * 9 + g.carbs * 4).toBeGreaterThan(g.kcal - 10)
  })
})

describe('Open Food Facts parsing', () => {
  it('scales per-100g values to a serving and converts micros from grams', () => {
    const food = parseOffProduct({
      code: '123',
      product_name: 'Greek Yogurt',
      brands: 'Fage, Other',
      serving_size: '170 g',
      serving_quantity: 170,
      nutriments: { 'energy-kcal_100g': 59, proteins_100g: 10, carbohydrates_100g: 3.6, fat_100g: 0.4, 'calcium_100g': 0.11, 'vitamin-d_100g': 0.000001 },
    })!
    expect(food.kcal).toBeCloseTo(100.3)
    expect(food.protein).toBeCloseTo(17)
    expect(food.brand).toBe('Fage')
    expect(food.micros!.calcium).toBeCloseTo(187)
    expect(food.micros!['vitamin-d']).toBeCloseTo(1.7)
  })
  it('falls back to 100 g and kJ', () => {
    const food = parseOffProduct({ product_name: 'Bar', nutriments: { energy_100g: 1674 } })!
    expect(food.servingLabel).toBe('100 g')
    expect(food.kcal).toBeCloseTo(400, 0)
  })
  it('skips products without a name or energy', () => {
    expect(parseOffProduct({ nutriments: {} })).toBeNull()
    expect(parseOffProduct({ product_name: 'X', nutriments: {} })).toBeNull()
  })
})

describe('NIH DSLD parsing', () => {
  it('parses search hits', () => {
    const hits = parseDsldSearch({ hits: [{ _id: '42', _source: { fullName: 'Vitamin D3 5000 IU', brandName: 'Acme', netContents: [{ display: '120 Softgel(s)' }], offMarket: 0 } }, { _id: '43', _source: {} }] })
    expect(hits).toEqual([{ id: '42', name: 'Vitamin D3 5000 IU', brand: 'Acme', netContents: '120 Softgel(s)', offMarket: false }])
  })
  it('flattens nested ingredient rows', () => {
    const label = parseDsldLabel(
      {
        id: 7,
        fullName: 'Fish Oil',
        brandName: 'Acme',
        servingSizes: [{ minQuantity: 2, unit: 'Softgel(s)' }],
        ingredientRows: [
          { name: 'Fish Oil', quantity: [{ quantity: 2000, unit: 'mg' }], nestedRows: [{ name: 'EPA', quantity: [{ quantity: 360, unit: 'mg' }] }, { name: 'DHA', quantity: [{ quantity: 240, unit: 'mg' }] }] },
          { name: 'Calories', quantity: [{ quantity: 20, unit: 'Calorie(s)' }] },
          { name: 'Vitamin E', quantity: [{ quantity: 0, unit: 'mg' }] },
        ],
      },
      '7',
    )!
    expect(label.servingLabel).toBe('2 Softgel(s)')
    expect(label.ingredients.map((i) => i.name)).toEqual(['Fish Oil', 'EPA', 'DHA', 'Calories'])
  })
})
