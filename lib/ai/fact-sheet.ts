import type { Ball, MatchMeta } from "@/lib/match/types";
import {
  computeMatchState,
  computeOverSummaries,
  computeScoreboardStats,
  detectKeyMoments,
} from "@/lib/match/engine";

const MAX_CHARS = 4000;
/** Windows up to this many balls get full ball-by-ball detail; larger windows summarize older overs. */
const FULL_DETAIL_BALL_THRESHOLD = 24;
/** When summarizing, still show this many of the most recent balls in full detail. */
const RECENT_BALLS_IN_FULL = 12;

function outcomeLabel(ball: Ball): string {
  if (ball.wicket) return "WICKET";
  if (ball.extras === "wide") return `WIDE${ball.runs > 1 ? ` +${ball.runs - 1}` : ""}`;
  if (ball.extras === "noball") return `NO-BALL${ball.runs > 1 ? ` +${ball.runs - 1}` : ""}`;
  if (ball.runs === 6) return "SIX";
  if (ball.runs === 4) return "FOUR";
  if (ball.runs === 0) return "DOT";
  return `${ball.runs} run${ball.runs === 1 ? "" : "s"}`;
}

function ballLine(ball: Ball, cumRuns: number, cumWickets: number, winProbPercent: number): string {
  return `b${ball.n} | ${ball.over}.${ball.ballInOver} | ${ball.bowler} to ${ball.batter} | ${outcomeLabel(ball)} | ${cumRuns}/${cumWickets} | win ${winProbPercent}%`;
}

/**
 * Builds the compact, ball-numbered fact sheet Gemini is allowed to restate.
 * Deterministic and derived entirely from the match engine — the model
 * never sees anything beyond what this function produces.
 */
export function buildFactSheet(
  allBalls: Ball[],
  meta: MatchMeta,
  from: number,
  to: number,
): string {
  const windowBalls = allBalls.filter((b) => b.n >= from && b.n <= to);
  const upToWindowEnd = allBalls.filter((b) => b.n <= to);
  const currentState = computeMatchState(upToWindowEnd, meta);
  const stats = computeScoreboardStats(currentState);

  const lines: string[] = [];
  lines.push(
    `Match: ${meta.battingTeam.name} chasing ${meta.target} vs ${meta.bowlingTeam.name} (${meta.firstInningsSummary}). SIMULATED match, fictional players.`,
  );
  lines.push(
    `Current state (as of ball ${to}): ${currentState.runs}/${currentState.wickets} in ${stats.oversDisplay} overs. Need ${currentState.needed} from ${currentState.ballsLeft} balls. CRR ${stats.crr}, RRR ${stats.rrr ?? "n/a"}. Win probability ${Math.round(currentState.winProb * 100)}%.`,
  );

  let detailBalls = windowBalls;
  if (windowBalls.length > FULL_DETAIL_BALL_THRESHOLD) {
    const splitIndex = Math.max(0, windowBalls.length - RECENT_BALLS_IN_FULL);
    const olderBalls = windowBalls.slice(0, splitIndex);
    detailBalls = windowBalls.slice(splitIndex);

    const oldestOver = olderBalls[0]?.over ?? 1;
    const newestOverBeforeDetail = detailBalls[0] ? detailBalls[0].over - 1 : oldestOver;
    const overSummaries = computeOverSummaries(upToWindowEnd, meta).filter(
      (o) => o.over >= oldestOver && o.over <= newestOverBeforeDetail,
    );
    if (overSummaries.length > 0) {
      lines.push("Earlier overs in this window (summarized):");
      for (const o of overSummaries) {
        lines.push(
          `over ${o.over}: ${o.runs} runs, ${o.wickets} wicket(s), ${o.bowler} bowling, score ${o.endScore}/${o.endWickets}`,
        );
      }
    }
  }

  if (detailBalls.length > 0) {
    lines.push("Ball by ball:");
    let cumRuns = currentState.runs - detailBalls.reduce((s, b) => s + b.runs, 0);
    let cumWickets = currentState.wickets - detailBalls.filter((b) => b.wicket).length;
    for (const ball of detailBalls) {
      cumRuns += ball.runs;
      cumWickets += ball.wicket ? 1 : 0;
      const prefixState = computeMatchState(
        allBalls.filter((b) => b.n <= ball.n),
        meta,
      );
      lines.push(ballLine(ball, cumRuns, cumWickets, Math.round(prefixState.winProb * 100)));
    }
  }

  const moments = detectKeyMoments(upToWindowEnd, meta).filter(
    (m) => m.ballNumber >= from && m.ballNumber <= to,
  );
  if (moments.length > 0) {
    lines.push("Key moments in this window:");
    for (const m of moments) {
      lines.push(
        `b${m.ballNumber}: ${m.description}${m.winProbSwing ? ` (win% swing ${m.winProbSwing > 0 ? "+" : ""}${m.winProbSwing})` : ""}`,
      );
    }
  }

  let sheet = lines.join("\n");
  if (sheet.length > MAX_CHARS) sheet = sheet.slice(0, MAX_CHARS);
  return sheet;
}

/** All ball numbers actually mentioned in the fact sheet's ball-by-ball section — used by the verifier. */
export function factSheetRefUniverse(allBalls: Ball[], from: number, to: number): Set<number> {
  return new Set(allBalls.filter((b) => b.n >= from && b.n <= to).map((b) => b.n));
}
