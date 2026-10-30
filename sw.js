/* Corte · service worker: funciona sin conexión (cache primero, actualiza en segundo plano) */
const VERSION = 'corte-v1';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'activar') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const clave = req.mode === 'navigate' ? './index.html' : req;
    const enCache = await cache.match(clave, { ignoreSearch: true });
    const red = fetch(req).then(res => { if (res && res.ok) cache.put(clave, res.clone()); return res; }).catch(() => null);
    if (enCache) { e.waitUntil(red); return enCache; }
    const r = await red;
    return r || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
