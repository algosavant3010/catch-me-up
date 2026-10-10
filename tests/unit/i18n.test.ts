import { describe, expect, it } from "vitest";
import { LOCALES, STRINGS_BY_LOCALE } from "@/lib/i18n";
import type { UiStrings } from "@/lib/i18n/types";

const baselineKeys = Object.keys(STRINGS_BY_LOCALE.en) as (keyof UiStrings)[];

describe("i18n completeness", () => {
  it("has at least one locale per required fan language plus Hinglish", () => {
    const codes = LOCALES.map((l) => l.code);
    expect(codes).toEqual(
      expect.arrayContaining(["en", "hinglish", "hi", "ta", "te", "mr", "bn", "kn", "gu", "pa"]),
    );
  });

  it.each(LOCALES.map((l) => l.code))(
    "locale '%s' implements every baseline key with non-empty text",
    (code) => {
      const strings = STRINGS_BY_LOCALE[code];
      for (const key of baselineKeys) {
        expect(strings[key], `${code} is missing or empty for key "${key}"`).toBeTruthy();
      }
    },
  );

  it("no locale has extra keys beyond the baseline (keeps the type and the data in sync)", () => {
    for (const locale of LOCALES) {
      const keys = Object.keys(STRINGS_BY_LOCALE[locale.code]);
      expect(keys.sort()).toEqual(baselineKeys.slice().sort());
    }
  });

  it("template placeholders are preserved across every translation that uses them", () => {
    const placeholderKeys: (keyof UiStrings)[] = [
      "recap.trustBadge",
      "away.missed",
      "spoiler.behindBy",
    ];
    const placeholdersIn = (s: string) => (s.match(/\{[a-zA-Z]+\}/g) ?? []).sort();
    for (const key of placeholderKeys) {
      const expected = placeholdersIn(STRINGS_BY_LOCALE.en[key]);
      for (const locale of LOCALES) {
        expect(placeholdersIn(STRINGS_BY_LOCALE[locale.code][key])).toEqual(expected);
      }
    }
  });
});
