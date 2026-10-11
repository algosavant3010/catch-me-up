import { winProbability } from "./engine";

export interface SimulationResult {
  currentRuns: number;
  currentWickets: number;
  currentWinProb: number;
  currentRrr: number | null;
  simulatedRuns: number;
  simulatedWickets: number;
  newRuns: number;
  newWickets: number;
  newBallsLeft: number;
  newNeeded: number;
  newRrr: number;
  newWinProb: number;
  winProbDelta: number; // in percentage points, e.g. +14 or -28
}

export function simulateNextOver({
  currentRuns,
  currentWickets,
  currentBallsBowled,
  target,
  oversLimit,
  simulatedRuns,
  simulatedWickets,
}: {
  currentRuns: number;
  currentWickets: number;
  currentBallsBowled: number;
  target: number;
  oversLimit: number;
  simulatedRuns: number;
  simulatedWickets: number;
}): SimulationResult {
  const totalBalls = oversLimit * 6;
  const currentBallsLeft = Math.max(0, totalBalls - currentBallsBowled);
  const currentNeeded = Math.max(0, target - currentRuns);
  const currentWinProb = winProbability(currentNeeded, currentBallsLeft, currentWickets);
  const currentRrr = currentBallsLeft > 0 ? (currentNeeded * 6) / currentBallsLeft : null;

  const newRuns = currentRuns + simulatedRuns;
  const newWickets = Math.min(10, currentWickets + simulatedWickets);
  const newBallsBowled = Math.min(totalBalls, currentBallsBowled + 6);
  const newBallsLeft = Math.max(0, totalBalls - newBallsBowled);
  const newNeeded = Math.max(0, target - newRuns);
  const newRrr = newBallsLeft > 0 ? Number(((newNeeded * 6) / newBallsLeft).toFixed(1)) : 0;
  const newWinProb = winProbability(newNeeded, newBallsLeft, newWickets);

  const winProbDelta = Math.round((newWinProb - currentWinProb) * 100);

  return {
    currentRuns,
    currentWickets,
    currentWinProb: Number((currentWinProb * 100).toFixed(1)),
    currentRrr: currentRrr !== null ? Number(currentRrr.toFixed(1)) : null,
    simulatedRuns,
    simulatedWickets,
    newRuns,
    newWickets,
    newBallsLeft,
    newNeeded,
    newRrr,
    newWinProb: Number((newWinProb * 100).toFixed(1)),
    winProbDelta,
  };
}
