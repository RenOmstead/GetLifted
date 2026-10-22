import { useEffect, useMemo, useState } from 'react'
import type { CustomExercise, ExerciseCategory, TrackType } from '../db/types'

/**
 * Free Exercise DB (public domain, github.com/yuhonas/free-exercise-db):
 * 870+ exercises with start/end photos and instructions. The catalog and
 * photos load from GitHub on demand; the service worker caches them for offline use.
 */
export const FEDB_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main'

export interface FedbExercise {
  id: string
  name: string
  force: string | null
  level: string
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  images: string[]
}

export const fedbImageUrls = (id: string): string[] => [0, 1].map((i) => `${FEDB_BASE}/exercises/${id}/${i}.jpg`)

let catalog: Promise<FedbExercise[]> | null = null

export function loadFedb(): Promise<FedbExercise[]> {
  catalog ??= fetch(`${FEDB_BASE}/dist/exercises.json`).then((res) => {
    if (!res.ok) throw new Error(`Exercise library returned ${res.status}`)
    return res.json() as Promise<FedbExercise[]>
  })
  catalog.catch(() => {
    catalog = null
  })
  return catalog
}

export function useFedb(enabled = true): { data: FedbExercise[] | null; error: string | null; byId: Record<string, FedbExercise> } {
  const [data, setData] = useState<FedbExercise[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) return
    let live = true
    loadFedb()
      .then((d) => live && setData(d))
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      live = false
    }
  }, [enabled])
  const byId = useMemo(() => Object.fromEntries((data ?? []).map((e) => [e.id, e])), [data])
  return { data, error, byId }
}

/** Maps a library exercise onto how this app logs it. */
export function fedbCategory(e: FedbExercise): ExerciseCategory {
  if (e.category === 'stretching') return 'flexibility'
  if (e.category === 'cardio') return 'cardio'
  if (e.equipment === 'body only') return 'calisthenics'
  return 'strength'
}

export function fedbTrack(e: FedbExercise): TrackType {
  if (e.category === 'stretching' || e.force === 'static') return 'hold'
  if (e.category === 'cardio') return 'cardio'
  if (e.equipment === 'body only' || e.equipment == null) return 'reps'
  return 'weighted'
}

export function fedbToCustom(e: FedbExercise): CustomExercise {
  return {
    id: `fedb:${e.id}`,
    name: e.name,
    category: fedbCategory(e),
    track: fedbTrack(e),
    muscles: [...e.primaryMuscles, ...e.secondaryMuscles],
    equipment: e.equipment ?? undefined,
    fedbId: e.id,
  }
}
