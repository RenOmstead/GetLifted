import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ExercisePicker } from '../../components/ExercisePicker'
import { ExerciseThumb } from '../../components/ExerciseVisual'
import { HowToSheet } from '../../components/HowTo'
import { Icon } from '../../components/Icon'
import { NumInput } from '../../components/NumInput'
import { confirmAction } from '../../components/Sheet'
import { db } from '../../db/db'
import { updateSettings, useSettings } from '../../db/settings'
import type { Routine, RoutineEntry } from '../../db/types'
import { formatSeconds } from '../../lib/dates'
import { useExercises, type ExerciseInfo } from '../../lib/exercises'
import { displayToKg, kgToDisplay, weightUnit } from '../../lib/units'
import { startWorkout } from '../../lib/workoutActions'
import { DAY_NAMES, WEEK_ORDER } from './Train'

const REST_OPTIONS = [0, 30, 45, 60, 90, 120, 150, 180, 240]

function defaultsFor(e: ExerciseInfo): RoutineEntry {
  const stretchy = e.category === 'mobility' || e.category === 'flexibility'
  return {
    exerciseId: e.id,
    sets: stretchy || e.track === 'cardio' ? 1 : 3,
    reps: e.track === 'reps' || e.track === 'weighted' ? (stretchy ? 10 : 8) : null,
    durationSec: e.track === 'hold' ? 30 : e.track === 'cardio' ? 1200 : null,
    restSec: stretchy ? 0 : null,
  }
}

export default function RoutineEditor() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const settings = useSettings()
  const { get } = useExercises()
  const [routine, setRoutine] = useState<Routine | null>(isNew ? { name: '', entries: [], createdAt: Date.now() } : null)
  const [picker, setPicker] = useState(false)
  const [howTo, setHowTo] = useState<ExerciseInfo | null>(null)
  const [days, setDays] = useState<number[]>([])
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (isNew) return
    void db.routines.get(Number(id)).then((r) => setRoutine(r ?? null))
  }, [id, isNew])

  useEffect(() => {
    if (routine?.id != null) setDays(settings.weeklyPlan.flatMap((list, wd) => (list.includes(routine.id!) ? [wd] : [])))
    // Only on load: afterwards the chips are the source of truth until saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine?.id])

  if (!routine) return <div className="page" />

  const edit = (fn: (r: Routine) => Routine) => {
    setRoutine((r) => (r ? fn(r) : r))
    setDirty(true)
  }
  const editEntry = (i: number, patch: Partial<RoutineEntry>) => edit((r) => ({ ...r, entries: r.entries.map((e, j) => (j === i ? { ...e, ...patch } : e)) }))
  const move = (i: number, delta: number) =>
    edit((r) => {
      const j = i + delta
      if (j < 0 || j >= r.entries.length) return r
      const entries = [...r.entries]
      ;[entries[i], entries[j]] = [entries[j], entries[i]]
      return { ...r, entries }
    })

  const save = async (): Promise<number> => {
    const toSave = { ...routine, name: routine.name.trim() || 'My routine' }
    const rid = (await db.routines.put(toSave)) as number
    const plan = settings.weeklyPlan.map((list, wd) => {
      const without = list.filter((x) => x !== rid)
      return days.includes(wd) ? [...without, rid] : without
    })
    await updateSettings({ weeklyPlan: plan })
    setRoutine({ ...toSave, id: rid })
    setDirty(false)
    return rid
  }

  const remove = async () => {
    if (!routine.id || !confirmAction(`Delete “${routine.name}”? Past workouts stay in your history.`)) return
    await db.routines.delete(routine.id)
    await updateSettings({ weeklyPlan: settings.weeklyPlan.map((l) => l.filter((x) => x !== routine.id)) })
    navigate('/train?tab=routines', { replace: true })
  }

  const wu = weightUnit(settings.units)

  return (
    <div className="page">
      <div className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="chevronLeft" />
        </button>
        <h1>{isNew && !routine.id ? 'New routine' : 'Edit routine'}</h1>
        {routine.id && (
          <button className="icon-btn" onClick={() => void remove()} aria-label="Delete routine">
            <Icon name="trash" />
          </button>
        )}
      </div>

      <label className="field">
        <span>Name</span>
        <input value={routine.name} placeholder="e.g. Upper body + mobility" onChange={(e) => edit((r) => ({ ...r, name: e.target.value }))} />
      </label>

      <div className="field">
        <span className="field-label">Planned on</span>
        <div className="chips" style={{ margin: 0, padding: 0, flexWrap: 'wrap' }}>
          {WEEK_ORDER.map((wd) => (
            <button
              key={wd}
              className={`chip ${days.includes(wd) ? 'active' : ''}`}
              onClick={() => {
                setDays((d) => (d.includes(wd) ? d.filter((x) => x !== wd) : [...d, wd]))
                setDirty(true)
              }}
            >
              {DAY_NAMES[wd].slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {routine.entries.map((entry, i) => {
        const ex = get(entry.exerciseId)
        return (
          <div className="card stack-sm" key={`${entry.exerciseId}-${i}`}>
            <div className="row">
              <button style={{ all: 'unset', cursor: 'pointer' }} onClick={() => setHowTo(ex)} aria-label={`How to do ${ex.name}`}>
                <ExerciseThumb exercise={ex} large />
              </button>
              <div className="grow">
                <div style={{ fontWeight: 650 }}>{ex.name}</div>
                <div className="small muted">{ex.equipment ?? ''}</div>
              </div>
              <div className="stack-sm" style={{ gap: 0 }}>
                <button className="icon-btn" style={{ height: 32 }} onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0}>
                  <Icon name="arrowUp" size={18} />
                </button>
                <button className="icon-btn" style={{ height: 32 }} onClick={() => move(i, 1)} aria-label="Move down" disabled={i === routine.entries.length - 1}>
                  <Icon name="arrowDown" size={18} />
                </button>
              </div>
              <button className="icon-btn" onClick={() => edit((r) => ({ ...r, entries: r.entries.filter((_, j) => j !== i) }))} aria-label="Remove">
                <Icon name="x" />
              </button>
            </div>
            <div className="grid-3">
              <label className="field">
                <span>Sets</span>
                <NumInput className="input" value={entry.sets} digits={0} onChange={(v) => editEntry(i, { sets: Math.max(1, Math.round(v ?? 1)) })} />
              </label>
              {(ex.track === 'reps' || ex.track === 'weighted') && (
                <label className="field">
                  <span>Reps{ex.perSide ? '/side' : ''}</span>
                  <NumInput className="input" value={entry.reps} digits={0} placeholder="–" onChange={(v) => editEntry(i, { reps: v })} />
                </label>
              )}
              {ex.track === 'hold' && (
                <label className="field">
                  <span>Seconds{ex.perSide ? '/side' : ''}</span>
                  <NumInput className="input" value={entry.durationSec} digits={0} placeholder="30" onChange={(v) => editEntry(i, { durationSec: v })} />
                </label>
              )}
              {ex.track === 'cardio' && (
                <label className="field">
                  <span>Minutes</span>
                  <NumInput className="input" value={entry.durationSec != null ? entry.durationSec / 60 : null} placeholder="20" onChange={(v) => editEntry(i, { durationSec: v == null ? null : Math.round(v * 60) })} />
                </label>
              )}
              {ex.track === 'weighted' ? (
                <label className="field">
                  <span>{wu}</span>
                  <NumInput className="input" value={entry.weightKg != null ? kgToDisplay(entry.weightKg, settings.units) : null} placeholder="Last" onChange={(v) => editEntry(i, { weightKg: v == null ? null : displayToKg(v, settings.units) })} />
                </label>
              ) : (
                <label className="field">
                  <span>Rest</span>
                  <select value={entry.restSec ?? -1} onChange={(e) => editEntry(i, { restSec: Number(e.target.value) < 0 ? null : Number(e.target.value) })}>
                    <option value={-1}>Default</option>
                    {REST_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s === 0 ? 'None' : formatSeconds(s)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>
        )
      })}

      <button className="btn lg block" onClick={() => setPicker(true)}>
        <Icon name="plus" /> Add exercises
      </button>

      <div className="grid-2 sticky-actions">
        <button
          className="btn lg"
          disabled={!routine.entries.length}
          onClick={() =>
            void save()
              .then((rid) => db.routines.get(rid))
              .then((r) => startWorkout(r))
              .then((wid) => navigate(`/train/workout/${wid}`))
          }
        >
          <Icon name="play" size={16} /> Save & start
        </button>
        <button className="btn primary lg" disabled={!dirty && !!routine.id} onClick={() => void save().then(() => navigate('/train?tab=routines'))}>
          <Icon name="check" /> Save
        </button>
      </div>

      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(ids) => edit((r) => ({ ...r, entries: [...r.entries, ...ids.map((x) => defaultsFor(get(x)))] }))}
      />
      <HowToSheet exercise={howTo} onClose={() => setHowTo(null)} />
    </div>
  )
}
