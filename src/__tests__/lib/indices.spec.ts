import { describe, it, expect } from 'vitest'
import { calculateEffectiveAnnualRate, DEFAULT_INDICES, INDEX_KEYS } from '@/lib/indices'

describe('DEFAULT_INDICES', () => {
  it('contains CDI, SELIC and IPCA keys', () => {
    expect(INDEX_KEYS).toEqual(['CDI', 'SELIC', 'IPCA'])
    for (const key of INDEX_KEYS) {
      expect(DEFAULT_INDICES[key]).toBeDefined()
    }
  })

  it('each entry has required fields', () => {
    for (const key of INDEX_KEYS) {
      const entry = DEFAULT_INDICES[key]
      expect(typeof entry.annualRate).toBe('number')
      expect(entry.annualRate).toBeGreaterThan(0)
      expect(typeof entry.label).toBe('string')
      expect(typeof entry.reference).toBe('string')
    }
  })
})

describe('calculateEffectiveAnnualRate', () => {
  it('100% multiplier returns the index rate unchanged', () => {
    expect(calculateEffectiveAnnualRate(13.65, 100)).toBeCloseTo(13.65)
  })

  it('110% multiplier returns 110% of the index rate', () => {
    expect(calculateEffectiveAnnualRate(13.65, 110)).toBeCloseTo(15.015)
  })

  it('90% multiplier returns 90% of the index rate', () => {
    expect(calculateEffectiveAnnualRate(10, 90)).toBeCloseTo(9)
  })

  it('0% multiplier returns 0', () => {
    expect(calculateEffectiveAnnualRate(13.65, 0)).toBeCloseTo(0)
  })

  it('is proportional to multiplier', () => {
    const base = 12
    expect(calculateEffectiveAnnualRate(base, 200)).toBeCloseTo(
      calculateEffectiveAnnualRate(base, 100) * 2,
    )
  })
})
