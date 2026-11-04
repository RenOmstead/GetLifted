import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { NumInput } from '../../components/NumInput'
import { confirmAction, Sheet } from '../../components/Sheet'
import { STAPLE_CATEGORIES } from '../../data/aldi'
import { BUILTIN_RECIPES, type RecipeTag } from '../../data/recipes'
import { db } from '../../db/db'
import { useSettings } from '../../db/settings'
import type { FoodSnapshot, MealType, Recipe, RecipeIngredient } from '../../db/types'
import { dateKey } from '../../lib/dates'
import { builtinToRecipe, costPerServing, ingredientAmount, money, priceBook, proteinPerDollar, recipeCost, recipeFood, type PriceItem } from '../../lib/grocery'
import { matches } from '../../lib/restaurants'
import { fmt } from '../../lib/units'
import { extraNutrients, MEAL_LABELS } from './AddFoodSheet'

interface RecipeEntry {
  key: string
  recipe: Recipe
  tags: RecipeTag[]
  minutes?: number
  builtin: boolean
}

const BUILTINS: RecipeEntry[] = BUILTIN_RECIPES.map((b) => ({ key: `b:${b.id}`, recipe: builtinToRecipe(b), tags: b.tags, minutes: b.minutes, builtin: true }))
const TAGS: (RecipeTag | 'all' | 'mine')[] = ['all', 'breakfast', 'lunch', 'dinner', 'trail', 'meal prep', 'vegetarian', 'mine']
const TAG_LABEL = (t: string) => (t === 'all' ? 'All' : t === 'mine' ? 'Yours' : t[0].toUpperCase() + t.slice(1))

function usePriceBook() {
  const saved = useLiveQuery(() => db.prices.toArray(), [])
  return useMemo(() => {
    const items = priceBook(saved ?? [])
    return { items, byId: new Map(items.map((i) => [i.id, i])) }
  }, [saved])
}

export default function RecipesTab() {
  const [view, setView] = useState<'recipes' | 'prices'>('recipes')
  return (
    <>
      <div className="segmented">
        <button className={view === 'recipes' ? 'active' : ''} onClick={() => setView('recipes')}>
          Recipes
        </button>
        <button className={view === 'prices' ? 'active' : ''} onClick={() => setView('prices')}>
          Aldi prices
        </button>
      </div>
      {view === 'recipes' ? <RecipeList /> : <PriceList />}
    </>
  )
}

/* ── Recipes ───────────────────────────────────────────────────────── */

function RecipeList() {
  const { byId } = usePriceBook()
  const mine = useLiveQuery(() => db.recipes.toArray(), []) ?? []
  const [tag, setTag] = useState<(typeof TAGS)[number]>('all')
  const [sort, setSort] = useState<'suggested' | 'cost' | 'protein'>('suggested')
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [editing, setEditing] = useState<Recipe | null>(null)

  const entries: RecipeEntry[] = [...mine.map((r) => ({ key: `m:${r.id}`, recipe: r, tags: [] as RecipeTag[], builtin: false })), ...BUILTINS]
  const rows = entries
    .filter((e) => tag === 'all' || (tag === 'mine' ? !e.builtin : e.tags.includes(tag)))
    .map((e) => {
      const cost = recipeCost(e.recipe, e.recipe.servings, byId)
      const food = recipeFood(e.recipe)
      return { e, cost, food, ppd: cost.perServing > 0 ? food.protein / cost.perServing : 0 }
    })
  if (sort === 'cost') rows.sort((a, b) => a.cost.perServing - b.cost.perServing)
  if (sort === 'protein') rows.sort((a, b) => b.ppd - a.ppd)
  const open = entries.find((e) => e.key === openKey) ?? null

  return (
    <>
      <div className="callout">
        <Icon name="info" />
        <div className="small">
          Costs use Aldi prices. Aldi doesn’t publish a price feed, so prices marked <strong>~</strong> are rough starter estimates. Enter what you paid under <em>Aldi prices</em> and every recipe updates.
        </div>
      </div>
      <div className="chips" role="tablist" aria-label="Recipe type">
        {TAGS.map((t) => (
          <button key={t} className={`chip ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>
            {TAG_LABEL(t)}
          </button>
        ))}
      </div>
      <div className="row-between">
        <label className="row small" style={{ gap: 6 }}>
          Sort
          <select className="input" style={{ width: 'auto', minHeight: 36 }} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="suggested">Suggested</option>
            <option value="cost">Cheapest per serving</option>
            <option value="protein">Most protein per $</option>
          </select>
        </label>
        <button className="btn sm" onClick={() => setEditing({ name: '', servings: 4, ingredients: [], steps: [], createdAt: Date.now() })}>
          <Icon name="plus" size={16} /> New recipe
        </button>
      </div>
      {rows.length ? (
        <div className="card flush list">
          {rows.map(({ e, cost, food }) => (
            <button key={e.key} className="list-item" onClick={() => setOpenKey(e.key)}>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="title">{e.recipe.name}</div>
                <div className="meta">
                  {e.recipe.servings} serving{e.recipe.servings > 1 ? 's' : ''}
                  {e.minutes ? ` · ${e.minutes} min` : ''} · {Math.round(food.kcal)} kcal · {Math.round(food.protein)} g protein
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="cost-tag num">{money(cost.perServing, cost.estimates > 0)}</div>
                <div className="tiny muted">per serving</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="empty small">{tag === 'mine' ? 'Recipes you create or copy show up here.' : 'No recipes with that tag yet.'}</p>
      )}
      {open && <RecipeSheet entry={open} onClose={() => setOpenKey(null)} onEdit={(r) => setEditing(r)} />}
      {editing && (
        <RecipeEditor
          recipe={editing}
          onClose={() => setEditing(null)}
          onSaved={(id) => {
            setEditing(null)
            setOpenKey(`m:${id}`)
          }}
        />
      )}
    </>
  )
}

const mealForNow = (): MealType => {
  const h = new Date().getHours()
  return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'snack'
}

function RecipeSheet({ entry, onClose, onEdit }: { entry: RecipeEntry; onClose: () => void; onEdit: (r: Recipe) => void }) {
  const settings = useSettings()
  const imperial = settings.units === 'imperial'
  const { byId } = usePriceBook()
  const r = entry.recipe
  const [servings, setServings] = useState(r.servings)
  const [meal, setMeal] = useState<MealType>(mealForNow())
  const [logged, setLogged] = useState<string | null>(null)
  const [pricing, setPricing] = useState<PriceItem | null>(null)
  const cost = recipeCost(r, servings, byId)
  const food = recipeFood(r)
  const scale = servings / r.servings
  const ppd = cost.perServing > 0 ? food.protein / cost.perServing : 0
  const est = cost.estimates > 0

  const log = async () => {
    await db.meals.add({ date: dateKey(), meal, food, servings: 1, createdAt: Date.now() })
    setLogged(`Added 1 serving to today’s ${MEAL_LABELS[meal].toLowerCase()}.`)
  }

  return (
    <Sheet open onClose={onClose} title={r.name}>
      <div className="stack">
        {r.notes && <p className="small text-2">{r.notes}</p>}

        <div className="card tight stack-sm">
          <div className="row-between">
            <strong className="small">How many servings do you need?</strong>
            <div className="stepper">
              <button className="icon-btn filled" aria-label="Fewer servings" disabled={servings <= 1} onClick={() => setServings((s) => Math.max(1, s - 1))}>
                <Icon name="minus" />
              </button>
              <span className="value num" aria-live="polite">
                {servings}
              </span>
              <button className="icon-btn filled" aria-label="More servings" onClick={() => setServings((s) => Math.min(40, s + 1))}>
                <Icon name="plus" />
              </button>
            </div>
          </div>
          <div className="grid-3">
            <div className="stat">
              <div className="label">Per serving</div>
              <div className="value cost-tag" style={{ fontSize: '1.3rem' }}>
                {money(cost.perServing, est)}
              </div>
            </div>
            <div className="stat">
              <div className="label">{servings} servings</div>
              <div className="value" style={{ fontSize: '1.3rem' }}>
                {money(cost.total, est)}
              </div>
            </div>
            <div className="stat">
              <div className="label">At checkout</div>
              <div className="value" style={{ fontSize: '1.3rem' }}>
                {money(cost.checkout, est)}
              </div>
            </div>
          </div>
          <p className="tiny muted" style={{ margin: 0 }}>
            “{servings} servings” is the food that goes in the pot. “At checkout” buys whole packages, so leftovers stay in your pantry.
            {est ? ` ${cost.estimates} of ${cost.lines.length} prices are starter estimates (~).` : ' All prices are yours.'}
            {cost.unpriced.length > 0 && ` No price yet for ${cost.unpriced.join(', ')}.`}
          </p>
        </div>

        <div className="card tight stack-sm">
          <strong className="small">Each serving</strong>
          <div className="row-between small">
            <span>
              {Math.round(food.kcal)} kcal · P {fmt(food.protein, 0)} g · C {fmt(food.carbs, 0)} g · F {fmt(food.fat, 0)} g
            </span>
          </div>
          {extraNutrients(food, 1) && <p className="tiny muted" style={{ margin: 0 }}>{extraNutrients(food, 1)}</p>}
          {ppd > 0 && <p className="tiny muted" style={{ margin: 0 }}>{fmt(ppd, 0)} g of protein per dollar.</p>}
        </div>

        <div className="row">
          <select className="input grow" value={meal} onChange={(e) => setMeal(e.target.value as MealType)} aria-label="Meal">
            {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => (
              <option key={m} value={m}>
                {MEAL_LABELS[m]}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={() => void log()}>
            Log 1 serving today
          </button>
        </div>
        {logged && <p className="small status good">{logged}</p>}

        <h3 className="small muted">Ingredients for {servings}</h3>
        <div className="card flush list">
          {r.ingredients.map((ing, i) => {
            const item = ing.groceryId ? byId.get(ing.groceryId) : undefined
            const amount = ing.servings * scale
            return (
              <button key={i} className="list-item" onClick={() => item && setPricing(item)} disabled={!item}>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="title">{ing.food.name}</div>
                  <div className="meta">
                    {ingredientAmount(ing.food, amount, imperial)}
                    {ing.note && scale === 1 ? ` · ${ing.note}` : ''}
                  </div>
                </div>
                <span className="num small">{item ? money(costPerServing(item) * amount, !item.yours) : 'no price'}</span>
              </button>
            )
          })}
        </div>
        <p className="tiny muted">Salt, pepper and dried spices aren’t counted. Tap an ingredient to enter what you paid.</p>

        {cost.lines.length > 0 && (
          <>
            <h3 className="small muted">Shopping list</h3>
            <div className="card flush list">
              {cost.lines.map((l) => (
                <div key={l.item.id} className="list-item">
                  <div className="grow">
                    <div className="title">
                      {l.packages} × {l.item.packageLabel}
                    </div>
                    <div className="meta">
                      {l.item.name}
                      {l.item.brand ? ` · ${l.item.brand}` : ''}
                    </div>
                  </div>
                  <span className="num small">{money(l.packages * l.item.price, !l.item.yours)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {r.steps.length > 0 && (
          <>
            <h3 className="small muted">Steps</h3>
            <ol className="small" style={{ paddingLeft: 20, margin: 0 }}>
              {r.steps.map((s, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {s}
                </li>
              ))}
            </ol>
          </>
        )}

        <div className="grid-2">
          {entry.builtin ? (
            <button className="btn" onClick={() => onEdit({ ...r, name: `${r.name} (mine)`, createdAt: Date.now() })}>
              <Icon name="edit" size={16} /> Copy and edit
            </button>
          ) : (
            <>
              <button className="btn" onClick={() => onEdit(r)}>
                <Icon name="edit" size={16} /> Edit
              </button>
              <button
                className="btn danger ghost"
                onClick={() => {
                  if (r.id && confirmAction(`Delete “${r.name}”?`)) {
                    void db.recipes.delete(r.id)
                    onClose()
                  }
                }}
              >
                <Icon name="trash" size={16} /> Delete
              </button>
            </>
          )}
        </div>
      </div>
      {pricing && <PriceSheet item={pricing} onClose={() => setPricing(null)} />}
    </Sheet>
  )
}

/* ── Recipe editor ─────────────────────────────────────────────────── */

function RecipeEditor({ recipe, onClose, onSaved }: { recipe: Recipe; onClose: () => void; onSaved: (id: number) => void }) {
  const [name, setName] = useState(recipe.name)
  const [servings, setServings] = useState<number | null>(recipe.servings)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(recipe.ingredients)
  const [steps, setSteps] = useState(recipe.steps.join('\n'))
  const [picking, setPicking] = useState(false)

  const save = async () => {
    const r: Recipe = {
      ...recipe,
      name: name.trim() || 'My recipe',
      servings: Math.max(1, Math.round(servings ?? 1)),
      ingredients: ingredients.filter((i) => i.servings > 0),
      steps: steps
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    }
    const id = await db.recipes.put(r)
    onSaved(id as number)
  }

  return (
    <Sheet open onClose={onClose} title={recipe.id ? 'Edit recipe' : 'New recipe'}>
      <div className="stack">
        <label className="field">
          <span>Name</span>
          <input value={name} placeholder="e.g. Sunday chili" onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Servings it makes</span>
          <NumInput value={servings} digits={0} onChange={setServings} />
        </label>
        <h3 className="small muted">Ingredients (amount in servings of each item)</h3>
        <div className="card flush list">
          {ingredients.map((ing, i) => (
            <div key={i} className="list-item">
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="title truncate">{ing.food.name}</div>
                <div className="meta truncate">1 serving = {ing.food.servingLabel}</div>
              </div>
              <NumInput
                className="input center"
                style={{ width: 72 }}
                aria-label={`Servings of ${ing.food.name}`}
                value={ing.servings}
                onChange={(v) => setIngredients(ingredients.map((x, j) => (j === i ? { ...x, servings: v ?? 0 } : x)))}
              />
              <button className="icon-btn" aria-label={`Remove ${ing.food.name}`} onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}>
                <Icon name="x" size={18} />
              </button>
            </div>
          ))}
          <button className="list-item" style={{ color: 'var(--accent)', fontWeight: 600 }} onClick={() => setPicking(true)}>
            <Icon name="plus" size={18} /> Add ingredient
          </button>
        </div>
        <label className="field">
          <span>Steps (one per line)</span>
          <textarea rows={5} value={steps} onChange={(e) => setSteps(e.target.value)} />
        </label>
        <div className="grid-2">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={!ingredients.length} onClick={() => void save()}>
            Save recipe
          </button>
        </div>
      </div>
      {picking && (
        <IngredientPicker
          onClose={() => setPicking(false)}
          onPick={(ing) => {
            setIngredients([...ingredients, ing])
            setPicking(false)
          }}
        />
      )}
    </Sheet>
  )
}

function IngredientPicker({ onClose, onPick }: { onClose: () => void; onPick: (i: RecipeIngredient) => void }) {
  const { items } = usePriceBook()
  const myFoods = useLiveQuery(() => db.foods.orderBy('lastUsed').reverse().limit(150).toArray(), []) ?? []
  const [q, setQ] = useState('')
  const priced = items.filter((i) => !q || matches(q, i.name, i.brand))
  const pricedNames = new Set(items.map((i) => i.food.name))
  const foods = myFoods.filter((f) => f.source !== 'recipe' && !pricedNames.has(f.name) && (!q || matches(q, f.name, f.brand)))
  const pick = (food: FoodSnapshot, groceryId?: string) => onPick({ food, servings: 1, ...(groceryId ? { groceryId } : {}) })
  return (
    <Sheet open onClose={onClose} title="Add ingredient">
      <div className="stack">
        <label className="search">
          <Icon name="search" size={18} />
          <input className="input" autoFocus placeholder="Search Aldi staples and your foods" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <h3 className="small muted">With a price</h3>
        <div className="card flush list">
          {priced.slice(0, q ? 30 : 60).map((i) => (
            <button key={i.id} className="list-item" onClick={() => pick(i.food, i.id)}>
              <div className="grow">
                <div className="title">{i.name}</div>
                <div className="meta">
                  {i.food.servingLabel} · {money(costPerServing(i), !i.yours)} a serving
                </div>
              </div>
              <Icon name="plus" className="muted" />
            </button>
          ))}
        </div>
        {foods.length > 0 && (
          <>
            <h3 className="small muted">Your foods (no price yet)</h3>
            <div className="card flush list">
              {foods.slice(0, 30).map((f) => (
                <button key={f.id} className="list-item" onClick={() => pick(f)}>
                  <div className="grow">
                    <div className="title">{f.name}</div>
                    <div className="meta">{f.servingLabel}</div>
                  </div>
                  <Icon name="plus" className="muted" />
                </button>
              ))}
            </div>
            <p className="tiny muted">To price one of your foods, add it under Aldi prices → Add your own item.</p>
          </>
        )}
      </div>
    </Sheet>
  )
}

/* ── Price book ────────────────────────────────────────────────────── */

function PriceList() {
  const { items } = usePriceBook()
  const myFoods = useLiveQuery(() => db.foods.orderBy('lastUsed').reverse().limit(150).toArray(), []) ?? []
  const [sort, setSort] = useState<'aisle' | 'protein' | 'cost'>('aisle')
  const [editing, setEditing] = useState<PriceItem | null>(null)
  const [adding, setAdding] = useState(false)
  const yours = items.filter((i) => i.yours).length

  // Protein per $ only ranks protein foods, so cheap pasta and rice don't top the list.
  const proteinFood = (i: PriceItem) => i.food.kcal > 0 && (i.food.protein * 4) / i.food.kcal >= 0.2
  const sorted = sort === 'protein' ? items.filter(proteinFood) : [...items]
  if (sort === 'protein') sorted.sort((a, b) => (proteinPerDollar(b) ?? 0) - (proteinPerDollar(a) ?? 0))
  if (sort === 'cost') sorted.sort((a, b) => costPerServing(a) - costPerServing(b))
  const groups = sort === 'aisle' ? [...STAPLE_CATEGORIES, 'Your items' as const].map((c) => [c, sorted.filter((i) => i.category === c)] as const).filter(([, l]) => l.length) : [['', sorted] as const]

  return (
    <>
      <div className="callout">
        <Icon name="info" />
        <div className="small">
          <strong>{yours ? `${yours} price${yours > 1 ? 's are' : ' is'} yours.` : 'All prices are starter estimates.'}</strong> Aldi prices vary by store and week and there’s no live feed, so <strong>~</strong> marks a rough estimate. Tap an
          item and enter your receipt price; it’s marked ✓ and used everywhere.
        </div>
      </div>
      <div className="chips" role="tablist" aria-label="Sort prices">
        {(
          [
            ['aisle', 'By aisle'],
            ['protein', 'Protein per $'],
            ['cost', 'Cheapest per serving'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} className={`chip ${sort === id ? 'active' : ''}`} onClick={() => setSort(id)}>
            {label}
          </button>
        ))}
      </div>
      {groups.map(([title, list]) => (
        <div key={title || 'all'} className="stack-sm">
          {title && <h3 className="small muted">{title}</h3>}
          <div className="card flush list">
            {list.map((i) => {
              const ppd = proteinPerDollar(i)
              return (
                <button key={i.id} className="list-item" onClick={() => setEditing(i)}>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="title">{i.name}</div>
                    <div className="meta truncate">
                      {i.brand ? `${i.brand} · ` : ''}
                      {i.packageLabel}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num" style={{ whiteSpace: 'nowrap' }}>
                      {i.yours && <Icon name="check" size={13} />} {money(i.price, !i.yours)}
                    </div>
                    <div className="tiny muted">
                      {money(costPerServing(i))}/serving{sort === 'protein' && ppd ? ` · ${fmt(ppd, 0)} g protein/$` : ''}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <button className="btn" onClick={() => setAdding(true)}>
        <Icon name="plus" size={16} /> Add your own item
      </button>
      <p className="tiny muted">
        Protein per $ = grams of protein one dollar buys.{sort === 'protein' ? ' Only foods where protein is at least 20% of the calories are ranked, so cheap pasta and rice don’t crowd out the protein foods.' : ''}
      </p>
      {editing && <PriceSheet item={editing} onClose={() => setEditing(null)} />}
      {adding && (
        <Sheet open onClose={() => setAdding(false)} title="Price one of your foods">
          <div className="stack">
            <p className="small muted">Pick a food you’ve logged (scan or search it in Add food first), then enter its price.</p>
            <div className="card flush list">
              {myFoods
                .filter((f) => f.source !== 'staple' && f.source !== 'recipe')
                .slice(0, 40)
                .map((f) => (
                  <button
                    key={f.id}
                    className="list-item"
                    onClick={() => {
                      setAdding(false)
                      const { id: _id, lastUsed: _lastUsed, ...food } = f
                      setEditing({ id: `g:${Date.now()}`, name: f.name, brand: f.brand, store: f.store ?? 'Aldi', category: 'Your items', food, packageLabel: '1 package', packageServings: 1, price: 0, yours: true })
                    }}
                  >
                    <div className="grow">
                      <div className="title">{f.name}</div>
                      <div className="meta">{f.brand ?? f.servingLabel}</div>
                    </div>
                    <Icon name="plus" className="muted" />
                  </button>
                ))}
            </div>
          </div>
        </Sheet>
      )}
    </>
  )
}

function PriceSheet({ item, onClose }: { item: PriceItem; onClose: () => void }) {
  const [price, setPrice] = useState<number | null>(item.price || null)
  const [servings, setServings] = useState<number | null>(item.packageServings)
  const [label, setLabel] = useState(item.packageLabel)
  const [store, setStore] = useState(item.store)
  const per = price && servings ? price / servings : null

  const save = async () => {
    if (!price || !servings) return
    await db.prices.put({ id: item.id, name: item.name, store: store.trim() || 'Aldi', food: item.food, packageLabel: label.trim() || '1 package', packageServings: servings, price, updatedAt: Date.now() })
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={item.name}>
      <div className="stack">
        <p className="small muted">
          1 serving = {item.food.servingLabel} · {Math.round(item.food.kcal)} kcal · {fmt(item.food.protein, 0)} g protein
        </p>
        {item.staple && !item.yours && <p className="small status info">Starter estimate: {money(item.staple.estPrice)} for {item.staple.packageLabel.toLowerCase()}. Not a live price.</p>}
        <label className="field">
          <span>What you paid for one package ($)</span>
          <NumInput value={price} onChange={setPrice} autoFocus />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Package</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} />
          </label>
          <label className="field">
            <span>Servings in it</span>
            <NumInput value={servings} digits={1} onChange={setServings} />
          </label>
        </div>
        {!item.staple && (
          <label className="field">
            <span>Store</span>
            <input value={store} onChange={(e) => setStore(e.target.value)} />
          </label>
        )}
        {per != null && (
          <p className="small">
            {money(per)} a serving
            {item.food.protein > 0 ? ` · ${fmt(item.food.protein / per, 0)} g protein per dollar` : ''}
          </p>
        )}
        <div className="grid-2">
          {item.yours && item.staple ? (
            <button
              className="btn ghost"
              onClick={() => {
                void db.prices.delete(item.id)
                onClose()
              }}
            >
              Use the estimate
            </button>
          ) : item.yours && !item.staple && item.updatedAt ? (
            <button
              className="btn danger ghost"
              onClick={() => {
                void db.prices.delete(item.id)
                onClose()
              }}
            >
              Remove
            </button>
          ) : (
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
          )}
          <button className="btn primary" disabled={!price || !servings} onClick={() => void save()}>
            Save my price
          </button>
        </div>
      </div>
    </Sheet>
  )
}
