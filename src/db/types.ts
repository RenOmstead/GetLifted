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
  /** The Yellowstone 2027 program. */
  yellowstone: YellowstoneSettings | null
  /** Your own free api.data.gov key for USDA FoodData Central search; the shared DEMO_KEY is used without one. */
  usdaApiKey?: string
}

/** A value you've confirmed, or an assumption until you do. */
export interface Fact<T> {
  value: T
  confirmed: boolean
}

export interface YellowstoneSettings {
  startDate: string
  /** Walk minutes that felt comfortable at the start. */
  baselineMin: number
  level: number
  /** Monday of the last week reviewed. */
  reviewedWeek: string | null
  /** Weekday (0 = Sunday) for each session. */
  days: Record<'strengthA' | 'walkHills' | 'strengthB' | 'easyOutdoor', number>
  tripDate: Fact<string>
  operator: string
  itinerary: string
  longestHikeMi: Fact<number | null>
  elevationGainFt: Fact<number | null>
  /** Your own goal until the itinerary is known. */
  enduranceGoal: string
  riding: { wanted: boolean; limitLb: Fact<number>; marginLb: number }
  food: { mode: 'calories' | 'protein' | 'habits' | 'none'; deficit: number; proteinPerKg: number }
  /** Stepping stones already celebrated. */
  celebrated?: string[]
  /** Your answers to the weight-goal questions; missing until you answer. */
  weight?: WeightGoals
}

export interface WeightGoals {
  /** How much weight loss matters in this program. */
  focus: 'priority' | 'balanced' | 'not-now'
  /** A goal weight, the riding target, or simply a downward trend. */
  aim: 'number' | 'riding' | 'trend'
  targetKg: number | null
  /** gentle ≈ ½ lb a week, steady ≈ 1 lb a week, none = habits, no pace. */
  pace: 'gentle' | 'steady' | 'none'
  weighIns: 'daily' | 'weekly' | 'rarely'
  /** Pounds between weight stepping stones; 0 = only the main goal. */
  milestoneLb: number
  why: string
  answeredAt: number
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
  /** Total sugars, g. */
  sugar?: number
  /** Added sugars, g (on US labels; often missing elsewhere). */
  addedSugar?: number
  /** Saturated fat, g. */
  satFat?: number
  /** Vitamins and minerals; sodium lives here too, in mg. */
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
  /**
   * manual: typed in. off: Open Food Facts. common: built-in whole food. staple: built-in grocery
   * staple. restaurant: built-in or saved restaurant item. usda: USDA FoodData Central. recipe: one
   * serving of a recipe.
   */
  source: 'manual' | 'off' | 'common' | 'staple' | 'restaurant' | 'usda' | 'recipe'
  /** Where you buy it, e.g. 'Aldi'. */
  store?: string
  /** Where the numbers come from, e.g. '2018 menu data'. */
  sourceNote?: string
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

/** A Yellowstone program entry: a session check-in, a weekly review or a progress check. */
export interface ProgramLog {
  id?: number
  date: string
  kind: 'session' | 'review' | 'check' | 'walk'
  session?: 'strengthA' | 'walkHills' | 'strengthB' | 'easyOutdoor'
  status?: 'done' | 'short' | 'skipped'
  walkMin?: number | null
  distanceM?: number | null
  elevationFt?: number | null
  inclinePct?: number | null
  packLb?: number | null
  /** 1–10 perceived effort. */
  effort?: number | null
  /** 0–10 soreness. */
  soreness?: number | null
  pain?: boolean
  painNote?: string
  note?: string
  /** Weekly review: what was decided and the level after. */
  decision?: 'progress' | 'repeat' | 'ease'
  level?: number
  /** Progress check results. */
  comfortableWalkMin?: number | null
  sitToStand30s?: number | null
  balanceSec?: number | null
}

/**
 * A grocery item with what you paid. Built-in Aldi staples use id `aldi:<staple id>` and override
 * the staple's starter estimate; your own items use `g:<timestamp>`.
 */
export interface GroceryPrice {
  id: string
  name: string
  store: string
  /** Nutrition for one serving. */
  food: FoodSnapshot
  packageLabel: string
  /** Servings in one package. */
  packageServings: number
  /** What one package cost you, in dollars. */
  price: number
  updatedAt: number
}

export interface RecipeIngredient {
  /** Price-book id ('aldi:…' or 'g:…') when the ingredient can be priced. */
  groceryId?: string
  /** Nutrition for one serving of the ingredient. */
  food: FoodSnapshot
  /** Amount, in servings of `food`. */
  servings: number
  note?: string
}

export interface Recipe {
  id?: number
  name: string
  /** How many servings the ingredients make. */
  servings: number
  ingredients: RecipeIngredient[]
  steps: string[]
  notes?: string
  createdAt: number
}
