import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { DataSummaryCalculator } from "@/components/economics-lab/data-summary-calculator";

export const metadata: Metadata = { title: "Data Summary Calculator" };

export default function DataSummaryCalculatorPage() {
  return (
    <PageShell>
      <div className="container-page py-8 sm:py-10">
        <Link href="/economics-lab" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Economics Lab
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Data Summary Calculator</h1>
        <p className="mt-2 max-w-2xl text-forest-600">Paste a list of numbers to find the mean, median, mode, spread and a frequency table.</p>
        <div className="mt-6"><DataSummaryCalculator /></div>
      </div>
    </PageShell>
  );
}
