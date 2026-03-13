import { describe, it, expect } from "vitest";
import {
  assertSeriesItem,
  annualizeFrom252BusinessDays,
  BUSINESS_DAYS_PER_YEAR,
  compoundLast12Months,
  formatReference,
  parseBrlDate,
  round2,
  toNumber,
} from "../lib/gen-indices-utils.mjs";

describe("parseBrlDate", () => {
  it("parses DD/MM/YYYY to UTC Date", () => {
    const d = parseBrlDate("13/03/2026");
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(2);
    expect(d.getUTCDate()).toBe(13);
  });

  it("throws on invalid format (missing parts)", () => {
    expect(() => parseBrlDate("13/03")).toThrow("Invalid date format");
    expect(() => parseBrlDate("13")).toThrow("Invalid date format");
  });

  it("throws on invalid format (wrong separator)", () => {
    expect(() => parseBrlDate("13-03-2026")).toThrow("Invalid date format");
  });
});

describe("formatReference", () => {
  it("formats to Mon/YYYY", () => {
    expect(formatReference("01/03/2026")).toBe("Mar/2026");
    expect(formatReference("15/01/2025")).toBe("Jan/2025");
    expect(formatReference("31/12/2024")).toBe("Dec/2024");
  });
});

describe("toNumber", () => {
  it("converts string with comma to number", () => {
    expect(toNumber("0,05")).toBe(0.05);
    expect(toNumber("13,65")).toBe(13.65);
  });

  it("accepts number and returns as-is (normalized)", () => {
    expect(toNumber(13.65)).toBe(13.65);
  });
});

describe("round2", () => {
  it("rounds to 2 decimal places", () => {
    expect(round2(13.656)).toBe(13.66);
    expect(round2(13.654)).toBe(13.65);
    expect(round2(13.65)).toBe(13.65);
  });
});

describe("annualizeFrom252BusinessDays", () => {
  it("uses 252 business days", () => {
    const daily = 0.05;
    const annual = annualizeFrom252BusinessDays(daily);
    const expected = (Math.pow(1 + daily / 100, BUSINESS_DAYS_PER_YEAR) - 1) * 100;
    expect(annual).toBeCloseTo(expected);
  });

  it("zero daily rate gives zero annual", () => {
    expect(annualizeFrom252BusinessDays(0)).toBe(0);
  });
});

describe("compoundLast12Months", () => {
  it("compounds monthly rates from oldest to newest", () => {
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      data: `${String((i % 12) + 1).padStart(2, "0")}/01/2025`,
      valor: 0.5,
    }));
    const annual = compoundLast12Months(monthly);
    const expected = (Math.pow(1 + 0.5 / 100, 12) - 1) * 100;
    expect(annual).toBeCloseTo(expected);
  });

  it("all zeros gives zero annual", () => {
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      data: `${String(i + 1).padStart(2, "0")}/01/2025`,
      valor: 0,
    }));
    expect(compoundLast12Months(monthly)).toBe(0);
  });

  it("accepts valor as string with comma", () => {
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      data: `${String(i + 1).padStart(2, "0")}/01/2025`,
      valor: "0,5",
    }));
    const annual = compoundLast12Months(monthly);
    const expected = (Math.pow(1 + 0.5 / 100, 12) - 1) * 100;
    expect(annual).toBeCloseTo(expected);
  });
});

describe("assertSeriesItem", () => {
  it("does not throw for valid item", () => {
    expect(() => assertSeriesItem({ data: "01/01/2026", valor: 0.5 }, 12)).not.toThrow();
  });

  it("throws for null", () => {
    expect(() => assertSeriesItem(null, 12)).toThrow("Invalid series response shape");
  });

  it("throws for missing data", () => {
    expect(() => assertSeriesItem({ valor: 0.5 }, 12)).toThrow("expected { data, valor }");
  });

  it("throws for missing valor", () => {
    expect(() => assertSeriesItem({ data: "01/01/2026" }, 12)).toThrow("expected { data, valor }");
  });

  it("throws for non-object", () => {
    expect(() => assertSeriesItem("x", 432)).toThrow("Invalid series response shape");
  });
});
