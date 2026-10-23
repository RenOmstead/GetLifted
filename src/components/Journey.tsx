import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { db } from '../db/db'
import { useSettings } from '../db/settings'
import type { RoutineEntry } from '../db/types'
import { coachSuggestions, type Suggestion } from '../lib/coach'
import { dateKey } from '../lib/dates'
import { useExercises, type ExerciseInfo } from '../lib/exercises'
import { activeDays, bestStreak, currentStreak, levelFromXp, totalXp } from '../lib/gamify'
import { workoutWith } from '../lib/workoutActions'
import { ExerciseThumb } from './ExerciseVisual'
import { HowToSheet } from './HowTo'
import { Icon } from './Icon'
import { Meter } from './Ring'

/** Everything the gamified pages read: workouts, marks, fasts, challenges, plus streak and XP. */
export function useJourney() {
  const { get } = useExercises()
  const workouts = useLiveQuery(() => db.workouts.toArray(), [])
  const marks = useLiveQuery(() => db.skillMarks.toArray(), []) ?? []
  const fasts = useLiveQuery(() => db.fasts.toArray(), []) ?? []
  const joins = useLiveQuery(() => db.challenges.toArray(), []) ?? []
  const today = dateKey()
  const ws = workouts ?? []
  const days = activeDays(ws)
  const xp = totalXp({ workouts: ws, fasts, marks, joins, get }, today)
  return {
    loaded: workouts != null,
    workouts: ws,
    marks,
    fasts,
    joins,
    get,
    today,
    days,
    streak: currentStreak(days, today),
    best: bestStreak(days),
    xp,
    level: levelFromXp(xp),
  }
}

/** The coach's suggestions from recent workouts, routines and your latest weight. */
export function useCoach(journey: ReturnType<typeof useJourney>): Suggestion[] {
  const settings = useSettings()
  const latest = useLiveQuery(() => db.weights.orderBy('date').last(), [])
  const routines = useLiveQuery(() => db.routines.toArray(), []) ?? []
  const routineReps: Record<string, number> = {}
  for (const r of routines) for (const e of r.entries) if (e.reps) routineReps[e.exerciseId] = e.reps
  if (!journey.loaded) return []
  return coachSuggestions({
    workouts: journey.workouts,
    marks: journey.marks,
    get: journey.get,
    units: settings.units,
    bodyKg: latest?.kg ?? null,
    routineReps,
    today: journey.today,
  })
}

/** Adds exercises to the current workout (or starts one) and opens it. */
export function useTryNow() {
  const navigate = useNavigate()
  return async (entries: RoutineEntry[], name: string) => navigate(`/train/workout/${await workoutWith(entries, name)}`)
}

/** Streak flame, level and XP toward the next level. */
export function XpStrip({ journey }: { journey: ReturnType<typeof useJourney> }) {
  const { level, xp, streak } = journey
  return (
    <div className="xp-strip">
      <div className={`streak ${streak ? 'lit' : ''}`} aria-label={`${streak}-day streak`}>
        <Icon name="flame" size={22} />
        <strong className="num">{streak}</strong>
        <span className="tiny">day{streak === 1 ? '' : 's'}</span>
      </div>
      <div className="grow stack-sm" style={{ gap: 4 }}>
        <div className="row-between tiny">
          <span className="level-pill">
            <Icon name="star" size={13} /> Level {level.level}
          </span>
          <span className="num">
            {xp - level.levelStart} / {level.nextLevel - level.levelStart} XP
          </span>
        </div>
        <Meter value={xp - level.levelStart} max={level.nextLevel - level.levelStart} />
      </div>
    </div>
  )
}

const KIND_ICON: Record<Suggestion['kind'], string> = {
  'level-up': '🌟',
  ladder: '🪜',
  'add-weight': '🏋️',
  almost: '✨',
  comeback: '🕯️',
  start: '🌙',
}

/** "I see you did this yesterday, try this today" cards from the coach. */
export function CoachCard({ suggestions, limit = 3, title = 'Your coach suggests' }: { suggestions: Suggestion[]; limit?: number; title?: string }) {
  const tryNow = useTryNow()
  const { get } = useExercises()
  const [howTo, setHowTo] = useState<ExerciseInfo | null>(null)
  if (!suggestions.length) return null
  return (
    <div className="card coach">
      <div className="card-title">
        <span className="coach-owl" aria-hidden="true">
          🦉
        </span>
        {title}
      </div>
      <div className="stack">
        {suggestions.slice(0, limit).map((s) => {
          const ex = s.entry ? get(s.entry.exerciseId) : null
          return (
            <div key={s.id} className="coach-tip">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                {ex ? (
                  <button className="plain" onClick={() => setHowTo(ex)} aria-label={`How to do ${ex.name}`}>
                    <ExerciseThumb exercise={ex} />
                  </button>
                ) : (
                  <span className="coach-kind" aria-hidden="true">
                    {KIND_ICON[s.kind]}
                  </span>
                )}
                <div className="grow">
                  <div className="coach-title">{s.title}</div>
                  <p className="small text-2">{s.detail}</p>
                </div>
              </div>
              {s.entry && ex && (
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn sm ghost" onClick={() => setHowTo(ex)}>
                    How to
                  </button>
                  <button className="btn sm primary" onClick={() => void tryNow([s.entry!], ex.name)}>
                    <Icon name="play" size={14} /> Try it now
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <HowToSheet exercise={howTo} onClose={() => setHowTo(null)} />
    </div>
  )
}
