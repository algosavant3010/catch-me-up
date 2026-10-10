import type { Recap } from "./schemas";
import { factSheetRefUniverse } from "./fact-sheet";
import type { Ball, MatchMeta } from "@/lib/match/types";
import type { FanMode } from "@/components/providers/preferences-provider";
import type { LocaleCode } from "@/lib/i18n";

export interface VerifyContext {
  allBalls: Ball[];
  meta: MatchMeta;
  windowFrom: number;
  windowTo: number;
  factSheet: string;
  mode: FanMode;
  locale: LocaleCode;
}

export interface VerifyResult {
  valid: boolean;
  violations: string[];
  totalRefs: number;
  verifiedRefs: number;
}

const SCRIPT_RANGES: Partial<Record<LocaleCode, RegExp>> = {
  hi: /[\u0900-\u097F]/,
  mr: /[\u0900-\u097F]/,
  ta: /[\u0B80-\u0BFF]/,
  te: /[\u0C00-\u0C7F]/,
  bn: /[\u0980-\u09FF]/,
  kn: /[\u0C80-\u0CFF]/,
  gu: /[\u0A80-\u0AFF]/,
  pa: /[\u0A00-\u0A7F]/,
};

function allowedNames(meta: MatchMeta): Set<string> {
  return new Set([
    ...meta.battingTeam.players,
    ...meta.bowlingTeam.players,
    meta.battingTeam.name,
    meta.bowlingTeam.name,
  ]);
}

/** Finds sequences that look like a two-word proper name (e.g. "Rohan Iyer"). */
function extractNameLikeSequences(text: string): string[] {
  const matches = text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g);
  return matches ?? [];
}

function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(\.\d+)?/g) ?? [];
  return matches.map(Number);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function verifyRecap(recap: Recap, ctx: VerifyContext): VerifyResult {
  const violations: string[] = [];
  const refUniverse = factSheetRefUniverse(ctx.allBalls, ctx.windowFrom, ctx.windowTo);
  const names = allowedNames(ctx.meta);
  const factSheetNumbers = new Set(extractNumbers(ctx.factSheet));

  let totalRefs = 0;
  let verifiedRefs = 0;

  for (const line of recap.lines) {
    for (const ref of line.refs) {
      totalRefs += 1;
      if (refUniverse.has(ref)) {
        verifiedRefs += 1;
      } else {
        violations.push(
          `Line "${line.kind}" cites ball ${ref}, which is outside the requested window.`,
        );
      }
    }

    for (const n of extractNumbers(line.text)) {
      if (!factSheetNumbers.has(n)) {
        violations.push(
          `Line "${line.kind}" states the number ${n}, which does not appear in the fact sheet.`,
        );
      }
    }

    for (const name of extractNameLikeSequences(line.text)) {
      if (!names.has(name)) {
        violations.push(`Line "${line.kind}" mentions "${name}", who is not in this match.`);
      }
    }

    if (/[*_`#]|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(line.text)) {
      violations.push(`Line "${line.kind}" contains markdown or emoji, which is not allowed.`);
    }
  }

  for (const name of extractNameLikeSequences(recap.headline)) {
    if (!names.has(name)) {
      violations.push(`Headline mentions "${name}", who is not in this match.`);
    }
  }
  for (const n of extractNumbers(recap.headline)) {
    if (!factSheetNumbers.has(n)) {
      violations.push(`Headline states the number ${n}, which does not appear in the fact sheet.`);
    }
  }

  if (ctx.mode === "glance") {
    const totalWords =
      wordCount(recap.headline) + recap.lines.reduce((s, l) => s + wordCount(l.text), 0);
    if (totalWords > 25) {
      violations.push(
        `Glance mode must be 25 words or fewer; this response is ${totalWords} words.`,
      );
    }
  }

  const scriptPattern = SCRIPT_RANGES[ctx.locale];
  if (scriptPattern) {
    const allText = [recap.headline, ...recap.lines.map((l) => l.text)].join(" ");
    if (!scriptPattern.test(allText)) {
      violations.push(
        `Response does not appear to be written in the expected script for locale "${ctx.locale}".`,
      );
    }
  }

  return { valid: violations.length === 0, violations, totalRefs, verifiedRefs };
}
