import { describe, expect, it } from "vitest";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import {
  computeMatchState,
  computeOverSummaries,
  computeScoreboardStats,
  detectKeyMoments,
  tensionLabel,
  tensionScore,
  winProbability,
} from "@/lib/match/engine";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];

function prefix(n: number): Ball[] {
  return allBalls.filter((b) => b.n <= n);
}

describe("winProbability", () => {
  it("is 1 when nothing is needed", () => {
    expect(winProbability(0, 30, 2)).toBe(1);
  });

  it("is 0 when all out with runs still needed", () => {
    expect(winProbability(10, 30, 10)).toBe(0);
  });

  it("is 0 when no balls remain with runs still needed", () => {
    expect(winProbability(5, 0, 2)).toBe(0);
  });

  it("never increases as wickets lost increases (needed/ballsLeft fixed)", () => {
    for (const needed of [5, 20, 60, 100]) {
      for (const ballsLeft of [6, 24, 60, 90]) {
        let prev = winProbability(needed, ballsLeft, 0);
        for (let w = 1; w <= 9; w += 1) {
          const current = winProbability(needed, ballsLeft, w);
          expect(current).toBeLessThanOrEqual(prev + 1e-9);
          prev = current;
        }
      }
    }
  });

  it("never increases as balls left decreases (needed/wickets fixed)", () => {
    for (const needed of [5, 20, 60, 100]) {
      for (const wickets of [0, 3, 6, 9]) {
        let prev = winProbability(needed, 120, wickets);
        for (let ballsLeft = 119; ballsLeft >= 1; ballsLeft -= 1) {
          const current = winProbability(needed, ballsLeft, wickets);
          expect(current).toBeLessThanOrEqual(prev + 1e-9);
          prev = current;
        }
      }
    }
  });

  it("stays within [0.01, 0.99] while the match is live", () => {
    for (const needed of [1, 10, 50, 150]) {
      for (const ballsLeft of [1, 10, 60, 120]) {
        for (const wickets of [0, 5, 9]) {
          const p = winProbability(needed, ballsLeft, wickets);
          expect(p).toBeGreaterThanOrEqual(0.01);
          expect(p).toBeLessThanOrEqual(0.99);
        }
      }
    }
  });
});

describe("tensionScore / tensionLabel", () => {
  it("is low when win probability is extreme, even late in the innings", () => {
    const score = tensionScore(0.98, 110, 120, false);
    expect(score).toBeLessThan(25);
    expect(tensionLabel(score)).toBe("Calm");
  });

  it("is higher late in the innings than early, for the same balance", () => {
    const early = tensionScore(0.5, 10, 120, false);
    const late = tensionScore(0.5, 110, 120, false);
    expect(late).toBeGreaterThan(early);
  });

  it("is 100 when the match just ended", () => {
    expect(tensionScore(1, 120, 120, true)).toBe(100);
  });

  it("maps score ranges to the correct labels", () => {
    expect(tensionLabel(0)).toBe("Calm");
    expect(tensionLabel(24)).toBe("Calm");
    expect(tensionLabel(25)).toBe("Building");
    expect(tensionLabel(49)).toBe("Building");
    expect(tensionLabel(50)).toBe("Tense");
    expect(tensionLabel(74)).toBe("Tense");
    expect(tensionLabel(75)).toBe("Edge of seat");
    expect(tensionLabel(100)).toBe("Edge of seat");
  });
});

describe("computeMatchState against the bundled simulated match", () => {
  it("is 0/0 before a ball is bowled", () => {
    const state = computeMatchState([], meta);
    expect(state).toMatchObject({ runs: 0, wickets: 0, ballsBowled: 0, needed: meta.target });
  });

  it("matches the known end-of-powerplay score (46/2 after over 6)", () => {
    // n=37 is the last (6th legal) ball of over 6 — the wide in over 5 shifts
    // every later ball number by +1 relative to a plain 6-per-over count.
    const state = computeMatchState(prefix(37), meta);
    expect(state.runs).toBe(46);
    expect(state.wickets).toBe(2);
    expect(state.ballsBowled).toBe(36);
    const overSummaries = computeOverSummaries(prefix(37), meta);
    expect(overSummaries).toHaveLength(6);
    expect(overSummaries[5].endScore).toBe(46);
    expect(overSummaries[5].endWickets).toBe(2);
  });

  it("ends with Konkan Kings winning by 1 wicket off the final ball (137/9)", () => {
    const finalState = computeMatchState(allBalls, meta);
    expect(finalState.runs).toBe(137);
    expect(finalState.wickets).toBe(9);
    expect(finalState.needed).toBe(0);
    expect(finalState.winProb).toBe(1);
    expect(finalState.ballsBowled).toBe(120);
  });

  it("every ball of the simulated match is accounted for (120 legal + 2 extras)", () => {
    expect(allBalls.length).toBe(122);
    expect(allBalls.filter((b) => b.isLegal).length).toBe(120);
    expect(allBalls.filter((b) => !b.isLegal).length).toBe(2);
  });

  it("no layout-breaking state: ballsLeft and needed never go negative", () => {
    for (let n = 1; n <= allBalls.length; n += 1) {
      const state = computeMatchState(prefix(n), meta);
      expect(state.ballsLeft).toBeGreaterThanOrEqual(0);
      expect(state.needed).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("computeScoreboardStats", () => {
  it("formats overs as completed.balls and computes CRR/RRR", () => {
    const state = computeMatchState(prefix(38), meta); // n=38 is the 1st ball of over 7
    const stats = computeScoreboardStats(state);
    expect(stats.oversDisplay).toBe("6.1");
    expect(stats.crr).toBeGreaterThan(0);
    expect(stats.rrr).not.toBeNull();
  });

  it("rrr is null once the chase is over", () => {
    const state = computeMatchState(allBalls, meta);
    const stats = computeScoreboardStats(state);
    expect(stats.rrr).toBeNull();
  });
});

describe("computeOverSummaries", () => {
  it("produces exactly 20 completed overs for the full match", () => {
    const summaries = computeOverSummaries(allBalls, meta);
    expect(summaries).toHaveLength(20);
    expect(summaries[19].endScore).toBe(137);
    expect(summaries[19].endWickets).toBe(9);
  });

  it("omits an over that is not yet complete", () => {
    const summaries = computeOverSummaries(prefix(5), meta); // over 1 incomplete
    expect(summaries).toHaveLength(0);
  });
});

describe("detectKeyMoments", () => {
  const moments = detectKeyMoments(allBalls, meta);

  it("finds all 9 wickets", () => {
    expect(moments.filter((m) => m.kind === "wicket")).toHaveLength(9);
  });

  it("fires powerplay_end exactly once, at the end of over 6", () => {
    const pp = moments.filter((m) => m.kind === "powerplay_end");
    expect(pp).toHaveLength(1);
    expect(pp[0].ballNumber).toBe(37);
  });

  it("fires final_over exactly once", () => {
    expect(moments.filter((m) => m.kind === "final_over")).toHaveLength(1);
  });

  it("fires exactly one result moment, on the winning final ball", () => {
    const results = moments.filter((m) => m.kind === "result");
    expect(results).toHaveLength(1);
    expect(results[0].description).toContain("Konkan Kings win by 1 wicket");
  });

  it("flags at least one boundary with a >=5 point win-prob swing", () => {
    const boundaries = moments.filter((m) => m.kind === "boundary");
    expect(boundaries.length).toBeGreaterThan(0);
    for (const b of boundaries) expect(Math.abs(b.winProbSwing)).toBeGreaterThanOrEqual(5);
  });
});
