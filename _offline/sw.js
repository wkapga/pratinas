const CACHE = "offline-v1";

const ASSETS = [
  "/_offline/",
  "/_offline/index.html",
  "/_offline/style.css",
  "/_offline/app.js",
  "/_offline/manifest.webmanifest",
  "/_offline/icon-192.png",
  "/_offline/icon-512.png",
  // Optional: wichtige PDFs direkt cachen
  // "/_offline/assets/tickets/ferry.pdf",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

// Network-first für HTML (damit Updates kommen), cache-first für alles andere
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // nur same-origin
  if (url.origin !== location.origin) return;

  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/_offline/index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy));
      return res;
    }))
  );
});
