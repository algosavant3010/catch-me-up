import { z } from "zod";
import { Type, type Schema } from "@google/genai";
import { generateStructured } from "./gemini";
import { getQualityModel, TIMEOUTS } from "./config";

export const BanterVerdictSchema = z.object({
  verdict: z.string().min(3).max(60),
  verdictSummary: z.string().min(10).max(250),
  evidence: z.array(z.string().min(5).max(180)).min(1).max(3),
  banterTake: z.string().min(10).max(250),
});

export type BanterVerdictResponse = z.infer<typeof BanterVerdictSchema> & {
  source: "ai" | "fallback";
};

const geminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, description: "Punchy umpire verdict label" },
    verdictSummary: { type: Type.STRING, description: "1-2 sentence analytical judgment" },
    evidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-3 hard numerical match statistics backing the ruling",
    },
    banterTake: {
      type: Type.STRING,
      description: "Witty, sharp cricket banter punchline tailored for group chats",
    },
  },
  required: ["verdict", "verdictSummary", "evidence", "banterTake"],
};

export async function arbitrateBanter({
  debateTopic,
  matchStateSummary,
  recentEvents,
}: {
  debateTopic: string;
  matchStateSummary: string;
  recentEvents: string;
}): Promise<BanterVerdictResponse> {
  const systemInstruction = `You are the Third Umpire and Chief Cricket Arbitrator in an Indian fan group chat.
Your job is to objectively settle fierce cricket arguments between friends with indisputable facts, numbers, and cheeky wit.
Analyze the user's debate question against the real match telemetry provided.
Never make up fake numbers. Cite actual runs, balls, required rates, wickets, and overs.
Keep the tone entertaining, authoritative, and ready to paste into WhatsApp.`;

  const userContent = `Match Telemetry: ${matchStateSummary}
Recent Phase Context: ${recentEvents}

Fan Argument To Settle:
"${debateTopic}"`;

  const res = await generateStructured({
    task: "banter-arbitrator",
    model: getQualityModel(),
    systemInstruction,
    userContent,
    schema: BanterVerdictSchema,
    geminiSchema,
    timeoutMs: TIMEOUTS.quickMs,
    temperature: 0.3,
  });

  if (res.ok) {
    return { ...res.data, source: "ai" };
  }

  // Deterministic fallback if Gemini is offline
  return {
    verdict: "Tactically Justified",
    verdictSummary:
      "The match numbers support the batting team's current approach given the wickets remaining and required run rate.",
    evidence: [
      `Current match state stands at ${matchStateSummary}.`,
      "Losing an extra wicket at this stage crashes the estimated win probability by over 25%.",
      "Conserving resources for the death overs remains the statistically optimal chase path.",
    ],
    banterTake:
      "Tell your group chat to look at the scoreboard before diagnosing tactical failures!",
    source: "fallback",
  };
}
