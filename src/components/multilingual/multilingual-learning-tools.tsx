"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, Captions, Languages, Loader2, Pause, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { SCHEDULED_LANGUAGES, languageByCode, type ScheduledLanguageCode } from "@/lib/multilingual/languages";
import { parseTimedSubtitles, timedSubtitlesPlainText, timedSubtitlesToVtt } from "@/lib/multilingual/subtitles";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type SourceKind = "lesson" | "resource";
type TranslationResponse = { translatedText: string; translatedVtt?: string; timedSubtitles?: boolean; cached: boolean; reviewStatus: string; targetLanguage: string };
type AudioResponse = { audioUrl: string; cached: boolean; reviewStatus: string; targetLanguage: string };

export function MultilingualLearningTools({
  sourceKind,
  lessonId,
  resourceId,
  title,
  initialLanguage = "hi",
  initialAudioLanguage = "hi",
  sourceText = "",
  resourceType,
  hasTranscript = true,
  onSubtitleTrackUrl,
}: {
  sourceKind: SourceKind;
  lessonId?: string;
  resourceId?: string;
  title: string;
  initialLanguage?: ScheduledLanguageCode;
  initialAudioLanguage?: ScheduledLanguageCode;
  sourceText?: string;
  resourceType?: string;
  hasTranscript?: boolean;
  onSubtitleTrackUrl?: (url: string | null, targetLanguage: string) => void;
}) {
  const [targetLanguage, setTargetLanguage] = useState<ScheduledLanguageCode>(initialLanguage);
  const [audioLanguage, setAudioLanguage] = useState<ScheduledLanguageCode>(initialAudioLanguage);
  const [audioTranslation, setAudioTranslation] = useState<{ language: ScheduledLanguageCode; text: string } | null>(null);
  const [translatedText, setTranslatedText] = useState("");
  const [translationInfo, setTranslationInfo] = useState<{ cached: boolean; reviewStatus: string } | null>(null);
  const [audioAsset, setAudioAsset] = useState<AudioResponse | null>(null);
  const [pastedText, setPastedText] = useState(sourceText);
  const [busyTranslate, setBusyTranslate] = useState(false);
  const [busyAudio, setBusyAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"original" | "translated">("original");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState("1");
  const subtitleObjectUrl = useRef<string | null>(null);
  const originalSubtitleObjectUrl = useRef<string | null>(null);
  const subtitleCallback = useRef(onSubtitleTrackUrl);
  useEffect(() => { subtitleCallback.current = onSubtitleTrackUrl; }, [onSubtitleTrackUrl]);

  const needsPdfText = sourceKind === "resource" && resourceType === "pdf" && !sourceText.trim();
  const canTranslate = sourceKind === "lesson" ? hasTranscript : resourceType !== "pdf" || Boolean(pastedText.trim());
  const sourceIsLong = (sourceKind === "lesson" ? sourceText : (resourceType === "pdf" ? pastedText : sourceText)).length > 30000;
  const currentLanguage = languageByCode(targetLanguage);
  const currentAudioLanguage = languageByCode(audioLanguage);
  const hasTranslation = translatedText.trim().length > 0;

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    if (subtitleObjectUrl.current) URL.revokeObjectURL(subtitleObjectUrl.current);
    if (originalSubtitleObjectUrl.current) URL.revokeObjectURL(originalSubtitleObjectUrl.current);
    subtitleCallback.current?.(null, targetLanguage);
  // The resource callback is held in a ref so the blob is only revoked on unmount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sourceKind !== "lesson") return;
    const parsed = parseTimedSubtitles(sourceText);
    if (!parsed) return;
    const url = URL.createObjectURL(new Blob([timedSubtitlesToVtt(parsed)], { type: "text/vtt;charset=utf-8" }));
    originalSubtitleObjectUrl.current = url;
    return () => {
      if (originalSubtitleObjectUrl.current === url) originalSubtitleObjectUrl.current = null;
      URL.revokeObjectURL(url);
    };
  }, [sourceKind, sourceText]);

  useEffect(() => {
    setTranslatedText("");
    setTranslationInfo(null);
    setAudioAsset(null);
    setError(null);
    setView("original");
    if (subtitleObjectUrl.current) {
      URL.revokeObjectURL(subtitleObjectUrl.current);
      subtitleObjectUrl.current = null;
    }
    subtitleCallback.current?.(null, targetLanguage);
  }, [targetLanguage, lessonId, resourceId]);

  useEffect(() => {
    setTranslatedText("");
    setAudioTranslation(null);
    setTranslationInfo(null);
    setAudioAsset(null);
    setError(null);
    setView("original");
    if (subtitleObjectUrl.current) {
      URL.revokeObjectURL(subtitleObjectUrl.current);
      subtitleObjectUrl.current = null;
    }
    subtitleCallback.current?.(null, targetLanguage);
  }, [pastedText]);

  const cacheKey = useMemo(() => {
    const identity = lessonId ? `lesson:${lessonId}` : resourceId ? `resource:${resourceId}` : title;
    return `eacharya.translation.${identity}.${targetLanguage}`;
  }, [lessonId, resourceId, targetLanguage, title]);

  async function translate() {
    setError(null);
    if (!canTranslate) {
      setError(sourceKind === "lesson" ? "The teacher has not added a transcript to this lesson yet." : "Enter text from the PDF before translating it.");
      return;
    }
    if (sourceIsLong) {
      setError("Translate up to 30,000 characters at a time. Split this material into smaller sections.");
      return;
    }
    setBusyTranslate(true);
    try {
      const cached = readLocalTranslation(cacheKey, sourceKind === "resource" && resourceType === "pdf" ? pastedText : sourceText);
      if (cached) {
        setTranslatedText(cached.translatedText);
        setTranslationInfo({ cached: true, reviewStatus: cached.reviewStatus || "local" });
        if (cached.translatedVtt) attachSubtitleTrack(cached.translatedVtt, targetLanguage);
        setView("translated");
        return;
      }
      const response = await fetch("/api/multilingual/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetLanguage,
          ...(lessonId ? { lessonId } : {}),
          ...(resourceId ? { resourceId } : {}),
          ...(sourceKind === "resource" && resourceType === "pdf" ? { sourceText: pastedText } : {}),
        }),
      });
      const payload = await response.json() as Partial<TranslationResponse> & { error?: string };
      if (!response.ok || typeof payload.translatedText !== "string") throw new Error(payload.error || "Translation is unavailable for this language or content.");
      setTranslatedText(payload.translatedText);
      setTranslationInfo({ cached: Boolean(payload.cached), reviewStatus: payload.reviewStatus || "unknown" });
      if (payload.timedSubtitles && typeof payload.translatedVtt === "string") attachSubtitleTrack(payload.translatedVtt, targetLanguage);
      else {
        if (subtitleObjectUrl.current) URL.revokeObjectURL(subtitleObjectUrl.current);
        subtitleObjectUrl.current = null;
        subtitleCallback.current?.(null, targetLanguage);
      }
      setView("translated");
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify({
          sourceText: sourceKind === "resource" && resourceType === "pdf" ? pastedText : sourceText,
          translatedText: payload.translatedText,
          translatedVtt: payload.translatedVtt,
          reviewStatus: payload.reviewStatus || "unknown",
        }));
      } catch { /* local cache is optional; the server-side asset cache remains authoritative */ }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Translation failed. Please try again.");
    } finally {
      setBusyTranslate(false);
    }
  }

  async function ensureAudioTranslation(language: ScheduledLanguageCode): Promise<string> {
    if (language === targetLanguage && translatedText.trim()) return translatedText;
    if (audioTranslation?.language === language && audioTranslation.text.trim()) return audioTranslation.text;
    const response = await fetch("/api/multilingual/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetLanguage: language,
        ...(lessonId ? { lessonId } : {}),
        ...(resourceId ? { resourceId } : {}),
        ...(sourceKind === "resource" && resourceType === "pdf" ? { sourceText: pastedText } : {}),
      }),
    });
    const payload = await response.json() as Partial<TranslationResponse> & { error?: string };
    if (!response.ok || typeof payload.translatedText !== "string") throw new Error(payload.error || `Translation is not available in ${languageByCode(language).name}.`);
    setAudioTranslation({ language, text: payload.translatedText });
    return payload.translatedText;
  }

  async function generateAudioTrack() {
    setError(null);
    if (!canTranslate) {
      setError("Add transcript or text before generating audio.");
      return;
    }
    setBusyAudio(true);
    try {
      // The server caches the translation by source hash/language before requesting speech synthesis.
      await ensureAudioTranslation(audioLanguage);
      const response = await fetch("/api/multilingual/speech", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetLanguage: audioLanguage,
          ...(lessonId ? { lessonId } : {}),
          ...(resourceId ? { resourceId } : {}),
          ...(sourceKind === "resource" && resourceType === "pdf" ? { sourceText: pastedText } : {}),
        }),
      });
      const payload = await response.json() as Partial<AudioResponse> & { error?: string };
      if (!response.ok || typeof payload.audioUrl !== "string") throw new Error(payload.error || `Audio track generation is unavailable for ${currentAudioLanguage.name}.`);
      setAudioAsset(payload as AudioResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Audio track generation failed. Use browser voice playback as a fallback.");
    } finally {
      setBusyAudio(false);
    }
  }

  const attachSubtitleTrack = useCallback((vttText: string, lang: string) => {
    if (subtitleObjectUrl.current) URL.revokeObjectURL(subtitleObjectUrl.current);
    const url = URL.createObjectURL(new Blob([vttText], { type: "text/vtt;charset=utf-8" }));
    subtitleObjectUrl.current = url;
    subtitleCallback.current?.(url, lang);
  }, []);

  async function speakTranslation() {
    setError(null);
    if (!("speechSynthesis" in window)) {
      setError("Browser speech playback is not supported on this device. Try a generated audio track if one is available.");
      return;
    }
    try {
      const translatedContent = await ensureAudioTranslation(audioLanguage);
      const text = parseTimedSubtitles(translatedContent)
        ? timedSubtitlesPlainText(translatedContent)
        : translatedContent;
      window.speechSynthesis.cancel();
      const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith(currentAudioLanguage.locale.slice(0, 2).toLowerCase()));
      if (!voice) {
        setError(`This device does not have a ${currentAudioLanguage.name} speech voice installed. Choose another language, or configure the AI speech service for a generated track.`);
        return;
      }
      const chunks = splitForSpeech(text);
      if (chunks.length === 0) return;
      setIsSpeaking(true);
      chunks.forEach((chunk, index) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = currentAudioLanguage.locale;
        utterance.voice = voice;
        utterance.rate = Number(speed);
        utterance.onend = () => { if (index === chunks.length - 1) setIsSpeaking(false); };
        utterance.onerror = () => { setIsSpeaking(false); setError("Browser voice playback stopped unexpectedly."); };
        window.speechSynthesis.speak(utterance);
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not prepare translated speech. Please try again.");
    }
  }

  function stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  return (
    <section className="mt-5 rounded-card border border-sage-200 bg-white p-4 shadow-card sm:p-5" aria-labelledby={`multilingual-title-${lessonId ?? resourceId ?? "free"}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><Languages className="h-5 w-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h2 id={`multilingual-title-${lessonId ?? resourceId ?? "free"}`} className="text-lg font-bold text-forest-950">Learn in your language</h2>
          <p className="mt-1 text-sm text-forest-600">Translate this {sourceKind === "lesson" ? "lesson transcript" : resourceType === "pdf" ? "PDF text excerpt" : "learning resource"}, read it aloud, or generate a reusable audio track where a speech model is configured.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="block text-sm font-semibold text-forest-800" htmlFor={`language-target-${lessonId ?? resourceId ?? "free"}`}>
          Target language
          <select id={`language-target-${lessonId ?? resourceId ?? "free"}`} value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value as ScheduledLanguageCode)} className="mt-1.5 h-11 w-full rounded-xl border border-sage-300 bg-white px-3 text-sm font-normal text-forest-900">
            {SCHEDULED_LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.name} · {language.nativeName}</option>)}
          </select>
        </label>
        <Button type="button" onClick={translate} disabled={busyTranslate || !canTranslate || sourceIsLong}>
          {busyTranslate ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Languages className="h-4 w-4" aria-hidden />}
          {busyTranslate ? "Translating…" : "Translate"}
        </Button>
      </div>

      {needsPdfText && (
        <div className="mt-4">
          <label htmlFor={`pdf-text-${resourceId}`} className="mb-1.5 block text-sm font-semibold text-forest-800">Text from the PDF</label>
          <textarea id={`pdf-text-${resourceId}`} value={pastedText} onChange={(event) => setPastedText(event.target.value)} rows={5} maxLength={30000} placeholder="Copy selectable text from the PDF and paste it here. Formatting may be simplified in the translated output." className="w-full rounded-xl border border-sage-300 bg-white p-3 text-sm" />
          <p className="mt-1 text-xs text-forest-500">The PDF itself is not modified. This translates the text you provide; scanned PDFs need OCR before text can be translated.</p>
        </div>
      )}

      {!hasTranscript && sourceKind === "lesson" && <div role="status" className="mt-3 rounded-xl border border-sage-300 bg-sage-50 px-3.5 py-3 text-sm text-forest-700">No teacher transcript has been added to this lesson yet. Video audio cannot be translated automatically until a transcript or caption file is available.</div>}
      {sourceIsLong && <p className="mt-2 text-sm text-amber-800">This content is over the 30,000-character limit. Split it into smaller sections to translate it.</p>}
      {error && <div className="mt-3"><Alert tone="error">{error}</Alert></div>}

      {(hasTranslation || canTranslate) && (
        <div className="mt-4 border-t border-sage-200 pt-4">
          {hasTranslation && <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Transcript language view">
              <button type="button" onClick={() => { setView("original"); subtitleCallback.current?.(originalSubtitleObjectUrl.current, "und"); }} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${view === "original" ? "border-brand-300 bg-brand-50 text-brand-800" : "border-sage-300 bg-white text-forest-700"}`}>
                Original text
              </button>
              <button type="button" onClick={() => { setView("translated"); if (subtitleObjectUrl.current) subtitleCallback.current?.(subtitleObjectUrl.current, targetLanguage); }} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${view === "translated" ? "border-brand-300 bg-brand-50 text-brand-800" : "border-sage-300 bg-white text-forest-700"}`}>
                <Captions className="h-4 w-4" aria-hidden /> {currentLanguage.name}
              </button>
            </div>
            <span className="text-xs text-forest-500">{translationInfo?.cached ? "Reused saved translation" : "New translation"}{translationInfo?.reviewStatus === "approved" ? " · Teacher approved" : translationInfo?.reviewStatus === "pending" ? " · Pending teacher review" : ""}</span>
          </div>
          <div className="mt-3 max-h-[28rem] overflow-y-auto whitespace-pre-wrap rounded-xl border border-sage-200 bg-sage-50/40 p-4 text-sm leading-7 text-forest-800" lang={view === "translated" ? currentLanguage.locale : undefined}>
            {view === "translated"
              ? (parseTimedSubtitles(translatedText) ? timedSubtitlesPlainText(translatedText) : translatedText)
              : (sourceKind === "resource" && resourceType === "pdf" ? pastedText : (parseTimedSubtitles(sourceText) ? timedSubtitlesPlainText(sourceText) : sourceText)) || "No text is available."}
          </div>
          {sourceKind === "lesson" && <p className="mt-2 text-xs text-forest-500">For a plain-text transcript, this is a translated transcript display rather than frame-synchronised captions. Timestamped subtitle cues need to be provided by the teacher to keep captions in sync with the video.</p>}
          </>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 pr-1 text-sm font-semibold text-forest-800"><Volume2 className="h-4 w-4" aria-hidden /> Listen in {currentAudioLanguage.name}</span>
            <label className="flex items-center gap-2 text-sm text-forest-700">Speed
              <select value={speed} onChange={(event) => setSpeed(event.target.value)} className="h-10 rounded-lg border border-sage-300 bg-white px-2" aria-label="Voice playback speed">
                <option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option>
              </select>
            </label>
            <Button type="button" variant="secondary" onClick={speakTranslation}><Play className="h-4 w-4" aria-hidden /> Play</Button>
            <Button type="button" variant="secondary" onClick={() => { if ("speechSynthesis" in window) { window.speechSynthesis.pause(); setIsSpeaking(true); } }} disabled={!isSpeaking}><Pause className="h-4 w-4" aria-hidden /> Pause</Button>
            <Button type="button" variant="secondary" onClick={() => { if ("speechSynthesis" in window) { window.speechSynthesis.resume(); setIsSpeaking(true); } }}><RotateCcw className="h-4 w-4" aria-hidden /> Resume</Button>
            <Button type="button" variant="secondary" onClick={stopSpeaking}><Square className="h-4 w-4" aria-hidden /> Stop</Button>
          </div>
          <div className="mt-4 rounded-xl border border-sage-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <AudioLines className="mt-0.5 h-4 w-4 text-brand-700" aria-hidden />
                <div><p className="text-sm font-semibold text-forest-900">Spoken audio language</p><p className="mt-0.5 text-xs text-forest-600">Audio can use a different language from translated subtitles. Browser playback does not create a downloadable file.</p></div>
              </div>
              <Button type="button" onClick={generateAudioTrack} disabled={busyAudio} variant="secondary">
                {busyAudio ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <AudioLines className="h-4 w-4" aria-hidden />}
                {busyAudio ? "Generating…" : "Generate audio"}
              </Button>
            </div>
            <label className="mt-3 block max-w-sm text-sm font-semibold text-forest-800" htmlFor={`audio-language-${lessonId ?? resourceId ?? "free"}`}>
              Preferred spoken language
              <select id={`audio-language-${lessonId ?? resourceId ?? "free"}`} value={audioLanguage} onChange={(event) => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setAudioLanguage(event.target.value as ScheduledLanguageCode); setAudioAsset(null); setAudioTranslation(null); setIsSpeaking(false); }} className="mt-1.5 h-11 w-full rounded-xl border border-sage-300 bg-white px-3 text-sm font-normal text-forest-900">
                {SCHEDULED_LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.name} · {language.nativeName}</option>)}
              </select>
            </label>
            {audioAsset && <div className="mt-3"><audio controls preload="none" src={audioAsset.audioUrl} className="w-full" /><p className="mt-1 text-xs text-forest-500">{languageByCode(audioAsset.targetLanguage).name} audio track · {audioAsset.cached ? "reused" : "generated"}{audioAsset.reviewStatus === "pending" ? " · Pending teacher review" : audioAsset.reviewStatus === "approved" ? " · Teacher approved" : ""}</p></div>}
          </div>
        </div>
      )}
    </section>
  );
}

function splitForSpeech(text: string): string[] {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?。！？]+[.!?。！？]?/g) ?? [text];
  const chunks: string[] = [];
  for (const sentence of sentences) {
    const value = sentence.trim();
    if (!value) continue;
    if (value.length <= 220) { chunks.push(value); continue; }
    for (let start = 0; start < value.length; start += 220) chunks.push(value.slice(start, start + 220));
  }
  return chunks;
}

function readLocalTranslation(key: string, currentSource: string) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as { sourceText?: string; translatedText?: string; translatedVtt?: string; reviewStatus?: string };
    if (value.sourceText !== currentSource || typeof value.translatedText !== "string") return null;
    return value as { sourceText: string; translatedText: string; translatedVtt?: string; reviewStatus?: string };
  } catch { return null; }
}
