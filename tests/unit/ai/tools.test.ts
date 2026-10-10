import { describe, expect, it } from "vitest";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { executeTool } from "@/lib/ai/tools";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];
const ctx = { allBalls, meta, cutoffBall: 37 };

describe("executeTool (Samjhao tools)", () => {
  it("getBall returns a visible ball", () => {
    const result = executeTool("getBall", { n: 10 }, ctx);
    expect(result.found).toBe(true);
    expect(result.n).toBe(10);
  });

  it("getBall refuses to leak a ball beyond the cutoff (no spoilers)", () => {
    const result = executeTool("getBall", { n: 100 }, ctx);
    expect(result.found).toBe(false);
  });

  it("getOverSummary returns a completed over within the cutoff", () => {
    const result = executeTool("getOverSummary", { over: 6 }, ctx);
    expect(result.found).toBe(true);
    expect(result.endScore).toBe(46);
  });

  it("getOverSummary returns not-found for an over beyond the cutoff", () => {
    const result = executeTool("getOverSummary", { over: 15 }, ctx);
    expect(result.found).toBe(false);
  });

  it("getBatterStats finds a batter who has faced a visible ball", () => {
    const result = executeTool("getBatterStats", { name: "Rohan Iyer" }, ctx);
    expect(result.found).toBe(true);
  });

  it("getBatterStats returns not-found for an unknown name", () => {
    const result = executeTool("getBatterStats", { name: "Nobody Here" }, ctx);
    expect(result.found).toBe(false);
  });

  it("getMatchState matches the known end-of-powerplay score", () => {
    const result = executeTool("getMatchState", {}, ctx);
    expect(result.runs).toBe(46);
    expect(result.wickets).toBe(2);
  });

  it("getWinProbAt returns not-found beyond the cutoff", () => {
    const result = executeTool("getWinProbAt", { ball: 100 }, ctx);
    expect(result.found).toBe(false);
  });

  it("getWinProbAt returns a percentage for a visible ball", () => {
    const result = executeTool("getWinProbAt", { ball: 37 }, ctx);
    expect(result.found).toBe(true);
    expect(typeof result.winProbPercent).toBe("number");
  });

  it("returns a graceful error for an unknown tool name", () => {
    const result = executeTool("deleteDatabase", {}, ctx);
    expect(result.found).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
