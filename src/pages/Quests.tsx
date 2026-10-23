import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Decor } from '../components/Decor'
import { Icon, type IconName } from '../components/Icon'
import { useJourney, useTryNow, XpStrip } from '../components/Journey'
import { Meter } from '../components/Ring'
import { confirmAction, Sheet } from '../components/Sheet'
import { CHALLENGES, type ChallengeDef } from '../data/challenges'
import { STARTER_ROUTINES } from '../data/starterRoutines'
import { db } from '../db/db'
import { useSettings } from '../db/settings'
import type { RoutineEntry, Units } from '../db/types'
import { addDays, formatSeconds, parseDateKey } from '../lib/dates'
import { badges, challengeStatus, dailyQuests, dayTarget, weeklyQuests, type Badge, type ChallengeStatus, type Quest } from '../lib/gamify'
import { fmt, mlToDisplay, volumeUnit } from '../lib/units'
import { mondayOf } from './train/Train'

type Journey = ReturnType<typeof useJourney>

function questAmount(q: Quest, v: number, units: Units): string {
  if (q.unit === 's') return formatSeconds(v)
  if (q.unit === 'ml') return `${fmt(mlToDisplay(v, units), 0)}`
  return `${v}`
}

export default function Quests() {
  const journey = useJourney()
  const settings = useSettings()
  const meals = useLiveQuery(() => db.meals.where('date').aboveOrEqual(addDays(journey.today, -7)).toArray(), [journey.today]) ?? []
  const water = useLiveQuery(() => db.water.where('date').aboveOrEqual(addDays(journey.today, -7)).toArray(), [journey.today]) ?? []
  const weights = useLiveQuery(() => db.weights.toArray(), []) ?? []
  const ctx = { workouts: journey.workouts, meals, water, fasts: journey.fasts, weights, marks: journey.marks, settings, get: journey.get }
  const daily = dailyQuests(ctx, journey.today)
  const weekly = weeklyQuests(ctx, mondayOf(journey.today))
  const earned = badges({ ...ctx, joins: journey.joins }, journey.today)
  const [badge, setBadge] = useState<Badge | null>(null)
  const joinedIds = new Set(journey.joins.map((j) => j.id))

  return (
    <div className="page">
      <div className="page-header">
        <div className="grow">
          <h1>Quests</h1>
          <div className="subtitle">Little adventures, every day ✦</div>
        </div>
        <Decor name="potion_trio" className="decor-header" />
      </div>

      <StreakCard journey={journey} />

      <div className="section-title">
        <h2>Today’s quests</h2>
        <span className="small muted">
          {daily.filter((q) => q.value >= q.target).length} of {daily.length}
        </span>
      </div>
      <QuestList quests={daily} units={settings.units} />

      <div className="section-title">
        <h2>This week</h2>
        <span className="small muted">Resets Monday</span>
      </div>
      <QuestList quests={weekly} units={settings.units} />

      <div className="section-title">
        <h2>Challenges</h2>
      </div>
      {journey.joins.map((j) => {
        const def = CHALLENGES.find((c) => c.id === j.id)
        return def ? <ChallengeCard key={j.id} status={challengeStatus(def, j, journey.workouts, journey.get, journey.today)} journey={journey} /> : null
      })}
      {CHALLENGES.filter((c) => !joinedIds.has(c.id)).map((c) => (
        <ChallengeInvite key={c.id} def={c} today={journey.today} />
      ))}

      <div className="section-title">
        <h2>Badges</h2>
        <span className="small muted">
          {earned.filter((b) => b.earned).length} of {earned.length}
        </span>
      </div>
      <div className="badge-grid">
        {earned.map((b) => (
          <button key={b.id} className={`medal ${b.earned ? 'earned' : ''}`} onClick={() => setBadge(b)}>
            <span className="medal-face" aria-hidden="true">
              {b.earned ? b.emoji : '?'}
            </span>
            <span className="medal-name">{b.name}</span>
          </button>
        ))}
      </div>
      <Sheet open={!!badge} onClose={() => setBadge(null)} title={badge?.name}>
        {badge && (
          <div className="stack center">
            <span className={`medal-face big ${badge.earned ? 'earned' : ''}`} aria-hidden="true">
              {badge.earned ? badge.emoji : '?'}
            </span>
            <p>{badge.text}</p>
            <p className="handwritten" style={{ color: 'var(--berry)' }}>
              {badge.earned ? 'Earned! ✦' : 'Not yet, but you’re on your way.'}
            </p>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function StreakCard({ journey }: { journey: Journey }) {
  const week = Array.from({ length: 7 }, (_, i) => addDays(journey.today, i - 6))
  return (
    <div className="card stack">
      <XpStrip journey={journey} />
      <div className="streak-week">
        {week.map((d) => (
          <div key={d} className={`streak-day ${journey.days.has(d) ? 'on' : ''} ${d === journey.today ? 'today' : ''}`}>
            <span className="tiny">{parseDateKey(d).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
            <span className="streak-dot">{journey.days.has(d) ? '🔥' : ''}</span>
          </div>
        ))}
      </div>
      <p className="small text-2 center">
        {journey.streak
          ? `${journey.streak}-day streak. Best ever: ${journey.best} days.`
          : journey.best
            ? `Finish a workout today to light a new streak. Your best is ${journey.best} days.`
            : 'Finish a workout to light your first streak.'}
      </p>
    </div>
  )
}

function QuestList({ quests, units }: { quests: Quest[]; units: Units }) {
  return (
    <div className="card flush list">
      {quests.map((q) => {
        const done = q.value >= q.target
        return (
          <div key={q.id} className={`list-item quest ${done ? 'done' : ''}`}>
            <span className="quest-icon">
              <Icon name={(done ? 'check' : q.icon) as IconName} size={20} />
            </span>
            <div className="grow stack-sm" style={{ gap: 4 }}>
              <div className="row-between">
                <span className="title">{q.title}</span>
                <span className="xp-tag">+{q.xp} XP</span>
              </div>
              <Meter value={q.value} max={q.target} tone={done ? 'good' : undefined} />
              <span className="tiny muted num">
                {questAmount(q, Math.min(q.value, q.target), units)} / {questAmount(q, q.target, units)}
                {q.unit === 'ml' ? ` ${volumeUnit(units)}` : q.unit === 'g' ? ' g' : ''}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** What "Do today's" adds to your workout for a challenge day. */
function challengeEntries(def: ChallengeDef, target: number): RoutineEntry[] {
  if (def.kind === 'mobility') {
    const [joint, flex] = STARTER_ROUTINES
    const entries = [...joint.entries]
    if (target > 5.5) entries.push(...flex.entries.map((e) => ({ ...e, sets: target > 11 ? 2 : 1 })))
    return entries
  }
  if (def.kind === 'hold') return [{ exerciseId: def.exerciseId!, sets: 1, durationSec: target }]
  const sets = Math.max(1, Math.ceil(target / 15))
  return [{ exerciseId: def.exerciseId!, sets, reps: Math.ceil(target / sets) }]
}

function dayText(def: ChallengeDef, target: number) {
  return def.kind === 'hold' ? `hold for ${formatSeconds(target)}` : def.kind === 'mobility' ? `${target} minutes of mobility` : `${target} reps in total`
}

function ChallengeCard({ status, journey }: { status: ChallengeStatus; journey: Journey }) {
  const tryNow = useTryNow()
  const { def, days, dayIndex, over, finishedAll } = status
  const todayDay = days[dayIndex]
  const doneCount = days.filter((d) => d.state === 'done').length
  const ex = def.exerciseId ? journey.get(def.exerciseId) : null

  const leave = async () => {
    if (confirmAction(`Leave the ${def.name}? Your progress on it will be cleared.`)) await db.challenges.delete(def.id)
  }
  const restart = () => db.challenges.put({ id: def.id, startDate: journey.today, joinedAt: Date.now() })

  return (
    <div className="card stack-sm challenge">
      <div className="row">
        <Decor name={def.decor} className="decor-inline" />
        <div className="grow">
          <div style={{ fontWeight: 700 }}>{def.name}</div>
          <div className="small muted">
            {over ? `Finished ${doneCount} of ${days.length} days` : `Day ${dayIndex + 1} of ${days.length} · ${doneCount} done`}
          </div>
        </div>
        <button className="icon-btn" onClick={() => void leave()} aria-label={`Leave ${def.name}`}>
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className="cal" role="list" aria-label="Challenge days">
        {days.map((d, i) => (
          <span key={d.date} role="listitem" className={`cal-day ${d.state} ${d.rest ? 'rest' : ''}`} title={`Day ${i + 1}${d.rest ? ': rest' : `: ${dayTarget(d)}`}`}>
            {d.rest ? '☾' : d.state === 'done' ? '★' : i + 1}
          </span>
        ))}
      </div>
      {over ? (
        <div className="row-between">
          <span className="handwritten" style={{ color: 'var(--berry)' }}>
            {finishedAll ? 'Every single day. Legendary! 🏆' : 'You made it to the end ✦'}
          </span>
          <button className="btn sm" onClick={() => void restart()}>
            <Icon name="repeat" size={16} /> Again
          </button>
        </div>
      ) : todayDay?.rest ? (
        <p className="handwritten" style={{ color: 'var(--berry)' }}>
          Rest day ☾ Let your muscles knit their magic.
        </p>
      ) : todayDay ? (
        <div className="stack-sm">
          <div className="row-between small">
            <span>
              Today: <strong>{dayText(def, dayTarget(todayDay))}</strong>
              {ex ? ` · ${ex.name}` : ''}
            </span>
            {todayDay.state === 'done' && (
              <span className="status good">
                <Icon name="check" size={16} /> Done
              </span>
            )}
          </div>
          {todayDay.state !== 'done' && (
            <>
              <Meter value={todayDay.value} max={dayTarget(todayDay)} />
              <button className="btn primary block" onClick={() => void tryNow(challengeEntries(def, dayTarget(todayDay)), def.name)}>
                <Icon name="play" size={14} /> Do today’s
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

function ChallengeInvite({ def, today }: { def: ChallengeDef; today: string }) {
  const join = () => db.challenges.put({ id: def.id, startDate: today, joinedAt: Date.now() })
  const first = def.days[0]
  const last = def.days.filter((d) => !d.rest).at(-1)!
  return (
    <div className="card row invite">
      <Decor name={def.decor} className="decor-inline" />
      <div className="grow">
        <div style={{ fontWeight: 700 }}>{def.name}</div>
        <div className="small text-2">{def.blurb}</div>
        <div className="tiny muted">
          {def.days.length} days · {dayText(def, dayTarget(first))} → {dayText(def, dayTarget(last))}
        </div>
      </div>
      <button className="btn sm brass" onClick={() => void join()}>
        Join
      </button>
    </div>
  )
}
