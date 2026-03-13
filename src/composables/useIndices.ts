import { useLocalStorage } from '@vueuse/core'
import { DEFAULT_INDICES, type IndexEntry, type IndexKey, type IndicesRecord } from '@/lib/indices'

// Singleton storage — shared across all composable calls.
// Future evolution: add refreshFromAPI() that fetches current rates,
// updates the localStorage cache, and returns the same interface.
const indices = useLocalStorage<IndicesRecord>('renda-fixa-indices', DEFAULT_INDICES)

// Tracks which index keys the user has explicitly edited (saved from the rate editor).
// Used to show "editado" only for user-edited indices, not for values that differ from
// defaults due to app updates or stale localStorage.
const editedKeys = useLocalStorage<IndexKey[]>('renda-fixa-indices-edited', [])

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

  function markAsEdited(key: IndexKey) {
    if (editedKeys.value.includes(key)) return
    editedKeys.value = [...editedKeys.value, key]
  }

  function markAsReset(key: IndexKey) {
    editedKeys.value = editedKeys.value.filter((k) => k !== key)
  }

  function isEdited(key: IndexKey): boolean {
    return editedKeys.value.includes(key)
  }

  function reset() {
    indices.value = { ...DEFAULT_INDICES }
    editedKeys.value = []
  }

  return {
    indices,
    getRate,
    getEntry,
    updateRate,
    reset,
    markAsEdited,
    markAsReset,
    isEdited,
  }
}
