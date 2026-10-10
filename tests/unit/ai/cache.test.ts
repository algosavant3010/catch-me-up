import { beforeEach, describe, expect, it } from "vitest";
import { getCached, setCached } from "@/lib/ai/cache";
import { _resetKeyValueStoreForTests } from "@/lib/store/kv";

beforeEach(() => {
  _resetKeyValueStoreForTests();
});

describe("ai cache", () => {
  it("returns null for a key that was never set", async () => {
    const result = await getCached({
      kind: "recap",
      from: 1,
      to: 10,
      locale: "en",
      mode: "beginner",
      model: "x",
    });
    expect(result).toBeNull();
  });

  it("round-trips a value written with setCached", async () => {
    const parts = { kind: "recap", from: 1, to: 10, locale: "en", mode: "beginner", model: "x" };
    await setCached(parts, { headline: "hi", lines: [] });
    const result = await getCached<{ headline: string }>(parts);
    expect(result?.headline).toBe("hi");
  });

  it("treats different windows as different cache keys", async () => {
    const partsA = { kind: "recap", from: 1, to: 10, locale: "en", mode: "beginner", model: "x" };
    const partsB = { kind: "recap", from: 1, to: 20, locale: "en", mode: "beginner", model: "x" };
    await setCached(partsA, { value: "A" });
    const result = await getCached<{ value: string }>(partsB);
    expect(result).toBeNull();
  });
});
