import { useId, type ReactNode } from 'react'

interface RingProps {
  value: number
  max: number
  size?: number
  stroke?: number
  done?: boolean
  children?: ReactNode
  label?: string
}

/** Circular progress meter: the fill carries the value, the track is a lighter step of the same hue. */
export function Ring({ value, max, size = 120, stroke = 10, done, children, label }: RingProps) {
  const gradientId = `ring${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0679e" />
            <stop offset="100%" stopColor="#9b6ce8" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={`ring-fill ${done ? 'done' : ''}`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={done ? undefined : { stroke: `url(#${gradientId})` }}
        />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  )
}

export function Meter({ value, max, tone }: { value: number; max: number; tone?: 'series' | 'over' | 'warn' | 'good' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={`meter ${tone ?? ''}`} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div style={{ width: `${pct}%` }} />
    </div>
  )
}
