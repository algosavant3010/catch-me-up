import { describe, expect, it } from "vitest";
import { simulateNextOver } from "@/lib/match/simulator";

describe("Chase Simulator Engine", () => {
  it("calculates positive win probability shift when scoring above required run rate without losing wickets", () => {
    const sim = simulateNextOver({
      currentRuns: 96,
      currentWickets: 6,
      currentBallsBowled: 90, // 15 overs bowled
      target: 136,
      oversLimit: 20,
      simulatedRuns: 16, // big over: 16 runs off 6 balls
      simulatedWickets: 0,
    });

    expect(sim.newRuns).toBe(112);
    expect(sim.newWickets).toBe(6);
    expect(sim.newBallsLeft).toBe(24); // 4 overs left
    expect(sim.newNeeded).toBe(24); // need 24 off 24 balls (RRR 6.0)
    expect(sim.newRrr).toBe(6.0);
    expect(sim.winProbDelta).toBeGreaterThan(0);
  });

  it("calculates negative win probability crash when losing 2 wickets in a low-scoring over", () => {
    const sim = simulateNextOver({
      currentRuns: 96,
      currentWickets: 6,
      currentBallsBowled: 90,
      target: 136,
      oversLimit: 20,
      simulatedRuns: 2,
      simulatedWickets: 2,
    });

    expect(sim.newRuns).toBe(98);
    expect(sim.newWickets).toBe(8); // 8 down
    expect(sim.newNeeded).toBe(38); // 38 off 24 balls (RRR 9.5)
    expect(sim.newRrr).toBe(9.5);
    expect(sim.winProbDelta).toBeLessThan(0);
  });

  it("scoring more runs strictly increases or preserves win probability", () => {
    const simLow = simulateNextOver({
      currentRuns: 80,
      currentWickets: 3,
      currentBallsBowled: 60,
      target: 150,
      oversLimit: 20,
      simulatedRuns: 4,
      simulatedWickets: 0,
    });

    const simHigh = simulateNextOver({
      currentRuns: 80,
      currentWickets: 3,
      currentBallsBowled: 60,
      target: 150,
      oversLimit: 20,
      simulatedRuns: 14,
      simulatedWickets: 0,
    });

    expect(simHigh.newWinProb).toBeGreaterThan(simLow.newWinProb);
  });
});
