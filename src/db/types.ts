export type Sex = 'male' | 'female'
export type Units = 'metric' | 'imperial'
export type ThemePref = 'system' | 'light' | 'dark'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Settings {
  id: 'settings'
  name: string
  sex: Sex
  birthYear: number | null
  heightCm: number | null
  units: Units
  theme: ThemePref
  activityLevel: ActivityLevel
  smoker: boolean
  calorieGoal: number
  proteinGoalG: number
  carbGoalG: number
  fatGoalG: number
  waterGoalMl: number
  goalWeightKg: number | null
  defaultRestSec: number
  restSound: boolean
  restVibrate: boolean
  fastingGoalHours: number
  /** Routine ids planned for each weekday, index 0 = Sunday. */
  weeklyPlan: number[][]
}

export interface WeightEntry {
  id?: number
  /** Local calendar day, YYYY-MM-DD. */
  date: string
  kg: number
  bodyFatPct?: number | null
  waistCm?: number | null
  note?: string
  createdAt: number
}

export interface Fast {
  id?: number
  start: number
  /** null while the fast is running. */
  end: number | null
  goalHours: number
  note?: string
}

/** Micronutrient amounts keyed by nutrient id, in that nutrient's reference unit. */
export type Micros = Record<string, number>

export interface NutritionFacts {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  micros?: Micros
}

/** A food with its nutrition for one serving. */
export interface FoodItem extends NutritionFacts {
  id?: number
  name: string
  brand?: string
  servingLabel: string
  /** Grams in one serving, when known, so amounts can be logged by weight. */
  servingGrams: number | null
  barcode?: string
  source: 'manual' | 'off' | 'common'
  lastUsed: number
}

export type FoodSnapshot = Omit<FoodItem, 'id' | 'lastUsed'>

export interface MealEntry {
  id?: number
  date: string
  meal: MealType
  food: FoodSnapshot
  servings: number
  createdAt: number
}

export interface SupplementIngredient {
  name: string
  amount: number
  unit: string
}

export interface Supplement {
  id?: number
  name: string
  brand?: string
  servingLabel: string
  /** How many servings you plan to take per day. */
  dailyServings: number
  ingredients: SupplementIngredient[]
  dsldId?: string
  active: boolean
  createdAt: number
}

export interface SupplementLog {
  id?: number
  date: string
  supplementId: number
  servings: number
  at: number
}

export interface WaterLog {
  id?: number
  date: string
  ml: number
  at: number
}

/**
 * reps: bodyweight reps, optionally with added weight (weighted pull-ups).
 * weighted: load × reps. hold: seconds. cardio: duration and distance.
 */
export type TrackType = 'reps' | 'weighted' | 'hold' | 'cardio'
export type ExerciseCategory = 'calisthenics' | 'strength' | 'cardio' | 'mobility' | 'flexibility'

/**
 * Exercises the user created, or picked from the Free Exercise DB library
 * (id `fedb:<id>`), saved locally so they work offline.
 */
export interface CustomExercise {
  id: string
  name: string
  category: ExerciseCategory
  track: TrackType
  muscles: string[]
  equipment?: string
  perSide?: boolean
  fedbId?: string
  steps?: string[]
}

/** Your own notes and photo for an exercise, e.g. the machine at your gym and its seat setting. */
export interface ExerciseNote {
  exerciseId: string
  notes: string
  photo?: Blob | null
  updatedAt: number
}

export interface SetEntry {
  id: string
  reps?: number | null
  weightKg?: number | null
  durationSec?: number | null
  distanceM?: number | null
  done: boolean
  completedAt?: number
}

export interface WorkoutEntry {
  id: string
  exerciseId: string
  sets: SetEntry[]
  restSec?: number
  note?: string
}

export interface Workout {
  id?: number
  date: string
  name: string
  routineId?: number | null
  startedAt: number
  /** null while the workout is in progress. */
  endedAt: number | null
  entries: WorkoutEntry[]
  notes?: string
}

/** One exercise in a routine, with the targets to pre-fill when you start it. */
export interface RoutineEntry {
  exerciseId: string
  sets: number
  reps?: number | null
  weightKg?: number | null
  durationSec?: number | null
  restSec?: number | null
}

export interface Routine {
  id?: number
  name: string
  notes?: string
  entries: RoutineEntry[]
  createdAt: number
}

/** A skill level the user marked as achieved by hand. */
export interface SkillMark {
  /** `${skillId}:${levelIndex}` */
  id: string
  skillId: string
  level: number
  achievedAt: number
}

/** A multi-day challenge you joined (see src/data/challenges.ts). */
export interface ChallengeJoin {
  /** Challenge id. */
  id: string
  /** Day 1 of the challenge, YYYY-MM-DD. */
  startDate: string
  joinedAt: number
}
