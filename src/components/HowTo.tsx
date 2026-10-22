import { Link } from 'react-router'
import { CATEGORY_LABELS } from '../data/exercises'
import type { ExerciseInfo } from '../lib/exercises'
import { useFedb } from '../lib/fedb'
import { ExerciseVisual } from './ExerciseVisual'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

/** Visual, step-by-step instructions and form cues for one exercise. */
export function HowTo({ exercise }: { exercise: ExerciseInfo }) {
  const needsLibrary = !exercise.steps?.length && !!exercise.fedb
  const fedb = useFedb(needsLibrary)
  const steps = exercise.steps?.length ? exercise.steps : exercise.fedb ? fedb.byId[exercise.fedb]?.instructions : undefined

  return (
    <div className="stack">
      <ExerciseVisual exercise={exercise} />
      <div className="row wrap">
        <span className="badge accent">{CATEGORY_LABELS[exercise.category]}</span>
        {exercise.equipment && <span className="badge">{exercise.equipment}</span>}
        {exercise.perSide && <span className="badge">Each side</span>}
        {exercise.muscles.slice(0, 4).map((m) => (
          <span key={m} className="badge">
            {m}
          </span>
        ))}
      </div>
      {exercise.cues?.length ? (
        <div className="card tight">
          <div className="card-title" style={{ marginBottom: 8 }}>
            <Icon name="target" size={18} /> Key form cues
          </div>
          <ul className="cues">
            {exercise.cues.map((c) => (
              <li key={c}>
                <Icon name="check" size={16} />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <h3 style={{ marginBottom: 8 }}>How to do it</h3>
        {steps?.length ? (
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        ) : needsLibrary && !fedb.error ? (
          <p className="muted small">Loading instructions…</p>
        ) : (
          <p className="muted small">No written steps for this one yet. Add your own notes on the exercise page.</p>
        )}
      </div>
    </div>
  )
}

export function HowToSheet({ exercise, onClose }: { exercise: ExerciseInfo | null; onClose: () => void }) {
  return (
    <Sheet
      open={!!exercise}
      onClose={onClose}
      title={exercise?.name}
      actions={
        exercise && (
          <Link className="btn sm" to={`/exercise/${encodeURIComponent(exercise.id)}`} onClick={onClose}>
            History
          </Link>
        )
      }
    >
      {exercise && <HowTo exercise={exercise} />}
    </Sheet>
  )
}
