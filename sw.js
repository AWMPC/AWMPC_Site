var CACHE_NAME = 'bible-v5';
var ASSETS = [
  'bible.html',
  'bible.json',
  'manifest.json',
  'resources/images/bible-icon-192.png',
  'resources/images/bible-icon-512.png',
  'resources/images/bible-icon-192-maskable.png',
  'resources/images/bible-icon-512-maskable.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; })
             .map(function (n) { return caches.delete(n); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // bible.json must be network-first: cache-on-hit was serving stale JSON forever
  // (cached || fetch never reached the network when any cached Response existed).
  if (url.pathname.endsWith('bible.json')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return fetch(e.request)
          .then(function (response) {
            if (response.ok) {
              cache.put(e.request, response.clone());
            }
            return response;
          })
          .catch(function () {
            return cache.match(e.request);
          });
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request).then(function (response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
