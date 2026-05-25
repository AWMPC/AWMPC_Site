const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const htaccess = fs.readFileSync(path.join(root, '.htaccess'), 'utf8');

assert.doesNotMatch(
  htaccess,
  /Header\s+set\s+Content-Security-Policy\s+"[^"]*frame-ancestors 'none'[^"]*"\s+"expr=%\{CONTENT_TYPE\}\s*=~\s*m#[^#]*application\\?\/pdf/i,
  'PDF responses must not receive frame-ancestors none because hymns embed PDFs in-page'
);

assert.match(
  htaccess,
  /Header\s+set\s+Content-Security-Policy\s+"[^"]*frame-ancestors 'self'[^"]*"\s+"expr=%\{CONTENT_TYPE\}\s*=~\s*m#application\\?\/pdf#i/,
  'PDF responses should only allow same-origin embedding'
);
