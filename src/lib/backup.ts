import { db, TABLE_NAMES } from '../db/db'

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(b)
  })

const dataUrlToBlob = async (url: string) => (await fetch(url)).blob()

/** Every table as JSON. Photos are embedded as data URLs. */
export async function exportBackup(): Promise<string> {
  const tables: Record<string, unknown[]> = {}
  for (const name of TABLE_NAMES) {
    const rows = await db.table(name).toArray()
    tables[name] =
      name === 'exerciseNotes'
        ? await Promise.all(rows.map(async (r) => ({ ...r, photo: r.photo ? await blobToDataUrl(r.photo) : null })))
        : rows
  }
  return JSON.stringify({ app: 'getlifted', version: 1, exportedAt: new Date().toISOString(), tables })
}

/** Replaces all data with a backup made by exportBackup. */
export async function importBackup(json: string): Promise<void> {
  const parsed = JSON.parse(json) as { app?: string; tables?: Record<string, unknown[]> }
  if (parsed.app !== 'getlifted' || !parsed.tables) throw new Error('This file isn’t a Get Lifted backup.')
  const tables = parsed.tables
  const notes = await Promise.all(
    ((tables.exerciseNotes ?? []) as { photo?: string | null }[]).map(async (r) => ({ ...r, photo: r.photo ? await dataUrlToBlob(r.photo) : null })),
  )
  await db.transaction('rw', TABLE_NAMES.map((n) => db.table(n)), async () => {
    for (const name of TABLE_NAMES) {
      await db.table(name).clear()
      const rows = name === 'exerciseNotes' ? notes : (tables[name] ?? [])
      if (rows.length) await db.table(name).bulkAdd(rows)
    }
  })
}

export async function resetAll(): Promise<void> {
  await db.transaction('rw', TABLE_NAMES.map((n) => db.table(n)), async () => {
    for (const name of TABLE_NAMES) await db.table(name).clear()
  })
}
