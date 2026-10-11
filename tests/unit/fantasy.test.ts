import { describe, expect, it } from "vitest";
import { computeFantasyScores } from "@/lib/fantasy/scoring";
import type { Ball } from "@/lib/match/types";

describe("Dream11 Fantasy Points Engine", () => {
  it("calculates batter points including boundary bonuses and milestones", () => {
    const balls: Ball[] = [
      {
        n: 1,
        over: 1,
        ballInOver: 1,
        runs: 4,
        wicket: false,
        batter: "Rohan Iyer",
        bowler: "Trent Walsh",
        batterRunsAfter: 4,
        isLegal: true,
      },
      {
        n: 2,
        over: 1,
        ballInOver: 2,
        runs: 6,
        wicket: false,
        batter: "Rohan Iyer",
        bowler: "Trent Walsh",
        batterRunsAfter: 10,
        isLegal: true,
      },
      {
        n: 3,
        over: 1,
        ballInOver: 3,
        runs: 1,
        wicket: false,
        batter: "Rohan Iyer",
        bowler: "Trent Walsh",
        batterRunsAfter: 11,
        isLegal: true,
      },
    ];

    const result = computeFantasyScores(balls);
    const iyer = result.batters.find((b) => b.name === "Rohan Iyer");

    expect(iyer).toBeDefined();
    expect(iyer?.runs).toBe(11);
    expect(iyer?.fours).toBe(1);
    expect(iyer?.sixes).toBe(1);
    // 11 runs (11) + 1 four (1) + 1 six (2) = 14 points
    expect(iyer?.points.total).toBe(14);
  });

  it("calculates bowler points including wickets and economy rate", () => {
    const balls: Ball[] = [
      {
        n: 1,
        over: 1,
        ballInOver: 1,
        runs: 0,
        wicket: true,
        batter: "Rohan Iyer",
        bowler: "Marcus Boyd",
        batterRunsAfter: 0,
        isLegal: true,
      },
      {
        n: 2,
        over: 1,
        ballInOver: 2,
        runs: 0,
        wicket: false,
        batter: "Vikram Shah",
        bowler: "Marcus Boyd",
        batterRunsAfter: 0,
        isLegal: true,
      },
    ];

    const result = computeFantasyScores(balls);
    const boyd = result.bowlers.find((b) => b.name === "Marcus Boyd");

    expect(boyd).toBeDefined();
    expect(boyd?.wickets).toBe(1);
    // 1 wicket = 25 points
    expect(boyd?.points.wicketPoints).toBe(25);
  });

  it("identifies the fantasy MVP with the highest combined points", () => {
    const balls: Ball[] = [
      {
        n: 1,
        over: 1,
        ballInOver: 1,
        runs: 0,
        wicket: true,
        batter: "Rohan Iyer",
        bowler: "Marcus Boyd",
        batterRunsAfter: 0,
        isLegal: true,
      },
      {
        n: 2,
        over: 1,
        ballInOver: 2,
        runs: 1,
        wicket: false,
        batter: "Vikram Shah",
        bowler: "Marcus Boyd",
        batterRunsAfter: 1,
        isLegal: true,
      },
    ];

    const result = computeFantasyScores(balls);
    expect(result.mvp?.name).toBe("Marcus Boyd");
    expect(result.mvp?.totalPoints).toBe(25);
  });
});
