import type { CloseupDef, FootSide, HandFront, HandSide } from './closeup'

/* ── Hands ─────────────────────────────────────────────────────────── */

// Forearm resting on a table, hand past the edge, palm down.
const onTable = (palm: number, f1: number, f2: number, thumb: number): HandSide => ({ kind: 'hand', at: [40, 100], fore: 0, palm, f1, f2, thumb })
const TABLE = { t: 'table' as const, x1: 18, x2: 134, y: 112 }

// Forearm level, palm down, seen from the thumb side: only the fingers move.
const sideways = (f1: number, f2: number): HandSide => ({ kind: 'hand', at: [40, 100], fore: 0, palm: 0, f1, f2, thumb: f1 > 45 ? 28 : -12 })

const front = (p: Partial<HandFront>): HandFront => ({ kind: 'hand-front', at: [120, 110], rot: 0, tilt: 0, spread: 0.2, curl: 0.05, ...p })

// Fist around a light dumbbell: fingers wrap a little past the palm.
const fist = (palm: number): Pick<HandSide, 'palm' | 'f1' | 'f2' | 'thumb' | 'weight'> => ({ palm, f1: palm + 85, f2: palm + 170, thumb: palm + 60, weight: true })

/* ── Feet ──────────────────────────────────────────────────────────── */

const FLOOR = { t: 'floor' as const, y: 194 }
// Standing, ball of the foot on the floor.
const stand = (p: Partial<FootSide>): FootSide => ({ kind: 'foot', at: [150, 191], anchor: 'ball', shin: 90, foot: 0, toe: 9, ...p })
// Lying or sitting with the leg out straight, toes up.
const lying = (p: Partial<FootSide>): FootSide => ({ kind: 'foot', at: [110, 110], anchor: 'ankle', shin: 0, foot: -90, toe: -88, ...p })

export const CLOSEUPS: Record<string, CloseupDef> = {
  // ── Wrists and hands ───────────────────────────────────────────────
  'wrist-flex-ext': {
    caption: 'Forearm on a table',
    props: [TABLE],
    poses: [onTable(0, 4, 8, -14), onTable(70, 80, 90, 52), onTable(0, 4, 8, -14), onTable(-62, -58, -52, -78)],
  },
  'wrist-cars': {
    caption: 'Front view: slow circles',
    poses: [front({ pitch: 55 }), front({ tilt: 28 }), front({ pitch: -55, rot: 10 }), front({ tilt: -22 })],
  },
  'palm-flips': {
    caption: 'Front view, elbow at your side',
    poses: [front({ rot: 0 }), front({ rot: 180 })],
  },
  'wrist-side-bends': {
    caption: 'Front view',
    poses: [front({ tilt: -22 }), front({ tilt: 28 })],
  },
  'fist-to-spread': {
    caption: 'Front view',
    poses: [front({ curl: 1, spread: 0 }), front({ curl: 0, spread: 1 })],
  },
  'band-finger-extension': {
    caption: 'Rubber band around your fingers',
    poses: [front({ curl: 0.2, spread: 0, band: true }), front({ curl: 0, spread: 1, band: true })],
  },
  'tendon-glides': {
    caption: 'Straight, hook, fist, straight, tabletop',
    poses: [sideways(0, 0), sideways(4, 150), sideways(88, 178), sideways(0, 0), sideways(88, 90)],
  },
  'palm-lifts': {
    caption: 'Fingers stay down, palm lifts',
    props: [{ t: 'floor', y: 181 }],
    poses: [
      { kind: 'hand', at: [200, 170], anchor: 'tip', fore: 60, palm: 0, f1: 0, f2: 0, thumb: 8 },
      { kind: 'hand', at: [200, 170], anchor: 'tip', fore: 52, palm: 32, f1: 0, f2: 0, thumb: 38 },
    ],
  },
  'wrist-flexor-stretch': {
    hold: true,
    caption: 'Arm straight, other hand eases fingers back',
    poses: [
      { kind: 'hand', at: [40, 110], fore: 0, palm: 0, f1: 4, f2: 8, thumb: -14 },
      { kind: 'hand', at: [40, 110], fore: 0, palm: -82, f1: -90, f2: -96, thumb: -100, pull: [96, 24] },
    ],
  },
  'wrist-extensor-stretch': {
    hold: true,
    caption: 'Arm straight, other hand eases the hand down',
    poses: [
      { kind: 'hand', at: [40, 80], fore: 0, palm: 0, f1: 4, f2: 8, thumb: -14 },
      { kind: 'hand', at: [40, 80], fore: 0, palm: 84, f1: 96, f2: 104, thumb: 66, pull: [104, 160] },
    ],
  },
  'prayer-stretch': {
    hold: true,
    caption: 'Palms together, lower your hands',
    poses: [
      { kind: 'hand', at: [60, 170], fore: -42, palm: -90, f1: -90, f2: -90, thumb: -104 },
      { kind: 'hand', at: [60, 170], fore: -6, palm: -90, f1: -90, f2: -90, thumb: -104 },
    ],
  },
  'reverse-prayer': {
    hold: true,
    caption: 'Backs of the hands together, raise your hands',
    poses: [
      { kind: 'hand', at: [60, 60], fore: 38, palm: 90, f1: 90, f2: 90, thumb: 76 },
      { kind: 'hand', at: [60, 60], fore: 4, palm: 90, f1: 90, f2: 90, thumb: 76 },
    ],
  },
  'wrist-curl': {
    caption: 'Forearm on your thigh or a bench, palm up',
    props: [{ t: 'table', x1: 108, x2: 226, y: 112 }],
    poses: [
      { kind: 'hand', at: [210, 100], fore: 180, ...fist(130) },
      { kind: 'hand', at: [210, 100], fore: 180, ...fist(236) },
    ],
  },
  'reverse-wrist-curl': {
    caption: 'Forearm on your thigh or a bench, palm down',
    props: [TABLE],
    poses: [
      { kind: 'hand', at: [40, 100], fore: 0, ...fist(62) },
      { kind: 'hand', at: [40, 100], fore: 0, ...fist(-42) },
    ],
  },

  // ── Feet and ankles ────────────────────────────────────────────────
  'toe-yoga': {
    caption: 'Big toe up, then the little toes up',
    props: [FLOOR],
    poses: [stand({ toe: -42, toe2: 9 }), stand({ toe: 9, toe2: -38 })],
  },
  'toe-spreads': {
    caption: 'Seen from above',
    poses: [
      { kind: 'foot-top', at: [120, 190], spread: 0 },
      { kind: 'foot-top', at: [120, 190], spread: 1 },
    ],
  },
  'short-foot': {
    hold: true,
    caption: 'Toes stay long, the arch lifts',
    props: [FLOOR],
    poses: [stand({ arch: 0 }), stand({ arch: 1 })],
  },
  'towel-scrunch': {
    caption: 'Grab the towel with your toes',
    props: [FLOOR, { t: 'towel', x1: 132, x2: 236, y: 191 }],
    poses: [stand({ toe: -26 }), stand({ toe: 24, toe2: 26 })],
  },
  'ankle-pumps': {
    caption: 'Leg out straight',
    poses: [lying({ foot: -112, toe: -116 }), lying({ foot: -28, toe: -24 })],
  },
  'ankle-alphabet': {
    caption: 'Trace letters with your big toe',
    poses: [lying({ foot: -108, toe: -112 }), lying({ foot: -62, toe: -60 }), lying({ foot: -34, toe: -30 }), lying({ foot: -84, toe: -86 })],
  },
  'ankle-tilts': {
    caption: 'Seen from behind',
    poses: [
      { kind: 'foot-back', at: [120, 110], tilt: -24 },
      { kind: 'foot-back', at: [120, 110], tilt: 30 },
    ],
  },
  'band-ankle-in-out': {
    caption: 'Seen from behind, band pulling sideways',
    poses: [
      { kind: 'foot-back', at: [120, 110], tilt: 18, band: true },
      { kind: 'foot-back', at: [120, 110], tilt: -26, band: true },
    ],
  },
  'tib-raise': {
    caption: 'Back against a wall, feet a step forward',
    props: [FLOOR],
    poses: [
      { kind: 'foot', at: [90, 191], anchor: 'heel', shin: 72, foot: 0, toe: 9 },
      { kind: 'foot', at: [90, 191], anchor: 'heel', shin: 72, foot: -32, toe: -30 },
    ],
  },
  'heel-walk': {
    caption: 'Walk on your heels, toes up',
    props: [FLOOR],
    poses: [
      { kind: 'foot', at: [100, 191], anchor: 'heel', shin: 80, foot: -26, toe: -26 },
      { kind: 'foot', at: [100, 191], anchor: 'heel', shin: 98, foot: -24, toe: -24 },
    ],
  },
  'toe-walk': {
    caption: 'Walk tall on the balls of your feet',
    props: [FLOOR],
    poses: [stand({ foot: 48, toe: 6, shin: 82 }), stand({ foot: 52, toe: 6, shin: 98 })],
  },
  'heel-drops': {
    caption: 'Balls of the feet on a step',
    props: [{ t: 'step', x: 128, y: 150, w: 110 }],
    poses: [
      { kind: 'foot', at: [134, 149], anchor: 'ball', shin: 90, foot: 36, toe: 2 },
      { kind: 'foot', at: [134, 149], anchor: 'ball', shin: 90, foot: -24, toe: 2 },
    ],
  },
  'kneeling-toe-stretch': {
    hold: true,
    caption: 'Toes tucked under, sit back',
    props: [FLOOR],
    poses: [
      { kind: 'foot', at: [150, 191], anchor: 'ball', shin: -18, foot: 58, toe: 4 },
      { kind: 'foot', at: [150, 191], anchor: 'ball', shin: -30, foot: 74, toe: 4 },
    ],
  },
  'plantar-fascia-stretch': {
    hold: true,
    caption: 'Pull the toes back with your hand or a towel',
    poses: [
      { kind: 'foot', at: [110, 120], anchor: 'ankle', shin: 90, foot: 0, toe: 6 },
      { kind: 'foot', at: [110, 120], anchor: 'ankle', shin: 90, foot: -16, toe: -70, strap: [130, 70] },
    ],
  },
  'big-toe-wall-stretch': {
    hold: true,
    caption: 'Big toe up the wall, knee eases forward',
    props: [FLOOR, { t: 'wall', x: 163 }],
    poses: [stand({ toe: -58, toe2: 9, shin: 90 }), stand({ toe: -84, toe2: 9, shin: 104 })],
  },
  'soleus-stretch': {
    hold: true,
    caption: 'Heel down, knee bends forward',
    props: [FLOOR],
    poses: [
      { kind: 'foot', at: [80, 191], anchor: 'heel', shin: 90, foot: 0, toe: 9 },
      { kind: 'foot', at: [80, 191], anchor: 'heel', shin: 122, foot: 0, toe: 9 },
    ],
  },
}
