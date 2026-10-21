"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { inflationRate, laspeyresIndex, realValue, type BasketItem } from "@/lib/economics-lab/price-index";
import { NumberField, formatNumber, toNumber } from "./fields";

interface Row {
  id: number;
  name: string;
  basePrice: string;
  currentPrice: string;
  quantity: string;
}

const MAX_ROWS = 10;

const START_ROWS: Row[] = [
  { id: 1, name: "Rice (kg)", basePrice: "40", currentPrice: "46", quantity: "20" },
  { id: 2, name: "Milk (litre)", basePrice: "50", currentPrice: "54", quantity: "30" },
  { id: 3, name: "Notebook", basePrice: "30", currentPrice: "33", quantity: "10" },
  { id: 4, name: "Bus ticket", basePrice: "15", currentPrice: "18", quantity: "40" },
];

const cellInput = "h-10 px-2.5";

export function PriceIndexCalculator() {
  const [rows, setRows] = useState<Row[]>(START_ROWS);
  const [nextId, setNextId] = useState(START_ROWS.length + 1);
  const [nominal, setNominal] = useState("5600");
  const [earlier, setEarlier] = useState("112");
  const [later, setLater] = useState("123.2");

  const items = useMemo<BasketItem[]>(
    () => rows.map((r) => ({ name: r.name, basePrice: toNumber(r.basePrice), currentPrice: toNumber(r.currentPrice), quantity: toNumber(r.quantity) })),
    [rows],
  );
  const result = useMemo(() => laspeyresIndex(items), [items]);
  const real = result ? realValue(toNumber(nominal), result.index) : null;
  const inflation = inflationRate(toNumber(earlier), toNumber(later));

  function update(id: number, field: keyof Omit<Row, "id">, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) return;
    setRows((prev) => [...prev, { id: nextId, name: "", basePrice: "", currentPrice: "", quantity: "" }]);
    setNextId((n) => n + 1);
  }

  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  return (
    <div className="space-y-5">
      <Card><CardBody className="space-y-4">
        <h2 className="text-lg font-bold">Basket of goods</h2>
        <p className="text-sm text-forest-600">
          The quantity is the amount bought in the base period and acts as the weight: Index = Σ(current price × quantity) ÷ Σ(base price × quantity) × 100.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="text-forest-700">
                <th scope="col" className="pb-2 pr-2 font-semibold">Item</th>
                <th scope="col" className="pb-2 pr-2 font-semibold">Base price</th>
                <th scope="col" className="pb-2 pr-2 font-semibold">Current price</th>
                <th scope="col" className="pb-2 pr-2 font-semibold">Base quantity</th>
                <th scope="col" className="pb-2"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="py-1 pr-2"><Input className={cellInput} aria-label={`Item ${i + 1} name`} value={r.name} maxLength={40} onChange={(e) => update(r.id, "name", e.target.value)} /></td>
                  <td className="py-1 pr-2"><Input className={cellInput} inputMode="decimal" aria-label={`Item ${i + 1} base price`} value={r.basePrice} onChange={(e) => update(r.id, "basePrice", e.target.value)} /></td>
                  <td className="py-1 pr-2"><Input className={cellInput} inputMode="decimal" aria-label={`Item ${i + 1} current price`} value={r.currentPrice} onChange={(e) => update(r.id, "currentPrice", e.target.value)} /></td>
                  <td className="py-1 pr-2"><Input className={cellInput} inputMode="decimal" aria-label={`Item ${i + 1} base quantity`} value={r.quantity} onChange={(e) => update(r.id, "quantity", e.target.value)} /></td>
                  <td className="py-1">
                    <Button variant="ghost" size="sm" onClick={() => removeRow(r.id)} disabled={rows.length <= 1} aria-label={`Remove item ${i + 1}`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="secondary" size="sm" onClick={addRow} disabled={rows.length >= MAX_ROWS}>
          <Plus className="h-4 w-4" aria-hidden /> Add item
        </Button>
      </CardBody></Card>

      {!result && (
        <Alert tone="error">
          Fill in every row: base prices must be above 0, current prices cannot be negative, and quantities cannot be negative.
        </Alert>
      )}

      {result && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardBody>
            <p className="text-sm text-forest-600">Price index (base period = 100)</p>
            <p className="mt-1 text-2xl font-extrabold">{formatNumber(result.index)}</p>
          </CardBody></Card>
          <Card><CardBody>
            <p className="text-sm text-forest-600">Change since base period</p>
            <p className="mt-1 text-2xl font-extrabold">{formatNumber(result.changePercent)}%</p>
          </CardBody></Card>
          <Card><CardBody>
            <p className="text-sm text-forest-600">Cost of the basket</p>
            <p className="mt-1 text-lg font-bold">{formatNumber(result.baseCost)} → {formatNumber(result.currentCost)}</p>
          </CardBody></Card>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardBody className="space-y-4">
          <h2 className="text-lg font-bold">Inflation between two index values</h2>
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="pi-earlier" label="Earlier index" value={earlier} onChange={setEarlier} />
            <NumberField id="pi-later" label="Later index" value={later} onChange={setLater} />
          </div>
          <p className="text-sm text-forest-700">
            {inflation === null ? "Enter two numbers; the earlier index must be above 0." : `Inflation rate = (later − earlier) ÷ earlier × 100 = ${formatNumber(inflation)}%`}
          </p>
        </CardBody></Card>
        <Card><CardBody className="space-y-4">
          <h2 className="text-lg font-bold">Real value of an amount</h2>
          <NumberField id="pi-nominal" label="Nominal amount (for example monthly income)" value={nominal} onChange={setNominal} />
          <p className="text-sm text-forest-700">
            {real === null ? "Enter an amount and complete the basket above." : `Real value = nominal ÷ index × 100 = ${formatNumber(real)} in base-period prices`}
          </p>
        </CardBody></Card>
      </div>
      <p className="text-xs text-forest-600">The starting prices are invented for practice. For real work use an official consumer price index and name its base year.</p>
    </div>
  );
}
