/**
 * Calculates the required monthly contribution (PMT) to reach a goal (FV).
 *
 * Matches the calcule() algorithm where each month applies:
 *   value = (previous + PMT) × (1 + r)   [deposit-before-interest / annuity due]
 *
 * FV formula: FV = PV×(1+r)^n + PMT×(1+r)×[(1+r)^n − 1] / r
 * Solving for PMT: PMT = (FV − PV×(1+r)^n) × r / ((1+r) × ((1+r)^n − 1))
 *
 * @param goalValue    - Target final wealth (FV)
 * @param initialValue - Initial investment (PV)
 * @param monthlyRate  - Monthly interest rate in %, e.g. 0.9488 for ~12% p.a.
 * @param periodMonths - Investment duration in months
 * @returns Required monthly contribution, or 0 if goal is already met by initial value alone
 */
export function reverseCalculate(
  goalValue: number,
  initialValue: number,
  monthlyRate: number,
  periodMonths: number,
): number {
  if (periodMonths <= 0 || goalValue <= 0) return 0

  const r = monthlyRate / 100
  const n = periodMonths

  // Edge case: zero rate — simple linear division
  if (r === 0) {
    const remaining = goalValue - initialValue
    return remaining <= 0 ? 0 : remaining / n
  }

  const compounded = Math.pow(1 + r, n)
  const pvFuture = initialValue * compounded

  if (goalValue <= pvFuture) return 0 // goal already met by initial investment alone

  return ((goalValue - pvFuture) * r) / ((1 + r) * (compounded - 1))
}
