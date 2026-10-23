import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../data/exercises'
import { FIGURES } from '../figures/poses'
import { ART } from './art'

describe('exercise visuals', () => {
  it('gives every exercise a picture, figure or photo', () => {
    const missing = EXERCISES.filter((e) => !ART[e.id] && !e.fedb && !(e.figure && FIGURES[e.figure]))
    expect(missing.map((e) => e.id)).toEqual([])
  })

  it('names every illustration after a real exercise', () => {
    const ids = new Set(EXERCISES.map((e) => e.id))
    expect(Object.keys(ART).filter((id) => !ids.has(id))).toEqual([])
  })

  it('has a picture for most calisthenics moves', () => {
    const cal = EXERCISES.filter((e) => e.category === 'calisthenics')
    expect(cal.filter((e) => ART[e.id]).length).toBeGreaterThan(40)
  })
})
