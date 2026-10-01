/* Only cache the offline shell and public icons. Never cache sessions, API or operational pages. */
const CACHE = "ongsave-static-v1";
const ASSETS = ["/offline.html", "/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k.startsWith("ongsave-")).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === "navigate") { event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html"))); return; }
  if (ASSETS.includes(new URL(event.request.url).pathname)) event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
