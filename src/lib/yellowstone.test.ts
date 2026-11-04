import { describe, expect, it } from 'vitest'
import { applyDecision, foodPlan, isEasyWeek, levelState, weekPlan, weeklyDecision, weightTrend, type SessionLog } from './yellowstone'

const log = (p: Partial<SessionLog>): SessionLog => ({ date: '2026-11-02', session: 'walkHills', status: 'done', effort: 4, soreness: 2, ...p })

describe('Yellowstone program', () => {
  it('starts from the walk you can already do', () => {
    const w = weekPlan(1, 15, '2026-11-02', '2027-07-15', '2026-11-02')
    expect(w.sessions.find((s) => s.key === 'walkHills')!.walk!.minutes).toBe(15)
    expect(w.phase).toBe('foundation')
  })

  it('raises only one demand per step', () => {
    for (let n = 2; n < 40; n++) {
      const a = levelState(n - 1, 15)
      const b = levelState(n, 15)
      const changed = [b.walkMin !== a.walkMin || b.longMin !== a.longMin, b.inclinePct !== a.inclinePct, b.packLb !== a.packLb].filter(Boolean).length
      expect(changed, `step ${n}`).toBeLessThanOrEqual(1)
    }
  })

  it('makes every fourth week lighter and tapers before the trip', () => {
    expect(isEasyWeek('2026-11-02', '2026-11-23')).toBe(true)
    expect(isEasyWeek('2026-11-02', '2026-11-16')).toBe(false)
    const last = weekPlan(30, 15, '2026-11-02', '2027-07-15', '2027-07-05')
    expect(last.phase).toBe('taper')
    const full = levelState(30, 15).longMin
    expect(last.sessions.find((s) => s.key === 'easyOutdoor')!.walk!.minutes).toBeLessThan(full)
  })

  it('never asks for running or jumping', () => {
    const w = weekPlan(25, 15, '2026-11-02', '2027-07-15', '2027-03-01')
    const ids = w.sessions.flatMap((s) => s.exercises.map((e) => e.id))
    expect(ids.some((id) => /jump|run|burpee|smith|glute-drive/.test(id))).toBe(false)
  })

  it('suggests progress, repeat or easing back from how you recovered', () => {
    const good = [log({ session: 'strengthA' }), log({}), log({ session: 'strengthB' }), log({ session: 'easyOutdoor' })]
    expect(weeklyDecision(good, false).decision).toBe('progress')
    expect(weeklyDecision(good, true).decision).toBe('repeat')
    expect(weeklyDecision([...good.slice(0, 2), log({ status: 'skipped' }), log({ status: 'skipped' })], false).decision).toBe('repeat')
    expect(weeklyDecision([log({ pain: true }), ...good], false).decision).toBe('ease')
    expect(applyDecision(1, 'ease')).toBe(1)
  })

  it('smooths weight into a 7-day average', () => {
    const t = weightTrend([
      { date: '2026-11-01', kg: 113 },
      { date: '2026-11-02', kg: 115 },
      { date: '2026-11-03', kg: 114 },
    ])
    expect(t.at(-1)!.avgKg).toBeCloseTo(114)
  })

  it('keeps calories above the floor', () => {
    const f = foodPlan({ sex: 'female', age: 32, heightCm: 173, weightKg: 113, activity: 1.375, deficit: 400, proteinPerKg: 1.4, referenceKg: 104 })
    expect(f.kcal).toBe(Math.round((f.maintenance - 400) / 10) * 10)
    expect(f.protein).toBe(146)
    expect(foodPlan({ sex: 'female', age: 32, heightCm: 150, weightKg: 50, activity: 1.2, deficit: 500, proteinPerKg: 1.4, referenceKg: 50 }).kcal).toBe(1200)
  })
})
