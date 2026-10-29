import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { MarketMasterGame } from "@/components/learning-games/market-master-game";

export const metadata: Metadata = {
  title: "Market Master | Economics Lab",
  description: "Negotiate a market trade, manage budgets and costs, and explore supply, demand, and equilibrium.",
};

export default function MarketMasterPage() {
  return <PageShell><MarketMasterGame /></PageShell>;
}
