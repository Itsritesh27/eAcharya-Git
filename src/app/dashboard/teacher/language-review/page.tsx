import type { Metadata } from "next";
import { Languages } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LanguageAssetReviewList, type ReviewAsset } from "@/components/multilingual/language-asset-review-list";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Multilingual Content Review" };
export const dynamic = "force-dynamic";

type AssetRow = { id: string; lesson_id: string | null; resource_id: string | null; content_type: string; target_language: string; source_text: string; translated_text: string | null; asset_url: string | null; created_at: string };

export default async function LanguageReviewPage() {
  const session = await requireRole("teacher");
  const supabase = await createClient();
  const { data, error } = await supabase.from("learning_language_assets")
    .select("id, lesson_id, resource_id, content_type, target_language, source_text, translated_text, asset_url, created_at")
    .eq("status", "pending").order("created_at", { ascending: false }).limit(100);

  if (error?.code === "42P01" || error?.code === "PGRST205") {
    return <DashboardShell session={session}><h1 className="text-2xl font-extrabold sm:text-3xl">Multilingual content review</h1><p className="mt-2 text-sm text-forest-600">Apply the multilingual Supabase migration included in this project ZIP to enable content review.</p></DashboardShell>;
  }

  const rows = (data ?? []) as AssetRow[];
  const lessonIds = [...new Set(rows.map((row) => row.lesson_id).filter((id): id is string => Boolean(id)))];
  const resourceIds = [...new Set(rows.map((row) => row.resource_id).filter((id): id is string => Boolean(id)))];
  const [lessonsRes, resourcesRes] = await Promise.all([
    lessonIds.length ? supabase.from("lessons").select("id, title").in("id", lessonIds) : Promise.resolve({ data: [] }),
    resourceIds.length ? supabase.from("resources").select("id, title").in("id", resourceIds) : Promise.resolve({ data: [] }),
  ]);
  const titles = new Map<string, string>();
  for (const row of lessonsRes.data ?? []) titles.set((row as { id: string; title: string }).id, (row as { id: string; title: string }).title);
  for (const row of resourcesRes.data ?? []) titles.set((row as { id: string; title: string }).id, (row as { id: string; title: string }).title);

  const assets: ReviewAsset[] = rows.map((row) => ({
    id: row.id,
    contentType: row.content_type,
    targetLanguage: row.target_language,
    sourceText: row.source_text,
    translatedText: row.translated_text,
    assetUrl: row.asset_url,
    createdAt: row.created_at,
    sourceTitle: (row.lesson_id && titles.get(row.lesson_id)) || (row.resource_id && titles.get(row.resource_id)) || "Learning material",
  }));

  return <DashboardShell session={session}>
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><Languages className="h-5 w-5" aria-hidden /></span>
      <div><h1 className="text-2xl font-extrabold sm:text-3xl">Multilingual content review</h1><p className="mt-1 max-w-2xl text-sm text-forest-600">Review machine-generated translations and audio before they become reusable shared assets. Only assets connected to content you own are editable.</p></div>
    </div>
    <div className="mt-6"><LanguageAssetReviewList assets={assets} /></div>
  </DashboardShell>;
}
