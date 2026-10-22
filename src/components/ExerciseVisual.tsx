import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../db/db'
import { Figure, hasFigure } from '../figures/Figure'
import { FIGURES } from '../figures/poses'
import { fedbImageUrls } from '../lib/fedb'
import type { ExerciseInfo } from '../lib/exercises'
import { Icon } from './Icon'

function useObjectUrl(blob: Blob | null | undefined): string | null {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])
  return url
}

/** Start and end photos, cross-fading so the movement reads like an animation. */
function PhotoPair({ id, name }: { id: string; name: string }) {
  const urls = fedbImageUrls(id)
  const [frame, setFrame] = useState(0)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => 1 - f), 1400)
    return () => clearInterval(t)
  }, [])
  if (failed)
    return (
      <div className="empty small">
        <Icon name="camera" size={28} />
        Photos need a connection the first time you view them.
      </div>
    )
  return (
    <>
      {urls.map((u, i) => (
        <img key={u} src={u} alt={`${name}: ${i === 0 ? 'start' : 'end'} position`} style={{ opacity: frame === i ? 1 : 0 }} onError={() => setFailed(true)} loading="lazy" />
      ))}
      <span className="visual-caption">{frame === 0 ? 'Start' : 'Finish'}</span>
    </>
  )
}

/** The main demonstration for an exercise: animated figure, photos, or your own photo. */
export function ExerciseVisual({ exercise }: { exercise: ExerciseInfo }) {
  const note = useLiveQuery(() => db.exerciseNotes.get(exercise.id), [exercise.id])
  const userPhoto = useObjectUrl(note?.photo)
  if (hasFigure(exercise.figure))
    return (
      <div className="visual">
        <Figure id={exercise.figure!} title={`${exercise.name} demonstration`} />
        {FIGURES[exercise.figure!].caption && <span className="visual-caption">{FIGURES[exercise.figure!].caption}</span>}
      </div>
    )
  if (exercise.fedb)
    return (
      <div className="visual photo">
        <PhotoPair id={exercise.fedb} name={exercise.name} />
      </div>
    )
  if (userPhoto)
    return (
      <div className="visual photo">
        <img src={userPhoto} alt={`Your photo of ${exercise.name}`} />
      </div>
    )
  return (
    <div className="visual">
      <div className="empty small">
        <Icon name="camera" size={28} />
        Add a photo below so you remember the setup.
      </div>
    </div>
  )
}

/** Small square preview for lists. */
export function ExerciseThumb({ exercise, large }: { exercise: ExerciseInfo; large?: boolean }) {
  const note = useLiveQuery(() => (exercise.custom && !exercise.fedb ? db.exerciseNotes.get(exercise.id) : undefined), [exercise.id, exercise.custom])
  const userPhoto = useObjectUrl(note?.photo)
  const cls = `thumb ${large ? 'lg' : ''}`
  if (hasFigure(exercise.figure))
    return (
      <div className={cls}>
        <Figure id={exercise.figure!} animate={false} />
      </div>
    )
  if (exercise.fedb)
    return (
      <div className={cls}>
        <img src={fedbImageUrls(exercise.fedb)[0]} alt="" loading="lazy" />
      </div>
    )
  if (userPhoto)
    return (
      <div className={cls}>
        <img src={userPhoto} alt="" />
      </div>
    )
  return (
    <div className={cls}>
      <Icon name="dumbbell" className="muted" />
    </div>
  )
}
