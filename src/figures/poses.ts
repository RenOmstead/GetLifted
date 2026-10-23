import type { FigureDef, Pose, Prop } from './skeleton'

// Standing ankles sit at y=188, hands on the floor at y=189 (floor line y=192).
const STAND: Pose = { at: [120, 188], anchor: 'ankle', torso: -90, arm: [90, 90], leg: [90, 90], toe: 0 }

const bar = (x: number, y = 14): Prop => ({ t: 'bar', x, y })
const parallettes: Prop[] = [{ t: 'box', x: 92, y: 172, w: 56, h: 4 }, { t: 'post', x: 100, y1: 176, y2: 192 }, { t: 'post', x: 140, y1: 176, y2: 192 }]
const bench = (x: number, w: number, top: number): Prop[] => [
  { t: 'box', x, y: top, w, h: 7 },
  { t: 'post', x: x + 8, y1: top + 7, y2: 192 },
  { t: 'post', x: x + w - 8, y1: top + 7, y2: 192 },
]

// Front lever family: head left, hanging from a bar above the chest, face up.
const FL_HAND: [number, number] = [100, 30]
const flHang: Pose = { at: FL_HAND, anchor: 'hand', torso: -90, arm: [-90, -90], leg: [-20, 70], toe: 60 }
const fl = (leg: [number, number], leg2?: [number, number], toe?: number): Pose => ({
  at: FL_HAND,
  anchor: 'hand',
  torso: -180,
  head: -175,
  arm: [-74, -74],
  leg,
  leg2,
  toe: toe ?? leg[1],
})

// Back lever family: face down, arms behind the body.
const BL_HAND: [number, number] = [130, 34]
const germanHang: Pose = { at: BL_HAND, anchor: 'hand', torso: -90, head: -90, arm: [-108, -108], leg: [40, 125], toe: 125 }
const bl = (leg: [number, number], leg2?: [number, number], toe?: number): Pose => ({
  at: BL_HAND,
  anchor: 'hand',
  torso: -180,
  head: -185,
  arm: [-35, -35],
  leg,
  leg2,
  toe: toe ?? leg[1],
})

// Planche family: head right, hands on the floor, shoulders leaning past the hands.
const PL_HAND: [number, number] = [128, 189]
const pl = (torso: number, leg: [number, number], leg2?: [number, number], bend = 0): Pose => ({
  at: PL_HAND,
  anchor: 'hand',
  torso,
  bend,
  head: torso - 10,
  arm: [108, 108],
  leg,
  leg2,
  toe: leg[1],
})
const plSetup: Pose = { at: PL_HAND, anchor: 'hand', torso: -35, arm: [95, 95], leg: [95, 150], toe: 80 }

// L-sit family on parallettes.
const LS_HAND: [number, number] = [120, 172]
const ls = (leg: [number, number], torso = -90, arm: [number, number] = [90, 90]): Pose => ({
  at: LS_HAND,
  anchor: 'hand',
  torso,
  arm,
  leg,
  toe: leg[1],
})

// Push-up family: toes on the left, head right, hands under the shoulders.
// `rise` is the body's angle above the floor (20° at the top, 8° at the bottom).
const PU_ANKLE: [number, number] = [40, 182]
const PU_HAND: [number, number] = [153, 189]
const pu = (rise: number, extra: Partial<Pose> = {}): Pose => ({
  at: PU_ANKLE,
  anchor: 'ankle',
  torso: -rise,
  reach: PU_HAND,
  elbow: 1,
  leg: [180 - rise, 180 - rise],
  toe: 80,
  ...extra,
})

// Rings hanging at the support height used by ring figures.
const RING_Y = 105
const ringProps: Prop[] = [{ t: 'rings', x: 120, y: RING_Y }]

// A vertical pole for human flags.
const pole: Prop = { t: 'post', x: 50, y1: 6, y2: 192 }
const flag = (leg: [number, number], leg2: [number, number] = leg, toe = leg[1], toe2 = leg2[1]): Pose => ({
  at: [90, 95],
  anchor: 'shoulder',
  torso: 180,
  head: 180,
  reach: [50, 52],
  reach2: [50, 138],
  elbow: 1,
  elbow2: -1,
  leg,
  leg2,
  toe,
  toe2,
})

export const FIGURES: Record<string, FigureDef> = {
  // ── Push ───────────────────────────────────────────────────────────
  'wall-pushup': {
    props: [{ t: 'wall', x: 196 }],
    poses: [
      { at: [108, 188], anchor: 'ankle', torso: -72, leg: [108, 108], reach: [193, 52], elbow: -1, toe: 18 },
      { at: [108, 188], anchor: 'ankle', torso: -60, leg: [120, 120], reach: [193, 52], elbow: -1, toe: 30 },
    ],
  },
  'knee-pushup': {
    poses: [
      { at: [70, 186], anchor: 'knee', torso: -33, leg: [147, 195], reach: [142, 189], elbow: -1, toe: 120 },
      { at: [70, 186], anchor: 'knee', torso: -12, leg: [168, 195], reach: [142, 189], elbow: -1, toe: 120 },
    ],
  },
  'archer-pushup': {
    caption: 'Front view',
    front: true,
    hideLegs: true,
    poses: [
      { at: [120, 152], torso: -90, torsoScale: 0.12, reach: [168, 189], reach2: [72, 189], elbow: -1, elbow2: 1 },
      { at: [146, 172], torso: -90, torsoScale: 0.12, reach: [168, 189], reach2: [72, 189], elbow: -1, elbow2: 1 },
    ],
  },
  'pseudo-planche-pushup': {
    poses: [
      { at: [40, 182], anchor: 'ankle', torso: -18.5, leg: [161.5, 161.5], reach: [143, 189], elbow: -1, toe: 80 },
      { at: [40, 182], anchor: 'ankle', torso: -3, leg: [177, 177], reach: [143, 189], elbow: -1, toe: 80 },
    ],
  },
  'pike-pushup': {
    poses: [
      { at: [60, 188], anchor: 'ankle', torso: 45, head: 75, leg: [115, 115], reach: [159, 189], elbow: 1, toe: 30 },
      { at: [60, 188], anchor: 'ankle', torso: 45, head: 88, leg: [132, 132], reach: [159, 189], elbow: 1, toe: 30 },
    ],
  },
  'elevated-pike-pushup': {
    props: [{ t: 'box', x: 48, y: 150, w: 48, h: 42 }],
    poses: [
      { at: [136, 96], torso: 70, head: 85, step: [90, 146], knee: -1, reach: [150, 189], elbow: 1, toe: 60 },
      { at: [140, 108], torso: 78, head: 88, step: [90, 146], knee: -1, reach: [150, 189], elbow: 1, toe: 60 },
    ],
  },
  'freestanding-hspu': {
    poses: [
      { at: [120, 93], torso: 90, head: 80, reach: [120, 189], elbow: 1, leg: [-90, -90], toe: -90 },
      { at: [126, 116], torso: 82, head: 72, reach: [120, 189], elbow: 1, leg: [-96, -96], toe: -96 },
    ],
  },

  // ── Pull ───────────────────────────────────────────────────────────
  'dead-hang': {
    props: [bar(120)],
    noFloor: true,
    hold: true,
    poses: [{ at: [120, 14], anchor: 'hand', torso: -90, arm: [-90, -90], leg: [92, 92], toe: 65 }],
  },
  'archer-pullup': {
    caption: 'Front view',
    front: true,
    noFloor: true,
    props: [{ t: 'hbar', x1: 30, x2: 210, y: 18 }],
    poses: [
      { at: [120, 112], torso: -90, reach: [64, 18], reach2: [176, 18], elbow: -1, elbow2: 1, leg: [92, 92], leg2: [88, 88], toe: 0, toe2: 180 },
      { at: [148, 84], torso: -90, reach: [64, 18], reach2: [176, 18], elbow: -1, elbow2: 1, leg: [92, 92], leg2: [88, 88], toe: 0, toe2: 180 },
    ],
  },
  'straight-bar-dip': {
    props: [bar(125, 105)],
    noFloor: true,
    poses: [
      { at: [122, 103], torso: -92, reach: [125, 105], elbow: 1, leg: [100, 100], toe: 70 },
      { at: [112, 120], torso: -50, head: -40, reach: [125, 105], elbow: -1, leg: [70, 110], toe: 80 },
    ],
  },
  'hanging-knee-raise': {
    props: [bar(120)],
    noFloor: true,
    poses: [
      { at: [120, 14], anchor: 'hand', torso: -90, arm: [-90, -90], leg: [92, 92], toe: 65 },
      { at: [120, 14], anchor: 'hand', torso: -96, bend: -6, arm: [-90, -90], leg: [-25, 80], toe: 60 },
    ],
  },

  // ── Dips & supports ────────────────────────────────────────────────
  'support-hold': {
    props: [{ t: 'hbar', x1: 70, x2: 175, y: 104 }, { t: 'post', x: 78, y1: 104, y2: 192 }, { t: 'post', x: 167, y1: 104, y2: 192 }],
    hold: true,
    poses: [{ at: [122, 104], anchor: 'hand', torso: -90, arm: [92, 92], leg: [96, 120], toe: 75 }],
  },

  // ── Legs ───────────────────────────────────────────────────────────
  'bulgarian-split-squat': {
    props: bench(20, 70, 150),
    poses: [
      { at: [150, 188], anchor: 'ankle', torso: -88, leg: [100, 92], step2: [72, 146], knee2: 1, arm: [92, 92], toe: 0, toe2: 175 },
      { at: [150, 188], anchor: 'ankle', torso: -75, leg: [12, 100], step2: [72, 146], knee2: 1, arm: [96, 96], toe: 0, toe2: 175 },
    ],
  },
  'assisted-pistol': {
    props: [{ t: 'post', x: 196, y1: 40, y2: 192 }],
    poses: [
      { at: [120, 188], anchor: 'ankle', torso: -88, leg: [90, 90], leg2: [40, 40], reach: [196, 110], elbow: 1, toe: 0, toe2: 40 },
      { at: [120, 188], anchor: 'ankle', torso: -55, head: -60, leg: [-5, 115], leg2: [-5, -5], reach: [196, 130], elbow: 1, toe: 0, toe2: -5 },
    ],
  },
  'pistol-squat': {
    poses: [
      { at: [120, 188], anchor: 'ankle', torso: -88, leg: [90, 90], leg2: [40, 40], arm: [0, 0], toe: 0, toe2: 40 },
      { at: [120, 188], anchor: 'ankle', torso: -55, head: -60, leg: [-5, 115], leg2: [-5, -5], arm: [-5, -5], toe: 0, toe2: -5 },
    ],
  },
  'shrimp-squat': {
    poses: [
      { at: [130, 188], anchor: 'ankle', torso: -85, leg: [90, 90], leg2: [100, 200], arm: [0, 0], reach2: [80, 118], toe: 0, toe2: 160 },
      { at: [130, 188], anchor: 'ankle', torso: -50, head: -55, leg: [-10, 120], leg2: [120, 185], arm: [-10, -10], reach2: [70, 172], toe: 0, toe2: 175 },
    ],
  },
  burpee: {
    poses: [
      { ...STAND, arm: [-95, -95] },
      { at: [120, 188], anchor: 'ankle', torso: -40, head: -30, leg: [-15, 120], reach: [150, 189], elbow: -1, toe: 0 },
      { at: [40, 182], anchor: 'ankle', torso: -24, leg: [156, 156], reach: [150, 189], elbow: -1, toe: 80 },
    ],
  },

  // ── Core ───────────────────────────────────────────────────────────
  'hollow-hold': {
    hold: true,
    poses: [
      { at: [125, 184], torso: 180, head: 180, arm: [180, 180], leg: [0, 0], toe: -60 },
      { at: [125, 182], torso: -168, head: -160, bend: 5, arm: [-165, -165], leg: [-14, -14], toe: -14 },
    ],
  },
  'dragon-flag': {
    props: bench(30, 140, 152),
    poses: [
      { at: [70, 147], anchor: 'shoulder', torso: 120, head: 175, reach: [36, 154], elbow: -1, leg: [-60, -60], toe: -60 },
      { at: [70, 147], anchor: 'shoulder', torso: 172, head: 175, reach: [36, 154], elbow: -1, leg: [-8, -8], toe: -8 },
    ],
  },
  'tuck-l-sit': { props: parallettes, hold: true, poses: [ls([-60, 100])] },
  'l-sit': { props: parallettes, hold: true, poses: [ls([-60, 100]), ls([0, 0])] },
  'v-sit': { props: parallettes, hold: true, poses: [ls([0, 0]), ls([-50, -50], -112, [70, 70])] },

  // ── Front lever ────────────────────────────────────────────────────
  'tuck-front-lever': { props: [bar(FL_HAND[0], FL_HAND[1])], noFloor: true, hold: true, poses: [flHang, fl([-150, 30], undefined, 10)] },
  'adv-tuck-front-lever': { props: [bar(FL_HAND[0], FL_HAND[1])], noFloor: true, hold: true, poses: [flHang, fl([-90, 0], undefined, 0)] },
  'one-leg-front-lever': { props: [bar(FL_HAND[0], FL_HAND[1])], noFloor: true, hold: true, poses: [flHang, fl([0, 0], [-90, 0], 0)] },
  'straddle-front-lever': { props: [bar(FL_HAND[0], FL_HAND[1])], noFloor: true, hold: true, poses: [flHang, fl([4, 4], [-6, -6])] },
  'front-lever': { props: [bar(FL_HAND[0], FL_HAND[1])], noFloor: true, hold: true, poses: [flHang, fl([0, 0])] },

  // ── Back lever ─────────────────────────────────────────────────────
  'german-hang': {
    props: [bar(BL_HAND[0], BL_HAND[1])],
    noFloor: true,
    hold: true,
    poses: [{ at: BL_HAND, anchor: 'hand', torso: -90, arm: [-90, -90], leg: [30, 120], toe: 60 }, germanHang],
  },
  'tuck-back-lever': { props: [bar(BL_HAND[0], BL_HAND[1])], noFloor: true, hold: true, poses: [germanHang, bl([150, -25], undefined, -10)] },
  'adv-tuck-back-lever': { props: [bar(BL_HAND[0], BL_HAND[1])], noFloor: true, hold: true, poses: [germanHang, bl([90, 0], undefined, 0)] },
  'straddle-back-lever': { props: [bar(BL_HAND[0], BL_HAND[1])], noFloor: true, hold: true, poses: [germanHang, bl([-4, -4], [6, 6])] },
  'back-lever': { props: [bar(BL_HAND[0], BL_HAND[1])], noFloor: true, hold: true, poses: [germanHang, bl([0, 0])] },

  // ── Planche ────────────────────────────────────────────────────────
  'frog-stand': {
    hold: true,
    poses: [
      { at: PL_HAND, anchor: 'hand', torso: 40, head: 50, arm: [95, 95], leg: [40, 115], toe: 90 },
      { at: PL_HAND, anchor: 'hand', torso: 20, head: 30, arm: [100, 100], leg: [25, 150], toe: 170 },
    ],
  },
  'planche-lean': {
    hold: true,
    poses: [
      { at: [25, 182], anchor: 'ankle', torso: -24, leg: [156, 156], reach: [128, 189], elbow: -1, toe: 80 },
      { at: [40, 182], anchor: 'ankle', torso: -20, leg: [160, 160], reach: [128, 189], elbow: -1, toe: 80 },
    ],
  },
  'tuck-planche': { hold: true, poses: [plSetup, pl(15, [60, 175], undefined, 6)] },
  'adv-tuck-planche': { hold: true, poses: [plSetup, pl(0, [90, 180])] },
  'straddle-planche': { hold: true, poses: [plSetup, pl(0, [180, 180], [172, 172])] },
  'full-planche': { hold: true, poses: [plSetup, pl(0, [180, 180])] },

  // ── Handstand ──────────────────────────────────────────────────────
  'wall-handstand': {
    props: [{ t: 'wall', x: 150 }],
    hold: true,
    poses: [
      { at: [86, 189], anchor: 'hand', torso: 125, head: 120, arm: [80, 80], leg: [-55, -55], toe: -55 },
      { at: [130, 189], anchor: 'hand', torso: 92, head: 85, arm: [90, 90], leg: [-88, -88], toe: -88 },
    ],
  },
  'freestanding-handstand': {
    hold: true,
    poses: [
      { at: [120, 189], anchor: 'hand', torso: 80, head: 70, arm: [90, 90], leg: [-60, -60], leg2: [110, 110], toe: -60, toe2: 20 },
      { at: [120, 189], anchor: 'hand', torso: 90, head: 80, arm: [90, 90], leg: [-90, -90], toe: -90 },
    ],
  },

  // ── Mobility ───────────────────────────────────────────────────────
  'shoulder-pass-through': {
    caption: 'Front view',
    front: true,
    poses: [
      { ...STAND, at: [126, 188], arm: [75, 75], arm2: [105, 105], leg: [92, 92], leg2: [88, 88], toe: 0, toe2: 180, grip: 'stick' },
      { ...STAND, at: [126, 188], arm: [-60, -60], arm2: [-120, -120], leg: [92, 92], leg2: [88, 88], toe: 0, toe2: 180, grip: 'stick' },
    ],
  },
  'wall-slide': {
    caption: 'Front view',
    front: true,
    poses: [
      { ...STAND, at: [126, 188], arm: [0, -90], arm2: [180, -90], leg: [92, 92], leg2: [88, 88], toe: 0, toe2: 180 },
      { ...STAND, at: [126, 188], arm: [-45, -70], arm2: [-135, -110], leg: [92, 92], leg2: [88, 88], toe: 0, toe2: 180 },
    ],
  },
  'wrist-prep': {
    poses: [
      { at: [150, 189], anchor: 'hand', torso: 0, head: 10, arm: [90, 90], step: [70, 182], knee: -1, toe: 170 },
      { at: [150, 189], anchor: 'hand', torso: 5, head: 15, arm: [115, 115], step: [70, 182], knee: -1, toe: 170 },
    ],
  },
  'open-book': {
    caption: 'Seen from above',
    noFloor: true,
    poses: [
      { at: [140, 100], torso: 180, head: 180, arm: [90, 90], arm2: [90, 90], leg: [90, 0], toe: 0 },
      { at: [140, 100], torso: 180, head: 200, arm: [270, 270], arm2: [90, 90], leg: [90, 0], toe: 0 },
    ],
  },
  'ninety-ninety': {
    caption: 'Front view',
    front: true,
    poses: [
      { at: [120, 176], torso: -90, arm: [100, 100], arm2: [80, 80], leg: [-160, 110], leg2: [-160, 110], toe: 180, toe2: 180 },
      { at: [120, 176], torso: -90, arm: [100, 100], arm2: [80, 80], leg: [-20, 70], leg2: [-20, 70], toe: 0, toe2: 0 },
    ],
  },
  'cossack-squat': {
    caption: 'Front view',
    front: true,
    poses: [
      { at: [130, 125], torso: -90, step: [175, 188], step2: [85, 188], knee: -1, knee2: 1, arm: [85, 85], arm2: [95, 95], toe: 0, toe2: 180 },
      { at: [160, 160], torso: -84, step: [175, 188], step2: [85, 188], knee: -1, knee2: 1, arm: [100, 60], arm2: [80, 30], toe: 0, toe2: -90 },
    ],
  },
  'deep-squat-hold': {
    hold: true,
    poses: [
      { ...STAND, arm: [0, 0] },
      { at: [120, 188], anchor: 'ankle', torso: -70, head: -80, leg: [-15, 120], arm: [70, -30], toe: 0 },
    ],
  },
  'knee-to-wall': {
    props: [{ t: 'wall', x: 172 }],
    poses: [
      { at: [150, 188], anchor: 'ankle', torso: -90, leg: [5, 90], leg2: [110, 180], arm: [70, 20], toe: 0, toe2: 178 },
      { at: [150, 188], anchor: 'ankle', torso: -84, leg: [10, 115], leg2: [125, 180], arm: [60, 10], toe: 0, toe2: 178 },
    ],
  },
  'jefferson-curl': {
    props: [{ t: 'box', x: 88, y: 150, w: 64, h: 42 }],
    poses: [
      { at: [120, 146], anchor: 'ankle', torso: -90, leg: [90, 90], arm: [92, 92], toe: 0, grip: 'weight' },
      { at: [120, 146], anchor: 'ankle', torso: 42, head: 95, bend: -18, leg: [80, 80], arm: [92, 92], toe: 0, grip: 'weight' },
    ],
  },

  // ── Flexibility ────────────────────────────────────────────────────
  cobra: {
    hold: true,
    poses: [
      { at: [100, 184], torso: 0, head: 0, leg: [180, 180], reach: [146, 189], elbow: -1, toe: 180 },
      { at: [100, 184], torso: -32, head: -50, bend: -8, leg: [180, 180], reach: [138, 189], elbow: -1, toe: 180 },
    ],
  },
  'seated-forward-fold': {
    hold: true,
    poses: [
      { at: [90, 184], torso: -90, leg: [0, 0], arm: [0, 0], toe: -90 },
      { at: [90, 184], torso: -22, head: -10, bend: -6, leg: [0, 0], reach: [178, 180], toe: -90 },
    ],
  },
  'standing-pike': {
    hold: true,
    poses: [
      { ...STAND, arm: [-95, -95] },
      { at: [120, 188], anchor: 'ankle', torso: 45, head: 85, bend: -12, leg: [80, 80], arm: [95, 95], toe: 0 },
    ],
  },
  'half-split': {
    hold: true,
    poses: [
      { at: [100, 150], torso: -90, leg: [29, 29], leg2: [90, 180], arm: [90, 90], toe: -60, toe2: 175 },
      { at: [94, 152], torso: -15, head: -5, bend: -6, leg: [27, 27], leg2: [85, 180], reach: [150, 189], toe: -60, toe2: 175 },
    ],
  },
  'couch-stretch': {
    props: [{ t: 'wall', x: 50 }],
    hold: true,
    poses: [
      { at: [75, 152], torso: -55, head: -45, step2: [130, 188], knee2: -1, leg: [120, -90], reach: [116, 150], toe: 180, toe2: 0 },
      { at: [75, 152], torso: -95, head: -90, step2: [130, 188], knee2: -1, leg: [120, -90], arm: [92, 92], toe: 180, toe2: 0 },
    ],
  },
  pigeon: {
    hold: true,
    poses: [
      { at: [110, 172], torso: -80, leg: [20, 180], leg2: [176, 180], reach: [135, 189], elbow: -1, toe: 180, toe2: 180 },
      { at: [110, 172], torso: -8, head: 0, leg: [20, 180], leg2: [176, 180], arm: [-5, -5], toe: 180, toe2: 180 },
    ],
  },
  'butterfly-stretch': {
    caption: 'Front view',
    front: true,
    hold: true,
    poses: [
      { at: [120, 176], torso: -90, leg: [-10, 160], leg2: [190, 20], reach: [124, 180], reach2: [116, 180], toe: 160, toe2: 20 },
      { at: [120, 176], torso: -90, torsoScale: 0.7, leg: [12, 170], leg2: [168, 10], reach: [124, 182], reach2: [116, 182], toe: 170, toe2: 10 },
    ],
  },
  'frog-stretch': {
    caption: 'Seen from above',
    noFloor: true,
    hold: true,
    poses: [
      { at: [120, 112], torso: -90, leg: [0, 90], leg2: [180, 90], arm: [-60, -100], arm2: [-120, -80], toe: 90, toe2: 90 },
      { at: [120, 122], torso: -90, leg: [-8, 90], leg2: [188, 90], arm: [-65, -100], arm2: [-115, -80], toe: 90, toe2: 90 },
    ],
  },
  pancake: {
    caption: 'Front view',
    front: true,
    hold: true,
    poses: [
      { at: [120, 180], torso: -90, leg: [8, 8], leg2: [172, 172], arm: [95, 95], arm2: [85, 85], toe: -90, toe2: -90 },
      { at: [120, 180], torso: -90, torsoScale: 0.45, head: -90, leg: [8, 8], leg2: [172, 172], arm: [60, 70], arm2: [120, 110], toe: -90, toe2: -90 },
    ],
  },
  bridge: {
    hold: true,
    poses: [
      { at: [165, 188], anchor: 'ankle', torso: 180, head: 180, leg: [-47, 70], reach: [92, 186], elbow: 1, toe: 0 },
      { at: [165, 188], anchor: 'ankle', torso: 150, head: 120, bend: 10, leg: [30, 100], reach: [70, 189], elbow: 1, toe: 0 },
    ],
  },

  // ── More push-ups ──────────────────────────────────────────────────
  pushup: { poses: [pu(20), pu(8)] },
  'high-plank': { hold: true, poses: [pu(20)] },
  'hand-release-pushup': {
    poses: [pu(20), pu(8), pu(1), pu(1, { reach: undefined, arm: [-6, -6] })],
  },
  'spiderman-pushup': {
    poses: [pu(20), pu(8, { anchor: 'ankle2', leg: [-12, 165], leg2: [172, 172], toe: 165, toe2: 80 })],
  },
  'typewriter-pushup': {
    caption: 'Front view',
    front: true,
    hideLegs: true,
    poses: [
      { at: [120, 152], torso: -90, torsoScale: 0.12, reach: [178, 189], reach2: [62, 189], elbow: -1, elbow2: 1 },
      { at: [154, 174], torso: -90, torsoScale: 0.12, reach: [178, 189], reach2: [62, 189], elbow: -1, elbow2: 1 },
      { at: [86, 174], torso: -90, torsoScale: 0.12, reach: [178, 189], reach2: [62, 189], elbow: -1, elbow2: 1 },
    ],
  },
  'hindu-pushup': {
    poses: [
      { at: [60, 188], anchor: 'ankle', torso: 45, head: 75, leg: [115, 115], reach: [159, 189], elbow: 1, toe: 30 },
      { at: [48, 186], anchor: 'ankle', torso: -6, head: -4, leg: [174, 174], reach: [159, 189], elbow: 1, toe: 80 },
      { at: [50, 186], anchor: 'ankle', torso: -65, head: -80, leg: [180, 180], reach: [159, 189], elbow: 1, toe: 180 },
    ],
  },
  'dive-bomber-pushup': {
    poses: [
      { at: [60, 188], anchor: 'ankle', torso: 45, head: 75, leg: [115, 115], reach: [159, 189], elbow: 1, toe: 30 },
      { at: [48, 186], anchor: 'ankle', torso: -6, head: -4, leg: [174, 174], reach: [159, 189], elbow: 1, toe: 80 },
      { at: [50, 186], anchor: 'ankle', torso: -65, head: -80, leg: [180, 180], reach: [159, 189], elbow: 1, toe: 180 },
      { at: [48, 186], anchor: 'ankle', torso: -6, head: -4, leg: [174, 174], reach: [159, 189], elbow: 1, toe: 80 },
    ],
  },
  'plank-up-down': {
    poses: [
      { at: [40, 182], anchor: 'ankle', torso: -10, leg: [170, 170], arm: [90, 0], toe: 80 },
      { at: [40, 182], anchor: 'ankle', torso: -20, leg: [160, 160], arm: [90, 90], toe: 80 },
    ],
  },
  'plank-shoulder-tap': {
    poses: [pu(20), pu(20, { reach: undefined, reach2: PU_HAND, arm: [120, -60] })],
  },
  'tuck-planche-pushup': { poses: [pl(15, [60, 175], undefined, 6), { ...pl(10, [60, 175], undefined, 6), arm: [175, 60] }] },
  'planche-pushup': { poses: [pl(0, [180, 180]), { ...pl(0, [180, 180]), arm: [175, 60] }] },

  // ── More handstands ────────────────────────────────────────────────
  'deficit-hspu': {
    props: parallettes,
    poses: [
      { at: [120, 76], torso: 90, head: 80, reach: [120, 172], elbow: 1, leg: [-90, -90], toe: -90 },
      { at: [126, 112], torso: 82, head: 72, reach: [120, 172], elbow: 1, leg: [-96, -96], toe: -96 },
    ],
  },
  'wall-walk': {
    props: [{ t: 'wall', x: 30 }],
    poses: [
      { at: [153, 189], anchor: 'hand', torso: -20, arm: [90, 90], leg: [160, 160], toe: 80 },
      { at: [120, 189], anchor: 'hand', torso: 40, head: 60, arm: [95, 95], leg: [-140, -140], toe: 180 },
      { at: [44, 189], anchor: 'hand', torso: 91, head: 80, arm: [90, 90], leg: [-89, -89], toe: -89 },
    ],
  },
  'back-to-wall-handstand': {
    props: [{ t: 'wall', x: 98 }],
    hold: true,
    poses: [
      { at: [118, 189], anchor: 'hand', torso: 70, head: 80, arm: [90, 90], leg: [-120, -120], leg2: [100, 100], toe: -120, toe2: 20 },
      { at: [118, 189], anchor: 'hand', torso: 88, head: 95, bend: 4, arm: [90, 90], leg: [-100, -100], toe: -100 },
    ],
  },
  'handstand-walk': {
    poses: [
      { at: [110, 189], anchor: 'hand', torso: 80, head: 70, arm: [95, 95], arm2: [70, 70], leg: [-100, -100], toe: -100 },
      { at: [131, 189], anchor: 'hand2', torso: 80, head: 70, arm: [120, 120], arm2: [95, 95], leg: [-100, -100], toe: -100 },
    ],
  },
  'press-to-handstand': {
    poses: [
      { at: [120, 189], anchor: 'hand', torso: 33, head: 70, arm: [100, 100], leg: [92, 92], toe: 20 },
      { at: [120, 189], anchor: 'hand', torso: 70, head: 75, arm: [95, 95], leg: [-175, -175], toe: -175 },
      { at: [120, 189], anchor: 'hand', torso: 90, head: 80, arm: [90, 90], leg: [-90, -90], toe: -90 },
    ],
  },
  'one-arm-handstand': {
    caption: 'Front view',
    front: true,
    hold: true,
    poses: [
      { at: [120, 189], anchor: 'hand', torso: 90, arm: [90, 90], arm2: [90, 90], leg: [-60, -60], leg2: [-120, -120], toe: -60, toe2: -120 },
      { at: [120, 189], anchor: 'hand', torso: 96, arm: [90, 90], arm2: [170, 170], leg: [-55, -55], leg2: [-125, -125], toe: -55, toe2: -125 },
    ],
  },
  headstand: {
    hold: true,
    poses: [
      { at: [120, 169], anchor: 'shoulder', torso: 90, head: 90, reach: [146, 189], elbow: 1, leg: [40, -70], toe: -70 },
      { at: [120, 169], anchor: 'shoulder', torso: 90, head: 90, reach: [146, 189], elbow: 1, leg: [-90, -90], toe: -90 },
    ],
  },

  // ── More pulling ───────────────────────────────────────────────────
  'jumping-pullup': {
    props: [bar(120), { t: 'box', x: 100, y: 150, w: 64, h: 42 }],
    poses: [
      { at: [120, 14], anchor: 'hand', torso: -90, arm: [-90, -90], leg: [20, 130], toe: 0 },
      { at: [120, 14], anchor: 'hand', torso: -90, arm: [100, -80], leg: [100, 100], toe: 70 },
    ],
  },
  'wide-pullup': {
    caption: 'Front view',
    front: true,
    noFloor: true,
    props: [{ t: 'hbar', x1: 30, x2: 210, y: 18 }],
    poses: [
      { at: [120, 98], torso: -90, reach: [168, 18], reach2: [72, 18], elbow: -1, elbow2: 1, leg: [92, 92], leg2: [88, 88], toe: 0, toe2: 180 },
      { at: [120, 70], torso: -90, reach: [168, 18], reach2: [72, 18], elbow: -1, elbow2: 1, leg: [92, 92], leg2: [88, 88], toe: 0, toe2: 180 },
    ],
  },
  'l-sit-pullup': {
    props: [bar(120)],
    noFloor: true,
    poses: [
      { at: [120, 14], anchor: 'hand', torso: -90, arm: [-90, -90], leg: [0, 0], toe: 0 },
      { at: [120, 14], anchor: 'hand', torso: -90, arm: [100, -80], leg: [0, 0], toe: 0 },
    ],
  },
  'front-lever-row': {
    props: [bar(FL_HAND[0], FL_HAND[1])],
    noFloor: true,
    poses: [fl([-150, 30], undefined, 10), { ...fl([-150, 30], undefined, 10), arm: [40, -110] }],
  },
  'skin-the-cat': {
    props: [bar(BL_HAND[0], BL_HAND[1])],
    noFloor: true,
    poses: [
      { at: BL_HAND, anchor: 'hand', torso: -90, arm: [-90, -90], leg: [92, 92], toe: 70 },
      { at: BL_HAND, anchor: 'hand', torso: 90, head: 95, arm: [-90, -90], leg: [-30, 120], toe: 120 },
      germanHang,
    ],
  },
  'ring-muscle-up': {
    props: ringProps,
    noFloor: true,
    poses: [
      { at: [118, 201], torso: -90, reach: [120, RING_Y], elbow: 1, leg: [92, 92], toe: 70 },
      { at: [108, 128], torso: -50, head: -40, reach: [120, RING_Y], elbow: -1, leg: [70, 110], toe: 80 },
      { at: [120, 101], torso: -90, reach: [120, RING_Y + 1], elbow: 1, leg: [95, 95], toe: 70 },
    ],
  },

  // ── Dips and rings ─────────────────────────────────────────────────
  'ring-support-hold': {
    props: ringProps,
    noFloor: true,
    hold: true,
    poses: [{ at: [120, RING_Y], anchor: 'hand', torso: -90, arm: [92, 92], leg: [96, 96], toe: 75 }],
  },
  'ring-l-sit': {
    props: ringProps,
    noFloor: true,
    hold: true,
    poses: [
      { at: [120, RING_Y], anchor: 'hand', torso: -90, arm: [90, 90], leg: [-60, 100], toe: 90 },
      { at: [120, RING_Y], anchor: 'hand', torso: -90, arm: [90, 90], leg: [0, 0], toe: 0 },
    ],
  },
  'iron-cross': {
    caption: 'Front view',
    front: true,
    noFloor: true,
    hold: true,
    props: [{ t: 'rings', x: 181, y: 60 }, { t: 'rings', x: 59, y: 60 }],
    poses: [{ at: [120, 106], torso: -90, arm: [0, 0], arm2: [180, 180], leg: [92, 92], leg2: [88, 88], toe: 0, toe2: 180 }],
  },
  'russian-dip': {
    props: [{ t: 'hbar', x1: 70, x2: 175, y: 104 }, { t: 'post', x: 78, y1: 104, y2: 192 }, { t: 'post', x: 167, y1: 104, y2: 192 }],
    poses: [
      { at: [122, 104], anchor: 'hand', torso: -90, arm: [92, 92], leg: [96, 120], toe: 75 },
      { at: [122, 104], anchor: 'hand', torso: -60, head: -50, arm: [170, 10], leg: [80, 120], toe: 75 },
      { at: [122, 104], anchor: 'hand', torso: -95, head: -90, arm: [90, 0], leg: [96, 120], toe: 75 },
      { at: [122, 104], anchor: 'hand', torso: -60, head: -50, arm: [170, 10], leg: [80, 120], toe: 75 },
    ],
  },
  'korean-dip': {
    props: [bar(120, 105)],
    noFloor: true,
    poses: [
      { at: [120, 105], anchor: 'hand', torso: -90, arm: [100, 100], leg: [80, 95], toe: 60 },
      { at: [120, 105], anchor: 'hand', torso: -80, head: -75, arm: [-150, 110], leg: [70, 100], toe: 60 },
    ],
  },

  // ── Balances and flags ─────────────────────────────────────────────
  'elbow-lever': {
    hold: true,
    poses: [{ at: [120, 189], anchor: 'hand', torso: -5, head: 0, arm: [165, 90], leg: [178, 178], toe: 180 }],
  },
  manna: {
    props: parallettes,
    hold: true,
    poses: [ls([0, 0]), { at: LS_HAND, anchor: 'hand', torso: -120, head: -100, arm: [60, 60], leg: [-55, -55], toe: -55 }],
  },
  'tuck-human-flag': { props: [pole], front: true, hold: true, caption: 'Front view', poses: [flag([170, 20], [175, 15], 20, 15)] },
  'straddle-human-flag': { props: [pole], front: true, hold: true, caption: 'Front view', poses: [flag([-14, -14], [14, 14])] },
  'human-flag': { props: [pole], front: true, hold: true, caption: 'Front view', poses: [flag([0, 0])] },

  // ── More legs ──────────────────────────────────────────────────────
  'reverse-lunge': {
    poses: [
      { at: [120, 188], anchor: 'ankle', torso: -90, leg: [90, 90], leg2: [90, 90], arm: [92, 92], toe: 0, toe2: 0 },
      { at: [120, 188], anchor: 'ankle', torso: -90, leg: [0, 90], leg2: [108, 175], arm: [92, 92], toe: 0, toe2: 60 },
    ],
  },
  'lateral-lunge': {
    caption: 'Front view',
    front: true,
    poses: [
      { at: [125, 125], torso: -90, step: [170, 188], step2: [80, 188], knee: -1, knee2: 1, arm: [85, 85], arm2: [95, 95], toe: 0, toe2: 180 },
      { at: [150, 150], torso: -80, step: [170, 188], step2: [80, 188], knee: -1, knee2: 1, arm: [100, 60], arm2: [80, 30], toe: 0, toe2: 180 },
    ],
  },
  'skater-squat': {
    poses: [
      { at: [130, 188], anchor: 'ankle', torso: -85, leg: [90, 90], leg2: [100, 200], arm: [0, 0], toe: 0, toe2: 160 },
      { at: [130, 188], anchor: 'ankle', torso: -45, head: -50, leg: [-10, 120], leg2: [120, 185], arm: [-10, -10], toe: 0, toe2: 175 },
    ],
  },
  'sissy-squat': {
    poses: [
      { ...STAND, arm: [0, 0], toe: 20 },
      { at: [120, 188], anchor: 'ankle', torso: -150, head: -120, leg: [30, 149], arm: [-20, -20], toe: 20 },
    ],
  },
  'wall-sit': {
    props: [{ t: 'wall', x: 74 }],
    hold: true,
    poses: [{ at: [118, 188], anchor: 'ankle', torso: -90, head: -90, leg: [0, 90], arm: [60, 10], toe: 0 }],
  },
  'calf-raise': {
    poses: [
      { ...STAND, arm: [92, 92] },
      { at: [120, 180], anchor: 'ankle', torso: -90, arm: [92, 92], leg: [90, 90], toe: 40 },
    ],
  },
  'single-leg-calf-raise': {
    poses: [
      { ...STAND, arm: [92, 92], leg2: [100, 160], toe2: 160 },
      { at: [120, 180], anchor: 'ankle', torso: -90, arm: [92, 92], leg: [90, 90], leg2: [100, 160], toe: 40, toe2: 160 },
    ],
  },
  'reverse-nordic': {
    poses: [
      { at: [120, 186], anchor: 'knee', torso: -90, leg: [90, 180], arm: [92, 92], toe: 180 },
      { at: [120, 186], anchor: 'knee', torso: -120, head: -115, leg: [60, 180], arm: [60, 60], toe: 180 },
    ],
  },
  'single-leg-rdl': {
    poses: [
      { ...STAND, arm: [92, 92] },
      { at: [120, 188], anchor: 'ankle', torso: 8, head: 10, leg: [95, 85], leg2: [-176, -176], arm: [90, 90], toe: 0, toe2: 90 },
    ],
  },

  // ── Conditioning ───────────────────────────────────────────────────
  'jumping-jack': {
    caption: 'Front view',
    front: true,
    poses: [
      { at: [120, 114], torso: -90, arm: [82, 82], arm2: [98, 98], leg: [88, 88], leg2: [92, 92], toe: 0, toe2: 180 },
      { at: [120, 120], torso: -90, arm: [-45, -60], arm2: [-135, -120], leg: [68, 68], leg2: [112, 112], toe: 0, toe2: 180 },
    ],
  },
  'high-knees': {
    poses: [
      { at: [120, 112], torso: -88, leg: [0, 90], leg2: [92, 92], arm: [120, 60], arm2: [60, -30], toe: 20, toe2: 30 },
      { at: [120, 112], torso: -88, leg: [92, 92], leg2: [0, 90], arm: [60, -30], arm2: [120, 60], toe: 30, toe2: 20 },
    ],
  },
  'bear-crawl': {
    poses: [
      { at: [114, 139], torso: 0, reach: [160, 189], reach2: [160, 189], leg: [90, 180], leg2: [90, 180], toe: 90, toe2: 90 },
      { at: [118, 139], torso: 0, reach: [180, 184], reach2: [160, 189], leg: [90, 180], leg2: [70, 165], toe: 90, toe2: 90 },
    ],
  },
  'crab-walk': {
    poses: [
      { at: [160, 188], anchor: 'ankle', torso: -165, head: -170, leg: [-10, 75], reach: [60, 189], elbow: -1, toe: -30 },
      { at: [160, 188], anchor: 'ankle', torso: -170, head: -175, leg: [-20, 70], reach: [70, 189], elbow: -1, toe: -30 },
    ],
  },

  // ── More core ──────────────────────────────────────────────────────
  'reverse-plank': {
    hold: true,
    poses: [{ at: [190, 186], anchor: 'ankle', torso: -158, head: -150, leg: [22, 22], reach: [78, 189], elbow: -1, toe: -60 }],
  },
  'copenhagen-plank': {
    caption: 'Front view',
    front: true,
    hold: true,
    props: bench(170, 60, 145),
    poses: [{ at: [60, 162], anchor: 'shoulder', torso: 175, head: 175, arm: [90, 0], arm2: [20, 100], leg: [-5, -5], leg2: [5, 5], toe: -5, toe2: 5 }],
  },
  'bird-dog': {
    poses: [
      { at: [109, 188], anchor: 'knee', torso: -13, arm: [90, 90], arm2: [90, 90], leg: [90, 180], leg2: [90, 180], toe: 180, toe2: 180 },
      { at: [109, 188], anchor: 'knee', torso: -13, arm: [-5, -5], arm2: [90, 90], leg: [90, 180], leg2: [178, 178], toe: 180, toe2: 178 },
    ],
  },
  'lying-leg-raise': {
    poses: [
      { at: [125, 184], torso: 180, head: 180, arm: [0, 0], leg: [-6, -6], toe: -60 },
      { at: [125, 184], torso: 180, head: 180, arm: [0, 0], leg: [-90, -90], toe: -150 },
    ],
  },
  'flutter-kicks': {
    poses: [
      { at: [125, 184], torso: 180, head: 180, arm: [0, 0], leg: [-6, -6], leg2: [-22, -22], toe: -20, toe2: -36 },
      { at: [125, 184], torso: 180, head: 180, arm: [0, 0], leg: [-22, -22], leg2: [-6, -6], toe: -36, toe2: -20 },
    ],
  },
  'tuck-up': {
    poses: [
      { at: [125, 182], torso: -168, head: -160, bend: 5, arm: [-165, -165], leg: [-14, -14], toe: -14 },
      { at: [125, 186], torso: -120, head: -110, arm: [-20, 40], leg: [-70, 40], toe: 40 },
    ],
  },
  'hollow-rock': {
    poses: [
      { at: [125, 184], torso: -178, head: -170, bend: 5, arm: [-175, -175], leg: [-24, -24], toe: -24 },
      { at: [125, 182], torso: -158, head: -150, bend: 5, arm: [-155, -155], leg: [-4, -4], toe: -4 },
    ],
  },
  'windshield-wiper': {
    caption: 'Front view',
    front: true,
    noFloor: true,
    props: [{ t: 'hbar', x1: 60, x2: 180, y: 18 }],
    poses: [
      { at: [120, 112], torso: -90, reach: [138, 18], reach2: [102, 18], elbow: -1, elbow2: 1, leg: [-50, -50], leg2: [-58, -58], toe: -50, toe2: -58 },
      { at: [120, 112], torso: -90, reach: [138, 18], reach2: [102, 18], elbow: -1, elbow2: 1, leg: [-122, -122], leg2: [-130, -130], toe: -122, toe2: -130 },
    ],
  },

  // ── Warm-ups and stretches ─────────────────────────────────────────
  'butt-kicks': {
    poses: [
      { at: [120, 112], torso: -88, leg: [95, -110], leg2: [92, 92], arm: [120, 60], arm2: [60, -30], toe: -60, toe2: 30 },
      { at: [120, 112], torso: -88, leg: [92, 92], leg2: [95, -110], arm: [60, -30], arm2: [120, 60], toe: 30, toe2: -60 },
    ],
  },
  'thoracic-rotation': {
    poses: [
      { at: [109, 188], anchor: 'knee', torso: -13, head: -10, arm: [90, 90], arm2: [90, 90], leg: [90, 180], leg2: [90, 180], toe: 180, toe2: 180 },
      { at: [109, 188], anchor: 'knee', torso: -13, head: -60, arm: [-95, -95], arm2: [90, 90], leg: [90, 180], leg2: [90, 180], toe: 180, toe2: 180 },
    ],
  },
  'downward-dog': {
    hold: true,
    poses: [
      { at: [109, 188], anchor: 'knee', torso: -13, arm: [90, 90], leg: [90, 180], toe: 90 },
      { at: [60, 188], anchor: 'ankle', torso: 45, head: 75, leg: [115, 115], reach: [159, 189], elbow: 1, toe: 30 },
    ],
  },
  'standing-quad-stretch': {
    hold: true,
    poses: [
      { ...STAND, arm: [92, 92] },
      { ...STAND, arm: [92, 92], leg2: [95, -100], reach2: [112, 112], toe2: -40 },
    ],
  },
}
