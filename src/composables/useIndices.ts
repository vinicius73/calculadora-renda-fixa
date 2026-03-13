import { useLocalStorage } from '@vueuse/core'
import { DEFAULT_INDICES, type IndexEntry, type IndexKey, type IndicesRecord } from '@/lib/indices'

// Singleton storage — shared across all composable calls.
// Future evolution: add refreshFromAPI() that fetches current rates,
// updates the localStorage cache, and returns the same interface.
const indices = useLocalStorage<IndicesRecord>('renda-fixa-indices', DEFAULT_INDICES)

export function useIndices() {
  function getRate(key: IndexKey): number {
    return indices.value[key].annualRate
  }

  function updateRate(key: IndexKey, annualRate: number) {
    if (isNaN(annualRate) || annualRate <= 0) return
    indices.value[key] = { ...indices.value[key], annualRate }
  }

  function getEntry(key: IndexKey): IndexEntry {
    return indices.value[key]
  }

  function reset() {
    indices.value = { ...DEFAULT_INDICES }
  }

  return { indices, getRate, getEntry, updateRate, reset }
}
