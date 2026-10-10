import { describe, expect, it } from "vitest";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { buildFactSheet, factSheetRefUniverse } from "@/lib/ai/fact-sheet";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];

describe("buildFactSheet", () => {
  it("includes every ball number in the window for a short window", () => {
    const sheet = buildFactSheet(allBalls, meta, 1, 12);
    for (let n = 1; n <= 12; n += 1) {
      expect(sheet).toContain(`b${n} |`);
    }
  });

  it("stays under the 4000 character cap even for the full match", () => {
    const sheet = buildFactSheet(allBalls, meta, 1, 122);
    expect(sheet.length).toBeLessThanOrEqual(4000);
  });

  it("summarizes older overs and keeps recent balls in full detail for a long window", () => {
    const sheet = buildFactSheet(allBalls, meta, 1, 100);
    expect(sheet).toContain("Earlier overs in this window (summarized):");
    // The most recent balls in the window should still appear ball-by-ball.
    expect(sheet).toContain("b100 |");
  });

  it("states the current score and target", () => {
    const sheet = buildFactSheet(allBalls, meta, 1, 37);
    expect(sheet).toContain("46/2");
    expect(sheet).toContain("Need");
  });

  it("marks the match as simulated with fictional players", () => {
    const sheet = buildFactSheet(allBalls, meta, 1, 6);
    expect(sheet.toLowerCase()).toContain("simulated");
  });
});

describe("factSheetRefUniverse", () => {
  it("only contains ball numbers inside the given window", () => {
    const refs = factSheetRefUniverse(allBalls, 10, 20);
    expect(refs.has(10)).toBe(true);
    expect(refs.has(20)).toBe(true);
    expect(refs.has(9)).toBe(false);
    expect(refs.has(21)).toBe(false);
  });
});
