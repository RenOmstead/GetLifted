import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../db/db'
import { Figure, hasFigure } from '../figures/Figure'
import { FIGURES } from '../figures/poses'
import { artUrl } from '../lib/art'
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

/** A list thumbnail photo that quietly falls back to an icon when it can't load (e.g. offline). */
export function ThumbPhoto({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? <Icon name="dumbbell" className="muted" /> : <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
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

type View = 'art' | 'figure' | 'photos' | 'mine'
const VIEW_LABELS: Record<View, string> = { art: 'Picture', figure: 'Moving', photos: 'Photos', mine: 'Yours' }

/** The main demonstration for an exercise: character picture, animated figure, photos, or your own photo. */
export function ExerciseVisual({ exercise }: { exercise: ExerciseInfo }) {
  const note = useLiveQuery(() => db.exerciseNotes.get(exercise.id), [exercise.id])
  const userPhoto = useObjectUrl(note?.photo)
  const art = artUrl(exercise.id)
  const [chosen, setChosen] = useState<View | null>(null)
  const views: View[] = []
  if (art) views.push('art')
  if (hasFigure(exercise.figure)) views.push('figure')
  if (exercise.fedb) views.push('photos')
  if (userPhoto) views.push('mine')
  const view = chosen && views.includes(chosen) ? chosen : views[0]

  return (
    <div className="stack-sm">
      {view === 'art' ? (
        <div className="visual art">
          <img src={art} alt={`${exercise.name}, illustrated`} />
        </div>
      ) : view === 'figure' ? (
        <div className="visual">
          <Figure id={exercise.figure!} title={`${exercise.name} demonstration`} />
          {FIGURES[exercise.figure!].caption && <span className="visual-caption">{FIGURES[exercise.figure!].caption}</span>}
        </div>
      ) : view === 'photos' ? (
        <div className="visual photo">
          <PhotoPair id={exercise.fedb!} name={exercise.name} />
        </div>
      ) : view === 'mine' ? (
        <div className="visual photo">
          <img src={userPhoto!} alt={`Your photo of ${exercise.name}`} />
        </div>
      ) : (
        <div className="visual">
          <div className="empty small">
            <Icon name="camera" size={28} />
            Add a photo below so you remember the setup.
          </div>
        </div>
      )}
      {views.length > 1 && (
        <div className="visual-tabs" role="tablist" aria-label="How to show this exercise">
          {views.map((v) => (
            <button key={v} role="tab" aria-selected={v === view} className={`chip ${v === view ? 'active' : ''}`} onClick={() => setChosen(v)}>
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Small square preview for lists. */
export function ExerciseThumb({ exercise, large }: { exercise: ExerciseInfo; large?: boolean }) {
  const note = useLiveQuery(() => (exercise.custom && !exercise.fedb ? db.exerciseNotes.get(exercise.id) : undefined), [exercise.id, exercise.custom])
  const userPhoto = useObjectUrl(note?.photo)
  const cls = `thumb ${large ? 'lg' : ''}`
  const art = artUrl(exercise.id)
  if (art)
    return (
      <div className={`${cls} art`}>
        <img src={art} alt="" loading="lazy" />
      </div>
    )
  if (hasFigure(exercise.figure))
    return (
      <div className={cls}>
        <Figure id={exercise.figure!} animate={false} />
      </div>
    )
  if (exercise.fedb)
    return (
      <div className={cls}>
        <ThumbPhoto src={fedbImageUrls(exercise.fedb)[0]} />
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
