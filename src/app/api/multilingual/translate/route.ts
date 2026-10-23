import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isScheduledLanguage, languageByCode } from "@/lib/multilingual/languages";
import { supportedTranslationCodes } from "@/lib/multilingual/translation-server";
import { parseTimedSubtitles, timedSubtitlesPlainText, timedSubtitlesToVtt, type SubtitleCue } from "@/lib/multilingual/subtitles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const requestSchema = z.object({
  targetLanguage: z.string().refine(isScheduledLanguage),
  lessonId: z.string().uuid().optional(),
  resourceId: z.string().uuid().optional(),
  // PDF text may be supplied after the student extracts/selects it. For published resource
  // content the resource ID is still verified with RLS before any generated output is cached.
  sourceText: z.string().trim().min(1).max(30000).optional(),
  // Chunked mode: the browser asks for one small part at a time so no single request runs long.
  part: z.number().int().min(0).max(500).optional(),
}).refine((value) => Boolean(value.lessonId || value.resourceId || value.sourceText), {
  message: "Select lesson content, a resource, or provide text to translate.",
});

type TranslationRow = { translated_text: string | null; status: string; asset_url: string | null };

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to translate learning material." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the translation request." }, { status: 400 });
  if (parsed.data.lessonId && parsed.data.resourceId) {
    return NextResponse.json({ error: "Choose a lesson or a resource, not both." }, { status: 400 });
  }

  const targetLanguage = parsed.data.targetLanguage;
  let sourceText = parsed.data.sourceText?.trim() ?? "";
  let contentType: "lesson_transcript" | "resource_notes" | "pdf_text" | "subtitles" = "subtitles";
  let lessonId: string | null = null;
  let resourceId: string | null = null;

  if (parsed.data.lessonId) {
    lessonId = parsed.data.lessonId;
    const { data, error } = await supabase.from("lesson_content").select("transcript").eq("lesson_id", lessonId).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "This lesson content is unavailable. Check course access and enrollment." }, { status: 403 });
    sourceText = typeof data.transcript === "string" ? data.transcript.trim() : "";
    contentType = "lesson_transcript";
    if (!sourceText) return NextResponse.json({ error: "The teacher has not added a transcript for this lesson yet. A transcript is required before it can be translated or narrated." }, { status: 422 });
    if (parseTimedSubtitles(sourceText)) contentType = "subtitles";
  } else if (parsed.data.resourceId) {
    resourceId = parsed.data.resourceId;
    const { data, error } = await supabase.from("resources").select("id, resource_type, body").eq("id", resourceId).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "This learning resource is unavailable. Check course access." }, { status: 403 });
    if (data.resource_type === "notes" && typeof data.body === "string" && data.body.trim()) {
      sourceText = data.body.trim();
      contentType = "resource_notes";
    } else if (data.resource_type === "pdf") {
      contentType = "pdf_text";
      if (!sourceText) return NextResponse.json({ error: "This PDF does not expose selectable text to eAcharya yet. Copy the relevant text from the PDF and paste it into the text box to translate it." }, { status: 422 });
    } else if (!sourceText) {
      return NextResponse.json({ error: "This resource does not contain translatable text. Add text or use a text-based notes resource." }, { status: 422 });
    }
  }

  if (!sourceText) return NextResponse.json({ error: "There is no text to translate." }, { status: 422 });
  if (sourceText.length > 30000) return NextResponse.json({ error: "Translate up to 30,000 characters at a time." }, { status: 413 });

  const sourceHash = createHash("sha256").update(sourceText, "utf8").digest("hex");
  const canCache = Boolean(lessonId || resourceId);
  if (canCache) {
    let cacheQuery = supabase.from("learning_language_assets").select("translated_text, status, asset_url")
      .eq("content_type", contentType).eq("target_language", targetLanguage).eq("source_hash", sourceHash)
      .neq("status", "rejected");
    cacheQuery = lessonId ? cacheQuery.eq("lesson_id", lessonId) : cacheQuery.eq("resource_id", resourceId!);
    const { data: cached } = await cacheQuery.maybeSingle();
    const cachedRow = cached as TranslationRow | null;
    if (cachedRow?.translated_text) {
      return translationResponse(cachedRow.translated_text, contentType, true, cachedRow.status, targetLanguage);
    }
  }

  const azureKey = process.env.AZURE_TRANSLATOR_KEY?.trim();
  const azureRegion = process.env.AZURE_TRANSLATOR_REGION?.trim();
  const endpoint = process.env.LIBRETRANSLATE_URL?.trim();
  if (!azureKey && !endpoint) {
    return NextResponse.json({
      error: "Translation is not configured yet. Set AZURE_TRANSLATOR_KEY (recommended) or LIBRETRANSLATE_URL to a trusted LibreTranslate-compatible endpoint (preferably a self-hosted instance).",
      code: "TRANSLATION_UNAVAILABLE",
      targetLanguage,
    }, { status: 503 });
  }

  const { codes: supportedCodes, source: supportSource } = await supportedTranslationCodes();
  if (supportSource === "server" && !supportedCodes.includes(targetLanguage)) {
    return NextResponse.json({
      error: `${languageByCode(targetLanguage).name} is not supported by the translation service. Please choose another language.`,
      code: "LANGUAGE_UNSUPPORTED",
    }, { status: 422 });
  }

  let translateUrl: URL = new URL("http://unused.invalid");
  if (!azureKey) try {
    translateUrl = new URL(endpoint!);
    if (translateUrl.protocol !== "https:" && translateUrl.hostname !== "localhost" && translateUrl.hostname !== "127.0.0.1") {
      return NextResponse.json({ error: "LIBRETRANSLATE_URL must use HTTPS except for local development." }, { status: 500 });
    }
    if (!translateUrl.pathname.replace(/\/$/, "").endsWith("/translate")) {
      translateUrl.pathname = `${translateUrl.pathname.replace(/\/$/, "")}/translate`;
    }
  } catch {
    return NextResponse.json({ error: "LIBRETRANSLATE_URL is not a valid URL." }, { status: 500 });
  }

  try {
    const translateText = async (text: string): Promise<string> => {
      try { return await translateOnce(text); } catch (error) {
        // One retry for a slow/overloaded service; a rejected language pair fails immediately.
        if (error instanceof Error && error.name === "TimeoutError") return translateOnce(text);
        throw error;
      }
    };
    const translateOnce = async (text: string): Promise<string> => {
      const apiKey = process.env.LIBRETRANSLATE_API_KEY?.trim();
      const translateResponse = await fetch(translateUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(Number(process.env.TRANSLATION_TIMEOUT_MS) || 30000),
        body: JSON.stringify({
          q: text,
          source: "auto",
          target: targetLanguage,
          format: "text",
          ...(apiKey ? { api_key: apiKey } : {}),
        }),
      });
      const payload: unknown = await translateResponse.json().catch(() => null);
      const translated = payload && typeof payload === "object" && "translatedText" in payload
        ? (payload as { translatedText?: unknown }).translatedText
        : null;
      if (!translateResponse.ok || typeof translated !== "string" || !translated.trim()) {
        const providerMessage = payload && typeof payload === "object" && "error" in payload && typeof (payload as { error?: unknown }).error === "string"
          ? (payload as { error: string }).error
          : "The translation service rejected this language pair or text.";
        throw new Error(providerMessage);
      }
      return translated;
    };

    // Azure Translator takes many texts per request, so a whole lesson is a handful of fast calls.
    const azureBatch = async (texts: string[]): Promise<string[]> => {
      const res = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${encodeURIComponent(targetLanguage)}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Ocp-Apim-Subscription-Key": azureKey!,
          ...(azureRegion ? { "Ocp-Apim-Subscription-Region": azureRegion } : {}),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify(texts.map((Text) => ({ Text }))),
      });
      const payload: unknown = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(payload) || payload.length !== texts.length) {
        const message = payload && typeof payload === "object" && "error" in payload ? String((payload as { error?: { message?: unknown } }).error?.message ?? "") : "";
        throw new Error(message || "The translation service rejected this language or text.");
      }
      return payload.map((item: { translations?: { text?: string }[] }, i) => item?.translations?.[0]?.text || texts[i]!);
    };
    const translateMany = async (texts: string[]): Promise<string[]> => {
      if (azureKey) {
        const groups: string[][] = [];
        for (let i = 0; i < texts.length; i += 25) groups.push(texts.slice(i, i + 25));
        return (await Promise.all(groups.map(azureBatch))).flat();
      }
      // Send several texts per request; the server translates them together in one pass.
      const perRequest = Number(process.env.TRANSLATION_BATCH_ITEMS) || 8;
      const groups: string[][] = [];
      for (let i = 0; i < texts.length; i += perRequest) groups.push(texts.slice(i, i + perRequest));
      const outGroups: string[][] = new Array(groups.length);
      let nextGroup = 0;
      await Promise.all(Array.from({ length: Math.min(2, groups.length) }, async () => {
        while (nextGroup < groups.length) { const g = nextGroup++; outGroups[g] = await libreBatch(groups[g]!); }
      }));
      return outGroups.flat();
    };
    const libreBatch = async (texts: string[]): Promise<string[]> => {
      const once = async (): Promise<string[]> => {
        const apiKey = process.env.LIBRETRANSLATE_API_KEY?.trim();
        const res = await fetch(translateUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(Number(process.env.TRANSLATION_TIMEOUT_MS) || 30000),
          body: JSON.stringify({ q: texts, source: "auto", target: targetLanguage, format: "text", ...(apiKey ? { api_key: apiKey } : {}) }),
        });
        const payload: unknown = await res.json().catch(() => null);
        const t = payload && typeof payload === "object" && "translatedText" in payload ? (payload as { translatedText?: unknown }).translatedText : null;
        const list = Array.isArray(t) ? t : typeof t === "string" && texts.length === 1 ? [t] : null;
        if (!res.ok || !list || list.length !== texts.length || list.some((x) => typeof x !== "string")) {
          const msg = payload && typeof payload === "object" && "error" in payload && typeof (payload as { error?: unknown }).error === "string" ? (payload as { error: string }).error : "The translation service rejected this language pair or text.";
          throw new Error(payload ? msg : `${msg} (HTTP ${res.status} from the translation server; check its logs)`);
        }
        return list as string[];
      };
      try { return await once(); } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") return once();
        throw error;
      }
    };

    // Chunked mode: translate only one small part and let the browser ask for the next one.
    if (parsed.data.part !== undefined) {
      const part = parsed.data.part;
      let units: string[];
      let perPart: number;
      if (contentType === "subtitles") {
        const timed = parseTimedSubtitles(sourceText);
        if (!timed) return NextResponse.json({ error: "The saved subtitle file is not valid WebVTT/SRT text." }, { status: 422 });
        units = timed.cues.map((cue) => cue.text.join("\n"));
        perPart = Number(process.env.TRANSLATION_CUES_PER_PART) || 4;
      } else {
        units = splitForTranslation(sourceText, Number(process.env.TRANSLATION_CHUNK_CHARS) || 400);
        perPart = Number(process.env.TRANSLATION_PIECES_PER_PART) || 6;
      }
      const totalParts = Math.max(1, Math.ceil(units.length / perPart));
      if (part >= totalParts) return NextResponse.json({ error: "That part does not exist." }, { status: 400 });
      const translations = await translateMany(units.slice(part * perPart, (part + 1) * perPart));
      return NextResponse.json({ part, totalParts, translations, timedSubtitles: contentType === "subtitles", targetLanguage });
    }

    let translatedText: string;
    if (contentType === "subtitles") {
      const parsedSubtitles = parseTimedSubtitles(sourceText);
      if (!parsedSubtitles) return NextResponse.json({ error: "The saved subtitle file is not valid WebVTT/SRT text." }, { status: 422 });
      if (parsedSubtitles.cues.length > 60) return NextResponse.json({ error: "This caption file has more than 60 cues. Split the caption file into shorter sections to preserve cue timings reliably." }, { status: 413 });
      const translations = await translateMany(parsedSubtitles.cues.map((cue) => cue.text.join("\n")));
      const translatedCues: SubtitleCue[] = parsedSubtitles.cues.map((cue, index) => ({ prefix: cue.prefix, text: [translations[index] ?? cue.text.join("\n")] }));
      translatedText = timedSubtitlesToVtt({ header: parsedSubtitles.header, cues: translatedCues });
    } else {
      // Long transcripts are translated in small pieces so no single request times out.
      const pieces = splitForTranslation(sourceText, Number(process.env.TRANSLATION_CHUNK_CHARS) || 800);
      const results = await translateMany(pieces);
      translatedText = results.join("\n\n");
    }

    let reviewStatus = "not-cached";
    if (canCache) {
      const { data: inserted, error: insertError } = await supabase.from("learning_language_assets").insert({
        lesson_id: lessonId,
        resource_id: resourceId,
        content_type: contentType,
        target_language: targetLanguage,
        source_hash: sourceHash,
        source_text: sourceText,
        translated_text: translatedText,
        created_by: user.id,
      }).select("status").maybeSingle();
      if (!insertError && inserted) reviewStatus = (inserted as { status: string }).status;
      else {
        // A concurrent request may have created the same unique cache row. Re-read that row.
        let concurrentQuery = supabase.from("learning_language_assets").select("translated_text, status")
          .eq("content_type", contentType).eq("target_language", targetLanguage).eq("source_hash", sourceHash)
          .neq("status", "rejected");
        concurrentQuery = lessonId ? concurrentQuery.eq("lesson_id", lessonId) : concurrentQuery.eq("resource_id", resourceId!);
        const { data: concurrent } = await concurrentQuery.maybeSingle();
        const concurrentRow = concurrent as { translated_text: string | null; status: string } | null;
        if (concurrentRow?.translated_text) {
          return translationResponse(concurrentRow.translated_text, contentType, true, concurrentRow.status, targetLanguage);
        }
      }
    }

    return translationResponse(translatedText, contentType, false, reviewStatus, targetLanguage);
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    let message = error instanceof Error ? error.message : "The translation service could not be reached.";
    if (message === "fetch failed") message = `Cannot reach the translation server at ${azureKey ? "Azure" : translateUrl.origin}. Make sure it is running (try 127.0.0.1 instead of localhost in LIBRETRANSLATE_URL).`;
    return NextResponse.json({
      error: timeout ? "The translation service took too long. Please try again." : `Translation unavailable for this language or content: ${message}`,
      code: "LANGUAGE_UNAVAILABLE",
    }, { status: 422 });
  }
}

function translationResponse(translatedText: string, contentType: string, cached: boolean, reviewStatus: string, targetLanguage: string) {
  if (contentType === "subtitles") {
    return NextResponse.json({
      translatedText: timedSubtitlesPlainText(translatedText),
      translatedVtt: translatedText,
      timedSubtitles: true,
      cached,
      reviewStatus,
      targetLanguage,
    });
  }
  return NextResponse.json({ translatedText, timedSubtitles: false, cached, reviewStatus, targetLanguage });
}

/** Splits text into chunks of at most `max` characters, preferring paragraph then sentence boundaries. */
function splitForTranslation(text: string, max: number): string[] {
  const units: string[] = [];
  for (const paragraph of text.split(/\n{2,}/)) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    if (trimmed.length <= max) { units.push(trimmed); continue; }
    for (const sentence of trimmed.split(/(?<=[.!?\u0964\u0965])\s+/)) {
      let rest = sentence.trim();
      while (rest.length > max) { units.push(rest.slice(0, max)); rest = rest.slice(max); }
      if (rest) units.push(rest);
    }
  }
  const chunks: string[] = [];
  let current = "";
  for (const unit of units) {
    if (current && current.length + unit.length + 1 > max) { chunks.push(current); current = unit; }
    else current = current ? `${current} ${unit}` : unit;
  }
  if (current) chunks.push(current);
  return chunks;
}