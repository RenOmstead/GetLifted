import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { CHALLENGE_BY_ID, CHALLENGES } from '../data/challenges'
import { STARTER_ROUTINES } from '../data/starterRoutines'
import { db } from '../db/db'
import { useSettings } from '../db/settings'
import type { Routine } from '../db/types'
import { challengeEntries, challengeStatus, dayTarget, dayText } from '../lib/gamify'
import { startWorkout, useActiveWorkout } from '../lib/workoutActions'
import { Decor } from './Decor'
import { ExerciseThumb } from './ExerciseVisual'
import { Icon } from './Icon'
import { useJourney, useTryNow } from './Journey'
import { Sheet } from './Sheet'

/** One big button to get training: today's plan, any routine, a starter, or an empty workout. */
export function QuickStart() {
  const navigate = useNavigate()
  const settings = useSettings()
  const active = useActiveWorkout()
  const routines = useLiveQuery(() => db.routines.orderBy('name').toArray(), []) ?? []
  const [open, setOpen] = useState(false)
  if (active) return null
  const todayIds = settings.weeklyPlan[new Date().getDay()] ?? []
  const planned = todayIds.map((id) => routines.find((r) => r.id === id)).filter((r): r is Routine => !!r)
  const others = routines.filter((r) => !todayIds.includes(r.id!))

  const start = async (routine?: Routine) => {
    setOpen(false)
    navigate(`/train/workout/${await startWorkout(routine)}`)
  }
  const startStarter = async (i: number) => {
    const s = STARTER_ROUTINES[i]
    const id = await db.routines.add({ name: s.name, entries: s.entries, createdAt: Date.now() })
    await start({ id, name: s.name, entries: s.entries, createdAt: Date.now() })
  }

  return (
    <>
      <button className="btn primary lg block quick-start" onClick={() => (planned.length === 1 ? void start(planned[0]) : setOpen(true))}>
        <Icon name="play" size={18} /> {planned.length === 1 ? `Start ${planned[0].name}` : 'Start a workout'}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="What are we training?">
        <div className="stack">
          {planned.length > 0 && <RoutineList title="Planned for today" routines={planned} onStart={start} />}
          {others.length > 0 && <RoutineList title={planned.length ? 'Other routines' : 'Your routines'} routines={others} onStart={start} />}
          <button className="btn block" onClick={() => void start()}>
            <Icon name="plus" size={18} /> Empty workout, add exercises as I go
          </button>
          <div className="section-title">
            <h2>Starter routines</h2>
          </div>
          <div className="card flush list">
            {STARTER_ROUTINES.map((s, i) => (
              <button key={s.name} className="list-item" onClick={() => void startStarter(i)}>
                <div className="grow">
                  <div className="title">{s.name}</div>
                  <div className="meta">{s.blurb}</div>
                </div>
                <Icon name="play" size={16} className="muted" />
              </button>
            ))}
          </div>
        </div>
      </Sheet>
    </>
  )
}

function RoutineList({ title, routines, onStart }: { title: string; routines: Routine[]; onStart: (r: Routine) => void }) {
  return (
    <>
      <div className="section-title">
        <h2>{title}</h2>
      </div>
      <div className="card flush list">
        {routines.map((r) => (
          <button key={r.id} className="list-item" onClick={() => onStart(r)}>
            <RoutineThumb routine={r} />
            <div className="grow">
              <div className="title">{r.name}</div>
              <div className="meta">{r.entries.length} exercises</div>
            </div>
            <Icon name="play" size={16} className="muted" />
          </button>
        ))}
      </div>
    </>
  )
}

function RoutineThumb({ routine }: { routine: Routine }) {
  const { get } = useJourney()
  const first = routine.entries[0]
  return first ? <ExerciseThumb exercise={get(first.exerciseId)} /> : <span className="thumb" />
}

/** Today's task for every challenge you've joined, with a one-tap start. */
export function TodayChallenges() {
  const journey = useJourney()
  const tryNow = useTryNow()
  const rows = journey.joins
    .map((j) => {
      const def = CHALLENGE_BY_ID[j.id]
      return def ? challengeStatus(def, j, journey.workouts, journey.get, journey.today) : null
    })
    .filter((s) => s != null && !s.over)
  if (!journey.loaded) return null
  if (!rows.length)
    return (
      <Link to="/quests" className="card card-link row tint-lavender">
        <Decor name="potion_trio" className="decor-inline" />
        <div className="grow">
          <div style={{ fontWeight: 700 }}>Pick a challenge</div>
          <div className="small text-2">{CHALLENGES.length} to choose from, from push-ups to splits.</div>
        </div>
        <Icon name="chevronRight" className="muted" />
      </Link>
    )
  return (
    <div className="card stack-sm tint-lavender">
      <div className="row-between">
        <div className="card-title" style={{ margin: 0 }}>
          <Icon name="trophy" size={18} /> Today’s challenges
        </div>
        <Link className="small" to="/quests">
          All
        </Link>
      </div>
      {rows.map((st) => {
        const day = st!.days[st!.dayIndex]
        const target = dayTarget(day)
        return (
          <div key={st!.def.id} className="row challenge-row">
            <Decor name={st!.def.decor} className="decor-inline" />
            <div className="grow">
              <div style={{ fontWeight: 700 }}>{st!.def.name}</div>
              <div className="small text-2">
                Day {st!.dayIndex + 1} · {day.rest ? 'Rest day ☾' : dayText(st!.def, target)}
              </div>
            </div>
            {day.rest ? null : day.state === 'done' ? (
              <span className="status good">
                <Icon name="check" size={16} /> Done
              </span>
            ) : (
              <button className="btn sm primary" onClick={() => void tryNow(challengeEntries(st!.def, target), st!.def.name)}>
                Do it
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
