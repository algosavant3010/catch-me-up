import { useMemo } from "react";
import { useMatchRuntime } from "./match-context";
import {
  computeMatchState,
  computeOverSummaries,
  computeScoreboardStats,
  detectKeyMoments,
} from "./engine";

/** Drives the scoreboard/chart/tension/alerts from `displayBalls` — i.e. honours the Spoiler Shield delay. */
export function useMatchState() {
  const { meta, displayBalls: balls } = useMatchRuntime();
  const state = useMemo(() => computeMatchState(balls, meta), [balls, meta]);
  const stats = useMemo(() => computeScoreboardStats(state), [state]);
  const overSummaries = useMemo(() => computeOverSummaries(balls, meta), [balls, meta]);
  const keyMoments = useMemo(() => detectKeyMoments(balls, meta), [balls, meta]);
  const currentBowler =
    balls.length > 0 ? balls[balls.length - 1].bowler : meta.bowlingTeam.players[0];
  return { meta, balls, state, stats, overSummaries, keyMoments, currentBowler };
}
