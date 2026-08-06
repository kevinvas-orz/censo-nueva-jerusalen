/* ============================================================
   CENSO NUEVA JERUSALÉN 2026 — service worker
   Hace que la app abra aunque no haya señal.

   Estrategia: "servir de la memoria y actualizar por detrás".
   La página abre al instante desde lo guardado en el teléfono, y
   al mismo tiempo busca en internet si hay una versión más nueva.
   Si la hay, la guarda para la próxima vez que se abra.

   NO hay que tocar este archivo nunca, ni siquiera al cambiar
   config.js: la actualización se hace sola.
   ============================================================ */

const CACHE = 'censo-nj-2026';
const BASE = new URL('./', self.location).pathname;
const ARCHIVOS = [BASE, BASE+'index.html', BASE+'padron.js', BASE+'config.js', BASE+'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARCHIVOS).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Solo la app. Los envíos a Google Apps Script nunca se guardan.
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req).then(guardado => {
        const red = fetch(req).then(resp => {
          if (resp && resp.ok) cache.put(req, resp.clone());
          return resp;
        }).catch(() => guardado);
        return guardado || red;
      })
    )
  );
});
