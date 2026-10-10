/**
 * Minimal external store for a single localStorage-backed JSON blob, built
 * for React's `useSyncExternalStore`. This avoids the classic
 * "read localStorage in an effect, then setState" pattern, which causes an
 * extra render and (for any state that affects rendered text) a hydration
 * mismatch between the server's default render and the client's restored
 * preferences. `useSyncExternalStore`'s server/client snapshot split is
 * designed exactly for this: React renders the server snapshot during
 * hydration, then reconciles to the real client snapshot right after,
 * without a mismatch warning.
 */
export function createPersistentStore<T extends Record<string, unknown>>(key: string, defaults: T) {
  let cache: T = defaults;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load(): T {
    if (typeof window === "undefined") return defaults;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<T>) } : defaults;
    } catch {
      return defaults;
    }
  }

  function getSnapshot(): T {
    if (!loaded) {
      cache = load();
      loaded = true;
    }
    return cache;
  }

  function getServerSnapshot(): T {
    return defaults;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function set(patch: Partial<T>): void {
    cache = { ...cache, ...patch };
    loaded = true;
    try {
      window.localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      // Storage can be unavailable (private mode, quota) — in-memory cache still works.
    }
    listeners.forEach((listener) => listener());
  }

  return { getSnapshot, getServerSnapshot, subscribe, set };
}
