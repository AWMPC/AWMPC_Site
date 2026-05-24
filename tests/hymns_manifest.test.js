const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'documents', 'hymns', 'index.json');
const hymnsHtmlPath = path.join(root, 'wmpc_s_hymns.html');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertSafePdfPath(file) {
  assert.equal(typeof file, 'string');
  assert.match(file, /^documents\/hymns\/[^?#]+\.pdf$/i);
  assert.doesNotMatch(file, /(?:^|\/)\.\.(?:\/|$)/);
  assert.doesNotMatch(file, /^[a-z][a-z0-9+.-]*:/i);
}

const manifest = readJson(manifestPath);

assert.equal(manifest.version, 1);
assert.equal(manifest.source, 'static-manifest');
assert.ok(Array.isArray(manifest.hymns));
assert.ok(manifest.hymns.length > 0);

const titles = new Set();
const files = new Set();
let lastTitle = '';

for (const hymn of manifest.hymns) {
  assert.equal(typeof hymn.title, 'string');
  assert.ok(hymn.title.trim().length > 0);
  assertSafePdfPath(hymn.file);
  assert.ok(!titles.has(hymn.title), `duplicate title: ${hymn.title}`);
  assert.ok(!files.has(hymn.file), `duplicate file: ${hymn.file}`);
  assert.ok(hymn.title.localeCompare(lastTitle, undefined, { numeric: true }) >= 0);

  titles.add(hymn.title);
  files.add(hymn.file);
  lastTitle = hymn.title;
}

const trackedHymnPdfs = execFileSync('git', ['ls-files', 'documents/hymns'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\n')
  .filter((file) => file.toLowerCase().endsWith('.pdf'));

assert.deepEqual(trackedHymnPdfs, [], 'hymn PDFs must not be tracked in SCM');

const html = fs.readFileSync(hymnsHtmlPath, 'utf8');
assert.match(html, /id="hymnPdfSelect"/);
assert.match(html, /data-manifest-url="documents\/hymns\/index\.json"/);
assert.match(html, /id="hymnPdfFallback"/);
assert.match(html, /encodeURI/);
assert.match(html, /new URL\(hymn\.file, window\.location\.href\)/);
assert.match(html, /searchParams\.set\('embed', '1'\)/);
assert.match(html, /resources\/vendor\/pdfjs\/pdf\.min\.js/);
assert.match(html, /resources\/vendor\/pdfjs\/pdf\.worker\.min\.js/);
assert.doesNotMatch(html, /cdnjs\.cloudflare\.com/);
assert.match(html, /pdfjsLib\.getDocument/);
assert.match(html, /function ensurePdfJs\(\)/);
assert.match(html, /script\.addEventListener\('load', done/);
assert.match(html, /cleanupLegacyServiceWorker\(\)\.then\(ensurePdfJs\)\.then\(loadHymns\)/);
assert.match(html, /id="hymnPdfCanvas"/);
assert.match(html, /id="hymnPdfCanvasNext"/);
assert.match(html, /class="hymns-canvas is-active"/);
assert.match(html, /\.hymns-stage\.is-loading\.is-loading-label::after/);
assert.doesNotMatch(html, /\.hymns-stage\.is-loading::after\s*{[\s\S]*?Loading hymnal PDF/);
assert.match(html, /transition: opacity/);
assert.match(html, /transition: opacity 520ms ease-in-out/);
assert.match(html, /var CROSSFADE_OVERLAP_MS = 260/);
assert.match(html, /previousCanvas\.classList\.add\('is-retiring'\)/);
assert.match(html, /window\.setTimeout\(function\(\) {\s*previousCanvas\.classList\.remove\('is-retiring'\)/);
assert.match(html, /var hasRenderedPage = false/);
assert.match(html, /function swapCanvases\(targetCanvas\)/);
assert.match(html, /setLoading\(!hasRenderedPage, !hasRenderedPage\)/);
assert.match(html, /id="hymnPdfFullscreen"/);
assert.match(html, /requestFullscreen/);
assert.doesNotMatch(html, /<iframe/);
assert.match(html, /stage\.requestFullscreen/);
assert.match(html, /function isMobilePresentationViewport\(\)/);
assert.match(html, /\(pointer: coarse\)/);
assert.match(html, /var mobilePresentation = isPresenting\(\) && isMobilePresentationViewport\(\)/);
assert.match(html, /mobilePresentation \?\s*maxCssHeight \/ baseViewport\.height\s*:\s*Math\.min\(maxCssWidth \/ baseViewport\.width, maxCssHeight \/ baseViewport\.height\)/);
assert.match(html, /stage\.classList\.toggle\('is-mobile-presenting', mobilePresentation\)/);
assert.match(html, /document\.addEventListener\('keydown'/);
assert.match(html, /event\.key === 'ArrowLeft'/);
assert.match(html, /event\.key === 'ArrowRight'/);
assert.match(html, /event\.key === 'Escape'/);
assert.match(html, /touch-action: none/);
assert.match(html, /var SWIPE_THRESHOLD_PX = 56/);
assert.match(html, /var PRESENTATION_EXIT_SWIPE_THRESHOLD_PX = 56/);
assert.match(html, /var PINCH_EXIT_RATIO = 0\.72/);
assert.match(html, /var activePointers = {}/);
assert.match(html, /function beginSwipe\(event\)/);
assert.match(html, /function finishSwipe\(event\)/);
assert.match(html, /function updatePinchExit\(event\)/);
assert.match(html, /function handleGestureChange\(event\)/);
assert.match(html, /Math\.abs\(deltaY\) >= PRESENTATION_EXIT_SWIPE_THRESHOLD_PX/);
assert.match(html, /exitPresentationFromGesture\(event\)/);
assert.match(html, /stage\.addEventListener\('pointerdown', beginSwipe\)/);
assert.match(html, /stage\.addEventListener\('pointerup', finishSwipe\)/);
assert.match(html, /stage\.addEventListener\('gesturechange', handleGestureChange\)/);
assert.match(html, /if \(deltaX < 0\) goToNextPage\(\)/);
assert.match(html, /if \(deltaX > 0\) goToPreviousPage\(\)/);
assert.doesNotMatch(html, /root\.requestFullscreen/);
assert.match(html, /navigator\.serviceWorker\.getRegistrations/);
assert.match(html, /registration\.unregister\(\)/);
assert.match(html, /caches\.delete/);

assert.ok(fs.existsSync(path.join(root, 'resources', 'vendor', 'pdfjs', 'pdf.min.js')));
assert.ok(fs.existsSync(path.join(root, 'resources', 'vendor', 'pdfjs', 'pdf.worker.min.js')));
