/* Only the reconnect page is cached. Offers, authentication and feedback are never cached here. */
const SHELL = 'dutyperks-shell-v1';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.add('/offline.html')).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('dutyperks-shell-') && key !== SHELL).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' || url.origin !== self.location.origin) return;
  if (!['/', '/explore', '/install', '/feedback', '/plan'].includes(url.pathname)) return;
  event.respondWith(fetch(new Request(event.request, {cache:'no-store'})).catch(async () => {
    const fallback = await caches.match('/offline.html', {cacheName:SHELL});
    return fallback || new Response('Connect to the internet to use DutyPerks.', {status:503,headers:{'Content-Type':'text/plain'}});
  }));
});
