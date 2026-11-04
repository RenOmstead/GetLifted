/** Plain-language guidance for the Yellowstone 2027 program. General information, not medical advice. */

export const STOP_SIGNS = [
  'Chest pain, pressure or tightness',
  'Shortness of breath that’s much worse than usual or doesn’t ease with rest',
  'Feeling dizzy, faint or confused',
  'A racing, pounding or irregular heartbeat',
  'Sharp or sudden joint pain, or pain that makes you limp',
  'New swelling, numbness or tingling',
]

export const STOP_TEXT =
  'Stop right away and get medical advice if you notice any of these. Call emergency services if they’re severe or don’t settle with rest. With knee, foot or hip pain, it’s a good idea to check with your doctor or a physical therapist before you start, and again if pain keeps coming back.'

/** Reminders that appear as the trip gets closer (weeks before the trip). */
export const PACKING_REMINDERS: { fromWeeks: number; toWeeks: number; title: string; items: string[] }[] = [
  {
    fromWeeks: 99,
    toWeeks: 17,
    title: 'Footwear, early',
    items: ['Walk in comfortable, supportive shoes you like', 'When you’re ready, choose trail shoes or light hiking boots and start breaking them in'],
  },
  {
    fromWeeks: 16,
    toWeeks: 9,
    title: 'Practise with your trip gear',
    items: ['Wear your trip shoes and socks on every outdoor walk', 'Carry your daypack on Saturday walks (your plan sets the weight)', 'Try the socks, layers and hat you plan to bring'],
  },
  {
    fromWeeks: 8,
    toWeeks: 3,
    title: 'Pack check',
    items: [
      'Daypack that fits with a hip belt',
      'Water: about 2 liters of capacity',
      'Rain jacket and a warm layer (mountain weather changes fast)',
      'Sun hat, sunglasses and sunscreen',
      'Snacks and an electrolyte mix',
      'Blister kit: moleskin or blister plasters',
      'Bear spray (often rented or bought near the park)',
      'If riding: long pants and closed shoes with a small heel; check what your operator asks for',
    ],
  },
  {
    fromWeeks: 2,
    toWeeks: 0,
    title: 'Final checks',
    items: ['No new shoes now: bring the broken-in pair', 'Pack your daypack the way you practised', 'Plan easy first days at altitude', 'Confirm riding weight limits and clothing rules with your operator'],
  },
]

export const HOW_IT_WORKS = [
  'Four sessions a week on the days you choose. Missed one? Carry on with the next. Nothing doubles up.',
  'Most walking is at a talking pace: you can speak in full sentences.',
  'Each week ends with a 20-second check-in. The app suggests whether to go up a step, repeat the week, or ease back, and you choose.',
  'Every step up changes just one thing: walk time, or incline, or pack weight.',
  'Every fourth week is lighter, and the last two weeks before the trip are too.',
  'Every workout has a short version for busy or low-energy days. Doing the short version counts.',
]

export const RIDING_NOTE =
  'Balance, hip and inner-thigh mobility and core strength help you sit a horse more comfortably. They don’t replace riding instruction: listen to your guide and follow the operator’s safety rules.'
