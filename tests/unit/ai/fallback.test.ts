import { describe, expect, it } from "vitest";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { buildFallbackRecap } from "@/lib/ai/fallback";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];

describe("buildFallbackRecap", () => {
  it("never cites any refs (so it is trivially 100% verifiable)", () => {
    const recap = buildFallbackRecap(allBalls, meta, 1, 37, "en");
    for (const line of recap.lines) expect(line.refs).toEqual([]);
  });

  it("reflects the real score at the window end, in English", () => {
    const recap = buildFallbackRecap(allBalls, meta, 1, 37, "en");
    expect(recap.headline).toContain("46/2");
  });

  it("falls back to English for a language without a template", () => {
    const recap = buildFallbackRecap(allBalls, meta, 1, 37, "ta");
    expect(recap.headline).toContain("46/2");
    expect(recap.lines[0].text).toMatch(/[A-Za-z]/);
  });

  it("has a Hinglish template distinct from the English one", () => {
    const en = buildFallbackRecap(allBalls, meta, 1, 37, "en");
    const hinglish = buildFallbackRecap(allBalls, meta, 1, 37, "hinglish");
    expect(hinglish.lines[1].text).not.toBe(en.lines[1].text);
  });

  it("announces the win once the chase is complete", () => {
    const recap = buildFallbackRecap(allBalls, meta, 1, 122, "en");
    expect(recap.lines.some((l) => l.text.includes("won"))).toBe(true);
  });
});
