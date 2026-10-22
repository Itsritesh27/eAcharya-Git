import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { DemandSupplyExplorer } from "@/components/economics-lab/demand-supply-explorer";

export const metadata: Metadata = { title: "Demand and Supply Explorer" };

export default function DemandSupplyExplorerPage() {
  return (
    <PageShell>
      <div className="container-page py-8 sm:py-10">
        <Link href="/economics-lab" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Economics Lab
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Demand and Supply Explorer</h1>
        <p className="mt-2 max-w-2xl text-forest-600">Set demand and supply, find the equilibrium, shift a curve and see what a price ceiling or floor does.</p>
        <div className="mt-6"><DemandSupplyExplorer /></div>
      </div>
    </PageShell>
  );
}
