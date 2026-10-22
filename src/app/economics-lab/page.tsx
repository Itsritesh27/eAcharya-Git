import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { EconLabHero, EconToolCards } from "@/components/economics-lab/sections";

export const metadata: Metadata = { title: "Economics Lab" };

export default function EconomicsLabPage() {
  return (
    <PageShell>
      <EconLabHero />
      <EconToolCards />
    </PageShell>
  );
}
