import { useEffect, useRef, useState } from 'react'
import { FIGURES } from './poses'
import { buildSkeleton, FLOOR_Y, LEN, lerpPose, type FigureDef, type Pose, type Prop, type Pt } from './skeleton'

const MOVE_MS = 1100
const DWELL_MS = 450
const HOLD_MS = 2600

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Pose at time `ms` in the figure's loop: each keyframe dwells, then moves to the next. */
function poseAt(def: FigureDef, ms: number): Pose {
  const poses = def.poses
  if (poses.length === 1) return poses[0]
  const dwell = (i: number) => (def.hold && i === poses.length - 1 ? HOLD_MS : DWELL_MS)
  const total = poses.reduce((sum, _, i) => sum + dwell(i) + MOVE_MS, 0)
  let t = ms % total
  for (let i = 0; i < poses.length; i++) {
    if (t < dwell(i)) return poses[i]
    t -= dwell(i)
    if (t < MOVE_MS) return lerpPose(poses[i], poses[(i + 1) % poses.length], ease(t / MOVE_MS))
    t -= MOVE_MS
  }
  return poses[0]
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

const line = (a: Pt, b: Pt) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`

function PropShape({ p }: { p: Prop }) {
  switch (p.t) {
    case 'bar':
      return <path d={line([p.x - 34, p.y], [p.x + 34, p.y])} className="fig-prop" strokeWidth={5} strokeLinecap="round" />
    case 'hbar':
      return <path d={line([p.x1, p.y], [p.x2, p.y])} className="fig-prop" strokeWidth={5} />
    case 'post':
      return <path d={line([p.x, p.y1], [p.x, p.y2])} className="fig-prop" strokeWidth={3} />
    case 'wall':
      return <path d={line([p.x, -40], [p.x, FLOOR_Y])} className="fig-prop" strokeWidth={4} />
    case 'box':
      return <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={2} className="fig-prop-fill" />
    case 'rings':
      return (
        <g>
          <path d={line([p.x, 0], [p.x, p.y - 6])} className="fig-prop" strokeWidth={2} />
          <circle cx={p.x} cy={p.y} r={6} className="fig-prop" strokeWidth={3} fill="none" />
        </g>
      )
  }
}

function Body({ pose, def }: { pose: Pose; def: FigureDef }) {
  const s = buildSkeleton(pose, def.front)
  const farClass = def.front ? 'fig-body' : 'fig-far'
  const limbPath = (l: { root: Pt; mid: Pt; end: Pt }) =>
    `M${l.root[0].toFixed(1)} ${l.root[1].toFixed(1)}L${l.mid[0].toFixed(1)} ${l.mid[1].toFixed(1)}L${l.end[0].toFixed(1)} ${l.end[1].toFixed(1)}`
  const [leg, leg2] = s.legs
  const [arm, arm2] = s.arms
  const torso = `M${s.hip[0].toFixed(1)} ${s.hip[1].toFixed(1)}Q${s.spineCtrl[0].toFixed(1)} ${s.spineCtrl[1].toFixed(1)} ${s.shoulder[0].toFixed(1)} ${s.shoulder[1].toFixed(1)}`
  const stickDir: Pt = [arm.end[0] - arm2.end[0], arm.end[1] - arm2.end[1]]
  const stickLen = Math.hypot(stickDir[0], stickDir[1]) || 1
  const ext = 16 / stickLen
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {!def.hideLegs && <path d={limbPath(leg2)} className={farClass} strokeWidth={8} />}
      {!def.hideLegs && <path d={line(leg2.end, leg2.toe)} className={farClass} strokeWidth={5} />}
      <path d={limbPath(arm2)} className={farClass} strokeWidth={7} />
      <path d={torso} className="fig-body" strokeWidth={11} />
      {def.front && !def.hideLegs && <path d={line(s.legs[0].root, s.legs[1].root)} className="fig-body" strokeWidth={9} />}
      {def.front && <path d={line(arm.root, arm2.root)} className="fig-body" strokeWidth={9} />}
      <circle cx={s.headCenter[0]} cy={s.headCenter[1]} r={LEN.head} className="fig-head" />
      {!def.hideLegs && <path d={limbPath(leg)} className="fig-body" strokeWidth={8} />}
      {!def.hideLegs && <path d={line(leg.end, leg.toe)} className="fig-body" strokeWidth={5} />}
      <path d={limbPath(arm)} className="fig-body" strokeWidth={7} />
      {pose.grip === 'stick' && (
        <path
          d={line(
            [arm.end[0] + stickDir[0] * ext, arm.end[1] + stickDir[1] * ext],
            [arm2.end[0] - stickDir[0] * ext, arm2.end[1] - stickDir[1] * ext],
          )}
          className="fig-accent"
          strokeWidth={4}
        />
      )}
      {pose.grip === 'weight' && <rect x={arm.end[0] - 7} y={arm.end[1] - 2} width={14} height={10} rx={2} className="fig-accent-fill" />}
    </g>
  )
}

type Box = { x: number; y: number; w: number; h: number }
const boundsCache = new Map<string, Box>()

/**
 * Smallest frame that holds the figure so it fills the picture: through its
 * whole movement when animated, or just the one pose shown when static.
 */
function figureBounds(def: FigureDef, only?: number): Box {
  const key = `${def.poses.length}:${only ?? 'all'}:${JSON.stringify(def.poses[only ?? 0])}`
  const cached = boundsCache.get(key)
  if (cached) return cached
  const xs: number[] = []
  const ys: number[] = []
  const addPt = (p: Pt, r = 6) => {
    xs.push(p[0] - r, p[0] + r)
    ys.push(p[1] - r, p[1] + r)
  }
  const frames: Pose[] = []
  if (only != null) frames.push(def.poses[only])
  else
    def.poses.forEach((p, i) => {
      const next = def.poses[(i + 1) % def.poses.length]
      for (let t = 0; t <= 1; t += 0.25) frames.push(lerpPose(p, next, t))
    })
  for (const pose of frames) {
    const s = buildSkeleton(pose, def.front)
    addPt(s.hip)
    addPt(s.shoulder)
    addPt(s.headCenter, LEN.head + 2)
    for (const l of [...s.arms, ...(def.hideLegs ? [] : s.legs)]) [l.mid, l.end].forEach((q) => addPt(q))
    if (!def.hideLegs) s.legs.forEach((l) => addPt(l.toe, 4))
  }
  for (const p of def.props ?? []) {
    if (p.t === 'bar') addPt([p.x, p.y], 8)
    if (p.t === 'box') addPt([p.x + p.w / 2, p.y], 4)
    if (p.t === 'hbar') addPt([(p.x1 + p.x2) / 2, p.y], 6)
    if (p.t === 'wall') xs.push(p.x - 4, p.x + 4)
  }
  if (!def.noFloor) ys.push(FLOOR_Y + 6)
  const pad = 12
  let x = Math.min(...xs) - pad
  let y = Math.min(...ys) - pad
  let w = Math.max(...xs) + pad - x
  let h = Math.max(...ys) + pad - y
  // Keep a sensible minimum so small poses aren't blown up past the stroke widths.
  const minSide = 120
  if (w < minSide) {
    x -= (minSide - w) / 2
    w = minSide
  }
  if (h < minSide * 0.8) {
    y -= (minSide * 0.8 - h) / 2
    h = minSide * 0.8
  }
  const box = { x, y, w, h }
  boundsCache.set(key, box)
  return box
}

export function hasFigure(id: string | undefined): boolean {
  return !!id && id in FIGURES
}

interface FigureProps {
  id: string
  /** Animate through the keyframes (default true). Thumbnails pass false. */
  animate?: boolean
  /** Show one keyframe statically (used by the figure gallery). */
  poseIndex?: number
  className?: string
  title?: string
}

/** An exercise demonstrated by an animated stick figure. */
export function Figure({ id, animate = true, poseIndex, className, title }: FigureProps) {
  const def = FIGURES[id]
  const reduced = usePrefersReducedMotion()
  const ref = useRef<SVGSVGElement>(null)
  const [visible, setVisible] = useState(false)
  const [now, setNow] = useState(0)
  const running = animate && !reduced && poseIndex == null && def && def.poses.length > 1 && visible

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!running) return
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      setNow(t - start)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running])

  if (!def) return null
  const pose = running ? poseAt(def, now) : def.poses[poseIndex != null ? Math.min(poseIndex, def.poses.length - 1) : def.poses.length - 1]

  const shownIndex = poseIndex != null ? Math.min(poseIndex, def.poses.length - 1) : def.poses.length - 1
  const animated = animate && !reduced && poseIndex == null && def.poses.length > 1
  const box = figureBounds(def, animated ? undefined : shownIndex)
  return (
    <svg
      ref={ref}
      viewBox={`${box.x.toFixed(1)} ${box.y.toFixed(1)} ${box.w.toFixed(1)} ${box.h.toFixed(1)}`}
      className={`figure ${className ?? ''}`}
      role="img"
      aria-label={title ?? 'Exercise demonstration'}
    >
      {!def.noFloor && <path d={line([box.x, FLOOR_Y + 3], [box.x + box.w, FLOOR_Y + 3])} className="fig-floor" strokeWidth={2} />}
      {def.props?.filter((p) => p.t !== 'bar').map((p, i) => <PropShape key={i} p={p} />)}
      <Body pose={pose} def={def} />
      {def.props?.filter((p) => p.t === 'bar').map((p, i) => <PropShape key={`bar${i}`} p={p} />)}
    </svg>
  )
}
