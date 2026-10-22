import type { ExerciseCategory, TrackType } from '../db/types'

/**
 * Curated exercise library. Every entry has a visual:
 *  - `fedb`: photos (and instructions) from the public-domain Free Exercise DB, or
 *  - `figure`: an animated figure drawn by this app (see src/figures).
 * `steps` are our own instructions; when present they replace the Free Exercise DB text.
 */
export interface ExerciseDef {
  id: string
  name: string
  category: ExerciseCategory
  track: TrackType
  muscles: string[]
  equipment?: string
  perSide?: boolean
  fedb?: string
  figure?: string
  steps?: string[]
  cues?: string[]
}

type Opts = Omit<ExerciseDef, 'id' | 'name' | 'category' | 'track' | 'muscles'>

const make =
  (category: ExerciseCategory) =>
  (id: string, name: string, track: TrackType, muscles: string[], opts: Opts = {}): ExerciseDef => ({
    id,
    name,
    category,
    track,
    muscles,
    ...opts,
  })

const cal = make('calisthenics')
const str = make('strength')
const car = make('cardio')
const mob = make('mobility')
const flex = make('flexibility')

const BAR = 'pull-up bar'
const BARS = 'parallel bars'
const BODY = 'body only'

export const EXERCISES: ExerciseDef[] = [
  // ── Push ───────────────────────────────────────────────────────────
  cal('wall-pushup', 'Wall Push-Up', 'reps', ['chest', 'triceps', 'shoulders'], {
    equipment: BODY,
    figure: 'wall-pushup',
    steps: [
      'Stand an arm’s length from a wall and place your hands on it at shoulder height, a little wider than your shoulders.',
      'Walk your feet back until your body leans in a straight line from head to heels.',
      'Bend your elbows and bring your chest toward the wall, elbows angled about 45° from your body.',
      'Press back until your arms are straight.',
    ],
    cues: ['Squeeze your glutes so your hips don’t sag', 'Move slowly: 2 seconds down, 1 second up'],
  }),
  cal('incline-pushup', 'Incline Push-Up', 'reps', ['chest', 'triceps', 'shoulders'], {
    equipment: 'bench or box',
    fedb: 'Incline_Push-Up',
    cues: ['The higher the surface, the easier it is', 'Keep your body in one straight line'],
  }),
  cal('knee-pushup', 'Knee Push-Up', 'reps', ['chest', 'triceps', 'shoulders'], {
    equipment: BODY,
    figure: 'knee-pushup',
    steps: [
      'Start on your hands and knees, hands slightly wider than your shoulders.',
      'Walk your hands forward so your body forms a straight line from knees to head.',
      'Lower your chest to just above the floor, elbows about 45° from your body.',
      'Press back up to straight arms.',
    ],
    cues: ['Keep your hips in line with your shoulders and knees', 'Touch your chest down lightly, don’t rest'],
  }),
  cal('pushup', 'Push-Up', 'reps', ['chest', 'triceps', 'shoulders'], {
    equipment: BODY,
    fedb: 'Pushups',
    cues: ['Body in one straight line: brace your abs and squeeze your glutes', 'Elbows about 45° from your body', 'Chest to a fist’s height from the floor'],
  }),
  cal('diamond-pushup', 'Diamond Push-Up', 'reps', ['triceps', 'chest'], {
    equipment: BODY,
    fedb: 'Push-Ups_-_Close_Triceps_Position',
    cues: ['Hands close together under your chest', 'Keep your elbows tucked along your ribs'],
  }),
  cal('decline-pushup', 'Decline Push-Up', 'reps', ['chest', 'shoulders', 'triceps'], {
    equipment: 'bench or box',
    fedb: 'Push-Ups_With_Feet_Elevated',
  }),
  cal('archer-pushup', 'Archer Push-Up', 'reps', ['chest', 'triceps', 'shoulders'], {
    equipment: BODY,
    perSide: true,
    figure: 'archer-pushup',
    steps: [
      'Set up in a push-up with your hands about twice shoulder-width apart, fingers turned slightly out.',
      'Shift your weight toward one hand and bend that elbow as you lower your chest beside it.',
      'Keep the other arm almost straight, sliding out to the side like drawing a bow.',
      'Push back up through the bent arm and repeat on the other side.',
    ],
    cues: ['The straight arm only assists; the bent arm does the work', 'Keep your hips square to the floor'],
  }),
  cal('pseudo-planche-pushup', 'Pseudo Planche Push-Up', 'reps', ['chest', 'shoulders', 'triceps'], {
    equipment: BODY,
    figure: 'pseudo-planche-pushup',
    steps: [
      'Set up in a push-up with your hands beside your waist and fingers pointing out or back.',
      'Lean your shoulders forward past your hands and round your upper back slightly.',
      'Keep that lean as you lower your chest toward the floor.',
      'Press back up without losing the forward lean.',
    ],
    cues: ['Lean further to make it harder', 'Lock your elbows at the top and push the floor away'],
  }),
  cal('one-arm-pushup', 'One-Arm Push-Up', 'reps', ['chest', 'triceps', 'shoulders', 'abdominals'], {
    equipment: BODY,
    perSide: true,
    fedb: 'Single-Arm_Push-Up',
    cues: ['Spread your feet wide for balance', 'Fight the rotation: keep your hips and shoulders level'],
  }),
  cal('pike-pushup', 'Pike Push-Up', 'reps', ['shoulders', 'triceps'], {
    equipment: BODY,
    figure: 'pike-pushup',
    steps: [
      'Start in a push-up, then walk your feet in and lift your hips high into an upside-down V.',
      'Bend your elbows and lower the top of your head toward the floor in front of your hands.',
      'Your head, hands and feet form a triangle at the bottom.',
      'Press back up until your arms are straight.',
    ],
    cues: ['The more vertical your torso, the harder it gets', 'Keep your elbows pointing back, not flared out'],
  }),
  cal('elevated-pike-pushup', 'Elevated Pike Push-Up', 'reps', ['shoulders', 'triceps'], {
    equipment: 'box or bench',
    figure: 'elevated-pike-pushup',
    steps: [
      'Put your feet on a box or bench and your hands on the floor, then pike your hips up until your torso is close to vertical.',
      'Lower the top of your head toward the floor just in front of your hands.',
      'Press back to straight arms.',
    ],
    cues: ['A higher box takes you closer to a handstand push-up', 'Lower with control, about 2 seconds'],
  }),
  cal('wall-hspu', 'Wall Handstand Push-Up', 'reps', ['shoulders', 'triceps'], {
    equipment: 'wall',
    fedb: 'Handstand_Push-Ups',
    cues: ['Use a pad or folded mat under your head', 'Hands about 15–25 cm from the wall'],
  }),
  cal('freestanding-hspu', 'Freestanding Handstand Push-Up', 'reps', ['shoulders', 'triceps', 'abdominals'], {
    equipment: BODY,
    figure: 'freestanding-hspu',
    steps: [
      'Kick up into a freestanding handstand and find your balance.',
      'Bend your elbows to lower your head toward the floor, letting your legs tilt slightly to counterbalance.',
      'Press back up to a straight-arm handstand.',
    ],
    cues: ['Master a 30-second freestanding hold first', 'Keep your fingertips active to steer your balance'],
  }),

  // ── Pull ───────────────────────────────────────────────────────────
  cal('dead-hang', 'Dead Hang', 'hold', ['forearms', 'lats', 'shoulders'], {
    equipment: BAR,
    figure: 'dead-hang',
    steps: [
      'Grab the bar with an overhand grip, hands about shoulder-width apart.',
      'Lift your feet and hang with straight arms.',
      'Breathe slowly and hold for the target time.',
    ],
    cues: ['Great for grip strength and decompressing your shoulders', 'Wrap your thumbs around the bar'],
  }),
  cal('scap-pull', 'Scapular Pull-Up', 'reps', ['lats', 'middle back', 'traps'], {
    equipment: BAR,
    fedb: 'Scapular_Pull-Up',
    cues: ['Arms stay straight the whole time', 'Pull your shoulder blades down and together, then relax'],
  }),
  cal('australian-row', 'Australian Row (Inverted Row)', 'reps', ['middle back', 'lats', 'biceps'], {
    equipment: 'low bar or rings',
    fedb: 'Inverted_Row',
    cues: ['Body straight like a plank', 'Pull your chest to the bar; the lower the bar, the harder'],
  }),
  cal('band-assisted-pullup', 'Band-Assisted Pull-Up', 'reps', ['lats', 'biceps'], {
    equipment: 'bar + band',
    fedb: 'Band_Assisted_Pull-Up',
    cues: ['Use a lighter band as you get stronger'],
  }),
  cal('negative-pullup', 'Negative Pull-Up', 'reps', ['lats', 'biceps', 'middle back'], {
    equipment: BAR,
    fedb: 'Pullups',
    steps: [
      'Use a box or jump so your chin starts above the bar.',
      'Hold the top for a moment.',
      'Lower yourself as slowly as you can, 3–5 seconds, until your arms are straight.',
      'Step back up and repeat.',
    ],
    cues: ['The slow lowering builds the strength for full pull-ups', 'Stay controlled all the way to the bottom'],
  }),
  cal('pullup', 'Pull-Up', 'reps', ['lats', 'biceps', 'middle back'], {
    equipment: BAR,
    fedb: 'Pullups',
    cues: ['Start from a dead hang with straight arms', 'Pull your chest toward the bar and drive your elbows down', 'Chin clears the bar every rep'],
  }),
  cal('chinup', 'Chin-Up', 'reps', ['biceps', 'lats'], {
    equipment: BAR,
    fedb: 'Chin-Up',
    cues: ['Palms facing you, shoulder-width apart'],
  }),
  cal('chest-to-bar-pullup', 'Chest-to-Bar Pull-Up', 'reps', ['lats', 'middle back', 'biceps'], {
    equipment: BAR,
    fedb: 'Pullups',
    steps: [
      'Hang from the bar with an overhand grip, slightly wider than your shoulders.',
      'Pull explosively, leaning back slightly, until your upper chest touches the bar.',
      'Lower with control to straight arms.',
    ],
    cues: ['Squeeze your shoulder blades together at the top'],
  }),
  cal('archer-pullup', 'Archer Pull-Up', 'reps', ['lats', 'biceps'], {
    equipment: BAR,
    perSide: true,
    figure: 'archer-pullup',
    steps: [
      'Hang from the bar with a very wide grip.',
      'Pull toward one hand, bending that arm while the other arm stays almost straight along the bar.',
      'Lower with control and alternate sides.',
    ],
    cues: ['The straight arm only helps; it builds toward a one-arm pull-up'],
  }),
  cal('one-arm-pullup', 'One-Arm Pull-Up', 'reps', ['lats', 'biceps', 'forearms'], {
    equipment: BAR,
    perSide: true,
    fedb: 'One_Arm_Chin-Up',
    cues: ['Squeeze your shoulder down first, then pull', 'Bring your free hand to your chest or hip'],
  }),
  cal('explosive-pullup', 'Explosive Pull-Up', 'reps', ['lats', 'biceps'], {
    equipment: BAR,
    fedb: 'Pullups',
    steps: [
      'Hang from the bar with a shoulder-width overhand grip.',
      'Pull as hard and fast as you can, aiming to bring the bar to your lower chest or waist.',
      'Lower with control and reset before the next rep.',
    ],
    cues: ['Height is the goal; this builds toward a muscle-up'],
  }),
  cal('straight-bar-dip', 'Straight Bar Dip', 'reps', ['chest', 'triceps', 'shoulders'], {
    equipment: BAR,
    figure: 'straight-bar-dip',
    steps: [
      'Jump to support yourself on top of a straight bar, arms locked and the bar at your hips.',
      'Lean forward and bend your elbows to lower your chest toward the bar.',
      'Press back up to locked arms.',
    ],
    cues: ['This is the top half of a muscle-up', 'Keep your legs slightly in front to balance'],
  }),
  cal('negative-muscle-up', 'Negative Muscle-Up', 'reps', ['lats', 'chest', 'triceps'], {
    equipment: BAR,
    fedb: 'Muscle_Up',
    steps: [
      'Jump to the top support position above the bar.',
      'Lower slowly through the dip, then lean back through the transition and down into the pull-up.',
      'Finish in a dead hang and repeat.',
    ],
    cues: ['Fight the drop through the transition, it’s the hardest part'],
  }),
  cal('muscle-up', 'Muscle-Up', 'reps', ['lats', 'chest', 'triceps', 'shoulders'], {
    equipment: BAR,
    fedb: 'Muscle_Up',
    cues: ['Pull high and close to the bar', 'Quickly roll your wrists and chest over the bar', 'Finish with a dip to locked arms'],
  }),

  // ── Dips ───────────────────────────────────────────────────────────
  cal('bench-dip', 'Bench Dip', 'reps', ['triceps', 'chest'], {
    equipment: 'bench',
    fedb: 'Bench_Dips',
  }),
  cal('support-hold', 'Support Hold', 'hold', ['triceps', 'shoulders', 'chest'], {
    equipment: BARS,
    figure: 'support-hold',
    steps: [
      'Grip the parallel bars and jump up to straight arms.',
      'Press your shoulders down away from your ears.',
      'Hold still with your body straight or knees slightly bent.',
    ],
    cues: ['Lock your elbows', 'Your first step toward dips'],
  }),
  cal('negative-dip', 'Negative Dip', 'reps', ['triceps', 'chest', 'shoulders'], {
    equipment: BARS,
    fedb: 'Parallel_Bar_Dip',
    steps: [
      'Start at the top of a dip with your arms locked.',
      'Lower yourself slowly over 3–5 seconds until your shoulders are just below your elbows.',
      'Step or jump back to the top and repeat.',
    ],
  }),
  cal('dip', 'Dip', 'reps', ['triceps', 'chest', 'shoulders'], {
    equipment: BARS,
    fedb: 'Parallel_Bar_Dip',
    cues: ['Lean forward slightly', 'Go down until your shoulders are just below your elbows', 'Lock out at the top'],
  }),
  cal('ring-dip', 'Ring Dip', 'reps', ['triceps', 'chest', 'shoulders'], {
    equipment: 'rings',
    fedb: 'Ring_Dips',
    cues: ['Turn the rings out at the top', 'Keep the rings close to your body'],
  }),

  // ── Legs ───────────────────────────────────────────────────────────
  cal('bodyweight-squat', 'Bodyweight Squat', 'reps', ['quadriceps', 'glutes'], {
    equipment: BODY,
    fedb: 'Bodyweight_Squat',
    cues: ['Feet shoulder-width, toes slightly out', 'Knees track over your toes', 'Hips below knees if you can'],
  }),
  cal('split-squat', 'Split Squat', 'reps', ['quadriceps', 'glutes'], {
    equipment: BODY,
    perSide: true,
    fedb: 'Split_Squats',
  }),
  cal('bulgarian-split-squat', 'Bulgarian Split Squat', 'reps', ['quadriceps', 'glutes', 'hamstrings'], {
    equipment: 'bench',
    perSide: true,
    figure: 'bulgarian-split-squat',
    steps: [
      'Stand about two steps in front of a bench and rest the top of your back foot on it.',
      'Lower straight down until your back knee nearly touches the floor.',
      'Drive through your front heel to stand back up.',
    ],
    cues: ['Most of your weight stays on the front leg', 'Hold dumbbells to add load'],
  }),
  cal('walking-lunge', 'Walking Lunge', 'reps', ['quadriceps', 'glutes'], {
    equipment: BODY,
    fedb: 'Bodyweight_Walking_Lunge',
  }),
  cal('jump-squat', 'Jump Squat', 'reps', ['quadriceps', 'glutes', 'calves'], {
    equipment: BODY,
    fedb: 'Freehand_Jump_Squat',
  }),
  cal('assisted-pistol', 'Assisted Pistol Squat', 'reps', ['quadriceps', 'glutes'], {
    equipment: 'pole, doorframe or TRX',
    perSide: true,
    figure: 'assisted-pistol',
    steps: [
      'Stand on one leg holding a pole, doorframe or straps, with the other leg reaching forward.',
      'Sit down and back on the standing leg as low as you can control, using your hands only as much as needed.',
      'Stand back up, pulling lightly with your arms if you need to.',
    ],
    cues: ['Keep your standing heel on the floor', 'Use your arms less as you get stronger'],
  }),
  cal('pistol-squat', 'Pistol Squat', 'reps', ['quadriceps', 'glutes', 'abdominals'], {
    equipment: BODY,
    perSide: true,
    figure: 'pistol-squat',
    steps: [
      'Stand on one leg with the other leg held straight out in front and your arms reaching forward.',
      'Sit all the way down on the standing leg, keeping your heel down.',
      'Drive back up to standing without letting the raised foot touch the floor.',
    ],
    cues: ['Reach your arms forward to counterbalance', 'Knee tracks over your toes'],
  }),
  cal('shrimp-squat', 'Shrimp Squat', 'reps', ['quadriceps', 'glutes'], {
    equipment: BODY,
    perSide: true,
    figure: 'shrimp-squat',
    steps: [
      'Stand on one leg, bend the other knee and hold that foot behind you.',
      'Lower until the back knee lightly touches the floor.',
      'Stand back up through the front leg.',
    ],
    cues: ['Lean your chest forward for balance'],
  }),
  cal('nordic-curl', 'Nordic Hamstring Curl', 'reps', ['hamstrings', 'glutes'], {
    equipment: 'anchor for heels',
    fedb: 'Natural_Glute_Ham_Raise',
    cues: ['Lower as slowly as you can', 'Keep your hips straight, don’t bend at the waist'],
  }),
  cal('glute-bridge', 'Glute Bridge', 'reps', ['glutes', 'hamstrings'], { equipment: BODY, fedb: 'Butt_Lift_Bridge' }),
  cal('single-leg-glute-bridge', 'Single-Leg Glute Bridge', 'reps', ['glutes', 'hamstrings'], {
    equipment: BODY,
    perSide: true,
    fedb: 'Single_Leg_Glute_Bridge',
  }),
  cal('burpee', 'Burpee', 'reps', ['quadriceps', 'chest', 'shoulders'], {
    equipment: BODY,
    figure: 'burpee',
    steps: [
      'Stand tall, then squat down and put your hands on the floor.',
      'Jump your feet back into a push-up position and do a push-up.',
      'Jump your feet back to your hands.',
      'Jump up with your arms overhead.',
    ],
  }),

  // ── Core ───────────────────────────────────────────────────────────
  cal('plank', 'Plank', 'hold', ['abdominals'], {
    equipment: BODY,
    fedb: 'Plank',
    cues: ['Elbows under shoulders', 'Squeeze your glutes and pull your belly button in'],
  }),
  cal('side-plank', 'Side Plank', 'hold', ['abdominals'], { equipment: BODY, perSide: true, fedb: 'Side_Bridge' }),
  cal('hollow-hold', 'Hollow Body Hold', 'hold', ['abdominals'], {
    equipment: BODY,
    figure: 'hollow-hold',
    steps: [
      'Lie on your back with your arms overhead and legs straight.',
      'Press your lower back into the floor.',
      'Lift your arms, shoulders and legs a few centimetres off the floor so your body curves like a shallow banana.',
      'Hold without letting your lower back lift.',
    ],
    cues: ['Bend your knees or bring your arms forward to make it easier', 'The foundation for levers and handstands'],
  }),
  cal('arch-hold', 'Arch Hold (Superman)', 'hold', ['lower back', 'glutes'], { equipment: BODY, fedb: 'Superman' }),
  cal('dead-bug', 'Dead Bug', 'reps', ['abdominals'], { equipment: BODY, fedb: 'Dead_Bug' }),
  cal('hanging-knee-raise', 'Hanging Knee Raise', 'reps', ['abdominals'], {
    equipment: BAR,
    figure: 'hanging-knee-raise',
    steps: [
      'Hang from a bar with straight arms.',
      'Bring your knees up toward your chest, tilting your pelvis up at the top.',
      'Lower slowly without swinging.',
    ],
  }),
  cal('hanging-leg-raise', 'Hanging Leg Raise', 'reps', ['abdominals'], {
    equipment: BAR,
    fedb: 'Hanging_Leg_Raise',
    cues: ['Legs straight, no swinging', 'Raise until your legs are at least parallel to the floor'],
  }),
  cal('toes-to-bar', 'Toes-to-Bar', 'reps', ['abdominals', 'lats'], { equipment: BAR, fedb: 'Hanging_Pike' }),
  cal('ab-wheel', 'Ab Wheel Rollout', 'reps', ['abdominals'], { equipment: 'ab wheel', fedb: 'Ab_Roller' }),
  cal('russian-twist', 'Russian Twist', 'reps', ['abdominals'], { equipment: BODY, fedb: 'Russian_Twist' }),
  cal('mountain-climber', 'Mountain Climber', 'reps', ['abdominals', 'quadriceps'], { equipment: BODY, fedb: 'Mountain_Climbers' }),
  cal('dragon-flag-negative', 'Dragon Flag Negative', 'reps', ['abdominals'], {
    equipment: 'bench',
    figure: 'dragon-flag',
    steps: [
      'Lie on a bench and grip it behind your head.',
      'Swing your body up so you’re resting on your upper back, body straight and legs pointing up.',
      'Lower your straight body as slowly as you can, keeping only your upper back on the bench.',
      'Bend your knees to come back up and repeat.',
    ],
    cues: ['Don’t bend at the hips; move as one straight piece'],
  }),
  cal('dragon-flag', 'Dragon Flag', 'reps', ['abdominals'], {
    equipment: 'bench',
    figure: 'dragon-flag',
    steps: [
      'Lie on a bench and grip it behind your head.',
      'Lift your straight body until only your upper back touches the bench.',
      'Lower until your body hovers just above the bench, then raise it back up without bending your hips.',
    ],
  }),
  cal('tuck-l-sit', 'Tuck L-Sit', 'hold', ['abdominals', 'triceps'], {
    equipment: 'floor, parallettes or dip bars',
    figure: 'tuck-l-sit',
    steps: [
      'Sit between parallettes or dip bars with your hands beside your hips.',
      'Press down to lift your hips off the floor.',
      'Pull your knees into your chest and hold.',
    ],
    cues: ['Push your shoulders down away from your ears', 'Lock your elbows'],
  }),
  cal('l-sit', 'L-Sit', 'hold', ['abdominals', 'triceps', 'quadriceps'], {
    equipment: 'floor, parallettes or dip bars',
    figure: 'l-sit',
    steps: [
      'Press up from parallettes or dip bars with your arms locked.',
      'Extend your legs straight out in front at hip height.',
      'Point your toes and hold.',
    ],
    cues: ['Squeeze your quads to keep your knees straight', 'Shoulders down, chest proud'],
  }),
  cal('v-sit', 'V-Sit', 'hold', ['abdominals', 'triceps', 'shoulders'], {
    equipment: 'floor or parallettes',
    figure: 'v-sit',
    steps: [
      'From an L-sit, lean your shoulders back and push the floor away.',
      'Raise your straight legs up toward your face.',
      'Hold the highest position you can.',
    ],
  }),

  // ── Levers ─────────────────────────────────────────────────────────
  cal('tuck-front-lever', 'Tuck Front Lever', 'hold', ['lats', 'abdominals'], {
    equipment: BAR,
    figure: 'tuck-front-lever',
    steps: [
      'Hang from the bar with an overhand grip.',
      'Pull your straight arms down toward your hips, lifting your body until your back is horizontal and facing the floor.',
      'Keep your knees tucked tight to your chest and hold.',
    ],
    cues: ['Arms stay straight: push the bar toward your hips', 'Back flat and level, hips not sagging'],
  }),
  cal('adv-tuck-front-lever', 'Advanced Tuck Front Lever', 'hold', ['lats', 'abdominals'], {
    equipment: BAR,
    figure: 'adv-tuck-front-lever',
    steps: [
      'Get into a tuck front lever.',
      'Open your hips so your thighs move away from your chest, about 90° to your torso, keeping your back flat.',
      'Hold with your back horizontal.',
    ],
  }),
  cal('one-leg-front-lever', 'One-Leg Front Lever', 'hold', ['lats', 'abdominals'], {
    equipment: BAR,
    perSide: true,
    figure: 'one-leg-front-lever',
    steps: ['From an advanced tuck front lever, extend one leg straight back in line with your body.', 'Keep the other knee tucked.', 'Hold, then switch legs.'],
  }),
  cal('straddle-front-lever', 'Straddle Front Lever', 'hold', ['lats', 'abdominals'], {
    equipment: BAR,
    figure: 'straddle-front-lever',
    steps: ['From an advanced tuck front lever, extend both legs straight and spread them wide.', 'Keep your whole body horizontal and hold.'],
    cues: ['A wider straddle is easier'],
  }),
  cal('front-lever', 'Front Lever', 'hold', ['lats', 'abdominals', 'lower back'], {
    equipment: BAR,
    figure: 'front-lever',
    steps: ['Hang from the bar and pull your straight arms down to lift your whole body horizontal, face up.', 'Legs together and straight, body rigid like a plank.', 'Hold.'],
  }),
  cal('german-hang', 'German Hang (Skin the Cat)', 'hold', ['shoulders', 'chest', 'biceps'], {
    equipment: 'rings or bar',
    figure: 'german-hang',
    steps: [
      'Hang from rings or a bar, tuck your knees and rotate backward between your arms.',
      'Let your legs drop behind you until your shoulders are stretched behind your body.',
      'Hold gently, then reverse the movement back to a hang.',
    ],
    cues: ['Go only as deep as feels comfortable', 'Builds shoulder flexibility for the back lever'],
  }),
  cal('tuck-back-lever', 'Tuck Back Lever', 'hold', ['shoulders', 'chest', 'biceps'], {
    equipment: 'rings or bar',
    figure: 'tuck-back-lever',
    steps: [
      'From a German hang, raise your hips until your back is horizontal and facing up.',
      'Keep your knees tucked to your chest and your arms straight.',
      'Hold.',
    ],
  }),
  cal('adv-tuck-back-lever', 'Advanced Tuck Back Lever', 'hold', ['shoulders', 'chest', 'biceps'], {
    equipment: 'rings or bar',
    figure: 'adv-tuck-back-lever',
    steps: ['From a tuck back lever, open your hips so your thighs move away from your chest.', 'Keep your back flat and horizontal and hold.'],
  }),
  cal('straddle-back-lever', 'Straddle Back Lever', 'hold', ['shoulders', 'chest', 'biceps', 'lower back'], {
    equipment: 'rings or bar',
    figure: 'straddle-back-lever',
    steps: ['From an advanced tuck back lever, extend your legs straight and spread them wide.', 'Keep your body horizontal and hold.'],
  }),
  cal('back-lever', 'Back Lever', 'hold', ['shoulders', 'chest', 'biceps', 'lower back'], {
    equipment: 'rings or bar',
    figure: 'back-lever',
    steps: ['From a German hang, lift your straight body until it’s horizontal, facing down.', 'Legs together, glutes squeezed, arms straight.', 'Hold.'],
  }),

  // ── Planche ────────────────────────────────────────────────────────
  cal('frog-stand', 'Frog Stand', 'hold', ['shoulders', 'forearms', 'abdominals'], {
    equipment: BODY,
    figure: 'frog-stand',
    steps: [
      'Squat down and place your hands flat on the floor, shoulder-width apart.',
      'Rest your knees on the backs of your upper arms.',
      'Lean forward until your feet float off the floor and hold your balance.',
    ],
    cues: ['Look slightly forward, not between your hands', 'Use a pillow in front of you while you learn'],
  }),
  cal('planche-lean', 'Planche Lean', 'hold', ['shoulders', 'chest', 'abdominals'], {
    equipment: BODY,
    figure: 'planche-lean',
    steps: [
      'Start in a push-up position with your fingers pointing out or back.',
      'Lean your shoulders forward past your hands while keeping your arms locked.',
      'Round your upper back slightly, push the floor away and hold.',
    ],
    cues: ['Straight arms, always', 'Lean further to make it harder'],
  }),
  cal('tuck-planche', 'Tuck Planche', 'hold', ['shoulders', 'chest', 'abdominals'], {
    equipment: 'floor or parallettes',
    figure: 'tuck-planche',
    steps: [
      'With your hands on the floor or parallettes, lean forward with locked arms.',
      'Pull your knees to your chest and lift your feet so only your hands touch the floor.',
      'Keep your hips around shoulder height and hold.',
    ],
  }),
  cal('adv-tuck-planche', 'Advanced Tuck Planche', 'hold', ['shoulders', 'chest', 'abdominals'], {
    equipment: 'floor or parallettes',
    figure: 'adv-tuck-planche',
    steps: ['From a tuck planche, flatten your back and push your hips back until they’re level with your shoulders.', 'Keep your knees bent and hold.'],
  }),
  cal('straddle-planche', 'Straddle Planche', 'hold', ['shoulders', 'chest', 'abdominals', 'lower back'], {
    equipment: 'floor or parallettes',
    figure: 'straddle-planche',
    steps: ['From an advanced tuck planche, extend your legs straight back and spread them wide.', 'Keep your body horizontal and hold.'],
  }),
  cal('full-planche', 'Full Planche', 'hold', ['shoulders', 'chest', 'abdominals', 'lower back'], {
    equipment: 'floor or parallettes',
    figure: 'full-planche',
    steps: ['Lean forward on locked arms and lift your whole straight body horizontal, legs together.', 'Hold.'],
  }),

  // ── Handstand ──────────────────────────────────────────────────────
  cal('wall-handstand', 'Chest-to-Wall Handstand', 'hold', ['shoulders', 'abdominals'], {
    equipment: 'wall',
    figure: 'wall-handstand',
    steps: [
      'Stand with your back to a wall and place your hands on the floor in front of you.',
      'Walk your feet up the wall while walking your hands closer, until your chest is close to the wall.',
      'Push tall through your shoulders, squeeze your legs together and hold.',
    ],
    cues: ['Shoulders open: arms by your ears', 'Point your toes and tuck your ribs in'],
  }),
  cal('freestanding-handstand', 'Freestanding Handstand', 'hold', ['shoulders', 'abdominals', 'forearms'], {
    equipment: BODY,
    figure: 'freestanding-handstand',
    steps: [
      'Place your hands shoulder-width apart and kick one leg up, bringing the other to meet it.',
      'Stack your hips over your shoulders and your shoulders over your hands.',
      'Balance with your fingers: press them to stop falling over, your palms to stop falling back.',
    ],
    cues: ['Learn to bail out safely by turning sideways (a cartwheel exit)'],
  }),

  // ── Strength: chest ────────────────────────────────────────────────
  str('bench-press', 'Barbell Bench Press', 'weighted', ['chest', 'triceps', 'shoulders'], {
    equipment: 'barbell + bench',
    fedb: 'Barbell_Bench_Press_-_Medium_Grip',
    cues: ['Shoulder blades squeezed together', 'Bar touches your lower chest', 'Feet planted'],
  }),
  str('incline-bench-press', 'Incline Barbell Bench Press', 'weighted', ['chest', 'shoulders', 'triceps'], {
    equipment: 'barbell + incline bench',
    fedb: 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  }),
  str('db-bench-press', 'Dumbbell Bench Press', 'weighted', ['chest', 'triceps', 'shoulders'], { equipment: 'dumbbells + bench', fedb: 'Dumbbell_Bench_Press' }),
  str('incline-db-press', 'Incline Dumbbell Press', 'weighted', ['chest', 'shoulders', 'triceps'], { equipment: 'dumbbells + incline bench', fedb: 'Incline_Dumbbell_Press' }),
  str('db-fly', 'Dumbbell Fly', 'weighted', ['chest'], { equipment: 'dumbbells + bench', fedb: 'Dumbbell_Flyes' }),
  str('cable-crossover', 'Cable Crossover', 'weighted', ['chest'], { equipment: 'cable machine', fedb: 'Cable_Crossover' }),
  str('machine-chest-press', 'Machine Chest Press', 'weighted', ['chest', 'triceps'], { equipment: 'chest press machine', fedb: 'Leverage_Chest_Press' }),
  str('pec-deck', 'Pec Deck (Machine Fly)', 'weighted', ['chest'], { equipment: 'pec deck machine', fedb: 'Butterfly' }),
  str('smith-bench-press', 'Smith Machine Bench Press', 'weighted', ['chest', 'triceps'], { equipment: 'Smith machine', fedb: 'Smith_Machine_Bench_Press' }),

  // ── Strength: shoulders ────────────────────────────────────────────
  str('overhead-press', 'Overhead Press', 'weighted', ['shoulders', 'triceps'], {
    equipment: 'barbell',
    fedb: 'Standing_Military_Press',
    cues: ['Squeeze your glutes so your back doesn’t arch', 'Move your head back as the bar passes, then push through'],
  }),
  str('db-shoulder-press', 'Dumbbell Shoulder Press', 'weighted', ['shoulders', 'triceps'], { equipment: 'dumbbells', fedb: 'Dumbbell_Shoulder_Press' }),
  str('machine-shoulder-press', 'Machine Shoulder Press', 'weighted', ['shoulders', 'triceps'], { equipment: 'shoulder press machine', fedb: 'Machine_Shoulder_Military_Press' }),
  str('lateral-raise', 'Lateral Raise', 'weighted', ['shoulders'], { equipment: 'dumbbells', fedb: 'Side_Lateral_Raise' }),
  str('face-pull', 'Face Pull', 'weighted', ['shoulders', 'middle back'], { equipment: 'cable + rope', fedb: 'Face_Pull' }),
  str('reverse-fly-machine', 'Reverse Fly Machine', 'weighted', ['shoulders', 'middle back'], { equipment: 'pec deck machine', fedb: 'Reverse_Machine_Flyes' }),
  str('shrug', 'Barbell Shrug', 'weighted', ['traps'], { equipment: 'barbell', fedb: 'Barbell_Shrug' }),

  // ── Strength: legs ─────────────────────────────────────────────────
  str('back-squat', 'Barbell Back Squat', 'weighted', ['quadriceps', 'glutes', 'hamstrings'], {
    equipment: 'barbell + rack',
    fedb: 'Barbell_Full_Squat',
    cues: ['Brace your core before each rep', 'Knees follow your toes', 'Drive up through your whole foot'],
  }),
  str('front-squat', 'Front Squat', 'weighted', ['quadriceps', 'glutes'], { equipment: 'barbell + rack', fedb: 'Front_Barbell_Squat' }),
  str('goblet-squat', 'Goblet Squat', 'weighted', ['quadriceps', 'glutes'], { equipment: 'dumbbell or kettlebell', fedb: 'Goblet_Squat' }),
  str('hack-squat', 'Hack Squat Machine', 'weighted', ['quadriceps', 'glutes'], { equipment: 'hack squat machine', fedb: 'Hack_Squat' }),
  str('smith-squat', 'Smith Machine Squat', 'weighted', ['quadriceps', 'glutes'], { equipment: 'Smith machine', fedb: 'Smith_Machine_Squat' }),
  str('leg-press', 'Leg Press', 'weighted', ['quadriceps', 'glutes'], {
    equipment: 'leg press machine',
    fedb: 'Leg_Press',
    cues: ['Don’t let your lower back peel off the pad', 'Don’t lock your knees hard at the top'],
  }),
  str('deadlift', 'Deadlift', 'weighted', ['lower back', 'hamstrings', 'glutes'], {
    equipment: 'barbell',
    fedb: 'Barbell_Deadlift',
    cues: ['Bar over mid-foot', 'Flat back: chest up, hips hinge', 'Push the floor away and lock out with your glutes'],
  }),
  str('romanian-deadlift', 'Romanian Deadlift', 'weighted', ['hamstrings', 'glutes', 'lower back'], { equipment: 'barbell or dumbbells', fedb: 'Romanian_Deadlift' }),
  str('hip-thrust', 'Barbell Hip Thrust', 'weighted', ['glutes', 'hamstrings'], { equipment: 'barbell + bench', fedb: 'Barbell_Hip_Thrust' }),
  str('db-lunge', 'Dumbbell Lunge', 'weighted', ['quadriceps', 'glutes'], { equipment: 'dumbbells', perSide: true, fedb: 'Dumbbell_Lunges' }),
  str('db-split-squat', 'Dumbbell Split Squat', 'weighted', ['quadriceps', 'glutes'], { equipment: 'dumbbells', perSide: true, fedb: 'Split_Squat_with_Dumbbells' }),
  str('lying-leg-curl', 'Lying Leg Curl', 'weighted', ['hamstrings'], { equipment: 'leg curl machine', fedb: 'Lying_Leg_Curls' }),
  str('seated-leg-curl', 'Seated Leg Curl', 'weighted', ['hamstrings'], { equipment: 'leg curl machine', fedb: 'Seated_Leg_Curl' }),
  str('leg-extension', 'Leg Extension', 'weighted', ['quadriceps'], { equipment: 'leg extension machine', fedb: 'Leg_Extensions' }),
  str('standing-calf-raise', 'Standing Calf Raise', 'weighted', ['calves'], { equipment: 'calf raise machine', fedb: 'Standing_Calf_Raises' }),
  str('seated-calf-raise', 'Seated Calf Raise', 'weighted', ['calves'], { equipment: 'seated calf machine', fedb: 'Seated_Calf_Raise' }),
  str('hip-abduction', 'Hip Abduction Machine', 'weighted', ['abductors', 'glutes'], { equipment: 'hip abduction machine', fedb: 'Thigh_Abductor' }),
  str('hip-adduction', 'Hip Adduction Machine', 'weighted', ['adductors'], { equipment: 'hip adduction machine', fedb: 'Thigh_Adductor' }),
  str('kettlebell-swing', 'Kettlebell Swing', 'weighted', ['glutes', 'hamstrings', 'lower back'], { equipment: 'kettlebell', fedb: 'One-Arm_Kettlebell_Swings' }),

  // ── Strength: back ─────────────────────────────────────────────────
  str('barbell-row', 'Barbell Row', 'weighted', ['middle back', 'lats', 'biceps'], { equipment: 'barbell', fedb: 'Bent_Over_Barbell_Row' }),
  str('db-row', 'One-Arm Dumbbell Row', 'weighted', ['middle back', 'lats', 'biceps'], { equipment: 'dumbbell + bench', perSide: true, fedb: 'One-Arm_Dumbbell_Row' }),
  str('lat-pulldown', 'Lat Pulldown', 'weighted', ['lats', 'biceps'], {
    equipment: 'lat pulldown machine',
    fedb: 'Wide-Grip_Lat_Pulldown',
    cues: ['Pull the bar to your upper chest', 'Lean back only slightly', 'Control the bar on the way up'],
  }),
  str('seated-cable-row', 'Seated Cable Row', 'weighted', ['middle back', 'lats', 'biceps'], { equipment: 'cable row machine', fedb: 'Seated_Cable_Rows' }),
  str('t-bar-row', 'T-Bar Row', 'weighted', ['middle back', 'lats'], { equipment: 'T-bar row', fedb: 'T-Bar_Row_with_Handle' }),
  str('weighted-pullup', 'Weighted Pull-Up', 'weighted', ['lats', 'biceps'], { equipment: 'bar + belt', fedb: 'Pullups' }),
  str('weighted-dip', 'Weighted Dip', 'weighted', ['triceps', 'chest'], { equipment: 'dip bars + belt', fedb: 'Parallel_Bar_Dip' }),

  // ── Strength: arms ─────────────────────────────────────────────────
  str('barbell-curl', 'Barbell Curl', 'weighted', ['biceps'], { equipment: 'barbell', fedb: 'Barbell_Curl' }),
  str('db-curl', 'Dumbbell Curl', 'weighted', ['biceps'], { equipment: 'dumbbells', fedb: 'Dumbbell_Bicep_Curl' }),
  str('hammer-curl', 'Hammer Curl', 'weighted', ['biceps', 'forearms'], { equipment: 'dumbbells', fedb: 'Hammer_Curls' }),
  str('triceps-pushdown', 'Triceps Pushdown', 'weighted', ['triceps'], { equipment: 'cable machine', fedb: 'Triceps_Pushdown' }),
  str('overhead-triceps-extension', 'Overhead Cable Triceps Extension', 'weighted', ['triceps'], { equipment: 'cable + rope', fedb: 'Cable_Rope_Overhead_Triceps_Extension' }),
  str('skull-crusher', 'Skull Crusher', 'weighted', ['triceps'], { equipment: 'EZ bar + bench', fedb: 'EZ-Bar_Skullcrusher' }),
  str('cable-crunch', 'Cable Crunch', 'weighted', ['abdominals'], { equipment: 'cable machine', fedb: 'Cable_Crunch' }),
  str('farmers-walk', 'Farmer’s Walk', 'weighted', ['forearms', 'traps'], { equipment: 'dumbbells or handles', fedb: 'Farmers_Walk' }),

  // ── Cardio ─────────────────────────────────────────────────────────
  car('run', 'Running', 'cardio', ['quadriceps', 'calves'], { equipment: 'treadmill or outdoors', fedb: 'Running_Treadmill' }),
  car('jog', 'Jogging', 'cardio', ['quadriceps', 'calves'], { equipment: 'treadmill or outdoors', fedb: 'Jogging_Treadmill' }),
  car('walk', 'Walking', 'cardio', ['quadriceps', 'calves'], { equipment: 'treadmill or outdoors', fedb: 'Walking_Treadmill' }),
  car('cycle', 'Cycling', 'cardio', ['quadriceps'], { equipment: 'bike', fedb: 'Bicycling' }),
  car('stationary-bike', 'Stationary Bike', 'cardio', ['quadriceps'], { equipment: 'stationary bike', fedb: 'Bicycling_Stationary' }),
  car('rower', 'Rowing Machine', 'cardio', ['middle back', 'quadriceps'], { equipment: 'rowing machine', fedb: 'Rowing_Stationary' }),
  car('elliptical', 'Elliptical', 'cardio', ['quadriceps'], { equipment: 'elliptical machine', fedb: 'Elliptical_Trainer' }),
  car('stair-climber', 'Stair Climber', 'cardio', ['quadriceps', 'glutes'], { equipment: 'stair machine', fedb: 'Stairmaster' }),
  car('jump-rope', 'Jump Rope', 'cardio', ['calves'], { equipment: 'jump rope', fedb: 'Rope_Jumping' }),

  // ── Mobility: joint drills ─────────────────────────────────────────
  mob('neck-tilts', 'Neck Side Tilts', 'reps', ['neck'], { equipment: BODY, fedb: 'Side_Neck_Stretch' }),
  mob('shoulder-circles', 'Shoulder Circles', 'reps', ['shoulders'], { equipment: BODY, fedb: 'Shoulder_Circles' }),
  mob('arm-circles', 'Arm Circles', 'reps', ['shoulders'], { equipment: BODY, fedb: 'Arm_Circles' }),
  mob('shoulder-pass-through', 'Shoulder Pass-Through', 'reps', ['shoulders', 'chest'], {
    equipment: 'band, broomstick or towel',
    figure: 'shoulder-pass-through',
    steps: [
      'Hold a band or stick in front of your hips with a wide grip.',
      'Keeping your arms straight, raise it overhead and continue all the way behind you.',
      'Bring it back over your head to the front.',
    ],
    cues: ['Use a wider grip if your elbows bend', 'Narrow the grip slowly over weeks'],
  }),
  mob('wall-slide', 'Wall Slide', 'reps', ['shoulders', 'middle back'], {
    equipment: 'wall',
    figure: 'wall-slide',
    steps: [
      'Stand with your back, head and arms against a wall, elbows bent to 90° like a goalpost.',
      'Slide your arms up the wall as high as you can while keeping your back, elbows and wrists in contact.',
      'Slide back down to the start.',
    ],
    cues: ['Keep your lower back from arching off the wall'],
  }),
  mob('chest-opener', 'Chest Opener Swings', 'reps', ['chest', 'shoulders'], { equipment: BODY, fedb: 'Dynamic_Chest_Stretch' }),
  mob('band-pull-apart', 'Band Pull-Apart', 'reps', ['shoulders', 'middle back'], { equipment: 'resistance band', fedb: 'Band_Pull_Apart' }),
  mob('band-external-rotation', 'Band External Rotation', 'reps', ['shoulders'], { equipment: 'resistance band', perSide: true, fedb: 'External_Rotation_with_Band' }),
  mob('elbow-circles', 'Elbow Circles', 'reps', ['forearms'], { equipment: BODY, fedb: 'Elbow_Circles' }),
  mob('wrist-circles', 'Wrist Circles', 'reps', ['forearms'], { equipment: BODY, fedb: 'Wrist_Circles' }),
  mob('wrist-prep', 'Wrist Prep Rocks', 'reps', ['forearms'], {
    equipment: BODY,
    figure: 'wrist-prep',
    steps: [
      'Kneel on all fours with your hands under your shoulders.',
      'Gently rock your body forward and back over your hands.',
      'Repeat with fingers pointing sideways, then backward, and finally on the backs of your hands.',
    ],
    cues: ['Essential before handstands and planche work', 'Stay pain-free; go gently'],
  }),
  mob('cat-cow', 'Cat-Cow', 'reps', ['lower back', 'middle back'], {
    equipment: BODY,
    fedb: 'Cat_Stretch',
    steps: [
      'Start on your hands and knees.',
      'Breathe in as you drop your belly and lift your chest and tailbone (cow).',
      'Breathe out as you round your spine toward the ceiling and tuck your chin (cat).',
      'Move slowly between the two.',
    ],
  }),
  mob('thoracic-open-book', 'Open Book Rotation', 'reps', ['middle back', 'chest'], {
    equipment: BODY,
    perSide: true,
    figure: 'open-book',
    steps: [
      'Lie on your side with your knees bent to 90° and your arms straight out in front, palms together.',
      'Keeping your knees together, sweep your top arm up and over to the other side, rotating your upper back.',
      'Follow your hand with your eyes, pause, then return.',
    ],
  }),
  mob('torso-rotation', 'Standing Torso Rotation', 'reps', ['abdominals', 'lower back'], { equipment: BODY, fedb: 'Torso_Rotation' }),
  mob('hip-circles', 'Standing Hip Circles', 'reps', ['glutes', 'abductors'], { equipment: BODY, fedb: 'Standing_Hip_Circles' }),
  mob('quadruped-hip-circles', 'Quadruped Hip Circles', 'reps', ['glutes', 'abductors'], { equipment: BODY, perSide: true, fedb: 'Hip_Circles_prone' }),
  mob('ninety-ninety', '90/90 Hip Switch', 'reps', ['glutes', 'adductors', 'abductors'], {
    equipment: BODY,
    figure: 'ninety-ninety',
    steps: [
      'Sit with one leg bent 90° in front of you and the other bent 90° out to the side behind you.',
      'Keeping your feet on the floor, lift both knees and rotate them to the other side.',
      'Sit tall in the new position, then switch back.',
    ],
    cues: ['Use your hands behind you at first', 'Work toward doing it hands-free'],
  }),
  mob('worlds-greatest-stretch', 'World’s Greatest Stretch', 'reps', ['hamstrings', 'glutes', 'middle back'], {
    equipment: BODY,
    perSide: true,
    fedb: 'Worlds_Greatest_Stretch',
  }),
  mob('inchworm', 'Inchworm', 'reps', ['hamstrings', 'shoulders', 'abdominals'], { equipment: BODY, fedb: 'Inchworm' }),
  mob('leg-swing-front', 'Leg Swings (Front to Back)', 'reps', ['hamstrings', 'quadriceps'], { equipment: BODY, perSide: true, fedb: 'Front_Leg_Raises' }),
  mob('leg-swing-side', 'Leg Swings (Side to Side)', 'reps', ['adductors', 'abductors'], { equipment: BODY, perSide: true, fedb: 'Side_Leg_Raises' }),
  mob('groiner', 'Groiner', 'reps', ['adductors', 'hamstrings'], { equipment: BODY, fedb: 'Groiners' }),
  mob('cossack-squat', 'Cossack Squat', 'reps', ['adductors', 'quadriceps', 'glutes'], {
    equipment: BODY,
    perSide: true,
    figure: 'cossack-squat',
    steps: [
      'Stand with your feet very wide, toes slightly out.',
      'Shift your weight to one side and squat down on that leg, keeping the other leg straight with its toes pointing up.',
      'Push back to the middle and repeat on the other side.',
    ],
  }),
  mob('deep-squat-hold', 'Deep Squat Hold', 'hold', ['quadriceps', 'glutes', 'calves'], {
    equipment: BODY,
    figure: 'deep-squat-hold',
    steps: [
      'Stand with your feet about shoulder-width apart, toes slightly out.',
      'Sit all the way down into the bottom of a squat with your heels on the floor.',
      'Press your knees out with your elbows, keep your chest up and breathe.',
    ],
    cues: ['Hold onto something in front of you if you tip backward', 'Put small plates under your heels while you build ankle mobility'],
  }),
  mob('knee-circles', 'Knee Circles', 'reps', ['quadriceps', 'hamstrings'], { equipment: BODY, fedb: 'Knee_Circles' }),
  mob('ankle-circles', 'Ankle Circles', 'reps', ['calves'], { equipment: BODY, perSide: true, fedb: 'Ankle_Circles' }),
  mob('knee-to-wall', 'Knee-to-Wall Ankle Mobility', 'reps', ['calves'], {
    equipment: 'wall',
    perSide: true,
    figure: 'knee-to-wall',
    steps: [
      'Kneel facing a wall in a half-kneeling position with your front foot a few centimetres from the wall.',
      'Keeping your heel down, drive your knee forward to touch the wall.',
      'Return and repeat. Move your foot back a little as it gets easier.',
    ],
    cues: ['Heel stays glued to the floor', 'Knee travels over your little toes'],
  }),
  mob('jefferson-curl', 'Jefferson Curl', 'weighted', ['hamstrings', 'lower back'], {
    equipment: 'light weight, box',
    figure: 'jefferson-curl',
    steps: [
      'Stand tall on a box holding a light weight.',
      'Tuck your chin and slowly roll down one vertebra at a time, letting the weight hang toward your toes.',
      'At the bottom, slowly roll back up one vertebra at a time.',
    ],
    cues: ['Start with no weight or very light weight', 'Go slowly, 3–5 seconds each way'],
  }),

  // ── Flexibility: static stretches ──────────────────────────────────
  flex('neck-stretch', 'Side Neck Stretch', 'hold', ['neck'], { equipment: BODY, perSide: true, fedb: 'Side_Neck_Stretch' }),
  flex('cross-body-shoulder', 'Cross-Body Shoulder Stretch', 'hold', ['shoulders'], { equipment: BODY, perSide: true, fedb: 'Shoulder_Stretch' }),
  flex('triceps-stretch', 'Overhead Triceps Stretch', 'hold', ['triceps', 'lats'], { equipment: BODY, perSide: true, fedb: 'Triceps_Stretch' }),
  flex('upper-back-stretch', 'Upper Back Stretch', 'hold', ['middle back'], { equipment: BODY, fedb: 'Upper_Back_Stretch' }),
  flex('childs-pose', 'Child’s Pose', 'hold', ['lower back', 'lats'], { equipment: BODY, fedb: 'Childs_Pose' }),
  flex('cobra', 'Cobra Stretch', 'hold', ['abdominals', 'lower back'], {
    equipment: BODY,
    figure: 'cobra',
    steps: [
      'Lie face down with your hands under your shoulders.',
      'Press your upper body up, keeping your hips on the floor.',
      'Relax your glutes and lower back and breathe.',
    ],
    cues: ['Go only as high as is comfortable for your back'],
  }),
  flex('spinal-twist', 'Lying Spinal Twist', 'hold', ['lower back', 'glutes'], { equipment: BODY, perSide: true, fedb: 'Knee_Across_The_Body' }),
  flex('hamstring-stretch', 'Lying Hamstring Stretch', 'hold', ['hamstrings'], { equipment: BODY, perSide: true, fedb: 'Hamstring_Stretch' }),
  flex('seated-forward-fold', 'Seated Forward Fold', 'hold', ['hamstrings', 'lower back'], {
    equipment: BODY,
    figure: 'seated-forward-fold',
    steps: [
      'Sit with your legs straight in front of you.',
      'Hinge forward from your hips with a long back, reaching toward your toes.',
      'Relax and breathe, folding a little deeper as you exhale.',
    ],
  }),
  flex('standing-pike', 'Standing Pike Fold', 'hold', ['hamstrings', 'calves'], {
    equipment: BODY,
    figure: 'standing-pike',
    steps: [
      'Stand with your feet together and knees straight.',
      'Fold forward from your hips, letting your arms and head hang.',
      'Grab your ankles or calves and gently pull your chest toward your legs.',
    ],
  }),
  flex('half-split', 'Half Split', 'hold', ['hamstrings', 'calves'], {
    equipment: BODY,
    perSide: true,
    figure: 'half-split',
    steps: [
      'Kneel on one knee and straighten your other leg in front, heel on the floor and toes up.',
      'Shift your hips back over your back knee.',
      'Fold your chest over your straight leg with a long back.',
    ],
  }),
  flex('hip-flexor-stretch', 'Kneeling Hip Flexor Stretch', 'hold', ['quadriceps', 'hip flexors'], {
    equipment: BODY,
    perSide: true,
    fedb: 'Kneeling_Hip_Flexor',
    cues: ['Tuck your tailbone under and squeeze the glute of the back leg'],
  }),
  flex('couch-stretch', 'Couch Stretch', 'hold', ['quadriceps', 'hip flexors'], {
    equipment: 'wall or couch',
    perSide: true,
    figure: 'couch-stretch',
    steps: [
      'Kneel with your back knee close to a wall or couch and the top of that foot up against it.',
      'Step your other foot forward into a lunge.',
      'Slowly lift your chest upright and squeeze the glute of the back leg.',
    ],
    cues: ['Intense on the front of the thigh; start with your knee further from the wall'],
  }),
  flex('quad-stretch', 'Elevated Quad Stretch', 'hold', ['quadriceps', 'hip flexors'], { equipment: 'bench or step', perSide: true, fedb: 'Standing_Elevated_Quad_Stretch' }),
  flex('pigeon', 'Pigeon Stretch', 'hold', ['glutes', 'hip flexors'], {
    equipment: BODY,
    perSide: true,
    figure: 'pigeon',
    steps: [
      'From all fours, bring one knee forward behind your wrist and lay that shin across in front of you.',
      'Slide the other leg straight back.',
      'Square your hips, then walk your hands forward and lower your chest toward the floor.',
    ],
  }),
  flex('seated-glute-stretch', 'Seated Glute Stretch', 'hold', ['glutes', 'abductors'], { equipment: BODY, perSide: true, fedb: 'IT_Band_and_Glute_Stretch' }),
  flex('butterfly-stretch', 'Butterfly Stretch', 'hold', ['adductors'], {
    equipment: BODY,
    figure: 'butterfly-stretch',
    steps: [
      'Sit with the soles of your feet together and let your knees fall out to the sides.',
      'Hold your feet and sit tall.',
      'Hinge forward from your hips while pressing your knees gently toward the floor.',
    ],
  }),
  flex('frog-stretch', 'Frog Stretch', 'hold', ['adductors'], {
    equipment: BODY,
    figure: 'frog-stretch',
    steps: [
      'Start on all fours and slide your knees out wide, keeping your knees bent at 90° and your ankles in line with your knees.',
      'Lower onto your forearms.',
      'Gently rock your hips back to deepen the stretch.',
    ],
  }),
  flex('straddle-stretch', 'Seated Straddle (Pancake)', 'hold', ['adductors', 'hamstrings'], {
    equipment: BODY,
    figure: 'pancake',
    steps: [
      'Sit with your legs straight and spread as wide as is comfortable, toes pointing up.',
      'Tilt your hips forward and walk your hands out in front of you.',
      'Lower your chest toward the floor with a long back.',
    ],
  }),
  flex('adductor-stretch', 'Side Lunge Adductor Stretch', 'hold', ['adductors'], {
    equipment: BODY,
    perSide: true,
    figure: 'cossack-squat',
    steps: [
      'Stand with your feet very wide.',
      'Bend one knee and shift your hips toward that side, keeping the other leg straight with its toes up.',
      'Hold where you feel a stretch along the inside of the straight leg.',
    ],
  }),
  flex('calf-stretch', 'Wall Calf Stretch', 'hold', ['calves'], { equipment: 'wall', perSide: true, fedb: 'Calf_Stretch_Hands_Against_Wall' }),
  flex('lat-stretch', 'Hanging Lat Stretch', 'hold', ['lats'], {
    equipment: BAR,
    figure: 'dead-hang',
    steps: [
      'Hang from a bar and let your body relax completely.',
      'Let your shoulders rise toward your ears.',
      'Breathe slowly, letting your ribs and lats lengthen.',
    ],
  }),
  flex('bridge', 'Bridge (Wheel)', 'hold', ['shoulders', 'abdominals', 'hip flexors'], {
    equipment: BODY,
    figure: 'bridge',
    steps: [
      'Lie on your back with your knees bent and feet flat, and place your hands beside your head, fingers pointing toward your shoulders.',
      'Press through your hands and feet to lift your hips and chest.',
      'Straighten your arms as much as you can, pushing your chest toward the wall behind you.',
    ],
    cues: ['Warm up your shoulders and wrists first', 'Start with a glute bridge if this is too much'],
  }),
]

export const EXERCISE_BY_ID: Record<string, ExerciseDef> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  calisthenics: 'Calisthenics',
  strength: 'Strength & machines',
  cardio: 'Cardio',
  mobility: 'Mobility',
  flexibility: 'Flexibility',
}

export const TRACK_LABELS: Record<TrackType, string> = {
  reps: 'Reps',
  weighted: 'Weight × reps',
  hold: 'Hold (seconds)',
  cardio: 'Time & distance',
}
