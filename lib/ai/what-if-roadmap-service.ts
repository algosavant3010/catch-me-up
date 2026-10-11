import { z } from "zod";
import { Type, type Schema } from "@google/genai";
import { generateStructured } from "./gemini";
import { getQualityModel, TIMEOUTS } from "./config";

export const WhatIfRoadmapSchema = z.object({
  scenarioHeadline: z.string().min(5).max(120),
  coachAdvice: z.string().min(10).max(250),
  controlledPath: z.string().min(10).max(250),
  riskFactor: z.string().min(10).max(200),
});

export type WhatIfRoadmapResponse = z.infer<typeof WhatIfRoadmapSchema> & {
  source: "ai" | "fallback";
};

const geminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scenarioHeadline: { type: Type.STRING, description: "Punchy evaluation of the simulated scenario" },
    coachAdvice: { type: Type.STRING, description: "Actionable strategic coaching takeaway" },
    controlledPath: {
      type: Type.STRING,
      description: "Specific ball-by-ball tactical template (singles vs boundaries needed)",
    },
    riskFactor: {
      type: Type.STRING,
      description: "Key hazards, bowler matchups, and conditions to respect",
    },
  },
  required: ["scenarioHeadline", "coachAdvice", "controlledPath", "riskFactor"],
};

export async function getWhatIfRoadmap({
  scenarioSummary,
  teamName,
}: {
  scenarioSummary: string;
  teamName: string;
}): Promise<WhatIfRoadmapResponse> {
  const systemInstruction = `You are a world-class T20 cricket batting coach and chase tactician.
Given a fan's "What-If" simulated over scenario (runs scored, wickets lost, required rate change, win probability shift), formulate an elite tactical blueprint.
Give precise, realistic advice on risk management, singles rotation, and boundary targets.
Never invent imaginary match parameters. Keep the guidance punchy and professional.`;

  const userContent = `Team Chasing: ${teamName}
Simulation Context:
${scenarioSummary}`;

  const res = await generateStructured({
    task: "what-if-roadmap",
    model: getQualityModel(),
    systemInstruction,
    userContent,
    schema: WhatIfRoadmapSchema,
    geminiSchema,
    timeoutMs: TIMEOUTS.quickMs,
    temperature: 0.2,
  });

  if (res.ok) {
    return { ...res.data, source: "ai" };
  }

  // Deterministic fallback
  return {
    scenarioHeadline: "Controlled Chase Path",
    coachAdvice:
      "Maintain a steady boundary-per-over strategy and run hard on singles to avoid elevating the required rate.",
    controlledPath:
      "Aim for 1 boundary and 4 rotated singles per over to steadily lower the target without exposing the lower order.",
    riskFactor: "Losing a wicket before over 18 severely dampens the chase probability.",
    source: "fallback",
  };
}
