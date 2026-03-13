import { describe, it, expect } from 'vitest'
import { getIRRate, calculateIR, DEFAULT_IR_BRACKETS, type IRBracket } from '@/lib/irBrackets'

describe('DEFAULT_IR_BRACKETS', () => {
  it('has 4 brackets', () => {
    expect(DEFAULT_IR_BRACKETS).toHaveLength(4)
  })

  it('last bracket has null upToMonths', () => {
    const last = DEFAULT_IR_BRACKETS[DEFAULT_IR_BRACKETS.length - 1]!
    expect(last.upToMonths).toBeNull()
  })
})

describe('getIRRate', () => {
  const brackets = DEFAULT_IR_BRACKETS

  it('returns 22.5% for 1 month (≤ 6)', () => {
    expect(getIRRate(1, brackets)).toBe(22.5)
  })

  it('returns 22.5% for exactly 6 months', () => {
    expect(getIRRate(6, brackets)).toBe(22.5)
  })

  it('returns 20% for 7 months (6–12)', () => {
    expect(getIRRate(7, brackets)).toBe(20)
  })

  it('returns 20% for exactly 12 months', () => {
    expect(getIRRate(12, brackets)).toBe(20)
  })

  it('returns 17.5% for 13 months (12–24)', () => {
    expect(getIRRate(13, brackets)).toBe(17.5)
  })

  it('returns 17.5% for exactly 24 months', () => {
    expect(getIRRate(24, brackets)).toBe(17.5)
  })

  it('returns 15% for 25 months (above 24)', () => {
    expect(getIRRate(25, brackets)).toBe(15)
  })

  it('returns 15% for very long periods', () => {
    expect(getIRRate(600, brackets)).toBe(15)
  })

  it('works with custom brackets', () => {
    const custom: IRBracket[] = [
      { upToMonths: 12, rate: 25, label: 'Até 12 meses' },
      { upToMonths: null, rate: 10, label: 'Acima de 12 meses' },
    ]
    expect(getIRRate(6, custom)).toBe(25)
    expect(getIRRate(24, custom)).toBe(10)
  })
})

describe('calculateIR', () => {
  const brackets = DEFAULT_IR_BRACKETS

  it('returns 0 when gain is 0', () => {
    expect(calculateIR(0, 12, brackets)).toBe(0)
  })

  it('returns 0 when gain is negative', () => {
    expect(calculateIR(-100, 12, brackets)).toBe(0)
  })

  it('applies 22.5% to gain for 6-month period', () => {
    // gain = 1000, rate = 22.5%
    expect(calculateIR(1000, 6, brackets)).toBeCloseTo(225)
  })

  it('applies 15% to gain for 36-month period', () => {
    // gain = 2000, rate = 15%
    expect(calculateIR(2000, 36, brackets)).toBeCloseTo(300)
  })

  it('IR amount is proportional to gain', () => {
    const ir1 = calculateIR(1000, 36, brackets)
    const ir2 = calculateIR(2000, 36, brackets)
    expect(ir2).toBeCloseTo(ir1 * 2)
  })
})
