/**
 * Descriptive statistics for the Economics Lab data summary tool (Statistics for Economics).
 * Pure functions; values are treated as a complete data set (population formulas), as in school statistics.
 */
export const MAX_VALUES = 500;

export interface Summary {
  count: number;
  sum: number;
  mean: number;
  median: number;
  /** Every value that occurs most often; empty when no value repeats. */
  modes: number[];
  min: number;
  max: number;
  range: number;
  /** Mean of absolute deviations from the mean. */
  meanDeviation: number;
  /** Population variance. */
  variance: number;
  /** Population standard deviation. */
  standardDeviation: number;
  /** Standard deviation as a percentage of the mean; null when the mean is zero. */
  coefficientOfVariation: number | null;
}

export type ParseResult = { ok: true; values: number[] } | { ok: false; error: string };

/** Splits on commas, semicolons, spaces and line breaks. Rejects anything that is not a finite number. */
export function parseValues(text: string): ParseResult {
  const tokens = text.split(/[\s,;]+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return { ok: false, error: "Enter at least one number." };
  if (tokens.length > MAX_VALUES) return { ok: false, error: `Enter at most ${MAX_VALUES} values.` };
  const values: number[] = [];
  for (const token of tokens) {
    const n = Number(token);
    if (!Number.isFinite(n)) return { ok: false, error: `“${token.slice(0, 20)}” is not a number.` };
    values.push(n);
  }
  return { ok: true, values };
}

export function summarize(values: readonly number[]): Summary | null {
  const n = values.length;
  if (n === 0 || !values.every(Number.isFinite)) return null;
  const sorted = [...values].sort((x, y) => x - y);
  const sum = values.reduce((s, v) => s + v, 0);
  const mean = sum / n;
  const mid = Math.floor(n / 2);
  const median = n % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;

  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const top = Math.max(...counts.values());
  const modes = top > 1 ? [...counts.entries()].filter(([, c]) => c === top).map(([v]) => v).sort((x, y) => x - y) : [];

  const min = sorted[0]!;
  const max = sorted[n - 1]!;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const standardDeviation = Math.sqrt(variance);
  return {
    count: n,
    sum,
    mean,
    median,
    modes,
    min,
    max,
    range: max - min,
    meanDeviation: values.reduce((s, v) => s + Math.abs(v - mean), 0) / n,
    variance,
    standardDeviation,
    coefficientOfVariation: mean === 0 ? null : (standardDeviation / Math.abs(mean)) * 100,
  };
}
