import type { Ball, MatchMeta } from "@/lib/match/types";
import { computeMatchState } from "@/lib/match/engine";
import { VisionSync, visionSyncGeminiSchema } from "./schemas";
import { visionSyncPrompt } from "./prompts";
import { generateVision } from "./gemini";
import { getQualityModel, TIMEOUTS } from "./config";

export interface VisionSyncResult {
  readable: boolean;
  confidence: number;
  matchedBallNumber: number | null;
  message: string;
}

const CONFIDENCE_THRESHOLD = 0.5;

/** Parses an over string like "14.3" into legal balls bowled (14*6+3 = 87). */
function parseOversToBalls(overs: string): number | null {
  const match = overs.match(/^(\d+)\.(\d)$/);
  if (!match) return null;
  return Number(match[1]) * 6 + Number(match[2]);
}

function findClosestBall(allBalls: Ball[], meta: MatchMeta, vision: VisionSync): number | null {
  if (vision.runs === null || vision.wickets === null) return null;
  const ballsFromOvers = vision.overs ? parseOversToBalls(vision.overs) : null;
  let best: { n: number; distance: number } | null = null;

  for (let i = 0; i < allBalls.length; i += 1) {
    const state = computeMatchState(allBalls.slice(0, i + 1), meta);
    const runDist = Math.abs(state.runs - vision.runs);
    const wktDist = Math.abs(state.wickets - vision.wickets) * 3;
    const overDist = ballsFromOvers !== null ? Math.abs(state.ballsBowled - ballsFromOvers) * 2 : 0;
    const distance = runDist + wktDist + overDist;
    if (!best || distance < best.distance) best = { n: allBalls[i].n, distance };
  }

  // Require a close match, not just "the least bad" ball in a 120-ball innings.
  if (best && best.distance <= 3) return best.n;
  return null;
}

export async function syncFromImage(args: {
  imageBase64: string;
  mimeType: string;
  allBalls: Ball[];
  meta: MatchMeta;
}): Promise<VisionSyncResult> {
  const model = getQualityModel();
  const { systemInstruction } = visionSyncPrompt();

  const result = await generateVision({
    task: "vision-sync",
    model,
    systemInstruction,
    imageBase64: args.imageBase64,
    mimeType: args.mimeType,
    schema: VisionSync,
    geminiSchema: visionSyncGeminiSchema,
    timeoutMs: TIMEOUTS.recapMs,
  });

  if (!result.ok) {
    return {
      readable: false,
      confidence: 0,
      matchedBallNumber: null,
      message: "Could not read the image right now. Please try again.",
    };
  }

  const vision = result.data;
  if (!vision.readable || vision.confidence < CONFIDENCE_THRESHOLD) {
    return {
      readable: false,
      confidence: vision.confidence,
      matchedBallNumber: null,
      message: "Couldn't read that clearly — try a clearer, closer photo.",
    };
  }

  const matched = findClosestBall(args.allBalls, args.meta, vision);
  if (matched === null) {
    return {
      readable: true,
      confidence: vision.confidence,
      matchedBallNumber: null,
      message: "That score doesn't match this match — try again.",
    };
  }

  return {
    readable: true,
    confidence: vision.confidence,
    matchedBallNumber: matched,
    message: "Synced!",
  };
}
