import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'

export interface ChartPoint {
  x: number
  y: number
}

export interface ChartSeries {
  id: string
  label: string
  /** CSS color, e.g. "var(--series-1)". */
  color: string
  points: ChartPoint[]
  kind?: 'line' | 'dots'
  area?: boolean
}

interface LineChartProps {
  series: ChartSeries[]
  height?: number
  formatY: (y: number) => string
  formatX: (x: number) => string
  /** Optional reference line, e.g. a goal weight. */
  reference?: { y: number; label: string }
}

const PAD = { top: 12, right: 44, bottom: 24, left: 40 }

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  const step0 = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(step0)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? 10 * mag
  const start = Math.floor(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Number(v.toFixed(6)))
  return ticks
}

/** Single-axis line/dot chart with a hover crosshair, tooltip and end label. */
export function LineChart({ series, height = 200, formatY, formatX, reference }: LineChartProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(320)
  const [hover, setHover] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const all = series.flatMap((s) => s.points)
  const geo = useMemo(() => {
    const xs = all.map((p) => p.x)
    const ys = all.map((p) => p.y).concat(reference ? [reference.y] : [])
    const xMin = Math.min(...xs)
    const xMax = Math.max(...xs)
    const yPad = (Math.max(...ys) - Math.min(...ys)) * 0.1 || 1
    const yTicks = niceTicks(Math.min(...ys) - yPad, Math.max(...ys) + yPad)
    const yMin = yTicks[0]
    const yMax = yTicks[yTicks.length - 1]
    const iw = width - PAD.left - PAD.right
    const ih = height - PAD.top - PAD.bottom
    const sx = (x: number) => PAD.left + (xMax === xMin ? iw / 2 : ((x - xMin) / (xMax - xMin)) * iw)
    const sy = (y: number) => PAD.top + ih - ((y - yMin) / (yMax - yMin || 1)) * ih
    const xTickCount = Math.min(4, Math.max(2, Math.floor(iw / 90)))
    const xTicks = xMax === xMin ? [xMin] : Array.from({ length: xTickCount }, (_, i) => xMin + ((xMax - xMin) * i) / (xTickCount - 1))
    return { sx, sy, yTicks, xTicks, ih, iw }
  }, [all, width, height, reference])

  if (!all.length) return null
  const primary = series[0]
  const hoverPoint = hover != null ? primary.points[hover] : null

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    let best = 0
    let bestD = Infinity
    primary.points.forEach((p, i) => {
      const d = Math.abs(geo.sx(p.x) - mx)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    setHover(best)
  }

  const last = primary.points[primary.points.length - 1]
  return (
    <div className="chart" ref={wrap}>
      <svg width={width} height={height} onPointerMove={onMove} onPointerLeave={() => setHover(null)} onPointerDown={onMove}>
        <g className="grid">
          {geo.yTicks.map((t) => (
            <line key={t} x1={PAD.left} x2={width - PAD.right} y1={geo.sy(t)} y2={geo.sy(t)} />
          ))}
        </g>
        <g className="axis">
          {geo.yTicks.map((t) => (
            <text key={t} x={PAD.left - 6} y={geo.sy(t) + 4} textAnchor="end">
              {formatY(t)}
            </text>
          ))}
          {geo.xTicks.map((t, i) => (
            <text key={i} x={geo.sx(t)} y={height - 6} textAnchor={i === 0 ? 'start' : i === geo.xTicks.length - 1 ? 'end' : 'middle'}>
              {formatX(t)}
            </text>
          ))}
        </g>
        {reference && (
          <g>
            <line x1={PAD.left} x2={width - PAD.right} y1={geo.sy(reference.y)} y2={geo.sy(reference.y)} stroke="var(--axis)" strokeWidth={1} />
            <text x={width - PAD.right + 4} y={geo.sy(reference.y) + 4} fill="var(--muted)" fontSize={11}>
              {reference.label}
            </text>
          </g>
        )}
        {series.map((s) => {
          const pts = s.points.map((p) => [geo.sx(p.x), geo.sy(p.y)] as const)
          const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
          if (s.kind === 'dots')
            return (
              <g key={s.id}>
                {pts.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={3.5} fill={s.color} stroke="var(--surface)" strokeWidth={1.5} opacity={0.75} />
                ))}
              </g>
            )
          return (
            <g key={s.id}>
              {s.area && pts.length > 1 && (
                <path d={`${d}L${pts[pts.length - 1][0]} ${PAD.top + geo.ih}L${pts[0][0]} ${PAD.top + geo.ih}Z`} fill={s.color} opacity={0.1} />
              )}
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {pts.length === 1 && <circle cx={pts[0][0]} cy={pts[0][1]} r={4} fill={s.color} />}
            </g>
          )
        })}
        {last && hover == null && (
          <g>
            <circle cx={geo.sx(last.x)} cy={geo.sy(last.y)} r={4.5} fill={primary.color} stroke="var(--surface)" strokeWidth={2} />
            <text x={geo.sx(last.x) + 8} y={geo.sy(last.y) + 4} fill="var(--text)" fontSize={12} fontWeight={600}>
              {formatY(last.y)}
            </text>
          </g>
        )}
        {hoverPoint && (
          <g>
            <line x1={geo.sx(hoverPoint.x)} x2={geo.sx(hoverPoint.x)} y1={PAD.top} y2={PAD.top + geo.ih} stroke="var(--axis)" />
            {series.map((s) => {
              const p = s.points.find((q) => q.x === hoverPoint.x)
              return p ? <circle key={s.id} cx={geo.sx(p.x)} cy={geo.sy(p.y)} r={5} fill={s.color} stroke="var(--surface)" strokeWidth={2} /> : null
            })}
          </g>
        )}
      </svg>
      {hoverPoint && (
        <div className="chart-tooltip" style={{ left: Math.min(Math.max(geo.sx(hoverPoint.x), 70), width - 70) }}>
          <div className="muted">{formatX(hoverPoint.x)}</div>
          {series.map((s) => {
            const p = s.points.find((q) => q.x === hoverPoint.x)
            return p ? (
              <div key={s.id} className="row" style={{ gap: 6 }}>
                <span className="legend">
                  <span className="dot" style={{ background: s.color }} />
                </span>
                {s.label}: <strong>{formatY(p.y)}</strong>
              </div>
            ) : null
          })}
        </div>
      )}
      {series.length > 1 && (
        <div className="legend" style={{ marginTop: 6 }}>
          {series.map((s) => (
            <span className="key" key={s.id}>
              {s.kind === 'dots' ? <span className="dot" style={{ background: s.color }} /> : <span className="swatch" style={{ background: s.color }} />}
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
