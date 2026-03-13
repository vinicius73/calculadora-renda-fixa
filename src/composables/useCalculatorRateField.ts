import { ref, computed, watch, nextTick, useTemplateRef } from 'vue'
import { useCalculatorStore } from '@/stores/calculator'
import { TaxPeriod, RateSource, toAnnualRate, toMonthlyRate } from '@/lib/taxRate'
import { useCalculatorUrlSync } from '@/composables/useCalculatorUrlSync'
import {
  INDEX_KEYS,
  DEFAULT_INDICES,
  calculateEffectiveAnnualRate,
  type IndexKey,
} from '@/lib/indices'
import { useIndices } from '@/composables/useIndices'
import { useBrInput, BrInputMode } from '@/composables/useBrInput'

/**
 * Encapsulates rate-field state and actions: fixed vs index mode,
 * period toggle, index selection, and base-rate editing.
 */
export function useCalculatorRateField() {
  const store = useCalculatorStore()

  const taxPeriod = ref<TaxPeriod>(TaxPeriod.Annual)
  const rateSource = ref<RateSource>(RateSource.Fixed)
  const selectedIndex = ref<IndexKey>('CDI')
  const indexMultiplier = ref<number>(100)

  useCalculatorUrlSync({ taxPeriod, rateSource, selectedIndex, indexMultiplier })

  const taxDisplay = computed({
    get(): number {
      const raw =
        taxPeriod.value === TaxPeriod.Monthly
          ? store.entry.monthlyTax
          : toAnnualRate(store.entry.monthlyTax)
      return parseFloat(raw.toFixed(10))
    },
    set(val: number) {
      if (isNaN(val)) return
      const monthly = taxPeriod.value === TaxPeriod.Monthly ? val : toMonthlyRate(val)
      store.setEntry({ monthlyTax: monthly })
    },
  })

  const taxInput = useBrInput(
    () => taxDisplay.value,
    (v) => {
      taxDisplay.value = v
    },
    BrInputMode.Decimal,
  )

  const taxHint = computed(() => {
    if (isNaN(taxDisplay.value) || taxDisplay.value <= 0) return null
    if (taxPeriod.value === TaxPeriod.Monthly) {
      return `≡ ${toAnnualRate(taxDisplay.value).toFixed(2)}% ao ano`
    }
    return `≡ ${toMonthlyRate(taxDisplay.value).toFixed(4)}% ao mês`
  })

  function switchPeriod(period: TaxPeriod) {
    if (period === taxPeriod.value) return
    taxPeriod.value = period
  }

  const editingIndexRate = ref(false)
  const editableIndexRate = ref<number>(0)
  const indexRateInputRef = useTemplateRef<HTMLInputElement>('indexRateInputRef')

  const indexMultiplierInput = useBrInput(
    () => indexMultiplier.value,
    (v) => {
      indexMultiplier.value = v
    },
    BrInputMode.Decimal,
  )

  const editableIndexRateInput = useBrInput(
    () => editableIndexRate.value,
    (v) => {
      editableIndexRate.value = v
    },
    BrInputMode.Decimal,
  )

  const { indices, updateRate } = useIndices()

  const currentIndexEntry = computed(() => indices.value[selectedIndex.value])

  const indexEffectiveAnnualRate = computed(() =>
    calculateEffectiveAnnualRate(currentIndexEntry.value.annualRate, indexMultiplier.value),
  )

  const indexEffectiveAnnualRateDisplay = computed(() => {
    const annual = indexEffectiveAnnualRate.value
    return Number.isFinite(annual) ? `${annual.toFixed(2)}` : '—'
  })

  const indexEffectiveHint = computed(() => {
    const annual = indexEffectiveAnnualRate.value
    if (!Number.isFinite(annual) || annual <= 0) return null
    const monthly = toMonthlyRate(annual)
    return `≡ ${monthly.toFixed(4)}% a.m. / ${annual.toFixed(2)}% a.a. (efetivo)`
  })

  watch([indexEffectiveAnnualRate, rateSource], ([annual, source]) => {
    if (source !== RateSource.Index || typeof annual !== 'number' || isNaN(annual) || annual <= 0)
      return
    const next = toMonthlyRate(annual)
    if (Math.abs(next - store.entry.monthlyTax) < 0.0001) return
    store.setEntry({ monthlyTax: next })
  })

  function setRateSource(source: RateSource) {
    rateSource.value = source
    if (source === RateSource.Index) {
      const annual = indexEffectiveAnnualRate.value
      if (Number.isFinite(annual) && annual > 0) {
        store.setEntry({ monthlyTax: toMonthlyRate(annual) })
      }
    }
  }

  function startEditIndexRate() {
    editableIndexRate.value = currentIndexEntry.value.annualRate
    editingIndexRate.value = true
    nextTick(() => indexRateInputRef.value?.focus())
  }

  function saveIndexRate() {
    updateRate(selectedIndex.value, editableIndexRate.value)
    editingIndexRate.value = false
  }

  function cancelEditIndexRate() {
    editingIndexRate.value = false
  }

  function saveIndexRateBlur() {
    editableIndexRateInput.onBlur()
    saveIndexRate()
  }

  const isCurrentIndexCustom = computed(() => {
    const defaultRate = DEFAULT_INDICES[selectedIndex.value].annualRate
    return Math.abs(currentIndexEntry.value.annualRate - defaultRate) > 0.0001
  })

  function resetCurrentIndex() {
    updateRate(selectedIndex.value, DEFAULT_INDICES[selectedIndex.value].annualRate)
  }

  function setSelectedIndex(key: IndexKey) {
    selectedIndex.value = key
  }

  return {
    TaxPeriod,
    RateSource,
    INDEX_KEYS,
    taxPeriod,
    rateSource,
    selectedIndex,
    taxDisplay,
    taxInput,
    taxHint,
    switchPeriod,
    editingIndexRate,
    editableIndexRate,
    indexRateInputRef,
    indexMultiplierInput,
    editableIndexRateInput,
    indices,
    currentIndexEntry,
    indexEffectiveAnnualRate,
    indexEffectiveAnnualRateDisplay,
    indexEffectiveHint,
    setRateSource,
    startEditIndexRate,
    saveIndexRate,
    cancelEditIndexRate,
    saveIndexRateBlur,
    isCurrentIndexCustom,
    resetCurrentIndex,
    setSelectedIndex,
  }
}
