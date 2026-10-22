import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Icon } from '../../components/Icon'
import { NumInput } from '../../components/NumInput'
import { confirmAction } from '../../components/Sheet'
import { NUTRIENTS, type Profile } from '../../data/nutrients'
import { db } from '../../db/db'
import { ageFromSettings, useSettings } from '../../db/settings'
import type { Supplement, SupplementIngredient } from '../../db/types'
import { getSupplementLabel, searchSupplements, type DsldHit } from '../../lib/dsld'
import { evaluateIntake, matchNutrient, normalizeUnit, supplementTotals } from '../../lib/nutrients'
import { NutrientRowView } from './Nutrition'

const UNITS = ['mg', 'mcg', 'g', 'IU']

const blank = (): Supplement => ({ name: '', servingLabel: '1 capsule', dailyServings: 1, ingredients: [], active: true, createdAt: Date.now() })

export default function SupplementEditor() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const settings = useSettings()
  const [s, setS] = useState<Supplement | null>(isNew ? blank() : null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<DsldHit[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(isNew)

  useEffect(() => {
    if (!isNew) void db.supplements.get(Number(id)).then((x) => setS(x ?? null))
  }, [id, isNew])

  if (!s) return <div className="page" />

  const profile: Profile = { age: ageFromSettings(settings), sex: settings.sex, smoker: settings.smoker }
  const preview = supplementTotals([{ supplement: s, servings: s.dailyServings }])
  const rows = evaluateIntake(profile, preview.totals, preview.sources)

  const search = async () => {
    if (query.trim().length < 2) return
    setStatus('Searching the NIH label database…')
    setHits([])
    try {
      const r = await searchSupplements(query.trim())
      setHits(r)
      setStatus(r.length ? null : 'No products found. Try the brand plus product name, or enter it manually below.')
    } catch (e) {
      setStatus(`Couldn’t reach the NIH database (${e instanceof Error ? e.message : 'offline'}). You can enter the label manually below.`)
    }
  }

  const choose = async (hit: DsldHit) => {
    setStatus('Loading label…')
    try {
      const label = await getSupplementLabel(hit.id)
      if (!label) throw new Error('label not found')
      setS({ ...s, name: label.name, brand: label.brand, servingLabel: label.servingLabel, ingredients: label.ingredients, dsldId: label.id })
      setShowSearch(false)
      setStatus(null)
    } catch (e) {
      setStatus(`Couldn’t load that label (${e instanceof Error ? e.message : 'error'}).`)
    }
  }

  const setIng = (i: number, patch: Partial<SupplementIngredient>) => setS({ ...s, ingredients: s.ingredients.map((x, j) => (j === i ? { ...x, ...patch } : x)) })

  const save = async () => {
    await db.supplements.put({ ...s, name: s.name.trim() || 'Supplement' })
    navigate('/nutrition?tab=vitamins', { replace: true })
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="chevronLeft" />
        </button>
        <h1>{isNew ? 'Add supplement' : 'Edit supplement'}</h1>
        {!isNew && (
          <button
            className="icon-btn"
            aria-label="Delete supplement"
            onClick={async () => {
              if (!confirmAction(`Delete ${s.name}?`)) return
              await db.supplements.delete(s.id!)
              navigate('/nutrition?tab=vitamins', { replace: true })
            }}
          >
            <Icon name="trash" />
          </button>
        )}
      </div>

      {showSearch ? (
        <div className="card stack">
          <div className="card-title" style={{ marginBottom: 0 }}>
            <Icon name="search" size={18} /> Find your product
          </div>
          <p className="small muted">Search the NIH Dietary Supplement Label Database (200,000+ US products) to load the exact amounts from the label.</p>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault()
              void search()
            }}
          >
            <input className="input grow" placeholder="e.g. Nature Made Vitamin D3 2000" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="btn primary" type="submit">
              Search
            </button>
          </form>
          {status && <p className="small muted">{status}</p>}
          {hits.length > 0 && (
            <div className="card flush list">
              {hits.map((h) => (
                <button key={h.id} className="list-item" onClick={() => void choose(h)}>
                  <div className="grow">
                    <div className="title">{h.name}</div>
                    <div className="meta">
                      {h.brand}
                      {h.netContents ? ` · ${h.netContents}` : ''}
                      {h.offMarket ? ' · discontinued' : ''}
                    </div>
                  </div>
                  <Icon name="chevronRight" className="muted" />
                </button>
              ))}
            </div>
          )}
          <button className="btn ghost" onClick={() => setShowSearch(false)}>
            Enter manually instead
          </button>
        </div>
      ) : (
        <button className="btn" onClick={() => setShowSearch(true)}>
          <Icon name="search" size={18} /> Search the NIH label database
        </button>
      )}

      <div className="card stack">
        <label className="field">
          <span>Name</span>
          <input value={s.name} placeholder="e.g. Vitamin D3" onChange={(e) => setS({ ...s, name: e.target.value })} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>One serving is</span>
            <input value={s.servingLabel} onChange={(e) => setS({ ...s, servingLabel: e.target.value })} />
          </label>
          <label className="field">
            <span>Servings per day</span>
            <NumInput value={s.dailyServings} onChange={(v) => setS({ ...s, dailyServings: v ?? 1 })} />
          </label>
        </div>
        <label className="toggle">
          <span>Currently taking</span>
          <input type="checkbox" checked={s.active} onChange={(e) => setS({ ...s, active: e.target.checked })} />
        </label>
      </div>

      <div className="section-title">
        <h2>Per serving</h2>
      </div>
      <div className="stack-sm">
        {s.ingredients.map((ing, i) => {
          const n = matchNutrient(ing.name)
          const unitOk = normalizeUnit(ing.unit)
          return (
            <div className="card tight stack-sm" key={i}>
              <div className="row">
                <input className="input grow" value={ing.name} onChange={(e) => setIng(i, { name: e.target.value })} aria-label="Ingredient" />
                <button className="icon-btn" onClick={() => setS({ ...s, ingredients: s.ingredients.filter((_, j) => j !== i) })} aria-label="Remove ingredient">
                  <Icon name="x" />
                </button>
              </div>
              <div className="row">
                <NumInput className="input grow" value={ing.amount} onChange={(v) => setIng(i, { amount: v ?? 0 })} aria-label="Amount" />
                <select className="input" style={{ width: 'auto' }} value={UNITS.includes(unitOk ?? '') ? unitOk! : ing.unit} onChange={(e) => setIng(i, { unit: e.target.value })} aria-label="Unit">
                  {!UNITS.includes(unitOk ?? '') && <option value={ing.unit}>{ing.unit}</option>}
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <span className={`tiny ${n ? 'status good' : 'muted'}`}>{n ? `Compared as ${n.name}` : 'Not compared (no reference value)'}</span>
            </div>
          )
        })}
      </div>
      <div className="row wrap">
        <select
          className="input grow"
          value=""
          onChange={(e) => {
            const n = NUTRIENTS.find((x) => x.id === e.target.value)
            if (n) setS({ ...s, ingredients: [...s.ingredients, { name: n.name, amount: 0, unit: n.unit }] })
          }}
          aria-label="Add a nutrient"
        >
          <option value="">+ Add a vitamin, mineral or supplement…</option>
          {NUTRIENTS.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
        <button className="btn" onClick={() => setS({ ...s, ingredients: [...s.ingredients, { name: '', amount: 0, unit: 'mg' }] })}>
          Other
        </button>
      </div>

      {rows.length > 0 && (
        <>
          <div className="section-title">
            <h2>This supplement per day</h2>
          </div>
          <div className="card flush list">
            {rows.map((r) => (
              <NutrientRowView key={r.nutrient.id} row={r} />
            ))}
          </div>
        </>
      )}

      <button className="btn primary lg block" onClick={() => void save()} disabled={!s.name.trim()}>
        <Icon name="check" /> Save
      </button>
    </div>
  )
}
