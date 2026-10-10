import type {
  Ball,
  CreaseBatter,
  KeyMoment,
  MatchMeta,
  MatchState,
  OverSummary,
  TensionLabel,
} from "./types";

const BALLS_PER_OVER = 6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Win probability for the chasing team, given runs still needed, legal
 * balls remaining, and wickets lost so far.
 *
 * Model: logistic function of (wickets in hand) and (required run rate).
 * Coefficients are hand-tuned so that a comfortable chase (RRR ~6, full
 * wickets in hand) sits around 70-85%, and a near-impossible one (RRR > 12,
 * few wickets left) approaches the floor.
 *
 * Guaranteed monotonic properties (see tests/unit/engine.test.ts):
 *  - Holding runs needed and balls left fixed, losing a wicket never
 *    increases win probability.
 *  - Holding runs needed and wickets fixed, fewer balls left never
 *    increases win probability (because the required run rate strictly
 *    increases as balls left decreases, for needed > 0).
 *
 * Limits: this is a simple, explainable heuristic, not a trained model. It
 * does not account for who specifically is batting/bowling, pitch
 * conditions, or momentum beyond the raw numbers. Probabilities are clamped
 * to [0.01, 0.99] while the match is live — only a completed result can be
 * 0% or 100%.
 */
export function winProbability(needed: number, ballsLeft: number, wicketsLost: number): number {
  if (needed <= 0) return 1;
  if (wicketsLost >= 10) return 0;
  if (ballsLeft <= 0) return 0;

  const wicketsInHand = clamp(10 - wicketsLost, 0, 10);
  const requiredRunRate = (needed * BALLS_PER_OVER) / ballsLeft;

  const logit = 0.55 * wicketsInHand - 0.9 * requiredRunRate + 3.2;
  const raw = 1 / (1 + Math.exp(-logit));
  return clamp(raw, 0.01, 0.99);
}

/**
 * 0-100 tension score. Combines how close the win probability is to 50/50
 * with how far into the innings we are — a 50/50 situation in over 2 is not
 * yet "edge of seat" the way it is in over 19.
 */
export function tensionScore(
  winProb: number,
  ballsBowled: number,
  totalLegalBalls: number,
  matchJustEnded = false,
): number {
  if (matchJustEnded) return 100;
  const balance = 1 - Math.abs(winProb - 0.5) * 2; // 1 at 50/50, 0 when certain
  const progress = clamp(ballsBowled / totalLegalBalls, 0, 1);
  const score = 100 * balance * (0.35 + 0.65 * progress);
  return Math.round(clamp(score, 0, 100));
}

export function tensionLabel(score: number): TensionLabel {
  if (score >= 75) return "Edge of seat";
  if (score >= 50) return "Tense";
  if (score >= 25) return "Building";
  return "Calm";
}

/**
 * Replays the batting order against the ball log to reconstruct who is at
 * the crease at any point. Driven only by `Ball[]` + `MatchMeta`, so it
 * works for any provider, not just our bundled simulated match.
 */
export function deriveCrease(balls: Ball[], meta: MatchMeta): CreaseBatter[] {
  const order = meta.battingTeam.players;
  let active: [string, string] = [order[0], order[1]];
  let strikerIndex: 0 | 1 = 0;
  let nextEntrant = 2;
  const runsByBatter = new Map<string, number>();
  const ballsByBatter = new Map<string, number>();

  for (const ball of balls) {
    runsByBatter.set(ball.batter, ball.batterRunsAfter);
    if (ball.isLegal) {
      ballsByBatter.set(ball.batter, (ballsByBatter.get(ball.batter) ?? 0) + 1);
    }

    if (ball.wicket) {
      const incoming = order[nextEntrant];
      nextEntrant += 1;
      active = strikerIndex === 0 ? [incoming, active[1]] : [active[0], incoming];
      runsByBatter.set(incoming, 0);
      // Incoming batter takes strike immediately; no rotation on a wicket ball.
      continue;
    }

    if (ball.isLegal && ball.runs % 2 === 1) {
      strikerIndex = strikerIndex === 0 ? 1 : 0;
    }
  }

  return [0, 1].map((i) => {
    const name = active[i as 0 | 1];
    return {
      name,
      runs: runsByBatter.get(name) ?? 0,
      balls: ballsByBatter.get(name) ?? 0,
      onStrike: i === strikerIndex,
    };
  });
}

/** Full match state as of the end of the given ball log (a prefix of the innings). */
export function computeMatchState(balls: Ball[], meta: MatchMeta): MatchState {
  const totalLegalBalls = meta.oversLimit * BALLS_PER_OVER;
  const runs = balls.reduce((sum, b) => sum + b.runs, 0);
  const wickets = balls.filter((b) => b.wicket).length;
  const ballsBowled = balls.filter((b) => b.isLegal).length;
  const needed = Math.max(meta.target - runs, 0);
  const ballsLeft = Math.max(totalLegalBalls - ballsBowled, 0);
  const matchJustEnded = needed === 0 || wickets >= 10 || (ballsLeft === 0 && balls.length > 0);
  const winProb = winProbability(needed, ballsLeft, wickets);

  return {
    ballsBowled,
    runs,
    wickets,
    target: meta.target,
    needed,
    ballsLeft,
    winProb,
    tension: tensionScore(winProb, ballsBowled, totalLegalBalls, matchJustEnded && needed === 0),
    crease: wickets >= 10 || balls.length === 0 ? [] : deriveCrease(balls, meta),
  };
}

export interface ScoreboardStats {
  oversDisplay: string;
  crr: number;
  rrr: number | null;
}

export function computeScoreboardStats(state: MatchState): ScoreboardStats {
  const completedOvers = Math.floor(state.ballsBowled / BALLS_PER_OVER);
  const ballsIntoOver = state.ballsBowled % BALLS_PER_OVER;
  const oversDisplay = `${completedOvers}.${ballsIntoOver}`;
  const crr = state.ballsBowled > 0 ? (state.runs / state.ballsBowled) * BALLS_PER_OVER : 0;
  const rrr = state.ballsLeft > 0 ? (state.needed * BALLS_PER_OVER) / state.ballsLeft : null;
  return { oversDisplay, crr: round1(crr), rrr: rrr === null ? null : round1(rrr) };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Per-over summaries (runs, wickets, bowler, running score) for completed overs in the given log. */
export function computeOverSummaries(balls: Ball[], meta: MatchMeta): OverSummary[] {
  const byOver = new Map<number, Ball[]>();
  for (const ball of balls) {
    const list = byOver.get(ball.over) ?? [];
    list.push(ball);
    byOver.set(ball.over, list);
  }

  const summaries: OverSummary[] = [];
  let cumRuns = 0;
  let cumWickets = 0;
  const maxOver = Math.min(meta.oversLimit, Math.max(0, ...byOver.keys()));
  for (let over = 1; over <= maxOver; over += 1) {
    const overBalls = byOver.get(over) ?? [];
    const legalCount = overBalls.filter((b) => b.isLegal).length;
    if (legalCount < BALLS_PER_OVER) break; // over not yet complete
    const runs = overBalls.reduce((sum, b) => sum + b.runs, 0);
    const wickets = overBalls.filter((b) => b.wicket).length;
    cumRuns += runs;
    cumWickets += wickets;
    summaries.push({
      over,
      runs,
      wickets,
      bowler: overBalls[0].bowler,
      endScore: cumRuns,
      endWickets: cumWickets,
    });
  }
  return summaries;
}

/**
 * Everything the proof drawer needs to show for one ball: the ball itself,
 * the team score immediately after it, and the win-probability swing it
 * caused. Used by the Catch Me Up proof chips — every ref a fan taps opens
 * exactly this, computed from the engine, never from AI output.
 */
export interface BallProof {
  ball: Ball;
  scoreAfter: { runs: number; wickets: number };
  winProbBefore: number;
  winProbAfter: number;
}

export function getBallProof(
  allBalls: Ball[],
  meta: MatchMeta,
  ballNumber: number,
): BallProof | null {
  const index = allBalls.findIndex((b) => b.n === ballNumber);
  if (index === -1) return null;
  const before = computeMatchState(allBalls.slice(0, index), meta);
  const after = computeMatchState(allBalls.slice(0, index + 1), meta);
  return {
    ball: allBalls[index],
    scoreAfter: { runs: after.runs, wickets: after.wickets },
    winProbBefore: before.winProb,
    winProbAfter: after.winProb,
  };
}

/**
 * Detects high-impact key moments by replaying the innings ball by ball and
 * comparing win probability before/after each delivery. Matches F8's rule:
 * wickets, boundaries that swing win probability by >= 5 points, powerplay
 * end, start of the final over, and the result.
 */
export function detectKeyMoments(balls: Ball[], meta: MatchMeta): KeyMoment[] {
  const moments: KeyMoment[] = [];
  const totalLegalBalls = meta.oversLimit * BALLS_PER_OVER;
  let prevState = computeMatchState([], meta);
  let legalSeen = 0;
  let powerplayAlerted = false;
  let finalOverAlerted = false;

  for (let i = 0; i < balls.length; i += 1) {
    const prefix = balls.slice(0, i + 1);
    const ball = balls[i];
    const state = computeMatchState(prefix, meta);
    const swing = (state.winProb - prevState.winProb) * 100;

    if (ball.isLegal) legalSeen += 1;

    if (ball.wicket) {
      moments.push({
        ballNumber: ball.n,
        kind: "wicket",
        winProbSwing: round1(swing),
        description: `${ball.batter} is out, bowled by ${ball.bowler}.`,
      });
    } else if ((ball.runs === 4 || ball.runs === 6) && Math.abs(swing) >= 5) {
      moments.push({
        ballNumber: ball.n,
        kind: "boundary",
        winProbSwing: round1(swing),
        description: `${ball.batter} hits a ${ball.runs === 6 ? "six" : "four"} off ${ball.bowler}.`,
      });
    }

    if (!powerplayAlerted && legalSeen >= 36) {
      powerplayAlerted = true;
      moments.push({
        ballNumber: ball.n,
        kind: "powerplay_end",
        winProbSwing: 0,
        description: "Powerplay ends.",
      });
    }

    if (!finalOverAlerted && legalSeen >= totalLegalBalls - BALLS_PER_OVER + 1) {
      finalOverAlerted = true;
      moments.push({
        ballNumber: ball.n,
        kind: "final_over",
        winProbSwing: 0,
        description: "Final over begins.",
      });
    }

    if (state.needed === 0 || state.wickets >= 10 || state.ballsLeft === 0) {
      moments.push({
        ballNumber: ball.n,
        kind: "result",
        winProbSwing: round1(swing),
        description:
          state.needed === 0
            ? `${meta.battingTeam.name} win by ${10 - state.wickets} wicket${10 - state.wickets === 1 ? "" : "s"}.`
            : `${meta.bowlingTeam.name} win.`,
      });
      break;
    }

    prevState = state;
  }

  return moments;
}
