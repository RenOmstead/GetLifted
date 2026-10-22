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
      { at: [100, 92], torso: 20, head: 60, leg: [127.8, 127.8], reach: [150, 189], elbow: 1, toe: 55 },
      { at: [106, 92], torso: 65, head: 80, leg: [128.4, 128.4], reach: [150, 189], elbow: 1, toe: 55 },
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
}
