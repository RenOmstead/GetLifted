import { useLiveQuery } from 'dexie-react-hooks'
import { SKILLS } from '../data/skills'
import { db } from '../db/db'
import type { Routine, RoutineEntry, Workout } from '../db/types'
import { dateKey } from './dates'
import { skillProgress } from './progression'
import { entriesFromRoutine, exerciseHistory, setScore } from './workouts'
import type { ExerciseInfo } from './exercises'

export async function getActiveWorkout(): Promise<Workout | undefined> {
  return db.workouts.filter((w) => w.endedAt == null).first()
}

export function useActiveWorkout(): Workout | undefined {
  return useLiveQuery(() => getActiveWorkout(), [])
}

/** Starts a workout (from a routine if given) and returns its id. Resumes the active one instead if there is one. */
export async function startWorkout(routine?: Routine): Promise<number> {
  const active = await getActiveWorkout()
  if (active?.id) return active.id
  const workouts = await db.workouts.toArray()
  return db.workouts.add({
    date: dateKey(),
    name: routine?.name ?? 'Workout',
    routineId: routine?.id ?? null,
    startedAt: Date.now(),
    endedAt: null,
    entries: routine ? entriesFromRoutine(routine.entries, workouts) : [],
  }) as Promise<number>
}

/** Adds exercises to the workout in progress, or starts a new one with them. Returns the workout id. */
export async function workoutWith(entries: RoutineEntry[], name: string): Promise<number> {
  const workouts = await db.workouts.toArray()
  const fresh = entriesFromRoutine(entries, workouts)
  const active = await getActiveWorkout()
  if (active?.id) {
    await db.workouts.update(active.id, { entries: [...active.entries, ...fresh] })
    return active.id
  }
  return db.workouts.add({ date: dateKey(), name, routineId: null, startedAt: Date.now(), endedAt: null, entries: fresh }) as Promise<number>
}

export interface WorkoutHighlights {
  records: { exerciseId: string; previous: number; now: number }[]
  skillLevels: { skillName: string; levelExerciseId: string; level: number }[]
}

/** New personal records and skill levels this workout earned compared with everything before it. */
export async function workoutHighlights(workout: Workout, get: (id: string) => ExerciseInfo): Promise<WorkoutHighlights> {
  const all = (await db.workouts.toArray()).filter((w) => w.endedAt != null)
  const before = all.filter((w) => w.id !== workout.id && w.startedAt < workout.startedAt)
  const records: WorkoutHighlights['records'] = []
  for (const exerciseId of new Set(workout.entries.map((e) => e.exerciseId))) {
    const track = get(exerciseId).track
    const prev = exerciseHistory(before, exerciseId, track)
    const sets = workout.entries.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets.filter((s) => s.done))
    if (!prev.length || !sets.length) continue
    const prevBest = Math.max(...prev.map((p) => p.best))
    const nowBest = Math.max(...sets.map((s) => setScore(s, track)))
    if (nowBest > prevBest) records.push({ exerciseId, previous: prevBest, now: nowBest })
  }
  const marks = await db.skillMarks.toArray()
  const skillLevels: WorkoutHighlights['skillLevels'] = []
  const withThis = [...before, workout]
  for (const skill of SKILLS) {
    const was = skillProgress(skill, before, marks)
    const is = skillProgress(skill, withThis, marks)
    is.levels.forEach((l, i) => {
      if (l.achievedAt != null && was.levels[i].achievedAt == null)
        skillLevels.push({ skillName: skill.name, levelExerciseId: skill.levels[i].exerciseId, level: i + 1 })
    })
  }
  return { records, skillLevels }
}
