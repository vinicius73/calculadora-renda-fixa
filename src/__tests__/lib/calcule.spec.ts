import { describe, it, expect } from 'vitest'
import { calcule } from '@/lib/calcule'
import { toMonthlyRate, toAnnualRate } from '@/lib/taxRate'

describe('calcule', () => {
  it('returns empty array for period=0', () => {
    const result = calcule({ initialValue: 1000, monthlyValue: 100, monthlyTax: 1, period: 0 })
    expect(result).toEqual([])
  })

  it('returns array with length equal to period', () => {
    const result = calcule({ initialValue: 1000, monthlyValue: 100, monthlyTax: 1, period: 12 })
    expect(result).toHaveLength(12)
  })

  it('pads index with zeros for period=12 (2 digits)', () => {
    const result = calcule({ initialValue: 1000, monthlyValue: 100, monthlyTax: 1, period: 12 })
    expect(result[0].index).toBe('01')
    expect(result[11].index).toBe('12')
  })

  it('pads index with zeros for period=100 (3 digits)', () => {
    const result = calcule({ initialValue: 1000, monthlyValue: 100, monthlyTax: 1, period: 100 })
    expect(result[0].index).toBe('001')
    expect(result[9].index).toBe('010')
    expect(result[99].index).toBe('100')
  })

  it('calculates correct values for month 1', () => {
    const entry = { initialValue: 1000, monthlyValue: 200, monthlyTax: 10, period: 1 }
    const result = calcule(entry)
    // tax = (1000 + 200) * 0.1 = 120
    // value = 1000 + 200 + 120 = 1320
    // accumulative = 1*200 + 1000 = 1200
    expect(result[0].tax).toBeCloseTo(120)
    expect(result[0].value).toBeCloseTo(1320)
    expect(result[0].accumulative).toBeCloseTo(1200)
  })

  it('accumulative grows linearly', () => {
    const result = calcule({ initialValue: 0, monthlyValue: 100, monthlyTax: 0, period: 5 })
    result.forEach((r, i) => {
      expect(r.accumulative).toBeCloseTo((i + 1) * 100)
    })
  })

  it('compound interest grows more than simple interest', () => {
    const result = calcule({ initialValue: 1000, monthlyValue: 0, monthlyTax: 1, period: 12 })
    const totalTax = result.reduce((sum, r) => sum + r.tax, 0)
    const simpleTax = 1000 * 0.01 * 12
    expect(totalTax).toBeGreaterThan(simpleTax)
  })

  it('handles initialValue=0', () => {
    const result = calcule({ initialValue: 0, monthlyValue: 100, monthlyTax: 1, period: 1 })
    expect(result[0].tax).toBeCloseTo(1)
    expect(result[0].value).toBeCloseTo(101)
  })

  it('handles monthlyValue=0', () => {
    const result = calcule({ initialValue: 1000, monthlyValue: 0, monthlyTax: 1, period: 1 })
    expect(result[0].tax).toBeCloseTo(10)
    expect(result[0].value).toBeCloseTo(1010)
  })

  it('handles monthlyTax=0', () => {
    const result = calcule({ initialValue: 1000, monthlyValue: 100, monthlyTax: 0, period: 3 })
    result.forEach((r) => {
      expect(r.tax).toBe(0)
    })
    expect(result[2].value).toBeCloseTo(1300)
  })
})

describe('calcule × taxRate consistency', () => {
  it('toMonthlyRate(12%) applied for 12 months yields exactly 12% growth', () => {
    const monthlyTax = toMonthlyRate(12)
    const result = calcule({ initialValue: 1000, monthlyValue: 0, monthlyTax, period: 12 })
    expect(result[11].value).toBeCloseTo(1000 * 1.12, 6)
  })

  it('toMonthlyRate(6%) applied for 12 months yields exactly 6% growth', () => {
    const monthlyTax = toMonthlyRate(6)
    const result = calcule({ initialValue: 1000, monthlyValue: 0, monthlyTax, period: 12 })
    expect(result[11].value).toBeCloseTo(1000 * 1.06, 6)
  })

  it('toMonthlyRate(100%) applied for 12 months yields exactly 100% growth', () => {
    const monthlyTax = toMonthlyRate(100)
    const result = calcule({ initialValue: 1000, monthlyValue: 0, monthlyTax, period: 12 })
    expect(result[11].value).toBeCloseTo(2000, 4)
  })

  it('1% monthly applied for 12 months equals toAnnualRate(1%) growth', () => {
    const result = calcule({ initialValue: 1000, monthlyValue: 0, monthlyTax: 1, period: 12 })
    const actualAnnualPct = (result[11].value / 1000 - 1) * 100
    expect(actualAnnualPct).toBeCloseTo(toAnnualRate(1), 8)
  })

  it('2% monthly applied for 12 months equals toAnnualRate(2%) growth', () => {
    const result = calcule({ initialValue: 1000, monthlyValue: 0, monthlyTax: 2, period: 12 })
    const actualAnnualPct = (result[11].value / 1000 - 1) * 100
    expect(actualAnnualPct).toBeCloseTo(toAnnualRate(2), 8)
  })

  it('round-trip: monthly → toAnnualRate → toMonthlyRate → calcule gives same result', () => {
    const monthlyTax = 1.5
    const annualTax = toAnnualRate(monthlyTax)
    const backToMonthly = toMonthlyRate(annualTax)

    const r1 = calcule({ initialValue: 1000, monthlyValue: 0, monthlyTax, period: 12 })
    const r2 = calcule({
      initialValue: 1000,
      monthlyValue: 0,
      monthlyTax: backToMonthly,
      period: 12,
    })

    expect(r2[11].value).toBeCloseTo(r1[11].value, 6)
  })
})
