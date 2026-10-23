import type { ExerciseCategory, TrackType } from '../db/types'

/**
 * Curated exercise library. Every entry has at least one visual:
 *  - a character illustration in src/assets/moves/<id>.webp (see src/lib/art.ts),
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
    figure: 'pushup',
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

  cal('wide-pushup', 'Wide Push-Up', 'reps', ['chest', 'shoulders', 'triceps'], {
    equipment: BODY,
    fedb: 'Push-Up_Wide',
    steps: [
      'Start in a high plank with your hands about one and a half times shoulder-width apart, fingers turned slightly out.',
      'Lower your chest toward the floor between your hands, keeping your body in one straight line.',
      'Press back up to straight arms.',
    ],
    cues: ['More chest, less triceps than a regular push-up', 'Don’t let your elbows flare straight out to the sides'],
  }),
  cal('knuckle-pushup', 'Knuckle Push-Up', 'reps', ['chest', 'triceps', 'forearms'], {
    equipment: BODY,
    figure: 'pushup',
    steps: [
      'Make fists and set them on a mat under your shoulders, knuckles down and thumbs forward.',
      'Brace your body in a straight line from head to heels.',
      'Lower your chest toward the floor, then press back up, keeping your wrists straight.',
    ],
    cues: ['Use a soft mat or folded towel under your knuckles', 'Kind to sore wrists because they stay straight'],
  }),
  cal('fingertip-pushup', 'Fingertip Push-Up', 'reps', ['chest', 'triceps', 'forearms'], {
    equipment: BODY,
    figure: 'pushup',
    steps: [
      'Spread your fingers and press up onto your fingertips, palms lifted off the floor.',
      'Keep your fingers slightly bent and strong, like claws.',
      'Do push-ups as normal while staying on your fingertips.',
    ],
    cues: ['Builds grip and finger strength', 'Start on your knees if your fingers get tired'],
  }),
  cal('hand-release-pushup', 'Hand-Release Push-Up', 'reps', ['chest', 'triceps', 'shoulders'], {
    equipment: BODY,
    figure: 'hand-release-pushup',
    steps: [
      'Lower all the way until your chest and hips rest on the floor.',
      'Lift your hands an inch off the floor for a moment, then put them back under your shoulders.',
      'Press back up to a straight-arm plank in one piece.',
    ],
    cues: ['Guarantees full range of motion every rep', 'Press your body up as one solid plank, not hips first'],
  }),
  cal('clap-pushup', 'Clap Push-Up', 'reps', ['chest', 'triceps', 'shoulders'], {
    equipment: BODY,
    fedb: 'Plyo_Push-up',
    steps: [
      'Start in a high plank and lower into a push-up.',
      'Push up so explosively that your hands leave the floor.',
      'Clap quickly, then catch yourself with soft, bent elbows and go straight into the next rep.',
    ],
    cues: ['Learn on your knees or an incline first', 'Land with bent elbows, never locked arms'],
  }),
  cal('hindu-pushup', 'Hindu Push-Up', 'reps', ['chest', 'shoulders', 'triceps', 'lower back'], {
    equipment: BODY,
    figure: 'hindu-pushup',
    steps: [
      'Start in a downward dog: hands and feet on the floor, hips high, arms and legs straight.',
      'Bend your elbows and swoop your chest down and forward, close to the floor between your hands.',
      'Keep going forward and up into an upward dog: arms straight, chest lifted, hips low.',
      'Push your hips back up to downward dog and repeat.',
    ],
    cues: ['One smooth, wave-like motion', 'Great for shoulder mobility as well as strength'],
  }),
  cal('dive-bomber-pushup', 'Dive Bomber Push-Up', 'reps', ['chest', 'shoulders', 'triceps'], {
    equipment: BODY,
    figure: 'dive-bomber-pushup',
    steps: [
      'Start in a downward dog with hips high.',
      'Swoop your chest down and forward close to the floor, then up into an upward dog.',
      'Reverse the same path: swoop back down and push your hips up to downward dog.',
    ],
    cues: ['Unlike the Hindu push-up, you return along the same path', 'Move slowly, especially on the way back'],
  }),
  cal('spiderman-pushup', 'Spider-Man Push-Up', 'reps', ['chest', 'triceps', 'abdominals', 'obliques'], {
    equipment: BODY,
    figure: 'spiderman-pushup',
    steps: [
      'Start in a high plank.',
      'As you lower, bring one knee out to the side toward the same elbow.',
      'Press up and return the leg, then switch sides on the next rep.',
    ],
    cues: ['Keep your hips low and level', 'Adds a hip-mobility and core challenge'],
  }),
  cal('typewriter-pushup', 'Typewriter Push-Up', 'reps', ['chest', 'triceps', 'shoulders'], {
    equipment: BODY,
    figure: 'typewriter-pushup',
    steps: [
      'Set your hands very wide and lower into a push-up.',
      'At the bottom, shift your chest over to one hand, straightening the other arm.',
      'Slide across, close to the floor, to the other hand, then press back up.',
    ],
    cues: ['A step between archer and one-arm push-ups', 'Stay low as you travel side to side'],
  }),
  cal('t-pushup', 'T Push-Up (Push-Up to Side Plank)', 'reps', ['chest', 'triceps', 'obliques', 'shoulders'], {
    equipment: BODY,
    fedb: 'Push_Up_to_Side_Plank',
    steps: [
      'Do a push-up.',
      'At the top, rotate onto one hand and the sides of your feet, reaching your top arm to the ceiling to make a T.',
      'Return to the plank and repeat to the other side.',
    ],
    cues: ['Hips stay lifted in the side plank', 'Look up at your top hand'],
  }),
  cal('plank-up-down', 'Plank Up-Down', 'reps', ['triceps', 'abdominals', 'shoulders'], {
    equipment: BODY,
    figure: 'plank-up-down',
    steps: [
      'Start in a forearm plank.',
      'Place one hand under your shoulder, then the other, and press up to a high plank.',
      'Lower back down one forearm at a time. Switch the leading arm each rep.',
    ],
    cues: ['Keep your hips from rocking side to side', 'Feet a little wider makes it steadier'],
  }),
  cal('ring-pushup', 'Ring Push-Up', 'reps', ['chest', 'triceps', 'shoulders', 'abdominals'], {
    equipment: 'rings',
    fedb: 'Suspended_Push-Up',
    steps: [
      'Set the rings a few inches off the floor and hold them in a high plank.',
      'Lower your chest between the rings, keeping them close to your body.',
      'Press up and turn your palms slightly forward at the top.',
    ],
    cues: ['The wobble makes your chest and core work harder', 'Higher rings make it easier'],
  }),
  cal('tuck-planche-pushup', 'Tuck Planche Push-Up', 'reps', ['shoulders', 'chest', 'triceps', 'abdominals'], {
    equipment: 'parallettes or floor',
    figure: 'tuck-planche-pushup',
    steps: [
      'Hold a tuck planche: hands on the floor, knees tucked, feet off the floor, shoulders leaning past your hands.',
      'Bend your elbows and lower your chest toward your hands while keeping the tuck.',
      'Press back up to straight arms without letting your feet touch.',
    ],
    cues: ['Lean forward as you lower', 'Master a solid tuck planche hold first'],
  }),
  cal('planche-pushup', 'Planche Push-Up', 'reps', ['shoulders', 'chest', 'triceps', 'abdominals'], {
    equipment: 'parallettes or floor',
    figure: 'planche-pushup',
    steps: [
      'Hold a full or straddle planche with your body straight and parallel to the floor.',
      'Lower your chest toward the floor while keeping your body horizontal.',
      'Press back up to straight arms.',
    ],
    cues: ['One of the hardest pushing skills there is', 'Build up with tuck and straddle planche push-ups'],
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

  cal('active-hang', 'Active Hang', 'hold', ['lats', 'traps', 'forearms'], {
    equipment: BAR,
    figure: 'dead-hang',
    steps: [
      'Hang from the bar with straight arms.',
      'Without bending your elbows, pull your shoulders down away from your ears.',
      'Hold that engaged position for the target time.',
    ],
    cues: ['The top position of a scapular pull-up, held', 'Keeps your shoulders safe in every pull-up'],
  }),
  cal('one-arm-hang', 'One-Arm Hang', 'hold', ['forearms', 'lats', 'shoulders'], {
    equipment: BAR,
    fedb: 'One_Handed_Hang',
    perSide: true,
    steps: [
      'Grab the bar with one hand, overhand.',
      'Lift your feet and hang, keeping that shoulder slightly engaged.',
      'Use your free hand on the bar or a band for help until you can hang alone.',
    ],
    cues: ['Builds the grip and shoulder strength for one-arm pull-ups'],
  }),
  cal('jumping-pullup', 'Jumping Pull-Up', 'reps', ['lats', 'biceps', 'middle back'], {
    equipment: 'bar + box',
    figure: 'jumping-pullup',
    steps: [
      'Stand on a box under the bar and hold it with bent knees.',
      'Jump and pull at the same time until your chin is over the bar.',
      'Lower yourself slowly and land softly back on the box.',
    ],
    cues: ['Use your legs only as much as you need', 'Make the lowering slow; that’s where the strength comes from'],
  }),
  cal('wide-pullup', 'Wide-Grip Pull-Up', 'reps', ['lats', 'middle back', 'biceps'], {
    equipment: BAR,
    figure: 'wide-pullup',
    steps: [
      'Grab the bar overhand with your hands about one and a half times shoulder-width apart.',
      'Pull your chest toward the bar, driving your elbows down and out.',
      'Lower to straight arms with control.',
    ],
    cues: ['Harder than a regular pull-up', 'Hits the outer lats more'],
  }),
  cal('neutral-pullup', 'Neutral-Grip Pull-Up', 'reps', ['lats', 'biceps', 'forearms'], {
    equipment: 'parallel-grip bar',
    fedb: 'V-Bar_Pullup',
    steps: [
      'Hold parallel handles with your palms facing each other.',
      'Pull until your chin passes the handles.',
      'Lower slowly to straight arms.',
    ],
    cues: ['Usually the friendliest grip for elbows and shoulders'],
  }),
  cal('typewriter-pullup', 'Typewriter Pull-Up', 'reps', ['lats', 'biceps', 'middle back'], {
    equipment: BAR,
    fedb: 'Side_To_Side_Chins',
    steps: [
      'Grab the bar with a wide overhand grip and pull up until your chin clears it.',
      'Stay up and slide over toward one hand, straightening the other arm.',
      'Slide across to the other hand, then lower down.',
    ],
    cues: ['A bridge between archer and one-arm pull-ups', 'Keep your chin above the bar as you travel'],
  }),
  cal('l-sit-pullup', 'L-Sit Pull-Up', 'reps', ['lats', 'biceps', 'abdominals', 'hip flexors'], {
    equipment: BAR,
    figure: 'l-sit-pullup',
    steps: [
      'Hang from the bar and lift your straight legs to hip height, making an L.',
      'Pull up while keeping your legs in the L.',
      'Lower down without letting your legs drop.',
    ],
    cues: ['Bend your knees to make it easier', 'Point your toes and squeeze your thighs'],
  }),
  cal('front-lever-row', 'Tuck Front Lever Row', 'reps', ['lats', 'middle back', 'abdominals', 'biceps'], {
    equipment: BAR,
    figure: 'front-lever-row',
    steps: [
      'Hold a tuck front lever under the bar.',
      'Keeping your back flat, pull the bar to your lower chest.',
      'Lower back to straight arms without dropping out of the lever.',
    ],
    cues: ['Builds the pulling strength for a full front lever', 'Lead with your elbows'],
  }),
  cal('skin-the-cat', 'Skin the Cat', 'reps', ['shoulders', 'lats', 'abdominals', 'biceps'], {
    equipment: 'bar or rings',
    figure: 'skin-the-cat',
    steps: [
      'Hang from the bar or rings.',
      'Tuck your knees and roll backward, bringing your legs up and through your arms.',
      'Lower toward a German hang as far as is comfortable, then pull back the way you came.',
    ],
    cues: ['A great shoulder-opening drill', 'Go slowly and only as deep as feels okay'],
  }),
  cal('ring-row', 'Ring Row', 'reps', ['middle back', 'lats', 'biceps'], {
    equipment: 'rings',
    fedb: 'Suspended_Row',
    steps: [
      'Hold the rings and walk your feet forward until your body leans back with straight arms.',
      'Keep your body straight and pull your chest up to the rings.',
      'Lower slowly. Walk your feet further forward to make it harder.',
    ],
    cues: ['Turn your palms in as you pull', 'Squeeze your shoulder blades at the top'],
  }),
  cal('ring-muscle-up', 'Ring Muscle-Up', 'reps', ['lats', 'chest', 'triceps', 'biceps'], {
    equipment: 'rings',
    figure: 'ring-muscle-up',
    steps: [
      'Hang from the rings with a false grip (wrists over the rings).',
      'Pull the rings toward your lower chest, keeping them close to your body.',
      'Lean your chest forward over the rings to transition, then press out of the dip to straight arms.',
    ],
    cues: ['The false grip makes the transition possible', 'Practise transitions with your feet on the floor first'],
  }),
  cal('rope-climb', 'Rope Climb', 'reps', ['lats', 'biceps', 'forearms', 'abdominals'], {
    equipment: 'climbing rope',
    fedb: 'Rope_Climb',
    steps: [
      'Grab the rope high, jump, and wrap it around one leg, pinching it between your feet.',
      'Stand up on your feet, then reach higher with your hands.',
      'Repeat to the top, then climb down hand over hand. Never slide down.',
    ],
    cues: ['Use your legs: it’s a climb, not just a pull', 'Only climb as high as you can safely come down from'],
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

  cal('ring-support-hold', 'Ring Support Hold', 'hold', ['shoulders', 'chest', 'triceps'], {
    equipment: 'rings',
    figure: 'ring-support-hold',
    steps: [
      'Jump up to straight arms above the rings, rings beside your hips.',
      'Squeeze the rings into your sides and turn your palms forward a little.',
      'Hold still with your body straight.',
    ],
    cues: ['The first step for every ring skill', 'Fight the wobble by squeezing hard'],
  }),
  cal('russian-dip', 'Russian Dip', 'reps', ['triceps', 'chest', 'shoulders'], {
    equipment: BARS,
    figure: 'russian-dip',
    steps: [
      'From the top of a dip, lower down as normal.',
      'At the bottom, roll back onto your forearms on the bars.',
      'Roll forward off your forearms and press back up to straight arms.',
    ],
    cues: ['Builds the elbow strength for muscle-ups', 'Move smoothly between hands and forearms'],
  }),
  cal('korean-dip', 'Korean Dip', 'reps', ['shoulders', 'triceps', 'chest'], {
    equipment: 'straight bar',
    figure: 'korean-dip',
    steps: [
      'Hold a bar behind you at hip height and support yourself with straight arms, body in front of the bar.',
      'Bend your elbows and lower your body down in front of the bar.',
      'Press back up to straight arms.',
    ],
    cues: ['A big shoulder stretch: warm up well', 'Start shallow and add depth over time'],
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

  cal('reverse-lunge', 'Reverse Lunge', 'reps', ['quadriceps', 'glutes', 'hamstrings'], {
    equipment: BODY,
    figure: 'reverse-lunge',
    perSide: true,
    steps: [
      'Stand tall with your feet hip-width apart.',
      'Step one foot back and lower until your back knee nearly touches the floor and your front thigh is level.',
      'Push through your front foot to stand back up.',
    ],
    cues: ['Easier on the knees than forward lunges', 'Keep your front knee over your foot'],
  }),
  cal('lateral-lunge', 'Lateral Lunge', 'reps', ['quadriceps', 'glutes', 'adductors'], {
    equipment: BODY,
    figure: 'lateral-lunge',
    perSide: true,
    steps: [
      'Stand with your feet wide apart, toes forward.',
      'Shift your hips back and over to one side, bending that knee while the other leg stays straight.',
      'Push back to the middle and repeat on the other side.',
    ],
    cues: ['Keep both feet flat', 'Chest up, hips back like sitting into a chair'],
  }),
  cal('jumping-lunge', 'Jumping Lunge', 'reps', ['quadriceps', 'glutes', 'calves'], {
    equipment: BODY,
    fedb: 'Split_Jump',
    steps: [
      'Start in a lunge, one foot forward and the back knee near the floor.',
      'Jump straight up and switch your legs in the air.',
      'Land softly in a lunge on the other side and go straight into the next jump.',
    ],
    cues: ['Land quietly with bent knees', 'Count each landing as one rep'],
  }),
  cal('step-up', 'Step-Up', 'reps', ['quadriceps', 'glutes'], {
    equipment: 'box or bench',
    fedb: 'Step-up_with_Knee_Raise',
    perSide: true,
    steps: [
      'Stand facing a box or sturdy bench.',
      'Put one whole foot on the box and push through it to stand up on top.',
      'Step back down with control. Do all reps on one leg, then switch.',
    ],
    cues: ['Push through the top leg, don’t spring off the bottom one', 'A higher box is harder'],
  }),
  cal('box-jump', 'Box Jump', 'reps', ['quadriceps', 'glutes', 'calves'], {
    equipment: 'box',
    fedb: 'Front_Box_Jump',
    steps: [
      'Stand a short step from a sturdy box.',
      'Swing your arms back, dip into a quarter squat and jump onto the box.',
      'Land softly with both feet flat, stand up, then step (don’t jump) back down.',
    ],
    cues: ['Pick a height you can land on easily', 'Land in a quiet half squat'],
  }),
  cal('broad-jump', 'Broad Jump', 'reps', ['quadriceps', 'glutes', 'hamstrings', 'calves'], {
    equipment: BODY,
    fedb: 'Standing_Long_Jump',
    steps: [
      'Stand with your feet hip-width apart.',
      'Swing your arms back, dip, then jump forward as far as you can.',
      'Land softly on both feet with bent knees, then reset.',
    ],
    cues: ['Stick the landing before the next jump', 'Swing your arms forward to go further'],
  }),
  cal('tuck-jump', 'Tuck Jump', 'reps', ['quadriceps', 'glutes', 'calves', 'abdominals'], {
    equipment: BODY,
    fedb: 'Knee_Tuck_Jump',
    steps: [
      'Stand with your knees slightly bent.',
      'Jump as high as you can and pull your knees up toward your chest.',
      'Land softly and go straight into the next jump.',
    ],
    cues: ['Land on the balls of your feet, then heels', 'Quality over speed'],
  }),
  cal('skater-jump', 'Skater Jump', 'reps', ['glutes', 'quadriceps', 'adductors'], {
    equipment: BODY,
    fedb: 'Lateral_Bound',
    steps: [
      'Stand on one leg with a slight bend.',
      'Jump sideways and land on the other foot, swinging the trailing leg behind you.',
      'Bound back and forth like a speed skater.',
    ],
    cues: ['Stick each landing for a moment at first', 'Count each landing as one rep'],
  }),
  cal('box-pistol', 'Box Pistol Squat', 'reps', ['quadriceps', 'glutes'], {
    equipment: 'box or bench',
    fedb: 'Single-Leg_High_Box_Squat',
    perSide: true,
    steps: [
      'Stand on one leg in front of a box or bench, the other leg lifted forward.',
      'Sit back slowly on one leg until you touch the box.',
      'Stand back up on the same leg without rocking.',
    ],
    cues: ['Use a lower box as you get stronger', 'A great step toward a full pistol squat'],
  }),
  cal('skater-squat', 'Skater Squat', 'reps', ['quadriceps', 'glutes'], {
    equipment: BODY,
    figure: 'skater-squat',
    perSide: true,
    steps: [
      'Stand on one leg with the other knee bent so that foot is behind you.',
      'Reach your arms forward and lower until your back knee lightly touches the floor.',
      'Stand back up on the front leg.',
    ],
    cues: ['Put a pillow under the back knee', 'Lean your chest forward to balance'],
  }),
  cal('sissy-squat', 'Sissy Squat', 'reps', ['quadriceps'], {
    equipment: BODY,
    figure: 'sissy-squat',
    steps: [
      'Stand tall, holding something for balance, and rise onto the balls of your feet.',
      'Push your knees forward and lean back, keeping a straight line from knees to head.',
      'Lower as far as you can control, then come back up.',
    ],
    cues: ['Hips stay straight, never bend at the waist', 'Go slowly; this one is tough on the knees'],
  }),
  cal('wall-sit', 'Wall Sit', 'hold', ['quadriceps', 'glutes'], {
    equipment: 'wall',
    figure: 'wall-sit',
    steps: [
      'Stand with your back against a wall and your feet about two feet in front of you.',
      'Slide down until your thighs are level with the floor and your knees are over your ankles.',
      'Hold with your back flat against the wall.',
    ],
    cues: ['Don’t rest your hands on your thighs', 'Higher up is easier'],
  }),
  cal('calf-raise', 'Calf Raise', 'reps', ['calves'], {
    equipment: BODY,
    figure: 'calf-raise',
    steps: [
      'Stand tall, holding a wall or chair for balance.',
      'Rise up onto the balls of your feet as high as you can.',
      'Pause, then lower slowly.',
    ],
    cues: ['Stand on a step to let your heels drop lower', 'Slow on the way down'],
  }),
  cal('single-leg-calf-raise', 'Single-Leg Calf Raise', 'reps', ['calves'], {
    equipment: BODY,
    figure: 'single-leg-calf-raise',
    perSide: true,
    steps: [
      'Stand on one foot, holding a wall for balance, other foot tucked behind.',
      'Rise as high as you can onto the ball of your foot.',
      'Lower slowly and repeat, then switch legs.',
    ],
    cues: ['Twice the work of the two-leg version', 'Full range: all the way up, all the way down'],
  }),
  cal('reverse-nordic', 'Reverse Nordic', 'reps', ['quadriceps', 'hip flexors'], {
    equipment: BODY,
    figure: 'reverse-nordic',
    steps: [
      'Kneel tall on a soft mat with your body straight from knees to head.',
      'Lean back slowly, keeping your hips straight.',
      'Go as far as you can control, then pull yourself back up with your thighs.',
    ],
    cues: ['Squeeze your glutes so you don’t bend at the hips', 'Start with a small lean'],
  }),
  cal('single-leg-rdl', 'Single-Leg Romanian Deadlift', 'reps', ['hamstrings', 'glutes', 'lower back'], {
    equipment: BODY,
    figure: 'single-leg-rdl',
    perSide: true,
    steps: [
      'Stand on one leg with a soft bend in the knee.',
      'Hinge forward at the hips while your other leg reaches back, keeping a straight line from head to back heel.',
      'Stop when your body is near level, then squeeze your glute to stand up.',
    ],
    cues: ['Keep your hips square to the floor', 'Hold a wall to start; add a weight later'],
  }),
  cal('donkey-kick', 'Donkey Kick', 'reps', ['glutes', 'hamstrings'], {
    equipment: BODY,
    fedb: 'Glute_Kickback',
    perSide: true,
    steps: [
      'Start on your hands and knees.',
      'Keeping the knee bent, lift one leg until the thigh is level with your back, sole toward the ceiling.',
      'Squeeze your glute at the top, then lower.',
    ],
    cues: ['Don’t arch your lower back to get higher', 'Slow and squeezed beats fast and high'],
  }),

  // ── Conditioning ───────────────────────────────────────────────────
  cal('jumping-jack', 'Jumping Jack', 'reps', ['calves', 'shoulders', 'glutes'], {
    equipment: BODY,
    figure: 'jumping-jack',
    steps: [
      'Stand with your feet together and arms by your sides.',
      'Jump your feet out wide while raising your arms overhead.',
      'Jump back to the start and repeat at a steady rhythm.',
    ],
    cues: ['Stay light on the balls of your feet', 'Step out instead of jumping for a low-impact version'],
  }),
  cal('star-jump', 'Star Jump', 'reps', ['quadriceps', 'glutes', 'calves', 'shoulders'], {
    equipment: BODY,
    fedb: 'Star_Jump',
    steps: [
      'Squat halfway down with your arms close to your body.',
      'Explode up, spreading your arms and legs wide like a star.',
      'Bring them back together and land softly in a half squat.',
    ],
    cues: ['Land with bent knees', 'Big and explosive, then reset'],
  }),
  cal('high-knees', 'High Knees', 'reps', ['hip flexors', 'quadriceps', 'calves'], {
    equipment: BODY,
    figure: 'high-knees',
    steps: [
      'Run in place, driving each knee up to hip height.',
      'Pump your arms in time with your legs.',
      'Stay on the balls of your feet. Count each knee, or go for time.',
    ],
    cues: ['Tall posture, don’t lean back', 'Quick, light steps'],
  }),
  cal('bear-crawl', 'Bear Crawl', 'reps', ['shoulders', 'abdominals', 'quadriceps'], {
    equipment: BODY,
    figure: 'bear-crawl',
    steps: [
      'Start on your hands and feet with your knees hovering an inch off the floor, back flat.',
      'Crawl forward by moving the opposite hand and foot together.',
      'Keep your knees low and hips level the whole time. Count steps or go for distance.',
    ],
    cues: ['Small steps keep your hips steady', 'Crawl backward for an extra challenge'],
  }),
  cal('crab-walk', 'Crab Walk', 'reps', ['triceps', 'glutes', 'shoulders'], {
    equipment: BODY,
    figure: 'crab-walk',
    steps: [
      'Sit with your knees bent and hands on the floor behind you, fingers pointing toward your feet.',
      'Lift your hips off the floor.',
      'Walk forward or backward on your hands and feet, keeping your hips up.',
    ],
    cues: ['Great for shoulder mobility', 'Squeeze your glutes to keep your hips high'],
  }),

  cal('butt-kicks', 'Butt Kicks', 'reps', ['hamstrings', 'calves'], {
    equipment: BODY,
    figure: 'butt-kicks',
    steps: [
      'Jog in place.',
      'Kick each heel up toward your glutes as you go.',
      'Stay light and quick. Count each kick, or go for time.',
    ],
    cues: ['A great warm-up for your hamstrings', 'Stay tall'],
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

  cal('high-plank', 'High Plank', 'hold', ['abdominals', 'shoulders', 'chest'], {
    equipment: BODY,
    figure: 'high-plank',
    steps: [
      'Get into the top of a push-up: hands under shoulders, arms straight.',
      'Make a straight line from head to heels by bracing your abs and squeezing your glutes.',
      'Hold, breathing steadily.',
    ],
    cues: ['Push the floor away so your upper back is slightly rounded', 'Don’t let your hips sag or pike'],
  }),
  cal('plank-shoulder-tap', 'Plank Shoulder Tap', 'reps', ['abdominals', 'obliques', 'shoulders'], {
    equipment: BODY,
    figure: 'plank-shoulder-tap',
    steps: [
      'Start in a high plank with your feet a little wider than hips.',
      'Lift one hand and tap the opposite shoulder.',
      'Put it back down and tap with the other hand. Keep your hips still.',
    ],
    cues: ['Imagine a glass of water on your lower back', 'Wider feet make it easier'],
  }),
  cal('reverse-plank', 'Reverse Plank', 'hold', ['glutes', 'hamstrings', 'shoulders', 'lower back'], {
    equipment: BODY,
    figure: 'reverse-plank',
    steps: [
      'Sit with your legs straight and hands on the floor behind you, fingers pointing toward your feet.',
      'Press up so your body makes a straight line from shoulders to heels.',
      'Hold with your glutes squeezed and chest open.',
    ],
    cues: ['Bend your knees to make it a tabletop if it’s too hard'],
  }),
  cal('copenhagen-plank', 'Copenhagen Plank', 'hold', ['adductors', 'obliques', 'abdominals'], {
    equipment: 'bench',
    figure: 'copenhagen-plank',
    perSide: true,
    steps: [
      'Lie on your side with your forearm on the floor and your top foot (or knee, for easier) on a bench.',
      'Lift your hips until your body is straight, with your bottom leg hanging below the bench.',
      'Hold, then switch sides.',
    ],
    cues: ['Superb for groin strength and injury prevention', 'Knee on the bench is the easier version'],
  }),
  cal('bird-dog', 'Bird Dog', 'reps', ['abdominals', 'lower back', 'glutes'], {
    equipment: BODY,
    figure: 'bird-dog',
    steps: [
      'Start on your hands and knees with a flat back.',
      'Reach one arm forward and the opposite leg back until both are level with your body.',
      'Pause, return, and switch sides.',
    ],
    cues: ['Move slowly and keep your hips level', 'Reach long rather than high'],
  }),
  cal('crunch', 'Crunch', 'reps', ['abdominals'], {
    equipment: BODY,
    fedb: 'Crunches',
    steps: [
      'Lie on your back with your knees bent and feet flat, fingertips lightly behind your ears.',
      'Curl your head, shoulders and upper back off the floor by tightening your abs.',
      'Lower slowly.',
    ],
    cues: ['Don’t pull on your neck', 'Breathe out as you curl up'],
  }),
  cal('sit-up', 'Sit-Up', 'reps', ['abdominals', 'hip flexors'], {
    equipment: BODY,
    fedb: 'Sit-Up',
    steps: [
      'Lie on your back with your knees bent and feet flat, anchored if you like.',
      'Curl up all the way until your chest is near your knees.',
      'Roll back down with control.',
    ],
    cues: ['Roll up one vertebra at a time', 'Arms crossed over your chest is easiest on the neck'],
  }),
  cal('v-up', 'V-Up', 'reps', ['abdominals', 'hip flexors'], {
    equipment: BODY,
    fedb: 'Jackknife_Sit-Up',
    steps: [
      'Lie flat with your arms overhead and legs straight.',
      'Lift your arms and legs at the same time and reach your hands toward your toes, folding into a V.',
      'Lower back down slowly without letting your feet crash.',
    ],
    cues: ['Bend your knees slightly to make it easier', 'Balance on your seat at the top'],
  }),
  cal('tuck-up', 'Tuck-Up', 'reps', ['abdominals', 'hip flexors'], {
    equipment: BODY,
    figure: 'tuck-up',
    steps: [
      'Lie on your back in a hollow position with arms overhead and legs out.',
      'Sit up and pull your knees into your chest, hugging your shins.',
      'Open back out to the hollow position without touching the floor.',
    ],
    cues: ['An easier version of the V-up', 'Keep your lower back pressed down when extended'],
  }),
  cal('lying-leg-raise', 'Lying Leg Raise', 'reps', ['abdominals', 'hip flexors'], {
    equipment: BODY,
    figure: 'lying-leg-raise',
    steps: [
      'Lie on your back with your legs straight and hands by your sides or under your hips.',
      'Keeping your legs straight, lift them until they point at the ceiling.',
      'Lower slowly until they hover just above the floor.',
    ],
    cues: ['Keep your lower back pressed down', 'Bend your knees to make it easier'],
  }),
  cal('flutter-kicks', 'Flutter Kicks', 'reps', ['abdominals', 'hip flexors'], {
    equipment: BODY,
    figure: 'flutter-kicks',
    steps: [
      'Lie on your back with your legs straight and lifted a few inches off the floor.',
      'Kick your legs up and down in small, quick alternating movements.',
      'Count each kick, or go for time.',
    ],
    cues: ['Lower back stays glued to the floor', 'Hands under your hips help'],
  }),
  cal('bicycle-crunch', 'Bicycle Crunch', 'reps', ['abdominals', 'obliques'], {
    equipment: BODY,
    fedb: 'Air_Bike',
    steps: [
      'Lie on your back, fingertips behind your ears, shoulders and feet lifted.',
      'Bring one knee in while turning the opposite elbow toward it, straightening the other leg.',
      'Switch sides in a slow pedaling motion.',
    ],
    cues: ['Rotate through your ribs, not just your elbows', 'Slow beats fast'],
  }),
  cal('reverse-crunch', 'Reverse Crunch', 'reps', ['abdominals'], {
    equipment: BODY,
    fedb: 'Reverse_Crunch',
    steps: [
      'Lie on your back with your knees bent at 90° above your hips, arms by your sides.',
      'Curl your hips off the floor, bringing your knees toward your chest.',
      'Lower your hips slowly.',
    ],
    cues: ['A gentle step toward hanging leg raises', 'Don’t swing; curl'],
  }),
  cal('hollow-rock', 'Hollow Rock', 'reps', ['abdominals', 'hip flexors'], {
    equipment: BODY,
    figure: 'hollow-rock',
    steps: [
      'Get into a hollow body hold: lower back down, arms and legs reaching away, shoulders and feet off the floor.',
      'Keep that shape and rock back and forth like a rocking chair.',
    ],
    cues: ['If your shape breaks, go back to holding', 'Small rocks are fine'],
  }),
  cal('windshield-wiper', 'Hanging Windshield Wiper', 'reps', ['obliques', 'abdominals', 'lats'], {
    equipment: BAR,
    figure: 'windshield-wiper',
    steps: [
      'Hang from the bar and raise your straight legs toward it.',
      'Keeping them high, sweep your legs over to one side, then the other, like a windshield wiper.',
      'Lower with control when the set is done.',
    ],
    cues: ['Lying on your back is an easier version', 'Keep your arms straight'],
  }),
  cal('manna', 'Manna', 'hold', ['shoulders', 'triceps', 'abdominals', 'hip flexors'], {
    equipment: 'parallettes or floor',
    figure: 'manna',
    steps: [
      'Sit with your hands behind your hips on the floor or parallettes.',
      'Press up into a V-sit and keep lifting your legs.',
      'Lean back and push your shoulders behind you until your hips rise toward your hands.',
    ],
    cues: ['An elite skill that takes years', 'Build through L-sit and V-sit first'],
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

  // ── Balances, rings and flags ──────────────────────────────────────
  cal('crow-pose', 'Crow Pose', 'hold', ['shoulders', 'triceps', 'abdominals', 'forearms'], {
    equipment: BODY,
    figure: 'frog-stand',
    steps: [
      'Squat down and place your hands on the floor, shoulder-width apart.',
      'Rest your knees high on the backs of your upper arms.',
      'Lean forward until your feet float, and hold.',
    ],
    cues: ['Look forward, not down', 'Very similar to the frog stand, with knees higher up the arms'],
  }),
  cal('elbow-lever', 'Elbow Lever', 'hold', ['abdominals', 'forearms', 'shoulders'], {
    equipment: BODY,
    figure: 'elbow-lever',
    steps: [
      'Place your hands on the floor, fingers pointing back or to the sides.',
      'Dig your elbows into your belly near your hips.',
      'Lean forward and lift your legs until your whole body balances level on your elbows.',
    ],
    cues: ['Easier than it looks: it’s mostly balance', 'Try one elbow in the belly and one on the hip'],
  }),
  cal('ring-l-sit', 'Ring L-Sit', 'hold', ['abdominals', 'hip flexors', 'triceps', 'shoulders'], {
    equipment: 'rings',
    figure: 'ring-l-sit',
    steps: [
      'Get into a ring support hold with straight arms.',
      'Lift your straight legs to hip height, making an L.',
      'Hold while keeping the rings steady at your sides.',
    ],
    cues: ['Harder than on the floor because the rings move', 'Tuck one knee to make it easier'],
  }),
  cal('iron-cross', 'Iron Cross', 'hold', ['chest', 'lats', 'shoulders', 'biceps'], {
    equipment: 'rings',
    figure: 'iron-cross',
    steps: [
      'Start in a ring support hold.',
      'With straight arms, slowly lower your body while the rings move out to the sides.',
      'Hold with your arms straight out and level with your shoulders.',
    ],
    cues: ['An elite gymnastics strength skill', 'Train with bands and partial ranges for a long time first'],
  }),
  cal('tuck-human-flag', 'Tuck Human Flag', 'hold', ['obliques', 'lats', 'shoulders'], {
    equipment: 'vertical pole',
    figure: 'tuck-human-flag',
    steps: [
      'Grab a vertical pole with your top hand overhand and your bottom hand underhand, about shoulder-width or more apart.',
      'Push hard with the bottom arm and pull with the top arm.',
      'Kick up and hold your body sideways with your knees tucked.',
    ],
    cues: ['Bottom arm pushes, top arm pulls', 'Lock both arms straight'],
  }),
  cal('straddle-human-flag', 'Straddle Human Flag', 'hold', ['obliques', 'lats', 'shoulders'], {
    equipment: 'vertical pole',
    figure: 'straddle-human-flag',
    steps: [
      'From the tuck flag, extend your legs into a wide straddle.',
      'Keep your hips in line with your shoulders.',
      'Hold, then come down with control.',
    ],
    cues: ['The wider the straddle, the easier', 'Squeeze your side hard'],
  }),
  cal('human-flag', 'Human Flag', 'hold', ['obliques', 'lats', 'shoulders', 'abdominals'], {
    equipment: 'vertical pole',
    figure: 'human-flag',
    steps: [
      'Grab the pole with a wide grip: top hand pulling, bottom hand pushing.',
      'Lift your body sideways until it’s straight and level with the floor.',
      'Hold with your legs together and toes pointed.',
    ],
    cues: ['A full-body skill: everything stays tight', 'Build up with tuck and straddle flags'],
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

  cal('deficit-hspu', 'Deficit Handstand Push-Up', 'reps', ['shoulders', 'triceps', 'traps'], {
    equipment: 'parallettes or plates',
    figure: 'deficit-hspu',
    steps: [
      'Put your hands on parallettes or stacked plates, usually with your feet against a wall.',
      'Lower until your head drops below the level of your hands.',
      'Press back up to straight arms.',
    ],
    cues: ['Adds range of motion to the handstand push-up', 'Start with a small deficit'],
  }),
  cal('wall-walk', 'Wall Walk', 'reps', ['shoulders', 'abdominals', 'triceps'], {
    equipment: 'wall',
    figure: 'wall-walk',
    steps: [
      'Lie face down with your feet against a wall and get into a push-up position.',
      'Walk your feet up the wall while walking your hands toward it.',
      'Go as close as you can, ideally to a chest-to-wall handstand, then walk back down with control.',
    ],
    cues: ['Keep your core tight so your back doesn’t sag', 'Only walk as close as feels safe'],
  }),
  cal('back-to-wall-handstand', 'Back-to-Wall Handstand', 'hold', ['shoulders', 'triceps', 'abdominals'], {
    equipment: 'wall',
    figure: 'back-to-wall-handstand',
    steps: [
      'With your back to the wall, place your hands on the floor about a hand’s length from it.',
      'Kick one leg up, then the other, until your heels rest lightly on the wall.',
      'Push the floor away, squeeze your legs together and hold.',
    ],
    cues: ['Easier to enter than chest-to-wall, but practise both', 'Try lifting your heels off the wall to balance'],
  }),
  cal('handstand-walk', 'Handstand Walk', 'reps', ['shoulders', 'triceps', 'abdominals', 'forearms'], {
    equipment: BODY,
    figure: 'handstand-walk',
    steps: [
      'Kick up into a handstand.',
      'Let yourself tip slightly forward, then take small steps with your hands to stay under your body.',
      'Count your hand steps, or walk a set distance.',
    ],
    cues: ['Small, quick hand steps', 'Track reps as hand steps, or log the distance'],
  }),
  cal('press-to-handstand', 'Press to Handstand', 'reps', ['shoulders', 'abdominals', 'hip flexors', 'triceps'], {
    equipment: BODY,
    figure: 'press-to-handstand',
    steps: [
      'Start in a pike or straddle with your hands on the floor and shoulders leaning forward.',
      'Shift your weight onto your hands until your feet float.',
      'Without jumping, lift your hips over your hands and raise your legs into a handstand.',
    ],
    cues: ['Lean much further forward than feels natural', 'Straddle is easier than pike'],
  }),
  cal('one-arm-handstand', 'One-Arm Handstand', 'hold', ['shoulders', 'forearms', 'abdominals', 'obliques'], {
    equipment: BODY,
    figure: 'one-arm-handstand',
    steps: [
      'From a solid freestanding handstand, open your legs into a straddle.',
      'Shift your weight onto one hand.',
      'Slowly lift the other hand away and balance, using your fingers and legs to steer.',
    ],
    cues: ['Needs a 60-second freestanding handstand first', 'Practise fingertip shifts before lifting the hand'],
  }),
  cal('headstand', 'Tripod Headstand', 'hold', ['shoulders', 'abdominals', 'neck'], {
    equipment: BODY,
    figure: 'headstand',
    steps: [
      'Place your hands and the top of your head on the floor in a triangle, head in front of your hands.',
      'Walk your feet in, then rest your knees on the backs of your elbows.',
      'Lift your knees off and slowly straighten your legs above you.',
    ],
    cues: ['Most of your weight goes through your hands, not your neck', 'Use a soft mat and skip this if you have neck issues'],
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

  // ── Strength: dumbbells ────────────────────────────────────────────
  str('alternating-db-curl', 'Alternating Dumbbell Curl', 'weighted', ['biceps'], { equipment: 'dumbbells', perSide: true, fedb: 'Dumbbell_Alternate_Bicep_Curl' }),
  str('front-raise', 'Front Raise', 'weighted', ['shoulders'], {
    equipment: 'dumbbells',
    fedb: 'Front_Dumbbell_Raise',
    cues: ['Lift to shoulder height, no higher', 'No swinging: keep your torso still'],
  }),
  str('db-rear-delt-fly', 'Dumbbell Rear Delt Fly', 'weighted', ['shoulders', 'middle back'], {
    equipment: 'dumbbells',
    fedb: 'Seated_Bent-Over_Rear_Delt_Raise',
    cues: ['Lead with your elbows, not your hands', 'Light weights and a squeeze at the top'],
  }),
  str('arnold-press', 'Arnold Press', 'weighted', ['shoulders', 'triceps'], {
    equipment: 'dumbbells',
    fedb: 'Arnold_Dumbbell_Press',
    cues: ['Start palms facing you, rotate them forward as you press', 'Reverse the turn on the way down'],
  }),
  str('db-upright-row', 'Dumbbell Upright Row', 'weighted', ['shoulders', 'traps'], {
    equipment: 'dumbbells',
    fedb: 'Standing_Dumbbell_Upright_Row',
    cues: ['Lift your elbows to about shoulder height', 'Stop lower if your shoulders pinch'],
  }),
  str('db-bent-over-row', 'Dumbbell Bent-Over Row', 'weighted', ['middle back', 'lats', 'biceps'], {
    equipment: 'dumbbells',
    fedb: 'Bent_Over_Two-Dumbbell_Row',
    cues: ['Flat back, hinge at the hips', 'Pull the dumbbells toward your hips'],
  }),
  str('db-overhead-triceps-extension', 'Dumbbell Overhead Triceps Extension', 'weighted', ['triceps'], {
    equipment: 'dumbbell',
    fedb: 'Standing_Dumbbell_Triceps_Extension',
    cues: ['Keep your elbows pointing forward and close to your head', 'Lower behind your head slowly'],
  }),
  str('triceps-kickback', 'Triceps Kickback', 'weighted', ['triceps'], {
    equipment: 'dumbbells',
    fedb: 'Tricep_Dumbbell_Kickback',
    cues: ['Upper arm stays still and level with your back', 'Squeeze with your arm straight'],
  }),
  str('renegade-row', 'Renegade Row', 'weighted', ['middle back', 'lats', 'abdominals'], {
    equipment: 'dumbbells',
    perSide: true,
    fedb: 'Alternating_Renegade_Row',
    cues: ['Feet wide for balance', 'Keep your hips square as you row'],
  }),
  str('db-floor-press', 'Dumbbell Floor Press', 'weighted', ['chest', 'triceps'], {
    equipment: 'dumbbells',
    fedb: 'Dumbbell_Floor_Press',
    cues: ['Elbows touch the floor lightly, then press', 'Kind to the shoulders'],
  }),
  str('db-pullover', 'Dumbbell Pullover', 'weighted', ['lats', 'chest'], {
    equipment: 'dumbbell + bench',
    fedb: 'Straight-Arm_Dumbbell_Pullover',
    cues: ['Slight bend in the elbows, kept the same throughout', 'Lower until you feel a stretch in your lats'],
  }),
  str('db-romanian-deadlift', 'Dumbbell Romanian Deadlift', 'weighted', ['hamstrings', 'glutes', 'lower back'], {
    equipment: 'dumbbells',
    fedb: 'Stiff-Legged_Dumbbell_Deadlift',
    cues: ['Push your hips back with soft knees', 'Dumbbells slide down your thighs'],
  }),
  str('db-deadlift', 'Dumbbell Deadlift', 'weighted', ['glutes', 'hamstrings', 'quadriceps', 'lower back'], {
    equipment: 'dumbbells',
    steps: [
      'Stand with the dumbbells on the floor beside your feet.',
      'Push your hips back, bend your knees and grip the dumbbells with a flat back.',
      'Drive through your feet to stand tall, then lower them back down the same way.',
    ],
    cues: ['Chest up, back flat', 'Push the floor away'],
  }),
  str('db-reverse-lunge', 'Dumbbell Reverse Lunge', 'weighted', ['quadriceps', 'glutes'], { equipment: 'dumbbells', perSide: true, fedb: 'Dumbbell_Rear_Lunge' }),
  str('db-step-up', 'Dumbbell Step-Up', 'weighted', ['quadriceps', 'glutes'], { equipment: 'dumbbells + box', perSide: true, fedb: 'Dumbbell_Step_Ups' }),
  str('db-bulgarian-split-squat', 'Dumbbell Bulgarian Split Squat', 'weighted', ['quadriceps', 'glutes'], {
    equipment: 'dumbbells + bench',
    perSide: true,
    steps: [
      'Hold dumbbells at your sides and rest the top of your back foot on a bench behind you.',
      'Lower straight down until your front thigh is about level.',
      'Drive through your front foot to stand.',
    ],
    cues: ['Most of your weight stays on the front leg', 'A slight forward lean works the glutes more'],
  }),
  str('db-sumo-squat', 'Dumbbell Sumo Squat', 'weighted', ['quadriceps', 'glutes', 'adductors'], {
    equipment: 'dumbbell',
    fedb: 'Plie_Dumbbell_Squat',
    cues: ['Wide stance, toes turned out', 'Knees follow your toes'],
  }),
  str('curtsy-lunge', 'Curtsy Lunge', 'weighted', ['glutes', 'quadriceps', 'adductors'], {
    equipment: 'dumbbells (optional)',
    perSide: true,
    steps: [
      'Stand tall, holding dumbbells at your sides if you like.',
      'Step one foot diagonally behind the other, as if curtsying, and lower until your front thigh is near level.',
      'Push back up to standing and switch sides.',
    ],
    cues: ['Keep your hips facing forward', 'Front knee tracks over your toes'],
  }),
  str('db-calf-raise', 'Dumbbell Calf Raise', 'weighted', ['calves'], { equipment: 'dumbbells', fedb: 'Standing_Dumbbell_Calf_Raise' }),
  str('db-thruster', 'Dumbbell Thruster', 'weighted', ['quadriceps', 'glutes', 'shoulders'], {
    equipment: 'dumbbells',
    steps: [
      'Hold the dumbbells at your shoulders.',
      'Squat down until your thighs are about level.',
      'Drive up and use that momentum to press the dumbbells overhead in one smooth move.',
    ],
    cues: ['Squat and press flow together', 'Lower the weights back to your shoulders as you squat'],
  }),
  str('db-snatch', 'Dumbbell Snatch', 'weighted', ['shoulders', 'glutes', 'hamstrings'], {
    equipment: 'dumbbell',
    perSide: true,
    steps: [
      'Squat down and hold one dumbbell between your feet.',
      'Explode up with your legs and hips, pulling the dumbbell close to your body.',
      'Punch it straight overhead and stand tall, then lower it with control.',
    ],
    cues: ['The power comes from your hips', 'Keep the dumbbell close as it rises'],
  }),
  str('db-clean', 'Dumbbell Clean', 'weighted', ['glutes', 'hamstrings', 'traps', 'shoulders'], { equipment: 'dumbbells', fedb: 'Dumbbell_Clean' }),
  str('db-swing', 'Dumbbell Swing', 'weighted', ['glutes', 'hamstrings', 'lower back'], {
    equipment: 'dumbbell',
    steps: [
      'Hold one dumbbell by its end with both hands, feet a little wider than hips.',
      'Hinge and swing it back between your legs.',
      'Snap your hips forward to swing it up to chest height, then let it fall back into the next rep.',
    ],
    cues: ['A hip snap, not a squat or an arm lift', 'Squeeze your glutes at the top'],
  }),
  str('db-hip-thrust', 'Dumbbell Hip Thrust', 'weighted', ['glutes', 'hamstrings'], {
    equipment: 'dumbbell + bench',
    steps: [
      'Sit with your upper back against a bench and a dumbbell resting on your hips.',
      'Plant your feet and drive your hips up until your body is level from shoulders to knees.',
      'Squeeze your glutes at the top, then lower.',
    ],
    cues: ['Chin tucked, ribs down', 'Shins vertical at the top'],
  }),
  str('suitcase-carry', 'Suitcase Carry', 'weighted', ['obliques', 'forearms', 'traps'], {
    equipment: 'dumbbell or kettlebell',
    perSide: true,
    steps: [
      'Pick up one heavy dumbbell in one hand.',
      'Stand tall without leaning toward or away from it.',
      'Walk for the distance or time you set, then switch hands.',
    ],
    cues: ['Shoulders level, like carrying a suitcase', 'Log the weight and count steps as reps'],
  }),
  str('db-woodchop', 'Dumbbell Woodchop', 'weighted', ['obliques', 'abdominals', 'shoulders'], {
    equipment: 'dumbbell',
    perSide: true,
    steps: [
      'Hold one dumbbell with both hands up by one shoulder.',
      'Rotate and chop it down diagonally across your body to the opposite hip, bending your knees.',
      'Lift it back along the same path. Do all reps, then switch sides.',
    ],
    cues: ['Turn through your torso and pivot your back foot', 'Control the weight both ways'],
  }),

  // ── Strength: kettlebells & barbell extras ─────────────────────────
  str('kb-deadlift', 'Kettlebell Deadlift', 'weighted', ['glutes', 'hamstrings', 'lower back'], {
    equipment: 'kettlebell',
    steps: [
      'Stand with a kettlebell on the floor between your feet.',
      'Hinge at your hips, bend your knees a little and grip the handle with a flat back.',
      'Stand up tall by driving your hips forward, then lower it the same way.',
    ],
    cues: ['A great way to learn the hip hinge', 'Keep the bell close to you'],
  }),
  str('kb-clean', 'Kettlebell Clean', 'weighted', ['glutes', 'hamstrings', 'shoulders', 'forearms'], { equipment: 'kettlebell', perSide: true, fedb: 'One-Arm_Kettlebell_Clean' }),
  str('kb-press', 'Kettlebell Press', 'weighted', ['shoulders', 'triceps'], {
    equipment: 'kettlebell',
    perSide: true,
    steps: [
      'Clean a kettlebell to the rack position at your shoulder, bell resting on your forearm.',
      'Brace your abs and glutes and press it straight overhead.',
      'Lower it back to the rack with control.',
    ],
    cues: ['Wrist straight, knuckles to the ceiling', 'Don’t lean back to finish the press'],
  }),
  str('turkish-get-up', 'Turkish Get-Up', 'weighted', ['shoulders', 'abdominals', 'glutes'], {
    equipment: 'kettlebell',
    perSide: true,
    fedb: 'Kettlebell_Turkish_Get-Up_Squat_style',
    cues: ['Eyes on the kettlebell the whole time', 'Learn it with a shoe balanced on your fist first'],
  }),
  str('kb-snatch', 'Kettlebell Snatch', 'weighted', ['shoulders', 'glutes', 'hamstrings'], { equipment: 'kettlebell', perSide: true, fedb: 'One-Arm_Kettlebell_Snatch' }),
  str('kb-high-pull', 'Kettlebell High Pull', 'weighted', ['traps', 'shoulders', 'glutes'], { equipment: 'kettlebell', fedb: 'Kettlebell_Sumo_High_Pull' }),
  str('barbell-lunge', 'Barbell Lunge', 'weighted', ['quadriceps', 'glutes'], { equipment: 'barbell', perSide: true, fedb: 'Barbell_Lunge' }),
  str('power-clean', 'Power Clean', 'weighted', ['glutes', 'hamstrings', 'traps', 'quadriceps'], {
    equipment: 'barbell',
    fedb: 'Power_Clean',
    cues: ['Learn it with a coach or an empty bar first', 'Jump, shrug, then pull yourself under the bar'],
  }),

  // ── Strength: cables & machines ────────────────────────────────────
  str('cable-curl', 'Cable Biceps Curl', 'weighted', ['biceps'], { equipment: 'cable machine', fedb: 'Standing_Biceps_Cable_Curl' }),
  str('rope-hammer-curl', 'Rope Hammer Curl', 'weighted', ['biceps', 'forearms'], { equipment: 'cable machine + rope', fedb: 'Cable_Hammer_Curls_-_Rope_Attachment' }),
  str('cable-lateral-raise', 'Cable Lateral Raise', 'weighted', ['shoulders'], { equipment: 'cable machine', perSide: true, fedb: 'Standing_Low-Pulley_Deltoid_Raise' }),
  str('cable-reverse-fly', 'Cable Reverse Fly', 'weighted', ['shoulders', 'middle back'], { equipment: 'cable machine', fedb: 'Cable_Rear_Delt_Fly' }),
  str('straight-arm-pulldown', 'Straight-Arm Pulldown', 'weighted', ['lats'], {
    equipment: 'cable machine',
    fedb: 'Straight-Arm_Pulldown',
    cues: ['Arms stay long with a soft bend', 'Feel it in your lats, not your triceps'],
  }),
  str('cable-woodchop', 'Cable Woodchop', 'weighted', ['obliques', 'abdominals'], { equipment: 'cable machine', perSide: true, fedb: 'Standing_Cable_Wood_Chop' }),
  str('low-row-machine', 'Low Row Machine', 'weighted', ['middle back', 'lats', 'biceps'], { equipment: 'row machine', fedb: 'Leverage_Iso_Row' }),
  str('assisted-pullup-machine', 'Assisted Pull-Up Machine', 'weighted', ['lats', 'biceps'], {
    equipment: 'assisted pull-up machine',
    steps: [
      'Set the assistance weight: more weight makes it easier.',
      'Kneel or stand on the platform and grip the handles overhead.',
      'Pull until your chin passes the handles, then lower slowly to straight arms.',
    ],
    cues: ['Log the assistance as the weight and lower it over time', 'Full range every rep'],
  }),
  str('machine-pullover', 'Machine Pullover', 'weighted', ['lats'], {
    equipment: 'pullover machine',
    steps: [
      'Sit with your shoulders lined up with the machine’s pivot and your elbows on the pads.',
      'Push the bar down and around in an arc until it reaches your belly.',
      'Let it return slowly until you feel a stretch in your lats.',
    ],
    cues: ['Drive with your elbows, not your hands'],
  }),

  // ── Bands & suspension trainer ─────────────────────────────────────
  str('band-row', 'Band Row', 'reps', ['middle back', 'lats', 'biceps'], {
    equipment: 'resistance band',
    steps: [
      'Anchor a band at chest height, or loop it around your feet while sitting.',
      'Pull the handles toward your ribs, squeezing your shoulder blades together.',
      'Let your arms straighten slowly.',
    ],
    cues: ['Step further away for more tension'],
  }),
  str('band-lateral-walk', 'Band Lateral Walk', 'reps', ['glutes', 'abductors'], {
    equipment: 'mini band',
    fedb: 'Monster_Walk',
    steps: [
      'Put a mini band around your legs just above your knees or ankles.',
      'Sit into a quarter squat with your feet hip-width apart.',
      'Step sideways, keeping tension on the band, for all your steps, then come back the other way.',
    ],
    cues: ['Don’t let your feet come all the way together', 'Count steps as reps'],
  }),
  str('band-glute-bridge', 'Band Glute Bridge', 'reps', ['glutes', 'hamstrings'], {
    equipment: 'mini band',
    steps: [
      'Lie on your back with a mini band just above your knees, feet flat.',
      'Press your knees out against the band and lift your hips.',
      'Squeeze at the top, then lower.',
    ],
    cues: ['Keep pushing your knees out the whole time'],
  }),
  str('band-squat', 'Band Squat', 'reps', ['quadriceps', 'glutes', 'abductors'], {
    equipment: 'mini band',
    steps: [
      'Put a mini band just above your knees and stand with feet shoulder-width apart.',
      'Squat down while pressing your knees out against the band.',
      'Stand back up, keeping the tension.',
    ],
    cues: ['Great for teaching knees to track over toes'],
  }),
  str('band-overhead-press', 'Band Overhead Press', 'reps', ['shoulders', 'triceps'], {
    equipment: 'resistance band',
    steps: [
      'Stand on the middle of a band and hold the ends at your shoulders.',
      'Press your hands straight overhead.',
      'Lower back to your shoulders slowly.',
    ],
    cues: ['Brace your abs so your back doesn’t arch'],
  }),
  str('trx-row', 'Suspension Row (TRX)', 'reps', ['middle back', 'lats', 'biceps'], {
    equipment: 'suspension trainer',
    fedb: 'Suspended_Row',
    cues: ['Walk your feet forward to make it harder', 'Body stays in a straight line'],
  }),
  str('trx-chest-press', 'Suspension Chest Press (TRX)', 'reps', ['chest', 'triceps', 'shoulders'], {
    equipment: 'suspension trainer',
    steps: [
      'Face away from the anchor, holding the handles at chest height with straight arms.',
      'Lean forward and lower your chest between your hands like a standing push-up.',
      'Press back to straight arms.',
    ],
    cues: ['Feet further back makes it harder', 'Keep the straps from rubbing your arms'],
  }),
  str('trx-split-squat', 'Suspension Split Squat (TRX)', 'reps', ['quadriceps', 'glutes'], {
    equipment: 'suspension trainer',
    perSide: true,
    fedb: 'Suspended_Split_Squat',
    cues: ['The back foot rests in the foot cradle', 'Lower straight down on the front leg'],
  }),
  str('med-ball-slam', 'Medicine Ball Slam', 'weighted', ['shoulders', 'abdominals', 'lats'], {
    equipment: 'slam ball',
    steps: [
      'Hold a slam ball overhead, rising onto your toes.',
      'Slam it into the floor in front of you as hard as you can, hinging and bending your knees.',
      'Pick it up with a flat back and go again.',
    ],
    cues: ['Use a ball made for slamming so it doesn’t bounce back', 'Exhale hard on each slam'],
  }),
  str('med-ball-russian-twist', 'Medicine Ball Russian Twist', 'weighted', ['obliques', 'abdominals'], {
    equipment: 'medicine ball',
    steps: [
      'Sit leaning back slightly with your knees bent, holding a medicine ball at your chest.',
      'Rotate your torso to tap the ball beside one hip, then the other.',
      'Lift your feet off the floor to make it harder.',
    ],
    cues: ['Turn your shoulders, not just your arms', 'Count each side as one rep'],
  }),

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

  car('battle-ropes', 'Battle Ropes', 'cardio', ['shoulders', 'abdominals', 'forearms'], {
    equipment: 'battle ropes',
    fedb: 'Battling_Ropes',
    cues: ['Athletic stance with soft knees', 'Try short bursts, like 20 seconds on and 40 off'],
  }),

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

  mob('thoracic-rotation', 'Thoracic Rotation', 'reps', ['middle back', 'obliques'], {
    equipment: BODY,
    perSide: true,
    figure: 'thoracic-rotation',
    steps: [
      'Start in a deep lunge or on all fours.',
      'Keep one hand on the floor and rotate your chest open, reaching the other arm to the ceiling.',
      'Follow your hand with your eyes, then bring it back down. Do all reps, then switch sides.',
    ],
    cues: ['Turn through your upper back, not your hips', 'Breathe out as you rotate'],
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
  flex('downward-dog', 'Downward Dog', 'hold', ['hamstrings', 'calves', 'shoulders'], {
    equipment: BODY,
    figure: 'downward-dog',
    steps: [
      'Start on your hands and knees.',
      'Tuck your toes and lift your hips up and back, straightening your arms and legs into an upside-down V.',
      'Press your chest toward your thighs and your heels toward the floor, and hold.',
    ],
    cues: ['Bend your knees a little if your back rounds', 'Spread your fingers wide'],
  }),
  flex('standing-quad-stretch', 'Standing Quad Stretch', 'hold', ['quadriceps', 'hip flexors'], {
    equipment: BODY,
    perSide: true,
    figure: 'standing-quad-stretch',
    steps: [
      'Stand tall, holding a wall for balance if needed.',
      'Bend one knee and hold that ankle behind you.',
      'Bring your knees together and gently tuck your hips under until you feel the front of your thigh stretch.',
    ],
    cues: ['Don’t arch your lower back', 'Knee points straight down'],
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
