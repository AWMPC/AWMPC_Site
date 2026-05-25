const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const htaccess = fs.readFileSync(path.join(root, '.htaccess'), 'utf8');

assert.match(sw, /var CACHE_NAME = 'bible-v7';/);
assert.match(sw, /e\.request\.method !== 'GET'/);
assert.match(sw, /e\.request\.headers\.has\('range'\)/);
assert.match(sw, /url\.origin !== self\.location\.origin/);
assert.match(sw, /url\.protocol !== 'http:' && url\.protocol !== 'https:'/);
assert.match(sw, /response\.status === 200/);
assert.match(sw, /return cached \|\| Response\.error\(\);/);
assert.doesNotMatch(sw, /cache\.put\(e\.request, clone\);/);

assert.match(
  htaccess,
  /Header\s+set\s+Cache-Control\s+"no-cache, no-store, must-revalidate"\s+"expr=%\{REQUEST_URI\}\s*=~\s*m#\/\(sw\\\.js\|hymns-sw\\\.js\)\$#"/,
  'service workers must not be served with long-lived cache headers'
);
