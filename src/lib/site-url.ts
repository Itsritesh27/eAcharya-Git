/** Public site URL for sitemap, robots and absolute links. Falls back to Netlify's URL, then localhost. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
