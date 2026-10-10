import type { Ball, MatchMeta } from "@/lib/match/types";
import type { LocaleCode } from "@/lib/i18n";
import type { FanMode } from "@/components/providers/preferences-provider";
import { AskAnswer, askAnswerGeminiSchema } from "./schemas";
import { askPrompt } from "./prompts";
import { generateWithTools } from "./gemini";
import { TOOL_DECLARATIONS, executeTool } from "./tools";
import { getFastModel, TIMEOUTS } from "./config";
import { computeMatchState } from "@/lib/match/engine";
import { sanitizeUserText } from "@/lib/security/sanitize";

export interface AskResult extends AskAnswer {
  source: "ai" | "fallback";
}

export async function askSamjhao(args: {
  question: string;
  allBalls: Ball[];
  meta: MatchMeta;
  cutoffBall: number;
  locale: LocaleCode;
  mode: FanMode;
}): Promise<AskResult> {
  const question = sanitizeUserText(args.question, 300);
  const model = getFastModel();
  const { systemInstruction } = askPrompt({ locale: args.locale, mode: args.mode });

  const result = await generateWithTools({
    task: "ask",
    model,
    systemInstruction,
    contents: [
      {
        role: "user",
        parts: [{ text: `UNTRUSTED USER TEXT:\n${question}` }],
      },
    ],
    tools: TOOL_DECLARATIONS,
    schema: AskAnswer,
    geminiSchema: askAnswerGeminiSchema,
    timeoutMs: TIMEOUTS.quickMs,
    maxRounds: 4,
    executeTool: (name, toolArgs) =>
      executeTool(name, toolArgs, {
        allBalls: args.allBalls,
        meta: args.meta,
        cutoffBall: args.cutoffBall,
      }),
  });

  if (result.ok) {
    return { ...result.data, source: "ai" };
  }

  return fallbackAnswer(args);
}

/** Deterministic, non-AI answer: just the current state, no interpretation. */
function fallbackAnswer(args: {
  allBalls: Ball[];
  meta: MatchMeta;
  cutoffBall: number;
}): AskResult {
  const visible = args.allBalls.filter((b) => b.n <= args.cutoffBall);
  const state = computeMatchState(visible, args.meta);
  return {
    source: "fallback",
    onTopic: true,
    refs: visible.length > 0 ? [visible[visible.length - 1].n] : [],
    answer: `AI is unavailable right now. Current score: ${args.meta.battingTeam.name} ${state.runs}/${state.wickets}, need ${state.needed} from ${state.ballsLeft} balls.`,
  };
}
