import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Decor } from '../components/Decor'
import { Icon } from '../components/Icon'
import { NumInput } from '../components/NumInput'
import { Meter } from '../components/Ring'
import { Sheet } from '../components/Sheet'
import { db } from '../db/db'
import { updateSettings } from '../db/settings'
import type { ProgramLog, Units, YellowstoneSettings } from '../db/types'
import { addDays, dateKey, formatShortDate } from '../lib/dates'
import { KG_PER_LB, displayToM, distanceUnit } from '../lib/units'
import { derive, ridingStone, STONES, stoneProgress, TRACKS, type Derived, type Stone, type Track } from '../lib/ysGoals'
import { isEasyWeek, levelState, mondayOf, PHASES, weeksUntil, type Phase } from '../lib/yellowstone'

/** Stones, goals and how you're doing, from everything you've logged. */
export function useGoals(p: YellowstoneSettings) {
  const logs = useLiveQuery(() => db.programLogs.toArray(), []) ?? []
  const workouts = useLiveQuery(() => db.workouts.where('date').aboveOrEqual(p.startDate).toArray(), [p.startDate]) ?? []
  const weights = useLiveQuery(() => db.weights.toArray(), []) ?? []
  const marks = useLiveQuery(() => db.skillMarks.where('skillId').equals('ys').toArray(), []) ?? []
  const ridingKg = p.riding.wanted ? (p.riding.limitLb.value - p.riding.marginLb) * KG_PER_LB : null
  const d = derive({ logs, workouts, weights, startDate: p.startDate, ridingTargetKg: ridingKg, goalWalkMin: 180 })
  const stones = ridingKg ? [...STONES, ridingStone(ridingKg)] : STONES
  const marked = new Set(marks.map((m) => m.id.replace(/^ys:/, '')))
  const state = stones.map((s) => ({ stone: s, ...stoneProgress(s, d, marked) }))
  return { d, state, ridingKg }
}

type Goals = ReturnType<typeof useGoals>

/* ── Your goals ────────────────────────────────────────────────────── */

export function GoalCards({ p, goals }: { p: YellowstoneSettings; goals: Goals }) {
  const { d, state, ridingKg } = goals
  const track = (t: Track) => state.filter((s) => s.stone.track === t)
  const sb = [...track('strength'), ...track('balance')]
  const trip = Math.min(1, d.longestWalk / 180)
  return (
    <div className="goal-grid">
      <div className="card goal">
        <div className="goal-icon">🥾</div>
        <div className="goal-title">Trip-day walking</div>
        <div className="small text-2">3 hours with breaks, two days running</div>
        <Meter value={trip} max={1} tone={trip >= 1 ? 'good' : undefined} />
        <div className="tiny muted">
          Longest so far: {Math.round(d.longestWalk) || p.baselineMin} min of 180 <span className="fact-pill">provisional</span>
        </div>
      </div>
      <div className="card goal">
        <div className="goal-icon">💪</div>
        <div className="goal-title">Strength & balance</div>
        <div className="small text-2">Stairs, uneven ground and a daypack</div>
        <Meter value={sb.filter((s) => s.done).length} max={sb.length} />
        <div className="tiny muted">
          {sb.filter((s) => s.done).length} of {sb.length} stepping stones
        </div>
      </div>
      {ridingKg && (
        <div className="card goal">
          <div className="goal-icon">🐴</div>
          <div className="goal-title">Riding weight</div>
          <div className="small text-2">
            Under {Math.round(ridingKg / KG_PER_LB)} lb, no deadline <span className={`fact-pill ${p.riding.limitLb.confirmed ? 'yes' : ''}`}>{p.riding.limitLb.confirmed ? 'confirmed' : 'assumption'}</span>
          </div>
          <Meter value={d.lostLb} max={Math.max(1, d.nowKg != null ? d.lostLb + Math.max(0, d.nowKg - ridingKg) / KG_PER_LB : 1)} />
          <div className="tiny muted">{d.nowKg != null ? `${Math.round(d.lostLb)} lb down · ${Math.max(0, Math.round((d.nowKg - ridingKg) / KG_PER_LB))} lb to go` : 'Add a weigh-in to start'}</div>
        </div>
      )}
    </div>
  )
}

/* ── Next stepping stones ──────────────────────────────────────────── */

/** The next unfinished stone in each track, closest first. */
export function nextStones(goals: Goals, n = 3) {
  const firsts = (Object.keys(TRACKS) as Track[]).map((t) => goals.state.find((s) => s.stone.track === t && !s.done)).filter((x) => x != null)
  return firsts.sort((a, b) => b!.pct - a!.pct).slice(0, n) as Goals['state']
}

export function NextStones({ goals, onAll }: { goals: Goals; onAll: () => void }) {
  const next = nextStones(goals)
  const done = goals.state.filter((s) => s.done).length
  return (
    <div className="card stack-sm">
      <div className="row-between">
        <div className="card-title" style={{ margin: 0 }}>
          <Icon name="star" size={18} /> Next stepping stones
        </div>
        <button className="plain small" style={{ color: 'var(--link)' }} onClick={onAll}>
          All {goals.state.length} ({done} done)
        </button>
      </div>
      {next.map((s) => (
        <StoneRow key={s.stone.id} s={s} />
      ))}
    </div>
  )
}

function StoneRow({ s }: { s: Goals['state'][number] }) {
  const toggle = () => void (s.done ? db.skillMarks.delete(`ys:${s.stone.id}`) : db.skillMarks.put({ id: `ys:${s.stone.id}`, skillId: 'ys', level: 0, achievedAt: Date.now() }))
  return (
    <div className={`stone-row ${s.done ? 'done' : ''}`}>
      <span className="stone-dot">{s.done ? '★' : TRACKS[s.stone.track].icon}</span>
      <div className="grow stack-sm" style={{ gap: 3 }}>
        <div style={{ fontWeight: 700 }}>{s.stone.title}</div>
        <div className="tiny text-2">{s.stone.hint}</div>
        {!s.stone.manual && !s.done && (
          <>
            <Meter value={s.pct} max={1} />
            {s.label && <div className="tiny muted num">{s.label}</div>}
          </>
        )}
      </div>
      {s.stone.manual && (
        <button className={`check-btn ${s.done ? 'on' : ''}`} onClick={toggle} aria-pressed={s.done} aria-label={s.done ? `Untick ${s.stone.title}` : `Tick ${s.stone.title}`}>
          <Icon name="check" size={18} />
        </button>
      )}
    </div>
  )
}

/** Every stone, as a trail per track. */
export function StoneTrail({ open, onClose, goals }: { open: boolean; onClose: () => void; goals: Goals }) {
  const [track, setTrack] = useState<Track>('walk')
  const list = goals.state.filter((s) => s.stone.track === track)
  const firstOpen = list.findIndex((s) => !s.done)
  return (
    <Sheet open={open} onClose={onClose} title="Stepping stones">
      <div className="stack">
        <div className="chips">
          {(Object.keys(TRACKS) as Track[]).map((t) => (
            <button key={t} className={`chip ${track === t ? 'active' : ''}`} onClick={() => setTrack(t)}>
              {TRACKS[t].icon} {TRACKS[t].name} ({goals.state.filter((s) => s.stone.track === t && s.done).length}/{goals.state.filter((s) => s.stone.track === t).length})
            </button>
          ))}
        </div>
        <div className="stone-trail">
          {list.map((s, i) => (
            <div key={s.stone.id} className={`stone-step ${s.done ? 'done' : i === firstOpen ? 'current' : 'later'}`}>
              <StoneRow s={s} />
            </div>
          ))}
        </div>
        <p className="tiny muted">Most stones tick themselves off from your check-ins, workouts, progress checks and weigh-ins. Tick the ones with a circle yourself.</p>
      </div>
    </Sheet>
  )
}

/* ── New stone celebration ─────────────────────────────────────────── */

export function Celebrate({ p, goals }: { p: YellowstoneSettings; goals: Goals }) {
  const seen = new Set(p.celebrated ?? [])
  const fresh = goals.state.filter((s) => s.done && !seen.has(s.stone.id))
  if (!fresh.length) return null
  const dismiss = () => void updateSettings({ yellowstone: { ...p, celebrated: [...seen, ...fresh.map((s) => s.stone.id)] } })
  return (
    <div className="card stack-sm center celebrate">
      <Decor name="amethyst_cluster" className="decor-empty" />
      <div className="eyebrow">New stepping stone{fresh.length > 1 ? 's' : ''}!</div>
      {fresh.slice(0, 3).map((s) => (
        <div key={s.stone.id} className="handwritten" style={{ fontSize: '1.3rem', color: 'var(--berry)' }}>
          ★ {s.stone.title}
        </div>
      ))}
      <button className="btn primary block" onClick={dismiss}>
        Yay ✦
      </button>
    </div>
  )
}

/* ── Roadmap ───────────────────────────────────────────────────────── */

const PHASE_STEPS: [Phase, number, number][] = [
  ['foundation', 1, 7],
  ['build', 8, 15],
  ['trail', 16, 21],
  ['rehearsal', 22, 30],
]

/** When each step would start if you go up one step every full week. */
export function projectSteps(p: YellowstoneSettings, today = dateKey()) {
  const weeks = weeksUntil(p.tripDate.value, today)
  const starts = new Map<number, string>()
  let level = p.level
  let monday = mondayOf(today)
  starts.set(level, monday)
  for (let i = 1; i < weeks - 2; i++) {
    const prev = monday
    monday = addDays(monday, 7)
    if (!isEasyWeek(p.startDate, prev)) level++
    if (!starts.has(level)) starts.set(level, monday)
  }
  return { atTrip: level, starts }
}

export function Roadmap({ p }: { p: YellowstoneSettings }) {
  const { atTrip, starts } = projectSteps(p)
  const st = (n: number) => levelState(n, p.baselineMin)
  const atTripState = st(atTrip)
  return (
    <div className="card stack">
      <div className="card-title" style={{ margin: 0 }}>
        <Icon name="calendar" size={18} /> Your road to Yellowstone
      </div>
      <p className="small text-2">
        Going up one step most weeks, you’d reach step {atTrip} by the trip: Saturday walks of about {Math.round(atTripState.longMin / 6) / 10} hours
        {atTripState.packLb ? ` with a ${atTripState.packLb} lb pack` : ''}. Repeating weeks is normal and the plan adjusts. Dates are estimates, not deadlines.
      </p>
      <div className="roadmap">
        {PHASE_STEPS.map(([ph, from, to]) => {
          const a = st(from)
          const b = st(Math.min(to, Math.max(from, atTrip)))
          const here = p.level >= from && p.level <= to
          const done = p.level > to
          const when = starts.get(from)
          return (
            <div key={ph} className={`road-step ${here ? 'here' : done ? 'done' : ''}`}>
              <span className="road-dot">{done ? '★' : here ? '●' : '○'}</span>
              <div className="grow">
                <div className="row-between">
                  <strong>{PHASES[ph].name}</strong>
                  <span className="tiny muted">
                    steps {from}–{to}
                    {when && !done && !here ? ` · ~${formatShortDate(when)}` : ''}
                    {here ? ' · you are here' : ''}
                  </span>
                </div>
                <div className="small text-2">{PHASES[ph].text}</div>
                <div className="tiny">
                  Walks {a.walkMin}→{b.walkMin} min · Saturday {a.longMin}→{b.longMin} min
                  {b.inclinePct ? ` · incline up to ${b.inclinePct}%` : ''}
                  {b.packLb ? ` · pack up to ${b.packLb} lb` : ''}
                  {from >= 22 ? ' · back-to-back days' : ''}
                </div>
              </div>
            </div>
          )
        })}
        <div className={`road-step ${weeksUntil(p.tripDate.value) <= 2 ? 'here' : ''}`}>
          <span className="road-dot">○</span>
          <div className="grow">
            <div className="row-between">
              <strong>{PHASES.taper.name}</strong>
              <span className="tiny muted">last 2 weeks</span>
            </div>
            <div className="small text-2">{PHASES.taper.text}</div>
          </div>
        </div>
        <div className="road-step trip">
          <span className="road-dot">🏞</span>
          <div className="grow">
            <strong>Yellowstone!</strong>
            <div className="small text-2">{formatShortDate(p.tripDate.value)}</div>
          </div>
        </div>
      </div>
      <details>
        <summary className="small" style={{ fontWeight: 700 }}>
          Every step in detail
        </summary>
        <table className="plan-table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Step</th>
              <th>Walks</th>
              <th>Saturday</th>
              <th>Extra</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(atTrip, p.level) + 1 }, (_, i) => i + 1).map((n) => {
              const s = st(n)
              const prev = n > 1 ? st(n - 1) : null
              const change = !prev ? 'start' : s.inclinePct !== prev.inclinePct ? `incline ${s.inclinePct}%` : s.packLb !== prev.packLb ? `pack ${s.packLb} lb` : 'more time'
              return (
                <tr key={n} className={n === p.level ? 'current' : ''}>
                  <td className="num">{n}</td>
                  <td className="num">{s.walkMin} min</td>
                  <td className="num">{s.longMin} min</td>
                  <td className="small">{change}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </details>
    </div>
  )
}

/* ── Extra walks ───────────────────────────────────────────────────── */

export function LogWalk({ open, onClose, units }: { open: boolean; onClose: () => void; units: Units }) {
  const [min, setMin] = useState<number | null>(null)
  const [dist, setDist] = useState<number | null>(null)
  const [incline, setIncline] = useState<number | null>(null)
  const [elev, setElev] = useState<number | null>(null)
  const [pack, setPack] = useState<number | null>(null)
  const [effort, setEffort] = useState<number | null>(null)
  const [date, setDate] = useState(dateKey())
  const save = async () => {
    const log: ProgramLog = { date, kind: 'walk', status: 'done', walkMin: min, distanceM: dist != null ? displayToM(dist, units) : null, inclinePct: incline, elevationFt: elev, packLb: pack, effort }
    await db.programLogs.add(log)
    setMin(null)
    setDist(null)
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Log a walk">
      <div className="stack">
        <p className="small text-2">Any walk counts toward your stepping stones: errands, dog walks, sightseeing.</p>
        <div className="grid-2">
          <label className="field">
            <span>Minutes</span>
            <NumInput value={min} digits={0} onChange={setMin} placeholder="30" />
          </label>
          <label className="field">
            <span>Distance ({distanceUnit(units)}, optional)</span>
            <NumInput value={dist} digits={2} onChange={setDist} />
          </label>
          <label className="field">
            <span>Incline % (optional)</span>
            <NumInput value={incline} digits={1} onChange={setIncline} />
          </label>
          <label className="field">
            <span>Elevation gain ft (optional)</span>
            <NumInput value={elev} digits={0} onChange={setElev} />
          </label>
          <label className="field">
            <span>Pack weight lb (optional)</span>
            <NumInput value={pack} digits={1} onChange={setPack} />
          </label>
          <label className="field">
            <span>Effort 1–10 (optional)</span>
            <NumInput value={effort} digits={0} onChange={setEffort} />
          </label>
        </div>
        <label className="field">
          <span>Day</span>
          <input type="date" value={date} max={dateKey()} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button className="btn primary block" disabled={!min} onClick={() => void save()}>
          Save walk
        </button>
      </div>
    </Sheet>
  )
}

export type { Derived, Stone }
