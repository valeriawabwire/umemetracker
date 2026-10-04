const CACHE = "umeme-v1";
const SHELL = [
  "/",
  "/manifest.json",
  "/static/css/style.css",
  "/static/css/components.css",
  "/static/css/extras.css",
  "/static/css/extras2.css",
  "/static/js/api.js",
  "/static/js/calc.js",
  "/static/js/chart.js",
  "/static/js/app.js",
  "/static/js/extras.js",
  "/static/js/features.js",
  "/static/js/i18n.js",
  "/static/js/pwa.js",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(SHELL.map(function (url) { return cache.add(url).catch(function () { return null; }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Network first, fall back to the saved copy. Household data (/api/) is never cached.
self.addEventListener("fetch", function (event) {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.indexOf("/api/") === 0) return;
  event.respondWith(
    fetch(req).then(function (res) {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match("/"); });
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (let i = 0; i < list.length; i++) {
        if ("focus" in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
