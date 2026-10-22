import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LANGUAGE_PREFERENCES, isScheduledLanguage, type LanguagePreferences } from "@/lib/multilingual/languages";

export async function getLanguagePreferences(userId: string): Promise<LanguagePreferences> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("student_language_preferences")
      .select("content_language, subtitle_language, audio_language")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return DEFAULT_LANGUAGE_PREFERENCES;
    return {
      contentLanguage: isScheduledLanguage(data.content_language) ? data.content_language : DEFAULT_LANGUAGE_PREFERENCES.contentLanguage,
      subtitleLanguage: isScheduledLanguage(data.subtitle_language) ? data.subtitle_language : DEFAULT_LANGUAGE_PREFERENCES.subtitleLanguage,
      audioLanguage: isScheduledLanguage(data.audio_language) ? data.audio_language : DEFAULT_LANGUAGE_PREFERENCES.audioLanguage,
    };
  } catch {
    // Keeps profile and lesson pages usable before the optional migration is applied.
    return DEFAULT_LANGUAGE_PREFERENCES;
  }
}
