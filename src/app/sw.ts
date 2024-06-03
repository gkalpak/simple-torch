/// <reference lib="webworker" />

const CACHE_NAME_PREFIX = 'simple-torch-';
const CACHE_NAME = `${CACHE_NAME_PREFIX}<PLACEHOLDER:SW_HASH>`;
const FILES_TO_CACHE = {'<PLACEHOLDER:FILES_TO_CACHE>': ''};

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', evt => {
  console.info('[ServiceWorker] Installing...');

  // Cache files and skip waiting (i.e. activate asap).
  evt.waitUntil(sw.caches.open(CACHE_NAME).
    then(cache => cache.addAll(Object.keys(FILES_TO_CACHE))).
    then(() => sw.skipWaiting()).
    then(() => console.info('[ServiceWorker] Installed successfully.')).
    catch(err => console.info('[ServiceWorker] Failed to install:', err)));
});

sw.addEventListener('activate', evt => {
  console.info('[ServiceWorker] Activating...');

  // Clean up caches and claim all clients.
  evt.waitUntil(cleanUpObsoleteCaches().
    then(() => sw.clients.claim()).
    then(() => console.info('[ServiceWorker] Activated successfully.')).
    catch(err => console.info('[ServiceWorker] Failed to activate:', err)));
});

sw.addEventListener('fetch', evt =>
  evt.respondWith(sw.caches.match(evt.request, {ignoreSearch: true}).
    then(res => res || sw.fetch(evt.request))));

// Helpers
async function cleanUpObsoleteCaches() {
  const cacheNames = await sw.caches.keys();
  const obsoleteCacheNames = cacheNames.filter(name => (name !== CACHE_NAME) && name.startsWith(CACHE_NAME_PREFIX));

  await Promise.all(obsoleteCacheNames.map(name => sw.caches.delete(name)));
}
