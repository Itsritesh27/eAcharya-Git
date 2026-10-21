/**
 * Economics Lab catalogue. Every entry links to a route that exists.
 * All tools run in the browser on values the student types in; nothing is written to the database.
 */
export type EconToolId = "demand-supply" | "price-index" | "national-income" | "data-summary";

export interface EconTool {
  id: EconToolId;
  title: string;
  description: string;
  href: string;
  /** Classes whose NCERT Economics books use this idea. */
  classes: string;
}

export const ECON_TOOLS: readonly EconTool[] = [
  {
    id: "demand-supply",
    title: "Demand and Supply Explorer",
    description: "Change demand and supply, find the equilibrium, shift the curves and test price ceilings and floors.",
    href: "/economics-lab/demand-supply",
    classes: "Class 12 · Microeconomics",
  },
  {
    id: "price-index",
    title: "Price Index and Inflation Calculator",
    description: "Build a basket, compute a weighted price index, then work out inflation and real values.",
    href: "/economics-lab/price-index",
    classes: "Class 11 · Statistics for Economics",
  },
  {
    id: "national-income",
    title: "National Income Calculator",
    description: "Enter expenditure components and see GDP, GNP, NDP and national income, step by step.",
    href: "/economics-lab/national-income",
    classes: "Class 12 · Macroeconomics",
  },
  {
    id: "data-summary",
    title: "Data Summary Calculator",
    description: "Paste a list of numbers and get the mean, median, mode, range and standard deviation.",
    href: "/economics-lab/data-summary",
    classes: "Class 11 · Statistics for Economics",
  },
];
