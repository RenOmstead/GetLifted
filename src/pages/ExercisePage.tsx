import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Icon } from '../components/Icon'
import { HowTo } from '../components/HowTo'
import { LineChart } from '../components/LineChart'
import { confirmAction } from '../components/Sheet'
import { db } from '../db/db'
import { useSettings } from '../db/settings'
import { formatDayLabel, formatSeconds, formatShortDate, dateKey } from '../lib/dates'
import { customToInfo, useExercises, type ExerciseInfo } from '../lib/exercises'
import { fedbToCustom, useFedb } from '../lib/fedb'
import { fmt, kgToDisplay, mToDisplay, distanceUnit, weightUnit } from '../lib/units'
import { SCORE_LABEL, exerciseHistory, formatSet, personalRecords } from '../lib/workouts'

/** Shrinks a photo before storing it so the on-device database stays small. */
async function resizeImage(file: File, max = 1280): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.85))
}

function NotesCard({ exercise }: { exercise: ExerciseInfo }) {
  const note = useLiveQuery(() => db.exerciseNotes.get(exercise.id), [exercise.id])
  const [text, setText] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoUrl = useMemo(() => (note?.photo ? URL.createObjectURL(note.photo) : null), [note?.photo])
  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
  }, [photoUrl])

  const save = async (patch: { notes?: string; photo?: Blob | null }) => {
    const cur = await db.exerciseNotes.get(exercise.id)
    await db.exerciseNotes.put({ exerciseId: exercise.id, notes: cur?.notes ?? '', photo: cur?.photo ?? null, ...patch, updatedAt: Date.now() })
  }

  return (
    <div className="card stack-sm">
      <div className="card-title" style={{ marginBottom: 0 }}>
        <Icon name="camera" size={18} /> Your setup & notes
      </div>
      <p className="small muted">Snap the machine at your gym and note seat height, pin or grip so you set up the same way every time.</p>
      {photoUrl && <img src={photoUrl} alt={`Your photo of ${exercise.name}`} style={{ borderRadius: 10, maxHeight: 280, objectFit: 'cover', width: '100%' }} />}
      <textarea
        className="input"
        rows={3}
        placeholder="e.g. Seat 4, back pad 2, neutral grip"
        value={text ?? note?.notes ?? ''}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text != null && void save({ notes: text })}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hide"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) await save({ photo: await resizeImage(f) })
          e.target.value = ''
        }}
      />
      <div className="row">
        <button className="btn sm" onClick={() => fileRef.current?.click()}>
          <Icon name="camera" size={16} /> {photoUrl ? 'Replace photo' : 'Add photo'}
        </button>
        {photoUrl && (
          <button className="btn sm ghost danger" onClick={() => void save({ photo: null })}>
            Remove photo
          </button>
        )}
      </div>
    </div>
  )
}

export default function ExercisePage() {
  const { id = '' } = useParams()
  const exerciseId = decodeURIComponent(id)
  const navigate = useNavigate()
  const settings = useSettings()
  const { get } = useExercises()
  const known = get(exerciseId)
  const isUnknownLibrary = known.name === 'Unknown exercise' && exerciseId.startsWith('fedb:')
  const fedb = useFedb(isUnknownLibrary)
  const libraryEntry = isUnknownLibrary ? fedb.byId[exerciseId.slice(5)] : undefined
  const exercise: ExerciseInfo = libraryEntry ? customToInfo(fedbToCustom(libraryEntry)) : known

  const workouts = useLiveQuery(() => db.workouts.toArray(), []) ?? []
  const history = exerciseHistory(workouts, exercise.id, exercise.track)
  const pr = personalRecords(history, exercise.track)
  const u = settings.units

  const formatScore = (v: number) => {
    switch (exercise.track) {
      case 'weighted':
        return `${fmt(kgToDisplay(v, u))} ${weightUnit(u)}`
      case 'hold':
        return formatSeconds(v)
      case 'cardio':
        return history.some((h) => h.sets.some((s) => s.distanceM)) ? `${fmt(mToDisplay(v, u), 2)} ${distanceUnit(u)}` : formatSeconds(v)
      default:
        return `${v}`
    }
  }

  if (known.name === 'Unknown exercise' && !libraryEntry)
    return (
      <div className="page">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="chevronLeft" />
        </button>
        <p className="empty">{isUnknownLibrary && !fedb.error ? 'Loading…' : 'Exercise not found.'}</p>
      </div>
    )

  return (
    <div className="page">
      <div className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="chevronLeft" />
        </button>
        <h1>{exercise.name}</h1>
      </div>

      <HowTo exercise={exercise} />

      <div className="section-title">
        <h2>Your progress</h2>
      </div>
      {history.length ? (
        <>
          <div className="grid-2">
            <div className="card tight stat">
              <div className="label">{SCORE_LABEL[exercise.track]}</div>
              <div className="value">{formatScore(pr.best)}</div>
            </div>
            <div className="card tight stat">
              <div className="label">Sessions</div>
              <div className="value">{pr.sessions}</div>
            </div>
          </div>
          {history.length > 1 && (
            <div className="card">
              <h3 style={{ marginBottom: 8 }}>{SCORE_LABEL[exercise.track]}</h3>
              <LineChart
                series={[
                  {
                    id: 'best',
                    label: SCORE_LABEL[exercise.track],
                    color: 'var(--series-1)',
                    area: true,
                    points: history.map((h) => ({ x: h.startedAt, y: exercise.track === 'weighted' ? kgToDisplay(h.best, u) : exercise.track === 'cardio' && h.sets.some((s) => s.distanceM) ? mToDisplay(h.best, u) : h.best })),
                  },
                ]}
                formatY={(y) => (exercise.track === 'hold' ? formatSeconds(y) : fmt(y, exercise.track === 'cardio' ? 1 : 0))}
                formatX={(x) => formatShortDate(dateKey(x))}
              />
            </div>
          )}
          <div className="card flush list">
            {[...history].reverse().slice(0, 30).map((h) => (
              <Link key={h.workoutId} className="list-item" to={`/train/workout/${h.workoutId}`}>
                <div className="grow">
                  <div className="title">{formatDayLabel(h.date)}</div>
                  <div className="meta">{h.sets.map((s) => formatSet(s, exercise.track, u)).join(', ')}</div>
                </div>
                <Icon name="chevronRight" className="muted" />
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="card empty small">No sets logged yet. Your records and a progress chart appear after your first workout with this exercise.</div>
      )}

      <NotesCard exercise={exercise} />

      {exercise.custom && !exercise.fedb && (
        <button
          className="btn danger"
          onClick={async () => {
            if (!confirmAction(`Delete “${exercise.name}”? Logged sets stay in your history.`)) return
            await db.customExercises.delete(exercise.id)
            navigate(-1)
          }}
        >
          <Icon name="trash" size={18} /> Delete custom exercise
        </button>
      )}
    </div>
  )
}
