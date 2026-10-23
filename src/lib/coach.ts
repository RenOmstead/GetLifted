import { LADDERS, type Ladder } from '../data/ladders'
import { SKILLS, targetLabel } from '../data/skills'
import type { RoutineEntry, SetEntry, SkillMark, Units, Workout } from '../db/types'
import { addDays, dateKey, daysBetween, formatDayLabel, formatSeconds } from './dates'
import type { ExerciseInfo } from './exercises'
import { skillProgress } from './progression'
import { KG_PER_LB, fmt, kgToDisplay, weightUnit } from './units'
import { e1rm } from './workouts'

/**
 * The coach reads your recent workouts and suggests what to try next:
 * a new skill level, the next rung of a "10 of these → 1 of those" ladder,
 * more weight when you hit all your reps, or a nudge when you're close.
 */
export type SuggestionKind = 'level-up' | 'ladder' | 'add-weight' | 'almost' | 'comeback' | 'start'

export interface Suggestion {
  id: string
  kind: SuggestionKind
  title: string
  detail: string
  /** What "Try it" adds to a workout. */
  entry?: RoutineEntry
}

type Get = (id: string) => ExerciseInfo

interface DoneSet extends SetEntry {
  exerciseId: string
  date: string
}

export const RECENT_DAYS = 10

export function whenLabel(date: string, today: string): string {
  const label = formatDayLabel(date, today)
  return label === 'Today' || label === 'Yesterday' ? label.toLowerCase() : `on ${label}`
}

function setsOf(workouts: Workout[]): DoneSet[] {
  return workouts
    .filter((w) => w.endedAt != null)
    .flatMap((w) => w.entries.flatMap((e) => e.sets.filter((s) => s.done).map((s) => ({ ...s, exerciseId: e.exerciseId, date: w.date }))))
}

const PROPER = new Set(['Romanian', 'Bulgarian', 'Australian', 'German', 'Arnold', 'Russian', 'Turkish', 'Copenhagen', 'Nordic', 'Jefferson', 'Zercher'])

/** An exercise name inside a sentence: lower case, except words like "Romanian". */
export const lowerName = (name: string) =>
  name
    .split(' ')
    .map((w) => (PROPER.has(w) ? w : w.toLowerCase()))
    .join(' ')

/** "push-up" → "push-ups", "bench press" → "bench presses". */
export const plural = (name: string) => (/(s|sh|ch|x)$/.test(name) ? `${name}es` : `${name}s`)

const amount = (n: number | null | undefined, hold: boolean) => (hold ? formatSeconds(n ?? 0) : `${n ?? 0}`)

/** Whether a set clears a ladder's threshold. */
export function meetsLadder(l: Ladder, s: SetEntry, bodyKg: number | null): boolean {
  if (l.holdSec != null) return (s.durationSec ?? 0) >= l.holdSec
  if ((s.reps ?? 0) < (l.reps ?? Infinity)) return false
  if (l.bwRatio != null) return bodyKg != null && (s.weightKg ?? 0) >= l.bwRatio * bodyKg
  return true
}

/** True once you've done at least one real rep or a 3-second hold of an exercise. */
export function hasDone(sets: DoneSet[], exerciseId: string): boolean {
  return sets.some((s) => s.exerciseId === exerciseId && ((s.reps ?? 0) >= 1 || (s.durationSec ?? 0) >= 3))
}

export function ladderText(l: Ladder, get: Get, units: Units, bodyKg: number | null): string {
  const from = get(l.from)
  const to = get(l.to)
  const side = from.perSide ? ' per side' : ''
  if (l.holdSec != null) return `If you can hold a ${from.name} for ${l.holdSec} seconds, you’re ready to try a ${to.name}.`
  if (l.bwRatio != null) {
    const load = bodyKg ? `${fmt(kgToDisplay(l.bwRatio * bodyKg, units), 0)} ${weightUnit(units)}` : `${Math.round(l.bwRatio * 100)}% of your body weight`
    return `If you can ${lowerName(from.name)} ${load} for ${l.reps} reps, you can likely do a ${lowerName(to.name)}.`
  }
  const toName = lowerName(to.name)
  return `If you can do ${l.reps} ${plural(lowerName(from.name))}${side}, you can likely do ${l.start.reps === 1 ? `one ${toName}` : `a few ${plural(toName)}`}.`
}

const startLabel = (start: Ladder['start']) => (start.holdSec != null ? `${start.sets} × ${start.holdSec}s` : `${start.sets} × ${start.reps}`)

const isLower = (ex: ExerciseInfo) => ex.id.includes('deadlift') || ex.muscles.some((m) => ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(m))

/** Weight to add next time: 5 lb / 2.5 kg for upper body, 10 lb / 5 kg for legs and hips. */
export function weightStepKg(ex: ExerciseInfo, units: Units): number {
  const lower = isLower(ex)
  return units === 'imperial' ? (lower ? 10 : 5) * KG_PER_LB : lower ? 5 : 2.5
}

export interface CoachInput {
  workouts: Workout[]
  marks: SkillMark[]
  get: Get
  units: Units
  bodyKg: number | null
  /** Target reps per exercise from your routines (double progression). */
  routineReps?: Record<string, number>
  today?: string
}

export function coachSuggestions({ workouts, marks, get, units, bodyKg, routineReps = {}, today = dateKey() }: CoachInput): Suggestion[] {
  const all = setsOf(workouts)
  const since = addDays(today, -RECENT_DAYS)
  const recent = all.filter((s) => s.date >= since)
  const out: Suggestion[] = []
  const suggestedTargets = new Set<string>()

  // 1. A skill level unlocked recently → introduce the next one.
  for (const skill of SKILLS) {
    const p = skillProgress(skill, workouts, marks)
    p.levels.forEach((lp, i) => {
      if (lp.achievedAt == null || lp.manual) return
      const date = dateKey(lp.achievedAt)
      const next = skill.levels[i + 1]
      if (date < since || !next || p.levels[i + 1].achievedAt != null) return
      const lvl = skill.levels[i]
      const nextEx = get(next.exerciseId)
      const startHold = next.holdSec != null ? Math.max(3, Math.round(next.holdSec / 3)) : undefined
      const startReps = next.reps != null ? Math.max(1, Math.round(next.reps / 3)) : undefined
      suggestedTargets.add(next.exerciseId)
      out.push({
        id: `level-${skill.id}-${i}`,
        kind: 'level-up',
        title: `Level up: ${skill.name} ✦`,
        detail: `You hit ${targetLabel(lvl)} ${lowerName(get(lvl.exerciseId).name)} ${whenLabel(date, today)}. Next on your path is ${nextEx.name}. Start gently with ${next.sets} × ${startHold != null ? `${startHold}s` : startReps} and build toward ${targetLabel(next)}.`,
        entry: { exerciseId: next.exerciseId, sets: next.sets, reps: startReps ?? null, durationSec: startHold ?? null },
      })
    })
  }

  // 2. "If you can do 10 of these, you can do 1 of those."
  for (const l of LADDERS) {
    if (suggestedTargets.has(l.to) || hasDone(all, l.to)) continue
    const hit = recent.filter((s) => s.exerciseId === l.from && meetsLadder(l, s, bodyKg)).sort((a, b) => b.date.localeCompare(a.date))[0]
    if (!hit) continue
    const from = get(l.from)
    const hold = l.holdSec != null
    suggestedTargets.add(l.to)
    out.push({
      id: `ladder-${l.from}-${l.to}`,
      kind: 'ladder',
      title: `Ready for ${get(l.to).name}?`,
      detail: `You did ${amount(hold ? hit.durationSec : hit.reps, hold)}${hold ? '' : ` ${(hit.reps ?? 0) === 1 ? lowerName(from.name) : plural(lowerName(from.name))}`}${hold ? ` in a ${lowerName(from.name)}` : ''} ${whenLabel(hit.date, today)}. ${ladderText(l, get, units, bodyKg)} Try ${startLabel(l.start)} today.`,
      entry: { exerciseId: l.to, sets: l.start.sets, reps: l.start.reps ?? null, durationSec: l.start.holdSec ?? null },
    })
  }

  // 3. Loaded lifts: every set hit its reps → add a little weight (double progression).
  const byExercise = new Map<string, DoneSet[]>()
  for (const s of recent) {
    const ex = get(s.exerciseId)
    if (ex.track !== 'weighted' || !s.weightKg) continue
    byExercise.set(s.exerciseId, [...(byExercise.get(s.exerciseId) ?? []), s])
  }
  for (const [exerciseId, sets] of byExercise) {
    const lastDate = sets.map((s) => s.date).sort().at(-1)!
    const session = sets.filter((s) => s.date === lastDate)
    const top = Math.max(...session.map((s) => s.weightKg ?? 0))
    const working = session.filter((s) => (s.weightKg ?? 0) >= top - 0.01)
    const target = routineReps[exerciseId] ?? 8
    if (working.length < 2 || !working.every((s) => (s.reps ?? 0) >= target)) continue
    const ex = get(exerciseId)
    const next = top + weightStepKg(ex, units)
    const reps = Math.min(...working.map((s) => s.reps ?? 0))
    out.push({
      id: `weight-${exerciseId}`,
      kind: 'add-weight',
      title: `Go a little heavier on ${ex.name}`,
      detail: `${whenLabel(lastDate, today).replace(/^./, (c) => c.toUpperCase())} you got ${working.length} × ${reps} at ${fmt(kgToDisplay(top, units))} ${weightUnit(units)}, every rep of your ${target}-rep target (that’s about a ${fmt(kgToDisplay(e1rm(top, reps), units), 0)} ${weightUnit(units)} max). Try ${fmt(kgToDisplay(next, units))} ${weightUnit(units)} for ${working.length} × ${target} next time.`,
      entry: { exerciseId, sets: working.length, reps: target, weightKg: next },
    })
  }

  // 4. So close: the current level hit its target in all but one set.
  for (const skill of SKILLS) {
    const p = skillProgress(skill, workouts, marks)
    const lvl = skill.levels[p.current]
    if (!lvl || suggestedTargets.has(lvl.exerciseId)) continue
    const lp = p.levels[p.current]
    const recentSets = recent.filter((s) => s.exerciseId === lvl.exerciseId)
    if (!recentSets.length || lp.bestQualifying < lvl.sets - 1 || lp.bestQualifying === 0) continue
    const last = recentSets.map((s) => s.date).sort().at(-1)!
    out.push({
      id: `almost-${skill.id}`,
      kind: 'almost',
      title: `So close on ${get(lvl.exerciseId).name}`,
      detail: `${lp.bestQualifying} of ${lvl.sets} sets hit the goal (${targetLabel(lvl)}), most recently ${whenLabel(last, today)}. One more good session unlocks the next level of ${skill.name}.`,
      entry: { exerciseId: lvl.exerciseId, sets: lvl.sets, reps: lvl.reps ?? null, durationSec: lvl.holdSec ?? null },
    })
  }

  // 5. Nudges when there's nothing recent.
  const lastWorkout = workouts.filter((w) => w.endedAt != null).map((w) => w.date).sort().at(-1)
  if (!lastWorkout) {
    out.push({
      id: 'start',
      kind: 'start',
      title: 'Begin your story ✦',
      detail: 'Pick a path on the Path page, or start a starter routine. Your first workout earns your first badge.',
    })
  } else if (daysBetween(lastWorkout, today) >= 4) {
    out.push({
      id: 'comeback',
      kind: 'comeback',
      title: 'Welcome back ✦',
      detail: `It’s been ${daysBetween(lastWorkout, today)} days since your last workout. Even a short session today relights your streak.`,
    })
  }

  const rank: Record<SuggestionKind, number> = { 'level-up': 0, ladder: 1, 'add-weight': 2, almost: 3, comeback: 4, start: 5 }
  return out.sort((a, b) => rank[a.kind] - rank[b.kind])
}

/* ── Strength helpers ─────────────────────────────────────────────── */

/** Weights you could likely lift for each rep count, from an estimated one-rep max (Epley). */
export function repMaxTable(oneRm: number, reps = [1, 3, 5, 8, 10, 12]) {
  return reps.map((r) => ({ reps: r, weightKg: r === 1 ? oneRm : oneRm / (1 + r / 30) }))
}
