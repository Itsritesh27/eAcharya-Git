/**
 * Small fixed-window limiter, keyed by any string (e.g. "download:<user id>").
 *
 * IMPORTANT: state lives in this server instance's memory. On serverless hosting (Netlify) each instance counts
 * separately and counters reset on cold starts, so this only blunts a single client hammering one endpoint.
 * For a hard limit across all instances use a shared store (Upstash Redis, Netlify Blobs, or a Supabase table).
 */
const hits = new Map<string, { count: number; resetAt: number }>();

/** Returns true if the call is allowed, false once `limit` calls were made inside `windowMs`. */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
