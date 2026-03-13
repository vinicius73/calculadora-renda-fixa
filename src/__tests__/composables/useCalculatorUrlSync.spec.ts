import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, defineComponent, h } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import {
  parseCalculatorUrlParams,
  encodeCalculatorUrlParams,
  useCalculatorUrlSync,
  type CalculatorUrlParams,
} from '@/composables/useCalculatorUrlSync'
import { useCalculatorStore } from '@/stores/calculator'
import { TaxPeriod } from '@/lib/taxRate'
import type { Entry } from '@/lib/calcule'

const validPayload: CalculatorUrlParams = {
  initialValue: 5000,
  monthlyValue: 500,
  monthlyTax: 0.5,
  period: 24,
  taxPeriod: TaxPeriod.Monthly,
}

function toBase64(json: unknown): string {
  return btoa(JSON.stringify(json))
}

describe('parseCalculatorUrlParams', () => {
  it('returns normalized params for valid BASE64 payload', () => {
    const raw = toBase64(validPayload)
    const result = parseCalculatorUrlParams(raw)
    expect(result).toEqual(validPayload)
  })

  it('floors period when float is provided', () => {
    const raw = toBase64({ ...validPayload, period: 36.9 })
    const result = parseCalculatorUrlParams(raw)
    expect(result?.period).toBe(36)
  })

  it('returns null for invalid BASE64', () => {
    expect(parseCalculatorUrlParams('not-valid-base64!!!')).toBeNull()
    expect(parseCalculatorUrlParams('')).toBeNull()
  })

  it('returns null for valid BASE64 but invalid JSON', () => {
    const raw = btoa('{ invalid json }')
    expect(parseCalculatorUrlParams(raw)).toBeNull()
  })

  it('returns null when parsed value is null', () => {
    expect(parseCalculatorUrlParams(btoa('null'))).toBeNull()
  })

  it('returns null when parsed value is an array', () => {
    expect(parseCalculatorUrlParams(btoa('[]'))).toBeNull()
  })

  it('returns null when required fields are missing', () => {
    const raw = toBase64({ initialValue: 1000 })
    expect(parseCalculatorUrlParams(raw)).toBeNull()
  })

  it('returns null when initialValue is negative', () => {
    const raw = toBase64({ ...validPayload, initialValue: -1 })
    expect(parseCalculatorUrlParams(raw)).toBeNull()
  })

  it('returns null when monthlyValue is negative', () => {
    const raw = toBase64({ ...validPayload, monthlyValue: -100 })
    expect(parseCalculatorUrlParams(raw)).toBeNull()
  })

  it('returns null when period is less than 1', () => {
    const raw = toBase64({ ...validPayload, period: 0 })
    expect(parseCalculatorUrlParams(raw)).toBeNull()
  })

  it('returns null when period is greater than 600', () => {
    const raw = toBase64({ ...validPayload, period: 601 })
    expect(parseCalculatorUrlParams(raw)).toBeNull()
  })

  it('returns null when taxPeriod is not monthly or annual', () => {
    const raw = toBase64({ ...validPayload, taxPeriod: 'yearly' })
    expect(parseCalculatorUrlParams(raw)).toBeNull()
  })

  it('returns null when a numeric field is a string', () => {
    const raw = toBase64({ ...validPayload, period: '12' })
    expect(parseCalculatorUrlParams(raw)).toBeNull()
  })

  it('returns null when value is NaN', () => {
    const raw = toBase64({ ...validPayload, initialValue: NaN })
    expect(parseCalculatorUrlParams(raw)).toBeNull()
  })

  it('accepts period at boundary 1 and 600', () => {
    expect(parseCalculatorUrlParams(toBase64({ ...validPayload, period: 1 }))?.period).toBe(1)
    expect(parseCalculatorUrlParams(toBase64({ ...validPayload, period: 600 }))?.period).toBe(600)
  })
})

describe('encodeCalculatorUrlParams', () => {
  it('encodes entry and taxPeriod to BASE64', () => {
    const entry: Entry = {
      initialValue: 3000,
      monthlyValue: 200,
      monthlyTax: 0.4,
      period: 12,
    }
    const encoded = encodeCalculatorUrlParams(entry, TaxPeriod.Annual)
    expect(encoded).toBeTruthy()
    const decoded = atob(encoded)
    const parsed = JSON.parse(decoded) as CalculatorUrlParams
    expect(parsed.initialValue).toBe(entry.initialValue)
    expect(parsed.monthlyValue).toBe(entry.monthlyValue)
    expect(parsed.monthlyTax).toBe(entry.monthlyTax)
    expect(parsed.period).toBe(entry.period)
    expect(parsed.taxPeriod).toBe(TaxPeriod.Annual)
  })

  it('round-trips with parseCalculatorUrlParams', () => {
    const entry: Entry = {
      initialValue: 1000,
      monthlyValue: 0,
      monthlyTax: 1,
      period: 36,
    }
    const encoded = encodeCalculatorUrlParams(entry, TaxPeriod.Monthly)
    const parsed = parseCalculatorUrlParams(encoded)
    expect(parsed).toEqual({
      ...entry,
      taxPeriod: TaxPeriod.Monthly,
    })
  })
})

describe('useCalculatorUrlSync', () => {
  const initialPathname = '/'
  let replaceStateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    Object.defineProperty(window, 'location', {
      value: {
        pathname: initialPathname,
        search: '',
      },
      writable: true,
    })
    replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  it('on mount with valid ?p= applies params to store and taxPeriod', async () => {
    const encoded = encodeCalculatorUrlParams(
      {
        initialValue: 10000,
        monthlyValue: 300,
        monthlyTax: 0.6,
        period: 48,
      },
      TaxPeriod.Annual,
    )
    window.location.search = `?p=${encodeURIComponent(encoded)}`

    const taxPeriod = ref<TaxPeriod>(TaxPeriod.Monthly)
    const TestComponent = defineComponent({
      setup() {
        useCalculatorUrlSync(taxPeriod)
        return () => h('div')
      },
    })

    mount(TestComponent, {
      global: {
        directives: { maska: {} },
      },
    })

    const store = useCalculatorStore()
    expect(store.entry.initialValue).toBe(10000)
    expect(store.entry.monthlyValue).toBe(300)
    expect(store.entry.monthlyTax).toBe(0.6)
    expect(store.entry.period).toBe(48)
    expect(taxPeriod.value).toBe(TaxPeriod.Annual)
    expect(store.hasResults).toBe(true)
    expect(store.results).toHaveLength(48)
  })

  it('on mount with invalid ?p= leaves store and taxPeriod unchanged', async () => {
    const store = useCalculatorStore()
    const beforeEntry = { ...store.entry }
    window.location.search = '?p=invalid-base64'

    const taxPeriod = ref<TaxPeriod>(TaxPeriod.Annual)
    const TestComponent = defineComponent({
      setup() {
        useCalculatorUrlSync(taxPeriod)
        return () => h('div')
      },
    })

    mount(TestComponent, {
      global: {
        directives: { maska: {} },
      },
    })

    expect(store.entry).toEqual(beforeEntry)
    expect(taxPeriod.value).toBe(TaxPeriod.Annual)
  })

  it('on mount without ?p= leaves store and taxPeriod unchanged', async () => {
    window.location.search = ''

    const taxPeriod = ref<TaxPeriod>(TaxPeriod.Annual)
    const TestComponent = defineComponent({
      setup() {
        useCalculatorUrlSync(taxPeriod)
        return () => h('div')
      },
    })

    const store = useCalculatorStore()
    const beforeEntry = { ...store.entry }
    mount(TestComponent, {
      global: {
        directives: { maska: {} },
      },
    })

    expect(store.entry).toEqual(beforeEntry)
    expect(taxPeriod.value).toBe(TaxPeriod.Annual)
  })

  it('updates URL with replaceState when entry or taxPeriod change (debounced)', async () => {
    vi.useFakeTimers()
    window.location.search = ''

    const taxPeriod = ref<TaxPeriod>(TaxPeriod.Annual)
    const TestComponent = defineComponent({
      setup() {
        useCalculatorUrlSync(taxPeriod)
        return () => h('div')
      },
    })

    mount(TestComponent, {
      global: {
        directives: { maska: {} },
      },
    })

    const store = useCalculatorStore()
    replaceStateSpy.mockClear()

    store.setEntry({ period: 18 })
    expect(replaceStateSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(400)
    expect(replaceStateSpy).toHaveBeenCalled()
    const callUrl = replaceStateSpy.mock.calls[0]?.[2] as string
    expect(callUrl).toContain('?p=')
    const match = callUrl.match(/\?p=(.+)$/)
    const param = match?.[1]
    expect(param).toBeTruthy()
    const decoded = parseCalculatorUrlParams(decodeURIComponent(param!))
    expect(decoded?.period).toBe(18)

    vi.useRealTimers()
  })
})
