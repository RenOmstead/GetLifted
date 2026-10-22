import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Icon } from '../components/Icon'
import { Meter, Ring } from '../components/Ring'
import { SKILLS, targetLabel } from '../data/skills'
import { db } from '../db/db'
import { ageFromSettings, useSettings } from '../db/settings'
import type { Routine } from '../db/types'
import { addDays, dateKey, formatClock, formatDuration } from '../lib/dates'
import { useExercises } from '../lib/exercises'
import { fastStage } from '../lib/fasting'
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
  const workouts = useLiveQuery(() => db.workouts.toArray(), []) ?? []
  const marks = useLiveQuery(() => db.skillMarks.toArray(), []) ?? []
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

  const toggleSup = async (id: number, dailyServings: number) => {
    const log = supLogs.find((l) => l.supplementId === id)
    if (log?.id) await db.supplementLogs.delete(log.id)
    else await db.supplementLogs.add({ date: today, supplementId: id, servings: dailyServings, at: Date.now() })
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="grow">
          <h1>
            {greeting(new Date(now).getHours())}
            {settings.name ? `, ${settings.name}` : ''}
          </h1>
          <div className="subtitle">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
        <Link className="icon-btn filled" to="/settings" aria-label="Settings">
          <Icon name="settings" />
        </Link>
      </div>

      <ActiveWorkoutCard />

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
        <div className="card row">
          <Icon name="calendar" className="muted" />
          <div className="grow small text-2">{routines.length ? 'Nothing planned today. Rest, or start something anyway.' : 'Build your first routine and plan your week.'}</div>
          <Link className="btn sm" to={routines.length ? '/train' : '/train?tab=routines'}>
            {routines.length ? 'Train' : 'Get started'}
          </Link>
        </div>
      )}

      <div className="grid-2">
        <Link to="/fasting" className="card card-link stack-sm">
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

        <Link to="/nutrition" className="card card-link stack-sm" style={{ alignItems: 'center' }}>
          <Ring value={totals.kcal} max={settings.calorieGoal} size={92} stroke={9}>
            <div style={{ fontWeight: 700 }}>{Math.round(totals.kcal)}</div>
            <div className="tiny muted">kcal</div>
          </Ring>
          <div className="tiny muted center">
            P {Math.round(totals.protein)}/{settings.proteinGoalG} g · {Math.max(0, Math.round(settings.calorieGoal - totals.kcal))} left
          </div>
        </Link>
      </div>

      <div className="card stack-sm">
        <div className="row-between">
          <div className="card-title" style={{ margin: 0 }}>
            <Icon name="droplet" size={18} /> Water
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
        <div className="card stack-sm">
          <div className="row-between">
            <div className="card-title" style={{ margin: 0 }}>
              <Icon name="pill" size={18} /> Supplements
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

      <div className="card row">
        <Icon name="body" className="muted" />
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
            <Link to="/train?tab=skills">All skills</Link>
          </div>
          <div className="card flush list">
            {skillsInProgress.map(({ skill, p }) => {
              const lvl = skill.levels[p.current]
              return (
                <Link key={skill.id} className="list-item" to={`/train/skill/${skill.id}`}>
                  <Icon name="star" className="muted" />
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
