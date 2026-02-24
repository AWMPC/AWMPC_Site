var CACHE_NAME = 'awmpc-v1';

var PRECACHE_URLS = [
  './',
  './wmpc_pager.php',
  './wmpc_s_home.html',
  './wmpc_s_mission_cn.html',
  './wmpc_s_sermons.html',
  './wmpc_s_testimonies.html',
  './wmpc_s_prayerrequest.html',
  './wmpc_s_24hrhop.html',
  './wmpc_s_ministrysupport.html',
  './wmpc_s_media.html',
  './wmpc_s_letters.html',
  './canaan_chapel_record.html',
  './wmpc_s_hymns.html',
  './wmpc_s_focus_prayer_week_04_09v2.html',
  './wmpc_s_events.html',
  './wmpc_s_contactus.html',
  './wmpc_s_prayerreply.html',
  './wmpc_s_taiwan040809.html',
  './awmpc_tocau.html',
  './awmpc_privacy.html',
  './awmpc_refunds.html',
  './donation_thank_you.html'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var request = event.request;

  if (request.method !== 'GET') return;

  // Skip cross-origin analytics/tracking requests entirely
  var url = new URL(request.url);
  if (url.hostname === 'rf.revolvermaps.com' ||
      url.hostname === 's11.flagcounter.com' ||
      url.hostname === 'info.flagcounter.com') {
    return;
  }

  event.respondWith(
    // Network first for same-origin navigations and HTML fragments,
    // so users get fresh content when online.
    // Falls back to cache when offline.
    fetch(request).then(function(response) {
      if (response && response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(request).then(function(cached) {
        if (cached) return cached;

        // For navigation requests, serve the cached main page shell
        if (request.mode === 'navigate') {
          return caches.match('./wmpc_pager.php');
        }

        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
