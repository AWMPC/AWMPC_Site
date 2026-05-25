var SHELL_CACHE_NAME = 'hymns-shell-v1';
var PDF_CACHE_NAME = 'hymns-pdfs-v1';
var MANIFEST_URL = 'documents/hymns/index.json';
var SHELL_ASSETS = [
  'hymns.html',
  'wmpc_s_hymns.html',
  MANIFEST_URL,
  'hymns.webmanifest',
  'resources/icons/hymns-icon.svg',
  'resources/vendor/pdfjs/pdf.min.js',
  'resources/vendor/pdfjs/pdf.worker.min.js'
];

function isSafeHymnPdfPath(pathname) {
  return /^\/documents\/hymns\/[^\/?#]+\.pdf$/i.test(pathname) &&
    pathname.indexOf('..') === -1;
}

function isSafeHymnFile(file) {
  return typeof file === 'string' &&
    /^documents\/hymns\/[^\/?#]+\.pdf$/i.test(file) &&
    file.indexOf('..') === -1 &&
    !/^[a-z][a-z0-9+.-]*:/i.test(file);
}

function pdfCacheKey(url) {
  return url.pathname.replace(/^\//, '');
}

function cacheIfOk(cache, request, response) {
  if (response && response.status === 200) {
    return cache.put(request, response.clone()).then(function() {
      return response;
    });
  }
  return response;
}

function cacheShellAssets() {
  return caches.open(SHELL_CACHE_NAME).then(function(cache) {
    return Promise.all(SHELL_ASSETS.map(function(asset) {
      return fetch(asset, { cache: 'reload' }).then(function(response) {
        return cacheIfOk(cache, asset, response);
      }).catch(function() {
        return undefined;
      });
    }));
  });
}

function manifestPdfUrls() {
  return fetch(MANIFEST_URL, { cache: 'no-store' }).then(function(response) {
    if (!response.ok) return [];
    return response.json();
  }).then(function(manifest) {
    if (!manifest || !Array.isArray(manifest.hymns)) return [];
    return manifest.hymns
      .map(function(hymn) { return hymn && hymn.file; })
      .filter(isSafeHymnFile);
  }).catch(function() {
    return [];
  });
}

function cacheAllHymnPdfs() {
  return caches.open(PDF_CACHE_NAME).then(function(cache) {
    return manifestPdfUrls().then(function(urls) {
      return Promise.all(urls.map(function(url) {
        return fetch(url, { cache: 'reload' }).then(function(response) {
          if (response.status !== 200) return false;
          return cache.put(url, response.clone()).then(function() {
            return response.status === 200;
          });
        }).catch(function() {
          return false;
        });
      }));
    });
  });
}

function fetchAndCachePdf(request, cacheKey) {
  return caches.open(PDF_CACHE_NAME).then(function(cache) {
    return fetch(request).then(function(response) {
      return cacheIfOk(cache, cacheKey, response);
    }).catch(function(error) {
      return cache.match(cacheKey).then(function(cached) {
        if (cached) return cached;
        throw error;
      });
    });
  });
}

function parseRangeHeader(rangeHeader, size) {
  var match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || '');
  if (!match) return null;

  var start = match[1] ? Number(match[1]) : 0;
  var end = match[2] ? Number(match[2]) : size - 1;

  if (!match[1] && match[2]) {
    var suffixLength = Number(match[2]);
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  }

  if (!isFinite(start) || !isFinite(end) || start < 0 || end < start || start >= size) {
    return null;
  }

  return {
    start: start,
    end: Math.min(end, size - 1)
  };
}

function rangeResponseFromCachedPdf(request, cacheKey) {
  return caches.open(PDF_CACHE_NAME).then(function(cache) {
    return cache.match(cacheKey).then(function(cached) {
      if (!cached) return fetch(request);

      return cached.arrayBuffer().then(function(buffer) {
        var range = parseRangeHeader(request.headers.get('range'), buffer.byteLength);
        if (!range) return cached;

        var body = buffer.slice(range.start, range.end + 1);
        var headers = new Headers(cached.headers);
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Content-Length', String(body.byteLength));
        headers.set('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + buffer.byteLength);

        return new Response(body, {
          status: 206,
          statusText: 'Partial Content',
          headers: headers
        });
      });
    });
  });
}

function cacheFirstShell(request) {
  return caches.open(SHELL_CACHE_NAME).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        return cacheIfOk(cache, request, response);
      });
    });
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    cacheShellAssets().then(cacheAllHymnPdfs).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(name) {
        return name.indexOf('hymns-') === 0 &&
          name !== SHELL_CACHE_NAME &&
          name !== PDF_CACHE_NAME;
      }).map(function(name) {
        return caches.delete(name);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', function(event) {
  if (!event.data || event.data.type !== 'CACHE_HYMNS_NOW') return;
  event.waitUntil(cacheAllHymnPdfs());
});

self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  if (request.headers.has('range')) {
    if (isSafeHymnPdfPath(url.pathname)) {
      event.respondWith(rangeResponseFromCachedPdf(request, pdfCacheKey(url)));
    }
    return;
  }

  if (isSafeHymnPdfPath(url.pathname)) {
    event.respondWith(
      caches.open(PDF_CACHE_NAME).then(function(cache) {
        var cacheKey = pdfCacheKey(url);
        return cache.match(cacheKey).then(function(cached) {
          return cached || fetchAndCachePdf(request, cacheKey);
        });
      })
    );
    return;
  }

  if (SHELL_ASSETS.indexOf(url.pathname.replace(/^\//, '')) !== -1) {
    event.respondWith(cacheFirstShell(request));
  }
});
