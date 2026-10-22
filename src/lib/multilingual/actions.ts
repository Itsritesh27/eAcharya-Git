"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isScheduledLanguage } from "@/lib/multilingual/languages";

const languageSchema = z.string().refine(isScheduledLanguage, "Choose one of the 22 Scheduled Languages.");

export async function saveLanguagePreferencesAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = z.object({
    contentLanguage: languageSchema,
    subtitleLanguage: languageSchema,
    audioLanguage: languageSchema,
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Choose valid language preferences." };
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured, so language preferences could not be saved." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to save your language preferences." };

  const { error } = await supabase.from("student_language_preferences").upsert({
    user_id: user.id,
    content_language: parsed.data.contentLanguage,
    subtitle_language: parsed.data.subtitleLanguage,
    audio_language: parsed.data.audioLanguage,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return { ok: false, error: "Language preferences need the latest Supabase migration. Apply the multilingual migration from the project ZIP." };
    }
    return { ok: false, error: "Language preferences could not be saved. Please try again." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/tutorials", "page");
  return { ok: true };
}
