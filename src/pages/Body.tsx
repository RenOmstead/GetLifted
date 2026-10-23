import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Decor } from '../components/Decor'
import { Icon } from '../components/Icon'
import { LineChart } from '../components/LineChart'
import { NumInput } from '../components/NumInput'
import { Sheet, confirmAction } from '../components/Sheet'
import { db } from '../db/db'
import { useSettings } from '../db/settings'
import type { WeightEntry } from '../db/types'
import { addDays, dateKey, formatDayLabel, formatShortDate, parseDateKey } from '../lib/dates'
import { cmToDisplay, displayToCm, displayToKg, fmt, kgToDisplay, lengthUnit, weightUnit } from '../lib/units'

const RANGES = [
  ['1M', 30],
  ['3M', 91],
  ['6M', 182],
  ['1Y', 365],
  ['All', 100000],
] as const

/** Trailing 7-day average for each entry, which smooths out daily water swings. */
export function movingAverage(entries: WeightEntry[]): { date: string; kg: number }[] {
  return entries.map((e) => {
    const from = addDays(e.date, -6)
    const window = entries.filter((x) => x.date >= from && x.date <= e.date)
    return { date: e.date, kg: window.reduce((s, x) => s + x.kg, 0) / window.length }
  })
}

export function WeightSheet({ open, onClose, entry }: { open: boolean; onClose: () => void; entry?: WeightEntry | null }) {
  const settings = useSettings()
  const u = settings.units
  const [date, setDate] = useState(entry?.date ?? dateKey())
  const [weight, setWeight] = useState<number | null>(entry ? kgToDisplay(entry.kg, u) : null)
  const [bf, setBf] = useState<number | null>(entry?.bodyFatPct ?? null)
  const [waist, setWaist] = useState<number | null>(entry?.waistCm != null ? cmToDisplay(entry.waistCm, u) : null)
  const latest = useLiveQuery(() => db.weights.orderBy('date').last(), [])
  const placeholder = latest ? fmt(kgToDisplay(latest.kg, u)) : ''

  const save = async () => {
    if (weight == null) return
    const existing = entry?.id ? entry : await db.weights.where('date').equals(date).first()
    await db.weights.put({
      id: existing?.id,
      date,
      kg: displayToKg(weight, u),
      bodyFatPct: bf,
      waistCm: waist != null ? displayToCm(waist, u) : null,
      createdAt: existing?.createdAt ?? Date.now(),
    })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={entry ? 'Edit entry' : 'Log weight'}>
      <div className="stack">
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} max={dateKey()} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Weight</span>
          <div className="input-unit">
            <NumInput autoFocus value={weight} placeholder={placeholder} onChange={setWeight} />
            <span className="unit">{weightUnit(u)}</span>
          </div>
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Body fat (optional)</span>
            <div className="input-unit">
              <NumInput value={bf} onChange={setBf} />
              <span className="unit">%</span>
            </div>
          </label>
          <label className="field">
            <span>Waist (optional)</span>
            <div className="input-unit">
              <NumInput value={waist} onChange={setWaist} />
              <span className="unit">{lengthUnit(u)}</span>
            </div>
          </label>
        </div>
        <div className="grid-2">
          {entry?.id ? (
            <button
              className="btn danger"
              onClick={() => {
                if (!confirmAction('Delete this entry?')) return
                void db.weights.delete(entry.id!)
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
          <button className="btn primary" disabled={weight == null} onClick={() => void save()}>
            Save
          </button>
        </div>
      </div>
    </Sheet>
  )
}

export default function Body() {
  const settings = useSettings()
  const u = settings.units
  const all = useLiveQuery(() => db.weights.orderBy('date').toArray(), []) ?? []
  const [range, setRange] = useState<number>(91)
  const [sheet, setSheet] = useState<{ entry?: WeightEntry | null } | null>(null)
  const cutoff = addDays(dateKey(), -range)
  const shown = all.filter((e) => e.date >= cutoff)
  const avg = movingAverage(all).filter((a) => a.date >= cutoff)
  const latest = all.at(-1)
  const weekAgo = [...all].reverse().find((e) => e.date <= addDays(dateKey(), -7))
  const monthAgo = [...all].reverse().find((e) => e.date <= addDays(dateKey(), -30))
  const bmi = latest && settings.heightCm ? latest.kg / (settings.heightCm / 100) ** 2 : null
  const delta = (from?: WeightEntry) => (latest && from ? kgToDisplay(latest.kg - from.kg, u) : null)
  const signed = (v: number | null) => (v == null ? '–' : `${v > 0 ? '+' : ''}${fmt(v)} ${weightUnit(u)}`)
  const ts = (d: string) => parseDateKey(d).getTime()

  return (
    <div className="page">
      <div className="page-header">
        <Decor name="pink_lamp" className="decor-header" />
        <h1>Body</h1>
        <button className="btn primary sm" onClick={() => setSheet({})}>
          <Icon name="plus" size={16} /> Log weight
        </button>
      </div>

      <div className="grid-2">
        <div className="card tight stat">
          <div className="label">Current</div>
          <div className="value">
            {latest ? fmt(kgToDisplay(latest.kg, u)) : '–'}
            <small>{weightUnit(u)}</small>
          </div>
          <div className="delta">{latest ? formatDayLabel(latest.date) : 'No entries yet'}</div>
        </div>
        <div className="card tight stat">
          <div className="label">Goal</div>
          <div className="value">
            {settings.goalWeightKg ? fmt(kgToDisplay(settings.goalWeightKg, u)) : '–'}
            <small>{weightUnit(u)}</small>
          </div>
          <div className="delta">{latest && settings.goalWeightKg ? `${fmt(Math.abs(kgToDisplay(latest.kg - settings.goalWeightKg, u)))} ${weightUnit(u)} to go` : 'Set it in Settings'}</div>
        </div>
        <div className="card tight stat">
          <div className="label">7-day change</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>
            {signed(delta(weekAgo))}
          </div>
        </div>
        <div className="card tight stat">
          <div className="label">30-day change</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>
            {signed(delta(monthAgo))}
          </div>
        </div>
      </div>

      <div className="card stack-sm">
        <div className="row-between">
          <h3>Weight trend</h3>
          <div className="segmented" style={{ padding: 2 }}>
            {RANGES.map(([label, days]) => (
              <button key={label} className={range === days ? 'active' : ''} style={{ minHeight: 30, padding: '0 8px', fontSize: '0.8rem' }} onClick={() => setRange(days)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {shown.length ? (
          <LineChart
            series={[
              { id: 'avg', label: '7-day average', color: 'var(--series-1)', points: avg.map((a) => ({ x: ts(a.date), y: kgToDisplay(a.kg, u) })) },
              { id: 'raw', label: 'Daily weigh-in', color: 'var(--series-1)', kind: 'dots', points: shown.map((e) => ({ x: ts(e.date), y: kgToDisplay(e.kg, u) })) },
            ]}
            formatY={(y) => fmt(y)}
            formatX={(x) => formatShortDate(dateKey(x))}
            reference={settings.goalWeightKg ? { y: kgToDisplay(settings.goalWeightKg, u), label: 'Goal' } : undefined}
          />
        ) : (
          <div className="empty small">Log your weight to see your trend. Weighing in each morning gives the clearest picture.</div>
        )}
      </div>

      {bmi && (
        <div className="card tight row-between">
          <span className="small text-2">BMI</span>
          <span className="small">
            <strong>{fmt(bmi)}</strong> <span className="muted">(a rough guide; muscular builds often read high)</span>
          </span>
        </div>
      )}

      <div className="section-title">
        <h2>Entries</h2>
      </div>
      <div className="card flush list">
        {[...all]
          .reverse()
          .slice(0, 60)
          .map((e) => (
            <button key={e.id} className="list-item" onClick={() => setSheet({ entry: e })}>
              <div className="grow">
                <div className="title">{formatDayLabel(e.date)}</div>
                <div className="meta">
                  {[e.bodyFatPct != null && `${fmt(e.bodyFatPct)}% body fat`, e.waistCm != null && `waist ${fmt(cmToDisplay(e.waistCm, u))} ${lengthUnit(u)}`].filter(Boolean).join(' · ')}
                </div>
              </div>
              <span className="num">
                {fmt(kgToDisplay(e.kg, u))} {weightUnit(u)}
              </span>
            </button>
          ))}
        {!all.length && <div className="empty small">No entries yet.</div>}
      </div>

      {sheet && <WeightSheet open onClose={() => setSheet(null)} entry={sheet.entry} />}
    </div>
  )
}
