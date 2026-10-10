// Minimal hand-written service worker — no build plugin. Runtime-caches
// GET responses as they're fetched (stale-while-revalidate-ish) and falls
// back to a static offline page for navigations when both network and
// cache miss. Intentionally does not try to precache hashed Next.js build
// chunks by name (those change every build); it caches them lazily instead.
const CACHE_NAME = "catch-me-up-v1";
const PRECACHE = ["/", "/offline.html", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return; // never cache API responses

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") return caches.match("/offline.html");
        return Response.error();
      }),
  );
});
