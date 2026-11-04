import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { ALDI_STAPLES, STAPLE_CATEGORIES } from '../../data/aldi'
import type * as RestaurantData from '../../data/restaurants'
import type { RestaurantGroup } from '../../data/restaurants'
import { db } from '../../db/db'
import { useSettings } from '../../db/settings'
import type { FoodSnapshot } from '../../db/types'
import { KEY_SIGNUP_URL, searchUsda, UsdaLimitError } from '../../lib/fdc'
import { stapleFood } from '../../lib/grocery'
import { searchAldi } from '../../lib/off'
import { GROUP_LABELS, matches, menuFood } from '../../lib/restaurants'
import { fmt } from '../../lib/units'

export function FoodRow({ food, onPick, showStore = true }: { food: FoodSnapshot; onPick: () => void; showStore?: boolean }) {
  return (
    <button className="list-item" onClick={onPick}>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="title">
          {food.name}
          {showStore && food.store === 'Aldi' && (
            <span className="badge" style={{ marginLeft: 6, verticalAlign: 'middle' }}>
              Aldi
            </span>
          )}
        </div>
        <div className="meta truncate">
          {food.brand ? `${food.brand} · ` : ''}
          {food.servingLabel} · {Math.round(food.kcal)} kcal · P {fmt(food.protein, 0)} C {fmt(food.carbs, 0)} F {fmt(food.fat, 0)}
        </div>
      </div>
      <Icon name="plus" className="muted" />
    </button>
  )
}

function FoodList({ title, foods, onPick, max = 40, showStore }: { title?: string; foods: FoodSnapshot[]; onPick: (f: FoodSnapshot) => void; max?: number; showStore?: boolean }) {
  const [all, setAll] = useState(false)
  if (!foods.length) return null
  const shown = all ? foods : foods.slice(0, max)
  return (
    <>
      {title && <h3 className="small muted">{title}</h3>}
      <div className="card flush list">
        {shown.map((f, i) => (
          <FoodRow key={`${f.brand ?? ''}|${f.name}|${f.barcode ?? i}`} food={f} onPick={() => onPick(f)} showStore={showStore} />
        ))}
        {foods.length > shown.length && (
          <button className="list-item" style={{ color: 'var(--accent)', fontWeight: 600 }} onClick={() => setAll(true)}>
            Show all {foods.length}
          </button>
        )}
      </div>
    </>
  )
}

/* ── Aldi ──────────────────────────────────────────────────────────── */

const stapleFoods = ALDI_STAPLES.map((s) => ({ staple: s, food: stapleFood(s) }))

export function AldiResults({ query, onPick }: { query: string; onPick: (f: FoodSnapshot) => void }) {
  const q = query.trim()
  const [online, setOnline] = useState<FoodSnapshot[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const mine = useLiveQuery(() => db.foods.filter((f) => f.store === 'Aldi' && f.source !== 'staple').toArray(), []) ?? []
  const [category, setCategory] = useState<string>('all')

  useEffect(() => {
    if (q.length < 3) {
      setOnline([])
      setStatus(null)
      return
    }
    const ctl = new AbortController()
    const t = setTimeout(() => {
      setStatus('Searching Aldi products on Open Food Facts…')
      searchAldi(q, ctl.signal)
        .then((r) => {
          setOnline(r)
          setStatus(r.length ? null : 'No Aldi products found online. Try a simpler word, or scan the barcode.')
        })
        .catch((e: unknown) => {
          if (!ctl.signal.aborted) setStatus(`Online search unavailable (${e instanceof Error ? e.message : 'offline'}).`)
        })
    }, 550)
    return () => {
      clearTimeout(t)
      ctl.abort()
    }
  }, [q])

  const staples = stapleFoods.filter((s) => (q ? matches(q, s.food.name, s.food.brand) : category === 'all' || s.staple.category === category)).map((s) => s.food)
  const myMatches = q ? mine.filter((f) => matches(q, f.name, f.brand)) : mine

  return (
    <>
      {!q && (
        <div className="chips">
          {['all', ...STAPLE_CATEGORIES].map((c) => (
            <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {c === 'all' ? 'All staples' : c}
            </button>
          ))}
        </div>
      )}
      <FoodList title="Your Aldi foods" foods={myMatches} onPick={onPick} max={8} showStore={false} />
      <FoodList title="Aldi staples" foods={staples} onPick={onPick} max={q ? 12 : 60} showStore={false} />
      {!q && <p className="tiny muted">Staple nutrition is USDA data for the plain food, so a specific package can differ a little. For an exact label, search a product name or scan its barcode.</p>}
      {q.length >= 3 && (
        <>
          <h3 className="small muted">Aldi products (Open Food Facts)</h3>
          {status && <p className="small muted">{status}</p>}
          <FoodList foods={online} onPick={onPick} max={30} showStore={false} />
        </>
      )}
      {q.length > 0 && q.length < 3 && <p className="small muted">Type 3 letters or more to search Aldi’s packaged products too.</p>}
    </>
  )
}

/* ── Restaurants ───────────────────────────────────────────────────── */

const GROUPS = Object.keys(GROUP_LABELS) as RestaurantGroup[]

export function RestaurantResults({ query, onPick, onSaveOwn }: { query: string; onPick: (f: FoodSnapshot) => void; onSaveOwn: () => void }) {
  const q = query.trim()
  const [data, setData] = useState<typeof RestaurantData | null>(null)
  const [error, setError] = useState(false)
  const [group, setGroup] = useState<RestaurantGroup | 'all'>('all')
  const [chain, setChain] = useState<string | null>(null)
  const mine = useLiveQuery(() => db.foods.filter((f) => f.source === 'restaurant').toArray(), []) ?? []

  useEffect(() => {
    import('../../data/restaurants').then(setData, () => setError(true))
  }, [])

  const chains = useMemo(() => (data ? data.CHAINS.filter((c) => group === 'all' || c.group === group) : []), [data, group])
  const items = useMemo(() => {
    if (!data) return []
    const allowed = new Set(chains.map((c) => c.name))
    return data.MENU.filter((r) => {
      const c = data.CHAINS[r[0]]
      if (!allowed.has(c.name) || (chain && c.name !== chain)) return false
      return !q || matches(q, c.name, r[1])
    }).map((r) => menuFood(data.CHAINS[r[0]], r))
  }, [data, chains, chain, q])
  const myMatches = (q ? mine.filter((f) => matches(q, f.name, f.brand)) : mine).sort((a, b) => b.lastUsed - a.lastUsed)
  const sources = new Set(items.map((f) => f.sourceNote))

  return (
    <>
      <div className="chips" role="tablist" aria-label="Restaurant type">
        {(['all', ...GROUPS] as const).map((g) => (
          <button
            key={g}
            className={`chip ${group === g ? 'active' : ''}`}
            onClick={() => {
              setGroup(g)
              setChain(null)
            }}
          >
            {g === 'all' ? 'All' : GROUP_LABELS[g]}
          </button>
        ))}
      </div>
      {!q && group !== 'all' && (
        <div className="chips" aria-label="Restaurant">
          {chains.map((c) => (
            <button key={c.name} className={`chip ${chain === c.name ? 'active' : ''}`} onClick={() => setChain(chain === c.name ? null : c.name)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <FoodList title="Your restaurant foods" foods={myMatches} onPick={onPick} max={6} />
      {error && <p className="small status warning">Couldn’t load the restaurant list. Check your connection once so the app can cache it.</p>}
      {!data && !error && <p className="small muted">Loading menus…</p>}
      {data && (
        <>
          <FoodList title={chain ?? 'Menu items'} foods={items} onPick={onPick} max={q ? 40 : 30} />
          {!items.length && <p className="small muted">No built-in match. Try USDA search, or save it from the restaurant’s own nutrition page.</p>}
          {sources.size > 0 && (
            <p className="tiny muted">
              {sources.has('2018 menu data') && 'Fast-food chains use their published 2018 menu numbers. '}
              {sources.has('USDA lab analysis, 2006–2013') && 'Sit-down chains, KFC, Popeyes, Wendy’s and pizza come from USDA lab tests (2006–2013). '}
              Recipes and portions change, so treat these as close estimates.
            </p>
          )}
        </>
      )}
      <div className="callout">
        <Icon name="info" />
        <div className="small">
          <strong>Chipotle, Qdoba, Cava, Olive Garden or anywhere else?</strong> Build your order in the restaurant’s online nutrition calculator, then save the totals here once. It stays in your list.
          <div style={{ marginTop: 8 }}>
            <button className="btn sm" onClick={onSaveOwn}>
              Save a restaurant meal
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── USDA FoodData Central ─────────────────────────────────────────── */

export function UsdaResults({ query, onPick }: { query: string; onPick: (f: FoodSnapshot) => void }) {
  const settings = useSettings()
  const q = query.trim()
  const [results, setResults] = useState<FoodSnapshot[]>([])
  const [searched, setSearched] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [limit, setLimit] = useState(false)
  const ownKey = !!settings.usdaApiKey?.trim()

  const run = async () => {
    setStatus('Searching USDA FoodData Central…')
    setLimit(false)
    try {
      const r = await searchUsda(q, settings.usdaApiKey)
      setResults(r)
      setSearched(q)
      setStatus(r.length ? null : 'No USDA matches. Try fewer or simpler words.')
    } catch (e) {
      setLimit(e instanceof UsdaLimitError)
      setStatus(e instanceof Error ? e.message : 'USDA search is unavailable right now.')
    }
  }

  return (
    <>
      <button className="btn primary" disabled={q.length < 2} onClick={() => void run()}>
        <Icon name="search" size={18} /> {q.length < 2 ? 'Type a food to search USDA' : `Search USDA for “${q}”`}
      </button>
      <p className="tiny muted">
        USDA FoodData Central covers whole foods, generic dishes and many brand-name labels.{' '}
        {ownKey ? (
          'Using your API key.'
        ) : (
          <>
            Using the shared demo key (about 30 searches an hour). <Link to="/settings">Add your own free key</Link> for more.
          </>
        )}
      </p>
      {status && <p className={`small ${limit ? 'status warning' : 'muted'}`}>{status}</p>}
      {limit && !ownKey && (
        <p className="small">
          <a href={KEY_SIGNUP_URL} target="_blank" rel="noreferrer">
            Get a free key <Icon name="external" size={14} />
          </a>{' '}
          then paste it in Settings → Nutrition.
        </p>
      )}
      {searched && results.length > 0 && <FoodList title={`USDA results for “${searched}”`} foods={results} onPick={onPick} max={30} />}
      {results.some((f) => f.servingLabel === '100 g') && <p className="tiny muted">Generic USDA foods are listed per 100 g. Switch to Grams when you add one.</p>}
    </>
  )
}
