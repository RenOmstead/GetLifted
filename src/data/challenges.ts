/**
 * Multi-day challenges you can join. Each day has a target; rest days are
 * built in so the ramp stays kind to your joints.
 */
export interface ChallengeDay {
  rest?: boolean
  /** Total reps across the day (any number of sets). */
  reps?: number
  /** Longest single hold that day, in seconds. */
  holdSec?: number
  /** Minutes of mobility or stretching work. */
  minutes?: number
}

export type ChallengeTag = 'Upper body' | 'Lower body' | 'Core' | 'Skills' | 'Cardio' | 'Mobility'
export const CHALLENGE_TAGS: ChallengeTag[] = ['Upper body', 'Lower body', 'Core', 'Skills', 'Cardio', 'Mobility']

export interface ChallengeDef {
  id: string
  name: string
  blurb: string
  decor: string
  kind: 'reps' | 'hold' | 'mobility'
  /** What it trains, for filtering. */
  tag: ChallengeTag
  exerciseId?: string
  days: ChallengeDay[]
}

/** A smooth ramp from `from` to `to` with a rest day every 7th day. */
function ramp(length: number, from: number, to: number, key: 'reps' | 'holdSec' | 'minutes', step = 5): ChallengeDay[] {
  const work = Array.from({ length }, (_, i) => i).filter((i) => (i + 1) % 7 !== 0)
  return Array.from({ length }, (_, i) => {
    if ((i + 1) % 7 === 0) return { rest: true }
    const k = work.indexOf(i) / Math.max(1, work.length - 1)
    return { [key]: Math.round((from + (to - from) * k) / step) * step || step }
  })
}

export const CHALLENGES: ChallengeDef[] = [
  {
    id: 'plank-30',
    name: '30-Day Plank',
    blurb: 'From a 20-second plank to a 2½-minute one. A rock-steady core for every other skill.',
    decor: 'amethyst_cluster',
    tag: 'Core',
    kind: 'hold',
    exerciseId: 'plank',
    days: ramp(30, 20, 150, 'holdSec'),
  },
  {
    id: 'pushup-30',
    name: '30-Day Push-Up',
    blurb: 'Build from 10 to 60 push-ups a day, split into as many sets as you like.',
    decor: 'potion_trio',
    tag: 'Upper body',
    kind: 'reps',
    exerciseId: 'pushup',
    days: ramp(30, 10, 60, 'reps'),
  },
  {
    id: 'squat-30',
    name: '30-Day Squat',
    blurb: 'From 20 to 100 bodyweight squats a day. Strong legs, happy knees.',
    decor: 'mushroom_lamp',
    tag: 'Lower body',
    kind: 'reps',
    exerciseId: 'bodyweight-squat',
    days: ramp(30, 20, 100, 'reps'),
  },
  {
    id: 'hollow-30',
    name: '30-Day Hollow Body',
    blurb: 'The secret shape behind levers and handstands, from 15 to 60 seconds.',
    decor: 'star_lantern',
    tag: 'Core',
    kind: 'hold',
    exerciseId: 'hollow-hold',
    days: ramp(30, 15, 60, 'holdSec'),
  },
  {
    id: 'handstand-30',
    name: '30-Day Handstand',
    blurb: 'Chest-to-wall handstands from 15 seconds to a full minute.',
    decor: 'orb_garland',
    tag: 'Skills',
    kind: 'hold',
    exerciseId: 'wall-handstand',
    days: ramp(30, 15, 60, 'holdSec'),
  },
  {
    id: 'hang-30',
    name: '30-Day Dead Hang',
    blurb: 'Grip strength and happy shoulders, from 15 to 75 seconds on the bar.',
    decor: 'lantern_string',
    tag: 'Upper body',
    kind: 'hold',
    exerciseId: 'dead-hang',
    days: ramp(30, 15, 75, 'holdSec'),
  },
  {
    id: 'mobility-21',
    name: '21-Day Mobility Ritual',
    blurb: 'A little stretching or joint work every day, from 5 to 15 minutes.',
    decor: 'drying_herbs',
    tag: 'Mobility',
    kind: 'mobility',
    days: ramp(21, 5, 15, 'minutes', 1),
  },
  {
    id: 'burpee-30',
    name: '30-Day Burpee',
    blurb: 'From 5 to 50 burpees a day. A full-body spark for your heart and lungs.',
    decor: 'potion_trio',
    tag: 'Cardio',
    kind: 'reps',
    exerciseId: 'burpee',
    days: ramp(30, 5, 50, 'reps'),
  },
  {
    id: 'jumping-jack-14',
    name: '14-Day Jumping Jacks',
    blurb: 'A gentle cardio habit: from 30 to 150 jumping jacks a day.',
    decor: 'star_lantern',
    tag: 'Cardio',
    kind: 'reps',
    exerciseId: 'jumping-jack',
    days: ramp(14, 30, 150, 'reps', 10),
  },
  {
    id: 'mountain-climber-21',
    name: '21-Day Mountain Climber',
    blurb: 'Core and cardio together, from 20 to 120 climbers a day.',
    decor: 'mushroom_lamp',
    tag: 'Cardio',
    kind: 'reps',
    exerciseId: 'mountain-climber',
    days: ramp(21, 20, 120, 'reps', 10),
  },
  {
    id: 'glute-bridge-30',
    name: '30-Day Glute Bridge',
    blurb: 'From 20 to 100 glute bridges a day. Strong hips, happy back.',
    decor: 'rose_vine',
    tag: 'Lower body',
    kind: 'reps',
    exerciseId: 'glute-bridge',
    days: ramp(30, 20, 100, 'reps'),
  },
  {
    id: 'lunge-30',
    name: '30-Day Lunge',
    blurb: 'Reverse lunges from 10 to 60 a day (count both legs).',
    decor: 'sage_mug',
    tag: 'Lower body',
    kind: 'reps',
    exerciseId: 'reverse-lunge',
    days: ramp(30, 10, 60, 'reps'),
  },
  {
    id: 'wall-sit-30',
    name: '30-Day Wall Sit',
    blurb: 'Burning thighs, iron will: from 20 seconds to 2 minutes.',
    decor: 'pink_lamp',
    tag: 'Lower body',
    kind: 'hold',
    exerciseId: 'wall-sit',
    days: ramp(30, 20, 120, 'holdSec'),
  },
  {
    id: 'calf-raise-21',
    name: '21-Day Calf Raise',
    blurb: 'From 20 to 100 calf raises a day for springy ankles.',
    decor: 'plum_mug',
    tag: 'Lower body',
    kind: 'reps',
    exerciseId: 'calf-raise',
    days: ramp(21, 20, 100, 'reps', 10),
  },
  {
    id: 'row-30',
    name: '30-Day Row',
    blurb: 'Australian rows from 5 to 40 a day: the road to your first pull-up.',
    decor: 'lantern_string',
    tag: 'Upper body',
    kind: 'reps',
    exerciseId: 'australian-row',
    days: ramp(30, 5, 40, 'reps'),
  },
  {
    id: 'negative-pullup-14',
    name: '14-Day Pull-Up Negatives',
    blurb: 'Slow lowering from the bar, 3 to 15 a day. Big strength for your first pull-up.',
    decor: 'moth_garland',
    tag: 'Upper body',
    kind: 'reps',
    exerciseId: 'negative-pullup',
    days: ramp(14, 3, 15, 'reps', 1),
  },
  {
    id: 'dip-30',
    name: '30-Day Bench Dip',
    blurb: 'From 10 to 50 bench dips a day for strong triceps.',
    decor: 'amethyst_cluster',
    tag: 'Upper body',
    kind: 'reps',
    exerciseId: 'bench-dip',
    days: ramp(30, 10, 50, 'reps'),
  },
  {
    id: 'situp-30',
    name: '30-Day Sit-Up',
    blurb: 'From 10 to 60 sit-ups a day.',
    decor: 'drying_herbs',
    tag: 'Core',
    kind: 'reps',
    exerciseId: 'sit-up',
    days: ramp(30, 10, 60, 'reps'),
  },
  {
    id: 'side-plank-21',
    name: '21-Day Side Plank',
    blurb: 'From 15 to 60 seconds per side for strong obliques.',
    decor: 'orb_garland',
    tag: 'Core',
    kind: 'hold',
    exerciseId: 'side-plank',
    days: ramp(21, 15, 60, 'holdSec'),
  },
  {
    id: 'l-sit-30',
    name: '30-Day L-Sit',
    blurb: 'Tuck or full L-sit holds from 5 to 30 seconds.',
    decor: 'star_lantern',
    tag: 'Skills',
    kind: 'hold',
    exerciseId: 'tuck-l-sit',
    days: ramp(30, 5, 30, 'holdSec', 1),
  },
  {
    id: 'crow-21',
    name: '21-Day Crow Pose',
    blurb: 'Balance practice from 5 to 30 seconds. Your first arm balance.',
    decor: 'black_cat',
    tag: 'Skills',
    kind: 'hold',
    exerciseId: 'crow-pose',
    days: ramp(21, 5, 30, 'holdSec', 1),
  },
  {
    id: 'stretch-14',
    name: '14-Day Splits Starter',
    blurb: 'Ten minutes of stretching a day, building to 15.',
    decor: 'rose_vine',
    tag: 'Mobility',
    kind: 'mobility',
    days: ramp(14, 10, 15, 'minutes', 1),
  },
]

export const CHALLENGE_BY_ID: Record<string, ChallengeDef> = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]))
