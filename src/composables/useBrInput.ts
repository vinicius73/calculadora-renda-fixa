import { ref, watch } from 'vue'

export enum BrInputMode {
  Currency = 'currency',
  Decimal = 'decimal',
  Integer = 'integer',
}

const FORMAT_OPTIONS: Record<BrInputMode, Intl.NumberFormatOptions> = {
  [BrInputMode.Currency]: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  [BrInputMode.Decimal]: { minimumFractionDigits: 0, maximumFractionDigits: 4 },
  [BrInputMode.Integer]: { minimumFractionDigits: 0, maximumFractionDigits: 0 },
}

/**
 * Parses a Brazilian-formatted number string to a JS number.
 * Treats '.' as thousands separator and ',' as decimal separator.
 * Examples: '1.234,56' → 1234.56 | '12,5' → 12.5 | '1.234' → 1234
 */
export function parseBrNumber(raw: string): number {
  const cleaned = raw
    .trim()
    .replace(/\./g, '') // remove thousands separators
    .replace(',', '.') // normalize decimal separator
  if (!cleaned) return NaN
  return parseFloat(cleaned)
}

/**
 * Formats a JS number to Brazilian locale string.
 * Examples: 1234.56 (currency) → '1.234,56' | 12.5 (decimal) → '12,5'
 */
export function formatBrNumber(n: number, mode: BrInputMode): string {
  if (!isFinite(n)) return ''
  return new Intl.NumberFormat('pt-BR', FORMAT_OPTIONS[mode]).format(n)
}

/**
 * Composable for a Brazilian-formatted numeric text input.
 *
 * Lifecycle:
 *  - display shows formatted value when field is not focused
 *  - onInput: updates display (raw string) + calls setter with parsed value
 *  - onBlur: reformats display and ensures setter has final value
 *  - External changes (from getter) update display only while not focused
 */
export function useBrInput(getter: () => number, setter: (n: number) => void, mode: BrInputMode) {
  const display = ref(formatBrNumber(getter(), mode))
  const focused = ref(false)

  watch(getter, (n) => {
    if (!focused.value) {
      display.value = formatBrNumber(n, mode)
    }
  })

  function onFocus() {
    focused.value = true
  }

  function onInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value
    display.value = raw
    const n = parseBrNumber(raw)
    if (isFinite(n) && n >= 0) setter(n)
  }

  function onBlur() {
    focused.value = false
    const n = parseBrNumber(display.value)
    if (isFinite(n) && n >= 0) {
      setter(n)
      display.value = formatBrNumber(n, mode)
    } else {
      display.value = formatBrNumber(getter(), mode)
    }
  }

  return { display, onFocus, onInput, onBlur }
}
