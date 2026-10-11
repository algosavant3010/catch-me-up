import { z } from "zod";
import { Type, type Schema } from "@google/genai";
import { generateStructured } from "./gemini";
import { getQualityModel, TIMEOUTS } from "./config";

export const FantasyImpactSchema = z.object({
  headline: z.string().min(5).max(120),
  captainVerdict: z.string().min(10).max(250),
  differentialPick: z.string().min(10).max(250),
  fantasyAdvice: z.string().min(10).max(250),
});

export type FantasyImpactResponse = z.infer<typeof FantasyImpactSchema> & {
  source: "ai" | "fallback";
};

const geminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: "Punchy fantasy impact headline" },
    captainVerdict: { type: Type.STRING, description: "Analysis of the match's top captain pick" },
    differentialPick: {
      type: Type.STRING,
      description: "Low-ownership sleeper pick that swung contests",
    },
    fantasyAdvice: { type: Type.STRING, description: "Actionable fantasy takeaway from this phase" },
  },
  required: ["headline", "captainVerdict", "differentialPick", "fantasyAdvice"],
};

export async function getFantasyImpact({
  mvpName,
  mvpPoints,
  topPerformers,
  matchSituation,
}: {
  mvpName: string;
  mvpPoints: number;
  topPerformers: { name: string; totalPoints: number; breakdown: string }[];
  matchSituation: string;
}): Promise<FantasyImpactResponse> {
  const systemInstruction = `You are the chief Dream11 fantasy cricket analyst.
Given the current live match state and fantasy points leaderboard, provide sharp, insightful fantasy takeaways.
Be concise, analytical, and authoritative. Reference points and match context accurately.
Do NOT invent fake numbers. Rely solely on the provided player data and match situation.`;

  const userContent = `Match Situation: ${matchSituation}
Current Fantasy MVP: ${mvpName} (${mvpPoints} pts)
Top Performers:
${topPerformers.map((p, i) => `${i + 1}. ${p.name}: ${p.totalPoints} pts (${p.breakdown})`).join("\n")}`;

  const res = await generateStructured({
    task: "fantasy-impact",
    model: getQualityModel(),
    systemInstruction,
    userContent,
    schema: FantasyImpactSchema,
    geminiSchema,
    timeoutMs: TIMEOUTS.quickMs,
    temperature: 0.2,
  });

  if (res.ok) {
    return { ...res.data, source: "ai" };
  }

  // Deterministic fallback if Gemini is offline or rate-limited
  const diff = topPerformers[1] ?? topPerformers[0];
  return {
    headline: `${mvpName} leads Dream11 impact with ${mvpPoints} points`,
    captainVerdict: `${mvpName} is currently the standout captain choice, capitalizing on high-leverage match moments to rack up ${mvpPoints} fantasy points.`,
    differentialPick: diff
      ? `${diff.name} (${diff.totalPoints} pts) acts as the key differential contributor with ${diff.breakdown}.`
      : `${mvpName} remains the primary contest-winning pick.`,
    fantasyAdvice:
      "In the death overs, boundary hitters and bowlers taking wickets yield the highest fantasy points-per-ball returns.",
    source: "fallback",
  };
}
