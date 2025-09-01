const CACHE_NAME = 'imakao-v1';
const CORE_ASSETS = [
  './馬交.html',
  './manifest.json',
  './service-worker.js',
  './icon-192.svg',
  './icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // HTML 導航請求：走 network-first，離線時回退到 cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(cached => cached || caches.match('./馬交.html')))
    );
    return;
  }

  // 站內靜態資源：cache-first，缺失時回源並寫入快取
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});