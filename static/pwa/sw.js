const CACHE = "umeme-v1";
const SHELL = [
  "/",
  "/static/css/style.css",
  "/static/css/components.css",
  "/static/css/extras.css",
  "/static/css/features.css",
  "/static/js/api.js",
  "/static/js/calc.js",
  "/static/js/chart.js",
  "/static/js/app.js",
  "/static/js/extras.js",
  "/static/js/theme.js",
  "/static/js/money.js",
  "/static/js/alerts.js",
  "/static/js/i18n.js",
  "/static/img/icon-192.png",
  "/static/img/icon-512.png",
  "/static/pwa/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Online: always fetch fresh files. Offline: fall back to the saved copy.
// Data calls (/api/) are never cached.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
  );
});
