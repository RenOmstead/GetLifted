import type { Sex } from '../db/types'

/**
 * Bodyweight milestones for the main lifts (one-rep max as a multiple of body
 * weight). They're rough, common strength-standard waypoints to aim for, not
 * judgments: age, sex, height and training history all move them.
 */
export interface LiftMilestones {
  exerciseId: string
  lower: boolean
  multiples: [number, number, number, number, number]
}

export const TIERS = ['Sprout', 'Bloom', 'Spark', 'Blaze', 'Legend'] as const

export const LIFT_MILESTONES: LiftMilestones[] = [
  { exerciseId: 'bench-press', lower: false, multiples: [0.5, 0.75, 1, 1.25, 1.5] },
  { exerciseId: 'overhead-press', lower: false, multiples: [0.35, 0.5, 0.65, 0.8, 1] },
  { exerciseId: 'barbell-row', lower: false, multiples: [0.5, 0.65, 0.8, 1, 1.25] },
  { exerciseId: 'back-squat', lower: true, multiples: [0.75, 1, 1.25, 1.5, 2] },
  { exerciseId: 'front-squat', lower: true, multiples: [0.6, 0.8, 1, 1.25, 1.6] },
  { exerciseId: 'deadlift', lower: true, multiples: [1, 1.25, 1.5, 2, 2.5] },
  { exerciseId: 'hip-thrust', lower: true, multiples: [0.75, 1, 1.5, 2, 2.5] },
]

/** Women's waypoints sit lower, more so for upper-body lifts. */
export function milestoneMultiples(m: LiftMilestones, sex: Sex): number[] {
  const f = sex === 'female' ? (m.lower ? 0.8 : 0.65) : 1
  return m.multiples.map((x) => Math.round(x * f * 100) / 100)
}
