const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const bible = fs.readFileSync(path.join(root, 'bible.html'), 'utf8');

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = bible.match(new RegExp('(?:^|\\n)\\s*' + escaped + '\\s*\\{([^}]*)\\}'));
  assert.ok(match, `missing CSS rule for ${selector}`);
  return match[1];
}

test('action chrome owns History, Search, then the menu action in semantic DOM order', () => {
  assert.match(bible, /<div class="action-chrome" id="action-chrome">\s*<div class="bottom-actions" aria-label="Quick actions">\s*<button[^>]*id="btn-history"[^>]*>History<\/button>\s*<button[^>]*id="btn-search"[^>]*>Search<\/button>\s*<\/div>\s*<div class="fab-root">[\s\S]*?id="fab-main"[\s\S]*?<\/div>\s*<\/div>/);
});

test('desktop chrome is a pointer-transparent viewport layer with distinct lower-corner surfaces', () => {
  assert.match(rule('.bottom-chrome'), /position:\s*fixed;/);
  assert.match(rule('.bottom-chrome'), /inset:\s*0;/);
  assert.match(rule('.bottom-chrome'), /pointer-events:\s*none;/);
  assert.doesNotMatch(rule('.bottom-chrome'), /background:|border:|box-shadow:|backdrop-filter:/);

  const nav = rule('.floating-nav');
  assert.match(nav, /position:\s*absolute;/);
  assert.match(nav, /left:\s*12px;/);
  assert.match(nav, /bottom:\s*calc\(8px \+ env\(safe-area-inset-bottom, 0px\)\);/);
  assert.match(nav, /pointer-events:\s*auto;/);
  assert.match(nav, /background:\s*var\(--float-nav-bg\);/);

  const actions = rule('.action-chrome');
  assert.match(actions, /position:\s*absolute;/);
  assert.match(actions, /right:\s*12px;/);
  assert.match(actions, /bottom:\s*calc\(8px \+ env\(safe-area-inset-bottom, 0px\)\);/);
  assert.match(actions, /pointer-events:\s*auto;/);
  assert.match(actions, /background:\s*var\(--float-nav-bg\);/);
});

test('one hidden state drives both desktop surfaces with a shared motion token', () => {
  assert.match(bible, /--chrome-motion:\s*220ms;/);
  assert.match(rule('.floating-nav'), /transition-duration:\s*var\(--chrome-motion\);/);
  assert.match(rule('.action-chrome'), /transition-duration:\s*var\(--chrome-motion\);/);
  assert.match(rule('.bottom-chrome.scroll-hidden .floating-nav'), /translateY\(calc\(100% \+ 18px \+ env\(safe-area-inset-bottom, 0px\)\)\)/);
  assert.match(rule('.bottom-chrome.scroll-hidden .action-chrome'), /translateY\(calc\(100% \+ 18px \+ env\(safe-area-inset-bottom, 0px\)\)\)/);
  assert.match(bible, /function setBottomChromeHidden\(hidden\)[\s\S]*?bottomChrome\.classList\.toggle\('scroll-hidden', hidden\);/);
});

test('mobile puts navigation at top and full-width actions at bottom with opposite exits', () => {
  const mobile = bible.match(/@media \(max-width: 640px\) \{([\s\S]*?)\n  \}/);
  assert.ok(mobile, 'missing 640px responsive chrome rules');
  assert.match(mobile[1], /\.floating-nav\s*\{[\s\S]*?top:\s*calc\(8px \+ env\(safe-area-inset-top, 0px\)\);[\s\S]*?bottom:\s*auto;/);
  assert.match(mobile[1], /\.action-chrome\s*\{[\s\S]*?left:\s*12px;[\s\S]*?right:\s*12px;[\s\S]*?bottom:\s*calc\(8px \+ env\(safe-area-inset-bottom, 0px\)\);/);
  assert.match(mobile[1], /\.fab-root\s*\{[^}]*margin-left:\s*auto;/);
  assert.match(mobile[1], /\.bottom-chrome\.scroll-hidden \.floating-nav\s*\{[^}]*translateY\(calc\(-100% - 18px - env\(safe-area-inset-top, 0px\)\)\)/);
  assert.match(mobile[1], /\.bottom-chrome\.scroll-hidden \.action-chrome\s*\{[^}]*translateY\(calc\(100% \+ 18px \+ env\(safe-area-inset-bottom, 0px\)\)\)/);
});

test('top and bottom clearance independently track both responsive surfaces', () => {
  assert.match(bible, /--top-chrome-clearance:\s*0px;/);
  assert.match(bible, /--bottom-chrome-clearance:/);
  assert.match(bible, /var actionChrome = document\.getElementById\('action-chrome'\);/);
  assert.match(bible, /function updateBottomChromeClearance\(\) \{[\s\S]*?window\.matchMedia\('\(max-width: 640px\)'\)\.matches[\s\S]*?floatingNav\.classList\.contains\('hidden'\)[\s\S]*?floatingNav\.offsetHeight[\s\S]*?actionChrome\.offsetHeight[\s\S]*?setProperty\('--top-chrome-clearance',[\s\S]*?setProperty\('--bottom-chrome-clearance',/);
  assert.match(bible, /new ResizeObserver\(updateBottomChromeClearance\)[\s\S]*?\.observe\(floatingNav\);[\s\S]*?\.observe\(actionChrome\);/);
  assert.match(rule('.view-inner'), /padding-top:\s*calc\(16px \+ var\(--top-chrome-clearance\)\);/);
  assert.match(rule('.view-inner'), /padding-bottom:\s*calc\(16px \+ var\(--bottom-chrome-clearance\)\);/);
  assert.match(rule('.fab-panel'), /bottom:\s*var\(--bottom-chrome-clearance\);/);
  assert.match(rule('.bottom-history-menu'), /bottom:\s*var\(--bottom-chrome-clearance\);/);
});

test('minimum targets and narrow reflow protections remain intact', () => {
  assert.match(bible, /button,[\s\S]*?\[role="button"\]\s*\{[\s\S]*?min-width:\s*24px;[\s\S]*?min-height:\s*24px;/);
  assert.match(bible, /@media \(max-width: 320px\) \{[\s\S]*?\.view-inner,[\s\S]*?\.fab-panel,[\s\S]*?min-width:\s*0;[\s\S]*?max-width:\s*100%;/);
});
