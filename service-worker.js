/* -----------------------------------------------------------------------------
 * Tombstone service worker.
 *
 * The previous version of this site was a Create React App build that registered
 * a Workbox service worker at this path. That worker precached the old index.html
 * and answered navigations from the cache, so browsers that visited before the
 * rewrite keep serving the old React site no matter what is deployed.
 *
 * Deleting this file would not help: those browsers keep the installed worker
 * until a *new* worker at the same URL replaces it. This stub is that
 * replacement — it takes over, drops every cache and unregisters itself, then
 * reloads open tabs onto the live site. It can be removed once traffic from
 * pre-rewrite visitors has aged out.
 * ---------------------------------------------------------------------------*/

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (clients) {
        clients.forEach(function (client) {
          if ('navigate' in client) client.navigate(client.url);
        });
      })
  );
});
