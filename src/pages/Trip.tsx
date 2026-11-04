import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Decor } from '../components/Decor'
import { Icon } from '../components/Icon'
import { NumInput } from '../components/NumInput'
import { Meter } from '../components/Ring'
import { Sheet } from '../components/Sheet'
import { TRIP_TIPS } from '../data/trip'
import { db } from '../db/db'
import { ageFromSettings, updateSettings, useSettings } from '../db/settings'
import type { Settings, TripGoal, Units, Workout } from '../db/types'
import { addDays, dateKey, daysBetween, formatShortDate, parseDateKey } from '../lib/dates'
import { useExercises } from '../lib/exercises'
import { tdee } from '../lib/nutrition'
import { buildPlan, mondayKey, PHASE_INFO, STONES, stoneDone, trailSessions, weekStats, weeksUntil, weightPlan, type PlanWeek } from '../lib/trip'
import { displayToKg, displayToM, distanceUnit, fmt, kgToDisplay, M_PER_MI, mToDisplay, weightUnit } from '../lib/units'
import { startStarter } from '../lib/workoutActions'

const miles = (mi: number, u: Units) => `${fmt(mToDisplay(mi * M_PER_MI, u), 1)} ${distanceUnit(u)}`
const longDate = (key: string) => parseDateKey(key).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })

export default function Trip() {
  const settings = useSettings()
  const workouts = useLiveQuery(() => db.workouts.toArray(), [])
  const [editing, setEditing] = useState(false)
  if (!workouts) return <div className="page" />
  const trip = settings.trip
  return (
    <div className="page">
      <div className="page-header">
        <Link className="icon-btn" to="/path" aria-label="Back">
          <Icon name="chevronLeft" />
        </Link>
        <div className="grow">
          <h1>{trip ? trip.name : 'Trip Prep'}</h1>
          <div className="subtitle">{trip ? `${longDate(trip.date)} · ${countdown(trip.date)}` : 'Train for a hiking trip, step by step'}</div>
        </div>
        {trip && (
          <button className="icon-btn filled" onClick={() => setEditing(true)} aria-label="Edit trip">
            <Icon name="edit" size={18} />
          </button>
        )}
      </div>
      {trip ? <TripPlan trip={trip} workouts={workouts} settings={settings} /> : <TripSetup workouts={workouts} />}
      <Sheet open={editing} onClose={() => setEditing(false)} title="Your trip">
        {editing && <TripSetup workouts={workouts} onDone={() => setEditing(false)} />}
      </Sheet>
    </div>
  )
}

function countdown(date: string) {
  const days = daysBetween(dateKey(), date)
  if (days < 0) return 'trip done ✦'
  if (days === 0) return 'today!'
  return days < 21 ? `${days} days to go` : `${Math.round(days / 7)} weeks to go`
}

function TripSetup({ workouts, onDone }: { workouts: Workout[]; onDone?: () => void }) {
  const settings = useSettings()
  const [name, setName] = useState(settings.trip?.name ?? 'Yellowstone')
  const [date, setDate] = useState(settings.trip?.date ?? '2027-07-12')
  const valid = !!name.trim() && date > dateKey()
  const save = async () => {
    const today = dateKey()
    const recent = trailSessions(workouts).filter((s) => s.date >= addDays(today, -28))
    const startLongMi = settings.trip?.startLongMi ?? Math.min(6, Math.max(2, ...recent.map((s) => s.miles)))
    const trip: TripGoal = { name: name.trim(), date, startDate: settings.trip?.startDate ?? today, startLongMi }
    await updateSettings({ trip })
    onDone?.()
  }
  return (
    <div className={onDone ? 'stack' : 'card stack'}>
      {!onDone && (
        <div className="row">
          <Decor name="lantern_string" className="decor-inline" />
          <p className="small text-2 grow">Set your trip and Get Lifted builds a week-by-week plan to get you there: longer walks, hills, a daypack, strength days, a safe weight-loss pace and a taper so you arrive fresh.</p>
        </div>
      )}
      <label className="field">
        <span>Trip name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Yellowstone" />
      </label>
      <label className="field">
        <span>First day of the trip</span>
        <input type="date" value={date} min={dateKey()} onChange={(e) => setDate(e.target.value)} />
      </label>
      <button className="btn primary block" disabled={!valid} onClick={() => void save()}>
        {settings.trip ? 'Save' : 'Build my plan'}
      </button>
      {settings.trip && (
        <button
          className="btn ghost block"
          onClick={() => {
            void updateSettings({ trip: null })
            onDone?.()
          }}
        >
          Remove this trip
        </button>
      )}
    </div>
  )
}

function TripPlan({ trip, workouts, settings }: { trip: TripGoal; workouts: Workout[]; settings: Settings }) {
  const navigate = useNavigate()
  const { get } = useExercises()
  const marks = useLiveQuery(() => db.skillMarks.where('skillId').equals('trip').toArray(), []) ?? []
  const [logOpen, setLogOpen] = useState(false)
  const u = settings.units
  const today = dateKey()
  const plan = buildPlan(trip.date, trip.startLongMi, trip.startDate)
  const thisMonday = mondayKey(today)
  const week = plan.find((w) => w.monday === thisMonday) ?? (today < trip.date ? plan[0] : undefined)
  const sessions = trailSessions(workouts)
  const stats = weekStats(sessions, thisMonday)
  const strengthDays = new Set(
    workouts
      .filter((w) => w.endedAt != null && w.date >= thisMonday && w.date <= addDays(thisMonday, 6))
      .filter((w) => w.entries.some((e) => e.sets.some((s) => s.done) && ['strength', 'calisthenics'].includes(get(e.exerciseId).category)))
      .map((w) => w.date),
  ).size
  const start = async (name: string) => navigate(`/train/workout/${await startStarter(name)}`)
  const stonesDone = STONES.filter((s) => stoneDone(s, sessions, marks)).length

  return (
    <>
      {week ? (
        <div className="card stack">
          <div className="row-between">
            <div>
              <div className="eyebrow">
                Week {week.index + 1} of {plan.length}
              </div>
              <h2 style={{ color: 'var(--plum)' }}>
                {PHASE_INFO[week.phase].name}
                {week.recovery ? ' · easy week' : ''}
              </h2>
            </div>
            <span className="badge accent">{weeksUntil(trip.date, today)} wks left</span>
          </div>
          <p className="small text-2">{week.recovery ? 'An easier week so your body can catch up and come back stronger.' : PHASE_INFO[week.phase].text}</p>
          <Target label={`Long walk: ${miles(week.longMi, u)}`} value={stats.longest} max={week.longMi} show={(v) => miles(v, u)} />
          {week.backToBackMi > 0 && <p className="small">Then the next day: {miles(week.backToBackMi, u)} on tired legs.</p>}
          <Target label={`Walks this week: ${week.walks}`} value={stats.walks} max={week.walks} show={(v) => `${v}`} />
          <p className="tiny muted">Weekday walks: about {week.easyMin} minutes each, at a pace where you can still talk.</p>
          <Target label={`Strength days: ${week.strength}`} value={strengthDays} max={week.strength} show={(v) => `${v}`} />
          <div className="row wrap" style={{ gap: 6 }}>
            {week.hills && <span className="badge">⛰ One hill or stair walk</span>}
            {week.packLb > 0 && <span className="badge">🎒 Daypack: {u === 'imperial' ? `${week.packLb} lb` : `${Math.round(week.packLb * 0.45)} kg`}</span>}
            <span className="badge">🧘 Stretch after long days</span>
          </div>
          <div className="grid-2">
            <button className="btn primary" onClick={() => setLogOpen(true)}>
              <Icon name="plus" size={16} /> Log a walk
            </button>
            <button className="btn" onClick={() => void start('Hiker Strength')}>
              <Icon name="dumbbell" size={16} /> Strength day
            </button>
          </div>
        </div>
      ) : (
        <div className="card center">
          <p className="handwritten" style={{ color: 'var(--berry)' }}>
            Enjoy {trip.name}! ✦ Use the recovery tips below between days.
          </p>
        </div>
      )}

      <div className="section-title">
        <h2>Routines for the trail</h2>
      </div>
      <div className="grid-2">
        {['Trail Warm-Up', 'Hiker Strength', 'Hill Walk', 'Post-Hike Recovery'].map((n) => (
          <button key={n} className="btn" onClick={() => void start(n)}>
            {n}
          </button>
        ))}
      </div>

      <div className="section-title">
        <h2>Stepping stones</h2>
        <span className="small muted">
          {stonesDone} of {STONES.length}
        </span>
      </div>
      <div className="card flush list">
        {STONES.map((s) => {
          const done = stoneDone(s, sessions, marks)
          const manual = marks.some((m) => m.id === `trip:${s.id}`)
          return (
            <div key={s.id} className={`list-item quest ${done ? 'done' : ''}`}>
              <span className="quest-icon">{done ? <Icon name="check" size={18} /> : <Icon name="star" size={18} />}</span>
              <div className="grow">
                <div className="title">{s.title}</div>
                <div className="meta">{s.text}</div>
                {s.auto && !done && <div className="tiny muted">Ticks itself off when you log it.</div>}
              </div>
              {!s.auto || manual ? (
                <button
                  className={`check-btn ${done ? 'on' : ''}`}
                  aria-label={done ? `Untick ${s.title}` : `Tick ${s.title}`}
                  aria-pressed={done}
                  onClick={() => void (done ? db.skillMarks.delete(`trip:${s.id}`) : db.skillMarks.put({ id: `trip:${s.id}`, skillId: 'trip', level: 0, achievedAt: Date.now() }))}
                >
                  <Icon name="check" size={18} />
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      <WeightGoal trip={trip} settings={settings} />

      <details className="card">
        <summary style={{ fontWeight: 700 }}>See the whole plan ({plan.length} weeks)</summary>
        <PlanTable plan={plan} units={u} current={week?.index} />
      </details>

      {TRIP_TIPS.map((sec) => (
        <details key={sec.id} className="card tips-card" open={sec.id === 'recover'}>
          <summary className="row">
            <Decor name={sec.decor} className="decor-inline" />
            <strong className="grow">{sec.title}</strong>
            <Icon name="chevronDown" size={18} className="muted" />
          </summary>
          <div className="stack-sm" style={{ marginTop: 10 }}>
            {sec.tips.map((t) => (
              <div key={t.title}>
                <div style={{ fontWeight: 700 }}>{t.title}</div>
                <p className="small text-2">{t.text}</p>
              </div>
            ))}
          </div>
        </details>
      ))}
      <p className="tiny muted center">General guidance, not medical advice. Check with your doctor before a big change in training or diet.</p>

      <LogWalk open={logOpen} onClose={() => setLogOpen(false)} units={u} />
    </>
  )
}

function Target({ label, value, max, show }: { label: string; value: number; max: number; show: (v: number) => string }) {
  const done = value >= max
  return (
    <div className="stack-sm" style={{ gap: 4 }}>
      <div className="row-between small">
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span className={done ? 'status good' : 'muted num'}>{done ? '✓ Done' : `${show(value)} so far`}</span>
      </div>
      <Meter value={value} max={max} tone={done ? 'good' : undefined} />
    </div>
  )
}

function PlanTable({ plan, units, current }: { plan: PlanWeek[]; units: Units; current?: number }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 10 }}>
      <table className="plan-table">
        <thead>
          <tr>
            <th>Week of</th>
            <th>Phase</th>
            <th>Long walk</th>
            <th>Extras</th>
          </tr>
        </thead>
        <tbody>
          {plan.map((w) => (
            <tr key={w.index} className={w.index === current ? 'current' : ''}>
              <td className="num">{formatShortDate(w.monday)}</td>
              <td>
                {PHASE_INFO[w.phase].name}
                {w.recovery ? ' (easy)' : ''}
              </td>
              <td className="num">
                {miles(w.longMi, units)}
                {w.backToBackMi ? ` + ${miles(w.backToBackMi, units)}` : ''}
              </td>
              <td className="small">{[w.hills && 'hills', w.packLb && `${w.packLb} lb pack`].filter(Boolean).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WeightGoal({ trip, settings }: { trip: TripGoal; settings: Settings }) {
  const latest = useLiveQuery(() => db.weights.orderBy('date').last(), [])
  const u = settings.units
  const [applied, setApplied] = useState(false)
  const wu = weightUnit(u)
  const show = (kg: number) => `${fmt(kgToDisplay(kg, u), 1)} ${wu}`
  const goal = settings.goalWeightKg
  const maintenance =
    latest && settings.heightCm && settings.birthYear ? tdee(settings.sex, latest.kg, settings.heightCm, ageFromSettings(settings), settings.activityLevel) : null
  const p = latest && goal ? weightPlan(latest.kg, goal, trip.date, maintenance, settings.sex) : null

  return (
    <>
      <div className="section-title">
        <h2>Weight goal</h2>
        <Link className="small" to="/body">
          Weigh-ins
        </Link>
      </div>
      <div className="card stack">
        <div className="grid-2">
          <div className="stat">
            <div className="label">Now</div>
            <div className="value num">{latest ? show(latest.kg) : '–'}</div>
          </div>
          <label className="field">
            <span>Goal ({wu})</span>
            <NumInput value={goal != null ? kgToDisplay(goal, u) : null} digits={1} onChange={(v) => void updateSettings({ goalWeightKg: v ? displayToKg(v, u) : null })} />
          </label>
        </div>
        {!latest && <p className="small text-2">Log your weight on the Body page to see your plan.</p>}
        {p && latest && goal != null && latest.kg > goal && (
          <>
            <p className="small">
              A steady, healthy pace is about <strong>{show(p.planKgPerWeek)} a week</strong>. That gets you to <strong>{show(p.byTripKg)}</strong> by {trip.name}
              {p.byTripKg <= goal + 0.05 ? ', right on your goal ✦' : '.'}
            </p>
            {p.byTripKg > goal + 0.05 && (
              <p className="small text-2">Reaching {show(goal)} by then would take more than the recommended 0.5–1% of body weight a week. Losing slower keeps your muscle and energy for training, so the rest can come after the trip.</p>
            )}
            <div className="checkpoints">
              {p.checkpoints.slice(0, 10).map((c) => (
                <div key={c.date}>
                  <span className="tiny muted">{formatShortDate(c.date)}</span>
                  <strong className="num">{fmt(kgToDisplay(c.kg, u), 1)}</strong>
                </div>
              ))}
            </div>
            {p.kcal ? (
              <div className="callout">
                <Icon name="food" size={18} />
                <div className="grow">
                  About <strong>{p.kcal.toLocaleString()} calories a day</strong> with plenty of protein (around {Math.round(latest.kg * 1.6)} g) to keep your muscle while you lose fat. Eat a bit more on long-walk days.
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn sm"
                      onClick={() => {
                        void updateSettings({ calorieGoal: p.kcal!, proteinGoalG: Math.round(latest.kg * 1.6) })
                        setApplied(true)
                      }}
                    >
                      {applied ? 'Saved to Food ✓' : 'Use as my daily goals'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="tiny muted">Add your height and birth year in Settings for a daily calorie target.</p>
            )}
          </>
        )}
        {latest && goal != null && latest.kg <= goal && <p className="handwritten" style={{ color: 'var(--berry)' }}>You’re at your goal ✦ Now it’s all about endurance.</p>}
      </div>
    </>
  )
}

const WALK_TYPES = [
  ['walk', 'Walk'],
  ['hike', 'Hike'],
  ['ruck-walk', 'With a pack'],
  ['incline-walk', 'Incline walk'],
] as const

function LogWalk({ open, onClose, units }: { open: boolean; onClose: () => void; units: Units }) {
  const [type, setType] = useState<(typeof WALK_TYPES)[number][0]>('walk')
  const [date, setDate] = useState(dateKey())
  const [minutes, setMinutes] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const save = async () => {
    const end = Date.now()
    await db.workouts.add({
      date,
      name: WALK_TYPES.find(([t]) => t === type)![1],
      routineId: null,
      startedAt: end - (minutes ?? 0) * 60_000,
      endedAt: end,
      entries: [
        {
          id: Math.random().toString(36).slice(2),
          exerciseId: type,
          sets: [{ id: Math.random().toString(36).slice(2), done: true, completedAt: end, durationSec: minutes ? minutes * 60 : null, distanceM: distance ? displayToM(distance, units) : null, reps: null, weightKg: null }],
        },
      ],
    })
    setMinutes(null)
    setDistance(null)
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Log a walk or hike">
      <div className="stack">
        <div className="chips">
          {WALK_TYPES.map(([t, label]) => (
            <button key={t} className={`chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid-2">
          <label className="field">
            <span>Distance ({distanceUnit(units)})</span>
            <NumInput value={distance} digits={2} onChange={setDistance} placeholder="3" />
          </label>
          <label className="field">
            <span>Minutes</span>
            <NumInput value={minutes} digits={0} onChange={setMinutes} placeholder="60" />
          </label>
        </div>
        <label className="field">
          <span>Day</span>
          <input type="date" value={date} max={dateKey()} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button className="btn primary block" disabled={!distance && !minutes} onClick={() => void save()}>
          Save
        </button>
      </div>
    </Sheet>
  )
}
