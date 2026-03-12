export type Entry = {
  initialValue: number
  monthlyValue: number
  monthlyTax: number
  period: number
}

export type Result = {
  index: string
  value: number
  tax: number
  accumulative: number
}

type CalculeAcc = {
  current: number
  entries: Result[]
}

export function calcule(entry: Entry): Result[] {
  const monthlyTax = entry.monthlyTax / 100
  const padding = String(entry.period).length
  const initial: CalculeAcc = {
    current: entry.initialValue,
    entries: [],
  }

  const values = Array.from({ length: entry.period }).reduce<CalculeAcc>((acc, _, index) => {
    const tax = (acc.current + entry.monthlyValue) * monthlyTax

    const current: Result = {
      index: String(index + 1).padStart(padding, '0'),
      tax,
      accumulative: (index + 1) * entry.monthlyValue + entry.initialValue,
      value: acc.current + entry.monthlyValue + tax,
    }

    acc.current = current.value
    acc.entries.push(current)

    return acc
  }, initial)

  return values.entries
}
