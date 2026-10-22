import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Settings } from './types'

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  name: '',
  sex: 'male',
  birthYear: null,
  heightCm: null,
  units: 'imperial',
  theme: 'system',
  activityLevel: 'moderate',
  smoker: false,
  calorieGoal: 2200,
  proteinGoalG: 150,
  carbGoalG: 220,
  fatGoalG: 70,
  waterGoalMl: 2957,
  goalWeightKg: null,
  defaultRestSec: 90,
  restSound: true,
  restVibrate: true,
  fastingGoalHours: 16,
  weeklyPlan: [[], [], [], [], [], [], []],
}

export function useSettings(): Settings {
  const stored = useLiveQuery(() => db.settings.get('settings'), [])
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await db.settings.get('settings')) }
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch, id: 'settings' })
}

/** Age in whole years; falls back to 30 when no birth year is set. */
export function ageFromSettings(s: Settings, now = new Date()): number {
  return s.birthYear ? now.getFullYear() - s.birthYear : 30
}
