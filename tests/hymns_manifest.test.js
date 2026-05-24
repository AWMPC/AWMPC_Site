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
assert.match(html, /id="hymnPdfCanvas"/);
assert.match(html, /id="hymnPdfFullscreen"/);
assert.match(html, /requestFullscreen/);
assert.doesNotMatch(html, /<iframe/);

assert.ok(fs.existsSync(path.join(root, 'resources', 'vendor', 'pdfjs', 'pdf.min.js')));
assert.ok(fs.existsSync(path.join(root, 'resources', 'vendor', 'pdfjs', 'pdf.worker.min.js')));
