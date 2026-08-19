/* HarmeLearn Academy — Service Worker
 *
 * Offline strategy:
 *  - App shell + quiz/exam routes cached
 *  - GET API: stale-while-revalidate (dashboard/quiz/exam packs)
 *  - Navigations: network-first, cache fallback, offline page last
 *  - Static assets: cache-first
 *
 * Quizzes & past exams can be taken offline after first online open/download.
 * Submissions are queued in the page (localStorage) and synced when online.
 */
const SHELL_CACHE = "harmelearn-shell-v2";
const API_CACHE = "harmelearn-api-v2";
const OFFLINE_PAGE = "/offline.html";
const SHELL_URLS = [
  "/",
  "/login",
  "/signup",
  "/courses",
  "/search",
  "/dashboard/student",
  OFFLINE_PAGE,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Quiz/exam offline packs and assessment GETs: cache aggressively
  if (
    url.pathname.startsWith("/api/quizzes/") ||
    url.pathname.startsWith("/api/past-exams/") ||
    url.pathname.startsWith("/api/student/") ||
    url.pathname === "/api/auth/me"
  ) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: "Offline and no cached data" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }
      })
    );
    return;
  }

  // Other GET APIs: stale-while-revalidate
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Navigations (including /quiz/[id] and /exam/[id])
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          // Try exact page, then dashboard shell, then offline page
          return (
            (await caches.match(request)) ||
            (await caches.match("/dashboard/student")) ||
            (await caches.match("/")) ||
            (await caches.match(OFFLINE_PAGE))
          );
        })
    );
    return;
  }

  // Static assets
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
    )
  );
});
