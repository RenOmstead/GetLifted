import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ExerciseThumb } from '../../components/ExerciseVisual'
import { HowToSheet } from '../../components/HowTo'
import { Icon } from '../../components/Icon'
import { Meter } from '../../components/Ring'
import { SKILL_BY_ID, targetLabel } from '../../data/skills'
import { db } from '../../db/db'
import { formatSeconds } from '../../lib/dates'
import { useExercises, type ExerciseInfo } from '../../lib/exercises'
import { skillProgress } from '../../lib/progression'

export default function SkillPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const skill = SKILL_BY_ID[id ?? '']
  const workouts = useLiveQuery(() => db.workouts.toArray(), []) ?? []
  const marks = useLiveQuery(() => db.skillMarks.toArray(), []) ?? []
  const { get } = useExercises()
  const [howTo, setHowTo] = useState<ExerciseInfo | null>(null)
  if (!skill) return <div className="page empty">Skill not found.</div>

  const p = skillProgress(skill, workouts, marks)

  const toggleMark = async (level: number, on: boolean) => {
    const markId = `${skill.id}:${level}`
    if (on) await db.skillMarks.put({ id: markId, skillId: skill.id, level, achievedAt: Date.now() })
    else await db.skillMarks.delete(markId)
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="chevronLeft" />
        </button>
        <div className="grow">
          <h1>{skill.name}</h1>
          <div className="subtitle">{skill.description}</div>
        </div>
      </div>
      <div className="card stack-sm">
        <div className="row-between small">
          <span>
            {p.achieved} of {skill.levels.length} levels
          </span>
          <span className="muted">Tap a level to see how it’s done</span>
        </div>
        <Meter value={p.achieved} max={skill.levels.length} tone={p.achieved === skill.levels.length ? 'good' : undefined} />
      </div>

      <div className="stack-sm">
        {skill.levels.map((lvl, i) => {
          const ex = get(lvl.exerciseId)
          const lp = p.levels[i]
          const achieved = lp.achievedAt != null
          const isCurrent = i === p.current
          const locked = i > p.current
          const unit = (v: number) => (lvl.holdSec != null ? formatSeconds(v) : `${v} reps`)
          return (
            <div key={i} className="card stack-sm" style={isCurrent ? { borderColor: 'var(--accent)', borderWidth: 2 } : locked ? { opacity: 0.7 } : undefined}>
              <div className="row">
                <button style={{ all: 'unset', cursor: 'pointer' }} onClick={() => setHowTo(ex)} aria-label={`How to do ${ex.name}`}>
                  <ExerciseThumb exercise={ex} large />
                </button>
                <div className="grow">
                  <div className="tiny muted">Level {i + 1}</div>
                  <div style={{ fontWeight: 650 }}>{ex.name}</div>
                  <div className="small text-2">Goal: {targetLabel(lvl)}</div>
                </div>
                {achieved ? (
                  <span className="status good">
                    <Icon name="check" size={18} />
                  </span>
                ) : locked ? (
                  <Icon name="lock" size={18} className="muted" />
                ) : (
                  <span className="badge accent">Now</span>
                )}
              </div>
              {(isCurrent || achieved) && (
                <div className="small text-2">
                  {achieved
                    ? `Achieved ${new Date(lp.achievedAt!).toLocaleDateString()}${lp.manual ? ' (marked by you)' : ''}`
                    : lp.bestValue > 0
                      ? `Best set: ${unit(lp.bestValue)} · ${lp.bestQualifying}/${lvl.sets} sets at goal in one workout`
                      : 'Log this exercise in a workout to start tracking.'}
                </div>
              )}
              {!achieved && lp.bestQualifying > 0 && <Meter value={lp.bestQualifying} max={lvl.sets} />}
              <div className="row">
                <Link className="btn sm" to={`/exercise/${encodeURIComponent(ex.id)}`}>
                  History
                </Link>
                {!locked && (!achieved || lp.manual) && (
                  <button className="btn sm ghost" onClick={() => void toggleMark(i, !achieved)}>
                    {achieved ? 'Unmark' : 'I can already do this'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <HowToSheet exercise={howTo} onClose={() => setHowTo(null)} />
    </div>
  )
}
