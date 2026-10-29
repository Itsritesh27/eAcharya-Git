import Link from "next/link";
import { ArrowRight, BarChart3, Calculator, Coins, TrendingUp, type LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ECON_TOOLS, type EconToolId } from "@/lib/economics-lab/catalogue";

const TOOL_ICONS: Record<EconToolId, LucideIcon> = {
  "demand-supply": TrendingUp,
  "price-index": Coins,
  "national-income": Calculator,
  "data-summary": BarChart3,
};

export function EconLabHero() {
  return (
    <section className="border-b border-sage-200 bg-sage-50/70">
      <div className="container-page grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Economics Lab</h1>
          <p className="mt-4 max-w-xl text-lg text-forest-700">
            Learn Economics by doing: move demand and supply curves, build a price index, work through national
            income and summarise data, with tools matched to Classes 9 to 12.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/economics-lab/market-master" size="lg">
              <TrendingUp className="h-4 w-4" aria-hidden /> Play Market Master <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="#tools" variant="secondary" size="lg">See lab tools</ButtonLink>
            <ButtonLink href="/courses?subject=economics" variant="ghost" size="lg">Economics courses</ButtonLink>
          </div>
        </div>
        <svg viewBox="0 0 320 240" role="img" aria-label="Demand and supply curves crossing at the equilibrium point" className="mx-auto h-auto w-full max-w-xs sm:max-w-sm">
          <rect x="1" y="1" width="318" height="238" rx="16" fill="none" stroke="currentColor" className="text-sage-300" strokeWidth="2" />
          <line x1="40" y1="200" x2="290" y2="200" stroke="currentColor" className="text-forest-500" strokeWidth="2" />
          <line x1="40" y1="200" x2="40" y2="30" stroke="currentColor" className="text-forest-500" strokeWidth="2" />
          <line x1="60" y1="50" x2="270" y2="180" stroke="currentColor" className="text-brand-600" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="180" x2="270" y2="50" stroke="currentColor" className="text-forest-900" strokeWidth="4" strokeLinecap="round" />
          <circle cx="165" cy="115" r="7" fill="currentColor" className="text-amber-500" />
          <text x="272" y="196" fontSize="12" fill="currentColor" className="text-forest-700">Quantity</text>
          <text x="46" y="30" fontSize="12" fill="currentColor" className="text-forest-700">Price</text>
          <text x="225" y="176" fontSize="12" fill="currentColor" className="text-brand-700">Demand</text>
          <text x="225" y="62" fontSize="12" fill="currentColor" className="text-forest-900">Supply</text>
        </svg>
      </div>
    </section>
  );
}

export function EconToolCards() {
  return (
    <section id="tools" aria-labelledby="econ-tools-h" className="container-page scroll-mt-20 py-12">
      <h2 id="econ-tools-h" className="text-2xl font-extrabold sm:text-3xl">Lab tools</h2>
      <p className="mt-1 max-w-3xl text-forest-600">
        Each tool works on the numbers you enter, so you can test an idea and see the result straight away. Example values
        are for practice and are not official statistics; use a dated official source whenever you work with real data.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ECON_TOOLS.map((tool) => {
          const Icon = TOOL_ICONS[tool.id];
          return (
            <li key={tool.id}>
              <Link
                href={tool.href}
                className="block h-full rounded-card border border-sage-200 bg-white p-5 shadow-card transition hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 font-bold text-forest-950">{tool.title}</h3>
                <p className="mt-1 text-sm text-forest-600">{tool.description}</p>
                <p className="mt-2 text-xs font-semibold text-forest-700">{tool.classes}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  Open <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
