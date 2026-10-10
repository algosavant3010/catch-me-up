/**
 * Core domain types for the match engine. These are intentionally plain data
 * shapes (no classes) so the engine stays pure and trivially testable.
 */

export type ExtraType = "wide" | "noball" | "bye" | "legbye";

export interface Ball {
  /** 1-based, unique id across the whole innings. */
  n: number;
  /** 1-based over number. */
  over: number;
  /** Position of this delivery within the over (legal-ball position; a wide/no-ball shares the upcoming legal position). */
  ballInOver: number;
  /** Total runs added to the team score by this delivery (bat runs + any extra runs). */
  runs: number;
  wicket: boolean;
  batter: string;
  bowler: string;
  /** Cumulative individual score of the batter on strike, after this delivery. */
  batterRunsAfter: number;
  extras?: ExtraType;
  /** True for balls that do not count toward the 6-ball over (wide/no-ball). */
  isLegal: boolean;
}

export interface CreaseBatter {
  name: string;
  runs: number;
  balls: number;
  onStrike: boolean;
}

export interface MatchState {
  ballsBowled: number;
  runs: number;
  wickets: number;
  target: number;
  needed: number;
  ballsLeft: number;
  /** 0-1 probability the chasing team wins from this position. */
  winProb: number;
  /** 0-100 tension score. */
  tension: number;
  crease: CreaseBatter[];
}

export type TensionLabel = "Calm" | "Building" | "Tense" | "Edge of seat";

export interface Team {
  name: string;
  players: string[];
}

export interface MatchMeta {
  id: string;
  /** Always true: this is a fictional, clearly-labelled simulated match, never real data. */
  isSimulated: true;
  venue: string;
  battingTeam: Team;
  bowlingTeam: Team;
  /** Runs required to win (first innings score + 1). */
  target: number;
  oversLimit: number;
  firstInningsSummary: string;
}

export interface KeyMoment {
  ballNumber: number;
  kind: "wicket" | "boundary" | "powerplay_end" | "final_over" | "result";
  winProbSwing: number;
  description: string;
}

export interface OverSummary {
  over: number;
  runs: number;
  wickets: number;
  bowler: string;
  endScore: number;
  endWickets: number;
}

/**
 * Pluggable source of ball-by-ball data.
 * - SimulatedProvider: our fixed, fictional, deterministic chase (default).
 * - ReplayProvider: generic player for any ball-by-ball log in our Ball[] shape.
 * - LiveProviderStub: documents the integration point for a real feed; not implemented.
 */
export interface MatchProvider {
  getMeta(): Promise<MatchMeta>;
  /** Starts streaming balls one at a time; returns an unsubscribe function. */
  stream(onBall: (b: Ball) => void): () => void;
  /** Synchronous slice of already-known balls, inclusive of `from`, exclusive of `to`. */
  getBalls(from: number, to: number): Ball[];
}
