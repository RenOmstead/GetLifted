import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { Meter } from '../../components/Ring'
import { db } from '../../db/db'
import { useSettings } from '../../db/settings'
import { addDays, formatShortDate, parseDateKey } from '../../lib/dates'
import { weekSummary, type DaySummary } from '../../lib/nutrition'
import { fmt } from '../../lib/units'

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Seven calorie bars with the goal as a dashed line; tap a bar for its numbers. */
function WeekBars({ days, goal, onSelect, selected }: { days: DaySummary[]; goal: number; selected: number | null; onSelect: (i: number | null) => void }) {
  const W = 320
  const H = 150
  const top = 14
  const bottom = 22
  const max = Math.max(goal * 1.15, ...days.map((d) => d.kcal)) || 1
  const y = (v: number) => top + (H - top - bottom) * (1 - v / max)
  const slot = W / days.length
  const bw = Math.min(30, slot - 10)
  return (
    <svg className="week-bars" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Calories for 7 days against a goal of ${goal}`}>
      <line className="goal" x1={0} x2={W} y1={y(goal)} y2={y(goal)} />
      {days.map((d, i) => {
        const x = i * slot + (slot - bw) / 2
        const h = d.logged ? Math.max(4, H - bottom - y(d.kcal)) : 3
        const yTop = H - bottom - h
        // Rounded top, square base: anchored to the baseline.
        const r = Math.min(4, h / 2, bw / 2)
        const path = `M${x},${H - bottom} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + bw - r} Q${x + bw},${yTop} ${x + bw},${yTop + r} V${H - bottom} Z`
        return (
          <g key={d.date}>
            <path className={`bar ${d.logged ? '' : 'empty'} ${selected === i ? 'active' : ''}`} d={path} />
            <text x={i * slot + slot / 2} y={H - 6} textAnchor="middle">
              {DAY[parseDateKey(d.date).getDay()]}
            </text>
            <rect className="hit" x={i * slot} y={0} width={slot} height={H} onClick={() => onSelect(selected === i ? null : i)} onPointerEnter={(e) => e.pointerType === 'mouse' && onSelect(i)}>
              <title>{d.logged ? `${formatShortDate(d.date)}: ${Math.round(d.kcal).toLocaleString()} kcal, ${Math.round(d.protein)} g protein` : `${formatShortDate(d.date)}: nothing logged`}</title>
            </rect>
          </g>
        )
      })}
    </svg>
  )
}

export function WeekTab({ date }: { date: string }) {
  const settings = useSettings()
  const from = addDays(date, -6)
  const meals = useLiveQuery(() => db.meals.where('date').between(from, date, true, true).toArray(), [from, date]) ?? []
  const dates = Array.from({ length: 7 }, (_, i) => addDays(from, i))
  const w = weekSummary(meals, dates, settings.calorieGoal, settings.proteinGoalG)
  const [sel, setSel] = useState<number | null>(null)
  const picked = sel != null ? w.days[sel] : null
  const fiberGoal = Math.round((settings.calorieGoal / 1000) * 14)

  if (!w.logged)
    return (
      <div className="card empty">
        <Icon name="calendar" size={30} />
        <p>No food logged from {formatShortDate(from)} to {formatShortDate(date)}. Log a few days to see your weekly averages.</p>
      </div>
    )

  const kcalDiff = w.avgKcal - settings.calorieGoal
  return (
    <>
      <p className="small muted" style={{ margin: 0 }}>
        {formatShortDate(from)} – {formatShortDate(date)} · averages use the {w.logged} day{w.logged > 1 ? 's' : ''} you logged
      </p>
      <div className="grid-2">
        <div className="card tight stat">
          <div className="label">Avg calories</div>
          <div className="value">{Math.round(w.avgKcal).toLocaleString()}</div>
          <div className="tiny muted">
            {Math.abs(kcalDiff) < 25 ? 'right on your goal' : `${Math.round(Math.abs(kcalDiff))} ${kcalDiff > 0 ? 'over' : 'under'} goal of ${settings.calorieGoal.toLocaleString()}`}
          </div>
        </div>
        <div className="card tight stat">
          <div className="label">Avg protein</div>
          <div className="value">
            {Math.round(w.avgProtein)} <small>g</small>
          </div>
          <div className="tiny muted">goal {settings.proteinGoalG} g</div>
        </div>
      </div>

      <div className="card stack-sm">
        <div className="row-between">
          <div className="card-title" style={{ margin: 0 }}>
            <Icon name="flame" size={18} /> Calories by day
          </div>
          <span className="tiny muted">dashed line: {settings.calorieGoal.toLocaleString()} goal</span>
        </div>
        <WeekBars days={w.days} goal={settings.calorieGoal} selected={sel} onSelect={setSel} />
        <p className="small" style={{ margin: 0, minHeight: '1.4em' }}>
          {picked ? (
            picked.logged ? (
              <>
                <strong>{formatShortDate(picked.date)}</strong> · {Math.round(picked.kcal).toLocaleString()} kcal · {Math.round(picked.protein)} g protein · {fmt(picked.fiber, 0)} g fiber
              </>
            ) : (
              <>
                <strong>{formatShortDate(picked.date)}</strong> · nothing logged
              </>
            )
          ) : (
            <span className="muted">Tap a bar for that day’s numbers.</span>
          )}
        </p>
      </div>

      <div className="card stack-sm">
        <div className="card-title" style={{ margin: 0 }}>
          <Icon name="target" size={18} /> Days on target
        </div>
        <div>
          <div className="row-between small">
            <span>Calories within 10% of goal</span>
            <span className="num">
              {w.kcalOnTarget} of {w.logged}
            </span>
          </div>
          <Meter value={w.kcalOnTarget} max={w.logged} tone="good" />
        </div>
        <div>
          <div className="row-between small">
            <span>Protein at 90% of goal or more</span>
            <span className="num">
              {w.proteinMet} of {w.logged}
            </span>
          </div>
          <Meter value={w.proteinMet} max={w.logged} tone="good" />
        </div>
        <div className="row-between small">
          <span>Avg fiber</span>
          <span className="num">
            {fmt(w.avgFiber, 0)} g <span className="muted">· goal {fiberGoal} g</span>
          </span>
        </div>
        <div className="row-between small">
          <span>Avg sodium</span>
          <span className={`num ${w.avgSodium > 2300 ? 'warning-text' : ''}`}>
            {Math.round(w.avgSodium).toLocaleString()} mg <span className="muted">· under 2,300</span>
          </span>
        </div>
        <p className="tiny muted">
          Weekly averages matter more than any single day. A higher day balanced by lower ones still averages out; consistency is what moves the scale. Sodium and fiber only count foods that list them.
        </p>
      </div>

      <div className="card flush list" aria-label="Daily totals">
        {[...w.days].reverse().map((d) => (
          <div className="list-item" key={d.date}>
            <div className="grow">
              <div className="title">{formatShortDate(d.date)}</div>
              <div className="meta">{d.logged ? `${Math.round(d.protein)} g protein · ${fmt(d.fiber, 0)} g fiber` : 'Nothing logged'}</div>
            </div>
            <span className="num small">{d.logged ? `${Math.round(d.kcal).toLocaleString()} kcal` : '–'}</span>
          </div>
        ))}
      </div>
    </>
  )
}
