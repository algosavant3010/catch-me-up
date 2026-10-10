import { z } from "zod";
import { Type, type Schema } from "@google/genai";

/**
 * Zod schemas are the source of truth for TypeScript types and for
 * post-response validation. The matching `*GeminiSchema` consts below are
 * hand-written (not auto-converted) because Gemini's `responseSchema` only
 * supports a restricted subset of JSON Schema/OpenAPI — hand-writing keeps
 * every field within that subset deliberately.
 */

// ---------------------------------------------------------------------------
// Recap (Catch Me Up)
// ---------------------------------------------------------------------------

export const RecapLineKind = z.enum(["what_happened", "where_it_stands", "why_it_matters"]);

export const Recap = z.object({
  headline: z.string().max(90),
  lines: z
    .array(
      z.object({
        kind: RecapLineKind,
        text: z.string().max(220),
        refs: z.array(z.number().int()).max(4),
      }),
    )
    .min(1)
    .max(3),
});
export type Recap = z.infer<typeof Recap>;

export const recapGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    lines: {
      type: Type.ARRAY,
      minItems: "1",
      maxItems: "3",
      items: {
        type: Type.OBJECT,
        properties: {
          kind: { type: Type.STRING, enum: ["what_happened", "where_it_stands", "why_it_matters"] },
          text: { type: Type.STRING },
          refs: { type: Type.ARRAY, items: { type: Type.INTEGER }, maxItems: "4" },
        },
        required: ["kind", "text", "refs"],
        propertyOrdering: ["kind", "text", "refs"],
      },
    },
  },
  required: ["headline", "lines"],
  propertyOrdering: ["headline", "lines"],
};

// ---------------------------------------------------------------------------
// Samjhao (ask the match)
// ---------------------------------------------------------------------------

export const AskAnswer = z.object({
  answer: z.string().max(420),
  refs: z.array(z.number().int()).max(6),
  onTopic: z.boolean(),
});
export type AskAnswer = z.infer<typeof AskAnswer>;

export const askAnswerGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING },
    refs: { type: Type.ARRAY, items: { type: Type.INTEGER }, maxItems: "6" },
    onTopic: { type: Type.BOOLEAN },
  },
  required: ["answer", "refs", "onTopic"],
  propertyOrdering: ["answer", "refs", "onTopic"],
};

// ---------------------------------------------------------------------------
// Chat Pulse
// ---------------------------------------------------------------------------

export const ChatMood = z.enum(["hype", "tense", "frustrated", "joking", "mixed"]);

export const ChatPulse = z.object({
  topTakes: z.array(z.string().max(140)).length(3),
  mood: ChatMood,
  hypeScore: z.number().min(0).max(100),
  standoutMessage: z.string().max(200),
});
export type ChatPulse = z.infer<typeof ChatPulse>;

export const chatPulseGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topTakes: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: "3", maxItems: "3" },
    mood: { type: Type.STRING, enum: ["hype", "tense", "frustrated", "joking", "mixed"] },
    hypeScore: { type: Type.NUMBER },
    standoutMessage: { type: Type.STRING },
  },
  required: ["topTakes", "mood", "hypeScore", "standoutMessage"],
  propertyOrdering: ["topTakes", "mood", "hypeScore", "standoutMessage"],
};

// ---------------------------------------------------------------------------
// Explain-over
// ---------------------------------------------------------------------------

export const ExplainOver = z.object({
  explanation: z.string().max(220),
  refs: z.array(z.number().int()).max(6),
});
export type ExplainOver = z.infer<typeof ExplainOver>;

export const explainOverGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    explanation: { type: Type.STRING },
    refs: { type: Type.ARRAY, items: { type: Type.INTEGER }, maxItems: "6" },
  },
  required: ["explanation", "refs"],
  propertyOrdering: ["explanation", "refs"],
};

// ---------------------------------------------------------------------------
// Snap the TV (vision sync)
// ---------------------------------------------------------------------------

export const VisionSync = z.object({
  readable: z.boolean(),
  runs: z.number().int().min(0).max(999).nullable(),
  wickets: z.number().int().min(0).max(10).nullable(),
  overs: z.string().max(10).nullable(),
  confidence: z.number().min(0).max(1),
});
export type VisionSync = z.infer<typeof VisionSync>;

export const visionSyncGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    readable: { type: Type.BOOLEAN },
    runs: { type: Type.INTEGER, nullable: true },
    wickets: { type: Type.INTEGER, nullable: true },
    overs: { type: Type.STRING, nullable: true },
    confidence: { type: Type.NUMBER },
  },
  required: ["readable", "runs", "wickets", "overs", "confidence"],
  propertyOrdering: ["readable", "runs", "wickets", "overs", "confidence"],
};

// ---------------------------------------------------------------------------
// Function-calling tool result shapes (Samjhao)
// ---------------------------------------------------------------------------

export const BallToolResult = z.object({
  n: z.number().int(),
  over: z.number().int(),
  ballInOver: z.number().int(),
  runs: z.number().int(),
  wicket: z.boolean(),
  batter: z.string(),
  bowler: z.string(),
  batterRunsAfter: z.number().int(),
  extras: z.string().nullable(),
});

export const OverSummaryToolResult = z.object({
  over: z.number().int(),
  runs: z.number().int(),
  wickets: z.number().int(),
  bowler: z.string(),
  endScore: z.number().int(),
  endWickets: z.number().int(),
});

export const BatterStatsToolResult = z.object({
  name: z.string(),
  runs: z.number().int(),
  balls: z.number().int(),
  found: z.boolean(),
});

export const MatchStateToolResult = z.object({
  ballsBowled: z.number().int(),
  runs: z.number().int(),
  wickets: z.number().int(),
  target: z.number().int(),
  needed: z.number().int(),
  ballsLeft: z.number().int(),
  winProbPercent: z.number(),
});

export const WinProbAtToolResult = z.object({
  ball: z.number().int(),
  winProbPercent: z.number(),
  found: z.boolean(),
});
