import { CHALLENGES, CHALLENGE_BY_ID, type ChallengeDay, type ChallengeDef } from '../data/challenges'
import { SKILLS } from '../data/skills'
import type { ChallengeJoin, Fast, MealEntry, Settings, SkillMark, WaterLog, WeightEntry, Workout } from '../db/types'
import { addDays, dateKey, parseDateKey } from './dates'
import type { ExerciseInfo } from './exercises'
import { fastHours } from './fasting'
import { mealTotals } from './nutrition'
import { skillProgress } from './progression'

type GetExercise = (id: string) => ExerciseInfo | undefined

const finished = (ws: Workout[]) => ws.filter((w) => w.endedAt != null)
const doneSets = (w: Workout) => w.entries.flatMap((e) => e.sets.filter((s) => s.done).map((s) => ({ ...s, exerciseId: e.exerciseId })))

/* ── Streaks ──────────────────────────────────────────────────────── */

/** Days (YYYY-MM-DD) with at least one finished workout. */
export function activeDays(workouts: Workout[]): Set<string> {
  return new Set(finished(workouts).map((w) => w.date))
}

/** Consecutive active days ending today, or yesterday if today isn't done yet. */
export function currentStreak(days: Set<string>, today = dateKey()): number {
  let day = days.has(today) ? today : addDays(today, -1)
  let n = 0
  while (days.has(day)) {
    n++
    day = addDays(day, -1)
  }
  return n
}

export function bestStreak(days: Set<string>): number {
  let best = 0
  for (const d of days) {
    if (days.has(addDays(d, -1))) continue
    let n = 0
    let cur = d
    while (days.has(cur)) {
      n++
      cur = addDays(cur, 1)
    }
    best = Math.max(best, n)
  }
  return best
}

/* ── XP and levels ────────────────────────────────────────────────── */

export const XP = { set: 10, workout: 50, skillLevel: 100, fast: 20, challengeDay: 30 }

export function levelFromXp(xp: number): { level: number; levelStart: number; nextLevel: number } {
  // Level n starts at 250·n(n−1)/2 XP: 0, 250, 750, 1500, 2500…
  let level = 1
  while (250 * ((level + 1) * level) / 2 <= xp) level++
  return { level, levelStart: (250 * level * (level - 1)) / 2, nextLevel: (250 * (level + 1) * level) / 2 }
}

export interface XpInput {
  workouts: Workout[]
  fasts: Fast[]
  marks: SkillMark[]
  joins: ChallengeJoin[]
  get: GetExercise
}

export function totalXp({ workouts, fasts, marks, joins, get }: XpInput, today = dateKey()): number {
  const fin = finished(workouts)
  const sets = fin.reduce((n, w) => n + doneSets(w).length, 0)
  const levels = SKILLS.reduce((n, s) => n + skillProgress(s, workouts, marks).achieved, 0)
  const goodFasts = fasts.filter((f) => f.end != null && fastHours(f) >= f.goalHours).length
  const challengeDays = joins.reduce((n, j) => {
    const def = CHALLENGE_BY_ID[j.id]
    return def ? n + challengeStatus(def, j, workouts, get, today).days.filter((d) => d.state === 'done' && !d.rest).length : n
  }, 0)
  return sets * XP.set + fin.length * XP.workout + levels * XP.skillLevel + goodFasts * XP.fast + challengeDays * XP.challengeDay
}

/* ── Challenges ───────────────────────────────────────────────────── */

/** Seconds of mobility or stretching work in a set of workouts (reps sets count 30 s each). */
export function mobilitySeconds(ws: Workout[], get: GetExercise): number {
  let sec = 0
  for (const w of finished(ws))
    for (const e of w.entries) {
      const ex = get(e.exerciseId)
      if (!ex || (ex.category !== 'mobility' && ex.category !== 'flexibility')) continue
      for (const s of e.sets) if (s.done) sec += ex.track === 'hold' ? (s.durationSec ?? 0) : 30
    }
  return sec
}

/** What you did toward a challenge on one day: total reps, longest hold, or mobility minutes. */
export function dayValue(def: ChallengeDef, ws: Workout[], get: GetExercise): number {
  if (def.kind === 'mobility') return mobilitySeconds(ws, get) / 60
  const sets = finished(ws)
    .flatMap(doneSets)
    .filter((s) => s.exerciseId === def.exerciseId)
  if (def.kind === 'hold') return Math.max(0, ...sets.map((s) => s.durationSec ?? 0))
  return sets.reduce((n, s) => n + (s.reps ?? 0), 0)
}

export const dayTarget = (day: ChallengeDay) => day.reps ?? day.holdSec ?? day.minutes ?? 0

export type DayState = 'done' | 'missed' | 'today' | 'future'

export interface ChallengeStatus {
  def: ChallengeDef
  join: ChallengeJoin
  dayIndex: number
  finishedAll: boolean
  over: boolean
  days: (ChallengeDay & { date: string; state: DayState; value: number })[]
}

export function challengeStatus(def: ChallengeDef, join: ChallengeJoin, workouts: Workout[], get: GetExercise, today = dateKey()): ChallengeStatus {
  const days = def.days.map((d, i) => {
    const date = addDays(join.startDate, i)
    const ws = workouts.filter((w) => w.date === date)
    const value = d.rest ? 0 : dayValue(def, ws, get)
    const hit = d.rest || value >= dayTarget(d)
    const state: DayState = date > today ? 'future' : hit ? 'done' : date === today ? 'today' : 'missed'
    return { ...d, date, state, value }
  })
  const dayIndex = Math.round((parseDateKey(today).getTime() - parseDateKey(join.startDate).getTime()) / 86_400_000)
  return {
    def,
    join,
    dayIndex,
    over: dayIndex >= def.days.length,
    finishedAll: days.every((d) => d.state === 'done'),
    days,
  }
}

/* ── Quests ───────────────────────────────────────────────────────── */

export interface QuestContext {
  workouts: Workout[]
  meals: MealEntry[]
  water: WaterLog[]
  fasts: Fast[]
  weights: WeightEntry[]
  marks: SkillMark[]
  settings: Settings
  get: GetExercise
}

export interface Quest {
  id: string
  title: string
  icon: string
  target: number
  value: number
  unit?: string
  xp: number
}

const inRange = (date: string, from: string, to: string) => date >= from && date <= to

function questValues(ctx: QuestContext, from: string, to: string) {
  const ws = finished(ctx.workouts).filter((w) => inRange(w.date, from, to))
  const sets = ws.flatMap(doneSets)
  const sum = (pred: (id: string) => boolean) => sets.filter((s) => pred(s.exerciseId)).reduce((n, s) => n + (s.reps ?? 0), 0)
  return {
    workouts: ws.length,
    days: new Set(ws.map((w) => w.date)).size,
    sets: sets.length,
    mobility: mobilitySeconds(ws, ctx.get),
    holds: sets.filter((s) => ctx.get(s.exerciseId)?.track === 'hold').reduce((n, s) => n + (s.durationSec ?? 0), 0),
    pushups: sum((id) => id.includes('pushup')),
    squats: sum((id) => id.includes('squat') && ctx.get(id)?.category === 'calisthenics'),
    protein: mealTotals(ctx.meals.filter((m) => inRange(m.date, from, to))).protein,
    water: ctx.water.filter((w) => inRange(w.date, from, to)).reduce((n, w) => n + w.ml, 0),
    fasts: ctx.fasts.filter((f) => f.end != null && inRange(dateKey(f.end), from, to) && fastHours(f) >= f.goalHours).length,
    weighIns: ctx.weights.filter((w) => inRange(w.date, from, to)).length,
    levels: SKILLS.reduce(
      (n, s) =>
        n +
        skillProgress(s, ctx.workouts, ctx.marks).levels.filter((l) => l.achievedAt != null && inRange(dateKey(l.achievedAt), from, to)).length,
      0,
    ),
  }
}

/** Three daily quests, chosen by the date so they change every day. */
export function dailyQuests(ctx: QuestContext, today = dateKey()): Quest[] {
  const v = questValues(ctx, today, today)
  const pool: Quest[] = [
    { id: 'workout', title: 'Finish a workout', icon: 'dumbbell', target: 1, value: v.workouts, xp: 20 },
    { id: 'sets', title: 'Complete 12 sets', icon: 'check', target: 12, value: v.sets, xp: 20 },
    { id: 'mobility', title: 'Stretch or mobilize for 5 minutes', icon: 'stretch', target: 300, value: v.mobility, unit: 's', xp: 15 },
    { id: 'holds', title: 'Hold positions for 2 minutes in total', icon: 'timer', target: 120, value: v.holds, unit: 's', xp: 15 },
    { id: 'protein', title: 'Reach your protein goal', icon: 'food', target: ctx.settings.proteinGoalG, value: Math.round(v.protein), unit: 'g', xp: 15 },
    { id: 'water', title: 'Drink your water goal', icon: 'droplet', target: ctx.settings.waterGoalMl, value: v.water, unit: 'ml', xp: 10 },
  ]
  const seed = Math.floor(parseDateKey(today).getTime() / 86_400_000)
  const first = pool[0]
  const rest = pool.slice(1)
  // Always "finish a workout", plus two others that rotate.
  return [first, rest[seed % rest.length], rest[(seed + 2) % rest.length]]
}

export function weeklyQuests(ctx: QuestContext, monday: string): Quest[] {
  const v = questValues(ctx, monday, addDays(monday, 6))
  return [
    { id: 'days', title: 'Train on 4 different days', icon: 'calendar', target: 4, value: v.days, xp: 100 },
    { id: 'pushups', title: 'Do 100 push-ups (any kind)', icon: 'dumbbell', target: 100, value: v.pushups, xp: 80 },
    { id: 'squats', title: 'Do 150 bodyweight squats', icon: 'dumbbell', target: 150, value: v.squats, xp: 80 },
    { id: 'level', title: 'Unlock a new skill level', icon: 'star', target: 1, value: v.levels, xp: 120 },
    { id: 'fasts', title: 'Reach your fasting goal 3 times', icon: 'timer', target: 3, value: v.fasts, xp: 60 },
    { id: 'weigh', title: 'Log your weight 3 times', icon: 'body', target: 3, value: v.weighIns, xp: 40 },
  ]
}

/* ── Badges ───────────────────────────────────────────────────────── */

export interface Badge {
  id: string
  name: string
  text: string
  emoji: string
  earned: boolean
}

export function badges(ctx: QuestContext & { joins: ChallengeJoin[] }, today = dateKey()): Badge[] {
  const fin = finished(ctx.workouts)
  const sets = fin.flatMap(doneSets)
  const best = (pred: (id: string) => boolean, key: 'reps' | 'durationSec') => Math.max(0, ...sets.filter((s) => pred(s.exerciseId)).map((s) => s[key] ?? 0))
  const days = activeDays(ctx.workouts)
  const streak = bestStreak(days)
  const progress = SKILLS.map((s) => skillProgress(s, ctx.workouts, ctx.marks))
  const pullups = best((id) => id === 'pullup' || id === 'chinup' || id === 'chest-to-bar-pullup', 'reps')
  const challengeDone = ctx.joins.some((j) => {
    const def = CHALLENGE_BY_ID[j.id]
    return def ? challengeStatus(def, j, ctx.workouts, ctx.get, today).finishedAll : false
  })
  const b = (id: string, name: string, emoji: string, text: string, earned: boolean): Badge => ({ id, name, emoji, text, earned })
  return [
    b('first', 'Apprentice', '🕯️', 'Finish your first workout', fin.length >= 1),
    b('ten', 'Devoted', '📜', 'Finish 10 workouts', fin.length >= 10),
    b('fifty', 'Enchanted', '🔮', 'Finish 50 workouts', fin.length >= 50),
    b('streak3', 'Kindled', '🔥', 'Train 3 days in a row', streak >= 3),
    b('streak7', 'Moonlit Week', '🌙', 'Train 7 days in a row', streak >= 7),
    b('streak30', 'Eternal Flame', '✨', 'Train 30 days in a row', streak >= 30),
    b('pullup1', 'First Pull-Up', '🪄', 'Do your first full pull-up', pullups >= 1),
    b('pullup10', 'Bar Sorceress', '⚡', '10 pull-ups in one set', pullups >= 10),
    b('pushup25', 'Push Potion', '🧪', '25 push-ups in one set', best((id) => id === 'pushup', 'reps') >= 25),
    b('plank2', 'Stone Statue', '🗿', 'Hold a plank for 2 minutes', best((id) => id === 'plank', 'durationSec') >= 120),
    b('level1', 'First Step', '⭐', 'Unlock your first skill level', progress.some((p) => p.achieved > 0)),
    b('master', 'Skill Master', '👑', 'Finish every level of a skill', progress.some((p, i) => p.achieved === SKILLS[i].levels.length)),
    b('sets100', 'Hundred Sets', '💯', 'Complete 100 sets', sets.length >= 100),
    b('challenge', 'Quest Complete', '🏆', 'Finish every day of a challenge', challengeDone),
    b('fast24', 'Moon Fast', '🌕', 'Complete a 24-hour fast', ctx.fasts.some((f) => f.end != null && fastHours(f) >= 24)),
  ]
}

export { CHALLENGES }
