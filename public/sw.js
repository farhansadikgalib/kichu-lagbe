/* KichuLagbe service worker — offline shell, static asset caching, and
   stale-while-revalidate for public pages and catalog data so repeat visits
   paint from cache while a background fetch refreshes it for next time. */
const VERSION = "v8";
const CACHE_NAME = `kl-${VERSION}`; // precache + static assets
const PAGES_CACHE = `kl-pages-${VERSION}`; // public HTML documents
const DATA_CACHE = `kl-data-${VERSION}`; // public JSON endpoints
const KEEP = new Set([CACHE_NAME, PAGES_CACHE, DATA_CACHE]);

const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/", "/icon-192.png?v=5", "/icon-512.png?v=5", "/images/logo.png"];

// Public, session-independent pages (the header reads the session client-side).
// Anything else — auth-gated routes, /register (dynamic), previews — stays network-first.
const PUBLIC_PAGE = /^\/(?:$|category\/[^/]+$|cart$|login$|offline$)/;
// Public catalog endpoints; every other /api route is left untouched.
const PUBLIC_DATA = /^\/api\/(?:products|categories|delivery)(?:\?|$)/;
// Uploaded media ids are random UUIDs, so their bytes never change.
const IMMUTABLE_MEDIA = /^\/api\/media\//;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // "reload" bypasses the HTTP cache so a rebrand never re-caches stale bytes.
      .then((cache) =>
        cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" }))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Web Push from the server (order placed / status changed / rider assigned).
// The payload is JSON: { title, body, href?, tag? } — see lib/push/payload.ts.
self.addEventListener("push", (event) => {
  let payload = { title: "KichuLagbe", body: "You have a new update.", href: "/" };
  try {
    if (event.data) payload = Object.assign(payload, event.data.json());
  } catch {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png?v=5",
      badge: "/icon-192.png?v=5",
      tag: payload.tag || undefined,
      renotify: Boolean(payload.tag),
      data: { href: payload.href || "/" },
    }),
  );
});

// Browsers occasionally rotate a subscription; re-subscribe with the same key
// and tell the server (cookies ride along on same-origin fetches).
self.addEventListener("pushsubscriptionchange", (event) => {
  const key = event.oldSubscription && event.oldSubscription.options.applicationServerKey;
  if (!key) return;
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey: key })
      .then((subscription) =>
        fetch("/api/push/subscriptions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        }),
      )
      .catch((err) => console.error("[sw] resubscribe failed", err)),
  );
});

// Notification taps (push or foreground alerts): focus an open tab on the
// target page, or open one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/";
  const target = new URL(href, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url === target) || clients[0];
      if (existing) {
        return existing.focus().then((c) => (c && c.url !== target ? c.navigate(target) : c));
      }
      return self.clients.openWindow(target);
    }),
  );
});

/** Only successful, same-origin responses are worth keeping. */
function cacheable(response) {
  return response && response.ok && response.type === "basic";
}

/** Serve from cache immediately (if present) and refresh the entry in the background. */
function staleWhileRevalidate(request, cacheName, fallback) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const refresh = fetch(request)
        .then((response) => {
          if (cacheable(response)) cache.put(request, response.clone());
          return response;
        })
        .catch(() => undefined);
      if (cached) return cached;
      return refresh.then((response) => response || (fallback ? fallback() : Response.error()));
    }),
  );
}

/** Serve from cache; on a miss, fetch once and keep it. */
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (cacheable(response)) cache.put(request, response.clone());
          return response;
        }),
    ),
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Uploaded images: immutable, so cache-first for good.
  if (IMMUTABLE_MEDIA.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Public catalog data: instant from cache, refreshed behind the scenes.
  // The client's SWR hooks re-fetch on mount anyway, so staleness is bounded
  // to one page load. Every other /api route (session, orders, admin…) is
  // never cached.
  if (PUBLIC_DATA.test(url.pathname + url.search)) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }
  if (url.pathname.startsWith("/api/")) return;

  // Hashed build output and images: cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/images/") ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  if (request.mode !== "navigate") return;

  // Public pages: paint the last-seen HTML at once and refresh it for next time.
  if (PUBLIC_PAGE.test(url.pathname)) {
    event.respondWith(
      staleWhileRevalidate(request, PAGES_CACHE, () => caches.match(OFFLINE_URL)),
    );
    return;
  }

  // Everything else (checkout, orders, admin…): network-first with offline fallback.
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)),
    ),
  );
});
