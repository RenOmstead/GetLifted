import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { NumInput } from '../../components/NumInput'
import { Sheet } from '../../components/Sheet'
import { COMMON_FOODS } from '../../data/commonFoods'
import { db } from '../../db/db'
import type { FoodSnapshot, MealType } from '../../db/types'
import { lookupBarcode, searchFoods } from '../../lib/off'
import { fmt } from '../../lib/units'

export const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }

const commonSnapshots: FoodSnapshot[] = COMMON_FOODS.map((f) => ({ ...f, source: 'common' }))

function FoodRow({ food, onPick }: { food: FoodSnapshot; onPick: () => void }) {
  return (
    <button className="list-item" onClick={onPick}>
      <div className="grow">
        <div className="title">{food.name}</div>
        <div className="meta truncate">
          {food.brand ? `${food.brand} · ` : ''}
          {food.servingLabel} · {Math.round(food.kcal)} kcal · P {fmt(food.protein, 0)} C {fmt(food.carbs, 0)} F {fmt(food.fat, 0)}
        </div>
      </div>
      <Icon name="plus" className="muted" />
    </button>
  )
}

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats: string[] }) => { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> }
  }
}

/** Scans a barcode with the camera where the browser supports it (Chrome on Android). */
function BarcodeScanner({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode
  useEffect(() => {
    if (!window.BarcodeDetector) return
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false
    const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (s) => {
        stream = s
        if (!video.current || stopped) return
        video.current.srcObject = s
        await video.current.play()
        const tick = async () => {
          if (stopped || !video.current) return
          const codes = await detector.detect(video.current).catch(() => [])
          if (codes[0]?.rawValue) onCodeRef.current(codes[0].rawValue)
          else raf = requestAnimationFrame(() => void tick())
        }
        void tick()
      })
      .catch(() => setError('Camera unavailable. Type the number instead.'))
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])
  if (!window.BarcodeDetector) return <p className="small muted">Camera scanning isn’t supported in this browser. Type the barcode number below.</p>
  return (
    <>
      <video ref={video} playsInline muted style={{ width: '100%', borderRadius: 12, background: '#000', aspectRatio: '4/3', objectFit: 'cover' }} />
      {error && <p className="small status warning">{error}</p>}
    </>
  )
}

interface AddFoodSheetProps {
  open: boolean
  onClose: () => void
  date: string
  meal: MealType
}

export function AddFoodSheet({ open, onClose, date, meal }: AddFoodSheetProps) {
  const [mode, setMode] = useState<'search' | 'quick' | 'barcode'>('search')
  const [query, setQuery] = useState('')
  const [online, setOnline] = useState<FoodSnapshot[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [picked, setPicked] = useState<FoodSnapshot | null>(null)
  const [servings, setServings] = useState<number | null>(1)
  const [grams, setGrams] = useState<number | null>(null)
  const [useGrams, setUseGrams] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [quick, setQuick] = useState({ name: '', kcal: null as number | null, protein: null as number | null, carbs: null as number | null, fat: null as number | null })

  const myFoods = useLiveQuery(() => db.foods.orderBy('lastUsed').reverse().limit(200).toArray(), []) ?? []

  useEffect(() => {
    if (!open) {
      setPicked(null)
      setQuery('')
      setOnline([])
      setMode('search')
      setStatus(null)
    }
  }, [open])

  // Search Open Food Facts after a short pause in typing.
  useEffect(() => {
    if (mode !== 'search' || query.trim().length < 3) {
      setOnline([])
      return
    }
    const ctl = new AbortController()
    const t = setTimeout(() => {
      setStatus('Searching Open Food Facts…')
      searchFoods(query.trim(), ctl.signal)
        .then((r) => {
          setOnline(r)
          setStatus(r.length ? null : 'No packaged foods found.')
        })
        .catch((e: unknown) => {
          if (!ctl.signal.aborted) setStatus(`Online search unavailable (${e instanceof Error ? e.message : 'offline'}).`)
        })
    }, 550)
    return () => {
      clearTimeout(t)
      ctl.abort()
    }
  }, [query, mode])

  const q = query.trim().toLowerCase()
  const localMine = useMemo(() => (q ? myFoods.filter((f) => `${f.name} ${f.brand ?? ''}`.toLowerCase().includes(q)) : myFoods.slice(0, 12)), [myFoods, q])
  const localCommon = useMemo(() => (q ? commonSnapshots.filter((f) => f.name.toLowerCase().includes(q)) : []), [q])

  const pick = (f: FoodSnapshot) => {
    setPicked(f)
    setServings(1)
    setGrams(f.servingGrams)
    setUseGrams(false)
  }

  const effectiveServings = useGrams && picked?.servingGrams ? (grams ?? 0) / picked.servingGrams : (servings ?? 0)

  const add = async (food: FoodSnapshot, count: number) => {
    if (count <= 0) return
    await db.meals.add({ date, meal, food, servings: count, createdAt: Date.now() })
    const existing = await db.foods.where('name').equals(food.name).filter((f) => (f.brand ?? '') === (food.brand ?? '')).first()
    await db.foods.put({ ...food, id: existing?.id, lastUsed: Date.now() })
    onClose()
  }

  const findBarcode = async (code: string) => {
    setBarcode(code)
    setStatus('Looking up barcode…')
    try {
      const f = await lookupBarcode(code)
      if (f) {
        setStatus(null)
        pick(f)
      } else setStatus('Not found in Open Food Facts. Use Quick add instead.')
    } catch (e) {
      setStatus(`Lookup failed (${e instanceof Error ? e.message : 'offline'}).`)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={picked ? picked.name : `Add to ${MEAL_LABELS[meal]}`}>
      {picked ? (
        <div className="stack">
          <p className="small muted">
            {picked.brand ? `${picked.brand} · ` : ''}1 serving = {picked.servingLabel}
          </p>
          {picked.servingGrams && (
            <div className="segmented">
              <button className={!useGrams ? 'active' : ''} onClick={() => setUseGrams(false)}>
                Servings
              </button>
              <button className={useGrams ? 'active' : ''} onClick={() => setUseGrams(true)}>
                Grams
              </button>
            </div>
          )}
          <div className="row">
            <button className="icon-btn filled" onClick={() => (useGrams ? setGrams((g) => Math.max(0, (g ?? 0) - 10)) : setServings((s) => Math.max(0, (s ?? 0) - 0.5)))} aria-label="Less">
              <Icon name="minus" />
            </button>
            <div className="input-unit grow">
              {useGrams ? (
                <NumInput className="input center" value={grams} digits={0} onChange={setGrams} aria-label="Grams" />
              ) : (
                <NumInput className="input center" value={servings} onChange={setServings} aria-label="Servings" />
              )}
              <span className="unit">{useGrams ? 'g' : '×'}</span>
            </div>
            <button className="icon-btn filled" onClick={() => (useGrams ? setGrams((g) => (g ?? 0) + 10) : setServings((s) => (s ?? 0) + 0.5))} aria-label="More">
              <Icon name="plus" />
            </button>
          </div>
          <div className="grid-2">
            {[
              ['Calories', `${Math.round(picked.kcal * effectiveServings)} kcal`],
              ['Protein', `${fmt(picked.protein * effectiveServings)} g`],
              ['Carbs', `${fmt(picked.carbs * effectiveServings)} g`],
              ['Fat', `${fmt(picked.fat * effectiveServings)} g`],
            ].map(([k, v]) => (
              <div className="card tight stat" key={k}>
                <div className="label">{k}</div>
                <div className="value" style={{ fontSize: '1.1rem' }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
          {picked.micros && Object.keys(picked.micros).length > 0 && <p className="tiny muted">Includes vitamin and mineral data, counted in your Vitamins tab.</p>}
          <div className="grid-2">
            <button className="btn lg" onClick={() => setPicked(null)}>
              Back
            </button>
            <button className="btn primary lg" disabled={effectiveServings <= 0} onClick={() => void add(picked, effectiveServings)}>
              Add
            </button>
          </div>
        </div>
      ) : (
        <div className="stack">
          <div className="segmented">
            <button className={mode === 'search' ? 'active' : ''} onClick={() => setMode('search')}>
              Search
            </button>
            <button className={mode === 'barcode' ? 'active' : ''} onClick={() => setMode('barcode')}>
              Barcode
            </button>
            <button className={mode === 'quick' ? 'active' : ''} onClick={() => setMode('quick')}>
              Quick add
            </button>
          </div>

          {mode === 'search' && (
            <>
              <label className="search">
                <Icon name="search" size={18} />
                <input className="input" autoFocus placeholder="Search foods, e.g. chicken, oats, Quest bar" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
              {localMine.length > 0 && (
                <>
                  <h3 className="small muted">{q ? 'Your foods' : 'Recent'}</h3>
                  <div className="card flush list">
                    {localMine.map((f) => (
                      <FoodRow key={f.id} food={f} onPick={() => pick(f)} />
                    ))}
                  </div>
                </>
              )}
              {(localCommon.length > 0 || !q) && (
                <>
                  <h3 className="small muted">Common foods</h3>
                  <div className="card flush list">
                    {(q ? localCommon : commonSnapshots.slice(0, 8)).map((f) => (
                      <FoodRow key={f.name} food={f} onPick={() => pick(f)} />
                    ))}
                  </div>
                </>
              )}
              {q.length >= 3 && (
                <>
                  <h3 className="small muted">Packaged foods (Open Food Facts)</h3>
                  {status && <p className="small muted">{status}</p>}
                  {online.length > 0 && (
                    <div className="card flush list">
                      {online.map((f, i) => (
                        <FoodRow key={`${f.barcode}-${i}`} food={f} onPick={() => pick(f)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {mode === 'barcode' && (
            <>
              <BarcodeScanner onCode={(c) => void findBarcode(c)} />
              <div className="row">
                <input className="input grow" inputMode="numeric" placeholder="Barcode number" value={barcode} onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ''))} />
                <button className="btn" disabled={barcode.length < 6} onClick={() => void findBarcode(barcode)}>
                  Look up
                </button>
              </div>
              {status && <p className="small muted">{status}</p>}
            </>
          )}

          {mode === 'quick' && (
            <div className="stack">
              <label className="field">
                <span>Name</span>
                <input value={quick.name} placeholder="e.g. Restaurant burrito" onChange={(e) => setQuick({ ...quick, name: e.target.value })} />
              </label>
              <div className="grid-2">
                {(['kcal', 'protein', 'carbs', 'fat'] as const).map((k) => (
                  <label className="field" key={k}>
                    <span>{k === 'kcal' ? 'Calories' : `${k[0].toUpperCase()}${k.slice(1)} (g)`}</span>
                    <NumInput value={quick[k]} onChange={(v) => setQuick({ ...quick, [k]: v })} />
                  </label>
                ))}
              </div>
              <button
                className="btn primary lg"
                disabled={!quick.kcal}
                onClick={() =>
                  void add(
                    {
                      name: quick.name.trim() || 'Quick add',
                      servingLabel: '1 serving',
                      servingGrams: null,
                      kcal: quick.kcal ?? 0,
                      protein: quick.protein ?? 0,
                      carbs: quick.carbs ?? 0,
                      fat: quick.fat ?? 0,
                      source: 'manual',
                    },
                    1,
                  )
                }
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}
