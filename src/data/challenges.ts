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

export interface ChallengeDef {
  id: string
  name: string
  blurb: string
  decor: string
  kind: 'reps' | 'hold' | 'mobility'
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
    kind: 'hold',
    exerciseId: 'plank',
    days: ramp(30, 20, 150, 'holdSec'),
  },
  {
    id: 'pushup-30',
    name: '30-Day Push-Up',
    blurb: 'Build from 10 to 60 push-ups a day, split into as many sets as you like.',
    decor: 'potion_trio',
    kind: 'reps',
    exerciseId: 'pushup',
    days: ramp(30, 10, 60, 'reps'),
  },
  {
    id: 'squat-30',
    name: '30-Day Squat',
    blurb: 'From 20 to 100 bodyweight squats a day. Strong legs, happy knees.',
    decor: 'mushroom_lamp',
    kind: 'reps',
    exerciseId: 'bodyweight-squat',
    days: ramp(30, 20, 100, 'reps'),
  },
  {
    id: 'hollow-30',
    name: '30-Day Hollow Body',
    blurb: 'The secret shape behind levers and handstands, from 15 to 60 seconds.',
    decor: 'star_lantern',
    kind: 'hold',
    exerciseId: 'hollow-hold',
    days: ramp(30, 15, 60, 'holdSec'),
  },
  {
    id: 'handstand-30',
    name: '30-Day Handstand',
    blurb: 'Chest-to-wall handstands from 15 seconds to a full minute.',
    decor: 'orb_garland',
    kind: 'hold',
    exerciseId: 'wall-handstand',
    days: ramp(30, 15, 60, 'holdSec'),
  },
  {
    id: 'hang-30',
    name: '30-Day Dead Hang',
    blurb: 'Grip strength and happy shoulders, from 15 to 75 seconds on the bar.',
    decor: 'lantern_string',
    kind: 'hold',
    exerciseId: 'dead-hang',
    days: ramp(30, 15, 75, 'holdSec'),
  },
  {
    id: 'mobility-21',
    name: '21-Day Mobility Ritual',
    blurb: 'A little stretching or joint work every day, from 5 to 15 minutes.',
    decor: 'drying_herbs',
    kind: 'mobility',
    days: ramp(21, 5, 15, 'minutes', 1),
  },
]

export const CHALLENGE_BY_ID: Record<string, ChallengeDef> = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]))
