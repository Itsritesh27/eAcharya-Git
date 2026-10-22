/**
 * Linear demand and supply for the Economics Lab.
 *   Demand: Qd = a − b·P   (b > 0)
 *   Supply: Qs = c + d·P   (d > 0)
 * Pure functions only, so the maths can be tested without a browser.
 */
export interface MarketInputs {
  /** Demand intercept: quantity demanded at a price of zero. */
  a: number;
  /** Demand slope: fall in quantity demanded for each unit rise in price. */
  b: number;
  /** Supply intercept: quantity supplied at a price of zero (can be negative). */
  c: number;
  /** Supply slope: rise in quantity supplied for each unit rise in price. */
  d: number;
}

export interface Equilibrium {
  price: number;
  quantity: number;
  /** Absolute price elasticity of demand at the equilibrium point. */
  demandElasticity: number;
  /** Price elasticity of supply at the equilibrium point. */
  supplyElasticity: number;
}

export type PriceControl = "none" | "ceiling" | "floor";

export interface ControlOutcome {
  quantityDemanded: number;
  quantitySupplied: number;
  /** Quantity actually traded: the smaller of the two sides. */
  quantityTraded: number;
  shortage: number;
  surplus: number;
  /** True when the control is set on the "wrong" side of equilibrium and therefore changes nothing. */
  notBinding: boolean;
}

export function isValidMarket(m: MarketInputs): boolean {
  return [m.a, m.b, m.c, m.d].every(Number.isFinite) && m.a > 0 && m.b > 0 && m.d > 0;
}

export function quantityDemanded(m: MarketInputs, price: number): number {
  return Math.max(0, m.a - m.b * price);
}

export function quantitySupplied(m: MarketInputs, price: number): number {
  return Math.max(0, m.c + m.d * price);
}

/** Returns null when the inputs are invalid or the lines do not cross at a positive price and quantity. */
export function findEquilibrium(m: MarketInputs): Equilibrium | null {
  if (!isValidMarket(m)) return null;
  const price = (m.a - m.c) / (m.b + m.d);
  const quantity = m.a - m.b * price;
  if (!(price > 0) || !(quantity > 0)) return null;
  return {
    price,
    quantity,
    demandElasticity: (m.b * price) / quantity,
    supplyElasticity: (m.d * price) / quantity,
  };
}

/** What happens at a controlled price: shortage or surplus and the quantity actually traded. */
export function outcomeAtPrice(m: MarketInputs, controlledPrice: number, control: PriceControl): ControlOutcome | null {
  const eq = findEquilibrium(m);
  if (!eq || !Number.isFinite(controlledPrice) || controlledPrice < 0) return null;
  const qd = quantityDemanded(m, controlledPrice);
  const qs = quantitySupplied(m, controlledPrice);
  const notBinding =
    control === "none" ||
    (control === "ceiling" && controlledPrice >= eq.price) ||
    (control === "floor" && controlledPrice <= eq.price);
  if (notBinding) {
    return { quantityDemanded: eq.quantity, quantitySupplied: eq.quantity, quantityTraded: eq.quantity, shortage: 0, surplus: 0, notBinding: true };
  }
  return {
    quantityDemanded: qd,
    quantitySupplied: qs,
    quantityTraded: Math.min(qd, qs),
    shortage: Math.max(0, qd - qs),
    surplus: Math.max(0, qs - qd),
    notBinding: false,
  };
}

/** A shift of demand or supply changes the intercept, not the slope. Positive = rightward shift. */
export function shiftMarket(m: MarketInputs, demandShift: number, supplyShift: number): MarketInputs {
  return { ...m, a: m.a + demandShift, c: m.c + supplyShift };
}

/** Plain-language reading of how equilibrium moved after a shift. */
export function describeChange(before: Equilibrium, after: Equilibrium): string {
  const eps = 1e-9;
  const dp = after.price - before.price;
  const dq = after.quantity - before.quantity;
  const price = Math.abs(dp) < eps ? "price is unchanged" : dp > 0 ? "price rises" : "price falls";
  const qty = Math.abs(dq) < eps ? "quantity is unchanged" : dq > 0 ? "quantity rises" : "quantity falls";
  return `Compared with the starting market, ${price} and ${qty}.`;
}
