/**
 * Pure helpers for BCB SGS data used by gen-indices.mjs.
 * Exported for unit testing.
 */

export const BUSINESS_DAYS_PER_YEAR = 252;

/**
 * Parses BR date string (DD/MM/YYYY) to Date in UTC.
 * @param {string} dateStr
 * @returns {Date}
 */
export function parseBrlDate(dateStr) {
  const parts = dateStr.split("/").map(Number);
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  const [day, month, year] = parts;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats BCB date string to "Mon/YYYY" (e.g. Mar/2026).
 * @param {string} dateStr
 * @returns {string}
 */
export function formatReference(dateStr) {
  const date = parseBrlDate(dateStr);
  const month = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(date);
  const normalizedMonth = month[0].toUpperCase() + month.slice(1).toLowerCase();
  return `${normalizedMonth}/${date.getUTCFullYear()}`;
}

/**
 * Normalizes BCB decimal string (comma) to number.
 * @param {string | number} value
 * @returns {number}
 */
export function toNumber(value) {
  return Number(String(value).replace(",", "."));
}

/**
 * Rounds to 2 decimal places.
 * @param {number} value
 * @returns {number}
 */
export function round2(value) {
  return Number(value.toFixed(2));
}

/**
 * Annualizes a daily rate assuming 252 business days.
 * @param {number} dailyPercentRate
 * @returns {number}
 */
export function annualizeFrom252BusinessDays(dailyPercentRate) {
  const dailyDecimal = dailyPercentRate / 100;
  const annualDecimal = Math.pow(1 + dailyDecimal, BUSINESS_DAYS_PER_YEAR) - 1;
  return annualDecimal * 100;
}

/**
 * Compounds monthly rates over the last 12 items (oldest to newest).
 * @param {{ data: string; valor: string | number }[]} monthlyItems
 * @returns {number}
 */
export function compoundLast12Months(monthlyItems) {
  const annualDecimal =
    monthlyItems.reduce((acc, item) => {
      const monthlyDecimal = toNumber(item.valor) / 100;
      return acc * (1 + monthlyDecimal);
    }, 1) - 1;
  return annualDecimal * 100;
}

/**
 * Validates BCB series item shape.
 * @param {unknown} item
 * @param {number} seriesCode
 * @returns {asserts item is { data: string; valor: string | number }}
 */
export function assertSeriesItem(item, seriesCode) {
  if (!item || typeof item !== "object" || !("data" in item) || !("valor" in item)) {
    throw new Error(`Invalid series response shape for ${seriesCode}: expected { data, valor }`);
  }
}
