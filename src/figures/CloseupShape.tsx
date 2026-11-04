import { addPt, dirOf, footSidePoints, handSidePoints, lerpCloseup, type CloseupDef, type CloseupPose, type CloseupProp, type FootBack, type FootSide, type FootTop, type HandFront, type HandSide } from './closeup'
import type { Pt } from './skeleton'

const f = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`
const seg = (a: Pt, b: Pt) => `M${f(a)}L${f(b)}`
const poly = (pts: Pt[]) => `M${pts.map(f).join('L')}Z`
const rot = (o: Pt, deg: number) => (q: Pt): Pt => {
  const c = Math.cos((deg * Math.PI) / 180)
  const s = Math.sin((deg * Math.PI) / 180)
  return [o[0] + q[0] * c - q[1] * s, o[1] + q[0] * s + q[1] * c]
}

/** A limb drawn as a tapered band from `a` (width wa) to `b` (width wb). */
function taper(a: Pt, b: Pt, wa: number, wb: number): Pt[] {
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
  const n = dirOf(ang + 90)
  return [addPt(a, n, wa / 2), addPt(b, n, wb / 2), addPt(b, n, -wb / 2), addPt(a, n, -wa / 2)]
}

/* ── Hand ──────────────────────────────────────────────────────────── */

function handSide(p: HandSide) {
  const h = handSidePoints(p)
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={poly(taper(h.E, h.W, 28, 20))} className="fig-skin fig-skin-edge" strokeWidth={3} />
      {p.weight && <circle cx={h.K[0] + dirOf(p.palm + 90)[0] * 6} cy={h.K[1] + dirOf(p.palm + 90)[1] * 6} r={14} className="fig-accent-fill" />}
      <path d={seg(h.W, h.K)} className="fig-body" strokeWidth={22} />
      <path d={`M${f(h.K)}L${f(h.M)}L${f(h.T)}`} className="fig-body" strokeWidth={14} />
      <path d={seg(h.thumbBase, h.thumbTip)} className="fig-palm-stroke" strokeWidth={10} />
      {p.pull && (
        <>
          <path d={seg(h.T, p.pull)} className="fig-accent" strokeWidth={5} />
          <circle cx={p.pull[0]} cy={p.pull[1]} r={7} className="fig-accent-fill" />
        </>
      )}
    </g>
  )
}

function handFrontGeometry(p: HandFront) {
  const c = Math.cos((p.rot * Math.PI) / 180)
  const pitch = Math.cos(((p.pitch ?? 0) * Math.PI) / 180)
  const u = dirOf(-90 + p.tilt)
  const v = dirOf(p.tilt)
  const len = 40 * pitch
  const half = 6 + 17 * Math.abs(c)
  const top = addPt(p.at, u, len)
  const palm: Pt[] = [addPt(p.at, v, half * 0.8), addPt(top, v, half), addPt(top, v, -half), addPt(p.at, v, -half * 0.8)]
  const fingerLen = [24, 28, 26, 20].map((l) => l * pitch * (1 - 0.72 * p.curl))
  const spreadDeg = [-13, -4, 5, 14]
  const fingers = [-0.75, -0.25, 0.25, 0.75].map((x, i): [Pt, Pt] => {
    const base = addPt(top, v, x * half * Math.sign(c || 1))
    return [base, addPt(base, dirOf(-90 + p.tilt + p.spread * spreadDeg[i] * Math.sign(c || 1)), fingerLen[i])]
  })
  const thumbBase = addPt(addPt(p.at, u, len * 0.3), v, half * c)
  const thumbTip = addPt(thumbBase, dirOf(-90 + p.tilt + (35 + 25 * p.spread) * c), 26 * (1 - 0.45 * p.curl))
  const elbow = addPt(p.at, [0, 1], 92)
  return { c, u, v, len, half, top, palm, fingers, thumbBase, thumbTip, elbow, fingerLen }
}

function handFront(p: HandFront) {
  const g = handFrontGeometry(p)
  const palmFace = g.c >= 0
  const fingerW = 4 + 6 * Math.abs(g.c)
  const bandCenter = addPt(g.top, g.u, 15 * (1 - 0.7 * p.curl))
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={poly(taper(g.elbow, p.at, 28, 22))} className="fig-skin fig-skin-edge" strokeWidth={3} />
      {g.fingers.map(([a, b], i) => (
        <path key={i} d={seg(a, b)} className={palmFace ? 'fig-palm-stroke' : 'fig-body'} strokeWidth={fingerW + 1} />
      ))}
      <path d={poly(g.palm)} className={`${palmFace ? 'fig-palm' : 'fig-skin'} fig-skin-edge`} strokeWidth={4} />
      <path d={seg(g.thumbBase, g.thumbTip)} className="fig-outline" strokeWidth={13} />
      <path d={seg(g.thumbBase, g.thumbTip)} className={palmFace ? 'fig-palm-stroke' : 'fig-body'} strokeWidth={9} />
      {p.band && (
        <ellipse
          cx={bandCenter[0]}
          cy={bandCenter[1]}
          rx={g.half + 5 + 9 * p.spread}
          ry={4}
          transform={`rotate(${p.tilt} ${bandCenter[0].toFixed(1)} ${bandCenter[1].toFixed(1)})`}
          className="fig-accent"
          strokeWidth={3}
        />
      )}
    </g>
  )
}

/* ── Foot ──────────────────────────────────────────────────────────── */

function footSide(p: FootSide) {
  const q = footSidePoints(p)
  const outline = `M${f(q.ankleBack)}L${f(q.heelBack)}Q${f(q.heelCorner)} ${f(q.heelBottom)}Q${f(q.archCtrl)} ${f(q.ballBottom)}L${f(q.ballTop)}L${f(q.instep)}L${f(q.ankleFront)}Z`
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={seg(q.toe2Base, q.toe2Tip)} className="fig-far" strokeWidth={10} />
      <path d={poly(taper(q.knee, q.ankle, 30, 19))} className="fig-skin fig-skin-edge" strokeWidth={3} />
      <path d={outline} className="fig-skin fig-skin-edge" strokeWidth={4} />
      <path d={seg(q.toeBase, q.toeTip)} className="fig-outline" strokeWidth={15} />
      <path d={seg(q.toeBase, q.toeTip)} className="fig-body" strokeWidth={11} />
      {p.strap && (
        <>
          <path d={seg(q.toeTip, p.strap)} className="fig-accent" strokeWidth={5} />
          <circle cx={p.strap[0]} cy={p.strap[1]} r={7} className="fig-accent-fill" />
        </>
      )}
    </g>
  )
}

const HEEL_LOCAL: Pt[] = [
  [-16, -6],
  [16, -6],
  [25, 26],
  [16, 40],
  [-16, 40],
  [-25, 26],
]

function footBack(p: FootBack) {
  const r = rot(p.at, p.tilt)
  const knee: Pt = [p.at[0], p.at[1] - 70]
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {p.band && <path d={seg(r([24, 24]), [p.at[0] + 85, p.at[1] + 14])} className="fig-accent" strokeWidth={4} />}
      <path d={poly(taper(knee, p.at, 40, 28))} className="fig-skin fig-skin-edge" strokeWidth={3} />
      <path d={poly(HEEL_LOCAL.map(r))} className="fig-skin fig-skin-edge" strokeWidth={6} />
      <circle cx={p.at[0] - 16} cy={p.at[1] - 4} r={6} className="fig-skin" />
      <circle cx={p.at[0] + 16} cy={p.at[1] - 1} r={6} className="fig-skin" />
      <path d={seg(r([-15, 41]), r([15, 41]))} className="fig-accent" strokeWidth={4} />
    </g>
  )
}

const TOE_BASE: Pt[] = [
  [-16, -97],
  [-5, -99],
  [3, -98],
  [10, -95],
  [16, -90],
]
const TOE_ANGLE = [-94, -90, -85, -79, -72]
const TOE_SPREAD = [-17, -5, 4, 11, 19]
const TOE_LEN = [22, 16, 14, 12, 10]
const TOE_W = [14, 10, 9.5, 9, 8]

function footTop(p: FootTop) {
  const o = (q: Pt): Pt => [p.at[0] + q[0], p.at[1] + q[1]]
  const outline = `M${f(o([-13, -8]))}Q${f(o([0, 12]))} ${f(o([14, -8]))}L${f(o([21, -62]))}Q${f(o([24, -84]))} ${f(o([17, -91]))}L${f(o([-21, -98]))}Q${f(o([-25, -80]))} ${f(o([-16, -62]))}Q${f(o([-9, -36]))} ${f(o([-13, -8]))}Z`
  const toes = TOE_BASE.map((b, i): [Pt, Pt] => [o(b), addPt(o(b), dirOf(TOE_ANGLE[i] + TOE_SPREAD[i] * p.spread), TOE_LEN[i])])
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={outline} className="fig-skin fig-skin-edge" strokeWidth={4} />
      {toes.map(([a, b], i) => (
        <path key={`o${i}`} d={seg(a, b)} className="fig-outline" strokeWidth={TOE_W[i] + 4} />
      ))}
      {toes.map(([a, b], i) => (
        <path key={i} d={seg(a, b)} className="fig-body" strokeWidth={TOE_W[i]} />
      ))}
    </g>
  )
}

export function CloseupShape({ pose }: { pose: CloseupPose }) {
  switch (pose.kind) {
    case 'hand':
      return handSide(pose)
    case 'hand-front':
      return handFront(pose)
    case 'foot':
      return footSide(pose)
    case 'foot-back':
      return footBack(pose)
    case 'foot-top':
      return footTop(pose)
  }
}

export function CloseupProps({ props, box, front }: { props: CloseupProp[]; box: { x: number; y: number; w: number; h: number }; front: boolean }) {
  return (
    <g fill="none">
      {props.map((p, i) => {
        if (front !== (p.t === 'towel')) return null
        switch (p.t) {
          case 'floor':
            return <path key={i} d={seg([box.x, p.y], [box.x + box.w, p.y])} className="fig-floor" strokeWidth={3} />
          case 'table':
            return <rect key={i} x={p.x1} y={p.y} width={p.x2 - p.x1} height={12} rx={3} className="fig-prop-fill" />
          case 'wall':
            return <path key={i} d={seg([p.x, box.y - 10], [p.x, box.y + box.h + 10])} className="fig-prop" strokeWidth={5} />
          case 'step':
            return <rect key={i} x={p.x} y={p.y} width={p.w} height={box.y + box.h + 10 - p.y} rx={2} className="fig-prop-fill" />
          case 'towel': {
            const n = 6
            const w = (p.x2 - p.x1) / n
            let d = `M${p.x1} ${p.y}`
            for (let k = 0; k < n; k++) d += `q${w / 2} ${k % 2 ? 5 : -5} ${w} 0`
            return <path key={i} d={d} className="fig-accent" strokeWidth={5} />
          }
        }
      })}
    </g>
  )
}

/** Points a pose covers, used to frame the drawing. */
function posePoints(p: CloseupPose): [Pt, number][] {
  switch (p.kind) {
    case 'hand': {
      const h = handSidePoints(p)
      const pts: [Pt, number][] = [
        [h.E, 14],
        [h.W, 12],
        [h.K, 12],
        [h.M, 7],
        [h.T, 7],
        [h.thumbTip, 6],
      ]
      if (p.pull) pts.push([p.pull, 8])
      if (p.weight) pts.push([h.K, 22])
      return pts
    }
    case 'hand-front': {
      const g = handFrontGeometry(p)
      return [[g.elbow, 14], [p.at, 12], ...g.palm.map((q): [Pt, number] => [q, 3]), ...g.fingers.map(([, b]): [Pt, number] => [b, 6]), [g.thumbTip, 6], [addPt(g.top, g.u, 18), 10]]
    }
    case 'foot': {
      const q = footSidePoints(p)
      const pts: [Pt, number][] = [q.knee, q.ankle, q.heelBack, q.heelBottom, q.ballBottom, q.ballTop, q.toeTip, q.toe2Tip].map((x): [Pt, number] => [x, 8])
      if (p.strap) pts.push([p.strap, 8])
      return pts
    }
    case 'foot-back':
      return [
        [[p.at[0], p.at[1] - 70], 22],
        [p.at, 30],
        [[p.at[0], p.at[1] + 42], 30],
        ...(p.band ? ([[[p.at[0] + 85, p.at[1] + 14], 4]] as [Pt, number][]) : []),
      ]
    case 'foot-top':
      return [
        [[p.at[0] - 30, p.at[1] - 125], 4],
        [[p.at[0] + 34, p.at[1] + 10], 4],
      ]
  }
}

type Box = { x: number; y: number; w: number; h: number }
const cache = new Map<string, Box>()

export function closeupBounds(def: CloseupDef, only?: number): Box {
  const key = `${only ?? 'all'}:${JSON.stringify(only != null ? def.poses[only] : def.poses)}`
  const hit = cache.get(key)
  if (hit) return hit
  const frames: CloseupPose[] = []
  if (only != null) frames.push(def.poses[only])
  else
    def.poses.forEach((p, i) => {
      const next = def.poses[(i + 1) % def.poses.length]
      for (let t = 0; t <= 1; t += 0.25) frames.push(lerpCloseup(p, next, t))
    })
  const xs: number[] = []
  const ys: number[] = []
  for (const fr of frames)
    for (const [q, r] of posePoints(fr)) {
      xs.push(q[0] - r, q[0] + r)
      ys.push(q[1] - r, q[1] + r)
    }
  for (const p of def.props ?? []) {
    if (p.t === 'floor') ys.push(p.y + 4)
    if (p.t === 'table') ys.push(p.y + 12)
    if (p.t === 'wall') xs.push(p.x - 5, p.x + 5)
    if (p.t === 'step') ys.push(p.y)
    if (p.t === 'towel') xs.push(p.x1, p.x2)
  }
  const pad = 14
  let x = Math.min(...xs) - pad
  let y = Math.min(...ys) - pad
  let w = Math.max(...xs) + pad - x
  let h = Math.max(...ys) + pad - y
  // Match the 6:5 picture frame so nothing stretches.
  const ratio = 6 / 5
  if (w / h < ratio) {
    x -= (h * ratio - w) / 2
    w = h * ratio
  } else {
    y -= (w / ratio - h) / 2
    h = w / ratio
  }
  const box = { x, y, w, h }
  cache.set(key, box)
  return box
}
