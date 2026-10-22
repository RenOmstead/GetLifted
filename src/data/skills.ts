/**
 * Calisthenics skill progressions. Each level is an exercise with a target;
 * hitting the target in one workout (e.g. 3 sets of 8) unlocks the next level.
 */
export interface SkillLevel {
  exerciseId: string
  sets: number
  reps?: number
  holdSec?: number
}

export interface Skill {
  id: string
  name: string
  group: 'Push' | 'Pull' | 'Legs' | 'Core' | 'Statics' | 'Handstand'
  description: string
  levels: SkillLevel[]
}

const r = (exerciseId: string, sets: number, reps: number): SkillLevel => ({ exerciseId, sets, reps })
const h = (exerciseId: string, sets: number, holdSec: number): SkillLevel => ({ exerciseId, sets, holdSec })

export const SKILLS: Skill[] = [
  {
    id: 'pushup',
    name: 'One-Arm Push-Up',
    group: 'Push',
    description: 'From wall push-ups all the way to a one-arm push-up.',
    levels: [
      r('wall-pushup', 3, 20),
      r('incline-pushup', 3, 15),
      r('knee-pushup', 3, 15),
      r('pushup', 3, 12),
      r('diamond-pushup', 3, 10),
      r('archer-pushup', 3, 6),
      r('pseudo-planche-pushup', 3, 8),
      r('one-arm-pushup', 3, 3),
    ],
  },
  {
    id: 'pullup',
    name: 'One-Arm Pull-Up',
    group: 'Pull',
    description: 'Build a strong hang, your first pull-up, then a one-arm pull-up.',
    levels: [
      h('dead-hang', 3, 30),
      r('scap-pull', 3, 10),
      r('australian-row', 3, 12),
      r('negative-pullup', 3, 5),
      r('pullup', 3, 8),
      r('chest-to-bar-pullup', 3, 6),
      r('archer-pullup', 3, 4),
      r('one-arm-pullup', 1, 1),
    ],
  },
  {
    id: 'muscle-up',
    name: 'Muscle-Up',
    group: 'Pull',
    description: 'Pull high, transition over the bar and press out.',
    levels: [r('pullup', 3, 10), r('straight-bar-dip', 3, 8), r('explosive-pullup', 3, 5), r('negative-muscle-up', 3, 3), r('muscle-up', 3, 3)],
  },
  {
    id: 'dip',
    name: 'Dips',
    group: 'Push',
    description: 'From bench dips to deep, controlled ring dips.',
    levels: [r('bench-dip', 3, 15), h('support-hold', 3, 30), r('negative-dip', 3, 5), r('dip', 3, 10), r('ring-dip', 3, 8)],
  },
  {
    id: 'squat',
    name: 'Pistol Squat',
    group: 'Legs',
    description: 'Single-leg strength and balance, finishing with a pistol and shrimp squat.',
    levels: [
      r('bodyweight-squat', 3, 20),
      r('split-squat', 3, 12),
      r('bulgarian-split-squat', 3, 10),
      r('assisted-pistol', 3, 8),
      r('pistol-squat', 3, 5),
      r('shrimp-squat', 3, 5),
    ],
  },
  {
    id: 'hspu',
    name: 'Handstand Push-Up',
    group: 'Handstand',
    description: 'Overhead pressing strength, from pike push-ups to freestanding.',
    levels: [r('pike-pushup', 3, 10), r('elevated-pike-pushup', 3, 8), r('wall-hspu', 3, 5), r('freestanding-hspu', 3, 3)],
  },
  {
    id: 'handstand',
    name: 'Handstand',
    group: 'Handstand',
    description: 'Learn to stack your body and balance on your hands.',
    levels: [h('plank', 3, 60), h('wall-handstand', 3, 30), h('wall-handstand', 3, 60), h('freestanding-handstand', 3, 15), h('freestanding-handstand', 3, 45)],
  },
  {
    id: 'l-sit',
    name: 'L-Sit to V-Sit',
    group: 'Core',
    description: 'Compression strength and locked-arm support.',
    levels: [h('support-hold', 3, 30), h('tuck-l-sit', 3, 20), h('l-sit', 3, 15), h('v-sit', 3, 5)],
  },
  {
    id: 'core',
    name: 'Dragon Flag',
    group: 'Core',
    description: 'Anti-extension core strength, from hollow holds to dragon flags.',
    levels: [
      h('plank', 3, 60),
      h('hollow-hold', 3, 30),
      r('hanging-knee-raise', 3, 12),
      r('hanging-leg-raise', 3, 10),
      r('toes-to-bar', 3, 10),
      r('dragon-flag-negative', 3, 5),
      r('dragon-flag', 3, 5),
    ],
  },
  {
    id: 'front-lever',
    name: 'Front Lever',
    group: 'Statics',
    description: 'Hold your body horizontal under the bar, face up.',
    levels: [
      h('tuck-front-lever', 3, 15),
      h('adv-tuck-front-lever', 3, 12),
      h('one-leg-front-lever', 3, 10),
      h('straddle-front-lever', 3, 8),
      h('front-lever', 3, 5),
    ],
  },
  {
    id: 'back-lever',
    name: 'Back Lever',
    group: 'Statics',
    description: 'Hold your body horizontal under the bar, face down.',
    levels: [
      h('german-hang', 3, 20),
      h('tuck-back-lever', 3, 15),
      h('adv-tuck-back-lever', 3, 12),
      h('straddle-back-lever', 3, 8),
      h('back-lever', 3, 8),
    ],
  },
  {
    id: 'planche',
    name: 'Planche',
    group: 'Statics',
    description: 'Balance your whole body horizontally on straight arms.',
    levels: [
      h('frog-stand', 3, 30),
      h('planche-lean', 3, 20),
      h('tuck-planche', 3, 15),
      h('adv-tuck-planche', 3, 10),
      h('straddle-planche', 3, 5),
      h('full-planche', 3, 5),
    ],
  },
]

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]))

export function targetLabel(level: SkillLevel): string {
  return level.holdSec != null ? `${level.sets} × ${level.holdSec}s` : `${level.sets} × ${level.reps}`
}
