import type { Ball, MatchMeta } from "@/lib/match/types";
import { computeOverSummaries } from "@/lib/match/engine";
import { buildFactSheet } from "./fact-sheet";
import { explainOverPrompt } from "./prompts";
import { ExplainOver, explainOverGeminiSchema } from "./schemas";
import { generateStructured } from "./gemini";
import { getFastModel, TIMEOUTS } from "./config";
import type { LocaleCode } from "@/lib/i18n";

export interface ExplainOverResult extends ExplainOver {
  source: "ai" | "fallback";
}

export async function explainOver(args: {
  allBalls: Ball[];
  meta: MatchMeta;
  over: number;
  locale: LocaleCode;
}): Promise<ExplainOverResult> {
  const summary = computeOverSummaries(args.allBalls, args.meta).find((o) => o.over === args.over);
  if (!summary) {
    return { source: "fallback", explanation: "That over hasn't finished yet.", refs: [] };
  }

  const overBalls = args.allBalls.filter((b) => b.over === args.over);
  const from = overBalls[0]?.n ?? 1;
  const to = overBalls[overBalls.length - 1]?.n ?? from;
  const factSheet = buildFactSheet(args.allBalls, args.meta, from, to);
  const { systemInstruction } = explainOverPrompt({ locale: args.locale });
  const model = getFastModel();

  const result = await generateStructured({
    task: "explain-over",
    model,
    systemInstruction,
    userContent: `FACT SHEET:\n${factSheet}`,
    schema: ExplainOver,
    geminiSchema: explainOverGeminiSchema,
    timeoutMs: TIMEOUTS.quickMs,
    maxOutputTokens: 200,
  });

  if (result.ok) {
    const validRefs = result.data.refs.every((r) => r >= from && r <= to);
    if (validRefs) return { ...result.data, source: "ai" };
  }

  return {
    source: "fallback",
    explanation: `Over ${summary.over}: ${summary.runs} run${summary.runs === 1 ? "" : "s"}${summary.wickets > 0 ? ` and ${summary.wickets} wicket${summary.wickets === 1 ? "" : "s"}` : ""}, bowled by ${summary.bowler}.`,
    refs: [to],
  };
}
