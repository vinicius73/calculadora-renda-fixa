import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { calcule, type Entry, type Result } from '@/lib/calcule'
import { toMonthlyRate } from '@/lib/taxRate'
import { reverseCalculate } from '@/lib/reverseCalculate'

export const useCalculatorStore = defineStore('calculator', () => {
  const entry = ref<Entry>({
    initialValue: 2000,
    monthlyValue: 0,
    monthlyTax: toMonthlyRate(12),
    period: 12,
  })

  const results = ref<Result[]>([])
  const loading = ref(false)

  // ── Goal mode ────────────────────────────────────────────────
  const goalMode = ref(false)
  const goalTarget = ref(0)

  const goalResult = computed(() => {
    if (!goalMode.value || goalTarget.value <= 0) return 0
    return reverseCalculate(goalTarget.value, entry.value.initialValue, entry.value.monthlyTax, entry.value.period)
  })

  // ── Derived ──────────────────────────────────────────────────

  const lastResult = computed(() => {
    const size = results.value.length
    if (size === 0) return null
    const last = results.value[size - 1]!
    return {
      ...last,
      tax: last.value - last.accumulative,
    }
  })

  const hasResults = computed(() => results.value.length > 0)

  // ── Actions ──────────────────────────────────────────────────

  function setEntry(partial: Partial<Entry>) {
    entry.value = { ...entry.value, ...partial }
  }

  function calculate() {
    loading.value = true
    try {
      const entryToCalc: Entry = goalMode.value
        ? { ...entry.value, monthlyValue: goalResult.value }
        : { ...entry.value }
      results.value = calcule(entryToCalc)
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }

  function reset() {
    results.value = []
    loading.value = false
  }

  calculate()

  return {
    entry,
    results,
    loading,
    goalMode,
    goalTarget,
    goalResult,
    lastResult,
    hasResults,
    setEntry,
    calculate,
    reset,
  }
})
