import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { Ring } from '../components/Ring'
import { Sheet, confirmAction } from '../components/Sheet'
import { db } from '../db/db'
import { updateSettings, useSettings } from '../db/settings'
import type { Fast } from '../db/types'
import { formatClock, formatDateTime, formatDuration, fromDateTimeInput, toDateTimeInput } from '../lib/dates'
import { FAST_PRESETS, FAST_STAGES, fastHours, fastStage, fastStats } from '../lib/fasting'
import { fmt } from '../lib/units'

export function useActiveFast(): Fast | undefined {
  return useLiveQuery(() => db.fasts.filter((f) => f.end == null).first(), [])
}

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export default function Fasting() {
  const settings = useSettings()
  const active = useActiveFast()
  const fasts = useLiveQuery(() => db.fasts.orderBy('start').reverse().toArray(), []) ?? []
  const now = useNow()
  const [editing, setEditing] = useState<Fast | null>(null)
  const stats = fastStats(fasts, now)

  const start = async () => {
    await db.fasts.add({ start: Date.now(), end: null, goalHours: settings.fastingGoalHours })
  }
  const end = async () => {
    if (active?.id) await db.fasts.update(active.id, { end: Date.now() })
  }

  const hours = active ? fastHours(active, now) : 0
  const goalMs = (active?.goalHours ?? settings.fastingGoalHours) * 3_600_000
  const elapsed = active ? now - active.start : 0
  const stage = fastStage(hours)
  const reached = active != null && elapsed >= goalMs

  return (
    <div className="page">
      <div className="page-header">
        <h1>Fasting</h1>
      </div>

      <div className="card stack" style={{ alignItems: 'center' }}>
        <Ring value={elapsed} max={goalMs} size={230} stroke={14} done={reached} label="Fasting progress">
          {active ? (
            <>
              <div className="tiny muted">{reached ? 'Goal reached!' : 'Elapsed'}</div>
              <div className="hero-number num" style={{ fontSize: '2.4rem' }}>
                {formatClock(elapsed)}
              </div>
              <div className="small muted num">{reached ? `+${formatDuration(elapsed - goalMs)} over` : `${formatDuration(goalMs - elapsed)} to go`}</div>
            </>
          ) : (
            <>
              <div className="hero-number">{settings.fastingGoalHours}h</div>
              <div className="small muted">goal</div>
            </>
          )}
        </Ring>
        {active ? (
          <>
            <div className="center">
              <div style={{ fontWeight: 650 }}>{stage.title}</div>
              <div className="small text-2">{stage.text}</div>
            </div>
            <div className="small muted">
              Started {formatDateTime(active.start)} · ends {formatDateTime(active.start + goalMs)}
            </div>
            <div className="grid-2" style={{ width: '100%' }}>
              <button className="btn lg" onClick={() => setEditing(active)}>
                <Icon name="edit" size={18} /> Edit start
              </button>
              <button className="btn primary lg" onClick={() => void end()}>
                End fast
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="chips" style={{ justifyContent: 'center', flexWrap: 'wrap', margin: 0 }}>
              {FAST_PRESETS.map((p) => (
                <button key={p.hours} className={`chip ${settings.fastingGoalHours === p.hours ? 'active' : ''}`} onClick={() => void updateSettings({ fastingGoalHours: p.hours })}>
                  {p.label}
                </button>
              ))}
            </div>
            <button className="btn primary lg block" onClick={() => void start()}>
              <Icon name="play" size={16} /> Start fasting now
            </button>
            <button
              className="btn ghost block"
              onClick={() => setEditing({ start: Date.now() - 2 * 3_600_000, end: null, goalHours: settings.fastingGoalHours })}
            >
              I started earlier…
            </button>
          </>
        )}
      </div>

      <div className="grid-2">
        <div className="card tight stat">
          <div className="label">Streak</div>
          <div className="value">
            {stats.streak}
            <small>days</small>
          </div>
        </div>
        <div className="card tight stat">
          <div className="label">Average fast</div>
          <div className="value">
            {fmt(stats.averageHours)}
            <small>h</small>
          </div>
        </div>
        <div className="card tight stat">
          <div className="label">Longest</div>
          <div className="value">
            {fmt(stats.longestHours)}
            <small>h</small>
          </div>
        </div>
        <div className="card tight stat">
          <div className="label">Completed</div>
          <div className="value">{stats.completed}</div>
        </div>
      </div>

      <details className="card">
        <summary style={{ fontWeight: 600, cursor: 'pointer' }}>What happens while you fast</summary>
        <div className="stack-sm" style={{ marginTop: 12 }}>
          {FAST_STAGES.map((s) => (
            <div key={s.from} className="row" style={{ alignItems: 'flex-start' }}>
              <span className="badge" style={{ minWidth: 48, justifyContent: 'center' }}>
                {s.from}h+
              </span>
              <div className="small">
                <strong>{s.title}.</strong> <span className="text-2">{s.text}</span>
              </div>
            </div>
          ))}
          <p className="tiny muted">Approximate. Timing varies with your last meal, activity and metabolism. If you’re pregnant, diabetic, on medication, or have a history of eating disorders, talk to your doctor before fasting.</p>
        </div>
      </details>

      <div className="section-title">
        <h2>History</h2>
      </div>
      <div className="card flush list">
        {fasts.filter((f) => f.end != null).length === 0 && <div className="empty small">Completed fasts appear here.</div>}
        {fasts
          .filter((f) => f.end != null)
          .slice(0, 50)
          .map((f) => {
            const h = fastHours(f)
            return (
              <button key={f.id} className="list-item" onClick={() => setEditing(f)}>
                <div className="grow">
                  <div className="title">{formatDuration(h * 3_600_000)}</div>
                  <div className="meta">
                    {formatDateTime(f.start)} → {formatDateTime(f.end!)}
                  </div>
                </div>
                {h >= f.goalHours ? (
                  <span className="status good">
                    <Icon name="check" size={16} /> {f.goalHours}h goal
                  </span>
                ) : (
                  <span className="status info">{f.goalHours}h goal</span>
                )}
              </button>
            )
          })}
      </div>

      <EditFastSheet fast={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function EditFastSheet({ fast, onClose }: { fast: Fast | null; onClose: () => void }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [goal, setGoal] = useState(16)
  useEffect(() => {
    if (!fast) return
    setStart(toDateTimeInput(fast.start))
    setEnd(fast.end ? toDateTimeInput(fast.end) : '')
    setGoal(fast.goalHours)
  }, [fast])
  if (!fast) return null
  const s = fromDateTimeInput(start)
  const e = end ? fromDateTimeInput(end) : null
  const valid = s != null && s <= Date.now() && (e == null || e > s)
  return (
    <Sheet open onClose={onClose} title={fast.id ? 'Edit fast' : 'Start a fast'}>
      <div className="stack">
        <label className="field">
          <span>Started</span>
          <input type="datetime-local" value={start} onChange={(ev) => setStart(ev.target.value)} />
        </label>
        {fast.end != null && (
          <label className="field">
            <span>Ended</span>
            <input type="datetime-local" value={end} onChange={(ev) => setEnd(ev.target.value)} />
          </label>
        )}
        <label className="field">
          <span>Goal (hours)</span>
          <select value={goal} onChange={(ev) => setGoal(Number(ev.target.value))}>
            {[12, 13, 14, 16, 18, 20, 23, 24, 36, 48, 72].map((h) => (
              <option key={h} value={h}>
                {h} hours
              </option>
            ))}
          </select>
        </label>
        <div className="grid-2">
          {fast.id ? (
            <button
              className="btn danger"
              onClick={() => {
                if (!confirmAction('Delete this fast?')) return
                void db.fasts.delete(fast.id!)
                onClose()
              }}
            >
              Delete
            </button>
          ) : (
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
          )}
          <button
            className="btn primary"
            disabled={!valid}
            onClick={() => {
              void db.fasts.put({ ...fast, start: s!, end: fast.end != null ? e : null, goalHours: goal })
              onClose()
            }}
          >
            Save
          </button>
        </div>
      </div>
    </Sheet>
  )
}
