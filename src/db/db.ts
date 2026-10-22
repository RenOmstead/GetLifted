import Dexie, { type EntityTable } from 'dexie'
import type {
  CustomExercise,
  ExerciseNote,
  Fast,
  FoodItem,
  MealEntry,
  Routine,
  Settings,
  SkillMark,
  Supplement,
  SupplementLog,
  WaterLog,
  WeightEntry,
  Workout,
} from './types'

export type GetLiftedDB = Dexie & {
  settings: EntityTable<Settings, 'id'>
  weights: EntityTable<WeightEntry, 'id'>
  fasts: EntityTable<Fast, 'id'>
  foods: EntityTable<FoodItem, 'id'>
  meals: EntityTable<MealEntry, 'id'>
  supplements: EntityTable<Supplement, 'id'>
  supplementLogs: EntityTable<SupplementLog, 'id'>
  water: EntityTable<WaterLog, 'id'>
  customExercises: EntityTable<CustomExercise, 'id'>
  workouts: EntityTable<Workout, 'id'>
  routines: EntityTable<Routine, 'id'>
  exerciseNotes: EntityTable<ExerciseNote, 'exerciseId'>
  skillMarks: EntityTable<SkillMark, 'id'>
}

// Everything lives on-device in IndexedDB; Settings → Backup exports it as JSON.
export const db = new Dexie('getlifted') as GetLiftedDB

db.version(1).stores({
  settings: 'id',
  weights: '++id, date',
  fasts: '++id, start, end',
  foods: '++id, name, lastUsed, barcode',
  meals: '++id, date',
  supplements: '++id, name, active',
  supplementLogs: '++id, date, supplementId',
  water: '++id, date',
  customExercises: 'id, name',
  workouts: '++id, date, startedAt, endedAt',
  routines: '++id, name',
  exerciseNotes: 'exerciseId',
  skillMarks: 'id, skillId',
})

export const TABLE_NAMES = [
  'settings',
  'weights',
  'fasts',
  'foods',
  'meals',
  'supplements',
  'supplementLogs',
  'water',
  'customExercises',
  'workouts',
  'routines',
  'exerciseNotes',
  'skillMarks',
] as const
