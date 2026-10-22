import type { Skill, SkillLevel } from '../data/skills'
import type { SkillMark, Workout } from '../db/types'

/** Sets in one workout entry list that meet the level's rep or hold target. */
export function qualifyingSets(workout: Workout, level: SkillLevel): number {
  return workout.entries
    .filter((e) => e.exerciseId === level.exerciseId)
    .flatMap((e) => e.sets)
    .filter((s) => s.done && (level.holdSec != null ? (s.durationSec ?? 0) >= level.holdSec : (s.reps ?? 0) >= (level.reps ?? Infinity))).length
}

export interface LevelProgress {
  achievedAt: number | null
  manual: boolean
  /** Best single set (reps or seconds). */
  bestValue: number
  /** Most sets at target in a single workout. */
  bestQualifying: number
}

export function levelProgress(workouts: Workout[], level: SkillLevel, mark?: SkillMark): LevelProgress {
  let achievedAt: number | null = null
  let bestValue = 0
  let bestQualifying = 0
  const sorted = workouts.filter((w) => w.endedAt != null).sort((a, b) => a.startedAt - b.startedAt)
  for (const w of sorted) {
    const q = qualifyingSets(w, level)
    bestQualifying = Math.max(bestQualifying, q)
    if (achievedAt == null && q >= level.sets) achievedAt = w.startedAt
    for (const e of w.entries) {
      if (e.exerciseId !== level.exerciseId) continue
      for (const s of e.sets) {
        if (!s.done) continue
        bestValue = Math.max(bestValue, level.holdSec != null ? (s.durationSec ?? 0) : (s.reps ?? 0))
      }
    }
  }
  if (mark && (achievedAt == null || mark.achievedAt < achievedAt)) return { achievedAt: mark.achievedAt, manual: true, bestValue, bestQualifying }
  return { achievedAt, manual: false, bestValue, bestQualifying }
}

export interface SkillProgress {
  levels: LevelProgress[]
  /** Index of the level to work on now (= levels.length when all are done). */
  current: number
  achieved: number
}

export function skillProgress(skill: Skill, workouts: Workout[], marks: SkillMark[]): SkillProgress {
  const levels = skill.levels.map((lvl, i) =>
    levelProgress(
      workouts,
      lvl,
      marks.find((m) => m.skillId === skill.id && m.level === i),
    ),
  )
  // The current level is the first one not yet achieved after the highest achieved one.
  let highest = -1
  levels.forEach((l, i) => {
    if (l.achievedAt != null) highest = i
  })
  return { levels, current: highest + 1, achieved: levels.filter((l) => l.achievedAt != null).length }
}
