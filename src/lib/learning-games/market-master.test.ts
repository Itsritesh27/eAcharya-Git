import { describe, expect, it } from "vitest";
import {
  calculateTrade, getMarketEquilibrium, getMarketPoint, MARKET_SCENARIOS,
} from "./market-master";

const baseline = MARKET_SCENARIOS[0]!;

describe("Market Master market model", () => {
  it("calculates the baseline equilibrium correctly", () => {
    const eq = getMarketEquilibrium(baseline)!;
    expect(eq.price).toBeCloseTo(30);
    expect(eq.quantity).toBeCloseTo(40);
    const point = getMarketPoint(baseline, eq.price);
    expect(point.quantityDemanded).toBeCloseTo(point.quantitySupplied);
  });

  it("responds to demand and supply shifts in the expected direction", () => {
    const base = getMarketEquilibrium(MARKET_SCENARIOS[0]!)!;
    const festival = getMarketEquilibrium(MARKET_SCENARIOS[1]!)!;
    const poorHarvest = getMarketEquilibrium(MARKET_SCENARIOS[2]!)!;
    const bumperHarvest = getMarketEquilibrium(MARKET_SCENARIOS[3]!)!;
    expect(festival.price).toBeGreaterThan(base.price);
    expect(festival.quantity).toBeGreaterThan(base.quantity);
    expect(poorHarvest.price).toBeGreaterThan(base.price);
    expect(poorHarvest.quantity).toBeLessThan(base.quantity);
    expect(bumperHarvest.price).toBeLessThan(base.price);
    expect(bumperHarvest.quantity).toBeGreaterThan(base.quantity);
  });

  it("accepts viable buyer trades and calculates surplus without exceeding the budget", () => {
    const result = calculateTrade("buyer", 22, baseline);
    expect(result.accepted).toBe(true);
    if (result.accepted) {
      expect(result.total).toBe(440);
      expect(result.surplus).toBe(260);
      expect(result.total).toBeLessThanOrEqual(1000);
    }
  });

  it("rejects offers below seller cost and returns a counter-offer", () => {
    const result = calculateTrade("buyer", 18, baseline);
    expect(result.accepted).toBe(false);
    if (!result.accepted) expect(result.counterPrice).toBe(22);
  });

  it("calculates seller revenue, cost and profit", () => {
    const result = calculateTrade("seller", 30, baseline);
    expect(result.accepted).toBe(true);
    if (result.accepted) {
      expect(result.revenue).toBe(600);
      expect(result.cost).toBe(440);
      expect(result.profit).toBe(160);
    }
  });

  it("rejects a loss-making seller price and an offer above buyer willingness to pay", () => {
    const belowCost = calculateTrade("seller", 20, baseline);
    const aboveLimit = calculateTrade("seller", 40, baseline);
    expect(belowCost.accepted).toBe(false);
    expect(aboveLimit.accepted).toBe(false);
  });
});
