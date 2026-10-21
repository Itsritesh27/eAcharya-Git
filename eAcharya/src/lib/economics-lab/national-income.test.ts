import { describe, expect, it } from "vitest";
import { calculateNationalIncome, validateNationalIncome, type NationalIncomeInputs } from "./national-income";

const inputs: NationalIncomeInputs = {
  consumption: 600, investment: 200, government: 150, exports: 80, imports: 100,
  netFactorIncomeAbroad: -10, depreciation: 50, indirectTaxes: 70, subsidies: 20,
};

describe("national income", () => {
  it("calculates the aggregates by the expenditure method", () => {
    const r = calculateNationalIncome(inputs)!;
    expect(r.netExports).toBe(-20);
    expect(r.gdpMarket).toBe(930);
    expect(r.gnpMarket).toBe(920);
    expect(r.ndpMarket).toBe(880);
    expect(r.nnpMarket).toBe(870);
    expect(r.netIndirectTaxes).toBe(50);
    expect(r.gdpFactorCost).toBe(880);
    expect(r.nationalIncome).toBe(820);
  });
  it("allows negative net factor income only", () => {
    expect(validateNationalIncome(inputs)).toBeNull();
    expect(validateNationalIncome({ ...inputs, consumption: -1 })).not.toBeNull();
    expect(calculateNationalIncome({ ...inputs, exports: -5 })).toBeNull();
  });
  it("rejects non-numeric input", () => {
    expect(validateNationalIncome({ ...inputs, government: Number.NaN })).not.toBeNull();
    expect(calculateNationalIncome({ ...inputs, imports: Number.POSITIVE_INFINITY })).toBeNull();
  });
});
