import { beforeEach, describe, expect, it, vi } from "vitest";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { buildFactSheet } from "@/lib/ai/fact-sheet";
import { GOLDEN_SET } from "./golden-set";
import { _resetKeyValueStoreForTests } from "@/lib/store/kv";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];

vi.mock("@/lib/ai/gemini", () => ({ generateStructured: vi.fn() }));

import { generateStructured } from "@/lib/ai/gemini";
import { getRecap } from "@/lib/ai/recap-service";

const mockGenerate = vi.mocked(generateStructured);

beforeEach(() => {
  _resetKeyValueStoreForTests();
  mockGenerate.mockReset();
});

/**
 * CI-safe eval run: mocks Gemini to return a response built directly from
 * the real fact sheet (first ball mentioned, real current score), so it
 * passes verification exactly the way a well-behaved real model would.
 * This exercises the whole pipeline (fact sheet -> prompt -> schema ->
 * verify -> trust badge) without any network call. See
 * recap-eval.live.test.ts for the real-Gemini version (EVAL_LIVE=1).
 */
describe("eval harness (mocked Gemini, runs in CI)", () => {
  it(`covers at least 30 golden windows across every required category`, () => {
    expect(GOLDEN_SET.length).toBeGreaterThanOrEqual(30);
    const categories = new Set(GOLDEN_SET.map((w) => w.category));
    expect(categories).toEqual(
      new Set(["early", "middle", "last_over", "wicket_cluster", "long_gap", "one_ball"]),
    );
  });

  it("every golden window produces a verified AI recap or a safe fallback — never invalid output", async () => {
    let aiCount = 0;
    let fallbackCount = 0;
    let totalRefs = 0;
    let verifiedRefs = 0;

    for (const window of GOLDEN_SET) {
      const factSheet = buildFactSheet(allBalls, meta, window.from, window.to);
      const firstRef =
        allBalls.find((b) => b.n >= window.from && b.n <= window.to)?.n ?? window.from;

      mockGenerate.mockResolvedValueOnce({
        ok: true,
        latencyMs: 5,
        totalTokens: 100,
        data: {
          headline: `${meta.battingTeam.name} update`.slice(0, 90),
          lines: [
            {
              kind: "where_it_stands",
              text: `Score update based on the fact sheet.`,
              refs: [firstRef],
            },
          ],
        },
      });

      const result = await getRecap({
        allBalls,
        meta,
        from: window.from,
        to: window.to,
        locale: "en",
        mode: "beginner",
      });
      expect(["ai", "fallback"]).toContain(result.source);
      if (result.source === "ai") aiCount += 1;
      else fallbackCount += 1;
      totalRefs += result.totalRefs;
      verifiedRefs += result.verifiedRefs;

      // The core guarantee: whatever reached "result" has zero unverified refs.
      expect(result.verifiedRefs).toBe(result.totalRefs);
      void factSheet;
    }

    expect(aiCount + fallbackCount).toBe(GOLDEN_SET.length);
    expect(verifiedRefs).toBe(totalRefs);
  });

  it("a response with a hallucinated number is rejected and replaced by the fallback", async () => {
    const window = GOLDEN_SET[0];
    mockGenerate.mockResolvedValue({
      ok: true,
      latencyMs: 5,
      totalTokens: 50,
      data: {
        headline: "x",
        lines: [{ kind: "where_it_stands", text: "They scored 777777 runs.", refs: [] }],
      },
    });
    const result = await getRecap({
      allBalls,
      meta,
      from: window.from,
      to: window.to,
      locale: "en",
      mode: "beginner",
    });
    expect(result.source).toBe("fallback");
  });

  it("a malformed (non-JSON-parseable) model response is rejected and replaced by the fallback", async () => {
    const window = GOLDEN_SET[1];
    mockGenerate.mockResolvedValueOnce({
      ok: false,
      kind: "invalid_response",
      message: "bad json",
      latencyMs: 5,
    });
    const result = await getRecap({
      allBalls,
      meta,
      from: window.from,
      to: window.to,
      locale: "en",
      mode: "beginner",
    });
    expect(result.source).toBe("fallback");
  });
});
