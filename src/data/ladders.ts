/**
 * "If you can do 10 of these, you can do 1 of these" ladders. Each rung says
 * how much of one exercise usually means you're ready to try the next, and
 * how to start. Thresholds are the common coaching rules of thumb, not
 * guarantees: everyone's levers and strengths differ a little.
 */
export interface Ladder {
  from: string
  to: string
  /** Reps in a single set of `from` (per side for one-sided moves). */
  reps?: number
  /** Seconds held in a single set of `from`. */
  holdSec?: number
  /** For loaded moves: the set must use at least this share of your body weight. */
  bwRatio?: number
  /** How to begin the new exercise. */
  start: { sets: number; reps?: number; holdSec?: number }
}

const r = (from: string, reps: number, to: string, sets: number, startReps: number): Ladder => ({ from, reps, to, start: { sets, reps: startReps } })
const h = (from: string, holdSec: number, to: string, sets: number, startHold: number): Ladder => ({ from, holdSec, to, start: { sets, holdSec: startHold } })
const hr = (from: string, holdSec: number, to: string, sets: number, startReps: number): Ladder => ({ from, holdSec, to, start: { sets, reps: startReps } })

export const LADDERS: Ladder[] = [
  // Push
  r('wall-pushup', 20, 'incline-pushup', 3, 5),
  r('incline-pushup', 15, 'knee-pushup', 3, 5),
  r('knee-pushup', 10, 'pushup', 3, 2),
  r('pushup', 10, 'diamond-pushup', 3, 3),
  r('pushup', 15, 'decline-pushup', 3, 5),
  r('pushup', 20, 'archer-pushup', 3, 1),
  r('pushup', 25, 'pseudo-planche-pushup', 3, 3),
  r('archer-pushup', 10, 'one-arm-pushup', 3, 1),
  r('pike-pushup', 10, 'elevated-pike-pushup', 3, 3),
  r('elevated-pike-pushup', 10, 'wall-hspu', 3, 1),
  r('wall-hspu', 8, 'freestanding-hspu', 3, 1),
  r('bench-dip', 15, 'negative-dip', 3, 3),
  r('negative-dip', 5, 'dip', 3, 2),
  r('dip', 10, 'straight-bar-dip', 3, 3),
  r('dip', 15, 'ring-dip', 3, 3),
  r('dip', 15, 'weighted-dip', 3, 5),

  // Pull
  hr('dead-hang', 30, 'scap-pull', 3, 5),
  r('australian-row', 15, 'negative-pullup', 3, 3),
  r('negative-pullup', 5, 'pullup', 3, 1),
  r('band-assisted-pullup', 10, 'pullup', 3, 1),
  { from: 'lat-pulldown', reps: 8, bwRatio: 0.9, to: 'pullup', start: { sets: 3, reps: 1 } },
  r('pullup', 8, 'chest-to-bar-pullup', 3, 2),
  r('pullup', 10, 'explosive-pullup', 3, 3),
  r('pullup', 12, 'archer-pullup', 3, 1),
  r('pullup', 12, 'weighted-pullup', 3, 5),
  r('explosive-pullup', 5, 'negative-muscle-up', 3, 2),
  r('negative-muscle-up', 5, 'muscle-up', 3, 1),
  r('archer-pullup', 5, 'one-arm-pullup', 3, 1),

  // Legs
  r('bodyweight-squat', 30, 'bulgarian-split-squat', 3, 5),
  r('bulgarian-split-squat', 12, 'assisted-pistol', 3, 3),
  r('assisted-pistol', 8, 'pistol-squat', 3, 1),
  r('pistol-squat', 5, 'shrimp-squat', 3, 1),
  r('glute-bridge', 20, 'single-leg-glute-bridge', 3, 8),
  r('goblet-squat', 12, 'back-squat', 3, 8),
  r('db-bench-press', 10, 'bench-press', 3, 8),
  r('romanian-deadlift', 10, 'deadlift', 3, 5),

  // Core
  r('hanging-knee-raise', 15, 'hanging-leg-raise', 3, 3),
  r('hanging-leg-raise', 10, 'toes-to-bar', 3, 3),
  r('dragon-flag-negative', 5, 'dragon-flag', 3, 1),
  h('plank', 60, 'hollow-hold', 3, 15),
  h('support-hold', 30, 'tuck-l-sit', 3, 10),
  h('tuck-l-sit', 20, 'l-sit', 3, 5),
  h('l-sit', 15, 'v-sit', 3, 3),

  // Statics
  h('tuck-front-lever', 15, 'adv-tuck-front-lever', 3, 5),
  h('adv-tuck-front-lever', 12, 'one-leg-front-lever', 3, 5),
  h('one-leg-front-lever', 10, 'straddle-front-lever', 3, 3),
  h('straddle-front-lever', 8, 'front-lever', 3, 2),
  h('german-hang', 20, 'tuck-back-lever', 3, 5),
  h('tuck-back-lever', 15, 'adv-tuck-back-lever', 3, 5),
  h('adv-tuck-back-lever', 12, 'straddle-back-lever', 3, 3),
  h('straddle-back-lever', 8, 'back-lever', 3, 3),
  h('frog-stand', 30, 'tuck-planche', 3, 5),
  h('planche-lean', 20, 'tuck-planche', 3, 5),
  h('tuck-planche', 15, 'adv-tuck-planche', 3, 5),
  h('adv-tuck-planche', 10, 'straddle-planche', 3, 2),
  h('straddle-planche', 5, 'full-planche', 3, 1),
  h('wall-handstand', 60, 'freestanding-handstand', 5, 5),
]
