import { useMemo, useState } from 'react'
import { CATEGORY_LABELS, TRACK_LABELS } from '../data/exercises'
import { db } from '../db/db'
import type { ExerciseCategory, TrackType } from '../db/types'
import { searchExercises, useExercises, type ExerciseInfo } from '../lib/exercises'
import { fedbImageUrls, fedbToCustom, useFedb, type FedbExercise } from '../lib/fedb'
import { uid } from '../lib/workouts'
import { ExerciseThumb, ThumbPhoto } from './ExerciseVisual'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ExerciseCategory[]

interface PickerProps {
  open: boolean
  onClose: () => void
  onPick: (exerciseIds: string[]) => void
  title?: string
}

/** Pick one or more exercises, from the curated list, the full photo library, or your own. */
export function ExercisePicker({ open, onClose, onPick, title = 'Add exercises' }: PickerProps) {
  const { list } = useExercises()
  const [tab, setTab] = useState<'curated' | 'library' | 'custom'>('curated')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all')
  const [selected, setSelected] = useState<string[]>([])
  const fedb = useFedb(open && tab === 'library')

  const curated = useMemo(() => {
    const inCat = category === 'all' ? list : list.filter((e) => e.category === category)
    return searchExercises(
      inCat.filter((e) => !e.id.startsWith('fedb:')),
      query,
    )
  }, [list, category, query])

  const library = useMemo(() => {
    if (!fedb.data) return []
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return fedb.data
      .filter((e) => terms.every((t) => `${e.name} ${e.equipment ?? ''} ${e.primaryMuscles.join(' ')} ${e.category}`.toLowerCase().includes(t)))
      .slice(0, 80)
  }, [fedb.data, query])

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const pickLibrary = async (e: FedbExercise) => {
    await db.customExercises.put(fedbToCustom(e))
    toggle(`fedb:${e.id}`)
  }

  const finish = () => {
    onPick(selected)
    setSelected([])
    setQuery('')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="stack">
        <div className="segmented">
          <button className={tab === 'curated' ? 'active' : ''} onClick={() => setTab('curated')}>
            Exercises
          </button>
          <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>
            Full library
          </button>
          <button className={tab === 'custom' ? 'active' : ''} onClick={() => setTab('custom')}>
            Create
          </button>
        </div>

        {tab !== 'custom' && (
          <label className="search">
            <Icon name="search" size={18} />
            <input className="input" placeholder={tab === 'library' ? 'Search 870+ exercises, machines, stretches' : 'Search name, muscle or equipment'} value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        )}

        {tab === 'curated' && (
          <>
            <div className="chips">
              <button className={`chip ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>
                All
              </button>
              {CATEGORIES.map((c) => (
                <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
            <div className="card flush list">
              {curated.map((e) => (
                <PickRow key={e.id} exercise={e} selected={selected.includes(e.id)} onToggle={() => toggle(e.id)} />
              ))}
              {!curated.length && <div className="empty">No matches. Try the full library.</div>}
            </div>
          </>
        )}

        {tab === 'library' && (
          <div className="card flush list">
            {fedb.error && <div className="empty">Couldn’t load the library ({fedb.error}). It needs a connection the first time.</div>}
            {!fedb.data && !fedb.error && <div className="empty">Loading library…</div>}
            {library.map((e) => {
              const id = `fedb:${e.id}`
              const on = selected.includes(id)
              return (
                <button key={e.id} className="list-item" onClick={() => (on ? toggle(id) : void pickLibrary(e))}>
                  <div className="thumb">
                    <ThumbPhoto src={fedbImageUrls(e.id)[0]} />
                  </div>
                  <div className="grow">
                    <div className="title">{e.name}</div>
                    <div className="meta truncate">
                      {e.equipment ?? 'no equipment'} · {e.primaryMuscles.join(', ')}
                    </div>
                  </div>
                  <span className={`check-btn ${on ? 'on' : ''}`} aria-hidden>
                    <Icon name={on ? 'check' : 'plus'} size={18} />
                  </span>
                </button>
              )
            })}
            {fedb.data && !library.length && <div className="empty">No matches.</div>}
          </div>
        )}

        {tab === 'custom' && <CreateExercise onCreated={(id) => setSelected((s) => [...s, id])} />}

        <button className="btn primary lg block" disabled={!selected.length} onClick={finish} style={{ position: 'sticky', bottom: 0 }}>
          {selected.length ? `Add ${selected.length} exercise${selected.length > 1 ? 's' : ''}` : 'Select exercises'}
        </button>
      </div>
    </Sheet>
  )
}

function PickRow({ exercise, selected, onToggle }: { exercise: ExerciseInfo; selected: boolean; onToggle: () => void }) {
  return (
    <button className="list-item" onClick={onToggle} aria-pressed={selected}>
      <ExerciseThumb exercise={exercise} />
      <div className="grow">
        <div className="title">{exercise.name}</div>
        <div className="meta truncate">
          {CATEGORY_LABELS[exercise.category]}
          {exercise.equipment ? ` · ${exercise.equipment}` : ''}
        </div>
      </div>
      <span className={`check-btn ${selected ? 'on' : ''}`} aria-hidden>
        <Icon name={selected ? 'check' : 'plus'} size={18} />
      </span>
    </button>
  )
}

function CreateExercise({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ExerciseCategory>('strength')
  const [track, setTrack] = useState<TrackType>('weighted')
  const [perSide, setPerSide] = useState(false)
  const [equipment, setEquipment] = useState('')
  const [created, setCreated] = useState<string | null>(null)

  const save = async () => {
    const id = `custom:${uid()}`
    await db.customExercises.put({ id, name: name.trim(), category, track, muscles: [], equipment: equipment.trim() || undefined, perSide })
    onCreated(id)
    setCreated(name.trim())
    setName('')
    setEquipment('')
  }

  return (
    <div className="card stack">
      <p className="small text-2">Add any move or machine. Open it afterwards to attach a photo of the machine and your seat or pin settings.</p>
      <label className="field">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hammer Strength Row" />
      </label>
      <div className="grid-2">
        <label className="field">
          <span>Type</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as ExerciseCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Log it as</span>
          <select value={track} onChange={(e) => setTrack(e.target.value as TrackType)}>
            {(Object.keys(TRACK_LABELS) as TrackType[]).map((t) => (
              <option key={t} value={t}>
                {TRACK_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Equipment (optional)</span>
        <input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="e.g. cable machine" />
      </label>
      <label className="toggle">
        <span>Done one side at a time</span>
        <input type="checkbox" checked={perSide} onChange={(e) => setPerSide(e.target.checked)} />
      </label>
      <button className="btn block" disabled={!name.trim()} onClick={() => void save()}>
        <Icon name="plus" size={18} /> Create and select
      </button>
      {created && <p className="small status good">Created “{created}”. Tap Add below.</p>}
    </div>
  )
}
