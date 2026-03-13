import { describe, it, expect } from 'vitest'
import { reverseCalculate } from '@/lib/reverseCalculate'
import { toMonthlyRate } from '@/lib/taxRate'
import { calcule } from '@/lib/calcule'

describe('reverseCalculate', () => {
  it('returns 0 when goal is already met by initial investment alone', () => {
    // 10000 initial, goal 5000 — already met
    const result = reverseCalculate(5000, 10000, 1, 12)
    expect(result).toBe(0)
  })

  it('returns 0 for zero or negative period', () => {
    expect(reverseCalculate(100000, 0, 1, 0)).toBe(0)
    expect(reverseCalculate(100000, 0, 1, -1)).toBe(0)
  })

  it('returns 0 for zero or negative goal', () => {
    expect(reverseCalculate(0, 1000, 1, 12)).toBe(0)
    expect(reverseCalculate(-100, 1000, 1, 12)).toBe(0)
  })

  it('round-trip: simulating with the computed PMT reaches the goal', () => {
    const goal = 100_000
    const initial = 10_000
    const annualRate = 12
    const months = 24
    const monthlyRate = toMonthlyRate(annualRate)

    const pmt = reverseCalculate(goal, initial, monthlyRate, months)
    expect(pmt).toBeGreaterThan(0)

    const results = calcule({
      initialValue: initial,
      monthlyValue: pmt,
      monthlyTax: monthlyRate,
      period: months,
    })
    const finalValue = results[results.length - 1]!.value

    // Should be within R$ 0.01 of the goal
    expect(finalValue).toBeCloseTo(goal, 0)
  })

  it('round-trip with zero initial value', () => {
    const goal = 50_000
    const monthlyRate = toMonthlyRate(10)
    const months = 36

    const pmt = reverseCalculate(goal, 0, monthlyRate, months)
    const results = calcule({
      initialValue: 0,
      monthlyValue: pmt,
      monthlyTax: monthlyRate,
      period: months,
    })
    const finalValue = results[results.length - 1]!.value

    expect(finalValue).toBeCloseTo(goal, 0)
  })

  it('handles zero interest rate with linear math', () => {
    // No interest: need (goal - initial) / months per month
    const goal = 1200
    const initial = 0
    const months = 12
    const pmt = reverseCalculate(goal, initial, 0, months)
    expect(pmt).toBeCloseTo(100) // 1200 / 12
  })

  it('larger initial investment reduces required PMT', () => {
    const goal = 100_000
    const rate = toMonthlyRate(12)
    const months = 24
    const pmt0 = reverseCalculate(goal, 0, rate, months)
    const pmt10k = reverseCalculate(goal, 10_000, rate, months)
    expect(pmt10k).toBeLessThan(pmt0)
  })

  it('longer period reduces required PMT', () => {
    const goal = 100_000
    const rate = toMonthlyRate(12)
    const pmt24 = reverseCalculate(goal, 0, rate, 24)
    const pmt48 = reverseCalculate(goal, 0, rate, 48)
    expect(pmt48).toBeLessThan(pmt24)
  })
})
