import indicesData from '@/data/indices.json'

export type IndexKey = 'CDI' | 'SELIC' | 'IPCA'

export type IndexEntry = {
  key: IndexKey
  label: string
  annualRate: number
  reference: string
}

export type IndicesRecord = Record<IndexKey, IndexEntry>

// Default values come from the JSON generated at build time.
// To update rates: edit src/data/indices.json or automate via scripts/update-rates.
const { _meta: _ignored, ...indexDefaults } = indicesData
export const DEFAULT_INDICES = indexDefaults as IndicesRecord

export const INDEX_KEYS: IndexKey[] = ['CDI', 'SELIC', 'IPCA']

/**
 * Calculates the effective annual rate from a base index rate and a multiplier.
 * Example: CDI at 13.65% with 110% multiplier → 15.015% effective
 */
export function calculateEffectiveAnnualRate(indexAnnualRate: number, multiplier: number): number {
  return indexAnnualRate * (multiplier / 100)
}
