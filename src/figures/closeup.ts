import type { Pt } from './skeleton'

/**
 * Close-up figures for small joints the full-body stick figure can't show: wrists, fingers,
 * ankles and toes. Angles are absolute screen degrees (0 = right, 90 = down, -90 = up).
 */

/** Forearm and hand from the thumb side, palm facing down when everything points right. */
export interface HandSide {
  kind: 'hand'
  at: Pt
  anchor?: 'elbow' | 'wrist' | 'knuckle' | 'tip'
  /** Elbow → wrist. */
  fore: number
  /** Wrist → knuckles. Bigger than `fore` = bent toward the palm (flexion). */
  palm: number
  /** Knuckles → middle finger joint, and middle joint → fingertip. */
  f1: number
  f2: number
  /** Thumb direction. */
  thumb: number
  /** The other hand or a towel pulling from the fingertips toward this point. */
  pull?: Pt
  /** A light dumbbell held in the fist. */
  weight?: boolean
}

/** Forearm upright, looking at the palm (rot 0) or the back of the hand (rot 180). */
export interface HandFront {
  kind: 'hand-front'
  /** Wrist position. */
  at: Pt
  /** Forearm rotation in degrees: 0 palm toward you, 90 edge-on, 180 back of the hand. */
  rot: number
  /** Side bend at the wrist: + toward the thumb side. */
  tilt: number
  /** Forward or backward bend at the wrist, which shortens the hand as seen from the front. */
  pitch?: number
  /** 0 fingers together … 1 spread wide. */
  spread: number
  /** 0 straight … 1 fist. */
  curl: number
  /** A rubber band around the fingers. */
  band?: boolean
}

/** Shin and foot from the inside (big-toe side), toes pointing right. */
export interface FootSide {
  kind: 'foot'
  at: Pt
  anchor?: 'knee' | 'ankle' | 'heel' | 'ball' | 'toe'
  /** Knee → ankle. */
  shin: number
  /** Tilt of the whole foot: 0 flat, negative = toes up, positive = pointed. */
  foot: number
  /** Big toe direction, and the smaller toes behind it. */
  toe: number
  toe2?: number
  /** 0 relaxed … 1 arch domed up (short foot). */
  arch?: number
  /** A towel, strap or hand pulling the toes toward this point. */
  strap?: Pt
}

/** Lower leg and heel seen from behind, for tilting the foot in and out. */
export interface FootBack {
  kind: 'foot-back'
  at: Pt
  /** + rolls the sole inward (inversion), − outward (eversion). */
  tilt: number
  band?: boolean
}

/** A right foot seen from above, toes pointing up the screen. */
export interface FootTop {
  kind: 'foot-top'
  at: Pt
  /** 0 toes together … 1 spread wide. */
  spread: number
}

export type CloseupPose = HandSide | HandFront | FootSide | FootBack | FootTop

export type CloseupProp =
  | { t: 'floor'; y: number }
  | { t: 'table'; x1: number; x2: number; y: number }
  | { t: 'wall'; x: number }
  | { t: 'step'; x: number; y: number; w: number }
  | { t: 'towel'; x1: number; x2: number; y: number }

export interface CloseupDef {
  poses: CloseupPose[]
  props?: CloseupProp[]
  hold?: boolean
  caption?: string
}

/* ── Geometry ──────────────────────────────────────────────────────── */

const rad = (d: number) => (d * Math.PI) / 180
export const dirOf = (d: number): Pt => [Math.cos(rad(d)), Math.sin(rad(d))]
export const addPt = (a: Pt, b: Pt, k = 1): Pt => [a[0] + b[0] * k, a[1] + b[1] * k]

export const HAND = { fore: 72, palm: 36, f1: 21, f2: 19, thumb: 24 }

export function handSidePoints(p: HandSide) {
  const E0: Pt = [0, 0]
  const W0 = addPt(E0, dirOf(p.fore), HAND.fore)
  const K0 = addPt(W0, dirOf(p.palm), HAND.palm)
  const M0 = addPt(K0, dirOf(p.f1), HAND.f1)
  const T0 = addPt(M0, dirOf(p.f2), HAND.f2)
  const anchor = { elbow: E0, wrist: W0, knuckle: K0, tip: T0 }[p.anchor ?? 'elbow']
  const shift = (q: Pt): Pt => [q[0] - anchor[0] + p.at[0], q[1] - anchor[1] + p.at[1]]
  const E = shift(E0)
  const W = shift(W0)
  const K = shift(K0)
  const M = shift(M0)
  const T = shift(T0)
  const thumbBase = addPt(W, dirOf(p.palm), 9)
  const thumbTip = addPt(thumbBase, dirOf(p.thumb), HAND.thumb)
  return { E, W, K, M, T, thumbBase, thumbTip }
}

export const SHIN = 64

/** Foot outline points in foot coordinates: x toward the toes, y toward the sole, ankle at 0,0. */
const FOOT_LOCAL = {
  ankleBack: [-8, -6] as Pt,
  heelBack: [-18, 12] as Pt,
  heelCorner: [-18, 28] as Pt,
  heelBottom: [-9, 28] as Pt,
  ballBottom: [50, 28] as Pt,
  ballTop: [46, 13] as Pt,
  instep: [10, -1] as Pt,
  ankleFront: [7, -7] as Pt,
  toeBase: [47, 21] as Pt,
  toe2Base: [43, 19] as Pt,
}

export function footSidePoints(p: FootSide) {
  const c = Math.cos(rad(p.foot))
  const s = Math.sin(rad(p.foot))
  const local = (q: Pt): Pt => [q[0] * c - q[1] * s, q[0] * s + q[1] * c]
  const L = Object.fromEntries(Object.entries(FOOT_LOCAL).map(([k, v]) => [k, local(v)])) as Record<keyof typeof FOOT_LOCAL, Pt>
  const arch = p.arch ?? 0
  const archCtrl = local([20, 31 - arch * 30])
  const A0: Pt = [0, 0]
  const knee0 = addPt(A0, dirOf(p.shin), -SHIN)
  const toeTip0 = addPt(L.toeBase, dirOf(p.toe), 22)
  const anchor = { ankle: A0, knee: knee0, heel: L.heelBottom, ball: L.ballBottom, toe: toeTip0 }[p.anchor ?? 'ankle']
  const shift = (q: Pt): Pt => [q[0] - anchor[0] + p.at[0], q[1] - anchor[1] + p.at[1]]
  const pts = Object.fromEntries(Object.entries(L).map(([k, v]) => [k, shift(v)])) as Record<keyof typeof FOOT_LOCAL, Pt>
  return {
    ...pts,
    archCtrl: shift(archCtrl),
    ankle: shift(A0),
    knee: shift(knee0),
    toeTip: shift(toeTip0),
    toe2Tip: addPt(pts.toe2Base, dirOf(p.toe2 ?? p.toe), 16),
  }
}

/** Lerp between two poses of the same kind; numbers and points blend, flags switch halfway. */
export function lerpCloseup(a: CloseupPose, b: CloseupPose, t: number): CloseupPose {
  if (a.kind !== b.kind) return t < 0.5 ? a : b
  const out: Record<string, unknown> = {}
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    const va = (a as unknown as Record<string, unknown>)[k]
    const vb = (b as unknown as Record<string, unknown>)[k]
    if (typeof va === 'number' && typeof vb === 'number') out[k] = va + (vb - va) * t
    else if (Array.isArray(va) && Array.isArray(vb)) out[k] = va.map((x: number, i) => x + ((vb[i] as number) - x) * t)
    else out[k] = t < 0.5 ? va : vb
  }
  return out as unknown as CloseupPose
}
