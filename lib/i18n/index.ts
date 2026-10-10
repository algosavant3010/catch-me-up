import type { LocaleCode } from "./types";
import type { UiStrings } from "./types";
import { en } from "./strings/en";
import { hinglish } from "./strings/hinglish";
import { hi } from "./strings/hi";
import { ta } from "./strings/ta";
import { te } from "./strings/te";
import { mr } from "./strings/mr";
import { bn } from "./strings/bn";
import { kn } from "./strings/kn";
import { gu } from "./strings/gu";
import { pa } from "./strings/pa";

export type { UiStrings, LocaleCode } from "./types";
export { LOCALES, DEFAULT_LOCALE, isLocaleCode, getLocaleMeta } from "./locales";
export type { LocaleMeta } from "./locales";

export const STRINGS_BY_LOCALE: Record<LocaleCode, UiStrings> = {
  en,
  hinglish,
  hi,
  ta,
  te,
  mr,
  bn,
  kn,
  gu,
  pa,
};

export function getStrings(locale: LocaleCode): UiStrings {
  return STRINGS_BY_LOCALE[locale] ?? STRINGS_BY_LOCALE.en;
}

/** Simple {placeholder} interpolation — no AI content ever flows through this. */
export function t(
  strings: UiStrings,
  key: keyof UiStrings,
  vars?: Record<string, string | number>,
): string {
  let value: string = strings[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replaceAll(`{${k}}`, String(v));
    }
  }
  return value;
}
