import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Icon } from '../../components/Icon'
import { NumInput } from '../../components/NumInput'
import { Meter, Ring } from '../../components/Ring'
import { Sheet } from '../../components/Sheet'
import type { Profile } from '../../data/nutrients'
import { db } from '../../db/db'
import { ageFromSettings, useSettings } from '../../db/settings'
import type { MealEntry, MealType, Supplement } from '../../db/types'
import { addDays, dateKey, formatDayLabel } from '../../lib/dates'
import { evaluateIntake, formatAmount, STATUS_TEXT, supplementTotals, type NutrientRow } from '../../lib/nutrients'
import { mealTotals } from '../../lib/nutrition'
import { fmt, mlToDisplay, volumeUnit, displayToMl } from '../../lib/units'
import { AddFoodSheet, MEAL_LABELS } from './AddFoodSheet'

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function DayNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const today = dateKey()
  return (
    <div className="day-nav">
      <button className="icon-btn filled" onClick={() => onChange(addDays(date, -1))} aria-label="Previous day">
        <Icon name="chevronLeft" />
      </button>
      <button className="btn ghost" onClick={() => onChange(today)}>
        <span className="label">{formatDayLabel(date)}</span>
      </button>
      <button className="icon-btn filled" onClick={() => onChange(addDays(date, 1))} disabled={date >= today} aria-label="Next day">
        <Icon name="chevronRight" />
      </button>
    </div>
  )
}

export default function Nutrition() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'vitamins' ? 'vitamins' : 'meals'
  const [date, setDate] = useState(dateKey())
  return (
    <div className="page">
      <div className="page-header">
        <h1>Nutrition</h1>
      </div>
      <div className="segmented">
        <button className={tab === 'meals' ? 'active' : ''} onClick={() => setParams({}, { replace: true })}>
          Meals & calories
        </button>
        <button className={tab === 'vitamins' ? 'active' : ''} onClick={() => setParams({ tab: 'vitamins' }, { replace: true })}>
          Vitamins & supplements
        </button>
      </div>
      <DayNav date={date} onChange={setDate} />
      {tab === 'meals' ? <MealsTab date={date} /> : <VitaminsTab date={date} />}
    </div>
  )
}

function MealsTab({ date }: { date: string }) {
  const settings = useSettings()
  const meals = useLiveQuery(() => db.meals.where('date').equals(date).toArray(), [date]) ?? []
  const water = useLiveQuery(() => db.water.where('date').equals(date).toArray(), [date]) ?? []
  const [adding, setAdding] = useState<MealType | null>(null)
  const [editing, setEditing] = useState<MealEntry | null>(null)
  const t = mealTotals(meals)
  const remaining = settings.calorieGoal - t.kcal
  const waterMl = water.reduce((s, w) => s + w.ml, 0)
  const u = settings.units
  const waterSteps = u === 'imperial' ? [8, 16] : [250, 500]

  return (
    <>
      <div className="card row" style={{ gap: 16 }}>
        <Ring value={t.kcal} max={settings.calorieGoal} size={128} stroke={11} label={`${Math.round(t.kcal)} of ${settings.calorieGoal} calories`}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(Math.abs(remaining))}</div>
          <div className="tiny muted">{remaining >= 0 ? 'kcal left' : 'kcal over'}</div>
        </Ring>
        <div className="grow stack-sm">
          {(
            [
              ['Protein', t.protein, settings.proteinGoalG],
              ['Carbs', t.carbs, settings.carbGoalG],
              ['Fat', t.fat, settings.fatGoalG],
            ] as const
          ).map(([label, v, goal]) => (
            <div key={label}>
              <div className="row-between small">
                <span>{label}</span>
                <span className="num muted">
                  {Math.round(v)} / {goal} g
                </span>
              </div>
              <Meter value={v} max={goal} tone="series" />
            </div>
          ))}
          <div className="tiny muted">
            {Math.round(t.kcal)} eaten · goal {settings.calorieGoal} kcal
          </div>
        </div>
      </div>

      <div className="card stack-sm tint-sky">
        <div className="row-between">
          <div className="card-title" style={{ margin: 0 }}>
            <Icon name="droplet" size={18} /> Water
          </div>
          <span className="num small">
            {fmt(mlToDisplay(waterMl, u), 0)} / {fmt(mlToDisplay(settings.waterGoalMl, u), 0)} {volumeUnit(u)}
          </span>
        </div>
        <Meter value={waterMl} max={settings.waterGoalMl} tone="series" />
        <div className="row">
          {waterSteps.map((v) => (
            <button key={v} className="btn sm grow" onClick={() => void db.water.add({ date, ml: displayToMl(v, u), at: Date.now() })}>
              +{v} {volumeUnit(u)}
            </button>
          ))}
          <button
            className="btn sm ghost"
            disabled={!water.length}
            onClick={() => {
              const last = [...water].sort((a, b) => b.at - a.at)[0]
              if (last?.id) void db.water.delete(last.id)
            }}
          >
            Undo
          </button>
        </div>
      </div>

      {MEALS.map((m) => {
        const items = meals.filter((e) => e.meal === m)
        const kcal = mealTotals(items).kcal
        return (
          <div className="card flush" key={m}>
            <div className="row-between" style={{ padding: '12px 16px 4px' }}>
              <h3>{MEAL_LABELS[m]}</h3>
              <span className="small muted num">{Math.round(kcal)} kcal</span>
            </div>
            <div className="list">
              {items.map((e) => (
                <button key={e.id} className="list-item" onClick={() => setEditing(e)}>
                  <div className="grow">
                    <div className="title truncate">{e.food.name}</div>
                    <div className="meta">
                      {fmt(e.servings, 2)} × {e.food.servingLabel}
                    </div>
                  </div>
                  <span className="num small">{Math.round(e.food.kcal * e.servings)}</span>
                </button>
              ))}
              <button className="list-item" onClick={() => setAdding(m)} style={{ color: 'var(--accent)', fontWeight: 600 }}>
                <Icon name="plus" size={18} /> Add food
              </button>
            </div>
          </div>
        )
      })}

      <AddFoodSheet open={adding != null} onClose={() => setAdding(null)} date={date} meal={adding ?? 'snack'} />
      <EditMealSheet entry={editing} onClose={() => setEditing(null)} />
    </>
  )
}

function EditMealSheet({ entry, onClose }: { entry: MealEntry | null; onClose: () => void }) {
  const [servings, setServings] = useState<number | null>(null)
  const value = servings ?? entry?.servings ?? 1
  return (
    <Sheet
      open={!!entry}
      onClose={() => {
        setServings(null)
        onClose()
      }}
      title={entry?.food.name}
    >
      {entry && (
        <div className="stack">
          <label className="field">
            <span>Servings ({entry.food.servingLabel})</span>
            <NumInput value={value} onChange={setServings} />
          </label>
          <p className="small muted">
            {Math.round(entry.food.kcal * value)} kcal · P {fmt(entry.food.protein * value)} g · C {fmt(entry.food.carbs * value)} g · F {fmt(entry.food.fat * value)} g
          </p>
          <div className="grid-2">
            <button
              className="btn danger"
              onClick={() => {
                void db.meals.delete(entry.id!)
                setServings(null)
                onClose()
              }}
            >
              <Icon name="trash" size={18} /> Remove
            </button>
            <button
              className="btn primary"
              disabled={!value}
              onClick={() => {
                void db.meals.update(entry.id!, { servings: value })
                setServings(null)
                onClose()
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </Sheet>
  )
}

const STATUS_TONE = { over: 'critical', high: 'warning', below: 'info', met: 'good', 'in-range': 'good', none: 'info' } as const
const STATUS_ICON = { over: 'alert', high: 'alert', below: 'info', met: 'check', 'in-range': 'check', none: 'info' } as const

export function NutrientRowView({ row }: { row: NutrientRow }) {
  const [open, setOpen] = useState(false)
  const n = row.nutrient
  const scaleMax = Math.max(row.ul ?? 0, row.targetHigh ?? 0, row.target ?? 0, row.total) * 1.05 || 1
  const tone = STATUS_TONE[row.status]
  return (
    <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
      <button style={{ all: 'unset', cursor: 'pointer' }} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="row-between">
          <strong>{n.name}</strong>
          <span className="num">{formatAmount(row.total, n.unit)}</span>
        </div>
        <div className="row-between">
          <span className={`status ${tone}`}>
            <Icon name={STATUS_ICON[row.status]} size={14} /> {STATUS_TEXT[row.status]}
          </span>
          <span className="tiny muted num">
            {row.target != null && `${n.targetType === 'range' ? 'Range' : n.targetType} ${formatAmount(row.target, n.unit)}${row.targetHigh != null ? `–${formatAmount(row.targetHigh, n.unit)}` : ''}`}
            {row.target != null && row.ul != null && ' · '}
            {row.ul != null && `${n.ulLabel ?? 'Max'} ${formatAmount(row.ul, n.unit)}`}
          </span>
        </div>
        <div style={{ position: 'relative', marginTop: 6 }}>
          <Meter value={row.total} max={scaleMax} tone={row.status === 'over' ? 'over' : row.status === 'high' ? 'warn' : row.status === 'met' || row.status === 'in-range' ? 'good' : 'series'} />
          {row.target != null && <span style={{ position: 'absolute', top: -3, height: 14, width: 2, background: 'var(--text-2)', left: `${(row.target / scaleMax) * 100}%` }} title="Daily target" />}
          {row.ul != null && <span style={{ position: 'absolute', top: -3, height: 14, width: 2, background: 'var(--critical)', left: `${Math.min(100, (row.ul / scaleMax) * 100)}%` }} title="Upper limit" />}
        </div>
      </button>
      {open && (
        <div className="stack-sm small text-2" style={{ paddingTop: 4 }}>
          {row.sources.map((s, i) => (
            <div key={i} className="row-between">
              <span>{s.supplementName}</span>
              <span className="num">{formatAmount(s.amount, n.unit)}</span>
            </div>
          ))}
          {row.fromFood > 0 && (
            <div className="row-between">
              <span>Food logged today</span>
              <span className="num">{formatAmount(row.fromFood, n.unit)}</span>
            </div>
          )}
          {n.ulScope === 'supplements' && row.ul != null && <p>The upper limit for {n.name} counts supplements only.</p>}
          {n.note && <p>{n.note}</p>}
          <a href={n.source.url} target="_blank" rel="noreferrer" className="row" style={{ gap: 4 }}>
            {n.source.label} <Icon name="external" size={14} />
          </a>
        </div>
      )}
    </div>
  )
}

function VitaminsTab({ date }: { date: string }) {
  const settings = useSettings()
  const supplements = useLiveQuery(() => db.supplements.toArray(), []) ?? []
  const logs = useLiveQuery(() => db.supplementLogs.where('date').equals(date).toArray(), [date]) ?? []
  const meals = useLiveQuery(() => db.meals.where('date').equals(date).toArray(), [date]) ?? []
  const [view, setView] = useState<'plan' | 'logged'>('plan')
  const profile: Profile = { age: ageFromSettings(settings), sex: settings.sex, smoker: settings.smoker }
  const active = supplements.filter((s) => s.active)

  const planned = supplementTotals(active.map((s) => ({ supplement: s, servings: s.dailyServings })))
  const taken = supplementTotals(
    logs.flatMap((l) => {
      const s = supplements.find((x) => x.id === l.supplementId)
      return s ? [{ supplement: s, servings: l.servings }] : []
    }),
  )
  const foodMicros = mealTotals(meals).micros
  const rows = view === 'plan' ? evaluateIntake(profile, planned.totals, planned.sources) : evaluateIntake(profile, taken.totals, taken.sources, foodMicros)
  const unmatched = view === 'plan' ? planned.unmatched : taken.unmatched
  const problems = rows.filter((r) => r.status === 'over').length

  const toggleTaken = async (s: Supplement) => {
    const existing = logs.find((l) => l.supplementId === s.id)
    if (existing?.id) await db.supplementLogs.delete(existing.id)
    else await db.supplementLogs.add({ date, supplementId: s.id!, servings: s.dailyServings, at: Date.now() })
  }

  return (
    <>
      <div className="section-title">
        <h2>Checklist</h2>
        <Link to="/nutrition/supplement/new">+ Add supplement</Link>
      </div>
      {active.length ? (
        <div className="card flush list">
          {active.map((s) => {
            const on = logs.some((l) => l.supplementId === s.id)
            return (
              <div key={s.id} className="list-item">
                <button className={`check-btn ${on ? 'on' : ''}`} onClick={() => void toggleTaken(s)} aria-pressed={on} aria-label={`Took ${s.name}`}>
                  <Icon name="check" size={20} strokeWidth={2.5} />
                </button>
                <Link to={`/nutrition/supplement/${s.id}`} className="grow" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <div className="title">{s.name}</div>
                  <div className="meta">
                    {s.dailyServings} × {s.servingLabel}
                    {s.brand ? ` · ${s.brand}` : ''}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card empty">
          <Icon name="pill" size={30} />
          <p>Add your vitamins and supplements. Search the NIH label database to fill in the exact amounts.</p>
          <Link className="btn primary" to="/nutrition/supplement/new" style={{ marginTop: 12 }}>
            Add supplement
          </Link>
        </div>
      )}

      {supplements.some((s) => !s.active) && (
        <details className="small">
          <summary className="muted">Paused supplements</summary>
          <div className="card flush list" style={{ marginTop: 8 }}>
            {supplements
              .filter((s) => !s.active)
              .map((s) => (
                <Link key={s.id} className="list-item" to={`/nutrition/supplement/${s.id}`}>
                  {s.name}
                </Link>
              ))}
          </div>
        </details>
      )}

      <div className="section-title">
        <h2>Are you taking the right amount?</h2>
      </div>
      <div className="segmented">
        <button className={view === 'plan' ? 'active' : ''} onClick={() => setView('plan')}>
          Daily plan
        </button>
        <button className={view === 'logged' ? 'active' : ''} onClick={() => setView('logged')}>
          Taken + food ({formatDayLabel(date)})
        </button>
      </div>
      <p className="small muted">
        Compared with reference values for a {profile.age}-year-old {profile.sex}
        {profile.smoker ? ' who smokes' : ''}. <Link to="/settings">Change profile</Link>
      </p>
      {problems > 0 && (
        <div className="callout critical">
          <Icon name="alert" />
          <div>
            <strong>
              {problems} nutrient{problems > 1 ? 's are' : ' is'} above the upper limit.
            </strong>{' '}
            Long-term intake above the UL raises the risk of side effects. Check the details below and talk to your doctor or pharmacist before changing doses.
          </div>
        </div>
      )}
      {rows.length ? (
        <div className="card flush list">
          {rows.map((r) => (
            <NutrientRowView key={r.nutrient.id} row={r} />
          ))}
        </div>
      ) : (
        <p className="empty small">{view === 'plan' ? 'Add supplements to see how your daily stack compares.' : 'Check off what you took to see today’s totals.'}</p>
      )}
      {view === 'logged' && <p className="tiny muted">Food only counts when the food’s label data includes vitamins and minerals (many packaged foods from Open Food Facts do). Most whole foods you add yourself don’t, so “below target” here is often fine.</p>}
      {unmatched.length > 0 && <p className="tiny muted">Not compared (no reference value): {unmatched.join(', ')}.</p>}
      <p className="tiny muted">
        Reference values: National Academies Dietary Reference Intakes for healthy adults, via NIH Office of Dietary Supplements fact sheets; performance supplements use the linked position stands. This is general information, not medical advice. Needs differ in
        pregnancy, with medical conditions or with medications.
      </p>
    </>
  )
}
