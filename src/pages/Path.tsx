import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Decor } from '../components/Decor'
import { ExerciseThumb } from '../components/ExerciseVisual'
import { HowTo, HowToSheet } from '../components/HowTo'
import { Icon } from '../components/Icon'
import { CoachCard, useCoach, useJourney, useTryNow, XpStrip } from '../components/Journey'
import { Meter } from '../components/Ring'
import { Sheet } from '../components/Sheet'
import { LADDERS, type Ladder } from '../data/ladders'
import { SKILL_BY_ID, SKILLS, targetLabel, type Skill } from '../data/skills'
import { LIFT_MILESTONES, milestoneMultiples, TIERS } from '../data/strength'
import { db } from '../db/db'
import { useSettings } from '../db/settings'
import type { SetEntry, Units } from '../db/types'
import { hasDone, ladderText, meetsLadder, repMaxTable } from '../lib/coach'
import { formatSeconds, formatShortDate, dateKey } from '../lib/dates'
import type { ExerciseInfo } from '../lib/exercises'
import { skillProgress, type SkillProgress } from '../lib/progression'
import { fmt, KG_PER_LB, kgToDisplay, weightUnit } from '../lib/units'
import { e1rm } from '../lib/workouts'

type Journey = ReturnType<typeof useJourney>
type FlatSet = SetEntry & { exerciseId: string; date: string }

const PATH_DECOR = ['mushroom_lamp', 'black_cat', 'amethyst_cluster', 'potion_trio', 'star_lantern', 'sage_mug']

/** Every completed set from finished workouts, tagged with its exercise and date. */
function flatSets(j: Journey): FlatSet[] {
  return j.workouts
    .filter((w) => w.endedAt != null)
    .flatMap((w) => w.entries.flatMap((e) => e.sets.filter((s) => s.done).map((s) => ({ ...s, exerciseId: e.exerciseId, date: w.date }))))
}

/** A weight rounded to what you can load: 5 lb or 2.5 kg steps. */
function loadLabel(kg: number, units: Units): string {
  const step = units === 'imperial' ? 5 * KG_PER_LB : 2.5
  return `${fmt(kgToDisplay(Math.round(kg / step) * step, units), units === 'imperial' ? 0 : 1)} ${weightUnit(units)}`
}

export default function Path() {
  const [params, setParams] = useSearchParams()
  const journey = useJourney()
  const suggestions = useCoach(journey)
  const tab = params.get('tab') === 'lifting' ? 'lifting' : 'skills'
  return (
    <div className="page">
      <div className="page-header">
        <div className="grow">
          <h1>Your Path</h1>
          <div className="subtitle">One little step at a time ✦</div>
        </div>
        <Decor name="star_lantern" className="decor-header" />
      </div>
      <div className="card tight">
        <XpStrip journey={journey} />
      </div>
      <CoachCard suggestions={suggestions} />
      <div className="segmented">
        <button className={tab === 'skills' ? 'active' : ''} onClick={() => setParams({ tab: 'skills' }, { replace: true })}>
          Calisthenics
        </button>
        <button className={tab === 'lifting' ? 'active' : ''} onClick={() => setParams({ tab: 'lifting' }, { replace: true })}>
          Lifting
        </button>
      </div>
      {tab === 'skills' ? <SkillsPath journey={journey} /> : <LiftingPath journey={journey} />}
    </div>
  )
}

/* ── Calisthenics: a Duolingo-style path per skill ─────────────────── */

function SkillsPath({ journey }: { journey: Journey }) {
  const [params, setParams] = useSearchParams()
  const progress = SKILLS.map((s) => ({ skill: s, p: skillProgress(s, journey.workouts, journey.marks) }))
  const inProgress = progress.find(({ skill, p }) => p.achieved > 0 && p.current < skill.levels.length)?.skill.id
  const skill = SKILL_BY_ID[params.get('skill') ?? ''] ?? SKILL_BY_ID[inProgress ?? 'pushup']
  const p = progress.find((x) => x.skill.id === skill.id)!.p
  const [open, setOpen] = useState<number | null>(null)
  const sets = flatSets(journey)
  const levelOf = (id: string) => skill.levels.findIndex((l) => l.exerciseId === id)
  const ladders = LADDERS.filter((l) => levelOf(l.from) >= 0 && levelOf(l.to) >= 0)
  const climbed = (l: Ladder) => hasDone(sets, l.to) || skill.levels.some((lvl, i) => lvl.exerciseId === l.to && p.levels[i].achievedAt != null)
  // The rungs that matter now: starting from a level you've reached, leading somewhere new.
  const unclimbed = ladders.filter((l) => !climbed(l))
  const near = unclimbed.filter((l) => levelOf(l.from) <= p.current)
  const featured = (near.length ? near : unclimbed).slice(0, 3)

  return (
    <>
      <div className="chips" role="tablist" aria-label="Skills">
        {progress.map(({ skill: s, p: sp }) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={s.id === skill.id}
            className={`chip ${s.id === skill.id ? 'active' : ''}`}
            onClick={() => setParams({ tab: 'skills', skill: s.id }, { replace: true })}
          >
            {s.name}
            <span className="chip-count">
              {sp.achieved}/{s.levels.length}
            </span>
          </button>
        ))}
      </div>

      <div className="card stack-sm">
        <div className="row-between">
          <h2>{skill.name}</h2>
          <span className="badge">{skill.group}</span>
        </div>
        <p className="small text-2">{skill.description}</p>
        <div className="row-between tiny muted">
          <span>
            {p.achieved} of {skill.levels.length} levels
          </span>
          <span>Tap a stone to see how it’s done</span>
        </div>
        <Meter value={p.achieved} max={skill.levels.length} tone={p.achieved === skill.levels.length ? 'good' : undefined} />
      </div>

      <SkillTrail skill={skill} p={p} get={journey.get} onOpen={setOpen} />

      {ladders.length > 0 && (
        <>
          <div className="section-title">
            <h2>If you can do this, you can do that</h2>
          </div>
          {featured.map((l) => (
            <LadderCard key={`${l.from}-${l.to}`} ladder={l} sets={sets} journey={journey} />
          ))}
          <LadderIndex ladders={ladders.filter((l) => !featured.includes(l))} climbed={climbed} journey={journey} />
        </>
      )}

      {open != null && <LevelSheet skill={skill} index={open} p={p} journey={journey} onClose={() => setOpen(null)} />}
    </>
  )
}

/** The rest of the rules of thumb as a compact, foldable list. */
function LadderIndex({ ladders, climbed, journey }: { ladders: Ladder[]; climbed: (l: Ladder) => boolean; journey: Journey }) {
  const settings = useSettings()
  const latest = useLiveQuery(() => db.weights.orderBy('date').last(), [])
  if (!ladders.length) return null
  return (
    <details className="card ladder-index">
      <summary>
        <strong>More stepping stones</strong> <span className="small muted">({ladders.length})</span>
      </summary>
      <ul>
        {ladders.map((l) => (
          <li key={`${l.from}-${l.to}`} className={climbed(l) ? 'climbed' : ''}>
            <span className="ladder-index-mark" aria-label={climbed(l) ? 'Climbed' : 'Not yet'}>
              {climbed(l) ? '★' : '☆'}
            </span>
            <span>{ladderText(l, journey.get, settings.units, latest?.kg ?? null)}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function SkillTrail({ skill, p, get, onOpen }: { skill: Skill; p: SkillProgress; get: Journey['get']; onOpen: (i: number) => void }) {
  const complete = p.current >= skill.levels.length
  return (
    <div className="trail">
      {skill.levels.map((lvl, i) => {
        const ex = get(lvl.exerciseId)
        const state = p.levels[i].achievedAt != null ? 'done' : i === p.current ? 'current' : 'locked'
        const x = Math.round(Math.sin((i * Math.PI) / 3) * 62)
        return (
          <div key={i} className={`trail-step ${state}`} style={{ transform: `translateX(${x}px)` }}>
            {state === 'current' && <span className="trail-start">Start</span>}
            <button className={`trail-node ${state}`} onClick={() => onOpen(i)} aria-label={`Level ${i + 1}: ${ex.name}, ${state === 'done' ? 'complete' : state === 'current' ? 'up next' : 'locked'}`}>
              <Icon name={state === 'done' ? 'star' : state === 'current' ? 'dumbbell' : 'lock'} size={state === 'locked' ? 22 : 28} />
            </button>
            <div className="trail-label">
              <strong>{ex.name}</strong>
              <span>{targetLabel(lvl)}</span>
            </div>
            {i % 3 === 1 && <Decor name={PATH_DECOR[(skill.id.length + Math.floor(i / 3)) % PATH_DECOR.length]} className={`trail-decor ${x > 0 ? 'left' : 'right'}`} />}
          </div>
        )
      })}
      <div className="trail-step">
        <div className={`trail-node crown ${complete ? 'done' : 'locked'}`} aria-label={complete ? 'Skill mastered' : 'Mastery'}>
          <Icon name="trophy" size={28} />
        </div>
        <div className="trail-label">
          <strong>{complete ? 'Mastered ✦' : 'Mastery'}</strong>
        </div>
      </div>
    </div>
  )
}

function LevelSheet({ skill, index, p, journey, onClose }: { skill: Skill; index: number; p: SkillProgress; journey: Journey; onClose: () => void }) {
  const tryNow = useTryNow()
  const lvl = skill.levels[index]
  const lp = p.levels[index]
  const ex = journey.get(lvl.exerciseId)
  const achieved = lp.achievedAt != null
  const locked = index > p.current
  const hold = lvl.holdSec != null
  const unit = (v: number) => (hold ? formatSeconds(v) : `${v} rep${v === 1 ? '' : 's'}`)
  const into = LADDERS.filter((l) => l.to === lvl.exerciseId)

  const mark = async (on: boolean) => {
    const id = `${skill.id}:${index}`
    if (on) await db.skillMarks.put({ id, skillId: skill.id, level: index, achievedAt: Date.now() })
    else await db.skillMarks.delete(id)
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={`Level ${index + 1} · ${ex.name}`}>
      <div className="stack">
        <div className="callout">
          <Icon name="target" size={20} />
          <div className="grow">
            <strong>Goal: {targetLabel(lvl)}</strong> {hold ? 'second holds' : 'reps'} in one workout
            <div className="small text-2">
              {achieved
                ? `Unlocked ${formatShortDate(dateKey(lp.achievedAt!))}${lp.manual ? ' (you marked it)' : ''} ✦`
                : locked
                  ? `Unlocks after level ${p.current + 1}. Already strong here? Skip ahead below.`
                  : lp.bestValue > 0
                    ? `Best set so far: ${unit(lp.bestValue)} · ${lp.bestQualifying} of ${lvl.sets} sets at goal in one workout`
                    : 'Log this exercise in a workout and your progress shows up here.'}
            </div>
            {!achieved && lp.bestQualifying > 0 && (
              <div style={{ marginTop: 8 }}>
                <Meter value={lp.bestQualifying} max={lvl.sets} />
              </div>
            )}
          </div>
        </div>
        {into.map((l) => (
          <p key={l.from} className="handwritten" style={{ color: 'var(--berry)' }}>
            {ladderText(l, journey.get, 'imperial', null)}
          </p>
        ))}
        <HowTo exercise={ex} />
        <div className="sticky-actions row" style={{ bottom: 0 }}>
          {!achieved || lp.manual ? (
            <button className="btn grow" onClick={() => void mark(!achieved)}>
              {achieved ? 'Unmark' : locked ? 'Skip here' : 'I can do this'}
            </button>
          ) : null}
          <button
            className="btn primary grow"
            onClick={() => void tryNow([{ exerciseId: ex.id, sets: lvl.sets, reps: lvl.reps ?? null, durationSec: lvl.holdSec ?? null }], `${skill.name} practice`)}
          >
            <Icon name="play" size={14} /> Practice now
          </button>
        </div>
      </div>
    </Sheet>
  )
}

/* ── "If you can do 10 of these…" ladders ──────────────────────────── */

function LadderCard({ ladder: l, sets, journey }: { ladder: Ladder; sets: FlatSet[]; journey: Journey }) {
  const settings = useSettings()
  const latest = useLiveQuery(() => db.weights.orderBy('date').last(), [])
  const tryNow = useTryNow()
  const [howTo, setHowTo] = useState<ExerciseInfo | null>(null)
  const bodyKg = latest?.kg ?? null
  const from = journey.get(l.from)
  const to = journey.get(l.to)
  const hold = l.holdSec != null
  const goal = (hold ? l.holdSec : l.reps) ?? 0
  const mine = sets.filter((s) => s.exerciseId === l.from)
  const counted = l.bwRatio != null ? mine.filter((s) => bodyKg != null && (s.weightKg ?? 0) >= l.bwRatio! * bodyKg) : mine
  const best = Math.max(0, ...counted.map((s) => (hold ? (s.durationSec ?? 0) : (s.reps ?? 0))))
  const climbed = hasDone(sets, l.to)
  const ready = !climbed && mine.some((s) => meetsLadder(l, s, bodyKg))
  const start = l.start.holdSec != null ? `${l.start.sets} × ${l.start.holdSec}s` : `${l.start.sets} × ${l.start.reps}`

  return (
    <div className={`card ladder ${ready ? 'ready' : ''}`}>
      <div className="ladder-pair">
        <button className="plain ladder-ex" onClick={() => setHowTo(from)}>
          <ExerciseThumb exercise={from} />
          <span>
            <strong>{hold ? `${goal}s` : `${goal}×`}</strong> {from.name}
          </span>
        </button>
        <span className="ladder-arrow" aria-hidden="true">
          ➜
        </span>
        <button className="plain ladder-ex" onClick={() => setHowTo(to)}>
          <ExerciseThumb exercise={to} />
          <span>
            <strong>{l.start.reps === 1 ? '1×' : 'try'}</strong> {to.name}
          </span>
        </button>
      </div>
      <p className="handwritten">{ladderText(l, journey.get, settings.units, bodyKg)}</p>
      {climbed ? (
        <div className="status good small">
          <Icon name="check" size={16} /> Climbed! You’ve done {to.name.toLowerCase()}s.
        </div>
      ) : (
        <div className="stack-sm">
          <div className="row-between tiny muted">
            <span>Your best {hold ? 'hold' : 'set'}{l.bwRatio != null ? ' at that load' : ''}</span>
            <span className="num">
              {hold ? formatSeconds(best) : best} / {hold ? formatSeconds(goal) : goal}
            </span>
          </div>
          <Meter value={best} max={goal} tone={ready ? 'good' : undefined} />
          {l.bwRatio != null && bodyKg == null && <p className="tiny muted">Log your weight on the Body page so this one can count.</p>}
          {ready && (
            <div className="row-between">
              <span className="ready-tag">✦ Ready!</span>
              <button className="btn sm primary" onClick={() => void tryNow([{ exerciseId: l.to, sets: l.start.sets, reps: l.start.reps ?? null, durationSec: l.start.holdSec ?? null }], to.name)}>
                Try {start}
              </button>
            </div>
          )}
        </div>
      )}
      <HowToSheet exercise={howTo} onClose={() => setHowTo(null)} />
    </div>
  )
}

/* ── Lifting: milestones, rep maxes and lifting ladders ───────────── */

function LiftingPath({ journey }: { journey: Journey }) {
  const settings = useSettings()
  const latest = useLiveQuery(() => db.weights.orderBy('date').last(), [])
  const bodyKg = latest?.kg ?? null
  const sets = flatSets(journey)
  const u = settings.units
  const liftLadders = LADDERS.filter((l) => journey.get(l.from).track === 'weighted')
  const liftClimbed = (l: Ladder) => hasDone(sets, l.to)
  const milestoneIds = new Set(LIFT_MILESTONES.map((m) => m.exerciseId))
  const otherLifts = [...new Set(sets.filter((s) => s.weightKg && s.reps && journey.get(s.exerciseId).track === 'weighted').map((s) => s.exerciseId))].filter(
    (id) => !milestoneIds.has(id),
  )

  return (
    <>
      <p className="small text-2">
        Each lift has five waypoints, from Sprout to Legend, set as your estimated one-rep max compared with your body weight. They’re common strength-standard rules of thumb to aim for, not grades.
      </p>
      {bodyKg == null && (
        <div className="callout small">
          <Icon name="info" size={18} />
          <span>
            <Link to="/body">Log your weight</Link> to see each waypoint in {weightUnit(u)}.
          </span>
        </div>
      )}
      {LIFT_MILESTONES.map((m) => {
        const ex = journey.get(m.exerciseId)
        const mine = sets.filter((s) => s.exerciseId === m.exerciseId && s.weightKg && s.reps)
        const bestSet = mine.reduce<FlatSet | null>((b, s) => (!b || e1rm(s.weightKg!, s.reps!) > e1rm(b.weightKg!, b.reps!) ? s : b), null)
        const max = bestSet ? e1rm(bestSet.weightKg!, bestSet.reps!) : 0
        const mult = milestoneMultiples(m, settings.sex)
        const targets = mult.map((x) => (bodyKg != null ? x * bodyKg : null))
        const tier = bodyKg != null && max > 0 ? targets.filter((t) => t != null && max >= t).length : 0
        const next = tier < TIERS.length ? tier : null
        return (
          <div key={m.exerciseId} className="card stack-sm">
            <div className="row">
              <ExerciseThumb exercise={ex} />
              <div className="grow">
                <div style={{ fontWeight: 700 }}>{ex.name}</div>
                <div className="small muted">
                  {bestSet
                    ? `Best: ${loadLabel(bestSet.weightKg!, u)} × ${bestSet.reps} on ${formatShortDate(bestSet.date)} · about ${loadLabel(max, u)} max`
                    : 'Not logged yet'}
                </div>
              </div>
              {tier > 0 && <span className="badge accent">{TIERS[tier - 1]}</span>}
            </div>
            <div className="tiers">
              {TIERS.map((t, i) => (
                <div key={t} className={`tier ${i < tier ? 'reached' : i === next && max > 0 ? 'next' : ''}`}>
                  <span className="tier-dot">{i < tier ? '★' : i + 1}</span>
                  <span className="tier-name">{t}</span>
                  <span className="tier-value num">{targets[i] != null ? loadLabel(targets[i]!, u) : `${mult[i]}×`}</span>
                </div>
              ))}
            </div>
            {bodyKg != null && max > 0 && next != null && targets[next] != null && (
              <p className="handwritten" style={{ color: 'var(--berry)' }}>
                Next: {TIERS[next]} at {loadLabel(targets[next]!, u)}. A clean set of 5 at {loadLabel(targets[next]! / (1 + 5 / 30), u)} would get you there.
              </p>
            )}
            {max > 0 && (
              <details>
                <summary className="small" style={{ fontWeight: 700 }}>
                  Your rep maxes
                </summary>
                <div className="rep-maxes">
                  {repMaxTable(max).map((r) => (
                    <div key={r.reps}>
                      <span className="tiny muted">{r.reps} rep{r.reps === 1 ? '' : 's'}</span>
                      <strong className="num">{loadLabel(r.weightKg, u)}</strong>
                    </div>
                  ))}
                </div>
                <p className="tiny muted" style={{ marginTop: 6 }}>
                  Estimated from your best set with the Epley formula. Most accurate under about 10 reps.
                </p>
              </details>
            )}
          </div>
        )
      })}

      {liftLadders.length > 0 && (
        <>
          <div className="section-title">
            <h2>Stepping-stone lifts</h2>
          </div>
          {liftLadders
            .filter((l) => !liftClimbed(l))
            .map((l) => (
              <LadderCard key={`${l.from}-${l.to}`} ladder={l} sets={sets} journey={journey} />
            ))}
          <LadderIndex ladders={liftLadders.filter(liftClimbed)} climbed={liftClimbed} journey={journey} />
        </>
      )}

      {otherLifts.length > 0 && (
        <>
          <div className="section-title">
            <h2>Your other lifts</h2>
          </div>
          <div className="card flush list">
            {otherLifts.map((id) => {
              const mine = sets.filter((s) => s.exerciseId === id && s.weightKg && s.reps)
              const max = Math.max(...mine.map((s) => e1rm(s.weightKg!, s.reps!)))
              const ex = journey.get(id)
              return (
                <Link key={id} className="list-item" to={`/exercise/${encodeURIComponent(id)}`}>
                  <ExerciseThumb exercise={ex} />
                  <div className="grow">
                    <div className="title">{ex.name}</div>
                    <div className="meta">
                      About {loadLabel(max, u)} max · 5 reps ≈ {loadLabel(max / (1 + 5 / 30), u)} · 10 reps ≈ {loadLabel(max / (1 + 10 / 30), u)}
                    </div>
                  </div>
                  <Icon name="chevronRight" className="muted" />
                </Link>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
