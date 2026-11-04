import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Decor } from '../components/Decor'
import { ExerciseThumb } from '../components/ExerciseVisual'
import { HowToSheet } from '../components/HowTo'
import { Icon } from '../components/Icon'
import { NumInput } from '../components/NumInput'
import { Meter } from '../components/Ring'
import { Sheet } from '../components/Sheet'
import { TRIP_TIPS } from '../data/trip'
import { HOW_IT_WORKS, PACKING_REMINDERS, RIDING_NOTE, STOP_SIGNS, STOP_TEXT } from '../data/yellowstone'
import { db } from '../db/db'
import { ageFromSettings, updateSettings, useSettings } from '../db/settings'
import type { ProgramLog, RoutineEntry, Settings, Units, YellowstoneSettings } from '../db/types'
import { addDays, dateKey, daysBetween, formatSeconds, formatShortDate, parseDateKey } from '../lib/dates'
import { useExercises, type ExerciseInfo } from '../lib/exercises'
import { displayToKg, displayToM, distanceUnit, fmt, kgToDisplay, KG_PER_LB, mToDisplay, weightUnit } from '../lib/units'
import { workoutWith } from '../lib/workoutActions'
import {
  applyDecision,
  DEFAULT_DAYS,
  foodPlan,
  mondayOf,
  PHASES,
  SESSION_KEYS,
  SESSION_NAMES,
  START_WEIGHT_TIP,
  weekPlan,
  weeklyDecision,
  weeksUntil,
  weightTrend,
  type Decision,
  type PlanExercise,
  type Session,
  type SessionKey,
  type SessionLog,
} from '../lib/yellowstone'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ASSUMED_DATE = '2027-07-15'
const lbToKg = (lb: number) => lb * KG_PER_LB

function defaultProgram(baselineMin: number): YellowstoneSettings {
  return {
    startDate: dateKey(),
    baselineMin,
    level: 1,
    reviewedWeek: mondayOf(dateKey()),
    days: { ...DEFAULT_DAYS },
    tripDate: { value: ASSUMED_DATE, confirmed: false },
    operator: '',
    itinerary: '',
    longestHikeMi: { value: null, confirmed: false },
    elevationGainFt: { value: null, confirmed: false },
    enduranceGoal: 'Walk comfortably for about 3 hours with breaks and some hills, then do it again the next day.',
    riding: { wanted: true, limitLb: { value: 240, confirmed: false }, marginLb: 10 },
    food: { mode: 'calories', deficit: 400, proteinPerKg: 1.4 },
  }
}

/** Everything the program needs from the database, in one place. */
function useProgram() {
  const settings = useSettings()
  const logs = useLiveQuery(() => db.programLogs.toArray(), [])
  const workouts = useLiveQuery(() => db.workouts.where('date').aboveOrEqual(addDays(dateKey(), -14)).toArray(), [])
  const p = settings.yellowstone
  const today = dateKey()
  const monday = mondayOf(today)
  const week = p ? weekPlan(p.level, p.baselineMin, p.startDate, p.tripDate.value, monday) : null
  const sessionOn = (date: string): Session | undefined => {
    if (!p || !week || date < p.startDate) return undefined
    const wd = parseDateKey(date).getDay()
    return week.sessions.find((s) => p.days[s.key] === wd)
  }
  const logFor = (date: string, key: SessionKey) => (logs ?? []).find((l) => l.kind === 'session' && l.date === date && l.session === key)
  const missed = week
    ? week.sessions.filter((s) => {
        if (!p) return false
        const date = addDays(monday, (p.days[s.key] + 6) % 7)
        return date < today && date >= p.startDate && !logFor(date, s.key)
      })
    : []
  return { settings, p, logs: logs ?? [], workouts: workouts ?? [], today, monday, week, sessionOn, logFor, missed, loaded: logs != null && workouts != null }
}

const save = (patch: Partial<YellowstoneSettings>, p: YellowstoneSettings) => updateSettings({ yellowstone: { ...p, ...patch } })

/* ── Today card on the Today page ──────────────────────────────────── */

export function YellowstoneToday() {
  const { p, today, sessionOn, logFor, loaded } = useProgram()
  if (!loaded) return null
  if (!p)
    return (
      <Link to="/yellowstone" className="card card-link row tint-mint">
        <Decor name="lantern_string" className="decor-inline" />
        <div className="grow">
          <div style={{ fontWeight: 700 }}>Yellowstone 2027</div>
          <div className="small text-2">Set up your walking, strength and balance program.</div>
        </div>
        <Icon name="chevronRight" className="muted" />
      </Link>
    )
  const s = sessionOn(today)
  const log = s ? logFor(today, s.key) : undefined
  return (
    <Link to="/yellowstone" className="card card-link stack-sm tint-mint">
      <div className="row-between">
        <div className="card-title" style={{ margin: 0 }}>
          <Icon name="calendar" size={18} /> Yellowstone · today
        </div>
        <span className="small text-2">{countdown(p.tripDate.value)}</span>
      </div>
      <div className="small">
        {s ? (
          <>
            <strong>{s.title}</strong> · {s.minutes.split(' · ')[0]}
            {log && <span className="status good"> ✓ done</span>}
          </>
        ) : (
          'Rest day. A gentle stroll or stretch is a bonus, not homework.'
        )}
      </div>
    </Link>
  )
}

function countdown(date: string) {
  const days = daysBetween(dateKey(), date)
  if (days < 0) return 'trip done ✦'
  return days < 21 ? `${days} days` : `${Math.round(days / 7)} weeks`
}

/* ── The program page ──────────────────────────────────────────────── */

export default function Yellowstone() {
  const prog = useProgram()
  if (!prog.loaded) return <div className="page" />
  return (
    <div className="page">
      <div className="page-header">
        <Link className="icon-btn" to="/path" aria-label="Back">
          <Icon name="chevronLeft" />
        </Link>
        <div className="grow">
          <h1>Yellowstone 2027</h1>
          <div className="subtitle">
            {prog.p ? (
              <>
                {formatLong(prog.p.tripDate.value)} · {countdown(prog.p.tripDate.value)} <Pill confirmed={prog.p.tripDate.confirmed} />
              </>
            ) : (
              'Walking, strength, balance and riding prep'
            )}
          </div>
        </div>
        <Decor name="lantern_string" className="decor-header" />
      </div>
      {prog.p ? <Program prog={prog} p={prog.p} /> : <Setup />}
    </div>
  )
}

const formatLong = (key: string) => parseDateKey(key).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })

function Pill({ confirmed }: { confirmed: boolean }) {
  return <span className={`fact-pill ${confirmed ? 'yes' : ''}`}>{confirmed ? 'confirmed' : 'assumption'}</span>
}

function Setup() {
  const [baseline, setBaseline] = useState<number | null>(15)
  return (
    <div className="card stack">
      <p>Here’s your plan, built from your answers:</p>
      <ul className="plain-list small">
        <li>Start with walks you already find comfortable, and grow from there.</li>
        <li>Knee- and foot-friendly strength with dumbbells and kettlebells. No running or jumping.</li>
        <li>Balance and hip mobility for trails and the optional horseback ride.</li>
        <li>A short version of every workout for busy days.</li>
      </ul>
      <label className="field">
        <span>How many minutes can you walk comfortably right now?</span>
        <NumInput value={baseline} digits={0} onChange={setBaseline} />
      </label>
      <p className="tiny muted">Pick a time that feels easy, with no pain the next day. Your first walks will be this long.</p>
      <button className="btn primary block lg" disabled={!baseline} onClick={() => void updateSettings({ yellowstone: defaultProgram(Math.max(5, Math.min(60, baseline ?? 15))) })}>
        Start my program ✦
      </button>
      <p className="tiny muted">You can add your trip date, operator and itinerary any time.</p>
    </div>
  )
}

type Prog = ReturnType<typeof useProgram>

function Program({ prog, p }: { prog: Prog; p: YellowstoneSettings }) {
  const { week, today } = prog
  if (!week) return null
  const lastMonday = addDays(prog.monday, -7)
  const needsReview = p.reviewedWeek == null || (p.reviewedWeek < prog.monday && p.startDate <= addDays(lastMonday, 6))
  return (
    <>
      {needsReview && <WeeklyReview prog={prog} p={p} />}
      <TodayWorkout prog={prog} />
      <WeekCalendar prog={prog} p={p} />
      <div className="card stack-sm">
        <div className="row-between">
          <div>
            <div className="eyebrow">
              Step {week.level} · {PHASES[week.phase].name}
              {week.easy ? ' · lighter week' : ''}
            </div>
            <p className="small text-2">{week.easy ? 'A lighter week by design. Your body gets stronger while it recovers.' : PHASES[week.phase].text}</p>
          </div>
        </div>
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="badge">🚶 {week.state.walkMin} min walks</span>
          <span className="badge">🌲 {week.state.longMin} min Saturday</span>
          {week.state.inclinePct > 0 && <span className="badge">⛰ {week.state.inclinePct}% incline</span>}
          {week.state.packLb > 0 && <span className="badge">🎒 {week.state.packLb} lb pack</span>}
          {week.state.backToBack && <span className="badge">✦ back-to-back days</span>}
        </div>
      </div>
      <Packing p={p} />
      <Progress prog={prog} p={p} />
      <TripDetails p={p} />
      <Riding prog={prog} p={p} />
      <Food prog={prog} p={p} />
      <Schedule p={p} />
      <details className="card">
        <summary style={{ fontWeight: 700 }}>How this program works</summary>
        <ul className="plain-list small" style={{ marginTop: 8 }}>
          {HOW_IT_WORKS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>
      <Safety />
      {TRIP_TIPS.map((sec) => (
        <details key={sec.id} className="card tips-card">
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
      <p className="tiny muted center">General guidance, not medical advice. Today is {formatShortDate(today)}.</p>
    </>
  )
}

/* ── Today’s workout ───────────────────────────────────────────────── */

function TodayWorkout({ prog }: { prog: Prog }) {
  const navigate = useNavigate()
  const { get } = useExercises()
  const [swap, setSwap] = useState<SessionKey | null>(null)
  const [short, setShort] = useState(false)
  const [checkIn, setCheckIn] = useState(false)
  const [howTo, setHowTo] = useState<ExerciseInfo | null>(null)
  const planned = prog.sessionOn(prog.today)
  const s = swap ? prog.week!.sessions.find((x) => x.key === swap)! : planned
  const log = s ? prog.logFor(prog.today, s.key) : undefined
  const doneToday = prog.logs.some((l) => l.kind === 'session' && l.date === prog.today && l.status !== 'skipped')
  const finishedWorkout = s && prog.workouts.some((w) => w.date === prog.today && w.endedAt != null && w.name.startsWith(`Yellowstone · ${s.title}`))

  const start = async () => {
    if (!s) return
    const list = short ? s.shortExercises : s.exercises
    const entries: RoutineEntry[] = list.map((e) => ({ exerciseId: e.id, sets: e.sets, reps: e.startReps ?? null, durationSec: e.holdSec ?? null, restSec: e.restSec }))
    if (s.walk) {
      const id = s.walk.inclinePct > 0 ? 'incline-walk' : s.walk.packLb > 0 ? 'ruck-walk' : 'walk'
      const walkEntry: RoutineEntry = { exerciseId: id, sets: 1, durationSec: (short ? Math.min(15, s.walk.minutes) : s.walk.minutes) * 60, restSec: 0 }
      if (s.kind === 'strength') entries.push(walkEntry)
      else entries.unshift(walkEntry)
    }
    navigate(`/train/workout/${await workoutWith(entries, `Yellowstone · ${s.title}${short ? ' (short)' : ''}`)}`)
  }

  if (!s)
    return (
      <div className="card stack-sm tint-lavender">
        <div className="card-title" style={{ margin: 0 }}>
          <Icon name="heart" size={18} /> Today: rest day
        </div>
        <p className="small text-2">Rest is part of the plan. A gentle stroll or a few stretches is a bonus, not homework.</p>
        {prog.missed.length > 0 && !doneToday && (
          <div className="stack-sm">
            <p className="small">Missed one this week? You can do it today instead. Just one, no doubling up.</p>
            <div className="row wrap">
              {prog.missed.map((m) => (
                <button key={m.key} className="btn sm" onClick={() => setSwap(m.key)}>
                  Do {SESSION_NAMES[m.key]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )

  const list = short ? s.shortExercises : s.exercises
  return (
    <div className="card stack today-workout">
      <div className="row-between">
        <div>
          <div className="eyebrow">Today’s workout{swap ? ' (swapped in)' : ''}</div>
          <h2 style={{ color: 'var(--plum)' }}>{s.title}</h2>
          <div className="small muted">{s.minutes}</div>
        </div>
        {log && <span className="status good">✓ {log.status === 'short' ? 'Short version done' : log.status === 'skipped' ? 'Skipped, that’s ok' : 'Done'}</span>}
      </div>
      {prog.missed.length > 0 && planned && !swap && (
        <p className="small text-2">Missed {prog.missed.map((m) => SESSION_NAMES[m.key]).join(' and ')} this week? That’s okay. Just do today’s. The weekly check-in will adjust next week.</p>
      )}
      <div className="segmented">
        <button className={!short ? 'active' : ''} onClick={() => setShort(false)}>
          Full
        </button>
        <button className={short ? 'active' : ''} onClick={() => setShort(true)}>
          Short version
        </button>
      </div>
      {short && <p className="small">{s.short}</p>}

      <div>
        <h3 className="mini-h">1. Warm-up</h3>
        <ul className="plain-list small">
          {s.warmUp.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>

      {s.walk && s.kind !== 'strength' && <WalkBlock n={2} s={s} short={short} />}

      {list.length > 0 && (
        <div className="stack-sm">
          <h3 className="mini-h">{s.walk && s.kind !== 'strength' ? '3' : '2'}. {s.kind === 'mobility' ? 'Mobility & balance' : s.kind === 'walk' ? 'Downhill practice' : 'Strength'}</h3>
          {s.kind === 'strength' && <p className="tiny muted">{START_WEIGHT_TIP}</p>}
          <div className="card flush list inner">
            {list.map((e) => (
              <PlanRow key={e.id + e.sets} e={e} get={get} onHowTo={setHowTo} />
            ))}
          </div>
        </div>
      )}

      {s.walk && s.kind === 'strength' && <WalkBlock n={3} s={s} short={short} />}
      {s.note && <p className="small handwritten" style={{ color: 'var(--berry)' }}>{s.note}</p>}

      <details>
        <summary className="small" style={{ fontWeight: 700 }}>
          When to go up, repeat or ease back
        </summary>
        <ul className="plain-list small" style={{ marginTop: 6 }}>
          <li>⬆ {s.progress.up}</li>
          <li>↻ {s.progress.repeat}</li>
          <li>⬇ {s.progress.back}</li>
        </ul>
      </details>

      <div className="grid-2">
        <button className="btn primary" onClick={() => void start()}>
          <Icon name="play" size={14} /> Start
        </button>
        <button className={`btn ${finishedWorkout && !log ? 'brass' : ''}`} onClick={() => setCheckIn(true)}>
          {log ? 'Edit check-in' : finishedWorkout ? 'How did it go?' : 'Check in'}
        </button>
      </div>
      <CheckIn open={checkIn} onClose={() => setCheckIn(false)} session={s} existing={log} units={prog.settings.units} short={short} />
      <HowToSheet exercise={howTo} onClose={() => setHowTo(null)} />
    </div>
  )
}

function WalkBlock({ n, s, short }: { n: number; s: Session; short: boolean }) {
  const w = s.walk!
  return (
    <div>
      <h3 className="mini-h">
        {n}. Walk: {short ? Math.min(15, w.minutes) : w.minutes} minutes
      </h3>
      <ul className="plain-list small">
        <li>Effort: {w.effort}</li>
        <li>{w.terrain}</li>
        {w.packLb > 0 && !short && <li>Daypack: about {w.packLb} lb</li>}
        {w.stepDowns && !short && <li>{w.stepDowns}</li>}
      </ul>
    </div>
  )
}

function PlanRow({ e, get, onHowTo }: { e: PlanExercise; get: (id: string) => ExerciseInfo; onHowTo: (x: ExerciseInfo) => void }) {
  const ex = get(e.id)
  const easier = get(e.easier.id)
  return (
    <div className="list-item plan-row">
      <button className="plain" onClick={() => onHowTo(ex)} aria-label={`How to do ${ex.name}`}>
        <ExerciseThumb exercise={ex} />
      </button>
      <div className="grow">
        <div className="title">{ex.name}</div>
        <div className="meta">
          {e.sets} × {e.holdSec ? formatSeconds(e.holdSec) : e.reps}
          {e.restSec ? ` · rest ${formatSeconds(e.restSec)}` : ''}
        </div>
        {e.note && <div className="tiny text-2">{e.note}</div>}
        <button className="plain tiny easier" onClick={() => onHowTo(easier)}>
          Easier: {e.easier.note}
        </button>
      </div>
    </div>
  )
}

/* ── Check-in ──────────────────────────────────────────────────────── */

const EFFORT_LABELS: Record<number, string> = { 2: 'very easy', 4: 'easy, could chat', 6: 'working, short sentences', 8: 'hard', 10: 'all out' }

function CheckIn({ open, onClose, session, existing, units, short }: { open: boolean; onClose: () => void; session: Session; existing?: ProgramLog; units: Units; short: boolean }) {
  const [status, setStatus] = useState<'done' | 'short' | 'skipped'>(existing?.status ?? (short ? 'short' : 'done'))
  const [effort, setEffort] = useState<number | null>(existing?.effort ?? null)
  const [soreness, setSoreness] = useState<number | null>(existing?.soreness ?? null)
  const [pain, setPain] = useState(existing?.pain ?? false)
  const [painNote, setPainNote] = useState(existing?.painNote ?? '')
  const [walkMin, setWalkMin] = useState<number | null>(existing?.walkMin ?? null)
  const [dist, setDist] = useState<number | null>(existing?.distanceM != null ? mToDisplay(existing.distanceM, units) : null)
  const [elev, setElev] = useState<number | null>(existing?.elevationFt ?? null)
  const [incline, setIncline] = useState<number | null>(existing?.inclinePct ?? null)
  const [weight, setWeight] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const hasWalk = !!session.walk

  const submit = async () => {
    const log: ProgramLog = {
      date: dateKey(),
      kind: 'session',
      session: session.key,
      status,
      effort,
      soreness,
      pain,
      painNote: pain ? painNote : undefined,
      walkMin,
      distanceM: dist != null ? displayToM(dist, units) : null,
      elevationFt: elev,
      inclinePct: incline,
    }
    if (existing?.id) await db.programLogs.update(existing.id, log)
    else await db.programLogs.add(log)
    if (weight) await db.weights.add({ date: dateKey(), kg: displayToKg(weight, units), createdAt: Date.now() })
    setSaved(true)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Check in">
      {saved ? (
        <div className="stack center">
          <Decor name="amethyst_cluster" className="decor-empty" />
          <p className="handwritten" style={{ fontSize: '1.4rem', color: 'var(--berry)' }}>{status === 'skipped' ? 'Noted. Rest well, and pick up next time ✦' : 'Logged! Every session counts ✦'}</p>
          {pain && <p className="small">You noted pain. Ease back next time, and check the “When to stop” list. If it continues, get it looked at.</p>}
          <button className="btn primary block" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <div className="stack">
          <div className="segmented">
            {(['done', 'short', 'skipped'] as const).map((st) => (
              <button key={st} className={status === st ? 'active' : ''} onClick={() => setStatus(st)}>
                {st === 'done' ? 'Did it' : st === 'short' ? 'Short version' : 'Skipped'}
              </button>
            ))}
          </div>
          {status !== 'skipped' && (
            <>
              <div className="field">
                <span>How hard did it feel? {effort ? `${effort}/10${EFFORT_LABELS[effort] ? `: ${EFFORT_LABELS[effort]}` : ''}` : ''}</span>
                <div className="scale">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} className={`chip ${effort === n ? 'active' : ''}`} onClick={() => setEffort(n)}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <span>Soreness right now (0 = none) {soreness != null ? `${soreness}/10` : ''}</span>
                <div className="scale">
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                    <button key={n} className={`chip ${soreness === n ? 'active' : ''}`} onClick={() => setSoreness(n)}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {hasWalk && (
                <div className="grid-2">
                  <label className="field">
                    <span>Walk minutes</span>
                    <NumInput value={walkMin} digits={0} onChange={setWalkMin} placeholder={String(session.walk!.minutes)} />
                  </label>
                  <label className="field">
                    <span>Distance ({distanceUnit(units)}, optional)</span>
                    <NumInput value={dist} digits={2} onChange={setDist} />
                  </label>
                  <label className="field">
                    <span>Incline % (treadmill)</span>
                    <NumInput value={incline} digits={1} onChange={setIncline} />
                  </label>
                  <label className="field">
                    <span>Elevation gain (ft)</span>
                    <NumInput value={elev} digits={0} onChange={setElev} />
                  </label>
                </div>
              )}
            </>
          )}
          <label className="toggle">
            <span>Any pain (not just tired muscles)?</span>
            <input type="checkbox" checked={pain} onChange={(e) => setPain(e.target.checked)} />
          </label>
          {pain && (
            <label className="field">
              <span>Where, and what does it feel like?</span>
              <input value={painNote} onChange={(e) => setPainNote(e.target.value)} placeholder="e.g. right knee on the step-downs" />
            </label>
          )}
          <label className="field">
            <span>Weight today ({weightUnit(units)}, optional)</span>
            <NumInput value={weight} digits={1} onChange={setWeight} />
          </label>
          <button className="btn primary block" onClick={() => void submit()}>
            Save check-in
          </button>
        </div>
      )}
    </Sheet>
  )
}

/* ── Weekly review ─────────────────────────────────────────────────── */

function WeeklyReview({ prog, p }: { prog: Prog; p: YellowstoneSettings }) {
  const last = addDays(prog.monday, -7)
  const lastWeek = weekPlan(p.level, p.baselineMin, p.startDate, p.tripDate.value, last)
  const logs: SessionLog[] = lastWeek.sessions.flatMap((s) => {
    const date = addDays(last, (p.days[s.key] + 6) % 7)
    if (date < p.startDate) return []
    const l = prog.logs.find((x) => x.kind === 'session' && x.date >= last && x.date <= addDays(last, 6) && x.session === s.key)
    return [l ? { date: l.date, session: s.key, status: l.status ?? 'done', effort: l.effort ?? undefined, soreness: l.soreness ?? undefined, pain: l.pain } : { date, session: s.key, status: 'skipped' as const }]
  })
  const suggestion = weeklyDecision(logs, lastWeek.easy)
  const done = logs.filter((l) => l.status !== 'skipped').length
  const choose = async (d: Decision) => {
    const level = applyDecision(p.level, d)
    await db.programLogs.add({ date: dateKey(), kind: 'review', decision: d, level })
    await save({ level, reviewedWeek: prog.monday }, p)
  }
  const options: [Decision, string][] = [
    ['progress', 'Go up a step'],
    ['repeat', 'Repeat the week'],
    ['ease', 'Ease back a step'],
  ]
  return (
    <div className="card stack tint-butter">
      <div className="card-title" style={{ margin: 0 }}>
        <Icon name="star" size={18} /> Last week’s check-in
      </div>
      <Meter value={done} max={Math.max(1, logs.length)} tone="good" />
      <p className="small">
        You did {done} of {logs.length} sessions. {suggestion.why}
      </p>
      <div className="stack-sm">
        {options.map(([d, label]) => (
          <button key={d} className={`btn block ${d === suggestion.decision ? 'primary' : ''}`} onClick={() => void choose(d)}>
            {label}
            {d === suggestion.decision ? ' (suggested)' : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Week calendar ─────────────────────────────────────────────────── */

function WeekCalendar({ prog, p }: { prog: Prog; p: YellowstoneSettings }) {
  return (
    <div className="week ys-week">
      {Array.from({ length: 7 }, (_, i) => {
        const date = addDays(prog.monday, i)
        const s = prog.sessionOn(date)
        const log = s ? prog.logFor(date, s.key) : undefined
        const state = date < p.startDate ? 'before' : !s ? 'rest' : log ? (log.status === 'skipped' ? 'skipped' : 'done') : date < prog.today ? 'open' : date === prog.today ? 'today' : 'later'
        return (
          <div key={date} className={`day ${date === prog.today ? 'today' : ''} ys-${state}`}>
            <span>{WEEKDAYS[parseDateKey(date).getDay()]}</span>
            <strong>{state === 'before' ? '·' : state === 'done' ? '✓' : state === 'rest' ? '☾' : s ? (s.kind === 'strength' ? '💪' : s.kind === 'walk' ? '🚶' : '🌿') : ''}</strong>
            <span className="tiny">{state === 'before' ? '' : s ? SESSION_NAMES[s.key].split(' ')[0] : 'rest'}</span>
          </div>
        )
      })}
      {p.startDate > prog.monday && <span className="sr-only">Program started {formatShortDate(p.startDate)}</span>}
    </div>
  )
}

/* ── Packing reminders ─────────────────────────────────────────────── */

function Packing({ p }: { p: YellowstoneSettings }) {
  const weeks = weeksUntil(p.tripDate.value)
  const r = PACKING_REMINDERS.find((x) => weeks <= x.fromWeeks && weeks >= x.toWeeks)
  if (!r) return null
  return (
    <div className="card stack-sm tint-peach">
      <div className="card-title" style={{ margin: 0 }}>
        <Icon name="book" size={18} /> {r.title}
      </div>
      <ul className="plain-list small">
        {r.items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  )
}

/* ── Progress ──────────────────────────────────────────────────────── */

function Progress({ prog, p }: { prog: Prog; p: YellowstoneSettings }) {
  const [checkOpen, setCheckOpen] = useState(false)
  const weights = useLiveQuery(() => db.weights.toArray(), []) ?? []
  const u = prog.settings.units
  const sessions = prog.logs.filter((l) => l.kind === 'session' && l.status !== 'skipped')
  const longestWalk = Math.max(0, ...sessions.map((l) => l.walkMin ?? 0))
  const checks = prog.logs.filter((l) => l.kind === 'check').sort((a, b) => a.date.localeCompare(b.date))
  const lastCheck = checks.at(-1)
  const checkDue = !lastCheck || daysBetween(lastCheck.date, prog.today) >= 28
  const trend = weightTrend(weights.filter((w) => w.date >= addDays(p.startDate, -7)))
  const first = trend[0]
  const now = trend.at(-1)
  const show = (kg: number) => `${fmt(kgToDisplay(kg, u), 1)} ${weightUnit(u)}`
  return (
    <>
      <div className="section-title">
        <h2>Your progress</h2>
      </div>
      <div className="grid-2">
        <div className="card tight stat">
          <div className="label">Sessions done</div>
          <div className="value num">{sessions.length}</div>
        </div>
        <div className="card tight stat">
          <div className="label">Longest walk</div>
          <div className="value num">
            {longestWalk || p.baselineMin}
            <small> min</small>
          </div>
          <div className="delta tiny muted">started at {p.baselineMin} min</div>
        </div>
      </div>
      <div className="card stack-sm">
        <div className="card-title" style={{ margin: 0 }}>
          <Icon name="body" size={18} /> Weight trend
        </div>
        {now && first ? (
          <>
            <p className="small">
              7-day average <strong>{show(now.avgKg)}</strong>
              {trend.length > 1 && (
                <>
                  {' '}
                  · {now.avgKg <= first.avgKg ? 'down' : 'up'} {show(Math.abs(first.avgKg - now.avgKg))} since you started
                </>
              )}
            </p>
            <p className="tiny muted">Day-to-day changes of a few pounds are normal water and food shifts. The weekly average is what matters.</p>
          </>
        ) : (
          <p className="small text-2">Add your weight in a check-in or on the Body page when you like. Fitness counts from day one, whatever the scale says.</p>
        )}
      </div>
      <div className="card stack-sm">
        <div className="row-between">
          <div className="card-title" style={{ margin: 0 }}>
            <Icon name="target" size={18} /> Progress checks
          </div>
          {checkDue && <span className="badge accent">due</span>}
        </div>
        <p className="tiny muted">Every 4 weeks, three easy checks. Not a test: steady effort only.</p>
        {checks.length > 0 && (
          <table className="plan-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Easy walk</th>
                <th>Sit-to-stand</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id}>
                  <td>{formatShortDate(c.date)}</td>
                  <td className="num">{c.comfortableWalkMin ?? '–'} min</td>
                  <td className="num">{c.sitToStand30s ?? '–'}</td>
                  <td className="num">{c.balanceSec ?? '–'} s</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button className={`btn block ${checkDue ? 'primary' : ''}`} onClick={() => setCheckOpen(true)}>
          {checks.length ? 'Do a progress check' : 'Do your baseline check'}
        </button>
      </div>
      <ProgressCheck open={checkOpen} onClose={() => setCheckOpen(false)} />
    </>
  )
}

function ProgressCheck({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [walk, setWalk] = useState<number | null>(null)
  const [sts, setSts] = useState<number | null>(null)
  const [bal, setBal] = useState<number | null>(null)
  const submit = async () => {
    await db.programLogs.add({ date: dateKey(), kind: 'check', comfortableWalkMin: walk, sitToStand30s: sts, balanceSec: bal })
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Progress check">
      <div className="stack">
        <p className="small text-2">Do these on a fresh day, at a steady effort. Skip any that don’t feel right today.</p>
        <label className="field">
          <span>1. Easy walk: minutes until you’d like to stop (stop at 45)</span>
          <NumInput value={walk} digits={0} onChange={setWalk} />
        </label>
        <label className="field">
          <span>2. Sit-to-stands from a chair in 30 seconds, at a steady pace</span>
          <NumInput value={sts} digits={0} onChange={setSts} />
        </label>
        <label className="field">
          <span>3. Single-leg balance next to a counter: seconds on your less steady leg (stop at 30)</span>
          <NumInput value={bal} digits={0} onChange={setBal} />
        </label>
        <button className="btn primary block" disabled={walk == null && sts == null && bal == null} onClick={() => void submit()}>
          Save
        </button>
      </div>
    </Sheet>
  )
}

/* ── Trip details: confirmed vs assumed ────────────────────────────── */

function TripDetails({ p }: { p: YellowstoneSettings }) {
  const [open, setOpen] = useState(false)
  const rows: [string, string, boolean | null][] = [
    ['Trip date', formatLong(p.tripDate.value), p.tripDate.confirmed],
    ['Tour company', p.operator || 'Not chosen yet', p.operator ? true : null],
    ['Longest hike', p.longestHikeMi.value != null ? `${p.longestHikeMi.value} mi` : 'Unknown', p.longestHikeMi.value != null ? p.longestHikeMi.confirmed : null],
    ['Elevation gain', p.elevationGainFt.value != null ? `${p.elevationGainFt.value} ft` : 'Unknown', p.elevationGainFt.value != null ? p.elevationGainFt.confirmed : null],
  ]
  return (
    <>
      <div className="section-title">
        <h2>Trip details</h2>
        <button className="plain small" style={{ color: 'var(--link)' }} onClick={() => setOpen(true)}>
          Edit
        </button>
      </div>
      <div className="card flush list">
        {rows.map(([k, v, c]) => (
          <div key={k} className="list-item">
            <div className="grow">
              <div className="meta">{k}</div>
              <div className="title">{v}</div>
            </div>
            {c != null && <Pill confirmed={c} />}
          </div>
        ))}
        <div className="list-item">
          <div className="grow">
            <div className="meta">Your endurance goal (provisional, not a tour requirement)</div>
            <div className="small">{p.enduranceGoal}</div>
            {p.itinerary && <div className="tiny muted">Itinerary notes: {p.itinerary}</div>}
          </div>
        </div>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Trip details">
        {open && <TripForm p={p} onDone={() => setOpen(false)} />}
      </Sheet>
    </>
  )
}

function TripForm({ p, onDone }: { p: YellowstoneSettings; onDone: () => void }) {
  const [f, setF] = useState(p)
  const set = <K extends keyof YellowstoneSettings>(k: K, v: YellowstoneSettings[K]) => setF({ ...f, [k]: v })
  return (
    <div className="stack">
      <label className="field">
        <span>First day of the trip</span>
        <input type="date" value={f.tripDate.value} onChange={(e) => set('tripDate', { ...f.tripDate, value: e.target.value })} />
      </label>
      <label className="toggle">
        <span>This date is confirmed</span>
        <input type="checkbox" checked={f.tripDate.confirmed} onChange={(e) => set('tripDate', { ...f.tripDate, confirmed: e.target.checked })} />
      </label>
      <label className="field">
        <span>Tour company</span>
        <input value={f.operator} onChange={(e) => set('operator', e.target.value)} placeholder="Not chosen yet" />
      </label>
      <label className="field">
        <span>Itinerary notes</span>
        <textarea value={f.itinerary} onChange={(e) => set('itinerary', e.target.value)} placeholder="Hikes, sights, daily schedule…" />
      </label>
      <div className="grid-2">
        <label className="field">
          <span>Longest hike (miles)</span>
          <NumInput value={f.longestHikeMi.value} digits={1} onChange={(v) => set('longestHikeMi', { ...f.longestHikeMi, value: v })} />
        </label>
        <label className="field">
          <span>Elevation gain (ft)</span>
          <NumInput value={f.elevationGainFt.value} digits={0} onChange={(v) => set('elevationGainFt', { ...f.elevationGainFt, value: v })} />
        </label>
      </div>
      <label className="toggle">
        <span>Hike distance and climb come from the operator</span>
        <input
          type="checkbox"
          checked={f.longestHikeMi.confirmed}
          onChange={(e) => setF({ ...f, longestHikeMi: { ...f.longestHikeMi, confirmed: e.target.checked }, elevationGainFt: { ...f.elevationGainFt, confirmed: e.target.checked } })}
        />
      </label>
      <label className="field">
        <span>Your endurance goal</span>
        <textarea value={f.enduranceGoal} onChange={(e) => set('enduranceGoal', e.target.value)} />
      </label>
      <button
        className="btn primary block"
        onClick={() => {
          void updateSettings({ yellowstone: f })
          onDone()
        }}
      >
        Save
      </button>
    </div>
  )
}

/* ── Horseback goal ────────────────────────────────────────────────── */

function Riding({ prog, p }: { prog: Prog; p: YellowstoneSettings }) {
  const weights = useLiveQuery(() => db.weights.toArray(), []) ?? []
  const [edit, setEdit] = useState(false)
  const u = prog.settings.units
  if (!p.riding.wanted)
    return (
      <button className="btn block" onClick={() => void save({ riding: { ...p.riding, wanted: true } }, p)}>
        Add the optional horseback goal
      </button>
    )
  const trend = weightTrend(weights)
  const now = trend.at(-1)?.avgKg
  const start = weightTrend(weights.filter((w) => w.date >= addDays(p.startDate, -7)))[0]?.avgKg ?? now
  const target = lbToKg(p.riding.limitLb.value - p.riding.marginLb)
  const show = (kg: number) => `${fmt(kgToDisplay(kg, u), 0)} ${weightUnit(u)}`
  const reached = now != null && now <= target
  return (
    <>
      <div className="section-title">
        <h2>Horseback ride (optional)</h2>
        <button className="plain small" style={{ color: 'var(--link)' }} onClick={() => setEdit(!edit)}>
          {edit ? 'Done' : 'Edit'}
        </button>
      </div>
      <div className="card stack-sm">
        <p className="small">
          Weight limit: <strong>under {p.riding.limitLb.value} lb</strong> <Pill confirmed={p.riding.limitLb.confirmed} />
        </p>
        {!p.riding.limitLb.confirmed && <p className="tiny muted">One possible operator lists this. Check your own operator’s rule and enter it here.</p>}
        <p className="small">
          Your comfortable target: <strong>{show(target)}</strong> ({p.riding.marginLb} lb under the limit)
        </p>
        {now != null && start != null && (
          <>
            <Meter value={Math.max(0, start - now)} max={Math.max(0.1, start - target)} tone={reached ? 'good' : undefined} />
            <p className="tiny muted">{reached ? 'You’re under your target ✦' : `Now ${show(now)} (7-day average). No deadline: every pound is progress.`}</p>
          </>
        )}
        {edit && (
          <div className="stack-sm">
            <div className="grid-2">
              <label className="field">
                <span>Limit (lb)</span>
                <NumInput value={p.riding.limitLb.value} digits={0} onChange={(v) => v && void save({ riding: { ...p.riding, limitLb: { ...p.riding.limitLb, value: v } } }, p)} />
              </label>
              <label className="field">
                <span>Margin below it</span>
                <select value={p.riding.marginLb} onChange={(e) => void save({ riding: { ...p.riding, marginLb: Number(e.target.value) } }, p)}>
                  {[5, 10, 15, 20].map((m) => (
                    <option key={m} value={m}>
                      {m} lb
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="toggle">
              <span>Confirmed with my operator</span>
              <input type="checkbox" checked={p.riding.limitLb.confirmed} onChange={(e) => void save({ riding: { ...p.riding, limitLb: { ...p.riding.limitLb, confirmed: e.target.checked } } }, p)} />
            </label>
            <button className="btn ghost sm" onClick={() => void save({ riding: { ...p.riding, wanted: false } }, p)}>
              Remove the riding goal
            </button>
          </div>
        )}
        <p className="tiny text-2">{RIDING_NOTE}</p>
      </div>
    </>
  )
}

/* ── Food ──────────────────────────────────────────────────────────── */

const ACTIVITY_LEVELS: [number, string][] = [
  [1.2, 'Mostly sitting'],
  [1.375, 'Light activity (this program, early on)'],
  [1.55, 'Moderate activity'],
]

function Food({ prog, p }: { prog: Prog; p: YellowstoneSettings }) {
  const s: Settings = prog.settings
  const latest = useLiveQuery(() => db.weights.orderBy('date').last(), [])
  const [activity, setActivity] = useState(1.375)
  const [applied, setApplied] = useState(false)
  const f = p.food
  const setFood = (patch: Partial<YellowstoneSettings['food']>) => void save({ food: { ...f, ...patch } }, p)
  const ready = latest && s.heightCm && s.birthYear
  const reference = p.riding.wanted ? lbToKg(p.riding.limitLb.value - p.riding.marginLb) : s.goalWeightKg ?? latest?.kg ?? 0
  const plan = ready ? foodPlan({ sex: s.sex, age: ageFromSettings(s), heightCm: s.heightCm!, weightKg: latest!.kg, activity, deficit: f.deficit, proteinPerKg: f.proteinPerKg, referenceKg: reference }) : null
  return (
    <>
      <div className="section-title">
        <h2>Food</h2>
      </div>
      <div className="card stack-sm">
        <div className="segmented">
          {(['calories', 'protein', 'habits'] as const).map((m) => (
            <button key={m} className={f.mode === m ? 'active' : ''} onClick={() => setFood({ mode: m })}>
              {m === 'calories' ? 'Calories + protein' : m === 'protein' ? 'Protein only' : 'Habits only'}
            </button>
          ))}
        </div>
        {f.mode === 'habits' ? (
          <ul className="plain-list small">
            <li>Protein at every meal (a palm-sized portion)</li>
            <li>Half your plate vegetables or fruit</li>
            <li>Water with meals, and before and after walks</li>
            <li>Plan snacks for long walk days</li>
          </ul>
        ) : !plan ? (
          <p className="small text-2">
            Add your height and birth year in <Link to="/settings">Settings</Link> and a weigh-in on <Link to="/body">Body</Link> to see a suggestion.
          </p>
        ) : (
          <>
            {f.mode === 'calories' && (
              <p>
                About <strong>{plan.kcal.toLocaleString()} calories a day</strong>
              </p>
            )}
            <p>
              Protein: about <strong>{plan.protein} g a day</strong>
            </p>
            <details>
              <summary className="small" style={{ fontWeight: 700 }}>
                How this is worked out (and how to change it)
              </summary>
              <div className="stack-sm small" style={{ marginTop: 8 }}>
                <p>
                  Maintenance estimate: about {plan.maintenance.toLocaleString()} calories a day, from your height, age, current weight and activity (Mifflin-St Jeor). It’s an estimate; real needs vary, so adjust if your weekly average doesn’t move after 3–4 weeks.
                </p>
                {f.mode === 'calories' && (
                  <p>
                    Minus a {f.deficit}-calorie deficit, never below {plan.floor.toLocaleString()}. That usually means roughly {fmt(plan.weeklyKgEstimate / KG_PER_LB, 1)} lb a week on average, though real weeks go up and down. No promises about dates: steady habits matter more.
                  </p>
                )}
                <p>
                  Protein: {f.proteinPerKg} g per kg of your target weight ({fmt(kgToDisplay(reference, s.units), 0)} {weightUnit(s.units)}). It helps keep muscle while you lose fat.
                </p>
                <label className="field">
                  <span>Activity</span>
                  <select value={activity} onChange={(e) => setActivity(Number(e.target.value))}>
                    {ACTIVITY_LEVELS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                {f.mode === 'calories' && (
                  <label className="field">
                    <span>Deficit</span>
                    <select value={f.deficit} onChange={(e) => setFood({ deficit: Number(e.target.value) })}>
                      {[250, 400, 500].map((d) => (
                        <option key={d} value={d}>
                          {d} calories {d === 250 ? '(gentle)' : d === 400 ? '(steady)' : '(moderate)'}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="field">
                  <span>Protein per kg of target weight</span>
                  <select value={f.proteinPerKg} onChange={(e) => setFood({ proteinPerKg: Number(e.target.value) })}>
                    {[1.2, 1.4, 1.6].map((x) => (
                      <option key={x} value={x}>
                        {x} g
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </details>
            <button
              className="btn sm"
              onClick={() => {
                void updateSettings(f.mode === 'calories' ? { calorieGoal: plan.kcal, proteinGoalG: plan.protein } : { proteinGoalG: plan.protein })
                setApplied(true)
              }}
            >
              {applied ? 'Saved to your Food goals ✓' : 'Use in my Food goals'}
            </button>
            <p className="tiny muted">Eat a bit more on long walk days. Never go much below these numbers.</p>
          </>
        )}
      </div>
    </>
  )
}

/* ── Schedule ──────────────────────────────────────────────────────── */

function Schedule({ p }: { p: YellowstoneSettings }) {
  return (
    <details className="card">
      <summary style={{ fontWeight: 700 }}>Change my workout days</summary>
      <div className="stack-sm" style={{ marginTop: 10 }}>
        {SESSION_KEYS.map((k) => (
          <label key={k} className="field">
            <span>{SESSION_NAMES[k]}</span>
            <select value={p.days[k]} onChange={(e) => void save({ days: { ...p.days, [k]: Number(e.target.value) } }, p)}>
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i} disabled={SESSION_KEYS.some((o) => o !== k && p.days[o] === i)}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        ))}
        <p className="tiny muted">Leave a day between the two strength sessions if you can.</p>
      </div>
    </details>
  )
}

/* ── Safety ────────────────────────────────────────────────────────── */

function Safety() {
  return (
    <details className="card safety">
      <summary className="row" style={{ fontWeight: 700 }}>
        <Icon name="alert" size={16} /> <span className="grow">When to stop and get medical advice</span>
      </summary>
      <ul className="plain-list small" style={{ marginTop: 8 }}>
        {STOP_SIGNS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <p className="small text-2">{STOP_TEXT}</p>
    </details>
  )
}
