import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, defineComponent, h } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import {
  parseCalculatorUrlParams,
  encodeCalculatorUrlParams,
  useCalculatorUrlSync,
  type CalculatorUrlParams,
  type UrlSyncRefs,
} from '@/composables/useCalculatorUrlSync'
import { useCalculatorStore } from '@/stores/calculator'
import { TaxPeriod, RateSource } from '@/lib/taxRate'
import type { Entry } from '@/lib/calcule'
import type { IndexKey } from '@/lib/indices'

const validPayload: CalculatorUrlParams = {
  initialValue: 5000,
  monthlyValue: 500,
  monthlyTax: 0.5,
  period: 24,
  taxPeriod: TaxPeriod.Monthly,
  goalMode: false,
  goalTarget: 0,
  rateSource: RateSource.Fixed,
  selectedIndex: 'CDI',
  indexMultiplier: 100,
}

function toBase64(json: unknown): string {
  return btoa(JSON.stringify(json))
}

function makeRefs(overrides?: Partial<UrlSyncRefs>): UrlSyncRefs {
  return {
    taxPeriod: ref<TaxPeriod>(TaxPeriod.Annual),
    rateSource: ref<RateSource>(RateSource.Fixed),
    selectedIndex: ref<IndexKey>('CDI'),
    indexMultiplier: ref<number>(100),
    ...overrides,
  }
}

function mountWithSync(refs: UrlSyncRefs) {
  const TestComponent = defineComponent({
    setup() {
      useCalculatorUrlSync(refs)
      return () => h('div')
    },
  })
  mount(TestComponent, { global: { directives: { maska: {} } } })
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

  describe('optional fields — backward compatibility', () => {
    const legacy = {
      initialValue: 1000,
      monthlyValue: 100,
      monthlyTax: 0.5,
      period: 12,
      taxPeriod: TaxPeriod.Annual,
    }

    it('defaults goalMode to false when absent', () => {
      expect(parseCalculatorUrlParams(toBase64(legacy))?.goalMode).toBe(false)
    })

    it('defaults goalTarget to 0 when absent', () => {
      expect(parseCalculatorUrlParams(toBase64(legacy))?.goalTarget).toBe(0)
    })

    it('defaults rateSource to Fixed when absent', () => {
      expect(parseCalculatorUrlParams(toBase64(legacy))?.rateSource).toBe(RateSource.Fixed)
    })

    it('defaults selectedIndex to CDI when absent', () => {
      expect(parseCalculatorUrlParams(toBase64(legacy))?.selectedIndex).toBe('CDI')
    })

    it('defaults indexMultiplier to 100 when absent', () => {
      expect(parseCalculatorUrlParams(toBase64(legacy))?.indexMultiplier).toBe(100)
    })

    it('uses provided goalMode when present', () => {
      expect(parseCalculatorUrlParams(toBase64({ ...legacy, goalMode: true }))?.goalMode).toBe(true)
    })

    it('uses provided rateSource when valid', () => {
      expect(
        parseCalculatorUrlParams(toBase64({ ...legacy, rateSource: RateSource.Index }))?.rateSource,
      ).toBe(RateSource.Index)
    })

    it('falls back to default for invalid rateSource', () => {
      expect(
        parseCalculatorUrlParams(toBase64({ ...legacy, rateSource: 'unknown' }))?.rateSource,
      ).toBe(RateSource.Fixed)
    })

    it('uses provided selectedIndex when valid', () => {
      expect(
        parseCalculatorUrlParams(toBase64({ ...legacy, selectedIndex: 'SELIC' }))?.selectedIndex,
      ).toBe('SELIC')
    })

    it('falls back to CDI for invalid selectedIndex', () => {
      expect(
        parseCalculatorUrlParams(toBase64({ ...legacy, selectedIndex: 'INVALID' }))?.selectedIndex,
      ).toBe('CDI')
    })
  })
})

describe('encodeCalculatorUrlParams', () => {
  it('encodes entry and state to BASE64', () => {
    const entry: Entry = {
      initialValue: 3000,
      monthlyValue: 200,
      monthlyTax: 0.4,
      period: 12,
    }
    const encoded = encodeCalculatorUrlParams(entry, { taxPeriod: TaxPeriod.Annual })
    expect(encoded).toBeTruthy()
    const decoded = atob(encoded)
    const parsed = JSON.parse(decoded) as CalculatorUrlParams
    expect(parsed.initialValue).toBe(entry.initialValue)
    expect(parsed.monthlyValue).toBe(entry.monthlyValue)
    expect(parsed.monthlyTax).toBe(entry.monthlyTax)
    expect(parsed.period).toBe(entry.period)
    expect(parsed.taxPeriod).toBe(TaxPeriod.Annual)
  })

  it('includes all optional fields with defaults when not provided', () => {
    const entry: Entry = { initialValue: 1000, monthlyValue: 0, monthlyTax: 1, period: 36 }
    const encoded = encodeCalculatorUrlParams(entry, { taxPeriod: TaxPeriod.Monthly })
    const parsed = JSON.parse(atob(encoded)) as CalculatorUrlParams
    expect(parsed.goalMode).toBe(false)
    expect(parsed.goalTarget).toBe(0)
    expect(parsed.rateSource).toBe(RateSource.Fixed)
    expect(parsed.selectedIndex).toBe('CDI')
    expect(parsed.indexMultiplier).toBe(100)
  })

  it('serializes provided optional fields', () => {
    const entry: Entry = { initialValue: 1000, monthlyValue: 0, monthlyTax: 1, period: 36 }
    const encoded = encodeCalculatorUrlParams(entry, {
      taxPeriod: TaxPeriod.Annual,
      goalMode: true,
      goalTarget: 50000,
      rateSource: RateSource.Index,
      selectedIndex: 'IPCA',
      indexMultiplier: 120,
    })
    const parsed = JSON.parse(atob(encoded)) as CalculatorUrlParams
    expect(parsed.goalMode).toBe(true)
    expect(parsed.goalTarget).toBe(50000)
    expect(parsed.rateSource).toBe(RateSource.Index)
    expect(parsed.selectedIndex).toBe('IPCA')
    expect(parsed.indexMultiplier).toBe(120)
  })

  it('round-trips with parseCalculatorUrlParams', () => {
    const entry: Entry = { initialValue: 1000, monthlyValue: 0, monthlyTax: 1, period: 36 }
    const encoded = encodeCalculatorUrlParams(entry, {
      taxPeriod: TaxPeriod.Monthly,
      goalMode: true,
      goalTarget: 10000,
      rateSource: RateSource.Index,
      selectedIndex: 'SELIC',
      indexMultiplier: 110,
    })
    const parsed = parseCalculatorUrlParams(encoded)
    expect(parsed).toEqual({
      ...entry,
      taxPeriod: TaxPeriod.Monthly,
      goalMode: true,
      goalTarget: 10000,
      rateSource: RateSource.Index,
      selectedIndex: 'SELIC',
      indexMultiplier: 110,
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

  it('on mount with valid ?p= applies all params to store and refs', async () => {
    const entry: Entry = {
      initialValue: 10000,
      monthlyValue: 300,
      monthlyTax: 0.6,
      period: 48,
    }
    const encoded = encodeCalculatorUrlParams(entry, {
      taxPeriod: TaxPeriod.Annual,
      goalMode: true,
      goalTarget: 80000,
      rateSource: RateSource.Index,
      selectedIndex: 'IPCA',
      indexMultiplier: 115,
    })
    window.location.search = `?p=${encodeURIComponent(encoded)}`

    const refs = makeRefs({ taxPeriod: ref<TaxPeriod>(TaxPeriod.Monthly) })
    mountWithSync(refs)

    const store = useCalculatorStore()
    expect(store.entry.initialValue).toBe(10000)
    expect(store.entry.monthlyValue).toBe(300)
    expect(store.entry.monthlyTax).toBe(0.6)
    expect(store.entry.period).toBe(48)
    expect(refs.taxPeriod.value).toBe(TaxPeriod.Annual)
    expect(store.goalMode).toBe(true)
    expect(store.goalTarget).toBe(80000)
    expect(refs.rateSource.value).toBe(RateSource.Index)
    expect(refs.selectedIndex.value).toBe('IPCA')
    expect(refs.indexMultiplier.value).toBe(115)
    expect(store.hasResults).toBe(true)
    expect(store.results).toHaveLength(48)
  })

  it('on mount with legacy ?p= (no optional fields) applies defaults', async () => {
    const legacy = {
      initialValue: 5000,
      monthlyValue: 200,
      monthlyTax: 0.8,
      period: 24,
      taxPeriod: TaxPeriod.Annual,
    }
    window.location.search = `?p=${encodeURIComponent(toBase64(legacy))}`

    const refs = makeRefs()
    mountWithSync(refs)

    const store = useCalculatorStore()
    expect(store.entry.initialValue).toBe(5000)
    expect(store.goalMode).toBe(false)
    expect(store.goalTarget).toBe(0)
    expect(refs.rateSource.value).toBe(RateSource.Fixed)
    expect(refs.selectedIndex.value).toBe('CDI')
    expect(refs.indexMultiplier.value).toBe(100)
  })

  it('on mount with invalid ?p= leaves store and refs unchanged', async () => {
    const store = useCalculatorStore()
    const beforeEntry = { ...store.entry }
    window.location.search = '?p=invalid-base64'

    const refs = makeRefs()
    mountWithSync(refs)

    expect(store.entry).toEqual(beforeEntry)
    expect(refs.taxPeriod.value).toBe(TaxPeriod.Annual)
    expect(refs.rateSource.value).toBe(RateSource.Fixed)
  })

  it('on mount without ?p= leaves store and refs unchanged', async () => {
    window.location.search = ''

    const refs = makeRefs()
    const store = useCalculatorStore()
    const beforeEntry = { ...store.entry }
    mountWithSync(refs)

    expect(store.entry).toEqual(beforeEntry)
    expect(refs.taxPeriod.value).toBe(TaxPeriod.Annual)
  })

  it('updates URL with replaceState when entry or refs change (debounced)', async () => {
    vi.useFakeTimers()
    window.location.search = ''

    const refs = makeRefs()
    mountWithSync(refs)

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

  it('encodes goalMode and goalTarget in the URL', async () => {
    vi.useFakeTimers()
    window.location.search = ''

    const refs = makeRefs()
    mountWithSync(refs)

    const store = useCalculatorStore()
    replaceStateSpy.mockClear()

    store.goalMode = true
    store.goalTarget = 50000

    await vi.advanceTimersByTimeAsync(400)
    const callUrl = replaceStateSpy.mock.calls[0]?.[2] as string
    const match = callUrl.match(/\?p=(.+)$/)
    const decoded = parseCalculatorUrlParams(decodeURIComponent(match![1]!))
    expect(decoded?.goalMode).toBe(true)
    expect(decoded?.goalTarget).toBe(50000)

    vi.useRealTimers()
  })

  it('encodes rateSource, selectedIndex and indexMultiplier in the URL', async () => {
    vi.useFakeTimers()
    window.location.search = ''

    const refs = makeRefs()
    mountWithSync(refs)

    replaceStateSpy.mockClear()

    refs.rateSource.value = RateSource.Index
    refs.selectedIndex.value = 'SELIC'
    refs.indexMultiplier.value = 90

    await vi.advanceTimersByTimeAsync(400)
    const callUrl = replaceStateSpy.mock.calls[0]?.[2] as string
    const match = callUrl.match(/\?p=(.+)$/)
    const decoded = parseCalculatorUrlParams(decodeURIComponent(match![1]!))
    expect(decoded?.rateSource).toBe(RateSource.Index)
    expect(decoded?.selectedIndex).toBe('SELIC')
    expect(decoded?.indexMultiplier).toBe(90)

    vi.useRealTimers()
  })
})
