/**
 * Generates src/data/indices.json from Banco Central do Brasil (BCB) SGS API.
 * Node.js 18+ (uses native fetch).
 *
 * Usage: node scripts/gen-indices.mjs
 * Optional: OUTPUT_PATH=/path/to/indices.json node scripts/gen-indices.mjs
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertSeriesItem,
  annualizeFrom252BusinessDays,
  compoundLast12Months,
  formatReference,
  parseBrlDate,
  round2,
  toNumber,
} from "./lib/gen-indices-utils.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(SCRIPT_DIR);
const DEFAULT_OUTPUT_PATH = join(PROJECT_ROOT, "src", "data", "indices.json");

const BCB_BASE_URL = "https://api.bcb.gov.br/dados/serie";
const FETCH_TIMEOUT_MS = 15_000;
const BCB_ULTIMOS_LIMIT = 20;

const SERIES = {
  CDI_DAILY: 12,
  SELIC_TARGET: 432,
  IPCA_MONTHLY: 433,
};

/**
 * Fetches JSON from URL with timeout and explicit error handling.
 * @param {string} url
 * @param {AbortSignal} [signal]
 * @returns {Promise<unknown>}
 */
async function fetchJson(url, signal) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `BCB request failed: ${res.status} ${res.statusText}\nURL: ${url}\nBody: ${body.slice(0, 500)}`,
    );
  }

  return res.json();
}

/**
 * Fetches the latest single value for a BCB series.
 * @param {number} seriesCode
 * @param {AbortSignal} signal
 * @returns {Promise<{ data: string; valor: string | number }>}
 */
async function getLatestValue(seriesCode, signal) {
  const url = `${BCB_BASE_URL}/bcdata.sgs.${seriesCode}/dados/ultimos/1?formato=json`;
  const data = await fetchJson(url, signal);

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No data returned for series ${seriesCode}`);
  }

  const item = data[0];
  assertSeriesItem(item, seriesCode);
  return item;
}

/**
 * Fetches the latest N values for a BCB series (max 20).
 * @param {number} seriesCode
 * @param {number} n
 * @param {AbortSignal} signal
 * @returns {Promise<{ data: string; valor: string | number }[]>}
 */
async function getLatestNValues(seriesCode, n, signal) {
  if (n < 1 || n > BCB_ULTIMOS_LIMIT) {
    throw new Error(`BCB /ultimos/{N} accepts 1..${BCB_ULTIMOS_LIMIT}, got ${n}`);
  }

  const url = `${BCB_BASE_URL}/bcdata.sgs.${seriesCode}/dados/ultimos/${n}?formato=json`;
  const data = await fetchJson(url, signal);

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No data returned for series ${seriesCode}`);
  }

  for (const item of data) {
    assertSeriesItem(item, seriesCode);
  }
  return data;
}

/**
 * Builds the indices payload from BCB data.
 * @param {AbortSignal} signal
 * @returns {Promise<{ _meta: { updatedAt: string; source: string }; CDI: object; SELIC: object; IPCA: object }>}
 */
async function buildPayload(signal) {
  const [latestCdi, latestSelic, latestIpca, last12Ipca] = await Promise.all([
    getLatestValue(SERIES.CDI_DAILY, signal),
    getLatestValue(SERIES.SELIC_TARGET, signal),
    getLatestValue(SERIES.IPCA_MONTHLY, signal),
    getLatestNValues(SERIES.IPCA_MONTHLY, 12, signal),
  ]);

  const cdiDailyPercent = toNumber(latestCdi.valor);
  const cdiAnnualRate = annualizeFrom252BusinessDays(cdiDailyPercent);
  const selicAnnualRate = toNumber(latestSelic.valor);

  const sortedIpca12 = [...last12Ipca].sort(
    (a, b) => parseBrlDate(a.data).getTime() - parseBrlDate(b.data).getTime(),
  );
  const ipcaAnnualRate = compoundLast12Months(sortedIpca12);

  return {
    _meta: {
      updatedAt: new Date().toISOString().slice(0, 10),
      source: "BCB/SGS API",
    },
    CDI: {
      key: "CDI",
      label: "CDI",
      annualRate: round2(cdiAnnualRate),
      reference: formatReference(latestCdi.data),
    },
    SELIC: {
      key: "SELIC",
      label: "Selic",
      annualRate: round2(selicAnnualRate),
      reference: formatReference(latestSelic.data),
    },
    IPCA: {
      key: "IPCA",
      label: "IPCA",
      annualRate: round2(ipcaAnnualRate),
      reference: formatReference(latestIpca.data),
    },
  };
}

async function main() {
  const outputPath = process.env.OUTPUT_PATH ?? DEFAULT_OUTPUT_PATH;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const payload = await buildPayload(controller.signal);
    clearTimeout(timeoutId);

    const json = JSON.stringify(payload, null, 2);
    await writeFile(outputPath, json, "utf8");
    console.log(`Written to ${outputPath}`);
    console.log(json);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        console.error("Request timed out.");
      } else {
        console.error(err.message);
      }
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
