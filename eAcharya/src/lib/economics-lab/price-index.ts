/**
 * Weighted price index (Laspeyres, base-year quantities as weights) and inflation, for the Economics Lab.
 *   Index = Σ(p1·q0) / Σ(p0·q0) × 100
 */
export interface BasketItem {
  name: string;
  /** Price in the base period. */
  basePrice: number;
  /** Price in the current period. */
  currentPrice: number;
  /** Base-period quantity, used as the weight. */
  quantity: number;
}

export interface IndexResult {
  /** Base period = 100. */
  index: number;
  /** Percentage change in the cost of the basket since the base period. */
  changePercent: number;
  baseCost: number;
  currentCost: number;
}

export function isValidItem(item: BasketItem): boolean {
  return (
    Number.isFinite(item.basePrice) && item.basePrice > 0 &&
    Number.isFinite(item.currentPrice) && item.currentPrice >= 0 &&
    Number.isFinite(item.quantity) && item.quantity >= 0
  );
}

/** Returns null for an empty or invalid basket, or when the base cost is zero. */
export function laspeyresIndex(items: readonly BasketItem[]): IndexResult | null {
  if (items.length === 0 || !items.every(isValidItem)) return null;
  const baseCost = items.reduce((sum, i) => sum + i.basePrice * i.quantity, 0);
  const currentCost = items.reduce((sum, i) => sum + i.currentPrice * i.quantity, 0);
  if (!(baseCost > 0)) return null;
  const index = (currentCost / baseCost) * 100;
  return { index, baseCost, currentCost, changePercent: index - 100 };
}

/** Inflation between two index values on the same base. Returns null if the earlier index is not positive. */
export function inflationRate(earlierIndex: number, laterIndex: number): number | null {
  if (!Number.isFinite(earlierIndex) || !Number.isFinite(laterIndex) || !(earlierIndex > 0)) return null;
  return ((laterIndex - earlierIndex) / earlierIndex) * 100;
}

/** Real value: a nominal amount deflated by a price index (base period = 100). */
export function realValue(nominal: number, index: number): number | null {
  if (!Number.isFinite(nominal) || !Number.isFinite(index) || !(index > 0)) return null;
  return (nominal / index) * 100;
}
