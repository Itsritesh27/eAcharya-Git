import { describe, expect, it } from "vitest";
import { describeChange, findEquilibrium, isValidMarket, outcomeAtPrice, quantityDemanded, quantitySupplied, shiftMarket, type MarketInputs } from "./demand-supply";

const market: MarketInputs = { a: 100, b: 2, c: 10, d: 1 };

describe("demand and supply", () => {
  it("finds the equilibrium and elasticities", () => {
    const eq = findEquilibrium(market)!;
    expect(eq.price).toBeCloseTo(30);
    expect(eq.quantity).toBeCloseTo(40);
    expect(eq.demandElasticity).toBeCloseTo(1.5);
    expect(eq.supplyElasticity).toBeCloseTo(0.75);
  });
  it("rejects invalid inputs and markets with no positive equilibrium", () => {
    expect(isValidMarket({ a: 100, b: 0, c: 10, d: 1 })).toBe(false);
    expect(findEquilibrium({ a: 100, b: -1, c: 10, d: 1 })).toBeNull();
    expect(findEquilibrium({ a: Number.NaN, b: 1, c: 0, d: 1 })).toBeNull();
    expect(findEquilibrium({ a: 10, b: 1, c: 50, d: 1 })).toBeNull();
  });
  it("never returns a negative quantity", () => {
    expect(quantityDemanded(market, 80)).toBe(0);
    expect(quantitySupplied({ a: 10, b: 1, c: -20, d: 1 }, 5)).toBe(0);
  });
  it("shows a shortage under a binding ceiling and a surplus under a binding floor", () => {
    const ceiling = outcomeAtPrice(market, 20, "ceiling")!;
    expect(ceiling.shortage).toBeCloseTo(30);
    expect(ceiling.quantityTraded).toBeCloseTo(30);
    const floor = outcomeAtPrice(market, 40, "floor")!;
    expect(floor.surplus).toBeCloseTo(30);
    expect(floor.quantityTraded).toBeCloseTo(20);
  });
  it("ignores controls that are not binding", () => {
    const high = outcomeAtPrice(market, 35, "ceiling")!;
    expect(high.notBinding).toBe(true);
    expect(high.shortage).toBe(0);
    expect(outcomeAtPrice(market, 25, "floor")!.notBinding).toBe(true);
    expect(outcomeAtPrice(market, -1, "ceiling")).toBeNull();
  });
  it("moves equilibrium when demand shifts right", () => {
    const before = findEquilibrium(market)!;
    const after = findEquilibrium(shiftMarket(market, 30, 0))!;
    expect(after.price).toBeCloseTo(40);
    expect(after.quantity).toBeCloseTo(50);
    expect(describeChange(before, after)).toBe("Compared with the starting market, price rises and quantity rises.");
  });
  it("describes a supply increase as lower price and higher quantity", () => {
    const before = findEquilibrium(market)!;
    const after = findEquilibrium(shiftMarket(market, 0, 15))!;
    expect(describeChange(before, after)).toBe("Compared with the starting market, price falls and quantity rises.");
  });
});
