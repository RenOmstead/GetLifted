import { describe, expect, it } from 'vitest'
import { CHALLENGE_BY_ID, CHALLENGES } from '../data/challenges'
import { EXERCISE_BY_ID } from '../data/exercises'
import { DEFAULT_SETTINGS } from '../db/settings'
import type { SetEntry, Workout } from '../db/types'
import { coachSuggestions, ladderText, repMaxTable, weightStepKg } from './coach'
import { addDays } from './dates'
import type { ExerciseInfo } from './exercises'
import { bestStreak, challengeStatus, currentStreak, dailyQuests, levelFromXp, totalXp } from './gamify'

const TODAY = '2026-10-23'
const get = (id: string): ExerciseInfo => EXERCISE_BY_ID[id] ?? { id, name: id, category: 'strength', track: 'weighted', muscles: [] }
const set = (s: Partial<SetEntry>): SetEntry => ({ id: Math.random().toString(36), done: true, ...s })
let nextId = 1
const workout = (date: string, entries: [string, Partial<SetEntry>[]][]): Workout => ({
  id: nextId++,
  date,
  name: 'W',
  startedAt: new Date(`${date}T09:00:00`).getTime(),
  endedAt: new Date(`${date}T10:00:00`).getTime(),
  entries: entries.map(([exerciseId, sets], i) => ({ id: `e${i}`, exerciseId, sets: sets.map(set) })),
})
const coach = (workouts: Workout[], extra: Partial<Parameters<typeof coachSuggestions>[0]> = {}) =>
  coachSuggestions({ workouts, marks: [], get, units: 'metric', bodyKg: null, today: TODAY, ...extra })

describe('coach', () => {
  it('suggests a full push-up after 10+ knee push-ups yesterday', () => {
    const s = coach([workout(addDays(TODAY, -1), [['knee-pushup', [{ reps: 12 }]]])])
    const ladder = s.find((x) => x.id === 'ladder-knee-pushup-pushup')!
    expect(ladder.title).toBe('Ready for Push-Up?')
    expect(ladder.detail).toContain('12 knee push-ups yesterday')
    expect(ladder.entry).toMatchObject({ exerciseId: 'pushup', sets: 3, reps: 2 })
  })

  it('skips a rung you have already climbed', () => {
    const s = coach([workout(addDays(TODAY, -1), [['knee-pushup', [{ reps: 12 }]], ['pushup', [{ reps: 3 }]]])])
    expect(s.find((x) => x.id === 'ladder-knee-pushup-pushup')).toBeUndefined()
  })

  it('ignores old sessions', () => {
    expect(coach([workout(addDays(TODAY, -30), [['knee-pushup', [{ reps: 20 }]]])]).some((x) => x.kind === 'ladder')).toBe(false)
  })

  it('uses body weight for lat pulldown → pull-up', () => {
    const w = [workout(addDays(TODAY, -2), [['lat-pulldown', [{ reps: 8, weightKg: 55 }]]])]
    expect(coach(w, { bodyKg: 60 }).some((x) => x.id === 'ladder-lat-pulldown-pullup')).toBe(true)
    expect(coach(w, { bodyKg: 70 }).some((x) => x.id === 'ladder-lat-pulldown-pullup')).toBe(false)
  })

  it('adds weight when every working set hits the target', () => {
    const w = [workout(addDays(TODAY, -1), [['bench-press', [{ reps: 8, weightKg: 60 }, { reps: 8, weightKg: 60 }, { reps: 9, weightKg: 60 }]]])]
    const s = coach(w).find((x) => x.kind === 'add-weight')!
    expect(s.entry).toMatchObject({ exerciseId: 'bench-press', sets: 3, reps: 8, weightKg: 62.5 })
    expect(coach(w, { routineReps: { 'bench-press': 10 } }).some((x) => x.kind === 'add-weight')).toBe(false)
  })

  it('steps legs up more than upper body', () => {
    expect(weightStepKg(get('back-squat'), 'metric')).toBe(5)
    expect(weightStepKg(get('bench-press'), 'imperial')).toBeCloseTo(2.268, 2)
  })

  it('celebrates a new skill level and points to the next', () => {
    const w = [workout(addDays(TODAY, -1), [['dead-hang', [{ durationSec: 30 }, { durationSec: 32 }, { durationSec: 31 }]]])]
    const s = coach(w)
    expect(s[0].kind).toBe('level-up')
    expect(s[0].entry?.exerciseId).toBe('scap-pull')
  })

  it('welcomes you back after a break, or helps you start', () => {
    expect(coach([workout(addDays(TODAY, -6), [['plank', [{ durationSec: 10 }]]])]).some((x) => x.kind === 'comeback')).toBe(true)
    expect(coach([])[0].kind).toBe('start')
  })

  it('writes exercise names naturally in sentences', () => {
    const l = { from: 'db-bench-press', reps: 10, to: 'bench-press', start: { sets: 3, reps: 8 } }
    const named = (id: string, name: string): ExerciseInfo => ({ ...get(id), name })
    const text = ladderText(l, (id) => (id === 'db-bench-press' ? named(id, 'Dumbbell Bench Press') : named(id, 'Romanian Deadlift')), 'metric', null)
    expect(text).toBe('If you can do 10 dumbbell bench presses, you can likely do a few Romanian deadlifts.')
  })

  it('estimates rep maxes', () => {
    const t = repMaxTable(100)
    expect(t[0]).toEqual({ reps: 1, weightKg: 100 })
    expect(t.find((r) => r.reps === 10)!.weightKg).toBeCloseTo(75)
  })
})

describe('gamify', () => {
  it('levels up on a growing curve', () => {
    expect(levelFromXp(0).level).toBe(1)
    expect(levelFromXp(249).level).toBe(1)
    expect(levelFromXp(250).level).toBe(2)
    expect(levelFromXp(750)).toEqual({ level: 3, levelStart: 750, nextLevel: 1500 })
  })

  it('counts streaks', () => {
    const days = new Set([addDays(TODAY, -1), addDays(TODAY, -2), addDays(TODAY, -3), addDays(TODAY, -10)])
    expect(currentStreak(days, TODAY)).toBe(3)
    expect(currentStreak(new Set([addDays(TODAY, -2)]), TODAY)).toBe(0)
    expect(bestStreak(days)).toBe(3)
  })

  it('tracks challenge days', () => {
    const def = CHALLENGE_BY_ID['plank-30']
    expect(def.days[0].holdSec).toBe(20)
    expect(def.days[6].rest).toBe(true)
    const join = { id: def.id, startDate: addDays(TODAY, -2), joinedAt: 0 }
    const ws = [workout(addDays(TODAY, -2), [['plank', [{ durationSec: 25 }]]])]
    const st = challengeStatus(def, join, ws, get, TODAY)
    expect(st.days.slice(0, 4).map((d) => d.state)).toEqual(['done', 'missed', 'today', 'future'])
    expect(st.dayIndex).toBe(2)
  })

  it('gives XP for sets, workouts and challenge days', () => {
    const ws = [workout(TODAY, [['plank', [{ durationSec: 25 }, { durationSec: 25 }]]])]
    const xp = totalXp({ workouts: ws, fasts: [], marks: [], joins: [{ id: 'plank-30', startDate: TODAY, joinedAt: 0 }], get }, TODAY)
    expect(xp).toBe(2 * 10 + 50 + 30)
  })

  it('points every challenge at a real exercise that tracks the right thing', () => {
    for (const c of CHALLENGES) {
      if (c.kind === 'mobility') continue
      const ex = EXERCISE_BY_ID[c.exerciseId!]
      expect(ex, c.id).toBeDefined()
      expect(ex.track, c.id).toBe(c.kind === 'hold' ? 'hold' : 'reps')
    }
    expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(CHALLENGES.length)
  })

  it('always offers "finish a workout" in the daily quests', () => {
    const q = dailyQuests({ workouts: [], meals: [], water: [], fasts: [], weights: [], marks: [], settings: DEFAULT_SETTINGS, get }, TODAY)
    expect(q).toHaveLength(3)
    expect(q[0].id).toBe('workout')
    expect(new Set(q.map((x) => x.id)).size).toBe(3)
  })
})
