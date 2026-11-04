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
  {
    name: 'Trail Warm-Up',
    blurb: '5 minutes before a walk or hike, or first thing on a trip morning.',
    entries: [
      reps('ankle-circles', 1, 10, 0),
      reps('leg-swing-front', 1, 10, 0),
      reps('leg-swing-side', 1, 10, 0),
      reps('hip-circles', 1, 10, 0),
      reps('knee-to-wall', 1, 10, 0),
      reps('calf-raise', 1, 15, 0),
    ],
  },
  {
    name: 'Hiker Strength',
    blurb: 'Twice a week. Strong legs and core for climbs, descents and uneven ground.',
    entries: [
      reps('step-up', 3, 10),
      reps('reverse-lunge', 3, 10),
      reps('single-leg-rdl', 3, 8),
      reps('single-leg-calf-raise', 3, 12, 60),
      reps('glute-bridge', 3, 15, 60),
      reps('band-lateral-walk', 2, 12, 60),
      hold('side-plank', 2, 30, 45),
      hold('plank', 2, 45, 45),
    ],
  },
  {
    name: 'Hill Walk',
    blurb: 'Once a week: hills, stairs or an incline treadmill.',
    entries: [{ exerciseId: 'incline-walk', sets: 1, durationSec: 30 * 60, restSec: 0 }],
  },
  {
    name: 'Post-Hike Recovery',
    blurb: '10 minutes after a long day so your legs are ready for tomorrow.',
    entries: [
      hold('calf-stretch', 2, 45, 0),
      hold('hamstring-stretch', 2, 45, 0),
      hold('standing-quad-stretch', 2, 30, 0),
      hold('hip-flexor-stretch', 2, 45, 0),
      hold('seated-glute-stretch', 2, 45, 0),
      reps('foot-roll', 2, 10, 0),
      hold('plantar-fascia-stretch', 1, 30, 0),
      hold('legs-up-wall', 1, 300, 0),
    ],
  },
  {
    name: 'Wrist Prep',
    blurb: '5 minutes before push-ups, planks or handstands so your wrists feel ready.',
    entries: [
      reps('wrist-circles', 1, 10, 0),
      reps('palm-flips', 1, 10, 0),
      reps('wrist-side-bends', 1, 10, 0),
      reps('wrist-flex-ext', 1, 10, 0),
      reps('wrist-prep', 1, 10, 0),
      reps('palm-lifts', 1, 10, 0),
      hold('wrist-flexor-stretch', 1, 20, 0),
      hold('wrist-extensor-stretch', 1, 20, 0),
    ],
  },
  {
    name: 'Hands & Wrists Desk Break',
    blurb: '3 minutes for stiff hands after typing, scrolling or gripping.',
    entries: [reps('tendon-glides', 1, 5, 0), reps('fist-to-spread', 1, 10, 0), reps('wrist-cars', 1, 5, 0), hold('prayer-stretch', 1, 20, 0), hold('reverse-prayer', 1, 20, 0)],
  },
  {
    name: 'Strong Wrists',
    blurb: 'Twice a week, very light. Wrists and grip that can handle planks, push-ups and hangs.',
    entries: [
      reps('wrist-curl', 2, 15, 45),
      reps('reverse-wrist-curl', 2, 15, 45),
      reps('palm-flips', 2, 12, 30),
      reps('band-finger-extension', 2, 20, 30),
      reps('palm-lifts', 2, 10, 45),
      hold('dead-hang', 2, 20, 60),
    ],
  },
  {
    name: 'Happy Feet',
    blurb: '6 minutes barefoot. Stronger toes and arches for long walks and hikes.',
    entries: [
      reps('toe-spreads', 1, 10, 0),
      reps('toe-yoga', 1, 10, 0),
      hold('short-foot', 3, 10, 10),
      reps('towel-scrunch', 1, 10, 0),
      reps('ankle-alphabet', 1, 10, 0),
      reps('tib-raise', 2, 12, 30),
      reps('heel-drops', 2, 10, 45),
      hold('kneeling-toe-stretch', 1, 30, 0),
    ],
  },
  {
    name: 'Ankle Care for Hikers',
    blurb: 'Range, strength and balance for uneven trails and fewer rolled ankles.',
    entries: [
      reps('ankle-pumps', 1, 15, 0),
      reps('ankle-tilts', 1, 10, 0),
      reps('knee-to-wall', 1, 10, 0),
      reps('band-ankle-in-out', 2, 12, 30),
      reps('tib-raise', 2, 12, 30),
      reps('single-leg-calf-raise', 2, 10, 45),
      hold('single-leg-balance', 2, 30, 15),
      hold('heel-walk', 1, 30, 0),
      hold('toe-walk', 1, 30, 0),
    ],
  },
  {
    name: 'Feet After a Long Day',
    blurb: 'Ease sore feet after a hike or a day on your feet.',
    entries: [
      reps('foot-roll', 1, 10, 0),
      hold('plantar-fascia-stretch', 1, 30, 0),
      hold('big-toe-wall-stretch', 1, 30, 0),
      hold('soleus-stretch', 1, 30, 0),
      hold('calf-stretch', 1, 30, 0),
      hold('kneeling-shin-stretch', 1, 30, 0),
      hold('legs-up-wall', 1, 180, 0),
    ],
  },
]
