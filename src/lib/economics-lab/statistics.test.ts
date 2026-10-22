import { describe, expect, it } from "vitest";
import { MAX_VALUES, parseValues, summarize } from "./statistics";

describe("statistics summary", () => {
  it("computes the central tendency and spread", () => {
    const s = summarize([2, 4, 4, 6])!;
    expect(s.count).toBe(4);
    expect(s.mean).toBe(4);
    expect(s.median).toBe(4);
    expect(s.modes).toEqual([4]);
    expect(s.range).toBe(4);
    expect(s.meanDeviation).toBe(1);
    expect(s.variance).toBe(2);
    expect(s.standardDeviation).toBeCloseTo(Math.sqrt(2));
    expect(s.coefficientOfVariation).toBeCloseTo((Math.sqrt(2) / 4) * 100);
  });
  it("averages the two middle values for an even count and reports no mode when nothing repeats", () => {
    const s = summarize([1, 2, 3, 4])!;
    expect(s.median).toBe(2.5);
    expect(s.modes).toEqual([]);
  });
  it("reports every mode in a multimodal set", () => {
    expect(summarize([1, 1, 2, 2, 3])!.modes).toEqual([1, 2]);
  });
  it("handles a zero mean and rejects empty or non-finite data", () => {
    expect(summarize([-1, 1])!.coefficientOfVariation).toBeNull();
    expect(summarize([])).toBeNull();
    expect(summarize([1, Number.NaN])).toBeNull();
  });
  it("parses numbers separated by commas, spaces and new lines", () => {
    expect(parseValues("10, 20\n30;40  50")).toEqual({ ok: true, values: [10, 20, 30, 40, 50] });
    expect(parseValues("1.5,-2")).toEqual({ ok: true, values: [1.5, -2] });
  });
  it("reports bad tokens, empty input and oversized input", () => {
    expect(parseValues("   ")).toEqual({ ok: false, error: "Enter at least one number." });
    const bad = parseValues("1, two, 3");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toContain("two");
    expect(parseValues(Array.from({ length: MAX_VALUES + 1 }, () => "1").join(" ")).ok).toBe(false);
    expect(parseValues("Infinity").ok).toBe(false);
  });
});
