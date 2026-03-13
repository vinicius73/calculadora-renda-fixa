import { watch, onMounted, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useCalculatorStore } from '@/stores/calculator'
import { TaxPeriod, RateSource } from '@/lib/taxRate'
import type { Entry } from '@/lib/calcule'
import { INDEX_KEYS, type IndexKey } from '@/lib/indices'

const QUERY_PARAM = 'p'
const PERIOD_MAX = 600
const DEBOUNCE_MS = 400

export interface CalculatorUrlParams {
  initialValue: number
  monthlyValue: number
  monthlyTax: number
  period: number
  taxPeriod: TaxPeriod
  goalMode: boolean
  goalTarget: number
  rateSource: RateSource
  selectedIndex: IndexKey
  indexMultiplier: number
}

export interface UrlSyncRefs {
  taxPeriod: Ref<TaxPeriod>
  rateSource: Ref<RateSource>
  selectedIndex: Ref<IndexKey>
  indexMultiplier: Ref<number>
}

function isTaxPeriod(value: unknown): value is TaxPeriod {
  return value === TaxPeriod.Monthly || value === TaxPeriod.Annual
}

function isRateSource(value: unknown): value is RateSource {
  return value === RateSource.Fixed || value === RateSource.Index
}

function isIndexKey(value: unknown): value is IndexKey {
  return INDEX_KEYS.includes(value as IndexKey)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Validates and normalizes URL payload. Returns null on any failure so caller can ignore safely.
 * Fields added later (goalMode, goalTarget, rateSource, selectedIndex, indexMultiplier) are
 * optional with sensible defaults to keep old URLs working.
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

    // Optional fields — use defaults when absent so old URLs remain valid
    const goalMode = typeof o.goalMode === 'boolean' ? o.goalMode : false
    const goalTarget = isFiniteNumber(o.goalTarget) && o.goalTarget >= 0 ? o.goalTarget : 0
    const rateSource = isRateSource(o.rateSource) ? o.rateSource : RateSource.Fixed
    const selectedIndex = isIndexKey(o.selectedIndex) ? o.selectedIndex : 'CDI'
    const indexMultiplier =
      isFiniteNumber(o.indexMultiplier) && o.indexMultiplier >= 0 ? o.indexMultiplier : 100

    return {
      initialValue,
      monthlyValue,
      monthlyTax,
      period: periodInt,
      taxPeriod,
      goalMode,
      goalTarget,
      rateSource,
      selectedIndex,
      indexMultiplier,
    }
  } catch {
    return null
  }
}

export function encodeCalculatorUrlParams(
  entry: Entry,
  state: {
    taxPeriod: TaxPeriod
    goalMode?: boolean
    goalTarget?: number
    rateSource?: RateSource
    selectedIndex?: IndexKey
    indexMultiplier?: number
  },
): string {
  const payload: CalculatorUrlParams = {
    initialValue: entry.initialValue,
    monthlyValue: entry.monthlyValue,
    monthlyTax: entry.monthlyTax,
    period: entry.period,
    taxPeriod: state.taxPeriod,
    goalMode: state.goalMode ?? false,
    goalTarget: state.goalTarget ?? 0,
    rateSource: state.rateSource ?? RateSource.Fixed,
    selectedIndex: state.selectedIndex ?? 'CDI',
    indexMultiplier: state.indexMultiplier ?? 100,
  }
  return btoa(JSON.stringify(payload))
}

/**
 * Syncs calculator form state with URL query param `p` (BASE64-encoded JSON).
 * On load: reads and applies params if valid; on failure, ignores.
 * On change: updates URL with replaceState (debounced).
 */
export function useCalculatorUrlSync(refs: UrlSyncRefs): void {
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
    refs.taxPeriod.value = parsed.taxPeriod
    store.goalMode = parsed.goalMode
    store.goalTarget = parsed.goalTarget
    refs.rateSource.value = parsed.rateSource
    refs.selectedIndex.value = parsed.selectedIndex
    refs.indexMultiplier.value = parsed.indexMultiplier
    store.calculate()
  })

  const pushToUrl = useDebounceFn(() => {
    const entry = store.entry
    const encoded = encodeCalculatorUrlParams(entry, {
      taxPeriod: refs.taxPeriod.value,
      goalMode: store.goalMode,
      goalTarget: store.goalTarget,
      rateSource: refs.rateSource.value,
      selectedIndex: refs.selectedIndex.value,
      indexMultiplier: refs.indexMultiplier.value,
    })
    const search = `?${QUERY_PARAM}=${encodeURIComponent(encoded)}`
    const url = `${window.location.pathname}${search}`
    window.history.replaceState(null, '', url)
  }, DEBOUNCE_MS)

  watch(
    [
      () => store.entry,
      refs.taxPeriod,
      () => store.goalMode,
      () => store.goalTarget,
      refs.rateSource,
      refs.selectedIndex,
      refs.indexMultiplier,
    ],
    () => pushToUrl(),
    { deep: true },
  )
}
