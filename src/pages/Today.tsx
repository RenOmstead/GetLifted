import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Decor } from '../components/Decor'
import { Icon, type IconName } from '../components/Icon'
import { CoachCard, useCoach, useJourney } from '../components/Journey'
import { QuickStart, TodayChallenges } from '../components/QuickStart'
import { Meter, Ring } from '../components/Ring'
import { SKILLS, targetLabel } from '../data/skills'
import { db } from '../db/db'
import { ageFromSettings, useSettings } from '../db/settings'
import type { Routine } from '../db/types'
import { addDays, dateKey, formatClock, formatDuration } from '../lib/dates'
import { useExercises } from '../lib/exercises'
import { fastStage } from '../lib/fasting'
import { dailyQuests } from '../lib/gamify'
import { evaluateIntake, supplementTotals } from '../lib/nutrients'
import { mealTotals } from '../lib/nutrition'
import { skillProgress } from '../lib/progression'
import { displayToMl, fmt, kgToDisplay, mlToDisplay, volumeUnit, weightUnit } from '../lib/units'
import { startWorkout } from '../lib/workoutActions'
import { WeightSheet } from './Body'
import { useActiveFast, useNow } from './Fasting'
import { ActiveWorkoutCard, RoutineCard } from './train/Train'

function greeting(h: number) {
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const AFFIRMATIONS = [
  'Every rep is a little spell ✦',
  'Strong is its own kind of magic',
  'Small steps light long paths 🕯️',
  'Brew your strength slowly 🧪',
  'The moon never rushes, and still it rises 🌙',
  'You showed up. That’s the hardest charm to cast ✦',
  'Stretch, sip, and shine 🍵',
]

/** Same affirmation all day, a new one tomorrow. */
function affirmation(now: number) {
  const d = new Date(now)
  const day = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000)
  return AFFIRMATIONS[day % AFFIRMATIONS.length]
}

export default function Today() {
  const navigate = useNavigate()
  const settings = useSettings()
  const now = useNow()
  const today = dateKey()
  const { get } = useExercises()
  const routines = useLiveQuery(() => db.routines.toArray(), []) ?? []
  const todaysWorkouts = useLiveQuery(() => db.workouts.where('date').equals(today).toArray(), [today]) ?? []
  const meals = useLiveQuery(() => db.meals.where('date').equals(today).toArray(), [today]) ?? []
  const water = useLiveQuery(() => db.water.where('date').equals(today).toArray(), [today]) ?? []
  const supplements = useLiveQuery(() => db.supplements.filter((s) => s.active).toArray(), []) ?? []
  const supLogs = useLiveQuery(() => db.supplementLogs.where('date').equals(today).toArray(), [today]) ?? []
  const weights = useLiveQuery(() => db.weights.orderBy('date').reverse().limit(30).toArray(), []) ?? []
  const journey = useJourney()
  const { workouts, marks } = journey
  const suggestions = useCoach(journey)
  const fast = useActiveFast()
  const [weightSheet, setWeightSheet] = useState(false)

  const planned = (settings.weeklyPlan[new Date().getDay()] ?? []).map((id) => routines.find((r) => r.id === id)).filter((r): r is Routine => !!r)
  const totals = mealTotals(meals)
  const waterMl = water.reduce((s, w) => s + w.ml, 0)
  const u = settings.units
  const latest = weights[0]
  const weekAgo = weights.find((w) => w.date <= addDays(today, -7))
  const overUl = evaluateIntake(
    { age: ageFromSettings(settings), sex: settings.sex, smoker: settings.smoker },
    supplementTotals(supplements.map((s) => ({ supplement: s, servings: s.dailyServings }))).totals,
    {},
  ).filter((r) => r.status === 'over')

  const skillsInProgress = SKILLS.map((s) => ({ skill: s, p: skillProgress(s, workouts, marks) }))
    .filter(({ p, skill }) => p.achieved > 0 && p.current < skill.levels.length)
    .slice(0, 3)

  const quests = dailyQuests({ workouts, meals, water, fasts: journey.fasts, weights, marks, settings, get }, today)
  const questsDone = quests.filter((q) => q.value >= q.target).length

  const toggleSup = async (id: number, dailyServings: number) => {
    const log = supLogs.find((l) => l.supplementId === id)
    if (log?.id) await db.supplementLogs.delete(log.id)
    else await db.supplementLogs.add({ date: today, supplementId: id, servings: dailyServings, at: Date.now() })
  }

  return (
    <div className="page">
      <Link className="icon-btn filled top-settings" to="/settings" aria-label="Settings">
        <Icon name="settings" />
      </Link>
      <div className="wordmark">
        <span className="spark">✦</span>Get Lifted<span className="spark">✦</span>
      </div>
      <Decor name="lantern_string" className="decor-garland" />
      <div className="hero">
        <Decor name="black_cat" className="decor-perch" />
        <div className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <h1>
          {greeting(new Date(now).getHours())}
          {settings.name ? `, ${settings.name}` : ''}
        </h1>
        <p className="quote">{affirmation(now)}</p>
        <div className="flourish" />
        <div className="hero-stats">
          <Link to="/quests" className={journey.streak ? 'lit' : ''}>
            <Icon name="flame" size={16} /> {journey.streak}-day streak
          </Link>
          <Link to="/path">
            <Icon name="star" size={16} /> Level {journey.level.level}
          </Link>
        </div>
      </div>

      <ActiveWorkoutCard />
      <QuickStart />
      <TodayChallenges />

      <CoachCard suggestions={suggestions} limit={2} title="A whisper from your coach" />

      <div className="section-title">
        <h2>Training</h2>
        <Link to="/train">Plan</Link>
      </div>
      {planned.length ? (
        planned.map((r) => (
          <RoutineCard
            key={r.id}
            routine={r}
            done={todaysWorkouts.some((w) => w.routineId === r.id && w.endedAt != null)}
            onStart={() => void startWorkout(r).then((id) => navigate(`/train/workout/${id}`))}
          />
        ))
      ) : (
        <div className="card row tint-pink">
          <Decor name="star_lantern" className="decor-inline" />
          <div className="grow small text-2">{routines.length ? 'Nothing planned today. Rest, or start something anyway.' : 'Build your first routine and plan your week.'}</div>
          <Link className="btn sm" to={routines.length ? '/train' : '/train?tab=routines'}>
            {routines.length ? 'Train' : 'Get started'}
          </Link>
        </div>
      )}

      <div className="grid-2">
        <Link to="/nutrition?tab=fasting" className="card card-link stack-sm tint-lavender">
          <div className="card-title" style={{ margin: 0 }}>
            <Icon name="timer" size={18} /> Fasting
          </div>
          {fast ? (
            <>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }} className="num">
                {formatClock(now - fast.start)}
              </div>
              <Meter value={now - fast.start} max={fast.goalHours * 3_600_000} tone={now - fast.start >= fast.goalHours * 3_600_000 ? 'good' : undefined} />
              <div className="tiny muted">{fastStage((now - fast.start) / 3_600_000).title}</div>
            </>
          ) : (
            <>
              <div className="small text-2">Not fasting</div>
              <span className="btn sm">Start {settings.fastingGoalHours}h fast</span>
            </>
          )}
        </Link>

        <Link to="/nutrition" className="card card-link stack-sm tint-peach" style={{ alignItems: 'center' }}>
          <Ring value={totals.kcal} max={settings.calorieGoal} size={92} stroke={9}>
            <div style={{ fontWeight: 700 }}>{Math.round(totals.kcal)}</div>
            <div className="tiny muted">kcal</div>
          </Ring>
          <div className="tiny muted center">
            P {Math.round(totals.protein)}/{settings.proteinGoalG} g · {Math.max(0, Math.round(settings.calorieGoal - totals.kcal))} left
          </div>
        </Link>
      </div>

      <div className="card stack-sm tint-sky">
        <div className="row-between">
          <div className="card-title" style={{ margin: 0 }}>
            <Decor name="plum_mug" className="decor-title" /> Water
          </div>
          <span className="small num">
            {fmt(mlToDisplay(waterMl, u), 0)} / {fmt(mlToDisplay(settings.waterGoalMl, u), 0)} {volumeUnit(u)}
          </span>
        </div>
        <Meter value={waterMl} max={settings.waterGoalMl} tone="series" />
        <div className="row">
          {(u === 'imperial' ? [8, 16] : [250, 500]).map((v) => (
            <button key={v} className="btn sm grow" onClick={() => void db.water.add({ date: today, ml: displayToMl(v, u), at: Date.now() })}>
              +{v} {volumeUnit(u)}
            </button>
          ))}
        </div>
      </div>

      {supplements.length > 0 && (
        <div className="card stack-sm tint-butter">
          <div className="row-between">
            <div className="card-title" style={{ margin: 0 }}>
              <Decor name="potion_trio" className="decor-title" /> Supplements
            </div>
            <Link className="small" to="/nutrition?tab=vitamins">
              Details
            </Link>
          </div>
          {overUl.length > 0 && (
            <div className="callout critical small">
              <Icon name="alert" size={18} />
              <span>Your daily plan is above the upper limit for {overUl.map((r) => r.nutrient.name).join(', ')}.</span>
            </div>
          )}
          <div className="row wrap">
            {supplements.map((s) => {
              const on = supLogs.some((l) => l.supplementId === s.id)
              return (
                <button key={s.id} className={`chip ${on ? 'active' : ''}`} onClick={() => void toggleSup(s.id!, s.dailyServings)} aria-pressed={on}>
                  {on && <Icon name="check" size={14} />} {s.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <Link to="/quests" className="card card-link stack-sm tint-butter">
        <div className="row-between">
          <div className="card-title" style={{ margin: 0 }}>
            <Icon name="trophy" size={18} /> Today’s quests
          </div>
          <span className="small text-2">
            {questsDone} of {quests.length}
          </span>
        </div>
        {quests.map((q) => {
          const done = q.value >= q.target
          return (
            <div key={q.id} className={`row small quest ${done ? 'done' : ''}`}>
              <span className="quest-icon sm">
                <Icon name={(done ? 'check' : q.icon) as IconName} size={15} />
              </span>
              <span className="grow">{q.title}</span>
              <span className="xp-tag">+{q.xp}</span>
            </div>
          )
        })}
      </Link>

      <div className="card row tint-mint">
        <Decor name="pink_lamp" className="decor-inline" />
        <div className="grow">
          <div style={{ fontWeight: 650 }}>{latest ? `${fmt(kgToDisplay(latest.kg, u))} ${weightUnit(u)}` : 'No weigh-ins yet'}</div>
          <div className="small muted">
            {latest && weekAgo
              ? `${kgToDisplay(latest.kg - weekAgo.kg, u) > 0 ? '+' : ''}${fmt(kgToDisplay(latest.kg - weekAgo.kg, u))} ${weightUnit(u)} this week`
              : latest
                ? `Last logged ${formatDuration(now - new Date(latest.date).getTime())} ago`
                : 'Log your weight to track your trend'}
          </div>
        </div>
        <button className="btn sm" onClick={() => setWeightSheet(true)}>
          Log
        </button>
      </div>

      {skillsInProgress.length > 0 && (
        <>
          <div className="section-title">
            <h2>Next skill goals</h2>
            <Link to="/path">Your path</Link>
          </div>
          <div className="card flush list">
            {skillsInProgress.map(({ skill, p }) => {
              const lvl = skill.levels[p.current]
              return (
                <Link key={skill.id} className="list-item" to={`/path?skill=${skill.id}`}>
                  <span className="trail-mini" aria-hidden="true">
                    ★
                  </span>
                  <div className="grow">
                    <div className="title">{skill.name}</div>
                    <div className="meta">
                      {get(lvl.exerciseId).name} · {targetLabel(lvl)}
                    </div>
                  </div>
                  <Icon name="chevronRight" className="muted" />
                </Link>
              )
            })}
          </div>
        </>
      )}

      {weightSheet && <WeightSheet open onClose={() => setWeightSheet(false)} />}
    </div>
  )
}
