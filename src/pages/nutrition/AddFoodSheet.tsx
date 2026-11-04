import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { NumInput } from '../../components/NumInput'
import { Sheet } from '../../components/Sheet'
import { COMMON_FOODS } from '../../data/commonFoods'
import { BUILTIN_RECIPES } from '../../data/recipes'
import { db } from '../../db/db'
import type { FoodSnapshot, MealType } from '../../db/types'
import { builtinToRecipe, recipeFood } from '../../lib/grocery'
import { lookupBarcode, searchFoods } from '../../lib/off'
import { matches } from '../../lib/restaurants'
import { fmt } from '../../lib/units'
import { AldiResults, FoodRow, RestaurantResults, UsdaResults } from './FoodSources'

export const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }

const commonSnapshots: FoodSnapshot[] = COMMON_FOODS.map((f) => ({ ...f, source: 'common' }))
const builtinRecipeFoods = BUILTIN_RECIPES.map((b) => recipeFood(builtinToRecipe(b)))

type Source = 'all' | 'aldi' | 'restaurants' | 'usda'
const SOURCES: [Source, string][] = [
  ['all', 'All'],
  ['aldi', 'Aldi'],
  ['restaurants', 'Restaurants'],
  ['usda', 'USDA'],
]

/** Where a food's numbers come from, shown under it before you add it. */
function sourceText(f: FoodSnapshot): string | null {
  switch (f.source) {
    case 'staple':
      return 'Aldi staple. Nutrition is USDA data for the plain food; your package may differ slightly.'
    case 'restaurant':
      return f.sourceNote ? `${f.brand ? `${f.brand} · ` : ''}${f.sourceNote}. Menus change, so treat it as a close estimate.` : 'Saved from the restaurant’s nutrition info.'
    case 'usda':
      return `${f.sourceNote ?? 'USDA FoodData Central'}.`
    case 'off':
      return `Open Food Facts label data${f.store === 'Aldi' ? ' · sold at Aldi' : ''}.`
    case 'recipe':
      return 'One serving of the recipe.'
    case 'common':
      return 'USDA values.'
    default:
      return null
  }
}

/** Fiber, sugar, saturated fat and sodium for an amount, where the food has them. */
export function extraNutrients(f: FoodSnapshot, k: number): string {
  const parts: string[] = []
  if (f.fiber != null) parts.push(`Fiber ${fmt(f.fiber * k)} g`)
  if (f.addedSugar != null) parts.push(`Added sugars ${fmt(f.addedSugar * k)} g`)
  else if (f.sugar != null) parts.push(`Sugars ${fmt(f.sugar * k)} g`)
  if (f.satFat != null) parts.push(`Sat fat ${fmt(f.satFat * k)} g`)
  if (f.micros?.sodium != null) parts.push(`Sodium ${Math.round(f.micros.sodium * k)} mg`)
  return parts.join(' · ')
}

type QuickField = 'kcal' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar' | 'satFat' | 'sodium'
const QUICK_LABELS: Record<QuickField, string> = {
  kcal: 'Calories',
  protein: 'Protein (g)',
  carbs: 'Carbs (g)',
  fat: 'Fat (g)',
  fiber: 'Fiber (g)',
  sugar: 'Sugars (g)',
  satFat: 'Saturated fat (g)',
  sodium: 'Sodium (mg)',
}
const emptyQuick = () => ({ name: '', brand: '', values: {} as Partial<Record<QuickField, number | null>> })

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
  const [source, setSource] = useState<Source>('all')
  const [restaurantForm, setRestaurantForm] = useState(false)
  const [query, setQuery] = useState('')
  const [online, setOnline] = useState<FoodSnapshot[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [picked, setPicked] = useState<FoodSnapshot | null>(null)
  const [servings, setServings] = useState<number | null>(1)
  const [grams, setGrams] = useState<number | null>(null)
  const [useGrams, setUseGrams] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [quick, setQuick] = useState(emptyQuick)

  const myFoods = useLiveQuery(() => db.foods.orderBy('lastUsed').reverse().limit(200).toArray(), []) ?? []
  const myRecipes = useLiveQuery(() => db.recipes.toArray(), []) ?? []

  useEffect(() => {
    if (!open) {
      setPicked(null)
      setQuery('')
      setOnline([])
      setMode('search')
      setSource('all')
      setRestaurantForm(false)
      setQuick(emptyQuick())
      setStatus(null)
    }
  }, [open])

  // Search Open Food Facts after a short pause in typing.
  useEffect(() => {
    if (mode !== 'search' || source !== 'all' || query.trim().length < 3) {
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
  }, [query, mode, source])

  const q = query.trim().toLowerCase()
  const localMine = useMemo(() => (q ? myFoods.filter((f) => `${f.name} ${f.brand ?? ''}`.toLowerCase().includes(q)) : myFoods.slice(0, 12)), [myFoods, q])
  const localCommon = useMemo(() => (q ? commonSnapshots.filter((f) => f.name.toLowerCase().includes(q)) : []), [q])
  const localRecipes = useMemo(() => (q ? [...myRecipes.map(recipeFood), ...builtinRecipeFoods].filter((f) => matches(q, f.name)) : []), [myRecipes, q])

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
          {extraNutrients(picked, effectiveServings) && <p className="small text-2">{extraNutrients(picked, effectiveServings)}</p>}
          {sourceText(picked) && <p className="tiny muted">{sourceText(picked)}</p>}
          {picked.micros && Object.keys(picked.micros).some((k) => k !== 'sodium') && <p className="tiny muted">Includes vitamin and mineral data, counted in your Vitamins tab.</p>}
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
            <button
              className={mode === 'quick' ? 'active' : ''}
              onClick={() => {
                setRestaurantForm(false)
                setMode('quick')
              }}
            >
              Quick add
            </button>
          </div>

          {mode === 'search' && (
            <>
              <label className="search">
                <Icon name="search" size={18} />
                <input
                  className="input"
                  autoFocus
                  placeholder={source === 'aldi' ? 'Search Aldi, e.g. Kirkwood chicken, Fit & Active' : source === 'restaurants' ? 'Search menus, e.g. Taco Bell bowl' : 'Search foods, e.g. chicken, oats, Quest bar'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                />
              </label>
              <div className="chips" role="tablist" aria-label="Food source">
                {SOURCES.map(([id, label]) => (
                  <button key={id} role="tab" aria-selected={source === id} className={`chip ${source === id ? 'active' : ''}`} onClick={() => setSource(id)}>
                    {label}
                  </button>
                ))}
              </div>
              {source === 'aldi' && <AldiResults query={query} onPick={pick} />}
              {source === 'restaurants' && (
                <RestaurantResults
                  query={query}
                  onPick={pick}
                  onSaveOwn={() => {
                    setRestaurantForm(true)
                    setMode('quick')
                  }}
                />
              )}
              {source === 'usda' && <UsdaResults query={query} onPick={pick} />}
              {source === 'all' && (
                <>
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
                  {localRecipes.length > 0 && (
                    <>
                      <h3 className="small muted">Recipes (1 serving)</h3>
                      <div className="card flush list">
                        {localRecipes.slice(0, 6).map((f) => (
                          <FoodRow key={f.name} food={f} onPick={() => pick(f)} />
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
                  {!q && <p className="tiny muted">Shop at Aldi or eating out? Tap Aldi or Restaurants above. USDA searches the government food database.</p>}
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
              {restaurantForm && <p className="small muted">Copy the totals from the restaurant’s nutrition page or calculator. It’s saved to your restaurant foods so next time it’s one tap.</p>}
              <label className="field">
                <span>{restaurantForm ? 'Restaurant' : 'Restaurant or brand (optional)'}</span>
                <input value={quick.brand} placeholder={restaurantForm ? 'e.g. Chipotle' : 'e.g. Chipotle, Aldi'} onChange={(e) => setQuick({ ...quick, brand: e.target.value })} />
              </label>
              <label className="field">
                <span>{restaurantForm ? 'What you ordered' : 'Name'}</span>
                <input value={quick.name} placeholder={restaurantForm ? 'e.g. Chicken burrito bowl' : 'e.g. Restaurant burrito'} onChange={(e) => setQuick({ ...quick, name: e.target.value })} />
              </label>
              <div className="grid-2">
                {(['kcal', 'protein', 'carbs', 'fat'] as const).map((k) => (
                  <label className="field" key={k}>
                    <span>{QUICK_LABELS[k]}</span>
                    <NumInput value={quick.values[k]} onChange={(v) => setQuick({ ...quick, values: { ...quick.values, [k]: v } })} />
                  </label>
                ))}
              </div>
              <details open={restaurantForm}>
                <summary className="small muted">Fiber, sugar, saturated fat and sodium (optional)</summary>
                <div className="grid-2" style={{ marginTop: 8 }}>
                  {(['fiber', 'sugar', 'satFat', 'sodium'] as const).map((k) => (
                    <label className="field" key={k}>
                      <span>{QUICK_LABELS[k]}</span>
                      <NumInput value={quick.values[k]} onChange={(v) => setQuick({ ...quick, values: { ...quick.values, [k]: v } })} />
                    </label>
                  ))}
                </div>
              </details>
              <button
                className="btn primary lg"
                disabled={!quick.values.kcal || (restaurantForm && !quick.brand.trim())}
                onClick={() => {
                  const v = quick.values
                  const brand = quick.brand.trim()
                  const isRestaurant = restaurantForm
                  void add(
                    {
                      name: quick.name.trim() || (isRestaurant ? `${brand} meal` : 'Quick add'),
                      ...(brand ? { brand } : {}),
                      servingLabel: '1 serving',
                      servingGrams: null,
                      kcal: v.kcal ?? 0,
                      protein: v.protein ?? 0,
                      carbs: v.carbs ?? 0,
                      fat: v.fat ?? 0,
                      ...(v.fiber != null ? { fiber: v.fiber } : {}),
                      ...(v.sugar != null ? { sugar: v.sugar } : {}),
                      ...(v.satFat != null ? { satFat: v.satFat } : {}),
                      micros: v.sodium != null ? { sodium: v.sodium } : {},
                      source: isRestaurant ? 'restaurant' : 'manual',
                      ...(isRestaurant ? { sourceNote: 'From the restaurant’s nutrition info' } : {}),
                      ...(/^aldi$/i.test(brand) ? { store: 'Aldi' } : {}),
                    },
                    1,
                  )
                }}
              >
                {restaurantForm ? 'Save and add' : 'Add'}
              </button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}
