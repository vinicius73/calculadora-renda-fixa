import { watch, onMounted, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useCalculatorStore } from '@/stores/calculator'
import { TaxPeriod } from '@/lib/taxRate'
import type { Entry } from '@/lib/calcule'

const QUERY_PARAM = 'p'
const PERIOD_MAX = 600
const DEBOUNCE_MS = 400

export interface CalculatorUrlParams {
  initialValue: number
  monthlyValue: number
  monthlyTax: number
  period: number
  taxPeriod: TaxPeriod
}

function isTaxPeriod(value: unknown): value is TaxPeriod {
  return value === TaxPeriod.Monthly || value === TaxPeriod.Annual
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Validates and normalizes URL payload. Returns null on any failure so caller can ignore safely.
 */
export function parseCalculatorUrlParams(raw: string): CalculatorUrlParams | null {
  try {
    const decoded = atob(raw)
    const parsed = JSON.parse(decoded) as unknown
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    const o = parsed as Record<string, unknown>
    const initialValue = o.initialValue
    const monthlyValue = o.monthlyValue
    const monthlyTax = o.monthlyTax
    const period = o.period
    const taxPeriod = o.taxPeriod

    if (
      !isFiniteNumber(initialValue) ||
      !isFiniteNumber(monthlyValue) ||
      !isFiniteNumber(monthlyTax) ||
      !isFiniteNumber(period) ||
      !isTaxPeriod(taxPeriod)
    ) {
      return null
    }
    if (initialValue < 0 || monthlyValue < 0) return null
    const periodInt = Math.floor(period)
    if (periodInt < 1 || periodInt > PERIOD_MAX) return null

    return {
      initialValue,
      monthlyValue,
      monthlyTax,
      period: periodInt,
      taxPeriod,
    }
  } catch {
    return null
  }
}

export function encodeCalculatorUrlParams(entry: Entry, taxPeriod: TaxPeriod): string {
  const payload: CalculatorUrlParams = {
    initialValue: entry.initialValue,
    monthlyValue: entry.monthlyValue,
    monthlyTax: entry.monthlyTax,
    period: entry.period,
    taxPeriod,
  }
  return btoa(JSON.stringify(payload))
}

/**
 * Syncs calculator form state with URL query param `p` (BASE64-encoded JSON).
 * On load: reads and applies params if valid; on failure, ignores.
 * On change: updates URL with replaceState (debounced).
 */
export function useCalculatorUrlSync(taxPeriod: Ref<TaxPeriod>): void {
  const store = useCalculatorStore()

  onMounted(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get(QUERY_PARAM)
    if (!p || p.length === 0) return

    const parsed = parseCalculatorUrlParams(p)
    if (!parsed) return

    store.setEntry({
      initialValue: parsed.initialValue,
      monthlyValue: parsed.monthlyValue,
      monthlyTax: parsed.monthlyTax,
      period: parsed.period,
    })
    taxPeriod.value = parsed.taxPeriod
    store.calculate()
  })

  const pushToUrl = useDebounceFn(() => {
    const entry = store.entry
    const encoded = encodeCalculatorUrlParams(entry, taxPeriod.value)
    const search = `?${QUERY_PARAM}=${encodeURIComponent(encoded)}`
    const url = `${window.location.pathname}${search}`
    window.history.replaceState(null, '', url)
  }, DEBOUNCE_MS)

  watch([() => store.entry, taxPeriod], () => pushToUrl(), { deep: true })
}
