/**
 * A jointed stick figure posed with absolute segment angles (degrees, screen
 * coordinates: 0 = right, 90 = down, -90 = up). Limbs can instead reach a
 * target point with two-bone IK, which keeps hands on a bar or feet on the
 * floor while the rest of the body moves.
 */

export type Pt = [number, number]
export type Joint = 'hip' | 'shoulder' | 'hand' | 'hand2' | 'ankle' | 'ankle2' | 'knee' | 'knee2'

export interface Pose {
  /** Where the anchor joint sits. */
  at: Pt
  /** Joint pinned to `at` (default hip). */
  anchor?: Joint
  /** Hip → shoulder direction. */
  torso: number
  /** Shortens the torso to suggest leaning toward the viewer (front views). */
  torsoScale?: number
  /** Neck direction (default: in line with torso). */
  head?: number
  /** Sideways curve of the spine in px (sign picks the side). */
  bend?: number
  /** Near arm [upper, forearm] angles; arm2 is the far arm. */
  arm?: [number, number]
  arm2?: [number, number]
  /** IK targets for the hands, used instead of arm angles. */
  reach?: Pt
  reach2?: Pt
  /** IK bend side for elbows/knees: 1 or -1. */
  elbow?: number
  elbow2?: number
  /** Near leg [thigh, shin] angles; leg2 is the far leg. */
  leg?: [number, number]
  leg2?: [number, number]
  /** IK targets for the ankles, used instead of leg angles. */
  step?: Pt
  step2?: Pt
  knee?: number
  knee2?: number
  /** Foot angles (default: perpendicular to the shin, toes forward). */
  toe?: number
  toe2?: number
  /** Something held in the hands. */
  grip?: 'stick' | 'weight'
}

export type Prop =
  | { t: 'bar'; x: number; y: number }
  | { t: 'hbar'; x1: number; x2: number; y: number }
  | { t: 'post'; x: number; y1: number; y2: number }
  | { t: 'wall'; x: number }
  | { t: 'box'; x: number; y: number; w: number; h: number }
  | { t: 'rings'; x: number; y: number }

export interface FigureDef {
  poses: Pose[]
  props?: Prop[]
  /** Front view: shoulders and hips are spread sideways. */
  front?: boolean
  /** Top-down view: no floor line. */
  noFloor?: boolean
  /** Legs point away from the viewer (front view of a push-up). */
  hideLegs?: boolean
  /** Hold figures pause on their final pose. */
  hold?: boolean
  /** Shown under the figure when it isn't a side view, e.g. "Front view". */
  caption?: string
}

export const VIEW_W = 240
export const VIEW_H = 200
export const FLOOR_Y = 192

export const LEN = {
  torso: 46,
  neck: 5,
  head: 9,
  upper: 26,
  fore: 24,
  thigh: 38,
  shin: 36,
  foot: 11,
}

const rad = (deg: number) => (deg * Math.PI) / 180
const dir = (deg: number): Pt => [Math.cos(rad(deg)), Math.sin(rad(deg))]
const add = (a: Pt, b: Pt, k = 1): Pt => [a[0] + b[0] * k, a[1] + b[1] * k]
const angleOf = (from: Pt, to: Pt) => (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI

/** Two-bone IK: returns [upper, lower] absolute angles reaching from root toward target. */
export function solveIK(root: Pt, target: Pt, a: number, b: number, side: number): [number, number] {
  const dx = target[0] - root[0]
  const dy = target[1] - root[1]
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(a - b) + 0.01), a + b - 0.01)
  const base = Math.atan2(dy, dx)
  const cosA = (a * a + d * d - b * b) / (2 * a * d)
  const alpha = Math.acos(Math.min(1, Math.max(-1, cosA)))
  const upper = base + side * alpha
  const mid: Pt = [root[0] + a * Math.cos(upper), root[1] + a * Math.sin(upper)]
  return [(upper * 180) / Math.PI, angleOf(mid, target)]
}

export interface Limb {
  root: Pt
  mid: Pt
  end: Pt
}

export interface Skeleton {
  hip: Pt
  shoulder: Pt
  spineCtrl: Pt
  headCenter: Pt
  arms: [Limb, Limb]
  legs: [Limb & { toe: Pt }, Limb & { toe: Pt }]
}

function limb(root: Pt, angles: [number, number], a: number, b: number): Limb {
  const mid = add(root, dir(angles[0]), a)
  return { root, mid, end: add(mid, dir(angles[1]), b) }
}

/** Builds joint positions for a pose. */
export function buildSkeleton(p: Pose, front = false): Skeleton {
  // Lay the figure out with the hip at the origin, then shift it onto the anchor.
  const torsoLen = LEN.torso * (p.torsoScale ?? 1)
  const shoulderC = add([0, 0], dir(p.torso), torsoLen)
  const across = front ? dir(p.torso + 90) : ([0, 0] as Pt)
  const sh: [Pt, Pt] = [add(shoulderC, across, 11), add(shoulderC, across, -11)]
  const hp: [Pt, Pt] = [add([0, 0], across, 6), add([0, 0], across, -6)]

  // FK-only parts first, so an anchor on a FK joint can position everything.
  const arm1 = p.arm ?? [90, 90]
  const arm2 = p.arm2 ?? arm1
  const leg1 = p.leg ?? [90, 90]
  const leg2 = p.leg2 ?? leg1
  let arms: [Limb, Limb] = [limb(sh[0], arm1, LEN.upper, LEN.fore), limb(sh[1], arm2, LEN.upper, LEN.fore)]
  let legs: [Limb, Limb] = [limb(hp[0], leg1, LEN.thigh, LEN.shin), limb(hp[1], leg2, LEN.thigh, LEN.shin)]

  const anchorPt: Record<Joint, Pt> = {
    hip: [0, 0],
    shoulder: shoulderC,
    hand: arms[0].end,
    hand2: arms[1].end,
    knee: legs[0].mid,
    knee2: legs[1].mid,
    ankle: legs[0].end,
    ankle2: legs[1].end,
  }
  const a = anchorPt[p.anchor ?? 'hip']
  const off: Pt = [p.at[0] - a[0], p.at[1] - a[1]]
  const shift = (q: Pt): Pt => [q[0] + off[0], q[1] + off[1]]

  const hip = shift([0, 0])
  const shoulder = shift(shoulderC)
  const shW: [Pt, Pt] = [shift(sh[0]), shift(sh[1])]
  const hpW: [Pt, Pt] = [shift(hp[0]), shift(hp[1])]

  const reach2 = p.reach2 ?? p.reach
  arms = [
    p.reach
      ? limb(shW[0], solveIK(shW[0], p.reach, LEN.upper, LEN.fore, p.elbow ?? 1), LEN.upper, LEN.fore)
      : limb(shW[0], arm1, LEN.upper, LEN.fore),
    reach2
      ? limb(shW[1], solveIK(shW[1], reach2, LEN.upper, LEN.fore, p.elbow2 ?? p.elbow ?? 1), LEN.upper, LEN.fore)
      : limb(shW[1], arm2, LEN.upper, LEN.fore),
  ]
  const step2 = p.step2 ?? p.step
  const legAngles: [[number, number], [number, number]] = [
    p.step ? solveIK(hpW[0], p.step, LEN.thigh, LEN.shin, p.knee ?? 1) : leg1,
    step2 ? solveIK(hpW[1], step2, LEN.thigh, LEN.shin, p.knee2 ?? p.knee ?? 1) : leg2,
  ]
  legs = [limb(hpW[0], legAngles[0], LEN.thigh, LEN.shin), limb(hpW[1], legAngles[1], LEN.thigh, LEN.shin)]
  const toe1 = p.toe ?? legAngles[0][1] - 90
  const toe2 = p.toe2 ?? p.toe ?? legAngles[1][1] - 90

  const headAngle = p.head ?? p.torso
  const mid: Pt = [(hip[0] + shoulder[0]) / 2, (hip[1] + shoulder[1]) / 2]
  return {
    hip,
    shoulder,
    spineCtrl: add(mid, dir(p.torso + 90), p.bend ?? 0),
    headCenter: add(shoulder, dir(headAngle), LEN.neck + LEN.head),
    arms,
    legs: [
      { ...legs[0], toe: add(legs[0].end, dir(toe1), LEN.foot) },
      { ...legs[1], toe: add(legs[1].end, dir(toe2), LEN.foot) },
    ],
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function lerpValue(a: unknown, b: unknown, t: number): unknown {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t)
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return a.map((v, i) => lerpValue(v, b[i], t))
  return t < 0.5 ? a : b
}

/** Blends two poses; fields present in only one switch over at the midpoint. */
export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Pose>
  const out: Record<string, unknown> = {}
  for (const k of keys) {
    const va = a[k]
    const vb = b[k]
    out[k] = va === undefined ? (t < 0.5 ? undefined : vb) : vb === undefined ? (t < 0.5 ? va : undefined) : lerpValue(va, vb, t)
  }
  return out as unknown as Pose
}
