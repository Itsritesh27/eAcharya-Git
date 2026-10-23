"use client";

import { useEffect, useState } from "react";
import { languagesFor, type ScheduledLanguage } from "@/lib/multilingual/languages";

let loaded: string[] | null = null;
let inflight: Promise<string[] | null> | null = null;

function load(): Promise<string[] | null> {
  if (loaded) return Promise.resolve(loaded);
  inflight ??= fetch("/api/multilingual/languages", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { codes?: unknown; source?: string } | null) => {
      if (data && Array.isArray(data.codes) && data.codes.length) {
        // Only remember a real answer from the server; a fallback may be retried later.
        if (data.source === "server") loaded = data.codes as string[];
        return data.codes as string[];
      }
      return null;
    })
    .catch(() => null)
    .finally(() => { inflight = null; });
  return inflight;
}

/** Languages the configured translation service can actually translate into. */
export function useSupportedLanguages(): ScheduledLanguage[] {
  const [codes, setCodes] = useState<string[] | undefined>(loaded ?? undefined);
  useEffect(() => {
    let active = true;
    void load().then((result) => { if (active && result) setCodes(result); });
    return () => { active = false; };
  }, []);
  return languagesFor(codes);
}
