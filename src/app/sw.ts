/// <reference lib="webworker" />

const CACHE_NAME_PREFIX = 'simple-torch-';
const CACHE_NAME = `${CACHE_NAME_PREFIX}<PLACEHOLDER:SW_HASH>`;
const FILES_TO_CACHE = {'<PLACEHOLDER:FILES_TO_CACHE>': ''};

const global = self as unknown as ServiceWorkerGlobalScope;

global.addEventListener('install', evt => {
  console.info('[ServiceWorker] Installing...');

  // Cache files and skip waiting (i.e. activate asap).
  evt.waitUntil(global.caches.open(CACHE_NAME).
    then(cache => cache.addAll(Object.keys(FILES_TO_CACHE))).
    then(() => global.skipWaiting()).
    then(() => console.info('[ServiceWorker] Installed successfully.')).
    catch(err => console.info('[ServiceWorker] Failed to install:', err)));
});

global.addEventListener('activate', evt => {
  console.info('[ServiceWorker] Activating...');

  // Clean up caches and claim all clients.
  evt.waitUntil(cleanUpObsoleteCaches().
    then(() => global.clients.claim()).
    then(() => console.info('[ServiceWorker] Activated successfully.')).
    catch(err => console.info('[ServiceWorker] Failed to activate:', err)));
});

global.addEventListener('fetch', evt =>
  evt.respondWith(global.caches.match(evt.request, {ignoreSearch: true}).
    then(res => res || global.fetch(evt.request))));

// Helpers
async function cleanUpObsoleteCaches() {
  const cacheNames = await global.caches.keys();
  const obsoleteCacheNames = cacheNames.filter(name => (name !== CACHE_NAME) && name.startsWith(CACHE_NAME_PREFIX));

  await Promise.all(obsoleteCacheNames.map(name => global.caches.delete(name)));
}
