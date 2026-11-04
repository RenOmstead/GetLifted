import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { Meter } from '../../components/Ring'
import { dailyChecks, macroSplit, type CheckStatus, type Totals } from '../../lib/nutrition'
import { fmt } from '../../lib/units'

const TONE: Record<CheckStatus, { cls: string; icon: 'check' | 'alert' | 'info'; meter: 'good' | 'over' | 'series' }> = {
  good: { cls: 'good', icon: 'check', meter: 'good' },
  high: { cls: 'critical', icon: 'alert', meter: 'over' },
  low: { cls: 'info', icon: 'info', meter: 'series' },
  unknown: { cls: 'info', icon: 'info', meter: 'series' },
}

/** Fiber, sodium, sugar and saturated fat against the Dietary Guidelines, plus the macro split. */
export function NutrientChecks({ totals, calorieGoal, isToday }: { totals: Totals; calorieGoal: number; isToday: boolean }) {
  const [open, setOpen] = useState<string | null>(null)
  const checks = dailyChecks(totals, calorieGoal)
  const split = macroSplit(totals)
  const hasFood = totals.known.entries > 0
  const flagged = checks.filter((c) => c.status === 'high').length

  return (
    <div className="card stack-sm" aria-label="Nutrient checks">
      <div className="row-between">
        <div className="card-title" style={{ margin: 0 }}>
          <Icon name="check" size={18} /> Nutrient checks
        </div>
        {hasFood && <span className={`status ${flagged ? 'critical' : 'good'}`}>{flagged ? `${flagged} over` : 'On track'}</span>}
      </div>
      {!hasFood ? (
        <p className="small muted">Log food to see fiber, sodium, sugar and saturated fat against the Dietary Guidelines.</p>
      ) : (
        <>
          {checks.map((c) => {
            const t = TONE[c.status]
            const label = c.kind === 'min' ? `goal ${fmt(c.target, 0)} ${c.unit}` : `under ${c.target.toLocaleString()} ${c.unit}`
            return (
              <button key={c.id} className="check-row" onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id}>
                <div className="row-between small">
                  <span>
                    <strong>{c.label}</strong>{' '}
                    <span className={`status ${t.cls}`}>
                      <Icon name={t.icon} size={13} />
                      {c.status === 'good' ? (c.kind === 'min' ? 'Met' : 'OK') : c.status === 'high' ? 'Over' : c.status === 'low' ? (isToday ? 'So far' : 'Low') : 'Info'}
                    </span>
                  </span>
                  <span className="num muted">
                    {c.unit === 'mg' ? Math.round(c.value).toLocaleString() : fmt(c.value, 0)} {c.unit} · {label}
                  </span>
                </div>
                <Meter value={c.value} max={Math.max(c.target, c.value) * 1.05 || 1} tone={c.status === 'unknown' ? 'series' : t.meter} />
                {open === c.id && (
                  <div className="tiny text-2" style={{ textAlign: 'left', marginTop: 4 }}>
                    {c.why}
                    {c.missing > 0 && ` ${c.missing} of ${totals.known.entries} logged food${totals.known.entries > 1 ? 's' : ''} had no ${c.label.toLowerCase()} data, so the real total may be higher.`}
                  </div>
                )}
              </button>
            )
          })}
          <div>
            <div className="row-between small" style={{ marginBottom: 4 }}>
              <strong>Calories from</strong>
              <span className="tiny muted">with healthy ranges</span>
            </div>
            <div className="split-bar" role="img" aria-label={split.map((m) => `${m.label} ${Math.round(m.pct)}%`).join(', ')}>
              {split.map((m) => (
                <span key={m.id} className={`split-${m.id}`} style={{ width: `${m.pct}%` }} />
              ))}
            </div>
            <div className="grid-3 tiny" style={{ marginTop: 6, gap: 6 }}>
              {split.map((m) => {
                const inRange = m.pct >= m.low && m.pct <= m.high
                return (
                  <div key={m.id}>
                    <div className="row" style={{ gap: 4 }}>
                      <span className={`split-dot split-${m.id}`} />
                      <strong>
                        {m.label} {Math.round(m.pct)}%
                      </strong>
                    </div>
                    <div className={inRange ? 'muted' : 'warning-text'}>
                      {inRange ? '' : m.pct < m.low ? 'low · ' : 'high · '}
                      {m.low}–{m.high}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <p className="tiny muted">Tap a row for why it matters. Dietary Guidelines for Americans 2020–2025.</p>
        </>
      )}
    </div>
  )
}
