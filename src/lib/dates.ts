const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar day as YYYY-MM-DD. */
export function dateKey(d: Date | number = new Date()): string {
  const date = typeof d === 'number' ? new Date(d) : d
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Local midnight of a YYYY-MM-DD key. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + days)
  return dateKey(d)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDateKey(b).getTime() - parseDateKey(a).getTime()) / 86_400_000)
}

export function formatDayLabel(key: string, today = dateKey()): string {
  if (key === today) return 'Today'
  if (key === addDays(today, -1)) return 'Yesterday'
  if (key === addDays(today, 1)) return 'Tomorrow'
  const d = parseDateKey(key)
  const sameYear = d.getFullYear() === parseDateKey(today).getFullYear()
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

export function formatShortDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** "16h 05m", or "42m" under an hour. */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`
}

/** "1:02:03" or "02:03". */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** "1:30" for seconds-based holds and rests. */
export function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}:${pad(s % 60)}` : `${s}s`
}

/** Value for an <input type="datetime-local">. */
export function toDateTimeInput(ts: number): string {
  const d = new Date(ts)
  return `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDateTimeInput(value: string): number | null {
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : null
}
