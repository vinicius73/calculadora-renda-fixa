import { describe, it, expect } from 'vitest'
import { TaxPeriod, toAnnualRate, toMonthlyRate, convertRate } from '@/lib/taxRate'

describe('TaxPeriod', () => {
  it('Monthly has value "monthly"', () => {
    expect(TaxPeriod.Monthly).toBe('monthly')
  })

  it('Annual has value "annual"', () => {
    expect(TaxPeriod.Annual).toBe('annual')
  })

  it('Monthly and Annual are distinct', () => {
    expect(TaxPeriod.Monthly).not.toBe(TaxPeriod.Annual)
  })
})

describe('toAnnualRate', () => {
  it('converts 0% monthly to 0% annual', () => {
    expect(toAnnualRate(0)).toBeCloseTo(0)
  })

  it('converts 1% monthly to ~12.6825% annual', () => {
    // (1.01^12 - 1) * 100 = 12.682503...
    expect(toAnnualRate(1)).toBeCloseTo(12.6825, 3)
  })

  it('converts 2% monthly to ~26.8242% annual', () => {
    // (1.02^12 - 1) * 100 = 26.824179...
    expect(toAnnualRate(2)).toBeCloseTo(26.8242, 3)
  })

  it('converts 0.5% monthly to ~6.1678% annual', () => {
    // (1.005^12 - 1) * 100 = 6.167781...
    expect(toAnnualRate(0.5)).toBeCloseTo(6.1678, 3)
  })

  it('annual rate is always greater than 12× monthly for any rate above 0', () => {
    for (const monthly of [0.1, 0.5, 1, 2, 5, 10]) {
      expect(toAnnualRate(monthly)).toBeGreaterThan(monthly * 12)
    }
  })

  it('is monotonically increasing', () => {
    expect(toAnnualRate(1)).toBeGreaterThan(toAnnualRate(0.5))
    expect(toAnnualRate(2)).toBeGreaterThan(toAnnualRate(1))
  })
})

describe('toMonthlyRate', () => {
  it('converts 0% annual to 0% monthly', () => {
    expect(toMonthlyRate(0)).toBeCloseTo(0)
  })

  it('converts 12% annual to ~0.9489% monthly', () => {
    // (1.12^(1/12) - 1) * 100 = 0.948879...
    expect(toMonthlyRate(12)).toBeCloseTo(0.9489, 3)
  })

  it('converts 100% annual to ~5.9463% monthly', () => {
    // (2^(1/12) - 1) * 100 = 5.946309...
    expect(toMonthlyRate(100)).toBeCloseTo(5.9463, 3)
  })

  it('converts 6% annual to ~0.4868% monthly', () => {
    // (1.06^(1/12) - 1) * 100 = 0.486755...
    expect(toMonthlyRate(6)).toBeCloseTo(0.4868, 3)
  })

  it('monthly rate is always less than annual / 12 for any rate above 0', () => {
    for (const annual of [6, 12, 24, 50, 100]) {
      expect(toMonthlyRate(annual)).toBeLessThan(annual / 12)
    }
  })

  it('is monotonically increasing', () => {
    expect(toMonthlyRate(12)).toBeGreaterThan(toMonthlyRate(6))
    expect(toMonthlyRate(24)).toBeGreaterThan(toMonthlyRate(12))
  })
})

describe('convertRate', () => {
  it('returns same value when from === to (Monthly)', () => {
    expect(convertRate(1.5, TaxPeriod.Monthly, TaxPeriod.Monthly)).toBe(1.5)
  })

  it('returns same value when from === to (Annual)', () => {
    expect(convertRate(20, TaxPeriod.Annual, TaxPeriod.Annual)).toBe(20)
  })

  it('converts Monthly → Annual using toAnnualRate', () => {
    expect(convertRate(1, TaxPeriod.Monthly, TaxPeriod.Annual)).toBeCloseTo(toAnnualRate(1), 10)
  })

  it('converts Annual → Monthly using toMonthlyRate', () => {
    expect(convertRate(12, TaxPeriod.Annual, TaxPeriod.Monthly)).toBeCloseTo(toMonthlyRate(12), 10)
  })

  it('round-trip Monthly → Annual → Monthly preserves original value', () => {
    for (const rate of [0.5, 1, 1.5, 2, 5]) {
      const annual = convertRate(rate, TaxPeriod.Monthly, TaxPeriod.Annual)
      const back = convertRate(annual, TaxPeriod.Annual, TaxPeriod.Monthly)
      expect(back).toBeCloseTo(rate, 8)
    }
  })

  it('round-trip Annual → Monthly → Annual preserves original value', () => {
    for (const rate of [6, 12, 15, 24, 100]) {
      const monthly = convertRate(rate, TaxPeriod.Annual, TaxPeriod.Monthly)
      const back = convertRate(monthly, TaxPeriod.Monthly, TaxPeriod.Annual)
      expect(back).toBeCloseTo(rate, 8)
    }
  })
})
