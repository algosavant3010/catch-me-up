import type { Ball, OverSummary } from "@/lib/match/types";

export type PredictionOutcome = "wicket" | "boundary" | "ten_plus" | "quiet_over";

export interface PredictionRecord {
  over: number;
  outcome: PredictionOutcome;
  correct: boolean;
  pointsAwarded: number;
}

export interface PredictionGameState {
  history: PredictionRecord[];
  streak: number;
  totalPoints: number;
  personalBest: number;
}

const BASE_POINTS = 10;
const MAX_STREAK_MULTIPLIER = 3;

/** Resolves every outcome that actually happened in one over, from the over's own balls. */
export function resolveOverOutcome(overBalls: Ball[], summary: OverSummary): PredictionOutcome[] {
  const outcomes: PredictionOutcome[] = [];
  if (summary.wickets > 0) outcomes.push("wicket");
  if (overBalls.some((b) => b.runs === 4 || b.runs === 6)) outcomes.push("boundary");
  if (summary.runs >= 10) outcomes.push("ten_plus");
  if (summary.runs <= 3 && summary.wickets === 0) outcomes.push("quiet_over");
  return outcomes;
}

export function initialGameState(): PredictionGameState {
  return { history: [], streak: 0, totalPoints: 0, personalBest: 0 };
}

/**
 * Pure scoring step: given the prior state, the fan's prediction for an
 * over, and the actual outcomes of that over, returns the new state. A
 * prediction is "correct" if the picked outcome is among the actual
 * outcomes for that over (an over can match more than one outcome, e.g.
 * both a wicket and 10+ runs).
 */
export function applyPrediction(
  state: PredictionGameState,
  over: number,
  picked: PredictionOutcome,
  actualOutcomes: PredictionOutcome[],
): PredictionGameState {
  const correct = actualOutcomes.includes(picked);
  // Multiplier is based on the streak built BEFORE this pick, so the first
  // correct pick always scores a flat base, and the bonus grows from there.
  const multiplier = correct ? Math.min(1 + state.streak * 0.5, MAX_STREAK_MULTIPLIER) : 0;
  const pointsAwarded = correct ? Math.round(BASE_POINTS * multiplier) : 0;
  const streak = correct ? state.streak + 1 : 0;
  const totalPoints = state.totalPoints + pointsAwarded;

  return {
    history: [...state.history, { over, outcome: picked, correct, pointsAwarded }],
    streak,
    totalPoints,
    personalBest: Math.max(state.personalBest, totalPoints),
  };
}
