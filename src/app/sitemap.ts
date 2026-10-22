import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Public, indexable pages only. Dashboards, live rooms and account pages are excluded on purpose.
const PATHS = ["/", "/courses", "/resources", "/geography-lab", "/economics-lab", "/about", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PATHS.map((path) => ({ url: `${base}${path === "/" ? "" : path}`, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7 }));
}
