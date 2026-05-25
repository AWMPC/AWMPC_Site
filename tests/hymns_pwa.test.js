const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'wmpc_s_hymns.html'), 'utf8');
const htaccess = fs.readFileSync(path.join(root, '.htaccess'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'hymns.webmanifest'), 'utf8'));
const sw = fs.readFileSync(path.join(root, 'hymns-sw.js'), 'utf8');

assert.equal(manifest.name, 'AWMPC Hymns');
assert.equal(manifest.short_name, 'Hymns');
assert.equal(manifest.start_url, 'hymns.html');
assert.equal(manifest.scope, './');
assert.equal(manifest.display, 'standalone');
assert.ok(Array.isArray(manifest.icons));
assert.ok(manifest.icons.some((icon) => icon.src === 'resources/icons/hymns-icon.svg'));

assert.match(html, /function ensureHymnsManifestLink\(\)/);
assert.match(html, /link\.rel = 'manifest'/);
assert.match(html, /link\.href = 'hymns\.webmanifest'/);
assert.match(html, /function registerHymnsServiceWorker\(\)/);
assert.match(html, /navigator\.serviceWorker\.register\('hymns-sw\.js', \{ scope: '\.\/' \}\)/);
assert.match(html, /cleanupLegacyServiceWorker\(\)\.then\(registerHymnsServiceWorker\)\.then\(ensurePdfJs\)\.then\(loadHymns\)/);
assert.match(html, /registrationWorkerScriptUrl\(registration\)/);
assert.match(html, /\/sw\\.js\$\/\.test\(scriptUrl\)/);
assert.doesNotMatch(html, /return registration\.unregister\(\);\s*\}\)\);/);

assert.match(sw, /var SHELL_CACHE_NAME = 'hymns-shell-v1';/);
assert.match(sw, /var PDF_CACHE_NAME = 'hymns-pdfs-v1';/);
assert.match(sw, /var MANIFEST_URL = 'documents\/hymns\/index\.json';/);
assert.match(sw, /function isSafeHymnPdfPath\(pathname\)/);
assert.match(sw, /\^\\\/documents\\\/hymns\\\/\[\^\\\/\?#\]\+\\\.pdf\$\/i/);
assert.match(sw, /function pdfCacheKey\(url\)/);
assert.match(sw, /function manifestPdfUrls\(\)/);
assert.match(sw, /fetch\(MANIFEST_URL, \{ cache: 'no-store' \}\)/);
assert.match(sw, /function cacheAllHymnPdfs\(\)/);
assert.match(sw, /Promise\.all\(urls\.map\(function\(url\)/);
assert.match(sw, /cache\.put\(url, response\.clone\(\)\)/);
assert.match(sw, /cacheShellAssets\(\)\.then\(cacheAllHymnPdfs\)/);
assert.match(sw, /self\.skipWaiting\(\)/);
assert.match(sw, /name\.indexOf\('hymns-'\) === 0/);
assert.doesNotMatch(sw, /name\.indexOf\('bible-'\) === 0/);
assert.match(sw, /request\.method !== 'GET'/);
assert.match(sw, /function parseRangeHeader\(rangeHeader, size\)/);
assert.match(sw, /function rangeResponseFromCachedPdf\(request, cacheKey\)/);
assert.match(sw, /request\.headers\.has\('range'\)/);
assert.match(sw, /new Response\(body, \{\s*status: 206/);
assert.match(sw, /headers\.set\('Content-Range'/);
assert.match(sw, /url\.origin !== self\.location\.origin/);
assert.match(sw, /url\.protocol !== 'http:' && url\.protocol !== 'https:'/);
assert.match(sw, /isSafeHymnPdfPath\(url\.pathname\)/);
assert.match(sw, /return cached \|\| fetchAndCachePdf\(request, cacheKey\)/);
assert.match(sw, /response\.status === 200/);
assert.doesNotMatch(sw, /Response\.error\(\)/);

assert.match(
  htaccess,
  /Header\s+set\s+Cache-Control\s+"no-cache, no-store, must-revalidate"\s+"expr=%\{REQUEST_URI\}\s*=~\s*m#\/\(sw\\\.js\|hymns-sw\\\.js\)\$#"/,
  'both service workers must avoid long-lived cache headers'
);

assert.ok(fs.existsSync(path.join(root, 'resources', 'icons', 'hymns-icon.svg')));
