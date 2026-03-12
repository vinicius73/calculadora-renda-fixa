import { describe, it, expect } from 'vitest'
import { useMoney } from '@/composables/useMoney'

describe('useMoney', () => {
  const { formatMoney } = useMoney()

  it('formats 1000 as R$ 1.000,00', () => {
    expect(formatMoney(1000)).toBe('R$\u00a01.000,00')
  })

  it('formats values with up to 3 decimal places', () => {
    expect(formatMoney(1.123)).toBe('R$\u00a01,123')
  })

  it('formats 0 as R$ 0,00', () => {
    expect(formatMoney(0)).toBe('R$\u00a00,00')
  })
})
