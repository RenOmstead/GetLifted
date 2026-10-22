import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { EXERCISES, type ExerciseDef } from '../data/exercises'
import { db } from '../db/db'
import type { CustomExercise } from '../db/types'

export interface ExerciseInfo extends ExerciseDef {
  /** Created by you or added from the full library. */
  custom?: boolean
}

export function customToInfo(c: CustomExercise): ExerciseInfo {
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    track: c.track,
    muscles: c.muscles,
    equipment: c.equipment,
    perSide: c.perSide,
    fedb: c.fedbId,
    steps: c.steps,
    custom: true,
  }
}

const UNKNOWN = (id: string): ExerciseInfo => ({ id, name: 'Unknown exercise', category: 'strength', track: 'weighted', muscles: [] })

/** Built-in exercises plus your own, keyed by id. */
export function useExercises(): { list: ExerciseInfo[]; get: (id: string) => ExerciseInfo } {
  const custom = useLiveQuery(() => db.customExercises.toArray(), [])
  return useMemo(() => {
    const list: ExerciseInfo[] = [...EXERCISES, ...(custom ?? []).map(customToInfo)]
    const byId = new Map(list.map((e) => [e.id, e]))
    return { list, get: (id: string) => byId.get(id) ?? UNKNOWN(id) }
  }, [custom])
}

export function searchExercises(list: ExerciseInfo[], query: string): ExerciseInfo[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return list
  return list.filter((e) => {
    const hay = `${e.name} ${e.equipment ?? ''} ${e.muscles.join(' ')} ${e.category}`.toLowerCase()
    return terms.every((t) => hay.includes(t))
  })
}
