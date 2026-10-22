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
 * Languages the configured translation server can actually translate into.
 * Stock LibreTranslate (with en/hi/bn/ur loaded) supports only these. When you add a
 * translation service that supports more languages, add their codes here.
 * No database change is needed: the database already allows all 22 codes.
 */
const ENABLED_LANGUAGE_CODES: readonly ScheduledLanguageCode[] = ["hi", "bn", "ur"];

export const SCHEDULED_LANGUAGES = ALL_SCHEDULED_LANGUAGES.filter((language) =>
  ENABLED_LANGUAGE_CODES.includes(language.code),
);
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
  return typeof value === "string" && SCHEDULED_LANGUAGES.some((language) => language.code === value);
}

export function languageByCode(code: string) {
  // Look in the full list so older saved rows in other languages still display a proper name.
  return ALL_SCHEDULED_LANGUAGES.find((language) => language.code === code)
    ?? ALL_SCHEDULED_LANGUAGES.find((language) => language.code === "hi")!;
}