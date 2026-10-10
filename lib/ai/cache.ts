import { createHash } from "node:crypto";
import { getKeyValueStore } from "@/lib/store/kv";
import { PROMPT_VERSION } from "./config";

const TTL_SECONDS = 10 * 60;

function cacheKey(parts: Record<string, string | number>): string {
  const serialized = Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const hash = createHash("sha256").update(serialized).digest("hex").slice(0, 32);
  return `ai-cache:${hash}`;
}

export async function getCached<T>(parts: Record<string, string | number>): Promise<T | null> {
  const store = getKeyValueStore();
  const raw = await store.get(cacheKey({ ...parts, promptVersion: PROMPT_VERSION }));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCached<T>(
  parts: Record<string, string | number>,
  value: T,
): Promise<void> {
  const store = getKeyValueStore();
  await store.set(
    cacheKey({ ...parts, promptVersion: PROMPT_VERSION }),
    JSON.stringify(value),
    TTL_SECONDS,
  );
}
