import { describe, expect, it } from "vitest";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { buildFactSheet } from "@/lib/ai/fact-sheet";
import { verifyRecap } from "@/lib/ai/verify";
import type { Recap } from "@/lib/ai/schemas";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];
const from = 1;
const to = 37;
const factSheet = buildFactSheet(allBalls, meta, from, to);
const baseCtx = {
  allBalls,
  meta,
  windowFrom: from,
  windowTo: to,
  factSheet,
  mode: "beginner" as const,
  locale: "en" as const,
};

function validRecap(): Recap {
  return {
    headline: "Powerplay done, Konkan Kings 46/2",
    lines: [
      {
        kind: "what_happened",
        text: "Vikram Shah fell early, but the openers found some boundaries.",
        refs: [3, 9],
      },
      { kind: "where_it_stands", text: "Konkan Kings are 46/2 after the powerplay.", refs: [37] },
    ],
  };
}

describe("verifyRecap", () => {
  it("accepts a recap that only cites in-window balls and real numbers/names", () => {
    const result = verifyRecap(validRecap(), baseCtx);
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.totalRefs).toBe(3);
    expect(result.verifiedRefs).toBe(3);
  });

  it("rejects a ref outside the requested window", () => {
    const recap = validRecap();
    recap.lines[0].refs = [999];
    const result = verifyRecap(recap, baseCtx);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes("outside the requested window"))).toBe(true);
  });

  it("rejects a hallucinated number not present in the fact sheet", () => {
    const recap = validRecap();
    recap.lines[0].text = "They raced to 9999 runs in record time.";
    const result = verifyRecap(recap, baseCtx);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes("9999"))).toBe(true);
  });

  it("rejects a player name that isn't in this match", () => {
    const recap = validRecap();
    recap.lines[0].text = "Virat Kohli smashed a huge six.";
    const result = verifyRecap(recap, baseCtx);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes("Virat Kohli"))).toBe(true);
  });

  it("rejects markdown/emoji in a line", () => {
    const recap = validRecap();
    recap.lines[0].text = "**Huge** six! 🔥";
    const result = verifyRecap(recap, baseCtx);
    expect(result.valid).toBe(false);
  });

  it("rejects a glance-mode recap over 25 words", () => {
    const recap = validRecap();
    recap.lines[0].text =
      "This is a very long sentence deliberately written to exceed the twenty five word budget allowed for glance mode fans who want just one short line and nothing more than that.";
    const result = verifyRecap(recap, { ...baseCtx, mode: "glance" });
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes("25 words"))).toBe(true);
  });

  it("rejects a Hindi-locale response written in the wrong script", () => {
    const recap = validRecap();
    const result = verifyRecap(recap, { ...baseCtx, locale: "hi" });
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes("expected script"))).toBe(true);
  });

  it("accepts a correctly-scripted Hindi response", () => {
    const recap: Recap = {
      headline: "पावरप्ले खत्म, कोंकण किंग्स 46/2",
      lines: [
        {
          kind: "where_it_stands",
          text: "कोंकण किंग्स अभी 46 रन पर 2 विकेट खो चुके हैं।",
          refs: [37],
        },
      ],
    };
    const result = verifyRecap(recap, { ...baseCtx, locale: "hi" });
    expect(result.valid).toBe(true);
  });
});
