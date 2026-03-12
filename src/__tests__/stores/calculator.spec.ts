import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCalculatorStore } from '@/stores/calculator'
import { toMonthlyRate } from '@/lib/taxRate'

describe('useCalculatorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has correct defaults', () => {
    const store = useCalculatorStore()
    expect(store.entry.initialValue).toBe(2000)
    expect(store.entry.monthlyTax).toBeCloseTo(toMonthlyRate(12), 10)
    expect(store.entry.period).toBe(12)
  })

  it('runs initial calculation (hasResults=true)', () => {
    const store = useCalculatorStore()
    expect(store.hasResults).toBe(true)
  })

  it('setEntry updates entry partially', () => {
    const store = useCalculatorStore()
    store.setEntry({ period: 24 })
    expect(store.entry.period).toBe(24)
    expect(store.entry.initialValue).toBe(2000)
  })

  it('calculate() populates results with length=period', () => {
    const store = useCalculatorStore()
    store.setEntry({ period: 6 })
    store.calculate()
    expect(store.results).toHaveLength(6)
  })

  it('lastResult.tax equals value minus accumulative', () => {
    const store = useCalculatorStore()
    store.calculate()
    const last = store.results[store.results.length - 1]
    expect(store.lastResult?.tax).toBeCloseTo(last.value - last.accumulative)
  })

  it('reset() clears results', () => {
    const store = useCalculatorStore()
    store.reset()
    expect(store.results).toHaveLength(0)
    expect(store.hasResults).toBe(false)
    expect(store.loading).toBe(false)
  })
})
