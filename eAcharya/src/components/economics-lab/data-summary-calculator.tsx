"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody } from "@/components/ui/card";
import { parseValues, summarize } from "@/lib/economics-lab/statistics";
import { formatNumber } from "./fields";

const SAMPLE = "12, 15, 15, 18, 20, 22, 22, 22, 30";
const MAX_FREQUENCY_ROWS = 20;

export function DataSummaryCalculator() {
  const [text, setText] = useState(SAMPLE);

  const parsed = useMemo(() => parseValues(text), [text]);
  const summary = useMemo(() => (parsed.ok ? summarize(parsed.values) : null), [parsed]);
  const frequency = useMemo(() => {
    if (!parsed.ok) return [];
    const counts = new Map<number, number>();
    for (const v of parsed.values) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts.entries()].sort((x, y) => x[0] - y[0]);
  }, [parsed]);
  const f = (n: number) => formatNumber(n, 3);

  const stats: { label: string; value: string }[] = summary
    ? [
        { label: "Count", value: formatNumber(summary.count, 0) },
        { label: "Sum", value: f(summary.sum) },
        { label: "Mean", value: f(summary.mean) },
        { label: "Median", value: f(summary.median) },
        { label: "Mode", value: summary.modes.length === 0 ? "No value repeats" : summary.modes.map(f).join(", ") },
        { label: "Minimum", value: f(summary.min) },
        { label: "Maximum", value: f(summary.max) },
        { label: "Range", value: f(summary.range) },
        { label: "Mean deviation", value: f(summary.meanDeviation) },
        { label: "Standard deviation", value: f(summary.standardDeviation) },
        { label: "Coefficient of variation", value: summary.coefficientOfVariation === null ? "Not defined (mean is 0)" : `${f(summary.coefficientOfVariation)}%` },
      ]
    : [];

  return (
    <div className="space-y-5">
      <Card><CardBody className="space-y-3">
        <label htmlFor="ds-values" className="block text-lg font-bold">Your data</label>
        <p className="text-sm text-forest-600">Type or paste numbers separated by commas, spaces or new lines (up to 500 values). They are treated as the whole data set.</p>
        <textarea
          id="ds-values"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          spellCheck={false}
          aria-describedby={parsed.ok ? undefined : "ds-values-error"}
          className="w-full rounded-xl border border-sage-300 bg-white p-3 text-sm text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
        {!parsed.ok && <div id="ds-values-error"><Alert tone="error">{parsed.error}</Alert></div>}
      </CardBody></Card>

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}><CardBody>
                <p className="text-sm text-forest-600">{s.label}</p>
                <p className="mt-1 break-words text-xl font-extrabold">{s.value}</p>
              </CardBody></Card>
            ))}
          </div>

          {frequency.length > 0 && frequency.length <= MAX_FREQUENCY_ROWS && (
            <Card><CardBody className="space-y-3">
              <h2 className="text-lg font-bold">Frequency table</h2>
              <div className="overflow-x-auto">
                <table className="w-full max-w-md text-left text-sm">
                  <thead><tr className="text-forest-700"><th scope="col" className="pb-2 font-semibold">Value</th><th scope="col" className="pb-2 font-semibold">Frequency</th></tr></thead>
                  <tbody>
                    {frequency.map(([value, count]) => (
                      <tr key={value} className="border-t border-sage-200"><td className="py-1.5 tabular-nums">{f(value)}</td><td className="py-1.5 tabular-nums">{count}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody></Card>
          )}
          <div className="rounded-xl bg-sage-50 p-3 text-sm text-forest-800">
            <strong>Interpretation prompt:</strong> Which average best represents this data, and would your choice change if one very large value were added?
          </div>
        </>
      )}
      <p className="text-xs text-forest-600">Standard deviation here uses the population formula (divide by the number of values), as in school statistics. The sample data is for practice only.</p>
    </div>
  );
}
