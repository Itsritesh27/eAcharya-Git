export type MarketRole = "buyer" | "seller";

export interface MarketScenario {
  id: string;
  title: string;
  subtitle: string;
  demandShift: number;
  supplyIntercept: number;
  sellerCost: number;
  buyerMax: number;
  explanation: string;
}

/** All values are fictional teaching-model values, not real market data. */
export const MARKET_SCENARIOS: readonly MarketScenario[] = [
  {
    id: "normal-market", title: "A regular market day", subtitle: "Demand and supply are close to their usual pattern.",
    demandShift: 0, supplyIntercept: 10, sellerCost: 22, buyerMax: 35,
    explanation: "With no new shock, use the baseline demand and supply schedules. Buyers compare the price with their willingness to pay; sellers compare it with their cost.",
  },
  {
    id: "festival-demand", title: "Festival demand rises", subtitle: "More households want wheat for a local festival.",
    demandShift: 20, supplyIntercept: 10, sellerCost: 22, buyerMax: 38,
    explanation: "Demand shifts right. At each price, buyers want more than before. In this model that tends to raise equilibrium price and quantity, if supply slopes upward.",
  },
  {
    id: "poor-harvest", title: "A poor harvest", subtitle: "Less wheat reaches the market this week.",
    demandShift: 0, supplyIntercept: -5, sellerCost: 28, buyerMax: 35,
    explanation: "Supply shifts left. A lower quantity is available at each price. The model predicts a higher equilibrium price and a lower equilibrium quantity than the baseline.",
  },
  {
    id: "bumper-harvest", title: "A bumper harvest", subtitle: "Good growing conditions increase available stock.",
    demandShift: 0, supplyIntercept: 25, sellerCost: 18, buyerMax: 34,
    explanation: "Supply shifts right. More wheat is available at each price. In this model the equilibrium price falls and equilibrium quantity rises.",
  },
  {
    id: "transport-costs", title: "Transport costs increase", subtitle: "Moving wheat to the market becomes more expensive.",
    demandShift: 0, supplyIntercept: 0, sellerCost: 26, buyerMax: 36,
    explanation: "Higher costs can reduce the quantity sellers are willing to provide at each market price. Here supply shifts left, so the model's equilibrium price rises and quantity falls.",
  },
];

export interface MarketPoint {
  price: number;
  quantityDemanded: number;
  quantitySupplied: number;
}

export interface MarketEquilibrium {
  price: number;
  quantity: number;
}

export function getMarketPoint(scenario: MarketScenario, price: number): MarketPoint {
  const safePrice = Math.max(0, price);
  return {
    price: safePrice,
    quantityDemanded: Math.max(0, scenario.demandShift + 100 - 2 * safePrice),
    quantitySupplied: Math.max(0, scenario.supplyIntercept + safePrice),
  };
}

export function getMarketEquilibrium(scenario: MarketScenario): MarketEquilibrium | null {
  // Qd = 100 + demandShift - 2P; Qs = supplyIntercept + P
  const price = (100 + scenario.demandShift - scenario.supplyIntercept) / 3;
  if (!Number.isFinite(price) || price < 0) return null;
  const point = getMarketPoint(scenario, price);
  if (point.quantityDemanded <= 0 || point.quantitySupplied <= 0) return null;
  return { price, quantity: point.quantityDemanded };
}

export function formatMoney(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits }).format(value);
}

export function calculateTrade(role: MarketRole, offer: number, scenario: MarketScenario, quantity = 20) {
  const price = Math.round(offer);
  const total = price * quantity;
  if (!Number.isInteger(price) || price < 10 || price > 50) {
    return { accepted: false as const, reason: "Choose a price from ₹10 to ₹50 per kg.", counterPrice: null, total, quantity, price };
  }

  if (role === "buyer") {
    const budget = 1000;
    if (total > budget) return { accepted: false as const, reason: `That offer costs ${formatMoney(total)}, above your ${formatMoney(budget)} budget. Try a lower price.`, counterPrice: null, total, quantity, price };
    if (price > scenario.buyerMax) return { accepted: false as const, reason: `Your offer is above your own willingness-to-pay limit of ${formatMoney(scenario.buyerMax)} per kg. Staying below your limit protects your buyer surplus.`, counterPrice: scenario.buyerMax, total, quantity, price };
    if (price < scenario.sellerCost) return { accepted: false as const, reason: `The seller's minimum viable price is ${formatMoney(scenario.sellerCost)} per kg in this scenario. Your offer is too low to cover the seller's unit cost.`, counterPrice: scenario.sellerCost, total, quantity, price };
    const surplus = (scenario.buyerMax - price) * quantity;
    const score = 100 + Math.min(20, Math.max(0, Math.round((scenario.buyerMax - price) * 2)));
    return { accepted: true as const, reason: `The seller accepts ${formatMoney(price)} per kg. Your purchase is within budget and below your willingness-to-pay limit.`, counterPrice: null, total, quantity, price, revenue: 0, cost: total, profit: 0, surplus, score };
  }

  if (price < scenario.sellerCost) {
    return { accepted: false as const, reason: `Your asking price is below the ${formatMoney(scenario.sellerCost)} per kg unit cost. A sale at this price would make a loss, so protect your minimum viable price.`, counterPrice: scenario.sellerCost, total, quantity, price };
  }
  if (price > scenario.buyerMax) {
    return { accepted: false as const, reason: `The buyer's maximum willingness to pay is ${formatMoney(scenario.buyerMax)} per kg. Your asking price is too high for this buyer.`, counterPrice: scenario.buyerMax, total, quantity, price };
  }
  const revenue = total;
  const cost = scenario.sellerCost * quantity;
  const profit = revenue - cost;
  const score = 100 + Math.min(20, Math.max(0, Math.round(price - scenario.sellerCost)));
  return { accepted: true as const, reason: `The buyer accepts ${formatMoney(price)} per kg. Your revenue covers the cost of the wheat and leaves a positive trading profit.`, counterPrice: null, total, quantity, price, revenue, cost, profit, surplus: 0, score };
}

export type MarketTradeResult = ReturnType<typeof calculateTrade>;
