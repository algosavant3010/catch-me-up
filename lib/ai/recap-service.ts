import type { Ball, MatchMeta } from "@/lib/match/types";
import type { FanMode } from "@/components/providers/preferences-provider";
import type { LocaleCode } from "@/lib/i18n";
import { buildFactSheet } from "./fact-sheet";
import { recapPrompt } from "./prompts";
import { Recap, recapGeminiSchema } from "./schemas";
import { verifyRecap } from "./verify";
import { buildFallbackRecap } from "./fallback";
import { generateStructured } from "./gemini";
import { getCached, setCached } from "./cache";
import { getQualityModel, TIMEOUTS } from "./config";

export interface RecapResult {
  recap: Recap;
  source: "ai" | "fallback";
  verifiedRefs: number;
  totalRefs: number;
}

export async function getRecap(args: {
  allBalls: Ball[];
  meta: MatchMeta;
  from: number;
  to: number;
  locale: LocaleCode;
  mode: FanMode;
}): Promise<RecapResult> {
  const { allBalls, meta, from, to, locale, mode } = args;
  const model = getQualityModel();
  const cacheParts = { kind: "recap", from, to, locale, mode, model };

  const cached = await getCached<RecapResult>(cacheParts);
  if (cached) return cached;

  const factSheet = buildFactSheet(allBalls, meta, from, to);
  const { systemInstruction, userContent } = recapPrompt({ locale, mode, factSheet });

  let lastViolations: string[] = [];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const prompt =
      attempt === 0
        ? userContent
        : `${userContent}\n\nYour previous attempt had these problems — fix them:\n${lastViolations.join("\n")}`;

    const result = await generateStructured({
      task: "recap",
      model,
      systemInstruction,
      userContent: prompt,
      schema: Recap,
      geminiSchema: recapGeminiSchema,
      timeoutMs: TIMEOUTS.recapMs,
      maxOutputTokens: 700,
    });

    if (!result.ok) break; // not_configured, timeout, blocked, rate_limited, upstream — go to fallback

    const verification = verifyRecap(result.data, {
      allBalls,
      meta,
      windowFrom: from,
      windowTo: to,
      factSheet,
      mode,
      locale,
    });
    if (verification.valid) {
      const final: RecapResult = {
        recap: result.data,
        source: "ai",
        verifiedRefs: verification.verifiedRefs,
        totalRefs: verification.totalRefs,
      };
      await setCached(cacheParts, final);
      return final;
    }
    lastViolations = verification.violations;
  }

  const fallbackRecap = buildFallbackRecap(allBalls, meta, from, to, locale);
  const refCount = fallbackRecap.lines.reduce((s, l) => s + l.refs.length, 0);
  // The fallback never cites unverified refs (it has none), so it is trivially 100% verified.
  return { recap: fallbackRecap, source: "fallback", verifiedRefs: refCount, totalRefs: refCount };
}
