"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { reviewLanguageAssetAction } from "@/lib/multilingual/review-actions";
import { languageByCode } from "@/lib/multilingual/languages";

export type ReviewAsset = {
  id: string;
  contentType: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string | null;
  assetUrl: string | null;
  createdAt: string;
  sourceTitle: string;
};

export function LanguageAssetReviewList({ assets }: { assets: ReviewAsset[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function review(id: string, status: "approved" | "rejected") {
    setPendingId(id);
    setMessage(null);
    startTransition(async () => {
      const result = await reviewLanguageAssetAction({ id, status });
      setMessage(result.ok
        ? { tone: "success", text: status === "approved" ? "Asset approved and available for reuse by authorised learners." : "Asset rejected; it will not be served from the cache." }
        : { tone: "error", text: result.error });
      setPendingId(null);
      if (result.ok) window.location.reload();
    });
  }

  if (assets.length === 0) return <div className="rounded-card border border-sage-200 bg-white p-6 text-sm text-forest-600">No generated translations or audio assets are waiting for review in your courses.</div>;

  return <div className="space-y-4">
    {message && <Alert tone={message.tone}>{message.text}</Alert>}
    {assets.map((asset) => {
      const language = languageByCode(asset.targetLanguage);
      return <article key={asset.id} className="rounded-card border border-sage-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-forest-950">{asset.sourceTitle}</p>
            <p className="mt-1 text-xs text-forest-500">{asset.contentType.replaceAll("_", " ")} · {language.name} ({language.nativeName}) · {new Date(asset.createdAt).toLocaleString()}</p>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Pending review</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-sage-200 p-3"><p className="mb-1 text-xs font-bold uppercase tracking-wide text-forest-500">Original</p><p className="whitespace-pre-wrap text-sm text-forest-800">{asset.sourceText.slice(0, 1800)}{asset.sourceText.length > 1800 ? "…" : ""}</p></div>
          {asset.translatedText && <div className="rounded-xl border border-sage-200 p-3"><p className="mb-1 text-xs font-bold uppercase tracking-wide text-forest-500">Generated translation</p><p lang={language.locale} className="whitespace-pre-wrap text-sm text-forest-800">{asset.translatedText.slice(0, 1800)}{asset.translatedText.length > 1800 ? "…" : ""}</p></div>}
          {asset.assetUrl && <div className="md:col-span-2"><audio controls preload="none" src={asset.assetUrl} className="w-full" /></div>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" disabled={pending} onClick={() => review(asset.id, "approved")}><Check className="h-4 w-4" aria-hidden />{pending && pendingId === asset.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Approve"}</Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={() => review(asset.id, "rejected")}><X className="h-4 w-4" aria-hidden />Reject</Button>
        </div>
      </article>;
    })}
  </div>;
}
