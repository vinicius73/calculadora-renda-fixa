import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useIndices } from '@/composables/useIndices'
import { DEFAULT_INDICES, INDEX_KEYS } from '@/lib/indices'
import type { IndexKey } from '@/lib/indices'

const STORAGE_KEY_EDITED = 'renda-fixa-indices-edited'

describe('useIndices', () => {
  beforeEach(() => {
    useIndices().reset()
  })

  describe('getRate and getEntry', () => {
    it('returns default rate and entry for each index key', () => {
      const { getRate, getEntry } = useIndices()
      for (const key of INDEX_KEYS) {
        expect(getRate(key)).toBe(DEFAULT_INDICES[key].annualRate)
        expect(getEntry(key)).toEqual(DEFAULT_INDICES[key])
      }
    })

    it('getEntry returns full entry with key, label, annualRate, reference', () => {
      const { getEntry } = useIndices()
      const entry = getEntry('CDI')
      expect(entry).toHaveProperty('key', 'CDI')
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('annualRate')
      expect(entry).toHaveProperty('reference')
    })

    it('falls back to default when stored entry has invalid annualRate', () => {
      const { getRate, getEntry, indices } = useIndices()
      indices.value = {
        ...indices.value,
        CDI: { ...indices.value.CDI, annualRate: NaN },
      }
      expect(getRate('CDI')).toBe(DEFAULT_INDICES.CDI.annualRate)
      expect(getEntry('CDI').annualRate).toBe(DEFAULT_INDICES.CDI.annualRate)
    })

    it('falls back to default when stored entry is missing for key', () => {
      const { getRate, getEntry, indices } = useIndices()
      const { CDI: _removed, ...rest } = indices.value
      indices.value = rest as typeof indices.value
      expect(getRate('CDI')).toBe(DEFAULT_INDICES.CDI.annualRate)
      expect(getEntry('CDI')).toEqual(DEFAULT_INDICES.CDI)
    })
  })

  describe('updateRate', () => {
    it('updates rate for valid key and persists in indices ref', () => {
      const { updateRate, getRate, indices } = useIndices()
      updateRate('SELIC', 12.5)
      expect(getRate('SELIC')).toBe(12.5)
      expect(indices.value.SELIC.annualRate).toBe(12.5)
    })

    it('ignores invalid key (no-op)', () => {
      const { updateRate, getRate } = useIndices()
      const before = getRate('CDI')
      updateRate('INVALID' as IndexKey, 99)
      expect(getRate('CDI')).toBe(before)
    })

    it('ignores NaN rate (no-op)', () => {
      const { updateRate, getRate } = useIndices()
      const before = getRate('IPCA')
      updateRate('IPCA', NaN)
      expect(getRate('IPCA')).toBe(before)
    })

    it('ignores non-finite rate (no-op)', () => {
      const { updateRate, getRate } = useIndices()
      const before = getRate('IPCA')
      updateRate('IPCA', Infinity)
      expect(getRate('IPCA')).toBe(before)
    })

    it('ignores zero or negative rate (no-op)', () => {
      const { updateRate, getRate } = useIndices()
      const before = getRate('CDI')
      updateRate('CDI', 0)
      expect(getRate('CDI')).toBe(before)
      updateRate('CDI', -1)
      expect(getRate('CDI')).toBe(before)
    })
  })

  describe('markAsEdited and markAsReset and isEdited', () => {
    it('markAsEdited adds key; isEdited returns true', () => {
      const { markAsEdited, isEdited } = useIndices()
      expect(isEdited('CDI')).toBe(false)
      markAsEdited('CDI')
      expect(isEdited('CDI')).toBe(true)
    })

    it('markAsReset removes key; isEdited returns false', () => {
      const { markAsEdited, markAsReset, isEdited } = useIndices()
      markAsEdited('SELIC')
      expect(isEdited('SELIC')).toBe(true)
      markAsReset('SELIC')
      expect(isEdited('SELIC')).toBe(false)
    })

    it('markAsEdited is idempotent (second call does not duplicate)', () => {
      const { markAsEdited, isEdited } = useIndices()
      markAsEdited('IPCA')
      markAsEdited('IPCA')
      expect(isEdited('IPCA')).toBe(true)
    })

    it('markAsEdited does nothing for invalid key', () => {
      const { markAsEdited, isEdited } = useIndices()
      markAsEdited('INVALID' as IndexKey)
      expect(isEdited('INVALID' as IndexKey)).toBe(false)
    })

    it('markAsReset does nothing for invalid key', () => {
      const { markAsEdited, markAsReset, isEdited } = useIndices()
      markAsEdited('CDI')
      markAsReset('INVALID' as IndexKey)
      expect(isEdited('CDI')).toBe(true)
    })
  })

  describe('reset', () => {
    it('restores indices to defaults and clears edited keys', () => {
      const { updateRate, markAsEdited, reset, getRate, isEdited } = useIndices()
      updateRate('CDI', 99)
      markAsEdited('CDI')
      reset()
      expect(getRate('CDI')).toBe(DEFAULT_INDICES.CDI.annualRate)
      expect(isEdited('CDI')).toBe(false)
    })

    it('reset does not share references with DEFAULT_INDICES', () => {
      const { indices, reset } = useIndices()
      reset()
      for (const key of INDEX_KEYS) {
        expect(indices.value[key]).not.toBe(DEFAULT_INDICES[key])
        expect(indices.value[key]).toEqual(DEFAULT_INDICES[key])
      }
    })
  })

  describe('returned refs', () => {
    it('indices is reactive and reflects updates', () => {
      const { indices, updateRate } = useIndices()
      expect(indices.value.CDI.annualRate).toBe(DEFAULT_INDICES.CDI.annualRate)
      updateRate('CDI', 10.5)
      expect(indices.value.CDI.annualRate).toBe(10.5)
    })
  })
})

describe('useIndices — sanitizeEditedKeys', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('removes keys not in INDEX_KEYS from edited list', async () => {
    localStorage.setItem(STORAGE_KEY_EDITED, JSON.stringify(['CDI', 'INVALID']))
    const { useIndices: useIndicesFresh } = await import('@/composables/useIndices')
    const { isEdited } = useIndicesFresh()
    expect(isEdited('INVALID' as IndexKey)).toBe(false)
    expect(isEdited('CDI')).toBe(true)
  })
})
