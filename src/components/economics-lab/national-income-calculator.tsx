"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody } from "@/components/ui/card";
import { calculateNationalIncome, validateNationalIncome, type NationalIncomeInputs } from "@/lib/economics-lab/national-income";
import { NumberField, formatNumber, toNumber } from "./fields";

type Key = keyof NationalIncomeInputs;

const FIELDS: { key: Key; label: string; hint?: string }[] = [
  { key: "consumption", label: "Private final consumption (C)" },
  { key: "investment", label: "Gross investment (I)", hint: "Gross domestic capital formation." },
  { key: "government", label: "Government final consumption (G)" },
  { key: "exports", label: "Exports (X)" },
  { key: "imports", label: "Imports (M)" },
  { key: "netFactorIncomeAbroad", label: "Net factor income from abroad", hint: "Can be negative." },
  { key: "depreciation", label: "Depreciation (consumption of fixed capital)" },
  { key: "indirectTaxes", label: "Indirect taxes" },
  { key: "subsidies", label: "Subsidies" },
];

const START: Record<Key, string> = {
  consumption: "600",
  investment: "200",
  government: "150",
  exports: "80",
  imports: "100",
  netFactorIncomeAbroad: "-10",
  depreciation: "50",
  indirectTaxes: "70",
  subsidies: "20",
};

export function NationalIncomeCalculator() {
  const [values, setValues] = useState<Record<Key, string>>(START);

  const inputs = useMemo<NationalIncomeInputs>(
    () => ({
      consumption: toNumber(values.consumption),
      investment: toNumber(values.investment),
      government: toNumber(values.government),
      exports: toNumber(values.exports),
      imports: toNumber(values.imports),
      netFactorIncomeAbroad: toNumber(values.netFactorIncomeAbroad),
      depreciation: toNumber(values.depreciation),
      indirectTaxes: toNumber(values.indirectTaxes),
      subsidies: toNumber(values.subsidies),
    }),
    [values],
  );
  const error = validateNationalIncome(inputs);
  const r = useMemo(() => calculateNationalIncome(inputs), [inputs]);
  const f = (n: number) => formatNumber(n, 2);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <Card><CardBody className="space-y-4">
          <h2 className="text-lg font-bold">Expenditure data</h2>
          <p className="text-sm text-forest-600">Use one currency unit and one year for every value, for example ₹ crore.</p>
          <div className="grid gap-3">
            {FIELDS.map((field) => (
              <NumberField
                key={field.key}
                id={`ni-${field.key}`}
                label={field.label}
                hint={field.hint}
                value={values[field.key]}
                onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
              />
            ))}
          </div>
        </CardBody></Card>

        <div className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}
          {r && (
            <>
              <Card><CardBody className="space-y-3">
                <h2 className="text-lg font-bold">Step by step</h2>
                <ol className="space-y-3 text-sm text-forest-800">
                  <li><strong>Net exports</strong> = X − M = {f(inputs.exports)} − {f(inputs.imports)} = <strong>{f(r.netExports)}</strong></li>
                  <li><strong>GDP at market prices</strong> = C + I + G + (X − M) = <strong>{f(r.gdpMarket)}</strong></li>
                  <li><strong>GNP at market prices</strong> = GDP + net factor income from abroad = {f(r.gdpMarket)} + ({f(inputs.netFactorIncomeAbroad)}) = <strong>{f(r.gnpMarket)}</strong></li>
                  <li><strong>NDP at market prices</strong> = GDP − depreciation = <strong>{f(r.ndpMarket)}</strong></li>
                  <li><strong>NNP at market prices</strong> = GNP − depreciation = <strong>{f(r.nnpMarket)}</strong></li>
                  <li><strong>Net indirect taxes</strong> = indirect taxes − subsidies = <strong>{f(r.netIndirectTaxes)}</strong></li>
                  <li><strong>GDP at factor cost</strong> = GDP at market prices − net indirect taxes = <strong>{f(r.gdpFactorCost)}</strong></li>
                  <li><strong>National income (NNP at factor cost)</strong> = NNP at market prices − net indirect taxes = <strong>{f(r.nationalIncome)}</strong></li>
                </ol>
              </CardBody></Card>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card><CardBody><p className="text-sm text-forest-600">GDP (market prices)</p><p className="mt-1 text-2xl font-extrabold">{f(r.gdpMarket)}</p></CardBody></Card>
                <Card><CardBody><p className="text-sm text-forest-600">GNP (market prices)</p><p className="mt-1 text-2xl font-extrabold">{f(r.gnpMarket)}</p></CardBody></Card>
                <Card><CardBody><p className="text-sm text-forest-600">National income</p><p className="mt-1 text-2xl font-extrabold">{f(r.nationalIncome)}</p></CardBody></Card>
              </div>
              <div className="rounded-xl bg-sage-50 p-3 text-sm text-forest-800">
                <strong>Interpretation prompt:</strong> GDP counts only goods and services sold in markets. Name one valuable activity it leaves out and say why that matters when comparing wellbeing.
              </div>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-forest-600">These numbers are a practice example, not official statistics. Textbook definitions of the aggregates can vary slightly, so follow the formulas in your prescribed NCERT book for exams.</p>
    </div>
  );
}
