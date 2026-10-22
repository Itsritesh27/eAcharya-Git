"use client";

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { SCHEDULED_LANGUAGES } from "@/lib/multilingual/languages";

type SpeechAlternative = { transcript: string };
type SpeechResult = ArrayLike<SpeechAlternative>;
type SpeechResultEvent = { results: ArrayLike<SpeechResult>; resultIndex: number };
type SpeechErrorEvent = { error?: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

/** Uses the browser's SpeechRecognition implementation when present. Text remains editable. */
export function VoiceQuestionButton({ onTranscript, disabled = false }: { onTranscript: (text: string) => void; disabled?: boolean }) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const speechWindow = window as SpeechWindow;
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Constructor) {
      setError("Voice typing is not supported by this browser. Use Chrome or Edge, or type your question manually.");
      return;
    }

    const recognition = new Constructor();
    recognition.lang = preferredLocale();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const parts: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i]?.[0]?.transcript;
        if (transcript?.trim()) parts.push(transcript.trim());
      }
      if (parts.length) onTranscript(parts.join(" "));
    };
    recognition.onerror = (event) => {
      setListening(false);
      const reason = event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Microphone access was denied. Allow microphone access in the browser and try again."
        : event.error === "language-not-supported"
          ? "Speech recognition does not support this language in your browser. Choose another language or type your question."
          : "Voice typing stopped. You can edit any text captured so far or continue typing.";
      setError(reason);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setError("Could not start the microphone. Check browser permissions and try again.");
    }
  }

  return (
    <div className="mt-2">
      <button type="button" onClick={toggle} disabled={disabled} aria-pressed={listening}
        className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${listening ? "border-red-300 bg-red-50 text-red-800" : "border-sage-300 bg-white text-forest-800 hover:bg-sage-50"}`}>
        {listening ? <MicOff className="h-4 w-4" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
        {listening ? "Stop voice typing" : "Ask by voice"}
      </button>
      <p className="mt-1 text-xs text-forest-500">{listening ? `Listening in ${SCHEDULED_LANGUAGES.find((item) => item.locale === preferredLocale())?.name ?? "your selected language"}. Your recognised words appear in the editable question box.` : "Uses speech recognition supported by your browser and device; microphone permission is required."}</p>
      {error && <p role="status" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

function preferredLocale(): string {
  if (typeof window === "undefined") return "hi-IN";
  try {
    const raw = window.localStorage.getItem("eacharya.languagePreferences");
    if (raw) {
      const preferences = JSON.parse(raw) as { contentLanguage?: string };
      const language = SCHEDULED_LANGUAGES.find((item) => item.code === preferences.contentLanguage);
      if (language) return language.locale;
    }
  } catch { /* invalid or blocked local preference: use Hindi */ }
  return "hi-IN";
}
