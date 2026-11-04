import { addDays, dateKey, daysBetween, parseDateKey } from './dates'

/**
 * The Yellowstone 2027 program. Each week you sit at a "level". A short
 * weekly check-in moves you up a level, keeps you on the same one, or
 * eases you back, based on how you recovered. Each level up changes one
 * thing only: walk time, incline or pack weight. Every fourth week is
 * lighter, and the last two weeks before the trip taper off.
 */

export type SessionKey = 'strengthA' | 'walkHills' | 'strengthB' | 'easyOutdoor'
export const SESSION_KEYS: SessionKey[] = ['strengthA', 'walkHills', 'strengthB', 'easyOutdoor']
export const SESSION_NAMES: Record<SessionKey, string> = {
  strengthA: 'Strength A',
  walkHills: 'Walk & hills',
  strengthB: 'Strength B + walk',
  easyOutdoor: 'Easy outdoors + mobility',
}
/** Default weekdays (0 = Sunday): Monday, Tuesday, Friday, Saturday. */
export const DEFAULT_DAYS: Record<SessionKey, number> = { strengthA: 1, walkHills: 2, strengthB: 5, easyOutdoor: 6 }

export type Phase = 'foundation' | 'build' | 'trail' | 'rehearsal' | 'taper'
export const PHASES: Record<Phase, { name: string; text: string }> = {
  foundation: { name: 'Foundation', text: 'Short, easy walks and simple strength. Building the habit is the whole goal.' },
  build: { name: 'Build', text: 'Longer walks and gentle hills. Still at a pace where you can chat.' },
  trail: { name: 'Trail-ready', text: 'Longer weekend walks with a light daypack, more hills and controlled downhill practice.' },
  rehearsal: { name: 'Rehearsal', text: 'Walking two days in a row, like sightseeing days on the trip.' },
  taper: { name: 'Lighter weeks', text: 'Easing off so you arrive rested. Keep moving, just less.' },
}

export interface WalkPlan {
  minutes: number
  /** Talk-test effort out of 10. */
  effort: string
  terrain: string
  inclinePct: number
  packLb: number
  stepDowns?: string
}

export interface LevelState {
  level: number
  walkMin: number
  longMin: number
  inclinePct: number
  packLb: number
  backToBack: boolean
}

/** Walk time, incline and pack for a level. One demand goes up per level. */
export function levelState(level: number, baselineMin: number): LevelState {
  const s: LevelState = { level: 1, walkMin: baselineMin, longMin: baselineMin + 5, inclinePct: 0, packLb: 0, backToBack: false }
  for (let n = 2; n <= level; n++) {
    s.level = n
    if (n >= 6 && n % 3 === 0 && s.inclinePct < 8) s.inclinePct += 1
    else if (n >= 16 && n % 4 === 0 && s.packLb < 10) s.packLb = s.packLb === 0 ? 5 : Math.min(10, s.packLb + 2.5)
    else {
      s.walkMin = Math.min(60, s.walkMin + 5)
      s.longMin = Math.min(180, s.longMin + (s.longMin < 60 ? 5 : 15))
    }
  }
  s.backToBack = level >= 22
  return s
}

export function phaseOf(level: number, weeksToTrip: number): Phase {
  if (weeksToTrip <= 2) return 'taper'
  return level <= 7 ? 'foundation' : level <= 15 ? 'build' : level <= 21 ? 'trail' : 'rehearsal'
}

export const mondayOf = (key: string) => addDays(key, -((parseDateKey(key).getDay() + 6) % 7))

export function weeksUntil(tripDate: string, today = dateKey()): number {
  return Math.max(0, Math.ceil(daysBetween(mondayOf(today), tripDate) / 7))
}

/** Every fourth week since the start is a lighter week. */
export function isEasyWeek(startDate: string, monday: string): boolean {
  const n = Math.floor(daysBetween(mondayOf(startDate), monday) / 7)
  return n > 0 && (n + 1) % 4 === 0
}

/* ── Workouts ──────────────────────────────────────────────────────── */

export interface PlanExercise {
  id: string
  sets: number
  reps?: string
  holdSec?: number
  restSec: number
  note?: string
  /** Easier swap and why. */
  easier: { id: string; note: string }
  /** Numbers to pre-fill when you start the workout. */
  startReps?: number
}

export interface Session {
  key: SessionKey
  title: string
  kind: 'strength' | 'walk' | 'mobility'
  minutes: string
  warmUp: string[]
  walk?: WalkPlan
  exercises: PlanExercise[]
  /** Low-energy or busy-day version. */
  short: string
  shortExercises: PlanExercise[]
  progress: { up: string; repeat: string; back: string }
  note?: string
}

const STRENGTH_RULES = {
  up: 'When every set reaches the top of the rep range with good form and 2–3 reps still in the tank, use the next weight up next time.',
  repeat: 'If the last reps were a grind or form slipped, keep the same weight.',
  back: 'If anything hurts (not just works), drop the weight, shorten the range or use the easier swap.',
}
const WALK_RULES = {
  up: 'Ready for more if you could talk in full sentences, effort felt 3–5 out of 10, and you felt fine the next day.',
  repeat: 'Repeat the same walk if effort hit 6–7 or you were sore the next day.',
  back: 'Cut it by a quarter if you had pain, limped, felt dizzy or unusually tired, or were very sore.',
}
const EFFORT = '3–5 out of 10: you can talk in full sentences'
const STRENGTH_WARMUP = ['5 minutes of easy walking or cycling', 'Ankle circles, leg swings and hip circles, 10 each', '10 slow sit-to-stands from a chair']
const WALK_WARMUP = ['Start with 3–5 minutes of slow, easy walking', 'Ankle circles and leg swings, 10 each']
export const START_WEIGHT_TIP = 'Choose a weight you could lift about 4 more times than the reps listed. It should feel steady, not heavy.'

export interface WeekPlan {
  monday: string
  level: number
  phase: Phase
  easy: boolean
  state: LevelState
  sessions: Session[]
}

export function weekPlan(level: number, baselineMin: number, startDate: string, tripDate: string, monday: string): WeekPlan {
  const weeksLeft = weeksUntil(tripDate, monday)
  const phase = phaseOf(level, weeksLeft)
  const easy = phase !== 'taper' && isEasyWeek(startDate, monday)
  const st = levelState(level, baselineMin)
  const scale = phase === 'taper' ? (weeksLeft <= 1 ? 0.5 : 0.7) : easy ? 0.75 : 1
  const mins = (m: number) => Math.max(10, Math.round((m * scale) / 5) * 5)
  const sets = Math.max(1, (level <= 4 ? 2 : 3) - (easy || phase === 'taper' ? 1 : 0))
  const ex = (id: string, reps: string, restSec: number, easier: PlanExercise['easier'], extra: Partial<PlanExercise> = {}): PlanExercise => ({
    id,
    sets,
    reps,
    restSec,
    easier,
    startReps: Number(reps.split('–')[0]) || undefined,
    ...extra,
  })

  const strengthA: Session = {
    key: 'strengthA',
    title: 'Strength A: legs, back & balance',
    kind: 'strength',
    minutes: '35–45 min · short version 15 min',
    warmUp: STRENGTH_WARMUP,
    exercises: [
      ex('goblet-squat', '8–12', 90, { id: 'sit-to-stand', note: 'Sit to a chair and stand, hands on thighs if needed' }, { note: 'Hold a dumbbell or kettlebell at your chest. Sit back to a box or chair, only as low as your knees are happy.' }),
      ex('db-romanian-deadlift', '8–12', 90, { id: 'glute-bridge', note: 'Glute bridge on the floor' }, { note: 'Soft knees, push your hips back, flat back.' }),
      ex('step-up', '6–10 each leg', 75, { id: 'step-up', note: 'Use a lower step (4″) and hold a rail' }, { note: 'A 6–8″ step. Push through the whole front foot.' }),
      ex('db-row', '8–12 each arm', 60, { id: 'band-row', note: 'Band row' }),
      ex('calf-raise', '10–15', 60, { id: 'calf-raise', note: 'Both feet, holding a wall' }, { note: 'Hold a wall. Slow on the way down.' }),
      ex('dead-bug', '6–10 each side', 45, { id: 'dead-bug', note: 'Keep knees bent and tap heels only' }),
      { id: 'single-leg-balance', sets: 2, holdSec: 30, restSec: 20, easier: { id: 'tandem-balance', note: 'Heel-to-toe stance' }, note: 'Next to a counter. Light fingertip touch is fine.' },
    ],
    short: 'Busy day: warm up, then 2 rounds of goblet squats, Romanian deadlifts and rows. About 15 minutes.',
    shortExercises: [],
    progress: STRENGTH_RULES,
  }
  strengthA.shortExercises = strengthA.exercises.slice(0, 2).concat(strengthA.exercises[3]).map((e) => ({ ...e, sets: 2 }))

  const hill = st.inclinePct
  const walkHills: Session = {
    key: 'walkHills',
    title: 'Walk & hills',
    kind: 'walk',
    minutes: `${mins(st.walkMin) + 5} min · short version 15 min`,
    warmUp: WALK_WARMUP,
    walk: {
      minutes: mins(st.walkMin),
      effort: EFFORT,
      terrain: hill
        ? `Treadmill: alternate 3 minutes at ${hill}% incline with 2 minutes flat. Outdoors: a route with gentle hills. Stairs work too.`
        : 'Flat and easy: a treadmill, track or sidewalk.',
      inclinePct: hill,
      packLb: 0,
      stepDowns: level >= 3 ? `Then step-down practice: ${sets} × 6–8 each leg from a 4–6″ step, 3 seconds down` : undefined,
    },
    exercises: level >= 3 ? [{ id: 'step-down', sets, reps: '6–8 each leg', restSec: 45, easier: { id: 'step-down', note: 'Use a 2–4″ step and hold a rail' }, note: 'Lower slowly, knee over toes. This trains downhill control.' }] : [],
    short: 'Busy day: 15 minutes of easy walking, flat or a gentle hill. Skip the step-downs.',
    shortExercises: [],
    progress: WALK_RULES,
  }

  const fri = st.backToBack ? Math.round(st.longMin * 0.5) : Math.max(10, Math.round(st.walkMin * 0.5))
  const strengthB: Session = {
    key: 'strengthB',
    title: 'Strength B + walk',
    kind: 'strength',
    minutes: `${30 + mins(fri)} min · short version 20 min`,
    warmUp: STRENGTH_WARMUP,
    walk: {
      minutes: mins(fri),
      effort: EFFORT,
      terrain: st.backToBack ? 'Outdoors if you can: this is day one of your back-to-back weekend.' : 'Any easy route, after the strength work or later in the day.',
      inclinePct: 0,
      packLb: st.backToBack ? st.packLb : 0,
    },
    exercises: [
      ex('kb-deadlift', '8–12', 90, { id: 'glute-bridge', note: 'Glute bridge' }, { note: 'Kettlebell between your feet. Hinge, flat back, stand tall.' }),
      ex('split-squat', '6–10 each leg', 75, { id: 'sit-to-stand', note: 'Sit-to-stand from a chair' }, { note: 'Hold a support. Short range is fine; go only as low as is comfortable.' }),
      ex('db-floor-press', '8–12', 60, { id: 'incline-pushup', note: 'Incline push-up on a counter' }),
      ex('lat-pulldown', '8–12', 60, { id: 'band-row', note: 'Band row' }),
      ex('suitcase-carry', '30–40 steps each side', 60, { id: 'suitcase-carry', note: 'Use a lighter weight' }, { note: 'One dumbbell, walk tall, don’t lean.', startReps: 30 }),
      { id: 'side-plank', sets, holdSec: 20, restSec: 30, easier: { id: 'side-plank', note: 'Knees bent, or against a wall' } },
      { id: 'tandem-balance', sets: 2, holdSec: 30, restSec: 20, easier: { id: 'tandem-balance', note: 'Hold a counter lightly' } },
    ],
    short: 'Busy day: 2 rounds of kettlebell deadlifts, split squats and carries, then a 10-minute walk.',
    shortExercises: [],
    progress: STRENGTH_RULES,
  }
  strengthB.shortExercises = [strengthB.exercises[0], strengthB.exercises[1], strengthB.exercises[4]].map((e) => ({ ...e, sets: 2 }))

  const easyOutdoor: Session = {
    key: 'easyOutdoor',
    title: 'Easy outdoors + riding mobility',
    kind: 'mobility',
    minutes: `${mins(st.longMin) + 10} min · short version 20 min`,
    warmUp: WALK_WARMUP,
    walk: {
      minutes: mins(st.longMin),
      effort: '3–4 out of 10: relaxed, sightseeing pace',
      terrain: 'Outdoors on paths, gravel or grass if you can, like walking between viewpoints. Take breaks whenever you like.',
      inclinePct: 0,
      packLb: st.packLb,
    },
    exercises: [
      { id: 'cat-cow', sets: 1, reps: '8', restSec: 0, easier: { id: 'cat-cow', note: 'Seated version in a chair' } },
      { id: 'ninety-ninety', sets: 1, reps: '6 each side', restSec: 0, easier: { id: 'seated-glute-stretch', note: 'Figure-four stretch in a chair' } },
      { id: 'butterfly-stretch', sets: 1, holdSec: 45, restSec: 0, easier: { id: 'butterfly-stretch', note: 'Sit on a cushion' } },
      { id: 'adductor-stretch', sets: 1, holdSec: 30, restSec: 0, easier: { id: 'adductor-stretch', note: 'Smaller step to the side' } },
      { id: 'hip-flexor-stretch', sets: 1, holdSec: 45, restSec: 0, easier: { id: 'hip-flexor-stretch', note: 'Standing, hand on a wall' } },
      { id: 'thoracic-rotation', sets: 1, reps: '6 each side', restSec: 0, easier: { id: 'thoracic-rotation', note: 'Seated twist' } },
      { id: 'single-leg-balance', sets: 2, holdSec: 30, restSec: 15, easier: { id: 'tandem-balance', note: 'Heel-to-toe stance' } },
    ],
    short: 'Busy day: a 15-minute easy walk and three stretches: butterfly, hip flexor and cat-cow.',
    shortExercises: [],
    progress: WALK_RULES,
    note: 'The hip and inner-thigh work helps you sit a saddle more comfortably. It doesn’t replace riding instruction: follow your guide’s lessons and safety rules.',
  }
  easyOutdoor.shortExercises = [easyOutdoor.exercises[2], easyOutdoor.exercises[4], easyOutdoor.exercises[0]]

  return { monday, level, phase, easy, state: st, sessions: [strengthA, walkHills, strengthB, easyOutdoor] }
}

/* ── Logs and the weekly check-in ──────────────────────────────────── */

export interface SessionLog {
  date: string
  session: SessionKey
  status: 'done' | 'short' | 'skipped'
  /** 1–10 perceived effort. */
  effort?: number
  /** 0–10 soreness. */
  soreness?: number
  pain?: boolean
}

export type Decision = 'progress' | 'repeat' | 'ease'

export function weeklyDecision(logs: SessionLog[], easyWeek: boolean): { decision: Decision; why: string } {
  const done = logs.filter((l) => l.status !== 'skipped')
  if (logs.some((l) => l.pain)) return { decision: 'ease', why: 'You noted pain, so we’ll ease back a step. If it keeps up, get it checked.' }
  const maxSore = Math.max(0, ...logs.map((l) => l.soreness ?? 0))
  const hard = done.filter((l) => (l.effort ?? 0) >= 7).length
  if (maxSore >= 7 || hard >= 2) return { decision: 'ease', why: 'That week was tough on your body. One step back lets you recover and come back stronger.' }
  if (done.length < 3) return { decision: 'repeat', why: 'Life happened! Repeating the week lets you finish it without doubling up.' }
  if (maxSore >= 5 || hard === 1) return { decision: 'repeat', why: 'Some sessions felt hard. Repeating the week lets it feel easier before adding more.' }
  if (easyWeek) return { decision: 'repeat', why: 'That was a lighter week by design. Next week picks up where you left off.' }
  return { decision: 'progress', why: 'You handled the week well. Next week adds one small step.' }
}

export function applyDecision(level: number, d: Decision): number {
  return d === 'progress' ? level + 1 : d === 'ease' ? Math.max(1, level - 1) : level
}

/* ── Weight ────────────────────────────────────────────────────────── */

/** 7-day average weight for each day with a weigh-in, to smooth out daily water swings. */
export function weightTrend(entries: { date: string; kg: number }[]): { date: string; avgKg: number }[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((e) => {
    const window = sorted.filter((x) => x.date <= e.date && x.date > addDays(e.date, -7))
    return { date: e.date, avgKg: window.reduce((n, x) => n + x.kg, 0) / window.length }
  })
}

export interface FoodPlanInput {
  sex: 'male' | 'female'
  age: number
  heightCm: number
  weightKg: number
  /** Activity multiplier, e.g. 1.375 for light activity. */
  activity: number
  /** Daily calorie deficit. */
  deficit: number
  /** Protein per kg of the reference weight. */
  proteinPerKg: number
  /** Weight used for protein: your goal or riding target, not your current weight. */
  referenceKg: number
}

/** Mifflin-St Jeor maintenance minus a modest deficit; never below 1,200 (women) or 1,500 (men). */
export function foodPlan(i: FoodPlanInput) {
  const bmr = 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.age + (i.sex === 'male' ? 5 : -161)
  const maintenance = Math.round((bmr * i.activity) / 10) * 10
  const floor = i.sex === 'male' ? 1500 : 1200
  const kcal = Math.max(floor, Math.round((maintenance - i.deficit) / 10) * 10)
  return { maintenance, kcal, floor, protein: Math.round(i.proteinPerKg * i.referenceKg), weeklyKgEstimate: ((maintenance - kcal) * 7) / 7700 }
}
