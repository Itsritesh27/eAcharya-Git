"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Languages, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { saveLanguagePreferencesAction } from "@/lib/multilingual/actions";
import { DEFAULT_LANGUAGE_PREFERENCES, type LanguagePreferences } from "@/lib/multilingual/languages";
import { useSupportedLanguages } from "@/components/multilingual/use-supported-languages";

export function LanguagePreferencesForm({ initialValue = DEFAULT_LANGUAGE_PREFERENCES }: { initialValue?: LanguagePreferences }) {
  const [value, setValue] = useState<LanguagePreferences>(initialValue);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    try { window.localStorage.setItem("eacharya.languagePreferences", JSON.stringify(initialValue)); } catch { /* device preference is optional */ }
  }, [initialValue]);

  function update(key: keyof LanguagePreferences, nextValue: string) {
    setValue((current) => ({ ...current, [key]: nextValue as LanguagePreferences[typeof key] }));
    setMessage(null);
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveLanguagePreferencesAction(value);
      if (result.ok) {
        try { window.localStorage.setItem("eacharya.languagePreferences", JSON.stringify(value)); } catch { /* saving on device is optional */ }
        setMessage({ tone: "success", text: "Your language preferences have been saved." });
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><Languages className="h-5 w-5" aria-hidden /></span>
        <div>
          <h2 className="text-base font-bold">Language and accessibility</h2>
          <p className="mt-1 text-sm text-forest-600">Choose separate languages for translated learning material, subtitles/transcripts, and spoken audio. Availability depends on the configured language model.</p>
        </div>
      </div>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <div className="grid gap-4 sm:grid-cols-3">
        <LanguageSelect id="content-language" label="Learning material" value={value.contentLanguage} onChange={(v) => update("contentLanguage", v)} disabled={pending} />
        <LanguageSelect id="subtitle-language" label="Subtitles / transcript" value={value.subtitleLanguage} onChange={(v) => update("subtitleLanguage", v)} disabled={pending} />
        <LanguageSelect id="audio-language" label="Spoken audio" value={value.audioLanguage} onChange={(v) => update("audioLanguage", v)} disabled={pending} />
      </div>
      <Button type="button" onClick={save} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
        Save preferences
      </Button>
      <p className="text-xs leading-relaxed text-forest-500">Only languages the translation service can currently translate into are listed.</p>
    </div>
  );
}

function LanguageSelect({ id, label, value, onChange, disabled }: { id: string; label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  const languages = useSupportedLanguages();
  return (
    <label htmlFor={id} className="block text-sm font-semibold text-forest-800">
      {label}
      <select id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-sage-300 bg-white px-3 text-sm font-normal text-forest-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100">
        {languages.map((language) => <option key={language.code} value={language.code}>{language.name} · {language.nativeName}</option>)}
      </select>
    </label>
  );
}
