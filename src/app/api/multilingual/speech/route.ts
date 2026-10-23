import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isScheduledLanguage } from "@/lib/multilingual/languages";
import { parseTimedSubtitles, timedSubtitlesPlainText } from "@/lib/multilingual/subtitles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  targetLanguage: z.string().refine(isScheduledLanguage),
  lessonId: z.string().uuid().optional(),
  resourceId: z.string().uuid().optional(),
  sourceText: z.string().trim().min(1).max(30000).optional(),
}).refine((value) => Boolean(value.lessonId || value.resourceId), { message: "Choose a lesson or resource." })
  .refine((value) => !(value.lessonId && value.resourceId), { message: "Choose a lesson or a resource, not both." });

type AudioAssetRow = { asset_url: string | null; status: string };

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to generate an audio track." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the audio request." }, { status: 400 });

  const { targetLanguage, lessonId, resourceId } = parsed.data;
  let sourceText = "";
  let translationContentType = "lesson_transcript";
  let isTimedSubtitleSource = false;
  if (lessonId) {
    const { data, error } = await supabase.from("lesson_content").select("transcript").eq("lesson_id", lessonId).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "This lesson content is unavailable. Check course access and enrollment." }, { status: 403 });
    sourceText = typeof data.transcript === "string" ? data.transcript.trim() : "";
    if (parseTimedSubtitles(sourceText)) {
      translationContentType = "subtitles";
      isTimedSubtitleSource = true;
    }
  } else if (resourceId) {
    const { data, error } = await supabase.from("resources").select("body, resource_type").eq("id", resourceId).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "This learning resource is unavailable. Check course access." }, { status: 403 });
    sourceText = data.resource_type === "pdf"
      ? (parsed.data.sourceText ?? (typeof data.body === "string" ? data.body : "")).trim()
      : (typeof data.body === "string" ? data.body.trim() : "");
    translationContentType = data.resource_type === "pdf" ? "pdf_text" : "resource_notes";
  }
  if (!sourceText) return NextResponse.json({ error: "No source text is available for audio generation." }, { status: 422 });
  if (sourceText.length > 30000) return NextResponse.json({ error: "Audio tracks can be generated from up to 30,000 characters at a time." }, { status: 413 });

  const sourceHash = createHash("sha256").update(sourceText, "utf8").digest("hex");
  const contentType = "dubbed_audio";
  let query = supabase.from("learning_language_assets").select("asset_url, status")
    .eq("content_type", contentType).eq("target_language", targetLanguage).eq("source_hash", sourceHash)
    .neq("status", "rejected");
  query = lessonId ? query.eq("lesson_id", lessonId) : query.eq("resource_id", resourceId!);
  const { data: cached } = await query.maybeSingle();
  const cachedRow = cached as AudioAssetRow | null;
  if (cachedRow?.asset_url) return NextResponse.json({ audioUrl: cachedRow.asset_url, cached: true, reviewStatus: cachedRow.status, targetLanguage });

  // Only synthesize text that has already been translated and cached for this exact source text.
  let translationQuery = supabase.from("learning_language_assets").select("translated_text")
    .eq("target_language", targetLanguage).eq("source_hash", sourceHash)
    .eq("content_type", translationContentType)
    .neq("status", "rejected");
  translationQuery = lessonId ? translationQuery.eq("lesson_id", lessonId) : translationQuery.eq("resource_id", resourceId!);
  const { data: translation } = await translationQuery.maybeSingle();
  const savedTranslation = (translation as { translated_text?: string | null } | null)?.translated_text;
  if (!savedTranslation) return NextResponse.json({ error: "Translate this content first. Audio is generated from the saved translation." }, { status: 422 });
  const translatedText = isTimedSubtitleSource ? timedSubtitlesPlainText(savedTranslation) : savedTranslation;

  const configuredEndpoint = process.env.EACHARYA_SPEECH_SERVICE_URL?.trim();
  if (!configuredEndpoint) {
    return NextResponse.json({ error: "AI audio-track generation is not configured yet. Browser voice playback is available as a fallback; set EACHARYA_SPEECH_SERVICE_URL for a self-hosted speech/TTS service." , code: "SPEECH_UNAVAILABLE" }, { status: 503 });
  }

  // A speech model needs far longer than the request limit for a full lesson; fail fast with guidance.
  if (translatedText.length > 6000) {
    return NextResponse.json({ error: "This transcript is too long to generate as one audio track. Use the Play button for browser voice playback instead.", code: "AUDIO_TOO_LONG" }, { status: 413 });
  }

  let endpoint: URL;
  try {
    endpoint = new URL(configuredEndpoint);
    if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost" && endpoint.hostname !== "127.0.0.1") {
      return NextResponse.json({ error: "EACHARYA_SPEECH_SERVICE_URL must use HTTPS except for local development." }, { status: 500 });
    }
    if (!endpoint.pathname.replace(/\/$/, "").endsWith("/synthesize")) endpoint.pathname = `${endpoint.pathname.replace(/\/$/, "")}/synthesize`;
  } catch {
    return NextResponse.json({ error: "EACHARYA_SPEECH_SERVICE_URL is not a valid URL." }, { status: 500 });
  }

  try {
    const serviceResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", ...(process.env.EACHARYA_SPEECH_SERVICE_TOKEN ? { authorization: `Bearer ${process.env.EACHARYA_SPEECH_SERVICE_TOKEN}` } : {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(55000),
      body: JSON.stringify({ text: translatedText, language: targetLanguage, task: "lesson_audio_track", output: "audio_url" }),
    });
    const payload: unknown = await serviceResponse.json().catch(() => null);
    const audioUrlRaw = payload && typeof payload === "object" && "audio_url" in payload ? (payload as { audio_url?: unknown }).audio_url : null;
    if (!serviceResponse.ok || typeof audioUrlRaw !== "string") {
      return NextResponse.json({ error: "The speech service could not generate an audio track for this language. Check model support in the configured service." }, { status: 422 });
    }
    let audioUrl: URL;
    try { audioUrl = new URL(audioUrlRaw); } catch { return NextResponse.json({ error: "The speech service returned an invalid audio URL." }, { status: 502 }); }
    if (audioUrl.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(audioUrl.hostname)) return NextResponse.json({ error: "The speech service must return an HTTPS audio URL." }, { status: 502 });

    const insertPayload = {
      lesson_id: lessonId ?? null,
      resource_id: resourceId ?? null,
      content_type: contentType,
      target_language: targetLanguage,
      source_hash: sourceHash,
      source_text: sourceText,
      asset_url: audioUrl.toString(),
      created_by: user.id,
    };
    const { data: inserted, error: insertError } = await supabase.from("learning_language_assets").insert(insertPayload).select("asset_url, status").maybeSingle();
    if (!insertError && inserted) {
      const row = inserted as AudioAssetRow;
      return NextResponse.json({ audioUrl: row.asset_url, cached: false, reviewStatus: row.status, targetLanguage });
    }
    // Concurrent request: use the cached row if it now exists.
    let retryQuery = supabase.from("learning_language_assets").select("asset_url, status")
      .eq("content_type", contentType).eq("target_language", targetLanguage).eq("source_hash", sourceHash).neq("status", "rejected");
    retryQuery = lessonId ? retryQuery.eq("lesson_id", lessonId) : retryQuery.eq("resource_id", resourceId!);
    const { data: retry } = await retryQuery.maybeSingle();
    const retryRow = retry as AudioAssetRow | null;
    if (retryRow?.asset_url) return NextResponse.json({ audioUrl: retryRow.asset_url, cached: true, reviewStatus: retryRow.status, targetLanguage });
    return NextResponse.json({ error: insertError?.code === "42P01" || insertError?.code === "PGRST205" ? "Apply the multilingual Supabase migration before saving audio assets." : "Audio was generated but its reusable asset record could not be saved." }, { status: 500 });
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json({ error: timeout ? "Audio generation took too long. Use the Play button for instant browser voice playback instead." : "The speech service could not be reached. Check its URL and availability." }, { status: 502 });
  }
}
