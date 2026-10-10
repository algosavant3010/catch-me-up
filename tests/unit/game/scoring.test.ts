import { describe, expect, it } from "vitest";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { computeOverSummaries } from "@/lib/match/engine";
import { applyPrediction, initialGameState, resolveOverOutcome } from "@/lib/game/scoring";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];
const overSummaries = computeOverSummaries(allBalls, meta);

function ballsForOver(over: number): Ball[] {
  return allBalls.filter((b) => b.over === over);
}

describe("resolveOverOutcome", () => {
  it("detects a wicket over (over 2 has 1 wicket)", () => {
    const outcomes = resolveOverOutcome(ballsForOver(2), overSummaries[1]);
    expect(outcomes).toContain("wicket");
  });

  it("detects a boundary over (over 4 has a four and a six)", () => {
    const outcomes = resolveOverOutcome(ballsForOver(4), overSummaries[3]);
    expect(outcomes).toContain("boundary");
  });

  it("detects a 10+ runs over (over 4 scored 12)", () => {
    const outcomes = resolveOverOutcome(ballsForOver(4), overSummaries[3]);
    expect(outcomes).toContain("ten_plus");
  });

  it("detects a quiet over (over 7 scored 1, no wicket)", () => {
    const outcomes = resolveOverOutcome(ballsForOver(7), overSummaries[6]);
    expect(outcomes).toEqual(["quiet_over"]);
  });

  it("an over can match multiple outcomes at once (wicket AND 10+ is possible in general)", () => {
    // Synthetic sanity check independent of our specific match data.
    const outcomes = resolveOverOutcome([], {
      over: 1,
      runs: 11,
      wickets: 1,
      bowler: "x",
      endScore: 11,
      endWickets: 1,
    });
    expect(outcomes).toEqual(["wicket", "ten_plus"]);
  });
});

describe("applyPrediction", () => {
  it("awards base points for a correct first prediction", () => {
    const state = applyPrediction(initialGameState(), 1, "wicket", ["wicket"]);
    expect(state.totalPoints).toBe(10);
    expect(state.streak).toBe(1);
  });

  it("awards zero points and resets streak for a wrong prediction", () => {
    const after1 = applyPrediction(initialGameState(), 1, "wicket", ["wicket"]);
    const after2 = applyPrediction(after1, 2, "quiet_over", ["boundary"]);
    expect(after2.streak).toBe(0);
    expect(after2.totalPoints).toBe(10); // unchanged from the previous correct pick
  });

  it("applies a growing streak multiplier for consecutive correct picks", () => {
    let state = initialGameState();
    state = applyPrediction(state, 1, "wicket", ["wicket"]); // 1st correct -> x1 -> 10
    state = applyPrediction(state, 2, "wicket", ["wicket"]); // 2nd correct -> x1.5 -> 15
    expect(state.totalPoints).toBe(10 + 15);
    expect(state.streak).toBe(2);
  });

  it("caps the streak multiplier", () => {
    let state = initialGameState();
    for (let i = 0; i < 10; i += 1) state = applyPrediction(state, i, "wicket", ["wicket"]);
    const before = state.totalPoints;
    state = applyPrediction(state, 11, "wicket", ["wicket"]);
    expect(state.totalPoints - before).toBe(30); // BASE_POINTS * MAX_STREAK_MULTIPLIER
  });

  it("tracks personal best as the running total, never decreasing", () => {
    let state = applyPrediction(initialGameState(), 1, "wicket", ["wicket"]);
    expect(state.personalBest).toBe(10);
    state = applyPrediction(state, 2, "quiet_over", ["boundary"]); // wrong, 0 points
    expect(state.personalBest).toBe(10);
  });

  it("records full prediction history", () => {
    const state = applyPrediction(initialGameState(), 5, "boundary", ["boundary", "ten_plus"]);
    expect(state.history).toHaveLength(1);
    expect(state.history[0]).toMatchObject({ over: 5, outcome: "boundary", correct: true });
  });
});
