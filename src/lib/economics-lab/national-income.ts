/**
 * National income aggregates by the expenditure method, for the Economics Lab (teaching values only).
 *   GDP at market prices = C + I + G + (X − M)
 *   GNP at market prices = GDP + net factor income from abroad
 *   NNP at factor cost (national income) = GNP at market prices − depreciation − (indirect taxes − subsidies)
 */
export interface NationalIncomeInputs {
  consumption: number;
  /** Gross domestic capital formation (investment including replacement of worn-out capital). */
  investment: number;
  government: number;
  exports: number;
  imports: number;
  /** Net factor income from abroad (can be negative). */
  netFactorIncomeAbroad: number;
  /** Consumption of fixed capital. */
  depreciation: number;
  indirectTaxes: number;
  subsidies: number;
}

export interface NationalIncomeResult {
  netExports: number;
  gdpMarket: number;
  gnpMarket: number;
  ndpMarket: number;
  nnpMarket: number;
  netIndirectTaxes: number;
  gdpFactorCost: number;
  /** NNP at factor cost, also called national income. */
  nationalIncome: number;
}

const REQUIRED_NON_NEGATIVE: (keyof NationalIncomeInputs)[] = [
  "consumption", "investment", "government", "exports", "imports", "depreciation", "indirectTaxes", "subsidies",
];

export function validateNationalIncome(i: NationalIncomeInputs): string | null {
  for (const key of Object.keys(i) as (keyof NationalIncomeInputs)[]) {
    if (!Number.isFinite(i[key])) return "Enter a number in every field.";
  }
  for (const key of REQUIRED_NON_NEGATIVE) {
    if (i[key] < 0) return "Only net factor income from abroad can be negative.";
  }
  return null;
}

/** Returns null when any input is invalid (see validateNationalIncome). */
export function calculateNationalIncome(i: NationalIncomeInputs): NationalIncomeResult | null {
  if (validateNationalIncome(i) !== null) return null;
  const netExports = i.exports - i.imports;
  const gdpMarket = i.consumption + i.investment + i.government + netExports;
  const gnpMarket = gdpMarket + i.netFactorIncomeAbroad;
  const ndpMarket = gdpMarket - i.depreciation;
  const nnpMarket = gnpMarket - i.depreciation;
  const netIndirectTaxes = i.indirectTaxes - i.subsidies;
  return {
    netExports,
    gdpMarket,
    gnpMarket,
    ndpMarket,
    nnpMarket,
    netIndirectTaxes,
    gdpFactorCost: gdpMarket - netIndirectTaxes,
    nationalIncome: nnpMarket - netIndirectTaxes,
  };
}
