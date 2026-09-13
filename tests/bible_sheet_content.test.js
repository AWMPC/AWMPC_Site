const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const bible = fs.readFileSync(process.env.BIBLE_UNDER_TEST || path.join(root, 'templates', 'bible.html'), 'utf8');

function functionSource(name, nextMarker) {
  const start = bible.indexOf(`  function ${name}(`);
  assert.ok(start >= 0, `${name} must exist`);
  const end = nextMarker ? bible.indexOf(nextMarker, start) : bible.indexOf('\n  function ', start + 12);
  assert.ok(end > start, `${name} must have a testable boundary`);
  return bible.slice(start, end);
}

for (const [kind, renderer, title] of [
  ['verse-actions', 'renderVerseActionsSheet', 'Verse Actions'],
  ['history', 'renderHistorySheet', 'History'],
  ['settings', 'renderSettingsSheet', 'Settings'],
  ['search', 'renderSearchSheet', 'Search']
]) {
  assert.match(bible, new RegExp(`registerAppSheetDescriptor\\('${kind}', \\{ label: '${title}', title: '${title}', render: function \\([^)]+\\) \\{[\\s\\S]*?${renderer}`),
    `${kind} must restore through the registered real renderer`);
}

assert.match(bible, /function openVerseActions\(verseEl\)[\s\S]*openAppSheet\('verse-actions', \{ opener: verseEl \}\)/,
  'active verse actions launch in the app sheet');
assert.match(bible, /bindAppSheetLauncher\(fabMain,[\s\S]*openAppSheet\('settings', \{ opener: fabMain \}\)/,
  'FAB launches settings in the app sheet');
assert.match(bible, /bindAppSheetLauncher\(document\.getElementById\('btn-history'\),[\s\S]*openAppSheet\('history', \{ opener: launcher \}\)/,
  'History launches in the app sheet');
assert.match(bible, /bindAppSheetLauncher\(document\.getElementById\('btn-search'\),[\s\S]*openAppSheet\('search', \{ opener: launcher \}\)/,
  'Search launches in the app sheet');

for (const [name, next] of [
  ['renderVerseActionsSheet', '\n  function renderHistorySheet'],
  ['renderHistorySheet', '\n  function renderSettingsSheet'],
  ['renderSettingsSheet', '\n  function renderSearchSheet'],
  ['renderSearchSheet', '\n  // ===================== BOOK BUTTON FACTORY']
]) {
  const source = functionSource(name, next);
  assert.doesNotMatch(source, /prepareToLeaveReadingView|viewInner\.textContent|setUIView\('search'|currentBook\s*=|currentChapter\s*=|activeVerse\s*=|pushNav\(/,
    `${name} must preserve the mounted reader and its route`);
  assert.doesNotMatch(source, /\.innerHTML\s*=/, `${name} must not use an unsafe dynamic HTML sink`);
}

assert.match(bible, /<dialog id="verse-actions"[^>]*hidden[^>]*inert/, 'the standalone verse action dialog is inert');
assert.match(bible, /id="history-menu"[^>]*hidden[^>]*inert/, 'legacy history popup is inert');
assert.match(bible, /id="fab-panel"[^>]*hidden[^>]*inert/, 'legacy settings popup is inert');
assert.match(bible, /\.bottom-history-menu\[hidden\],[\s\S]*\.fab-panel\[hidden\],[\s\S]*\.verse-actions\[hidden\][\s\S]*display:\s*none\s*!important/,
  'legacy surfaces cannot be made visible by their retired component CSS');

const verseActions = functionSource('renderVerseActionsSheet', '\n  function renderHistorySheet');
assert.match(verseActions, /currentVerseAction\(token\)/);
assert.match(verseActions, /writeClipboardText\(payload\.copyText\)/);
assert.match(verseActions, /writeClipboardText\(payload\.copyLink\)/);
assert.match(verseActions, /navigator\.share/);
assert.match(verseActions, /AbortError/);
assert.match(verseActions, /verseActionGeneration\+\+/,
  'closing invalidates async verse actions');
assert.doesNotMatch(functionSource('currentVerseAction', '\n  function finishVerseAction'), /appSheet\.open/,
  'verse action payload remains available while the descriptor renders before showModal');
assert.match(bible, /function finishVerseAction\([\s\S]*requestCloseAppSheet\('action'/,
  'successful verse action closes via the shared lifecycle');

const historyRenderer = functionSource('renderHistorySheet', '\n  function renderSettingsSheet');
assert.match(historyRenderer, /State\.getHistory\(\)/);
assert.match(historyRenderer, /State\.normalizeHistoryEntry/);
assert.match(historyRenderer, /normalizeVerseReference/);
assert.match(historyRenderer, /history\.replaceState\([^,]+, '', canonicalVerseUrl/,
  'history selection replaces temporary sheet history with canonical reader state');
assert.match(historyRenderer, /showVersesViewWithTransition/);

const settingsRenderer = functionSource('renderSettingsSheet', '\n  function renderSearchSheet');
assert.match(settingsRenderer, /while \(fabPanel\.firstChild\)[\s\S]*target\.appendChild\(fabPanel\.firstChild\)/,
  'settings reuses live nodes instead of cloning duplicate IDs');
assert.match(settingsRenderer, /return function[\s\S]*fabPanel\.appendChild/,
  'settings nodes return to their stable owner on close');

const queryStart = bible.indexOf('/* SEARCH SHEET PURE HELPERS START */');
const queryEnd = bible.indexOf('/* SEARCH SHEET PURE HELPERS END */');
assert.ok(queryStart >= 0 && queryEnd > queryStart, 'bounded search query helper is testable');
const queryContext = {};
vm.runInNewContext(bible.slice(queryStart, queryEnd) + '\nthis.bounded = boundedSearchQuery;', queryContext);
assert.equal(queryContext.bounded(`  ${'x'.repeat(200)}  `).length, 160);
assert.equal(queryContext.bounded(null), '');

const searchRenderer = functionSource('renderSearchSheet', '\n  // ===================== BOOK BUTTON FACTORY');
assert.match(searchRenderer, /boundedSearchQuery\(input\.value\)/,
  'query is bounded before normalization, persistence, or search');
assert.match(searchRenderer, /State\.pushSearchHistory\(q\)/);
assert.match(searchRenderer, /searchSheetGeneration\+\+/);
assert.match(searchRenderer, /clearTimeout\(debounce\)/);
assert.match(searchRenderer, /clearTimeout\(focusTimer\)/);
assert.match(searchRenderer, /if \(generation !== searchSheetGeneration \|\| !target\.isConnected\) return/,
  'detached search generations cannot mutate DOM');
assert.match(searchRenderer, /renderSearchSkeleton/);

assert.match(bible, /function scheduleSearchIndexChunk\([\s\S]*requestIdleCallback[\s\S]*setTimeout/,
  'search indexing uses idle chunks with a timer fallback');
assert.match(bible, /function buildSearchIndexInChunks\([\s\S]*SEARCH_INDEX_CHUNK_SIZE/,
  'search index work is bounded per chunk');
assert.match(bible, /bibleData = xhr\.response;[\s\S]*buildSearchIndexInChunks\(\);/,
  'indexing starts independently after Bible data loads');

assert.doesNotMatch(searchRenderer, /location|pushState|replaceState\([^,]+,[^,]+,[^)]*q/,
  'search query never enters URL/history state');
assert.match(bible, /function commitSearchResult\([\s\S]*normalizeVerseReference[\s\S]*history\.replaceState\([^,]+, '', canonicalVerseUrl[\s\S]*finishCloseAppSheet\(\)[\s\S]*showVersesViewWithTransition/,
  'search result validates, closes, canonicalizes, and then renders');

console.log('Bible sheet content contract passes');
