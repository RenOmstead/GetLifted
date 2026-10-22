import { describe, expect, it } from 'vitest'
import { NUTRIENT_BY_ID, type Profile } from '../data/nutrients'
import type { Supplement } from '../db/types'
import { classify, convertAmount, evaluateIntake, matchNutrient, normalizeUnit, supplementTotals } from './nutrients'

const man30: Profile = { age: 30, sex: 'male', smoker: false }
const woman55: Profile = { age: 55, sex: 'female', smoker: false }

const supp = (name: string, ingredients: Supplement['ingredients'], id = 1): Supplement => ({
  id,
  name,
  servingLabel: '1 capsule',
  dailyServings: 1,
  ingredients,
  active: true,
  createdAt: 0,
})

describe('matchNutrient', () => {
  it.each([
    ['Vitamin D3 (as Cholecalciferol)', 'vitamin-d'],
    ['Vitamin B12', 'vitamin-b12'],
    ['Vitamin B1', 'thiamin'],
    ['Thiamine Mononitrate', 'thiamin'],
    ['Folate', 'folate'],
    ['Magnesium', 'magnesium'],
    ['Zinc', 'zinc'],
    ['Calcium Pantothenate', 'pantothenic-acid'],
    ['Sodium Ascorbate', 'vitamin-c'],
    ['Potassium Iodide', 'iodine'],
    ['EPA (Eicosapentaenoic Acid)', 'epa-dha'],
    ['DHA', 'epa-dha'],
    ['Creatine Monohydrate', 'creatine'],
    ['Selenium', 'selenium'],
    ['Vitamin K2 (as MK-7)', 'vitamin-k'],
  ])('%s → %s', (name, id) => {
    expect(matchNutrient(name)?.id).toBe(id)
  })

  it('leaves unrelated ingredients unmatched', () => {
    expect(matchNutrient('Phosphatidylserine')).toBeNull()
    expect(matchNutrient('Phosphatidylcholine')).toBeNull()
    expect(matchNutrient('Ashwagandha root extract')).toBeNull()
    expect(matchNutrient('Omega-3 Fatty Acids')).toBeNull()
  })
})

describe('units', () => {
  it('normalizes label units', () => {
    expect(normalizeUnit('mcg DFE')).toBe('mcg')
    expect(normalizeUnit('µg')).toBe('mcg')
    expect(normalizeUnit('Gram(s)')).toBe('g')
    expect(normalizeUnit('mg')).toBe('mg')
    expect(normalizeUnit('IU')).toBe('IU')
    expect(normalizeUnit('Calorie(s)')).toBeNull()
  })

  it('converts vitamin D IU to mcg (40 IU = 1 mcg)', () => {
    expect(convertAmount(4000, 'IU', NUTRIENT_BY_ID['vitamin-d'])).toBeCloseTo(100)
  })

  it('converts mass units', () => {
    expect(convertAmount(1, 'g', NUTRIENT_BY_ID['vitamin-c'])).toBe(1000)
    expect(convertAmount(5000, 'mg', NUTRIENT_BY_ID['creatine'])).toBe(5)
  })

  it('refuses IU for nutrients without a conversion', () => {
    expect(convertAmount(100, 'IU', NUTRIENT_BY_ID['zinc'])).toBeNull()
  })
})

describe('reference values', () => {
  it('uses age and sex bands', () => {
    expect(NUTRIENT_BY_ID['magnesium'].target({ ...man30, age: 35 })).toBe(420)
    expect(NUTRIENT_BY_ID['magnesium'].target(man30)).toBe(400)
    expect(NUTRIENT_BY_ID['iron'].target(woman55)).toBe(8)
    expect(NUTRIENT_BY_ID['iron'].target({ ...woman55, age: 40 })).toBe(18)
    expect(NUTRIENT_BY_ID['calcium'].target(woman55)).toBe(1200)
    expect(NUTRIENT_BY_ID['calcium'].ul(woman55)).toBe(2000)
    expect(NUTRIENT_BY_ID['vitamin-d'].target({ ...man30, age: 75 })).toBe(20)
    expect(NUTRIENT_BY_ID['vitamin-c'].target({ ...man30, smoker: true })).toBe(125)
  })
})

describe('classify', () => {
  it('flags vitamin D above 4,000 IU', () => {
    expect(classify(NUTRIENT_BY_ID['vitamin-d'], man30, 125, 0).status).toBe('over')
    expect(classify(NUTRIENT_BY_ID['vitamin-d'], man30, 100, 0).status).toBe('high')
    expect(classify(NUTRIENT_BY_ID['vitamin-d'], man30, 25, 0).status).toBe('met')
    expect(classify(NUTRIENT_BY_ID['vitamin-d'], man30, 5, 0).status).toBe('below')
  })

  it('applies the magnesium UL to supplements only', () => {
    const row = classify(NUTRIENT_BY_ID['magnesium'], man30, 200, 400)
    expect(row.total).toBe(600)
    expect(row.ulBasis).toBe(200)
    expect(row.status).toBe('met')
  })

  it('uses a studied range for creatine', () => {
    expect(classify(NUTRIENT_BY_ID['creatine'], man30, 5, 0).status).toBe('in-range')
    expect(classify(NUTRIENT_BY_ID['creatine'], man30, 2, 0).status).toBe('below')
    expect(classify(NUTRIENT_BY_ID['creatine'], man30, 10, 0).status).toBe('high')
  })
})

describe('supplementTotals + evaluateIntake', () => {
  it('sums a stack and sorts problems first', () => {
    const stack = [
      { supplement: supp('Vitamin D3', [{ name: 'Vitamin D3', amount: 5000, unit: 'IU' }], 1), servings: 1 },
      { supplement: supp('Multivitamin', [
        { name: 'Vitamin D', amount: 25, unit: 'mcg' },
        { name: 'Zinc', amount: 11, unit: 'mg' },
        { name: 'Proprietary blend', amount: 100, unit: 'mg' },
      ], 2), servings: 1 },
      { supplement: supp('Fish oil', [
        { name: 'EPA', amount: 360, unit: 'mg' },
        { name: 'DHA', amount: 240, unit: 'mg' },
      ], 3), servings: 2 },
    ]
    const { totals, sources, unmatched } = supplementTotals(stack)
    expect(totals['vitamin-d']).toBeCloseTo(150)
    expect(totals['epa-dha']).toBe(1200)
    expect(sources['vitamin-d']).toHaveLength(2)
    expect(unmatched).toEqual(['Proprietary blend'])

    const rows = evaluateIntake(man30, totals, sources)
    expect(rows[0].nutrient.id).toBe('vitamin-d')
    expect(rows[0].status).toBe('over')
    expect(rows.find((r) => r.nutrient.id === 'zinc')?.status).toBe('met')
  })
})
