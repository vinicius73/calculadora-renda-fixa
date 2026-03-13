import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { parseBrNumber, formatBrNumber, useBrInput, BrInputMode } from '@/composables/useBrInput'

describe('parseBrNumber', () => {
  it('parses plain integer', () => {
    expect(parseBrNumber('1234')).toBe(1234)
  })

  it('parses with decimal comma', () => {
    expect(parseBrNumber('1234,56')).toBe(1234.56)
  })

  it('parses with thousands dot', () => {
    expect(parseBrNumber('1.234')).toBe(1234)
  })

  it('parses combined thousands and decimal', () => {
    expect(parseBrNumber('1.234,56')).toBe(1234.56)
  })

  it('parses multiple thousands groups', () => {
    expect(parseBrNumber('1.234.567,89')).toBe(1234567.89)
  })

  it('parses small decimal', () => {
    expect(parseBrNumber('0,9450')).toBe(0.945)
  })

  it('returns NaN for empty string', () => {
    expect(parseBrNumber('')).toBeNaN()
  })

  it('returns NaN for non-numeric string', () => {
    expect(parseBrNumber('abc')).toBeNaN()
  })

  it('trims whitespace', () => {
    expect(parseBrNumber('  100,50  ')).toBe(100.5)
  })
})

describe('formatBrNumber', () => {
  it('formats currency with 2 decimal places', () => {
    expect(formatBrNumber(1234.56, BrInputMode.Currency)).toBe('1.234,56')
  })

  it('formats currency rounds to 2 decimal places', () => {
    expect(formatBrNumber(1234, BrInputMode.Currency)).toBe('1.234,00')
  })

  it('formats decimal without trailing zeros', () => {
    expect(formatBrNumber(12.5, BrInputMode.Decimal)).toBe('12,5')
  })

  it('formats decimal up to 4 places', () => {
    expect(formatBrNumber(0.945, BrInputMode.Decimal)).toBe('0,945')
  })

  it('formats integer without decimals', () => {
    expect(formatBrNumber(12, BrInputMode.Integer)).toBe('12')
  })

  it('formats large integer with thousands separator', () => {
    expect(formatBrNumber(1234, BrInputMode.Integer)).toBe('1.234')
  })

  it('returns empty string for non-finite values', () => {
    expect(formatBrNumber(Infinity, BrInputMode.Currency)).toBe('')
    expect(formatBrNumber(NaN, BrInputMode.Currency)).toBe('')
  })
})

describe('useBrInput', () => {
  function makeInput(initial: number, mode: BrInputMode = BrInputMode.Currency) {
    const value = ref(initial)
    const input = useBrInput(
      () => value.value,
      (v) => {
        value.value = v
      },
      mode,
    )
    return { value, input }
  }

  function makeInputEvent(raw: string): Event {
    return { target: { value: raw } } as unknown as Event
  }

  it('initializes display with formatted value', () => {
    const { input } = makeInput(1234.56, BrInputMode.Currency)
    expect(input.display.value).toBe('1.234,56')
  })

  it('onInput updates display and calls setter', () => {
    const { value, input } = makeInput(0, BrInputMode.Currency)
    input.onFocus()
    input.onInput(makeInputEvent('1.500,00'))
    expect(input.display.value).toBe('1.500,00')
    expect(value.value).toBe(1500)
  })

  it('onBlur formats the display', () => {
    const { input } = makeInput(0, BrInputMode.Currency)
    input.onFocus()
    input.onInput(makeInputEvent('1500'))
    input.onBlur()
    expect(input.display.value).toBe('1.500,00')
  })

  it('onBlur restores display on invalid input', () => {
    const { input } = makeInput(200, BrInputMode.Currency)
    input.onFocus()
    input.onInput(makeInputEvent('abc'))
    input.onBlur()
    expect(input.display.value).toBe('200,00')
  })

  it('external value change updates display when not focused', async () => {
    const { value, input } = makeInput(100, BrInputMode.Currency)
    expect(input.display.value).toBe('100,00')
    value.value = 2500
    // watcher is async — nextTick
    await Promise.resolve()
    expect(input.display.value).toBe('2.500,00')
  })

  it('external value change does not update display when focused', async () => {
    const { value, input } = makeInput(100, BrInputMode.Currency)
    input.onFocus()
    value.value = 2500
    await Promise.resolve()
    expect(input.display.value).toBe('100,00') // unchanged
  })

  it('ignores negative input', () => {
    const { value, input } = makeInput(100, BrInputMode.Currency)
    input.onFocus()
    input.onInput(makeInputEvent('-50'))
    expect(value.value).toBe(100) // unchanged
  })

  it('decimal mode formats without trailing zeros', () => {
    const { input } = makeInput(12.5, BrInputMode.Decimal)
    expect(input.display.value).toBe('12,5')
  })

  it('integer mode formats without decimals', () => {
    const { input } = makeInput(12, BrInputMode.Integer)
    expect(input.display.value).toBe('12')
  })
})
