import { describe, expect, it } from "vitest";
import { inflationRate, laspeyresIndex, realValue, type BasketItem } from "./price-index";

const basket: BasketItem[] = [
  { name: "A", basePrice: 10, currentPrice: 12, quantity: 5 },
  { name: "B", basePrice: 20, currentPrice: 22, quantity: 10 },
];

describe("price index", () => {
  it("computes a weighted index with base-year quantities", () => {
    const r = laspeyresIndex(basket)!;
    expect(r.baseCost).toBe(250);
    expect(r.currentCost).toBe(280);
    expect(r.index).toBeCloseTo(112);
    expect(r.changePercent).toBeCloseTo(12);
  });
  it("rejects empty or invalid baskets", () => {
    expect(laspeyresIndex([])).toBeNull();
    expect(laspeyresIndex([{ name: "x", basePrice: 0, currentPrice: 5, quantity: 1 }])).toBeNull();
    expect(laspeyresIndex([{ name: "x", basePrice: 5, currentPrice: -1, quantity: 1 }])).toBeNull();
    expect(laspeyresIndex([{ name: "x", basePrice: 5, currentPrice: 6, quantity: 0 }])).toBeNull();
  });
  it("computes inflation between two index values", () => {
    expect(inflationRate(112, 123.2)).toBeCloseTo(10);
    expect(inflationRate(0, 100)).toBeNull();
    expect(inflationRate(100, Number.NaN)).toBeNull();
  });
  it("deflates a nominal value by an index", () => {
    expect(realValue(5600, 112)).toBeCloseTo(5000);
    expect(realValue(100, 0)).toBeNull();
  });
});
