import { FALLBACK_TRANSLATION_CODES } from "@/lib/multilingual/languages";

/** Resolves the configured LibreTranslate-compatible base URL, or null if unset/invalid. */
export function translationBaseUrl(): URL | null {
  const endpoint = process.env.LIBRETRANSLATE_URL?.trim();
  if (!endpoint) return null;
  try {
    const url = new URL(endpoint);
    url.pathname = url.pathname.replace(/\/$/, "").replace(/\/translate$/, "");
    return url;
  } catch { return null; }
}

type Cache = { codes: string[]; source: "server" | "fallback"; at: number };
let cache: Cache | null = null;
const TTL_MS = 10 * 60 * 1000;

/**
 * Language codes the configured translation server can translate into.
 * Reads the server's /languages endpoint (LibreTranslate-compatible) and caches it for 10 minutes.
 * Falls back to a conservative static list if the server cannot be reached.
 */
/** Indian languages Azure Translator can translate into. */
const AZURE_TRANSLATOR_CODES = ["as", "bn", "brx", "doi", "gu", "hi", "kn", "ks", "kok", "mai", "ml", "mni", "mr", "ne", "or", "pa", "sd", "ta", "te", "ur"];

export async function supportedTranslationCodes(): Promise<{ codes: string[]; source: "server" | "fallback" }> {
  if (process.env.AZURE_TRANSLATOR_KEY?.trim()) return { codes: AZURE_TRANSLATOR_CODES, source: "server" };
  if (cache && Date.now() - cache.at < TTL_MS) return cache;
  const base = translationBaseUrl();
  if (base) {
    try {
      const url = new URL(base);
      url.pathname = `${url.pathname.replace(/\/$/, "")}/languages`;
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
      const payload: unknown = await res.json();
      if (res.ok && Array.isArray(payload)) {
        const codes = payload
          .map((item) => (item && typeof item === "object" && "code" in item ? String((item as { code: unknown }).code) : ""))
          .filter(Boolean);
        if (codes.length) {
          cache = { codes, source: "server", at: Date.now() };
          return cache;
        }
      }
    } catch { /* fall through to the static list */ }
  }
  // Do not cache the fallback for long, so a recovered server is picked up quickly.
  return { codes: [...FALLBACK_TRANSLATION_CODES], source: "fallback" };
}
