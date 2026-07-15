/* Mis Animales — copia local para funcionar sin internet.
   Sube el número de versión cuando cambie cualquier archivo de la app. */
const CACHE = "mis-animales-v12";
const ARCHIVOS = ["./", "./index.html", "./manifest.json", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Responde primero con la copia guardada (abre al instante y sin señal);
   en segundo plano baja la versión nueva si hay internet, para la próxima vez. */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(guardado => {
      // "no-cache": al haber internet, siempre pregunta al servidor si hay versión nueva
      const red = fetch(e.request, { cache: "no-cache" })
        .then(res => {
          if (res.ok && new URL(e.request.url).origin === self.location.origin) {
            const copia = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copia));
          }
          return res;
        })
        .catch(() => guardado);
      return guardado || red;
    })
  );
});
