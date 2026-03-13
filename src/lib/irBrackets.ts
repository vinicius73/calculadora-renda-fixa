import irData from '@/data/ir-brackets.json'

export type IRBracket = {
  upToMonths: number | null
  rate: number
  label: string
}

// Default brackets come from the JSON generated at build time.
// To update: edit src/data/ir-brackets.json or automate via scripts/update-rates.
export const DEFAULT_IR_BRACKETS: IRBracket[] = irData.brackets as IRBracket[]

/**
 * Returns the applicable IR rate (%) for the given period.
 * Brackets must be ordered from shortest to longest period.
 */
export function getIRRate(periodMonths: number, brackets: IRBracket[]): number {
  const bracket = brackets.find((b) => b.upToMonths === null || periodMonths <= b.upToMonths)
  return bracket?.rate ?? 15
}

/**
 * Calculates the IR amount on the gain.
 * IR is applied only on the profit (grossValue - totalInvested), not on the principal.
 */
export function calculateIR(gain: number, periodMonths: number, brackets: IRBracket[]): number {
  if (gain <= 0) return 0
  return gain * (getIRRate(periodMonths, brackets) / 100)
}
