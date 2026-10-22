import type { RoutineEntry, SetEntry, TrackType, Units, Workout, WorkoutEntry } from '../db/types'
import { formatSeconds } from './dates'
import { distanceUnit, fmt, kgToDisplay, mToDisplay, weightUnit } from './units'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

/** Estimated one-rep max (Epley). Reliable up to about 10 reps. */
export function e1rm(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0
  return reps === 1 ? weightKg : weightKg * (1 + reps / 30)
}

export function formatSet(set: SetEntry, track: TrackType, units: Units): string {
  const w = set.weightKg ? `${fmt(kgToDisplay(set.weightKg, units))} ${weightUnit(units)}` : ''
  switch (track) {
    case 'weighted':
      return `${w || `0 ${weightUnit(units)}`} × ${set.reps ?? 0}`
    case 'reps':
      return `${set.reps ?? 0} reps${w ? ` +${w}` : ''}`
    case 'hold':
      return `${formatSeconds(set.durationSec ?? 0)}${w ? ` +${w}` : ''}`
    case 'cardio': {
      const parts = []
      if (set.durationSec) parts.push(formatSeconds(set.durationSec))
      if (set.distanceM) parts.push(`${fmt(mToDisplay(set.distanceM, units), 2)} ${distanceUnit(units)}`)
      return parts.join(' · ') || '–'
    }
  }
}

/** The single number that best describes a set for progress tracking. */
export function setScore(set: SetEntry, track: TrackType): number {
  switch (track) {
    case 'weighted':
      return e1rm(set.weightKg ?? 0, set.reps ?? 0)
    case 'reps':
      return set.reps ?? 0
    case 'hold':
      return set.durationSec ?? 0
    case 'cardio':
      return set.distanceM ?? set.durationSec ?? 0
  }
}

export const SCORE_LABEL: Record<TrackType, string> = {
  weighted: 'Estimated 1-rep max',
  reps: 'Most reps in a set',
  hold: 'Longest hold',
  cardio: 'Longest distance',
}

export const doneSets = (entry: WorkoutEntry) => entry.sets.filter((s) => s.done)

export interface SessionSummary {
  workoutId: number
  date: string
  startedAt: number
  sets: SetEntry[]
  best: number
  volume: number
}

/** Every finished workout's completed sets for one exercise, oldest first. */
export function exerciseHistory(workouts: Workout[], exerciseId: string, track: TrackType): SessionSummary[] {
  return workouts
    .filter((w) => w.endedAt != null)
    .flatMap((w) => {
      const sets = w.entries.filter((e) => e.exerciseId === exerciseId).flatMap(doneSets)
      if (!sets.length) return []
      return [
        {
          workoutId: w.id!,
          date: w.date,
          startedAt: w.startedAt,
          sets,
          best: Math.max(...sets.map((s) => setScore(s, track))),
          volume: sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0),
        },
      ]
    })
    .sort((a, b) => a.startedAt - b.startedAt)
}

export interface Records {
  best: number
  maxWeightKg: number
  maxReps: number
  maxHoldSec: number
  sessions: number
}

export function personalRecords(history: SessionSummary[], track: TrackType): Records {
  const all = history.flatMap((h) => h.sets)
  return {
    best: Math.max(0, ...all.map((s) => setScore(s, track))),
    maxWeightKg: Math.max(0, ...all.map((s) => s.weightKg ?? 0)),
    maxReps: Math.max(0, ...all.map((s) => s.reps ?? 0)),
    maxHoldSec: Math.max(0, ...all.map((s) => s.durationSec ?? 0)),
    sessions: history.length,
  }
}

/** Completed sets from the most recent other workout containing this exercise. */
export function lastSets(workouts: Workout[], exerciseId: string, excludeWorkoutId?: number): SetEntry[] {
  const prior = workouts
    .filter((w) => w.id !== excludeWorkoutId && w.entries.some((e) => e.exerciseId === exerciseId && e.sets.some((s) => s.done)))
    .sort((a, b) => b.startedAt - a.startedAt)[0]
  return prior ? prior.entries.filter((e) => e.exerciseId === exerciseId).flatMap(doneSets) : []
}

export function newSet(prefill: Partial<SetEntry> = {}): SetEntry {
  return { id: uid(), reps: null, weightKg: null, durationSec: null, distanceM: null, done: false, ...prefill }
}

/** Builds workout entries from a routine, pre-filling weight from last time when the routine has none. */
export function entriesFromRoutine(routine: RoutineEntry[], workouts: Workout[]): WorkoutEntry[] {
  return routine.map((r) => {
    const previous = lastSets(workouts, r.exerciseId)
    return {
      id: uid(),
      exerciseId: r.exerciseId,
      restSec: r.restSec ?? undefined,
      sets: Array.from({ length: Math.max(1, r.sets) }, (_, i) =>
        newSet({
          reps: r.reps ?? previous[i]?.reps ?? null,
          weightKg: r.weightKg ?? previous[i]?.weightKg ?? previous.at(-1)?.weightKg ?? null,
          durationSec: r.durationSec ?? previous[i]?.durationSec ?? null,
        }),
      ),
    }
  })
}

export function workoutStats(w: Workout) {
  const sets = w.entries.flatMap(doneSets)
  return {
    exercises: w.entries.filter((e) => e.sets.some((s) => s.done)).length,
    sets: sets.length,
    volumeKg: sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0),
    durationMs: (w.endedAt ?? Date.now()) - w.startedAt,
  }
}
