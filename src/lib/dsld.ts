import type { SupplementIngredient } from '../db/types'

/**
 * NIH Dietary Supplement Label Database (dsld.od.nih.gov): label data for
 * 200,000+ supplements sold in the US, with every ingredient's amount per serving.
 */
const DSLD = 'https://api.ods.od.nih.gov/dsld/v9'

export interface DsldHit {
  id: string
  name: string
  brand: string
  netContents?: string
  offMarket: boolean
}

export interface DsldLabel {
  id: string
  name: string
  brand?: string
  servingLabel: string
  ingredients: SupplementIngredient[]
}

type Json = Record<string, unknown>
const obj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {})
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : undefined)

export function parseDsldSearch(payload: unknown): DsldHit[] {
  return arr(obj(payload).hits).flatMap((h) => {
    const hit = obj(h)
    const src = obj(hit._source)
    const id = str(hit._id)
    const name = str(src.fullName)
    if (!id || !name) return []
    return [
      {
        id,
        name,
        brand: str(src.brandName) ?? '',
        netContents: str(obj(arr(src.netContents)[0]).display),
        offMarket: Boolean(src.offMarket),
      },
    ]
  })
}

function servingLabel(serving: unknown): string {
  const s = obj(serving)
  const qty = str(s.minQuantity) ?? str(s.quantity)
  const unit = str(s.unit)
  return qty && unit ? `${qty} ${unit}` : '1 serving'
}

/** Flattens ingredient rows (including nested ones such as EPA/DHA under fish oil). */
function ingredientsFrom(rows: unknown[]): SupplementIngredient[] {
  const out: SupplementIngredient[] = []
  for (const r of rows) {
    const row = obj(r)
    const name = str(row.name)
    const qty = obj(arr(row.quantity)[0])
    const amount = Number(qty.quantity)
    const unit = str(qty.unit)
    if (name && unit && Number.isFinite(amount) && amount > 0 && unit !== '%') out.push({ name, amount, unit })
    out.push(...ingredientsFrom(arr(row.nestedRows)))
  }
  return out
}

export function parseDsldLabel(payload: unknown, id: string): DsldLabel | null {
  const p = obj(payload)
  const name = str(p.fullName)
  if (!name) return null
  return {
    id: str(p.id) ?? id,
    name,
    brand: str(p.brandName),
    servingLabel: servingLabel(arr(p.servingSizes)[0]),
    ingredients: ingredientsFrom(arr(p.ingredientRows)),
  }
}

export async function searchSupplements(query: string, signal?: AbortSignal): Promise<DsldHit[]> {
  const res = await fetch(`${DSLD}/search-filter?q=${encodeURIComponent(query)}&size=25`, { signal })
  if (!res.ok) throw new Error(`NIH label database returned ${res.status}`)
  return parseDsldSearch(await res.json())
}

export async function getSupplementLabel(id: string, signal?: AbortSignal): Promise<DsldLabel | null> {
  const res = await fetch(`${DSLD}/label/${encodeURIComponent(id)}`, { signal })
  if (!res.ok) throw new Error(`NIH label database returned ${res.status}`)
  return parseDsldLabel(await res.json(), id)
}
