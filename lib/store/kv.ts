/**
 * Minimal key-value store abstraction used for AI response caching and rate
 * limiting. Upstash Redis is used when its REST env vars are present;
 * otherwise we fall back to an in-memory store with a console warning (see
 * docs/DECISIONS.md #4). The in-memory store is per-process, so on
 * serverless platforms each cold start resets it — acceptable for a demo.
 */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  /** Sets a value with a TTL in seconds. */
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  /** Atomically increments a counter, creating it with the given TTL if absent. Returns the new value. */
  incrWithTtl(key: string, ttlSeconds: number): Promise<number>;
}

class MemoryStore implements KeyValueStore {
  private readonly data = new Map<string, { value: string; expiresAt: number }>();

  private prune(key: string): void {
    const entry = this.data.get(key);
    if (entry && entry.expiresAt <= Date.now()) this.data.delete(key);
  }

  async get(key: string): Promise<string | null> {
    this.prune(key);
    return this.data.get(key)?.value ?? null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.data.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    this.prune(key);
    const existing = this.data.get(key);
    const next = (existing ? Number(existing.value) : 0) + 1;
    this.data.set(key, {
      value: String(next),
      expiresAt: existing?.expiresAt ?? Date.now() + ttlSeconds * 1000,
    });
    return next;
  }
}

class UpstashStore implements KeyValueStore {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async rest(path: string): Promise<unknown> {
    const res = await fetch(`${this.url}${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstash request failed: ${res.status}`);
    const body = (await res.json()) as { result: unknown };
    return body.result;
  }

  async get(key: string): Promise<string | null> {
    const result = await this.rest(`/get/${encodeURIComponent(key)}`);
    return (result as string | null) ?? null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.rest(
      `/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${ttlSeconds}`,
    );
  }

  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const result = await this.rest(`/incr/${encodeURIComponent(key)}`);
    const value = Number(result);
    if (value === 1) await this.rest(`/expire/${encodeURIComponent(key)}/${ttlSeconds}`);
    return value;
  }
}

let singleton: KeyValueStore | null = null;

export function getKeyValueStore(): KeyValueStore {
  if (singleton) return singleton;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    singleton = new UpstashStore(url, token);
  } else {
    console.warn(
      "[store] UPSTASH_REDIS_REST_URL/TOKEN not set — falling back to an in-memory store. " +
        "Caching and rate limits will reset on every cold start and are not shared across instances.",
    );
    singleton = new MemoryStore();
  }
  return singleton;
}

/** Test-only hook to reset the singleton between test files. */
export function _resetKeyValueStoreForTests(): void {
  singleton = null;
}
