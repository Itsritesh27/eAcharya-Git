/** India's 22 Scheduled Languages. Runtime providers may support only a subset. */
const ALL_SCHEDULED_LANGUAGES = [
  { code: "as", locale: "as-IN", name: "Assamese", nativeName: "অসমীয়া", libreTranslateCode: "as" },
  { code: "bn", locale: "bn-IN", name: "Bengali", nativeName: "বাংলা", libreTranslateCode: "bn" },
  { code: "brx", locale: "brx-IN", name: "Bodo", nativeName: "बड़ो", libreTranslateCode: "brx" },
  { code: "doi", locale: "doi-IN", name: "Dogri", nativeName: "डोगरी", libreTranslateCode: "doi" },
  { code: "gu", locale: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", libreTranslateCode: "gu" },
  { code: "hi", locale: "hi-IN", name: "Hindi", nativeName: "हिन्दी", libreTranslateCode: "hi" },
  { code: "kn", locale: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", libreTranslateCode: "kn" },
  { code: "ks", locale: "ks-IN", name: "Kashmiri", nativeName: "कॉशुर", libreTranslateCode: "ks" },
  { code: "kok", locale: "kok-IN", name: "Konkani", nativeName: "कोंकणी", libreTranslateCode: "kok" },
  { code: "mai", locale: "mai-IN", name: "Maithili", nativeName: "मैथिली", libreTranslateCode: "mai" },
  { code: "ml", locale: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", libreTranslateCode: "ml" },
  { code: "mni", locale: "mni-IN", name: "Manipuri (Meitei)", nativeName: "মৈতৈলোন্", libreTranslateCode: "mni" },
  { code: "mr", locale: "mr-IN", name: "Marathi", nativeName: "मराठी", libreTranslateCode: "mr" },
  { code: "ne", locale: "ne-IN", name: "Nepali", nativeName: "नेपाली", libreTranslateCode: "ne" },
  { code: "or", locale: "or-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ", libreTranslateCode: "or" },
  { code: "pa", locale: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", libreTranslateCode: "pa" },
  { code: "sa", locale: "sa-IN", name: "Sanskrit", nativeName: "संस्कृतम्", libreTranslateCode: "sa" },
  { code: "sat", locale: "sat-IN", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", libreTranslateCode: "sat" },
  { code: "sd", locale: "sd-IN", name: "Sindhi", nativeName: "سنڌي", libreTranslateCode: "sd" },
  { code: "ta", locale: "ta-IN", name: "Tamil", nativeName: "தமிழ்", libreTranslateCode: "ta" },
  { code: "te", locale: "te-IN", name: "Telugu", nativeName: "తెలుగు", libreTranslateCode: "te" },
  { code: "ur", locale: "ur-IN", name: "Urdu", nativeName: "اردو", libreTranslateCode: "ur" },
] as const;

export type ScheduledLanguageCode = (typeof ALL_SCHEDULED_LANGUAGES)[number]["code"];

/**
 * Languages we show when the translation server's own language list cannot be read.
 * This is all 22 languages, because the local IndicTrans2 model translates all of them. The authoritative list is the
 * server's /languages endpoint (see /api/multilingual/languages), which the UI uses
 * to hide any language the configured service cannot actually translate into.
 * No database change is needed: the database already allows all 22 codes.
 */
export const FALLBACK_TRANSLATION_CODES: readonly ScheduledLanguageCode[] = [
  "as", "bn", "brx", "doi", "gu", "hi", "kn", "ks", "kok", "mai", "ml",
  "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "ur",
];

export type ScheduledLanguage = (typeof ALL_SCHEDULED_LANGUAGES)[number];

/** Scheduled languages restricted to the given supported codes (defaults to the fallback set). */
export function languagesFor(codes: readonly string[] = FALLBACK_TRANSLATION_CODES): ScheduledLanguage[] {
  return ALL_SCHEDULED_LANGUAGES.filter((language) => codes.includes(language.code));
}

/** Backwards-compatible static list (fallback set). Prefer the useSupportedLanguages() hook in UI. */
export const SCHEDULED_LANGUAGES = languagesFor();
export type LanguagePreferences = {
  contentLanguage: ScheduledLanguageCode;
  subtitleLanguage: ScheduledLanguageCode;
  audioLanguage: ScheduledLanguageCode;
};

export const DEFAULT_LANGUAGE_PREFERENCES: LanguagePreferences = {
  contentLanguage: "hi",
  subtitleLanguage: "hi",
  audioLanguage: "hi",
};

export function isScheduledLanguage(value: unknown): value is ScheduledLanguageCode {
  return typeof value === "string" && ALL_SCHEDULED_LANGUAGES.some((language) => language.code === value);
}

export function languageByCode(code: string) {
  // Look in the full list so older saved rows in other languages still display a proper name.
  return ALL_SCHEDULED_LANGUAGES.find((language) => language.code === code)
    ?? ALL_SCHEDULED_LANGUAGES.find((language) => language.code === "hi")!;
}
export const ALL_LANGUAGE_CODES: readonly ScheduledLanguageCode[] = ALL_SCHEDULED_LANGUAGES.map((language) => language.code);

/** Languages the server-side voice route can speak (Azure neural voices, or Google fallback). */
export const SPOKEN_AUDIO_CODES: readonly ScheduledLanguageCode[] = [
  "bn", "gu", "hi", "kn", "ml", "mr", "ne", "pa", "ta", "te", "ur",
];
