import { Type, type FunctionDeclaration } from "@google/genai";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { computeMatchState, computeOverSummaries, winProbability } from "@/lib/match/engine";

/**
 * Samjhao's tools. Every tool is scoped to `cutoffBall` — the ball the fan
 * has actually seen so far — so the model can never retrieve or leak a
 * future event (no spoilers), matching the match engine as the sole source
 * of truth. All tools are pure and return `found: false` instead of
 * throwing when the request doesn't resolve to real data.
 */

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "getBall",
    description: "Gets the full detail of one specific ball by its number.",
    parameters: {
      type: Type.OBJECT,
      properties: { n: { type: Type.INTEGER, description: "Ball number, e.g. 37" } },
      required: ["n"],
    },
  },
  {
    name: "getOverSummary",
    description: "Gets the runs, wickets and bowler for one completed over.",
    parameters: {
      type: Type.OBJECT,
      properties: { over: { type: Type.INTEGER, description: "Over number, 1-20" } },
      required: ["over"],
    },
  },
  {
    name: "getBatterStats",
    description: "Gets a batter's current runs and balls faced, by exact name.",
    parameters: {
      type: Type.OBJECT,
      properties: { name: { type: Type.STRING, description: "Exact batter name" } },
      required: ["name"],
    },
  },
  {
    name: "getMatchState",
    description: "Gets the current score, wickets, target, required rate and win probability.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "getWinProbAt",
    description: "Gets the win probability percentage immediately after a specific ball.",
    parameters: {
      type: Type.OBJECT,
      properties: { ball: { type: Type.INTEGER, description: "Ball number" } },
      required: ["ball"],
    },
  },
];

export interface ToolContext {
  allBalls: Ball[];
  meta: MatchMeta;
  cutoffBall: number;
}

function visibleBalls(ctx: ToolContext): Ball[] {
  return ctx.allBalls.filter((b) => b.n <= ctx.cutoffBall);
}

export function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Record<string, unknown> {
  const visible = visibleBalls(ctx);

  switch (name) {
    case "getBall": {
      const n = Number(args.n);
      const ball = visible.find((b) => b.n === n);
      if (!ball) return { found: false };
      return { found: true, ...ball };
    }
    case "getOverSummary": {
      const over = Number(args.over);
      const summary = computeOverSummaries(visible, ctx.meta).find((o) => o.over === over);
      if (!summary) return { found: false };
      return { found: true, ...summary };
    }
    case "getBatterStats": {
      const name = String(args.name ?? "");
      const ballsFaced = visible.filter((b) => b.batter === name && b.isLegal);
      if (ballsFaced.length === 0) return { found: false, name };
      const last = [...visible].reverse().find((b) => b.batter === name);
      return { found: true, name, runs: last?.batterRunsAfter ?? 0, balls: ballsFaced.length };
    }
    case "getMatchState": {
      const state = computeMatchState(visible, ctx.meta);
      return {
        ballsBowled: state.ballsBowled,
        runs: state.runs,
        wickets: state.wickets,
        target: state.target,
        needed: state.needed,
        ballsLeft: state.ballsLeft,
        winProbPercent: Math.round(state.winProb * 100),
      };
    }
    case "getWinProbAt": {
      const ballNumber = Number(args.ball);
      if (!visible.some((b) => b.n === ballNumber)) return { found: false };
      const prefix = visible.filter((b) => b.n <= ballNumber);
      const state = computeMatchState(prefix, ctx.meta);
      return {
        found: true,
        ball: ballNumber,
        winProbPercent: Math.round(
          winProbability(state.needed, state.ballsLeft, state.wickets) * 100,
        ),
      };
    }
    default:
      return { found: false, error: `Unknown tool: ${name}` };
  }
}
