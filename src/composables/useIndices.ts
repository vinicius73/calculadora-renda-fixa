import { useLocalStorage } from '@vueuse/core'
import {
  DEFAULT_INDICES,
  INDEX_KEYS,
  type IndexEntry,
  type IndexKey,
  type IndicesRecord,
} from '@/lib/indices'

const STORAGE_KEY_INDICES = 'renda-fixa-indices'
const STORAGE_KEY_EDITED = 'renda-fixa-indices-edited'

/** Singleton storage — shared across all composable calls. */
const initialIndices = INDEX_KEYS.reduce<IndicesRecord>((acc, key) => {
  acc[key] = { ...DEFAULT_INDICES[key] }
  return acc
}, {} as IndicesRecord)
const indices = useLocalStorage<IndicesRecord>(STORAGE_KEY_INDICES, initialIndices)

/** Keys the user has explicitly edited (saved from the rate editor). Persisted so "editado" is correct across sessions. */
const editedKeys = useLocalStorage<IndexKey[]>(STORAGE_KEY_EDITED, [])

function isValidIndexKey(key: unknown): key is IndexKey {
  return INDEX_KEYS.includes(key as IndexKey)
}

/** Returns the entry for key, falling back to default if missing (e.g. stale localStorage). */
function getEntrySafe(key: IndexKey): IndexEntry {
  const entry = indices.value[key]
  if (entry && typeof entry.annualRate === 'number' && Number.isFinite(entry.annualRate)) {
    return entry
  }
  return DEFAULT_INDICES[key]
}

/** Clones default entries so reset() does not share references with DEFAULT_INDICES. */
function cloneDefaults(): IndicesRecord {
  return INDEX_KEYS.reduce<IndicesRecord>((acc, key) => {
    acc[key] = { ...DEFAULT_INDICES[key] }
    return acc
  }, {} as IndicesRecord)
}

/** Removes any keys no longer in INDEX_KEYS (e.g. after app update). */
function sanitizeEditedKeys(): void {
  const valid = editedKeys.value.filter((k) => isValidIndexKey(k))
  if (valid.length !== editedKeys.value.length) {
    editedKeys.value = valid
  }
}

export function useIndices() {
  sanitizeEditedKeys()

  function getRate(key: IndexKey): number {
    return getEntrySafe(key).annualRate
  }

  function getEntry(key: IndexKey): IndexEntry {
    return getEntrySafe(key)
  }

  function updateRate(key: IndexKey, annualRate: number): void {
    if (!isValidIndexKey(key)) return
    if (typeof annualRate !== 'number' || !Number.isFinite(annualRate) || annualRate <= 0) {
      return
    }
    const base = indices.value[key] ?? DEFAULT_INDICES[key]
    indices.value[key] = { ...base, annualRate }
  }

  function markAsEdited(key: IndexKey): void {
    if (!isValidIndexKey(key) || editedKeys.value.includes(key)) return
    editedKeys.value = [...editedKeys.value, key]
  }

  function markAsReset(key: IndexKey): void {
    if (!isValidIndexKey(key)) return
    editedKeys.value = editedKeys.value.filter((k) => k !== key)
  }

  function isEdited(key: IndexKey): boolean {
    return isValidIndexKey(key) && editedKeys.value.includes(key)
  }

  function reset(): void {
    indices.value = cloneDefaults()
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
