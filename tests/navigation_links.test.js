const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'wmpc_pager.php'), 'utf8');

assert.match(
  shell,
  /<a href="\.\/hymns\.html" class="quick-link-hymns quick-link-icon" aria-label="Hymns">[\s\S]*?🎤[\s\S]*?Hymns[\s\S]*?讚美詩[\s\S]*?<\/a>/
);

assert.match(
  shell,
  /<a href="\.\/bible\.html" class="quick-link-bible quick-link-icon" aria-label="Bible">/
);

assert.ok(
  shell.indexOf('class="quick-link-hymns quick-link-icon"') <
    shell.indexOf('class="quick-link-bible quick-link-icon"'),
  'hymns Site Links button should appear immediately before the Bible button'
);

assert.match(
  shell,
  /<a class="fab-menu-item" href="\.\/hymns\.html">Hymns <span class="fab-item-zh">讚美詩<\/span><\/a>/
);
