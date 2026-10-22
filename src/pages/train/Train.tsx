import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ExerciseThumb } from '../../components/ExerciseVisual'
import { Icon } from '../../components/Icon'
import { Meter } from '../../components/Ring'
import { Sheet } from '../../components/Sheet'
import { STARTER_ROUTINES } from '../../data/starterRoutines'
import { SKILLS, targetLabel } from '../../data/skills'
import { db } from '../../db/db'
import { updateSettings, useSettings } from '../../db/settings'
import type { Routine, Workout } from '../../db/types'
import { addDays, dateKey, formatClock, formatDayLabel, formatDuration, parseDateKey } from '../../lib/dates'
import { useExercises } from '../../lib/exercises'
import { skillProgress } from '../../lib/progression'
import { fmt, kgToDisplay, weightUnit } from '../../lib/units'
import { startWorkout, useActiveWorkout } from '../../lib/workoutActions'
import { workoutStats } from '../../lib/workouts'

type Tab = 'today' | 'routines' | 'skills' | 'history'
const TABS: [Tab, string][] = [
  ['today', 'Today'],
  ['routines', 'Routines'],
  ['skills', 'Skills'],
  ['history', 'History'],
]

/** Weekday indexes (0 = Sunday) in Monday-first order. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function mondayOf(key: string): string {
  const d = parseDateKey(key)
  return addDays(key, -((d.getDay() + 6) % 7))
}

export default function Train() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'today'
  return (
    <div className="page">
      <div className="page-header">
        <h1>Train</h1>
        <Link className="btn sm" to="/library">
          <Icon name="book" size={18} /> Exercise library
        </Link>
      </div>
      <div className="segmented">
        {TABS.map(([t, label]) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setParams({ tab: t }, { replace: true })}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'today' && <TodayTab />}
      {tab === 'routines' && <RoutinesTab />}
      {tab === 'skills' && <SkillsTab />}
      {tab === 'history' && <HistoryTab />}
    </div>
  )
}

export function ActiveWorkoutCard() {
  const active = useActiveWorkout()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active])
  if (!active) return null
  const sets = workoutStats(active).sets
  return (
    <Link className="card card-link row" to={`/train/workout/${active.id}`} style={{ borderColor: 'var(--accent)' }}>
      <Icon name="dumbbell" className="text-2" />
      <div className="grow">
        <div style={{ fontWeight: 650 }}>{active.name} in progress</div>
        <div className="small muted num">
          {formatClock(now - active.startedAt)} · {sets} set{sets === 1 ? '' : 's'} done
        </div>
      </div>
      <span className="btn primary sm">Resume</span>
    </Link>
  )
}

export function RoutineCard({ routine, done, onStart }: { routine: Routine; done?: boolean; onStart: () => void }) {
  const { get } = useExercises()
  return (
    <div className="card stack-sm">
      <div className="row-between">
        <Link to={`/train/routine/${routine.id}`} style={{ color: 'inherit', textDecoration: 'none' }} className="grow">
          <div style={{ fontWeight: 650 }}>{routine.name}</div>
          <div className="small muted">{routine.entries.length} exercises</div>
        </Link>
        {done ? (
          <span className="status good">
            <Icon name="check" size={16} /> Done
          </span>
        ) : (
          <button className="btn primary sm" onClick={onStart}>
            <Icon name="play" size={14} /> Start
          </button>
        )}
      </div>
      <div className="row" style={{ overflowX: 'auto', gap: 6 }}>
        {routine.entries.slice(0, 8).map((e, i) => (
          <ExerciseThumb key={i} exercise={get(e.exerciseId)} />
        ))}
      </div>
    </div>
  )
}

function TodayTab() {
  const navigate = useNavigate()
  const settings = useSettings()
  const routines = useLiveQuery(() => db.routines.toArray(), []) ?? []
  const today = dateKey()
  const monday = mondayOf(today)
  const weekWorkouts = useLiveQuery(() => db.workouts.where('date').between(monday, addDays(monday, 6), true, true).toArray(), [monday]) ?? []
  const [selected, setSelected] = useState(today)
  const weekday = parseDateKey(selected).getDay()
  const planned = (settings.weeklyPlan[weekday] ?? []).map((id) => routines.find((r) => r.id === id)).filter((r): r is Routine => !!r)
  const doneOn = (day: string, routineId?: number) => weekWorkouts.some((w) => w.date === day && w.endedAt != null && (routineId == null || w.routineId === routineId))

  const start = async (routine?: Routine) => navigate(`/train/workout/${await startWorkout(routine)}`)

  return (
    <>
      <ActiveWorkoutCard />
      <div className="week">
        {WEEK_ORDER.map((wd, i) => {
          const day = addDays(monday, i)
          const plannedCount = (settings.weeklyPlan[wd] ?? []).length
          const finished = weekWorkouts.filter((w) => w.date === day && w.endedAt != null).length
          return (
            <button key={day} className={`day ${day === today ? 'today' : ''} ${day === selected ? 'selected' : ''}`} onClick={() => setSelected(day)}>
              <span>{DAY_NAMES[wd].slice(0, 3)}</span>
              <strong style={{ fontSize: '0.95rem' }}>{parseDateKey(day).getDate()}</strong>
              <span className="dots">
                {Array.from({ length: Math.max(plannedCount, finished) }, (_, k) => (
                  <span key={k} className={k < finished ? 'done' : ''} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="section-title">
        <h2>{selected === today ? 'Today’s plan' : `${formatDayLabel(selected)}’s plan`}</h2>
        <Link to="/train?tab=routines">Edit plan</Link>
      </div>
      {planned.length ? (
        planned.map((r) => <RoutineCard key={r.id} routine={r} done={doneOn(selected, r.id)} onStart={() => void start(r)} />)
      ) : (
        <div className="card empty">
          <Icon name="calendar" size={30} />
          <p>Nothing planned{selected === today ? ' today' : ''}.</p>
          <p className="small">Build routines and assign them to days in Routines.</p>
        </div>
      )}

      <div className="grid-2">
        <button className="btn lg" onClick={() => void start()}>
          <Icon name="plus" /> Empty workout
        </button>
        <Link className="btn lg" to="/train?tab=routines">
          <Icon name="list" /> All routines
        </Link>
      </div>
    </>
  )
}

function RoutinesTab() {
  const navigate = useNavigate()
  const settings = useSettings()
  const routines = useLiveQuery(() => db.routines.orderBy('name').toArray(), []) ?? []
  const [editDay, setEditDay] = useState<number | null>(null)

  const addStarter = async (i: number) => {
    const s = STARTER_ROUTINES[i]
    const id = await db.routines.add({ name: s.name, entries: s.entries, createdAt: Date.now() })
    navigate(`/train/routine/${id}`)
  }

  const toggleDay = (weekday: number, routineId: number) => {
    const plan = settings.weeklyPlan.map((d) => [...d])
    plan[weekday] = plan[weekday].includes(routineId) ? plan[weekday].filter((x) => x !== routineId) : [...plan[weekday], routineId]
    void updateSettings({ weeklyPlan: plan })
  }

  return (
    <>
      <div className="section-title">
        <h2>Weekly plan</h2>
      </div>
      <div className="card flush list">
        {WEEK_ORDER.map((wd) => {
          const names = (settings.weeklyPlan[wd] ?? []).map((id) => routines.find((r) => r.id === id)?.name).filter(Boolean)
          return (
            <button key={wd} className="list-item" onClick={() => setEditDay(wd)}>
              <div style={{ width: 44, fontWeight: 650 }}>{DAY_NAMES[wd].slice(0, 3)}</div>
              <div className="grow truncate">{names.length ? names.join(' + ') : <span className="muted">Rest day</span>}</div>
              <Icon name="edit" size={18} className="muted" />
            </button>
          )
        })}
      </div>

      <div className="section-title">
        <h2>My routines</h2>
        <Link to="/train/routine/new">+ New routine</Link>
      </div>
      {routines.length ? (
        routines.map((r) => <RoutineCard key={r.id} routine={r} onStart={() => void startWorkout(r).then((id) => navigate(`/train/workout/${id}`))} />)
      ) : (
        <div className="card empty">
          <p>No routines yet. Create one, or add a starter routine below and adjust it.</p>
        </div>
      )}

      <div className="section-title">
        <h2>Starter routines</h2>
      </div>
      <div className="stack-sm">
        {STARTER_ROUTINES.map((s, i) => (
          <div className="card row" key={s.name}>
            <div className="grow">
              <div style={{ fontWeight: 650 }}>{s.name}</div>
              <div className="small muted">{s.blurb}</div>
            </div>
            <button className="btn sm" onClick={() => void addStarter(i)}>
              <Icon name="plus" size={16} /> Add
            </button>
          </div>
        ))}
      </div>

      <Sheet open={editDay != null} onClose={() => setEditDay(null)} title={editDay != null ? DAY_NAMES[editDay] : ''}>
        {editDay != null && (
          <div className="stack">
            <p className="small muted">Choose what to do on {DAY_NAMES[editDay]}s. Pick several to stack them (e.g. mobility + strength).</p>
            {routines.length ? (
              <div className="card flush list">
                {routines.map((r) => {
                  const on = settings.weeklyPlan[editDay]?.includes(r.id!)
                  return (
                    <button key={r.id} className="list-item" onClick={() => toggleDay(editDay, r.id!)} aria-pressed={on}>
                      <div className="grow">
                        <div className="title">{r.name}</div>
                        <div className="meta">{r.entries.length} exercises</div>
                      </div>
                      <span className={`check-btn ${on ? 'on' : ''}`}>
                        <Icon name="check" size={18} />
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="empty">Create a routine first.</p>
            )}
            <button className="btn primary block" onClick={() => setEditDay(null)}>
              Done
            </button>
          </div>
        )}
      </Sheet>
    </>
  )
}

function SkillsTab() {
  const workouts = useLiveQuery(() => db.workouts.toArray(), []) ?? []
  const marks = useLiveQuery(() => db.skillMarks.toArray(), []) ?? []
  const { get } = useExercises()
  return (
    <>
      <p className="small muted">Hit a level’s target in one workout and the next step unlocks automatically.</p>
      {SKILLS.map((skill) => {
        const p = skillProgress(skill, workouts, marks)
        const current = skill.levels[Math.min(p.current, skill.levels.length - 1)]
        const complete = p.current >= skill.levels.length
        return (
          <Link key={skill.id} to={`/train/skill/${skill.id}`} className="card card-link stack-sm">
            <div className="row">
              <ExerciseThumb exercise={get(current.exerciseId)} large />
              <div className="grow">
                <div className="row-between">
                  <strong>{skill.name}</strong>
                  <span className="badge">{skill.group}</span>
                </div>
                <div className="small text-2">{complete ? 'All levels complete' : `Next: ${get(current.exerciseId).name} · ${targetLabel(current)}`}</div>
                <div className="small muted">
                  Level {Math.min(p.current + 1, skill.levels.length)} of {skill.levels.length}
                </div>
              </div>
            </div>
            <Meter value={p.achieved} max={skill.levels.length} tone={complete ? 'good' : undefined} />
          </Link>
        )
      })}
    </>
  )
}

function HistoryTab() {
  const settings = useSettings()
  const workouts = useLiveQuery(() => db.workouts.orderBy('startedAt').reverse().filter((w) => w.endedAt != null).limit(100).toArray(), []) ?? []
  if (!workouts.length)
    return (
      <div className="card empty">
        <Icon name="history" size={30} />
        <p>Finished workouts show up here.</p>
      </div>
    )
  return (
    <div className="card flush list">
      {workouts.map((w: Workout) => {
        const s = workoutStats(w)
        return (
          <Link key={w.id} className="list-item" to={`/train/workout/${w.id}`}>
            <div className="grow">
              <div className="title">{w.name}</div>
              <div className="meta">
                {formatDayLabel(w.date)} · {formatDuration(s.durationMs)} · {s.sets} sets
                {s.volumeKg > 0 ? ` · ${fmt(kgToDisplay(s.volumeKg, settings.units), 0)} ${weightUnit(settings.units)}` : ''}
              </div>
            </div>
            <Icon name="chevronRight" className="muted" />
          </Link>
        )
      })}
    </div>
  )
}
