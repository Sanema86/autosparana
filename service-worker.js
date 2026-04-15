const CACHE_NAME = "autosparana-v1";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/autos.html",
  "/motos.html",
  "/camionetas.html",
  "/utilitarios.html",
  "/auto.html",
  "/vender.html",
  "/css/styles.css",
  "/js/main.js",
  "/js/auto.js",
  "/logoAP.png",
  "/logoAP.ico",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});
