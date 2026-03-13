import { useLocalStorage } from '@vueuse/core'
import {
  DEFAULT_IR_BRACKETS,
  calculateIR,
  getIRRate,
  type IRBracket,
} from '@/lib/irBrackets'

// Singleton storage — shared across all composable calls.
const enabled = useLocalStorage<boolean>('renda-fixa-ir-enabled', false)
const brackets = useLocalStorage<IRBracket[]>('renda-fixa-ir-brackets', DEFAULT_IR_BRACKETS)

export function useIRConfig() {
  function reset() {
    brackets.value = [...DEFAULT_IR_BRACKETS]
  }

  function applyIR(grossValue: number, totalInvested: number, periodMonths: number) {
    if (!enabled.value) {
      return { irAmount: 0, netValue: grossValue, irRate: 0 }
    }
    const gain = grossValue - totalInvested
    const irAmount = calculateIR(gain, periodMonths, brackets.value)
    return {
      irAmount,
      netValue: grossValue - irAmount,
      irRate: getIRRate(periodMonths, brackets.value),
    }
  }

  return { enabled, brackets, reset, applyIR }
}
