import { useMemo } from "react";
import { useMatchRuntime } from "./match-context";
import { computeMatchState, computeOverSummaries, computeScoreboardStats, detectKeyMoments } from "./engine";

export function useMatchState() {
  const { meta, balls } = useMatchRuntime();
  const state = useMemo(() => computeMatchState(balls, meta), [balls, meta]);
  const stats = useMemo(() => computeScoreboardStats(state), [state]);
  const overSummaries = useMemo(() => computeOverSummaries(balls, meta), [balls, meta]);
  const keyMoments = useMemo(() => detectKeyMoments(balls, meta), [balls, meta]);
  const currentBowler = balls.length > 0 ? balls[balls.length - 1].bowler : meta.bowlingTeam.players[0];
  return { meta, balls, state, stats, overSummaries, keyMoments, currentBowler };
}
