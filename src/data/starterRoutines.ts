import type { Routine } from '../db/types'

type Starter = Omit<Routine, 'id' | 'createdAt'> & { blurb: string }

const reps = (exerciseId: string, sets: number, n: number, restSec = 90) => ({ exerciseId, sets, reps: n, restSec })
const hold = (exerciseId: string, sets: number, sec: number, restSec = 60) => ({ exerciseId, sets, durationSec: sec, restSec })

/** Ready-made routines you can add with one tap and then edit. */
export const STARTER_ROUTINES: Starter[] = [
  {
    name: 'Daily Joint Mobility',
    blurb: '10 minutes, head to toe. Great every morning or before training.',
    entries: [
      reps('neck-tilts', 1, 10, 0),
      reps('shoulder-circles', 1, 10, 0),
      reps('shoulder-pass-through', 1, 10, 0),
      reps('wrist-prep', 1, 10, 0),
      reps('cat-cow', 1, 10, 0),
      reps('thoracic-open-book', 1, 8, 0),
      reps('hip-circles', 1, 10, 0),
      reps('ninety-ninety', 1, 8, 0),
      reps('knee-to-wall', 1, 10, 0),
      hold('deep-squat-hold', 1, 60, 0),
    ],
  },
  {
    name: 'Flexibility Cool-Down',
    blurb: 'Static stretches for after training or before bed.',
    entries: [
      hold('childs-pose', 1, 45, 0),
      hold('cobra', 1, 30, 0),
      hold('hip-flexor-stretch', 1, 45, 0),
      hold('pigeon', 1, 60, 0),
      hold('hamstring-stretch', 1, 45, 0),
      hold('butterfly-stretch', 1, 45, 0),
      hold('cross-body-shoulder', 1, 30, 0),
      hold('spinal-twist', 1, 45, 0),
    ],
  },
  {
    name: 'Beginner Calisthenics',
    blurb: 'Full body, 3 times a week. Swap in harder steps as you progress.',
    entries: [
      reps('australian-row', 3, 10),
      reps('incline-pushup', 3, 10),
      reps('negative-pullup', 3, 5),
      reps('bodyweight-squat', 3, 15),
      reps('glute-bridge', 3, 12, 60),
      hold('plank', 3, 30, 60),
    ],
  },
  {
    name: 'Calisthenics Strength',
    blurb: 'Pull, dip, push, legs and core for intermediate athletes.',
    entries: [
      reps('pullup', 3, 8, 120),
      reps('dip', 3, 10, 120),
      reps('pushup', 3, 15),
      reps('bulgarian-split-squat', 3, 10),
      reps('hanging-leg-raise', 3, 10),
      hold('l-sit', 3, 15, 90),
    ],
  },
  {
    name: 'Skills: Levers & Planche',
    blurb: 'Static holds. Use the level that matches your Skills progress.',
    entries: [hold('wall-handstand', 3, 30, 90), hold('tuck-front-lever', 4, 12, 120), hold('tuck-back-lever', 3, 12, 120), hold('tuck-planche', 4, 10, 120), hold('hollow-hold', 3, 30, 60)],
  },
  {
    name: 'Gym: Push',
    blurb: 'Chest, shoulders and triceps.',
    entries: [
      reps('bench-press', 4, 6, 150),
      reps('incline-db-press', 3, 10, 120),
      reps('machine-shoulder-press', 3, 10),
      reps('lateral-raise', 3, 15, 60),
      reps('triceps-pushdown', 3, 12, 60),
    ],
  },
  {
    name: 'Gym: Pull',
    blurb: 'Back and biceps.',
    entries: [reps('deadlift', 3, 5, 180), reps('lat-pulldown', 3, 10), reps('seated-cable-row', 3, 10), reps('face-pull', 3, 15, 60), reps('db-curl', 3, 12, 60)],
  },
  {
    name: 'Gym: Legs',
    blurb: 'Quads, hamstrings, glutes and calves.',
    entries: [reps('back-squat', 4, 6, 180), reps('romanian-deadlift', 3, 8, 120), reps('leg-press', 3, 12), reps('lying-leg-curl', 3, 12, 60), reps('standing-calf-raise', 3, 15, 60)],
  },
]
