const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'templates', 'site.template.html'), 'utf8');

assert.match(
  shell,
  /<a href="\.\/hymns\.html" class="quick-link-hymns quick-link-icon" aria-label="Hymns">[\s\S]*?🎤[\s\S]*?Hymns[\s\S]*?讚美詩[\s\S]*?<\/a>/
);

assert.match(
  shell,
  /<a href="https:\/\/bible\.awmpc\.org" class="quick-link-bible quick-link-icon" aria-label="Bible">/
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

assert.match(
  shell,
  /<a class="fab-menu-item fab-bible" href="https:\/\/bible\.awmpc\.org">📚 Bible <span class="fab-item-zh">聖經<\/span><\/a>/
);

assert.match(
  shell,
  /<a class="footer-youtube-badge" href="https:\/\/www\.youtube\.com\/@AWMPC-USA" target="_blank" rel="noopener noreferrer" aria-label="AWMPC on YouTube">/
);

assert.doesNotMatch(
  shell,
  /navigator\.serviceWorker\.register\(['"]\.\/sw\.js['"]\)/,
  'site shell must not register the Bible service worker on every page'
);

assert.match(
  shell,
  /return scripts\.reduce\(function\(chain, old\)/,
  'SPA loader must execute injected fragment scripts sequentially'
);

assert.match(
  shell,
  /s\.async = false/,
  'SPA loader must keep dynamically injected external scripts ordered'
);

assert.match(
  shell,
  /s\.onload = resolve/,
  'SPA loader must wait for external fragment scripts before later inline scripts'
);

assert.match(
  shell,
  /return runScripts\(mainEl\)\.then\(function\(\)/,
  'SPA navigation must wait for fragment scripts to finish loading'
);

assert.match(
  shell,
  /var routes = \{[\s\S]*'index\.html':\s+'index\.html'/,
  'SPA navigation must fetch generated pages instead of source templates'
);

assert.match(
  shell,
  /new DOMParser\(\)\.parseFromString\(html, 'text\/html'\)/,
  'SPA navigation must extract content from generated static pages'
);
