import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { NumInput } from '../../components/NumInput'
import { Sheet } from '../../components/Sheet'
import { STAPLE_BY_ID } from '../../data/aldi'
import { db } from '../../db/db'
import { useSettings } from '../../db/settings'
import { dayActivity, fuelPlan, TERRAIN, walkBurn, type Terrain } from '../../lib/fuel'
import { displayToKg, fmt, formatWeight, KG_PER_LB, mlToDisplay, volumeUnit } from '../../lib/units'

/** Trail snacks from the Aldi staples, with their carbs per serving. */
const SNACKS: [string, number][] = [
  ['bananas', 1],
  ['pretzels', 1],
  ['raisins', 1],
  ['almonds', 1],
  ['peanut-butter', 1],
  ['tortilla-flour', 1],
]

function useWeightKg(date: string): number | null {
  const w = useLiveQuery(() => db.weights.where('date').belowOrEqual(date).last(), [date])
  return w?.kg ?? null
}

/** Estimated burn from what you logged on the day, with a door into the long-day fuel planner. */
export function FuelCard({ date }: { date: string }) {
  const settings = useSettings()
  const weightKg = useWeightKg(date)
  const logs = useLiveQuery(() => db.programLogs.where('date').equals(date).toArray(), [date]) ?? []
  const workouts = useLiveQuery(() => db.workouts.where('date').equals(date).toArray(), [date]) ?? []
  const [open, setOpen] = useState(false)
  const lines = weightKg ? dayActivity(date, weightKg, logs, workouts) : []
  const net = lines.reduce((n, l) => n + l.net, 0)
  const minutes = lines.reduce((n, l) => n + l.minutes, 0)
  const losing = (settings.yellowstone?.weight?.focus ?? 'balanced') !== 'not-now'
  const plan = fuelPlan(minutes / 60, net, false, losing)

  return (
    <div className="card stack-sm tint-mint" aria-label="Activity and fuel">
      <div className="row-between">
        <div className="card-title" style={{ margin: 0 }}>
          <Icon name="flame" size={18} /> Activity and fuel
        </div>
        {lines.length > 0 && <span className="num small">~{Math.round(net)} kcal</span>}
      </div>
      {!weightKg ? (
        <p className="small muted">
          <Link to="/body">Log your weight</Link> to estimate what walks and workouts burn.
        </p>
      ) : lines.length ? (
        <>
          {lines.map((l, i) => (
            <div key={i} className="row-between small">
              <span>
                {l.label} · {Math.round(l.minutes)} min
              </span>
              <span className="num muted">~{Math.round(l.net)} kcal</span>
            </div>
          ))}
          <p className="small text-2" style={{ margin: 0 }}>
            {minutes < 60
              ? 'A normal day: your calorie goal already covers it, so no extra food needed.'
              : `A bigger day than usual. Adding about ${plan.eatBack[0]}–${plan.eatBack[1]} kcal (carbs plus some protein) keeps you fueled for tomorrow${losing ? ' while still losing' : ''}.`}
          </p>
        </>
      ) : (
        <p className="small muted">No walks or workouts logged this day. Estimates appear here when you log them.</p>
      )}
      <button className="btn sm" onClick={() => setOpen(true)}>
        <Icon name="target" size={16} /> Plan fuel for a long walk or hike
      </button>
      <FuelSheet open={open} onClose={() => setOpen(false)} weightKg={weightKg} losing={losing} />
    </div>
  )
}

export function FuelSheet({ open, onClose, weightKg, losing }: { open: boolean; onClose: () => void; weightKg: number | null; losing: boolean }) {
  const settings = useSettings()
  const u = settings.units
  const ys = settings.yellowstone
  const [hours, setHours] = useState<number | null>(4)
  const [mph, setMph] = useState(2)
  const [terrain, setTerrain] = useState<Terrain>('trail')
  const [gainFt, setGainFt] = useState<number | null>(ys?.elevationGainFt.value ?? 800)
  const [packLb, setPackLb] = useState<number | null>(10)
  const [hot, setHot] = useState(false)
  const [manualWeight, setManualWeight] = useState<number | null>(null)
  const kg = manualWeight != null ? displayToKg(manualWeight, u) : weightKg

  const h = hours ?? 0
  const minutes = h * 60
  const miles = h * mph
  // Half the distance climbs the gain; downhill is counted as flat.
  const gradePct = miles > 0 && gainFt ? Math.min(25, ((gainFt * 0.3048) / ((miles * 1609.344) / 2)) * 100) : 0
  const est = kg
    ? walkBurn({ weightKg: kg, minutes: minutes / 2, mph, gradePct, packKg: (packLb ?? 0) * KG_PER_LB, terrain }).net +
      walkBurn({ weightKg: kg, minutes: minutes / 2, mph, gradePct: 0, packKg: (packLb ?? 0) * KG_PER_LB, terrain }).net
    : 0
  const plan = fuelPlan(h, est, hot, losing)
  const movingHours = Math.max(0, h - 1)
  const carbs = [Math.round(plan.carbsPerHour[0] * movingHours), Math.round(plan.carbsPerHour[1] * movingHours)]
  const water = [plan.waterPerHour[0] * h, plan.waterPerHour[1] * h]

  return (
    <Sheet open={open} onClose={onClose} title="Fuel for a long walk or hike">
      <div className="stack">
        <div className="grid-2">
          <label className="field">
            <span>Hours on your feet</span>
            <NumInput value={hours} onChange={setHours} digits={1} />
          </label>
          <label className="field">
            <span>Pace</span>
            <select value={mph} onChange={(e) => setMph(Number(e.target.value))}>
              {[1.5, 2, 2.5, 3, 3.5].map((v) => (
                <option key={v} value={v}>
                  {v} mph{v === 2 ? ' · trail' : v === 3 ? ' · brisk' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Elevation gain (ft)</span>
            <NumInput value={gainFt} onChange={setGainFt} digits={0} />
          </label>
          <label className="field">
            <span>Pack (lb)</span>
            <NumInput value={packLb} onChange={setPackLb} digits={0} />
          </label>
          <label className="field">
            <span>Terrain</span>
            <select value={terrain} onChange={(e) => setTerrain(e.target.value as Terrain)}>
              {(Object.keys(TERRAIN) as Terrain[]).map((t) => (
                <option key={t} value={t}>
                  {TERRAIN[t].label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Your weight ({u === 'imperial' ? 'lb' : 'kg'})</span>
            <NumInput value={manualWeight ?? (weightKg ? (u === 'imperial' ? weightKg / KG_PER_LB : weightKg) : null)} onChange={setManualWeight} digits={0} />
          </label>
        </div>
        <label className="toggle">
          <span>Hot or very sunny day</span>
          <input type="checkbox" checked={hot} onChange={(e) => setHot(e.target.checked)} />
        </label>
        {ys?.elevationGainFt.value != null && <p className="tiny muted">Elevation starts from your Yellowstone hike details{ys.elevationGainFt.confirmed ? '' : ' (still an assumption)'}.</p>}

        {!kg ? (
          <p className="small status warning">Enter your weight to estimate the burn.</p>
        ) : (
          <>
            <div className="grid-2">
              <div className="card tight stat">
                <div className="label">Extra burn</div>
                <div className="value">~{Math.round(est / 10) * 10}</div>
                <div className="tiny muted">
                  kcal above resting · about {fmt(miles, 1)} mi{gradePct > 0 ? `, ${fmt(gradePct, 0)}% avg climb` : ''}
                </div>
              </div>
              <div className="card tight stat">
                <div className="label">Eat back</div>
                <div className="value" style={{ fontSize: '1.3rem' }}>
                  {plan.eatBack[1] ? `${plan.eatBack[0]}–${plan.eatBack[1]}` : '0'}
                </div>
                <div className="tiny muted">extra kcal across the day</div>
              </div>
              <div className="card tight stat">
                <div className="label">Carbs on the trail</div>
                <div className="value" style={{ fontSize: '1.3rem' }}>{carbs[1] ? `${carbs[0]}–${carbs[1]} g` : 'None needed'}</div>
                <div className="tiny muted">{plan.carbsPerHour[1] ? `${plan.carbsPerHour[0]}–${plan.carbsPerHour[1]} g an hour after the first hour` : 'under an hour'}</div>
              </div>
              <div className="card tight stat">
                <div className="label">Water</div>
                <div className="value" style={{ fontSize: '1.3rem' }}>
                  {fmt(mlToDisplay(water[0], u), 0)}–{fmt(mlToDisplay(water[1], u), 0)}
                </div>
                <div className="tiny muted">{volumeUnit(u)} total, sipped through the day</div>
              </div>
            </div>
            {plan.carbsPerHour[1] > 0 && (
              <div>
                <h3 className="small muted">Easy trail snacks (Aldi)</h3>
                <div className="card flush list">
                  {SNACKS.map(([id, n]) => {
                    const s = STAPLE_BY_ID[id]
                    return (
                      <div key={id} className="list-item">
                        <div className="grow">
                          <div className="title">{s.name}</div>
                          <div className="meta">{s.servingLabel}</div>
                        </div>
                        <span className="num small">
                          {fmt(s.facts.carbs * n, 0)} g carbs · {Math.round(s.facts.kcal * n)} kcal
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="tiny muted">
                  The Recipes tab has a peanut butter banana wrap and a salty-sweet trail mix with costs per serving.
                </p>
              </div>
            )}
            <ul className="small text-2" style={{ paddingLeft: 18, margin: 0 }}>
              {plan.notes.map((n) => (
                <li key={n} style={{ marginBottom: 6 }}>
                  {n}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="tiny muted">
          Burn uses the ACSM walking equation with your pack and terrain{kg ? ` for ${formatWeight(kg, u, 0)}` : ''}; real burn varies by 20% or more. Fueling follows the ACSM, Academy of Nutrition and Dietetics and Dietitians of Canada sports nutrition
          position (2016). Talk to your doctor about fluids if you have heart or kidney conditions.
        </p>
      </div>
    </Sheet>
  )
}
