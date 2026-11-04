import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Decor } from '../components/Decor'
import { NumInput } from '../components/NumInput'
import { Sheet } from '../components/Sheet'
import { db } from '../db/db'
import { updateSettings, useSettings } from '../db/settings'
import type { WeightGoals, YellowstoneSettings } from '../db/types'
import { displayToKg, fmt, KG_PER_LB, kgToDisplay, weightUnit } from '../lib/units'

/**
 * A few friendly questions about weight goals, one per screen. Nothing
 * about weight is assumed until you answer; you can skip or change it any time.
 */

type Food = YellowstoneSettings['food']
type Riding = YellowstoneSettings['riding']
type Step = 'focus' | 'riding' | 'aim' | 'target' | 'pace' | 'food' | 'weighins' | 'milestones' | 'why' | 'summary'

const PACE_DEFICIT: Record<WeightGoals['pace'], number> = { gentle: 250, steady: 500, none: 0 }

interface Draft {
  weight: WeightGoals
  riding: Riding
  foodMode: Food['mode']
}

const ALL_STEPS: Step[] = ['focus', 'riding', 'aim', 'target', 'pace', 'food', 'weighins', 'milestones', 'why', 'summary']

function steps(d: Draft): Step[] {
  const losing = d.weight.focus !== 'not-now'
  return [
    'focus',
    'riding',
    ...(losing ? (['aim'] as Step[]) : []),
    ...(losing && d.weight.aim === 'number' ? (['target'] as Step[]) : []),
    ...(losing ? (['pace'] as Step[]) : []),
    'food',
    'weighins',
    ...(losing ? (['milestones'] as Step[]) : []),
    'why',
    'summary',
  ]
}

function Choice<T extends string | number>({ value, current, onPick, title, text }: { value: T; current: T | null; onPick: (v: T) => void; title: string; text?: string }) {
  return (
    <button className={`choice ${current === value ? 'on' : ''}`} onClick={() => onPick(value)} aria-pressed={current === value}>
      <strong>{title}</strong>
      {text && <span className="small text-2">{text}</span>}
    </button>
  )
}

export function WeightGoalsQuiz({ open, onClose, p }: { open: boolean; onClose: () => void; p: YellowstoneSettings }) {
  return (
    <Sheet open={open} onClose={onClose} title="Your weight goals">
      {open && <Quiz p={p} onClose={onClose} />}
    </Sheet>
  )
}

function Quiz({ p, onClose }: { p: YellowstoneSettings; onClose: () => void }) {
  const settings = useSettings()
  const latest = useLiveQuery(() => db.weights.orderBy('date').last(), [])
  const u = settings.units
  const wu = weightUnit(u)
  const [d, setD] = useState<Draft>({
    weight: p.weight ?? { focus: 'balanced', aim: 'trend', targetKg: null, pace: 'gentle', weighIns: 'weekly', milestoneLb: 5, why: '', answeredAt: 0 },
    riding: p.weight ? p.riding : { ...p.riding, wanted: false },
    foodMode: p.food.mode,
  })
  const [i, setI] = useState(0)
  const list = steps(d)
  const step = list[Math.min(i, list.length - 1)]
  // The first time through nothing is pre-selected: each question waits for your answer.
  const [answered, setAnswered] = useState<Set<Step>>(() => new Set(p.weight ? ALL_STEPS : []))
  const mark = () => setAnswered(new Set(answered).add(step))
  const w = d.weight
  const setW = (patch: Partial<WeightGoals>) => {
    mark()
    setD({ ...d, weight: { ...w, ...patch } })
  }
  const setDraft = (next: Draft) => {
    mark()
    setD(next)
  }
  const shown = <T,>(v: T): T | null => (answered.has(step) ? v : null)
  const ridingTargetLb = d.riding.limitLb.value - d.riding.marginLb
  const currentLb = latest ? latest.kg / KG_PER_LB : null
  const targetTooHigh = w.aim === 'number' && w.targetKg != null && latest != null && w.targetKg >= latest.kg

  const save = async () => {
    const weight: WeightGoals = { ...w, aim: w.aim === 'riding' && !d.riding.wanted ? 'trend' : w.aim, answeredAt: Date.now() }
    const losing = weight.focus !== 'not-now'
    await updateSettings({
      yellowstone: { ...p, weight, riding: d.riding, food: { ...p.food, mode: d.foodMode, deficit: losing ? PACE_DEFICIT[weight.pace] : 0 } },
      ...(losing && weight.aim === 'number' && weight.targetKg != null ? { goalWeightKg: weight.targetKg } : {}),
    })
    onClose()
  }

  const needsPick = ['focus', 'riding', 'aim', 'pace', 'food', 'weighins', 'milestones'].includes(step)
  const canNext = step === 'target' ? w.targetKg != null && !targetTooHigh : !needsPick || answered.has(step)
  const next = () => setI(Math.min(i + 1, list.length - 1))

  return (
    <div className="stack quiz">
      <div className="quiz-dots" aria-label={`Question ${i + 1} of ${list.length}`}>
        {list.map((s, k) => (
          <span key={s} className={k < i ? 'done' : k === i ? 'on' : ''} />
        ))}
      </div>

      {step === 'focus' && (
        <>
          <h3>Is losing weight part of your Yellowstone goals?</h3>
          <p className="small text-2">There’s no wrong answer. Your training plan is the same either way.</p>
          <Choice value="priority" current={shown(w.focus)} onPick={(v) => setW({ focus: v })} title="Yes, it’s a big priority" />
          <Choice value="balanced" current={shown(w.focus)} onPick={(v) => setW({ focus: v })} title="Yes, alongside getting fitter" text="Fitness first, weight loss as a bonus." />
          <Choice value="not-now" current={shown(w.focus)} onPick={(v) => setW({ focus: v })} title="Not right now" text="Focus on walking, strength and balance only." />
        </>
      )}

      {step === 'riding' && (
        <>
          <h3>Do you want the horseback ride’s weight limit as a goal?</h3>
          <p className="small text-2">
            One possible operator lists <strong>under 240 lb</strong>. That’s unconfirmed: your operator’s rule may differ.
          </p>
          <Choice value={1} current={shown(d.riding.wanted ? 1 : 0)} onPick={() => setDraft({ ...d, riding: { ...d.riding, wanted: true } })} title="Yes, include it" />
          <Choice value={0} current={shown(d.riding.wanted ? 1 : 0)} onPick={() => setDraft({ ...d, riding: { ...d.riding, wanted: false } })} title="No, or not sure yet" text="You can add it later." />
          {d.riding.wanted && answered.has('riding') && (
            <div className="stack-sm">
              <div className="grid-2">
                <label className="field">
                  <span>Weight limit (lb)</span>
                  <NumInput value={d.riding.limitLb.value} digits={0} onChange={(v) => v && setD({ ...d, riding: { ...d.riding, limitLb: { ...d.riding.limitLb, value: v } } })} />
                </label>
                <label className="field">
                  <span>Comfortable margin</span>
                  <select value={d.riding.marginLb} onChange={(e) => setD({ ...d, riding: { ...d.riding, marginLb: Number(e.target.value) } })}>
                    {[5, 10, 15, 20].map((m) => (
                      <option key={m} value={m}>
                        {m} lb under
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="toggle">
                <span>I’ve confirmed this limit with my operator</span>
                <input type="checkbox" checked={d.riding.limitLb.confirmed} onChange={(e) => setD({ ...d, riding: { ...d.riding, limitLb: { ...d.riding.limitLb, confirmed: e.target.checked } } })} />
              </label>
              <p className="small">
                Your riding target: <strong>under {ridingTargetLb} lb</strong>
              </p>
            </div>
          )}
        </>
      )}

      {step === 'aim' && (
        <>
          <h3>What would you like to aim for?</h3>
          <Choice value="number" current={shown(w.aim)} onPick={(v) => setW({ aim: v })} title="A goal weight" text="You pick the number." />
          {d.riding.wanted && <Choice value="riding" current={shown(w.aim)} onPick={(v) => setW({ aim: v })} title={`Get under my riding target (${ridingTargetLb} lb)`} />}
          <Choice value="trend" current={shown(w.aim)} onPick={(v) => setW({ aim: v })} title="Just a steady trend down" text="No number. Watch the 7-day average slowly fall." />
        </>
      )}

      {step === 'target' && (
        <>
          <h3>What goal weight feels right?</h3>
          <p className="small text-2">Pick something that feels realistic. You can change it any time, and there’s no deadline.</p>
          <label className="field">
            <span>Goal weight ({wu})</span>
            <NumInput value={w.targetKg != null ? Math.round(kgToDisplay(w.targetKg, u)) : null} digits={0} onChange={(v) => setW({ targetKg: v ? displayToKg(v, u) : null })} />
          </label>
          {currentLb != null && <p className="tiny muted">Your latest weigh-in: {fmt(kgToDisplay(latest!.kg, u), 0)} {wu}</p>}
          {targetTooHigh && <p className="small" style={{ color: 'var(--critical-text)' }}>That’s at or above your current weight. Try a lower number, or choose “steady trend” instead.</p>}
        </>
      )}

      {step === 'pace' && (
        <>
          <h3>What pace feels manageable?</h3>
          <p className="small text-2">These are long-run averages. Real weeks go up and down, and that’s normal.</p>
          <Choice value="gentle" current={shown(w.pace)} onPick={(v) => setW({ pace: v })} title="Gentle: about ½ lb a week" text="Small changes, easy to keep up. About 250 fewer calories a day." />
          <Choice value="steady" current={shown(w.pace)} onPick={(v) => setW({ pace: v })} title="Steady: about 1 lb a week" text="About 500 fewer calories a day." />
          <Choice value="none" current={shown(w.pace)} onPick={(v) => setW({ pace: v })} title="No set pace" text="Build healthy habits and see what happens." />
        </>
      )}

      {step === 'food' && (
        <>
          <h3>How would you like to handle food?</h3>
          <Choice value="calories" current={shown(d.foodMode)} onPick={(v) => setDraft({ ...d, foodMode: v })} title="Calories and protein" text="A daily target, with the math shown and adjustable." />
          <Choice value="protein" current={shown(d.foodMode)} onPick={(v) => setDraft({ ...d, foodMode: v })} title="Protein only" text="Hit a protein goal, keep the rest relaxed." />
          <Choice value="habits" current={shown(d.foodMode)} onPick={(v) => setDraft({ ...d, foodMode: v })} title="Simple habits, no numbers" text="Protein at meals, veggies, water." />
          <Choice value="none" current={shown(d.foodMode)} onPick={(v) => setDraft({ ...d, foodMode: v })} title="Leave food out" />
        </>
      )}

      {step === 'weighins' && (
        <>
          <h3>How often do you want to weigh in?</h3>
          <Choice value="daily" current={shown(w.weighIns)} onPick={(v) => setW({ weighIns: v })} title="Most days" text="The app shows a 7-day average, so daily ups and downs don’t matter." />
          <Choice value="weekly" current={shown(w.weighIns)} onPick={(v) => setW({ weighIns: v })} title="Once a week" text="Same day and time each week." />
          <Choice value="rarely" current={shown(w.weighIns)} onPick={(v) => setW({ weighIns: v })} title="Rarely" text="Focus on other wins. The scale stays out of your check-ins." />
        </>
      )}

      {step === 'milestones' && (
        <>
          <h3>Would you like weight stepping stones?</h3>
          <Choice value={5} current={shown(w.milestoneLb)} onPick={(v) => setW({ milestoneLb: v })} title="Every 5 lb" text="Frequent little wins." />
          <Choice value={10} current={shown(w.milestoneLb)} onPick={(v) => setW({ milestoneLb: v })} title="Every 10 lb" />
          <Choice value={0} current={shown(w.milestoneLb)} onPick={(v) => setW({ milestoneLb: v })} title="Just the main goal" />
        </>
      )}

      {step === 'why' && (
        <>
          <h3>Why does this matter to you? (optional)</h3>
          <p className="small text-2">A sentence to see on tough days. Skip it if you like.</p>
          <label className="field">
            <span>My why</span>
            <textarea value={w.why} onChange={(e) => setW({ why: e.target.value })} placeholder="e.g. Hike to the falls and ride through the valley feeling strong" />
          </label>
        </>
      )}

      {step === 'summary' && (
        <>
          <div className="center">
            <Decor name="potion_trio" className="decor-empty" />
          </div>
          <h3>Here’s your weight plan</h3>
          <ul className="plain-list small">
            <li>{w.focus === 'not-now' ? 'Weight isn’t a focus right now: fitness first.' : w.focus === 'priority' ? 'Weight loss is a big priority.' : 'Weight loss alongside getting fitter.'}</li>
            {w.focus !== 'not-now' && (
              <li>
                Aim:{' '}
                {w.aim === 'number' && w.targetKg != null
                  ? `${fmt(kgToDisplay(w.targetKg, u), 0)} ${wu}`
                  : w.aim === 'riding' && d.riding.wanted
                    ? `under ${ridingTargetLb} lb (riding target)`
                    : 'a steady trend down, no number'}
                , no deadline.
              </li>
            )}
            <li>{d.riding.wanted ? `Riding goal: under ${ridingTargetLb} lb (limit ${d.riding.limitLb.value} lb, ${d.riding.limitLb.confirmed ? 'confirmed' : 'unconfirmed'}).` : 'No riding weight goal for now.'}</li>
            {w.focus !== 'not-now' && <li>Pace: {w.pace === 'gentle' ? 'gentle, about ½ lb a week on average' : w.pace === 'steady' ? 'steady, about 1 lb a week on average' : 'no set pace, habits first'}.</li>}
            <li>Food: {d.foodMode === 'calories' ? 'calories and protein' : d.foodMode === 'protein' ? 'protein only' : d.foodMode === 'habits' ? 'simple habits' : 'left out'}.</li>
            <li>Weigh-ins: {w.weighIns === 'daily' ? 'most days (7-day average)' : w.weighIns === 'weekly' ? 'once a week' : 'rarely'}.</li>
            {w.focus !== 'not-now' && <li>Stepping stones: {w.milestoneLb ? `every ${w.milestoneLb} lb` : 'just the main goal'}.</li>}
            {w.why && <li>Your why: “{w.why}”</li>}
          </ul>
          <p className="tiny muted">Change any of this from the weight card at any time.</p>
          <button className="btn primary block lg" onClick={() => void save()}>
            Save my weight goals ✦
          </button>
        </>
      )}

      {step !== 'summary' && (
        <div className="row">
          {i > 0 && (
            <button className="btn" onClick={() => setI(i - 1)}>
              Back
            </button>
          )}
          <button className="btn primary grow" disabled={!canNext} onClick={next}>
            Next
          </button>
        </div>
      )}
      {step === 'summary' && (
        <button className="btn ghost block" onClick={() => setI(Math.max(0, i - 1))}>
          Back
        </button>
      )}
    </div>
  )
}

/** Shown until you've answered, so nothing about weight is assumed. */
export function WeightGoalsPrompt({ onAnswer }: { onAnswer: () => void }) {
  return (
    <div className="card stack-sm tint-butter">
      <div className="row">
        <Decor name="potion_trio" className="decor-inline" />
        <div className="grow">
          <div style={{ fontWeight: 700 }}>What are your weight goals?</div>
          <div className="small text-2">A few quick questions so your plan fits what you want. About 1 minute.</div>
        </div>
      </div>
      <button className="btn primary block" onClick={onAnswer}>
        Answer now
      </button>
    </div>
  )
}

/** Plain-language summary of your answers, for the goal card. */
export function weightGoalLabel(w: WeightGoals, ridingTargetLb: number | null, units: 'metric' | 'imperial'): string {
  if (w.focus === 'not-now') return 'Fitness first: weight isn’t a focus right now'
  if (w.aim === 'number' && w.targetKg != null) return `Goal weight: ${fmt(kgToDisplay(w.targetKg, units), 0)} ${weightUnit(units)}`
  if (w.aim === 'riding' && ridingTargetLb != null) return `Under ${ridingTargetLb} lb for the ride`
  return 'A steady trend down'
}
