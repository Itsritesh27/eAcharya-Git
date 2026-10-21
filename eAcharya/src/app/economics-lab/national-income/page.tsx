import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { NationalIncomeCalculator } from "@/components/economics-lab/national-income-calculator";

export const metadata: Metadata = { title: "National Income Calculator" };

export default function NationalIncomeCalculatorPage() {
  return (
    <PageShell>
      <div className="container-page py-8 sm:py-10">
        <Link href="/economics-lab" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Economics Lab
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">National Income Calculator</h1>
        <p className="mt-2 max-w-2xl text-forest-600">Enter expenditure components and follow each step from GDP to national income.</p>
        <div className="mt-6"><NationalIncomeCalculator /></div>
      </div>
    </PageShell>
  );
}
