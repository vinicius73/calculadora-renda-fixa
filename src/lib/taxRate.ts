export enum TaxPeriod {
  Monthly = 'monthly',
  Annual = 'annual',
}

export enum RateSource {
  Fixed = 'fixed',
  Index = 'index',
}

/**
 * Converts a monthly interest rate (%) to its annual equivalent.
 * Formula: annual = (1 + monthly/100)^12 − 1
 */
export function toAnnualRate(monthlyPercent: number): number {
  return (Math.pow(1 + monthlyPercent / 100, 12) - 1) * 100
}

/**
 * Converts an annual interest rate (%) to its monthly equivalent.
 * Formula: monthly = (1 + annual/100)^(1/12) − 1
 */
export function toMonthlyRate(annualPercent: number): number {
  return (Math.pow(1 + annualPercent / 100, 1 / 12) - 1) * 100
}

/**
 * Converts a rate between periods. Returns the original value when from === to.
 */
export function convertRate(value: number, from: TaxPeriod, to: TaxPeriod): number {
  if (from === to) return value
  return from === TaxPeriod.Monthly ? toAnnualRate(value) : toMonthlyRate(value)
}
