"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody } from "@/components/ui/card";
import {
  describeChange, findEquilibrium, outcomeAtPrice, shiftMarket, type MarketInputs, type PriceControl,
} from "@/lib/economics-lab/demand-supply";
import { NumberField, formatNumber, toNumber } from "./fields";

const W = 520;
const H = 340;
const M = { left: 52, right: 16, top: 16, bottom: 44 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

const selectClass =
  "h-11 w-full rounded-xl border border-sage-300 bg-white px-3 text-sm text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

/** Segment endpoints as [quantity, price] pairs, clipped to the chart's price range. */
function demandLine(m: MarketInputs, pMax: number): [number, number][] {
  const pEnd = Math.min(pMax, m.a / m.b);
  return [[m.a, 0], [Math.max(0, m.a - m.b * pEnd), pEnd]];
}

function supplyLine(m: MarketInputs, pMax: number): [number, number][] {
  const pStart = m.c < 0 ? -m.c / m.d : 0;
  return [[Math.max(0, m.c + m.d * pStart), pStart], [Math.max(0, m.c + m.d * pMax), pMax]];
}

export function DemandSupplyExplorer() {
  const [a, setA] = useState("100");
  const [b, setB] = useState("2");
  const [c, setC] = useState("10");
  const [d, setD] = useState("1");
  const [demandShift, setDemandShift] = useState("0");
  const [supplyShift, setSupplyShift] = useState("0");
  const [control, setControl] = useState<PriceControl>("none");
  const [controlPrice, setControlPrice] = useState("20");

  const start = useMemo<MarketInputs>(() => ({ a: toNumber(a), b: toNumber(b), c: toNumber(c), d: toNumber(d) }), [a, b, c, d]);
  const dShift = toNumber(demandShift);
  const sShift = toNumber(supplyShift);
  const shiftsValid = Number.isFinite(dShift) && Number.isFinite(sShift);
  const shifted = useMemo(() => (shiftsValid ? shiftMarket(start, dShift, sShift) : start), [start, dShift, sShift, shiftsValid]);
  const hasShift = shiftsValid && (dShift !== 0 || sShift !== 0);

  const eq0 = useMemo(() => findEquilibrium(start), [start]);
  const eq1 = useMemo(() => findEquilibrium(shifted), [shifted]);
  const cp = toNumber(controlPrice);
  const outcome = useMemo(() => (eq1 ? outcomeAtPrice(shifted, cp, control) : null), [eq1, shifted, cp, control]);

  const chart = useMemo(() => {
    if (!eq0 || !eq1) return null;
    const pMax = Math.max(start.a / start.b, shifted.a / shifted.b, eq0.price * 2, eq1.price * 2, Number.isFinite(cp) ? cp * 1.1 : 0);
    const lines = { d0: demandLine(start, pMax), s0: supplyLine(start, pMax), d1: demandLine(shifted, pMax), s1: supplyLine(shifted, pMax) };
    const qMax = Math.max(...Object.values(lines).flatMap((l) => l.map(([q]) => q)), eq0.quantity * 1.5, eq1.quantity * 1.5) * 1.05;
    const x = (q: number) => M.left + (q / qMax) * PLOT_W;
    const y = (p: number) => M.top + PLOT_H - (p / pMax) * PLOT_H;
    const path = (pts: [number, number][]) => pts.map(([q, p], i) => `${i === 0 ? "M" : "L"}${x(q).toFixed(1)} ${y(p).toFixed(1)}`).join(" ");
    const ticks = [0, 0.25, 0.5, 0.75, 1];
    return { pMax, qMax, lines, x, y, path, ticks };
  }, [eq0, eq1, start, shifted, cp]);

  const inputsOk = Boolean(eq0);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card><CardBody className="space-y-4">
            <h2 className="text-lg font-bold">Starting market</h2>
            <p className="text-sm text-forest-600">Demand: Qd = a − b × P. Supply: Qs = c + d × P. Price is the vertical axis.</p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="ds-a" label="a (demand at zero price)" value={a} onChange={setA} />
              <NumberField id="ds-b" label="b (demand slope)" value={b} onChange={setB} hint="Must be above 0." />
              <NumberField id="ds-c" label="c (supply at zero price)" value={c} onChange={setC} hint="Can be negative." />
              <NumberField id="ds-d" label="d (supply slope)" value={d} onChange={setD} hint="Must be above 0." />
            </div>
          </CardBody></Card>

          <Card><CardBody className="space-y-4">
            <h2 className="text-lg font-bold">Shift the curves</h2>
            <p className="text-sm text-forest-600">Positive moves a curve right (an increase), negative moves it left (a decrease).</p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="ds-dshift" label="Change in demand" value={demandShift} onChange={setDemandShift} />
              <NumberField id="ds-sshift" label="Change in supply" value={supplyShift} onChange={setSupplyShift} />
            </div>
          </CardBody></Card>

          <Card><CardBody className="space-y-4">
            <h2 className="text-lg font-bold">Price control</h2>
            <div>
              <label htmlFor="ds-control" className="mb-1.5 block text-sm font-medium text-forest-800">Type</label>
              <select id="ds-control" value={control} onChange={(e) => setControl(e.target.value as PriceControl)} className={selectClass}>
                <option value="none">None (free market)</option>
                <option value="ceiling">Price ceiling (maximum price)</option>
                <option value="floor">Price floor (minimum price)</option>
              </select>
            </div>
            {control !== "none" && <NumberField id="ds-cp" label="Controlled price" value={controlPrice} onChange={setControlPrice} />}
          </CardBody></Card>
        </div>

        <div className="space-y-5">
          {!inputsOk && (
            <Alert tone="error">
              Check the inputs: a, b and d must be above 0, and the curves must cross at a positive price and quantity.
            </Alert>
          )}
          {inputsOk && !eq1 && (
            <Alert tone="error">After this shift the curves no longer cross at a positive price and quantity. Try a smaller change.</Alert>
          )}
          {chart && eq0 && eq1 && (
            <Card><CardBody className="space-y-3">
              <h2 className="text-lg font-bold">Demand and supply diagram</h2>
              <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
                aria-label={`Demand and supply diagram. Equilibrium price ${formatNumber(eq1.price)} and quantity ${formatNumber(eq1.quantity)}.`}>
                {chart.ticks.map((t) => (
                  <g key={t}>
                    <line x1={M.left} x2={W - M.right} y1={chart.y(chart.pMax * t)} y2={chart.y(chart.pMax * t)} stroke="currentColor" className="text-sage-200" />
                    <text x={M.left - 8} y={chart.y(chart.pMax * t) + 4} textAnchor="end" fontSize="11" fill="currentColor" className="text-forest-600">{formatNumber(chart.pMax * t, 0)}</text>
                    <text x={chart.x(chart.qMax * t)} y={H - M.bottom + 16} textAnchor="middle" fontSize="11" fill="currentColor" className="text-forest-600">{formatNumber(chart.qMax * t, 0)}</text>
                  </g>
                ))}
                <line x1={M.left} x2={W - M.right} y1={M.top + PLOT_H} y2={M.top + PLOT_H} stroke="currentColor" className="text-forest-500" strokeWidth="1.5" />
                <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + PLOT_H} stroke="currentColor" className="text-forest-500" strokeWidth="1.5" />
                <text x={M.left + PLOT_W / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="currentColor" className="text-forest-800">Quantity</text>
                <text x={14} y={M.top + PLOT_H / 2} textAnchor="middle" fontSize="12" fill="currentColor" className="text-forest-800" transform={`rotate(-90 14 ${M.top + PLOT_H / 2})`}>Price</text>

                {hasShift && (
                  <>
                    <path d={chart.path(chart.lines.d0)} fill="none" stroke="currentColor" className="text-sage-300" strokeWidth="2.5" strokeDasharray="6 4" />
                    <path d={chart.path(chart.lines.s0)} fill="none" stroke="currentColor" className="text-sage-300" strokeWidth="2.5" strokeDasharray="6 4" />
                  </>
                )}
                <path d={chart.path(chart.lines.d1)} fill="none" stroke="currentColor" className="text-brand-600" strokeWidth="3" strokeLinecap="round" />
                <path d={chart.path(chart.lines.s1)} fill="none" stroke="currentColor" className="text-forest-900" strokeWidth="3" strokeLinecap="round" />

                {control !== "none" && Number.isFinite(cp) && cp >= 0 && cp <= chart.pMax && (
                  <line x1={M.left} x2={W - M.right} y1={chart.y(cp)} y2={chart.y(cp)} stroke="currentColor" className="text-danger-600" strokeWidth="2" strokeDasharray="3 3" />
                )}

                <line x1={chart.x(eq1.quantity)} x2={chart.x(eq1.quantity)} y1={chart.y(eq1.price)} y2={M.top + PLOT_H} stroke="currentColor" className="text-forest-500" strokeDasharray="4 3" />
                <line x1={M.left} x2={chart.x(eq1.quantity)} y1={chart.y(eq1.price)} y2={chart.y(eq1.price)} stroke="currentColor" className="text-forest-500" strokeDasharray="4 3" />
                <circle cx={chart.x(eq1.quantity)} cy={chart.y(eq1.price)} r="6" fill="currentColor" className="text-amber-500" />
              </svg>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-forest-700">
                <li><span className="mr-1.5 inline-block h-2 w-5 rounded-sm bg-brand-600 align-middle" />Demand</li>
                <li><span className="mr-1.5 inline-block h-2 w-5 rounded-sm bg-forest-900 align-middle" />Supply</li>
                {hasShift && <li><span className="mr-1.5 inline-block h-2 w-5 rounded-sm bg-sage-300 align-middle" />Starting curves</li>}
                {control !== "none" && <li><span className="mr-1.5 inline-block h-2 w-5 rounded-sm bg-danger-600 align-middle" />Controlled price</li>}
              </ul>
            </CardBody></Card>
          )}

          {eq0 && eq1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card><CardBody>
                <p className="text-sm text-forest-600">{hasShift ? "New equilibrium" : "Equilibrium"}</p>
                <p className="mt-1 text-2xl font-extrabold">Price {formatNumber(eq1.price)} · Quantity {formatNumber(eq1.quantity)}</p>
                {hasShift && <p className="mt-2 text-sm text-forest-700">{describeChange(eq0, eq1)} Before the shift: price {formatNumber(eq0.price)}, quantity {formatNumber(eq0.quantity)}.</p>}
              </CardBody></Card>
              <Card><CardBody>
                <p className="text-sm text-forest-600">Elasticity at equilibrium</p>
                <p className="mt-1 text-lg font-bold">Demand {formatNumber(eq1.demandElasticity)} · Supply {formatNumber(eq1.supplyElasticity)}</p>
                <p className="mt-2 text-sm text-forest-700">
                  Demand is {eq1.demandElasticity > 1 ? "elastic" : eq1.demandElasticity < 1 ? "inelastic" : "unitary elastic"} at this point (absolute value {eq1.demandElasticity > 1 ? "above" : eq1.demandElasticity < 1 ? "below" : "equal to"} 1).
                </p>
              </CardBody></Card>
            </div>
          )}

          {outcome && control !== "none" && (
            <Card><CardBody className="space-y-2">
              <h2 className="text-lg font-bold">Effect of the {control === "ceiling" ? "price ceiling" : "price floor"}</h2>
              {outcome.notBinding ? (
                <p className="text-sm text-forest-700">
                  This {control === "ceiling" ? "ceiling is at or above" : "floor is at or below"} the equilibrium price, so it is not binding and the market clears as before.
                </p>
              ) : (
                <>
                  <p className="text-sm text-forest-700">At the controlled price, buyers want {formatNumber(outcome.quantityDemanded)} units and sellers offer {formatNumber(outcome.quantitySupplied)} units.</p>
                  <p className="text-base font-bold">
                    {outcome.shortage > 0 ? `Shortage of ${formatNumber(outcome.shortage)} units` : `Surplus of ${formatNumber(outcome.surplus)} units`} · {formatNumber(outcome.quantityTraded)} units are actually traded
                  </p>
                </>
              )}
            </CardBody></Card>
          )}
        </div>
      </div>
      <p className="text-xs text-forest-600">The default numbers are a practice example, not data about a real market. Straight-line curves are a simplification used in school economics.</p>
    </div>
  );
}
