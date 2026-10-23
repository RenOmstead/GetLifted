import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ExerciseThumb, ThumbPhoto } from '../../components/ExerciseVisual'
import { Icon } from '../../components/Icon'
import { CATEGORY_LABELS } from '../../data/exercises'
import type { ExerciseCategory } from '../../db/types'
import { searchExercises, useExercises } from '../../lib/exercises'
import { fedbImageUrls, useFedb } from '../../lib/fedb'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ExerciseCategory[]
const EQUIPMENT = ['machine', 'cable', 'barbell', 'dumbbell', 'kettlebells', 'bands', 'body only', 'foam roll']

/** Browse every exercise with its picture, then open it for the full how-to. */
export default function Library() {
  const navigate = useNavigate()
  const { list } = useExercises()
  const [tab, setTab] = useState<'curated' | 'full'>('curated')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all')
  const [equipment, setEquipment] = useState<string | null>(null)
  const fedb = useFedb(tab === 'full')

  const curated = useMemo(
    () => searchExercises((category === 'all' ? list : list.filter((e) => e.category === category)).filter((e) => !e.id.startsWith('fedb:')), query),
    [list, category, query],
  )
  const full = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return (fedb.data ?? [])
      .filter((e) => !equipment || e.equipment === equipment)
      .filter((e) => terms.every((t) => `${e.name} ${e.equipment ?? ''} ${e.primaryMuscles.join(' ')} ${e.category}`.toLowerCase().includes(t)))
      .slice(0, 120)
  }, [fedb.data, query, equipment])

  return (
    <div className="page">
      <div className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="chevronLeft" />
        </button>
        <h1>Exercise library</h1>
      </div>
      <div className="segmented">
        <button className={tab === 'curated' ? 'active' : ''} onClick={() => setTab('curated')}>
          Get Lifted ({list.filter((e) => !e.id.startsWith('fedb:')).length})
        </button>
        <button className={tab === 'full' ? 'active' : ''} onClick={() => setTab('full')}>
          Full library (870+)
        </button>
      </div>
      <label className="search">
        <Icon name="search" size={18} />
        <input className="input" placeholder="Search by name, muscle or machine" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {tab === 'curated' ? (
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
              <Link key={e.id} className="list-item" to={`/exercise/${encodeURIComponent(e.id)}`}>
                <ExerciseThumb exercise={e} />
                <div className="grow">
                  <div className="title">{e.name}</div>
                  <div className="meta truncate">
                    {e.equipment ?? CATEGORY_LABELS[e.category]} · {e.muscles.slice(0, 3).join(', ')}
                  </div>
                </div>
                <Icon name="chevronRight" className="muted" />
              </Link>
            ))}
            {!curated.length && <div className="empty">No matches. Try the full library.</div>}
          </div>
        </>
      ) : (
        <>
          <div className="chips">
            <button className={`chip ${!equipment ? 'active' : ''}`} onClick={() => setEquipment(null)}>
              Any equipment
            </button>
            {EQUIPMENT.map((q) => (
              <button key={q} className={`chip ${equipment === q ? 'active' : ''}`} onClick={() => setEquipment(q)}>
                {q}
              </button>
            ))}
          </div>
          <div className="card flush list">
            {fedb.error && <div className="empty">Couldn’t load the library ({fedb.error}). It needs a connection the first time.</div>}
            {!fedb.data && !fedb.error && <div className="empty">Loading library…</div>}
            {full.map((e) => (
              <Link key={e.id} className="list-item" to={`/exercise/${encodeURIComponent(`fedb:${e.id}`)}`}>
                <div className="thumb">
                  <ThumbPhoto src={fedbImageUrls(e.id)[0]} />
                </div>
                <div className="grow">
                  <div className="title">{e.name}</div>
                  <div className="meta truncate">
                    {e.equipment ?? 'no equipment'} · {e.primaryMuscles.join(', ')}
                  </div>
                </div>
                <Icon name="chevronRight" className="muted" />
              </Link>
            ))}
          </div>
          <p className="tiny muted center">Photos and instructions: Free Exercise DB (public domain).</p>
        </>
      )}
    </div>
  )
}
