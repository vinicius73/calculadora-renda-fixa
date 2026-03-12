import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { calcule, type Entry, type Result } from '@/lib/calcule'
import { toMonthlyRate } from '@/lib/taxRate'

export const useCalculatorStore = defineStore('calculator', () => {
  const entry = ref<Entry>({
    initialValue: 2000,
    monthlyValue: 0,
    monthlyTax: toMonthlyRate(12),
    period: 12,
  })

  const results = ref<Result[]>([])
  const loading = ref(false)

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

  function setEntry(partial: Partial<Entry>) {
    entry.value = { ...entry.value, ...partial }
  }

  function calculate() {
    loading.value = true
    try {
      results.value = calcule({ ...entry.value })
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
    lastResult,
    hasResults,
    setEntry,
    calculate,
    reset,
  }
})
