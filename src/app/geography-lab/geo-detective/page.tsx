import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { GeoDetectiveGame } from "@/components/learning-games/geo-detective-game";

export const metadata: Metadata = {
  title: "Geo Detective | Geography Lab",
  description: "Solve India geography mysteries on a state-boundary map, including physical features, population distribution, density, migration and urbanisation.",
};

export default function GeoDetectivePage() {
  return <PageShell><GeoDetectiveGame /></PageShell>;
}
