import type { LocaleCode } from "./types";

export interface LocaleMeta {
  code: LocaleCode;
  label: string;
  nativeLabel: string;
  /** BCP-47 tag used for Web Speech API voice selection. */
  bcp47: string;
  /** Unicode script this language needs a Noto fallback font for (null = Latin only). */
  script: "devanagari" | "tamil" | "telugu" | "bengali" | "kannada" | "gujarati" | "gurmukhi" | null;
}

export const LOCALES: LocaleMeta[] = [
  { code: "en", label: "English", nativeLabel: "English", bcp47: "en-IN", script: null },
  { code: "hinglish", label: "Hinglish", nativeLabel: "Hinglish", bcp47: "hi-IN", script: null },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", bcp47: "hi-IN", script: "devanagari" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", bcp47: "ta-IN", script: "tamil" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", bcp47: "te-IN", script: "telugu" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", bcp47: "mr-IN", script: "devanagari" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", bcp47: "bn-IN", script: "bengali" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ", bcp47: "kn-IN", script: "kannada" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી", bcp47: "gu-IN", script: "gujarati" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ", bcp47: "pa-IN", script: "gurmukhi" },
];

export const DEFAULT_LOCALE: LocaleCode = "en";

export function isLocaleCode(value: string): value is LocaleCode {
  return LOCALES.some((l) => l.code === value);
}

export function getLocaleMeta(code: LocaleCode): LocaleMeta {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}
