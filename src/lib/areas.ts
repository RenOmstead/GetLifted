/** Body areas people think in, built from the muscle names. */
export const TARGET_AREAS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Wrists & hands', 'Core', 'Glutes', 'Legs', 'Feet & ankles'] as const
export type TargetArea = (typeof TARGET_AREAS)[number]

const AREA_MUSCLES: Record<TargetArea, string[]> = {
  Chest: ['chest'],
  Back: ['lats', 'middle back', 'lower back', 'traps'],
  Shoulders: ['shoulders', 'neck'],
  Arms: ['biceps', 'triceps', 'forearms'],
  'Wrists & hands': ['wrists', 'hands'],
  Core: ['abdominals', 'obliques', 'hip flexors'],
  Glutes: ['glutes', 'abductors'],
  Legs: ['quadriceps', 'hamstrings', 'calves', 'adductors', 'shins'],
  'Feet & ankles': ['feet', 'ankles'],
}

/** True when any of the muscles belongs to the area (or no area is chosen). */
export function hitsArea(muscles: string[], area: TargetArea | null): boolean {
  return !area || muscles.some((m) => AREA_MUSCLES[area].includes(m))
}
