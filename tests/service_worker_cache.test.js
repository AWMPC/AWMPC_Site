const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

assert.match(sw, /var CACHE_NAME = 'bible-v3\.2\.1';/);
assert.match(sw, /e\.request\.method !== 'GET'/);
assert.match(sw, /e\.request\.headers\.has\('range'\)/);
assert.match(sw, /url\.origin !== self\.location\.origin/);
assert.match(sw, /url\.protocol !== 'http:' && url\.protocol !== 'https:'/);
assert.match(sw, /response\.status !== 200/);
assert.match(sw, /return cached \|\| Response\.error\(\);/);
assert.doesNotMatch(sw, /cache\.put\(e\.request, clone\);/);
assert.match(sw, /var bibleDataKey = new Request\(bibleDataUrl\.href\);/);
assert.match(sw, /cacheIfComplete\(cache, bibleDataKey, response\)/,
  'cache-busted Bible refreshes replace the canonical offline entry');
assert.match(sw, /cachedOrError\(cache, bibleDataKey\)/,
  'offline Bible fallback always reads the canonical entry');
