var CACHE_NAME = 'bible-v3.0.0';
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

  if (
    e.request.method !== 'GET' ||
    e.request.headers.has('range') ||
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.origin !== self.location.origin
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  function cacheIfComplete(cache, request, response) {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }

  function cachedOrError(cache, request) {
    return cache.match(request).then(function (cached) {
      return cached || Response.error();
    });
  }

  // Preserve deep links offline without fragmenting the cache by query string.
  if (e.request.mode === 'navigate' && url.pathname.endsWith('bible.html')) {
    var biblePageKey = new Request(new URL('bible.html', self.registration.scope).href);
    e.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return fetch(e.request)
          .then(function (response) {
            return cacheIfComplete(cache, biblePageKey, response);
          })
          .catch(function () {
            return cache.match(biblePageKey, { ignoreSearch: true }).then(function (cached) {
              return cached || Response.error();
            });
          });
      })
    );
    return;
  }

  // bible.json must be network-first: cache-on-hit was serving stale JSON forever
  // (cached || fetch never reached the network when any cached Response existed).
  if (url.pathname.endsWith('bible.json')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return fetch(e.request)
          .then(function (response) {
            return cacheIfComplete(cache, e.request, response);
          })
          .catch(function () {
            return cachedOrError(cache, e.request);
          });
      })
    );
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return fetch(e.request).then(function (response) {
        return cacheIfComplete(cache, e.request, response);
      }).catch(function () {
        return cachedOrError(cache, e.request);
      });
    })
  );
});
