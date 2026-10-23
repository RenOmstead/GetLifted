import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ExercisePicker } from '../../components/ExercisePicker'
import { ExerciseThumb } from '../../components/ExerciseVisual'
import { HoldTimer } from '../../components/HoldTimer'
import { HowToSheet } from '../../components/HowTo'
import { Icon } from '../../components/Icon'
import { NumInput } from '../../components/NumInput'
import { Meter } from '../../components/Ring'
import { useRestTimer } from '../../components/RestTimer'
import { Sheet, confirmAction } from '../../components/Sheet'
import { db } from '../../db/db'
import { useSettings } from '../../db/settings'
import type { SetEntry, Units, Workout, WorkoutEntry } from '../../db/types'
import { formatClock, formatDayLabel, formatDuration, formatSeconds } from '../../lib/dates'
import { useExercises, type ExerciseInfo } from '../../lib/exercises'
import { distanceUnit, displayToKg, displayToM, fmt, kgToDisplay, mToDisplay, weightUnit } from '../../lib/units'
import { workoutHighlights, type WorkoutHighlights } from '../../lib/workoutActions'
import { formatSet, lastSets, newSet, uid, workoutStats } from '../../lib/workouts'

const isStretchy = (e: ExerciseInfo) => e.category === 'mobility' || e.category === 'flexibility'

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const request = () =>
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (cancelled) void l.release()
          else lock = l
        })
        .catch(() => undefined)
    void request()
    const onVisible = () => document.visibilityState === 'visible' && void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [active])
}

export default function WorkoutPage() {
  const { id } = useParams()
  const workoutId = Number(id)
  const navigate = useNavigate()
  const settings = useSettings()
  const { get } = useExercises()
  const rest = useRestTimer()
  const allWorkouts = useLiveQuery(() => db.workouts.toArray(), []) ?? []
  const [w, setW] = useState<Workout | null | undefined>(undefined)
  const latest = useRef<Workout | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [now, setNow] = useState(Date.now())
  const [picker, setPicker] = useState(false)
  const [howTo, setHowTo] = useState<ExerciseInfo | null>(null)
  const [menuFor, setMenuFor] = useState<WorkoutEntry | null>(null)
  const [hold, setHold] = useState<{ entryId: string; setId: string } | null>(null)
  const [summary, setSummary] = useState<WorkoutHighlights | null>(null)

  useEffect(() => {
    void db.workouts.get(workoutId).then((x) => {
      latest.current = x ?? null
      setW(x ?? null)
    })
  }, [workoutId])

  const flush = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = null
    if (latest.current) return db.workouts.put(latest.current)
  }, [])

  useEffect(() => () => void flush(), [flush])

  const active = w?.endedAt == null && !!w
  useWakeLock(active)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active])

  const update = (fn: (w: Workout) => Workout) => {
    if (!latest.current) return
    const next = fn(latest.current)
    latest.current = next
    setW(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => void flush(), 300)
  }

  const updateEntry = (entryId: string, fn: (e: WorkoutEntry) => WorkoutEntry) =>
    update((wk) => ({ ...wk, entries: wk.entries.map((e) => (e.id === entryId ? fn(e) : e)) }))

  const updateSet = (entryId: string, setId: string, patch: Partial<SetEntry>) =>
    updateEntry(entryId, (e) => ({ ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }))

  if (w === undefined) return <div className="page" />
  if (w === null)
    return (
      <div className="page">
        <p className="empty">This workout no longer exists.</p>
        <Link className="btn" to="/train">
          Back to Train
        </Link>
      </div>
    )

  const addExercises = (ids: string[]) =>
    update((wk) => ({
      ...wk,
      entries: [
        ...wk.entries,
        ...ids.map((exerciseId) => {
          const ex = get(exerciseId)
          const prev = lastSets(allWorkouts, exerciseId, wk.id)
          const count = prev.length || (isStretchy(ex) || ex.track === 'cardio' ? 1 : 3)
          return {
            id: uid(),
            exerciseId,
            restSec: isStretchy(ex) ? 0 : undefined,
            sets: Array.from({ length: count }, (_, i) =>
              newSet({
                reps: prev[i]?.reps ?? null,
                weightKg: prev[i]?.weightKg ?? null,
                durationSec: prev[i]?.durationSec ?? (ex.track === 'hold' ? 30 : null),
              }),
            ),
          }
        }),
      ],
    }))

  const completeSet = (entry: WorkoutEntry, set: SetEntry, placeholder?: SetEntry) => {
    const ex = get(entry.exerciseId)
    if (set.done) {
      updateSet(entry.id, set.id, { done: false, completedAt: undefined })
      return
    }
    // Empty fields take last time's numbers, so one tap logs a repeat.
    const filled: Partial<SetEntry> = {
      done: true,
      completedAt: Date.now(),
      reps: set.reps ?? placeholder?.reps ?? null,
      weightKg: set.weightKg ?? placeholder?.weightKg ?? null,
      durationSec: set.durationSec ?? placeholder?.durationSec ?? null,
      distanceM: set.distanceM ?? placeholder?.distanceM ?? null,
    }
    updateSet(entry.id, set.id, filled)
    const restSec = entry.restSec ?? (isStretchy(ex) ? 0 : settings.defaultRestSec)
    if (active && restSec > 0) rest.start(restSec)
  }

  const finish = async () => {
    update((wk) => ({ ...wk, endedAt: Date.now() }))
    await flush()
    rest.stop()
    setSummary(await workoutHighlights(latest.current!, get))
  }

  const discard = async () => {
    if (!confirmAction(active ? 'Discard this workout? Nothing from it will be saved.' : 'Delete this workout from your history?')) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    latest.current = null
    rest.stop()
    await db.workouts.delete(workoutId)
    navigate('/train', { replace: true })
  }

  const stats = workoutStats(w)
  const totalSets = w.entries.reduce((n, e) => n + e.sets.length, 0)
  const nextEntry = w.entries.find((e) => e.sets.some((x) => !x.done))
  const nextSetNo = nextEntry ? nextEntry.sets.findIndex((x) => !x.done) + 1 : 0
  const holdEntry = hold ? w.entries.find((e) => e.id === hold.entryId) : undefined
  const holdEx = holdEntry ? get(holdEntry.exerciseId) : undefined
  const holdSet = holdEntry?.sets.find((s) => s.id === hold?.setId)

  return (
    <div className="page">
      <div className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="chevronLeft" />
        </button>
        <div className="grow">
          <input
            className="input title-input"
            value={w.name}
            onChange={(e) => update((wk) => ({ ...wk, name: e.target.value }))}
            aria-label="Workout name"
          />
          <div className="subtitle num">
            {active ? `In progress · ${formatClock(now - w.startedAt)}` : `${formatDayLabel(w.date)} · ${formatDuration(stats.durationMs)}`}
          </div>
        </div>
        <button className="icon-btn" onClick={() => void discard()} aria-label={active ? 'Discard workout' : 'Delete workout'}>
          <Icon name="trash" />
        </button>
      </div>

      {active && totalSets > 0 && (
        <div className="card tight stack-sm workout-progress">
          <div className="row-between small">
            <span className="num">
              <strong>{stats.sets}</strong> of {totalSets} sets
            </span>
            {nextEntry ? (
              <button className="plain up-next" onClick={() => document.getElementById(`entry-${nextEntry.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                Next: {get(nextEntry.exerciseId).name} · set {nextSetNo} ↓
              </button>
            ) : (
              <span className="status good">
                <Icon name="check" size={14} /> All done. Finish below!
              </span>
            )}
          </div>
          <Meter value={stats.sets} max={totalSets} tone={stats.sets >= totalSets ? 'good' : undefined} />
        </div>
      )}

      {w.entries.length === 0 && (
        <div className="card empty">
          <Icon name="dumbbell" size={32} />
          <p>Add your first exercise. Tap a picture any time to see how it’s done.</p>
        </div>
      )}

      {w.entries.map((entry) => {
        const ex = get(entry.exerciseId)
        const prev = lastSets(allWorkouts, entry.exerciseId, w.id)
        return (
          <div key={entry.id} id={`entry-${entry.id}`} className="entry-anchor">
          <EntryCard
            entry={entry}
            exercise={ex}
            previous={prev}
            units={settings.units}
            onShowHowTo={() => setHowTo(ex)}
            onMenu={() => setMenuFor(entry)}
            onSet={(setId, patch) => updateSet(entry.id, setId, patch)}
            onComplete={(set, ph) => completeSet(entry, set, ph)}
            onHold={(setId) => setHold({ entryId: entry.id, setId })}
            onAddSet={() =>
              updateEntry(entry.id, (e) => {
                const last = e.sets.at(-1)
                return { ...e, sets: [...e.sets, newSet({ reps: last?.reps, weightKg: last?.weightKg, durationSec: last?.durationSec, distanceM: last?.distanceM })] }
              })
            }
            onRemoveSet={() => updateEntry(entry.id, (e) => ({ ...e, sets: e.sets.slice(0, -1) }))}
          />
          </div>
        )
      })}

      <button className="btn block lg" onClick={() => setPicker(true)}>
        <Icon name="plus" /> Add exercise
      </button>

      {active ? (
        <button className="btn primary block lg" onClick={() => void finish()} disabled={!stats.sets}>
          <Icon name="check" /> Finish workout
        </button>
      ) : (
        <p className="center muted small">Changes save automatically.</p>
      )}

      <ExercisePicker open={picker} onClose={() => setPicker(false)} onPick={addExercises} />
      <HowToSheet exercise={howTo} onClose={() => setHowTo(null)} />

      <Sheet open={!!menuFor} onClose={() => setMenuFor(null)} title={menuFor ? get(menuFor.exerciseId).name : ''}>
        {menuFor && (
          <div className="stack">
            <label className="field">
              <span>Rest after each set</span>
              <select
                value={menuFor.restSec ?? -1}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  updateEntry(menuFor.id, (en) => ({ ...en, restSec: v < 0 ? undefined : v }))
                  setMenuFor({ ...menuFor, restSec: v < 0 ? undefined : v })
                }}
              >
                <option value={-1}>Default ({formatSeconds(settings.defaultRestSec)})</option>
                {[0, 30, 45, 60, 90, 120, 150, 180, 240, 300].map((s) => (
                  <option key={s} value={s}>
                    {s === 0 ? 'No rest timer' : formatSeconds(s)}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid-2">
              <button
                className="btn"
                onClick={() => {
                  update((wk) => {
                    const i = wk.entries.findIndex((e) => e.id === menuFor.id)
                    if (i <= 0) return wk
                    const entries = [...wk.entries]
                    ;[entries[i - 1], entries[i]] = [entries[i], entries[i - 1]]
                    return { ...wk, entries }
                  })
                  setMenuFor(null)
                }}
              >
                <Icon name="arrowUp" size={18} /> Move up
              </button>
              <button
                className="btn"
                onClick={() => {
                  update((wk) => {
                    const i = wk.entries.findIndex((e) => e.id === menuFor.id)
                    if (i < 0 || i >= wk.entries.length - 1) return wk
                    const entries = [...wk.entries]
                    ;[entries[i + 1], entries[i]] = [entries[i], entries[i + 1]]
                    return { ...wk, entries }
                  })
                  setMenuFor(null)
                }}
              >
                <Icon name="arrowDown" size={18} /> Move down
              </button>
            </div>
            <Link className="btn" to={`/exercise/${encodeURIComponent(menuFor.exerciseId)}`}>
              <Icon name="history" size={18} /> History & notes
            </Link>
            <button
              className="btn danger"
              onClick={() => {
                update((wk) => ({ ...wk, entries: wk.entries.filter((e) => e.id !== menuFor.id) }))
                setMenuFor(null)
              }}
            >
              <Icon name="trash" size={18} /> Remove exercise
            </button>
          </div>
        )}
      </Sheet>

      {holdEntry && holdEx && holdSet && (
        <HoldTimer
          open
          onClose={() => setHold(null)}
          title={holdEx.name}
          targetSec={holdSet.durationSec || 30}
          perSide={holdEx.perSide}
          countdown={isStretchy(holdEx)}
          onDone={(sec) => {
            updateSet(holdEntry.id, holdSet.id, { durationSec: sec, done: true, completedAt: Date.now() })
            const restSec = holdEntry.restSec ?? (isStretchy(holdEx) ? 0 : settings.defaultRestSec)
            if (active && restSec > 0) rest.start(restSec)
          }}
        />
      )}

      <Sheet
        open={!!summary}
        onClose={() => navigate('/train', { replace: true })}
        title="Workout complete 🎉"
      >
        {summary && (
          <div className="stack">
            <div className="grid-3">
              <div className="stat">
                <div className="label">Time</div>
                <div className="value">{formatDuration(stats.durationMs)}</div>
              </div>
              <div className="stat">
                <div className="label">Sets</div>
                <div className="value">{stats.sets}</div>
              </div>
              {stats.volumeKg > 0 ? (
                <div className="stat">
                  <div className="label">Volume</div>
                  <div className="value">
                    {fmt(kgToDisplay(stats.volumeKg, settings.units), 0)}
                    <small>{weightUnit(settings.units)}</small>
                  </div>
                </div>
              ) : (
                <div className="stat">
                  <div className="label">Exercises</div>
                  <div className="value">{stats.exercises}</div>
                </div>
              )}
            </div>
            {summary.skillLevels.map((s) => (
              <div className="callout" key={`${s.skillName}${s.level}`}>
                <Icon name="star" />
                <div>
                  <strong>{s.skillName}: level {s.level} unlocked!</strong>
                  <div>You hit the target for {get(s.levelExerciseId).name}. The next step is ready in Skills.</div>
                </div>
              </div>
            ))}
            {summary.records.map((r) => (
              <div className="callout" key={r.exerciseId}>
                <Icon name="trophy" />
                <div>
                  <strong>New personal record</strong>
                  <div>{get(r.exerciseId).name}</div>
                </div>
              </div>
            ))}
            {!summary.records.length && !summary.skillLevels.length && <p className="muted">Beautifully done. You showed up for yourself today ✦</p>}
            <button className="btn primary lg block" onClick={() => navigate('/train', { replace: true })}>
              Done
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}

interface EntryCardProps {
  entry: WorkoutEntry
  exercise: ExerciseInfo
  previous: SetEntry[]
  units: Units
  onShowHowTo: () => void
  onMenu: () => void
  onSet: (setId: string, patch: Partial<SetEntry>) => void
  onComplete: (set: SetEntry, placeholder?: SetEntry) => void
  onHold: (setId: string) => void
  onAddSet: () => void
  onRemoveSet: () => void
}

function EntryCard({ entry, exercise, previous, units, onShowHowTo, onMenu, onSet, onComplete, onHold, onAddSet, onRemoveSet }: EntryCardProps) {
  const t = exercise.track
  const wu = weightUnit(units)
  const headers: Record<typeof t, [string, string]> = {
    weighted: [wu, 'Reps'],
    reps: ['Reps', `+${wu}`],
    hold: ['Seconds', 'Timer'],
    cardio: ['Minutes', distanceUnit(units)],
  }
  const done = entry.sets.filter((s) => s.done).length
  return (
    <div className="card stack-sm">
      <div className="row">
        <button className="icon-btn" style={{ width: 'auto', height: 'auto', padding: 0 }} onClick={onShowHowTo} aria-label={`How to do ${exercise.name}`}>
          <ExerciseThumb exercise={exercise} large />
        </button>
        <div className="grow">
          <button onClick={onShowHowTo} style={{ all: 'unset', cursor: 'pointer', fontWeight: 650 }}>
            {exercise.name}
          </button>
          <div className="meta small muted">
            {done}/{entry.sets.length} sets{exercise.perSide ? ' · each side' : ''}
          </div>
          {previous.length > 0 && <div className="tiny muted truncate">Last: {previous.map((s) => formatSet(s, t, units)).join(', ')}</div>}
        </div>
        <button className="icon-btn" onClick={onMenu} aria-label="Exercise options">
          <Icon name="settings" />
        </button>
      </div>

      <div className="set-table">
        <div className="set-row">
          <span className="set-head">Set</span>
          <span className="set-head">{headers[t][0]}</span>
          <span className="set-head">{headers[t][1]}</span>
          <span className="set-head">Done</span>
        </div>
        {entry.sets.map((s, i) => {
          // Empty fields suggest the set you just did, or else last time's numbers.
          const above = entry.sets.slice(0, i).reverse().find((x) => x.done)
          const ph = above ?? previous[i] ?? previous.at(-1)
          return (
            <div className={`set-row ${s.done ? 'done' : ''}`} key={s.id}>
              <span className="set-no">{i + 1}</span>
              {t === 'weighted' && (
                <>
                  <NumInput aria-label="Weight" value={s.weightKg != null ? kgToDisplay(s.weightKg, units) : null} placeholder={ph?.weightKg ? fmt(kgToDisplay(ph.weightKg, units)) : '0'} onChange={(v) => onSet(s.id, { weightKg: v == null ? null : displayToKg(v, units) })} />
                  <NumInput aria-label="Reps" value={s.reps} digits={0} placeholder={ph?.reps ? String(ph.reps) : '0'} onChange={(v) => onSet(s.id, { reps: v })} />
                </>
              )}
              {t === 'reps' && (
                <>
                  <NumInput aria-label="Reps" value={s.reps} digits={0} placeholder={ph?.reps ? String(ph.reps) : '0'} onChange={(v) => onSet(s.id, { reps: v })} />
                  <NumInput aria-label="Added weight" value={s.weightKg != null ? kgToDisplay(s.weightKg, units) : null} placeholder="–" onChange={(v) => onSet(s.id, { weightKg: v == null || v === 0 ? null : displayToKg(v, units) })} />
                </>
              )}
              {t === 'hold' && (
                <>
                  <NumInput aria-label="Seconds" value={s.durationSec} digits={0} placeholder={ph?.durationSec ? String(ph.durationSec) : '30'} onChange={(v) => onSet(s.id, { durationSec: v })} />
                  <button className="btn sm" onClick={() => onHold(s.id)} aria-label="Start hold timer">
                    <Icon name="timer" size={18} />
                  </button>
                </>
              )}
              {t === 'cardio' && (
                <>
                  <NumInput aria-label="Minutes" value={s.durationSec != null ? s.durationSec / 60 : null} placeholder={ph?.durationSec ? fmt(ph.durationSec / 60) : '0'} onChange={(v) => onSet(s.id, { durationSec: v == null ? null : Math.round(v * 60) })} />
                  <NumInput aria-label="Distance" value={s.distanceM != null ? mToDisplay(s.distanceM, units) : null} placeholder="–" onChange={(v) => onSet(s.id, { distanceM: v == null ? null : displayToM(v, units) })} />
                </>
              )}
              <button className={`check-btn ${s.done ? 'on' : ''}`} onClick={() => onComplete(s, ph)} aria-label={s.done ? 'Mark set not done' : 'Mark set done'} aria-pressed={s.done}>
                <Icon name="check" size={20} strokeWidth={2.5} />
              </button>
            </div>
          )
        })}
      </div>
      <div className="row">
        <button className="btn sm grow" onClick={onAddSet}>
          <Icon name="plus" size={16} /> Add set
        </button>
        {entry.sets.length > 1 && (
          <button className="btn sm ghost" onClick={onRemoveSet}>
            <Icon name="minus" size={16} /> Remove set
          </button>
        )}
      </div>
    </div>
  )
}
