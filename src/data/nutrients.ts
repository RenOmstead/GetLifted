import type { Sex } from '../db/types'

/**
 * Daily reference intakes for adults (19+), from the National Academies'
 * Dietary Reference Intakes as published in the NIH Office of Dietary
 * Supplements fact sheets (linked per nutrient). Performance supplements use
 * the cited position stands and FDA guidance instead.
 *
 * target = RDA, or AI where no RDA exists. ul = Tolerable Upper Intake Level.
 */

export interface Profile {
  age: number
  sex: Sex
  smoker: boolean
}

export type NutrientUnit = 'mg' | 'mcg' | 'g'

export interface NutrientDef {
  id: string
  name: string
  unit: NutrientUnit
  kind: 'vitamin' | 'mineral' | 'fat' | 'performance'
  /** Matches supplement-label ingredient names. */
  match: RegExp
  targetType: 'RDA' | 'AI' | 'range' | 'none'
  target: (p: Profile) => number | null
  /** Upper end of a recommended range (performance supplements). */
  targetHigh?: (p: Profile) => number | null
  ul: (p: Profile) => number | null
  /** What the upper number is called; defaults to "Upper limit (UL)". */
  ulLabel?: string
  /** Some ULs only count supplements and fortified foods, not food. */
  ulScope: 'total' | 'supplements'
  /** 1 IU equals this many of `unit`. */
  iu?: number
  note?: string
  source: { label: string; url: string }
}

type Band = [minAge: number, male: number, female: number]

/** Value by age band and sex; bands are listed from youngest. */
const bands =
  (...rows: Band[]) =>
  (p: Profile): number => {
    let row = rows[0]
    for (const b of rows) if (p.age >= b[0]) row = b
    return p.sex === 'male' ? row[1] : row[2]
  }
const flat = (n: number | null) => () => n

const ods = (name: string) => ({
  label: 'NIH Office of Dietary Supplements',
  url: `https://ods.od.nih.gov/factsheets/${name}-HealthProfessional/`,
})

export const NUTRIENTS: NutrientDef[] = [
  // ── Vitamins ─────────────────────────────────────────────────────────
  {
    id: 'vitamin-a',
    name: 'Vitamin A',
    unit: 'mcg',
    kind: 'vitamin',
    match: /\bvitamin a\b|\bretinol\b|\bretinyl\b/i,
    targetType: 'RDA',
    target: bands([19, 900, 700]),
    ul: flat(3000),
    ulScope: 'total',
    iu: 0.3,
    note: 'Amounts are mcg RAE. The upper limit applies to preformed vitamin A (retinol), not beta-carotene. IU are converted as retinol (1 IU = 0.3 mcg).',
    source: ods('VitaminA'),
  },
  {
    id: 'vitamin-c',
    name: 'Vitamin C',
    unit: 'mg',
    kind: 'vitamin',
    match: /\bvitamin c\b|ascorbic|ascorbate/i,
    targetType: 'RDA',
    target: (p) => bands([19, 90, 75])(p) + (p.smoker ? 35 : 0),
    ul: flat(2000),
    ulScope: 'total',
    note: 'Smokers need 35 mg more per day.',
    source: ods('VitaminC'),
  },
  {
    id: 'vitamin-d',
    name: 'Vitamin D',
    unit: 'mcg',
    kind: 'vitamin',
    match: /\bvitamin d\d?\b|calciferol/i,
    targetType: 'RDA',
    target: bands([19, 15, 15], [71, 20, 20]),
    ul: flat(100),
    ulScope: 'total',
    iu: 0.025,
    note: '1 mcg = 40 IU. The RDA is 600 IU (800 IU over 70); the upper limit is 4,000 IU.',
    source: ods('VitaminD'),
  },
  {
    id: 'vitamin-e',
    name: 'Vitamin E',
    unit: 'mg',
    kind: 'vitamin',
    match: /\bvitamin e\b|tocopher/i,
    targetType: 'RDA',
    target: flat(15),
    ul: flat(1000),
    ulScope: 'supplements',
    iu: 0.67,
    note: 'Amounts are mg alpha-tocopherol. IU are converted as natural vitamin E (1 IU = 0.67 mg); synthetic dl-alpha-tocopherol is 0.45 mg per IU. The upper limit counts supplements only.',
    source: ods('VitaminE'),
  },
  {
    id: 'vitamin-k',
    name: 'Vitamin K',
    unit: 'mcg',
    kind: 'vitamin',
    match: /\bvitamin k\d?\b|phylloquinone|menaquinone|phytonadione|\bmk-?[47]\b/i,
    targetType: 'AI',
    target: bands([19, 120, 90]),
    ul: flat(null),
    ulScope: 'total',
    note: 'No upper limit is set, but vitamin K interacts with blood thinners such as warfarin.',
    source: ods('VitaminK'),
  },
  {
    id: 'thiamin',
    name: 'Thiamin (B1)',
    unit: 'mg',
    kind: 'vitamin',
    match: /thiamin|\bvitamin b-?1\b/i,
    targetType: 'RDA',
    target: bands([19, 1.2, 1.1]),
    ul: flat(null),
    ulScope: 'total',
    source: ods('Thiamin'),
  },
  {
    id: 'riboflavin',
    name: 'Riboflavin (B2)',
    unit: 'mg',
    kind: 'vitamin',
    match: /riboflavin|\bvitamin b-?2\b/i,
    targetType: 'RDA',
    target: bands([19, 1.3, 1.1]),
    ul: flat(null),
    ulScope: 'total',
    source: ods('Riboflavin'),
  },
  {
    id: 'niacin',
    name: 'Niacin (B3)',
    unit: 'mg',
    kind: 'vitamin',
    match: /niacin|nicotinamide|nicotinic|\bvitamin b-?3\b/i,
    targetType: 'RDA',
    target: bands([19, 16, 14]),
    ul: flat(35),
    ulScope: 'supplements',
    note: 'Amounts are mg niacin equivalents. The upper limit counts supplements and fortified foods; above it, flushing is common.',
    source: ods('Niacin'),
  },
  {
    id: 'pantothenic-acid',
    name: 'Pantothenic acid (B5)',
    unit: 'mg',
    kind: 'vitamin',
    match: /pantothen|\bvitamin b-?5\b/i,
    targetType: 'AI',
    target: flat(5),
    ul: flat(null),
    ulScope: 'total',
    source: ods('PantothenicAcid'),
  },
  {
    id: 'vitamin-b6',
    name: 'Vitamin B6',
    unit: 'mg',
    kind: 'vitamin',
    match: /\bvitamin b-?6\b|pyridox/i,
    targetType: 'RDA',
    target: bands([19, 1.3, 1.3], [51, 1.7, 1.5]),
    ul: flat(100),
    ulScope: 'total',
    note: 'Long-term high doses can cause nerve damage (sensory neuropathy).',
    source: ods('VitaminB6'),
  },
  {
    id: 'biotin',
    name: 'Biotin (B7)',
    unit: 'mcg',
    kind: 'vitamin',
    match: /biotin|\bvitamin b-?7\b/i,
    targetType: 'AI',
    target: flat(30),
    ul: flat(null),
    ulScope: 'total',
    note: 'High-dose biotin can distort some lab tests, including thyroid and troponin tests. Tell your doctor if you take it.',
    source: ods('Biotin'),
  },
  {
    id: 'folate',
    name: 'Folate (B9)',
    unit: 'mcg',
    kind: 'vitamin',
    match: /folate|folic|folinic|\bvitamin b-?9\b/i,
    targetType: 'RDA',
    target: flat(400),
    ul: flat(1000),
    ulScope: 'supplements',
    note: 'Amounts are mcg DFE. The upper limit applies to folic acid from supplements and fortified foods.',
    source: ods('Folate'),
  },
  {
    id: 'vitamin-b12',
    name: 'Vitamin B12',
    unit: 'mcg',
    kind: 'vitamin',
    match: /\bvitamin b-?12\b|cobalamin/i,
    targetType: 'RDA',
    target: flat(2.4),
    ul: flat(null),
    ulScope: 'total',
    note: 'Your body absorbs only a small share of large oral doses, so supplements often list far more than the RDA.',
    source: ods('VitaminB12'),
  },
  {
    id: 'choline',
    name: 'Choline',
    unit: 'mg',
    kind: 'vitamin',
    match: /\bcholine\b/i,
    targetType: 'AI',
    target: bands([19, 550, 425]),
    ul: flat(3500),
    ulScope: 'total',
    source: ods('Choline'),
  },

  // ── Minerals ─────────────────────────────────────────────────────────
  {
    id: 'calcium',
    name: 'Calcium',
    unit: 'mg',
    kind: 'mineral',
    match: /\bcalcium\b/i,
    targetType: 'RDA',
    target: (p) => (p.sex === 'male' ? (p.age >= 71 ? 1200 : 1000) : p.age >= 51 ? 1200 : 1000),
    ul: (p) => (p.age >= 51 ? 2000 : 2500),
    ulScope: 'total',
    note: 'Your body absorbs calcium best in doses of 500 mg or less at a time.',
    source: ods('Calcium'),
  },
  {
    id: 'chromium',
    name: 'Chromium',
    unit: 'mcg',
    kind: 'mineral',
    match: /chromium/i,
    targetType: 'AI',
    target: bands([19, 35, 25], [51, 30, 20]),
    ul: flat(null),
    ulScope: 'total',
    source: ods('Chromium'),
  },
  {
    id: 'copper',
    name: 'Copper',
    unit: 'mcg',
    kind: 'mineral',
    match: /\bcopper\b|cupric/i,
    targetType: 'RDA',
    target: flat(900),
    ul: flat(10000),
    ulScope: 'total',
    note: 'High zinc intake can lower copper levels; many zinc supplements add copper for this reason.',
    source: ods('Copper'),
  },
  {
    id: 'iodine',
    name: 'Iodine',
    unit: 'mcg',
    kind: 'mineral',
    match: /iodine|iodide|kelp/i,
    targetType: 'RDA',
    target: flat(150),
    ul: flat(1100),
    ulScope: 'total',
    source: ods('Iodine'),
  },
  {
    id: 'iron',
    name: 'Iron',
    unit: 'mg',
    kind: 'mineral',
    match: /\biron\b|ferrous|ferric/i,
    targetType: 'RDA',
    target: (p) => (p.sex === 'male' ? 8 : p.age >= 51 ? 8 : 18),
    ul: flat(45),
    ulScope: 'total',
    note: 'Most men and postmenopausal women don’t need iron supplements unless a blood test shows low iron.',
    source: ods('Iron'),
  },
  {
    id: 'magnesium',
    name: 'Magnesium',
    unit: 'mg',
    kind: 'mineral',
    match: /magnesium/i,
    targetType: 'RDA',
    target: bands([19, 400, 310], [31, 420, 320]),
    ul: flat(350),
    ulScope: 'supplements',
    note: 'The 350 mg upper limit counts supplements only, not magnesium from food; above it, diarrhea is common.',
    source: ods('Magnesium'),
  },
  {
    id: 'manganese',
    name: 'Manganese',
    unit: 'mg',
    kind: 'mineral',
    match: /manganese/i,
    targetType: 'AI',
    target: bands([19, 2.3, 1.8]),
    ul: flat(11),
    ulScope: 'total',
    source: ods('Manganese'),
  },
  {
    id: 'molybdenum',
    name: 'Molybdenum',
    unit: 'mcg',
    kind: 'mineral',
    match: /molybdenum/i,
    targetType: 'RDA',
    target: flat(45),
    ul: flat(2000),
    ulScope: 'total',
    source: ods('Molybdenum'),
  },
  {
    id: 'phosphorus',
    name: 'Phosphorus',
    unit: 'mg',
    kind: 'mineral',
    match: /\bphosphorus\b/i,
    targetType: 'RDA',
    target: flat(700),
    ul: (p) => (p.age >= 71 ? 3000 : 4000),
    ulScope: 'total',
    source: ods('Phosphorus'),
  },
  {
    id: 'potassium',
    name: 'Potassium',
    unit: 'mg',
    kind: 'mineral',
    match: /potassium/i,
    targetType: 'AI',
    target: bands([19, 3400, 2600]),
    ul: flat(null),
    ulScope: 'total',
    note: 'No upper limit is set for healthy people, but people with kidney disease or on some blood-pressure drugs should talk to their doctor.',
    source: ods('Potassium'),
  },
  {
    id: 'selenium',
    name: 'Selenium',
    unit: 'mcg',
    kind: 'mineral',
    match: /selen/i,
    targetType: 'RDA',
    target: flat(55),
    ul: flat(400),
    ulScope: 'total',
    source: ods('Selenium'),
  },
  {
    id: 'sodium',
    name: 'Sodium',
    unit: 'mg',
    kind: 'mineral',
    match: /\bsodium\b(?! (ascorbate|selenite|selenate|molybdate|borate))/i,
    targetType: 'AI',
    target: flat(1500),
    ul: flat(2300),
    ulLabel: 'Reduce intake above',
    ulScope: 'total',
    note: 'The 2,300 mg figure is the Chronic Disease Risk Reduction intake: eating less than that lowers the risk of high blood pressure and heart disease.',
    source: { label: 'National Academies (2019)', url: 'https://nap.nationalacademies.org/catalog/25353' },
  },
  {
    id: 'zinc',
    name: 'Zinc',
    unit: 'mg',
    kind: 'mineral',
    match: /\bzinc\b/i,
    targetType: 'RDA',
    target: bands([19, 11, 8]),
    ul: flat(40),
    ulScope: 'total',
    note: 'Long-term intake above the upper limit can cause copper deficiency.',
    source: ods('Zinc'),
  },

  // ── Fats & performance supplements ───────────────────────────────────
  {
    id: 'epa-dha',
    name: 'Omega-3 (EPA + DHA)',
    unit: 'mg',
    kind: 'fat',
    match: /\bepa\b|\bdha\b|eicosapentaenoic|docosahexaenoic/i,
    targetType: 'none',
    target: flat(null),
    ul: flat(5000),
    ulLabel: 'FDA guidance',
    ulScope: 'supplements',
    note: 'There’s no RDA for EPA and DHA. The FDA says up to 5,000 mg a day combined from supplements is not expected to cause problems. The label’s fish oil total is not the same as EPA + DHA.',
    source: ods('Omega3FattyAcids'),
  },
  {
    id: 'creatine',
    name: 'Creatine',
    unit: 'g',
    kind: 'performance',
    match: /creatine/i,
    targetType: 'range',
    target: flat(3),
    targetHigh: flat(5),
    ul: flat(null),
    ulScope: 'supplements',
    note: 'Studied maintenance dose: 3–5 g a day (an optional loading phase uses about 20 g a day for 5–7 days). Creatine monohydrate is the most researched form.',
    source: { label: 'ISSN position stand (2017)', url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z' },
  },
  {
    id: 'caffeine',
    name: 'Caffeine',
    unit: 'mg',
    kind: 'performance',
    match: /caffeine/i,
    targetType: 'none',
    target: flat(null),
    ul: flat(400),
    ulLabel: 'FDA guidance',
    ulScope: 'total',
    note: 'The FDA cites 400 mg a day as an amount not generally linked to negative effects in healthy adults. Coffee, tea and energy drinks count too.',
    source: { label: 'U.S. FDA', url: 'https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much' },
  },
  {
    id: 'beta-alanine',
    name: 'Beta-alanine',
    unit: 'g',
    kind: 'performance',
    match: /beta[- ]?alanine|carnosyn/i,
    targetType: 'range',
    target: flat(4),
    targetHigh: flat(6.4),
    ul: flat(null),
    ulScope: 'supplements',
    note: 'Studied dose: 4–6.4 g a day split into smaller doses of 2 g or less to limit tingling (paresthesia), taken for at least 2–4 weeks.',
    source: { label: 'ISSN position stand (2015)', url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-015-0090-y' },
  },
]

export const NUTRIENT_BY_ID: Record<string, NutrientDef> = Object.fromEntries(NUTRIENTS.map((n) => [n.id, n]))
