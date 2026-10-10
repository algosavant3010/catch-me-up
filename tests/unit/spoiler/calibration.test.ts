import { describe, expect, it } from "vitest";
import { computeOffsetSeconds } from "@/lib/spoiler/calibration";

describe("computeOffsetSeconds", () => {
  it("returns 0 with no taps", () => {
    expect(computeOffsetSeconds([])).toBe(0);
  });

  it("computes a simple single-tap offset", () => {
    const result = computeOffsetSeconds([{ emittedAt: 0, tappedAt: 14_000 }]);
    expect(result).toBe(14);
  });

  it("uses the median across multiple consistent taps", () => {
    const taps = [
      { emittedAt: 0, tappedAt: 13_000 },
      { emittedAt: 1000, tappedAt: 15_000 },
      { emittedAt: 2000, tappedAt: 16_000 },
    ];
    // offsets: 13, 14, 14 -> median 14
    expect(computeOffsetSeconds(taps)).toBe(14);
  });

  it("ignores an implausible outlier tap (negative offset)", () => {
    const taps = [
      { emittedAt: 10_000, tappedAt: 5_000 }, // -5s, implausible (tapped before event emitted)
      { emittedAt: 0, tappedAt: 14_000 },
      { emittedAt: 1000, tappedAt: 15_000 },
    ];
    const result = computeOffsetSeconds(taps);
    expect(result).toBe(14);
  });

  it("ignores an implausibly large outlier tap", () => {
    const taps = [
      { emittedAt: 0, tappedAt: 14_000 },
      { emittedAt: 1000, tappedAt: 15_000 },
      { emittedAt: 0, tappedAt: 120_000 }, // 120s, way too large
    ];
    expect(computeOffsetSeconds(taps)).toBe(14);
  });

  it("returns 0 when every tap is implausible", () => {
    const result = computeOffsetSeconds([{ emittedAt: 0, tappedAt: 200_000 }]);
    expect(result).toBe(0);
  });
});
