import { beforeEach, describe, expect, it, vi } from "vitest";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { _resetKeyValueStoreForTests } from "@/lib/store/kv";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];

vi.mock("@/lib/ai/gemini", () => ({
  generateStructured: vi.fn(),
}));

import { generateStructured } from "@/lib/ai/gemini";
import { getRecap } from "@/lib/ai/recap-service";

const mockGenerate = vi.mocked(generateStructured);

beforeEach(() => {
  _resetKeyValueStoreForTests();
  mockGenerate.mockReset();
});

describe("getRecap", () => {
  it("returns the AI recap when the first attempt is valid", async () => {
    mockGenerate.mockResolvedValueOnce({
      ok: true,
      latencyMs: 10,
      totalTokens: 50,
      data: {
        headline: "Konkan Kings 46/2",
        lines: [
          { kind: "where_it_stands", text: "They are 46/2 after the powerplay.", refs: [37] },
        ],
      },
    });

    const result = await getRecap({
      allBalls,
      meta,
      from: 1,
      to: 37,
      locale: "en",
      mode: "beginner",
    });
    expect(result.source).toBe("ai");
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("retries once with violations appended, then succeeds", async () => {
    mockGenerate
      .mockResolvedValueOnce({
        ok: true,
        latencyMs: 10,
        totalTokens: 50,
        data: {
          headline: "x",
          lines: [{ kind: "where_it_stands", text: "They hit 9999 runs.", refs: [] }],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        latencyMs: 10,
        totalTokens: 50,
        data: {
          headline: "Konkan Kings 46/2",
          lines: [{ kind: "where_it_stands", text: "46/2 after the powerplay.", refs: [37] }],
        },
      });

    const result = await getRecap({
      allBalls,
      meta,
      from: 1,
      to: 37,
      locale: "en",
      mode: "beginner",
    });
    expect(result.source).toBe("ai");
    expect(mockGenerate).toHaveBeenCalledTimes(2);
    const secondCallArgs = mockGenerate.mock.calls[1][0];
    expect(secondCallArgs.userContent).toContain("previous attempt had these problems");
  });

  it("falls back to the deterministic recap when verification fails twice", async () => {
    mockGenerate.mockResolvedValue({
      ok: true,
      latencyMs: 10,
      totalTokens: 50,
      data: {
        headline: "x",
        lines: [{ kind: "where_it_stands", text: "They hit 9999 runs.", refs: [] }],
      },
    });

    const result = await getRecap({
      allBalls,
      meta,
      from: 1,
      to: 37,
      locale: "en",
      mode: "beginner",
    });
    expect(result.source).toBe("fallback");
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it("falls back immediately when Gemini is rate limited", async () => {
    mockGenerate.mockResolvedValueOnce({
      ok: false,
      kind: "rate_limited",
      message: "x",
      latencyMs: 5,
    });
    const result = await getRecap({
      allBalls,
      meta,
      from: 1,
      to: 37,
      locale: "en",
      mode: "beginner",
    });
    expect(result.source).toBe("fallback");
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("falls back immediately when Gemini is blocked", async () => {
    mockGenerate.mockResolvedValueOnce({ ok: false, kind: "blocked", message: "x", latencyMs: 5 });
    const result = await getRecap({
      allBalls,
      meta,
      from: 1,
      to: 37,
      locale: "en",
      mode: "beginner",
    });
    expect(result.source).toBe("fallback");
  });

  it("falls back immediately on timeout", async () => {
    mockGenerate.mockResolvedValueOnce({
      ok: false,
      kind: "timeout",
      message: "x",
      latencyMs: 15000,
    });
    const result = await getRecap({
      allBalls,
      meta,
      from: 1,
      to: 37,
      locale: "en",
      mode: "beginner",
    });
    expect(result.source).toBe("fallback");
  });

  it("falls back immediately when no API key is configured", async () => {
    mockGenerate.mockResolvedValueOnce({
      ok: false,
      kind: "not_configured",
      message: "x",
      latencyMs: 0,
    });
    const result = await getRecap({
      allBalls,
      meta,
      from: 1,
      to: 37,
      locale: "en",
      mode: "beginner",
    });
    expect(result.source).toBe("fallback");
  });

  it("caches a successful AI result so a repeated request does not call Gemini again", async () => {
    mockGenerate.mockResolvedValueOnce({
      ok: true,
      latencyMs: 10,
      totalTokens: 50,
      data: {
        headline: "Konkan Kings 46/2",
        lines: [{ kind: "where_it_stands", text: "46/2 after the powerplay.", refs: [37] }],
      },
    });

    await getRecap({ allBalls, meta, from: 1, to: 37, locale: "en", mode: "beginner" });
    const result2 = await getRecap({
      allBalls,
      meta,
      from: 1,
      to: 37,
      locale: "en",
      mode: "beginner",
    });
    expect(result2.source).toBe("ai");
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });
});
