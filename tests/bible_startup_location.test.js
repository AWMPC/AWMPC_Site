const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');

function sourceBetween(start, end, source = bible) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing source marker: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing source marker: ${end}`);
  return source.slice(from, to);
}

const startupSource = sourceBetween(
  '/* STARTUP READING LOCATION START */',
  '/* STARTUP READING LOCATION END */'
);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function startupHarness(options = {}) {
  const dataset = options.dataset || {
    Genesis: { 1: { 1: 'Beginning', 2: 'Earth' } },
    John: { 3: { 16: 'Loved' } },
    Psalms: { 23: { 1: 'Shepherd' } }
  };
  const positions = clone(options.positions || []);
  const calls = { replace: [], push: [], show: [], announce: [], flush: 0 };
  let timerId = 0;
  const timers = new Map();
  const context = {
    bibleData: dataset,
    chapterPositions: positions,
    chapterPositionsDirty: false,
    readingRouteReplaceTimer: null,
    pendingReadingRoute: null,
    READING_ROUTE_REPLACE_MS: 120,
    uiView: options.uiView || 'books',
    currentBook: options.currentBook || null,
    currentChapter: options.currentChapter || null,
    activeVerse: options.activeVerse || null,
    navFromPop: false,
    appSheet: { open: !!options.sheet },
    appSheetState: {
      historyOwned: !!options.sheet,
      historyState: options.sheet ? {
        view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: clone(options.sheet)
      } : null
    },
    window: {
      location: { search: options.search || '', href: 'https://example.test/bible.html' },
      setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
      clearTimeout(id) { timers.delete(id); }
    },
    history: {
      state: options.historyState || null,
      replaceState(state, _title, url) {
        this.state = clone(state);
        calls.replace.push({ state: clone(state), url });
      },
      pushState(state, _title, url) { calls.push.push({ state: clone(state), url }); }
    },
    State: {
      setChapterPositions(next) { context.savedPositions = clone(next); calls.flush += 1; return true; }
    },
    scheduleChapterPositionFlush() {},
    flushChapterPositions() {
      if (!context.chapterPositionsDirty) return true;
      context.State.setChapterPositions(context.chapterPositions);
      context.chapterPositionsDirty = false;
      return true;
    },
    normalizeVerseReference(book, chapter, verse) {
      if (typeof book !== 'string' || !/^\d{1,3}$/.test(String(chapter)) || !/^\d{1,3}$/.test(String(verse))) return null;
      const chapterData = dataset[book] && dataset[book][String(chapter)];
      if (!chapterData || !Object.prototype.hasOwnProperty.call(chapterData, String(verse))) return null;
      return { book, chapter: Number(chapter), verse: String(verse) };
    },
    parseVerseReferenceQuery(search) {
      if (!search) return null;
      const params = new URLSearchParams(search);
      const keys = [...params.keys()];
      if (keys.length !== 3 || new Set(keys).size !== 3 ||
          !['book', 'chapter', 'verse'].every(key => params.getAll(key).length === 1) ||
          keys.some(key => !['book', 'chapter', 'verse'].includes(key))) return null;
      return context.normalizeVerseReference(params.get('book'), params.get('chapter'), params.get('verse'));
    },
    canonicalVerseUrl(book, chapter, verse) {
      return `https://example.test/bible.html?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`;
    },
    cleanBibleUrl() { return 'https://example.test/bible.html'; },
    showVersesView(book, chapter, verse) {
      calls.show.push({ book, chapter, verse, navFromPop: context.navFromPop });
      context.uiView = 'verses';
      context.currentBook = book;
      context.currentChapter = chapter;
      context.activeVerse = verse;
    },
    announceStatus(message) { calls.announce.push(message); },
    validatedAppSheetHistoryState(state) {
      if (!state || state.view !== 'verses' || !state.sheet || typeof state.sheet.kind !== 'string') return null;
      const reference = context.normalizeVerseReference(state.book, state.chapter, state.verse);
      return reference ? {
        view: 'verses', book: reference.book, chapter: String(reference.chapter), verse: reference.verse,
        sheet: clone(state.sheet)
      } : null;
    },
    isCurrentVersesView(book, chapter) {
      return context.uiView === 'verses' && context.currentBook === book &&
        String(context.currentChapter) === String(chapter);
    }
  };
  vm.runInNewContext(`${startupSource}\nthis.startupApi = {
    newestValidChapterPosition,
    defaultStartupReadingReference,
    startupReadingReference,
    openInitialViewFromUrl,
    resetReaderForOwnerIsolation,
    replaceReadingRoute,
    scheduleReadingRouteReplace,
    flushReadingRouteReplace
  };`, context);
  return {
    context,
    calls,
    api: context.startupApi,
    runTimers() {
      const callbacks = [...timers.values()];
      timers.clear();
      callbacks.forEach(callback => callback());
    },
    pendingTimers() { return timers.size; }
  };
}

test('startup precedence is strict URL, newest valid MRU, Genesis, then first dataset verse', () => {
  const linked = startupHarness({
    search: '?book=John&chapter=3&verse=16',
    positions: [{ key: 'Psalms|23', book: 'Psalms', chapter: '23', verse: '1' }]
  });
  linked.api.openInitialViewFromUrl();
  assert.deepEqual(linked.calls.show, [{ book: 'John', chapter: 3, verse: '16', navFromPop: true }]);
  assert.equal(linked.calls.push.length, 0);
  assert.equal(linked.calls.replace.length, 1);

  const recalled = startupHarness({
    positions: [{ key: 'Psalms|23', book: 'Psalms', chapter: '23', verse: '1' }]
  });
  recalled.api.openInitialViewFromUrl();
  assert.deepEqual(recalled.calls.show[0], { book: 'Psalms', chapter: 23, verse: '1', navFromPop: true });

  const genesis = startupHarness();
  genesis.api.openInitialViewFromUrl();
  assert.deepEqual(genesis.calls.show[0], { book: 'Genesis', chapter: 1, verse: '1', navFromPop: true });

  const datasetFallback = startupHarness({ dataset: { Obadiah: { 1: { 3: 'First valid' } } } });
  datasetFallback.api.openInitialViewFromUrl();
  assert.deepEqual(datasetFallback.calls.show[0], { book: 'Obadiah', chapter: 1, verse: '3', navFromPop: true });
});

test('startup prunes every dataset-invalid MRU and quarantine safely yields Genesis', () => {
  const h = startupHarness({ positions: [
    { key: 'Hostile|1', book: 'Hostile', chapter: '1', verse: '1' },
    { key: 'John|3', book: 'John', chapter: '3', verse: '999' },
    { key: 'Psalms|23', book: 'Psalms', chapter: '23', verse: '1' },
    { key: 'Genesis|9', book: 'Genesis', chapter: '9', verse: '9' }
  ] });
  assert.deepEqual(clone(h.api.newestValidChapterPosition()), { book: 'Psalms', chapter: 23, verse: '1' });
  assert.deepEqual(clone(h.context.chapterPositions), [
    { key: 'Psalms|23', book: 'Psalms', chapter: '23', verse: '1' }
  ]);
  assert.equal(h.context.chapterPositionsDirty, true);

  const quarantined = startupHarness({ positions: [] });
  assert.deepEqual(clone(quarantined.api.startupReadingReference('')), {
    reference: { book: 'Genesis', chapter: 1, verse: '1' }, invalidQuery: false
  });
  assert.doesNotMatch(startupSource, /localStorage|bible_[A-Za-z0-9_-]*position/i,
    'startup must consume owner-isolated State data rather than bypassing it');
});

test('an invalid query is cleaned, announced, and falls back to MRU without opening Books', () => {
  const h = startupHarness({
    search: '?book=John&chapter=3&verse=999&extra=private',
    positions: [{ key: 'Psalms|23', book: 'Psalms', chapter: '23', verse: '1' }]
  });
  h.api.openInitialViewFromUrl();
  assert.deepEqual(h.calls.show[0], { book: 'Psalms', chapter: 23, verse: '1', navFromPop: true });
  assert.equal(h.calls.replace[0].url.includes('extra'), false);
  assert.equal(h.calls.announce.length, 1);
  assert.match(h.calls.announce[0], /invalid/i);
  assert.doesNotMatch(startupSource, /showBooksView\s*\(/);
});

test('active verse routes debounce with replace only, preserve validated sheet state, and flush', () => {
  const h = startupHarness({
    uiView: 'verses', currentBook: 'John', currentChapter: 3, activeVerse: '16',
    sheet: { kind: 'search' }
  });
  h.api.scheduleReadingRouteReplace('John', 3, '16');
  h.context.currentBook = 'Genesis';
  h.context.currentChapter = 1;
  h.context.activeVerse = '2';
  h.api.scheduleReadingRouteReplace('Genesis', 1, '2');
  assert.equal(h.pendingTimers(), 1, 'rapid active changes coalesce');
  assert.equal(h.calls.replace.length, 0);
  h.api.flushReadingRouteReplace();
  assert.equal(h.pendingTimers(), 0);
  assert.equal(h.calls.push.length, 0);
  assert.equal(h.calls.replace.length, 1);
  assert.deepEqual(h.calls.replace[0].state.sheet, { kind: 'search' });
  assert.match(h.calls.replace[0].url, /book=Genesis&chapter=1&verse=2$/);

  h.api.scheduleReadingRouteReplace('Genesis', 1, '1');
  h.context.uiView = 'books';
  h.runTimers();
  assert.equal(h.calls.replace.length, 1, 'uncommitted or stale reader state is ignored');
});

test('owner isolation resets the reader canonically unless a private sheet is retained', () => {
  const reset = startupHarness({ uiView: 'verses', currentBook: 'John', currentChapter: 3, activeVerse: '16' });
  assert.equal(reset.api.resetReaderForOwnerIsolation(false), true);
  assert.deepEqual(reset.calls.show[0], { book: 'Genesis', chapter: 1, verse: '1', navFromPop: true });
  assert.equal(reset.calls.push.length, 0);
  assert.equal(reset.calls.replace.length, 1);

  const retained = startupHarness({ uiView: 'verses', currentBook: 'John', currentChapter: 3, activeVerse: '16' });
  assert.equal(retained.api.resetReaderForOwnerIsolation(true), false);
  assert.equal(retained.calls.show.length, 0, 'open private sheet refresh does not jump behind the sheet');
  assert.equal(retained.calls.replace.length, 0);
});

test('integration wires route tracking, pagehide flush, auth resets, and prevents late auth startup jumps', () => {
  const active = sourceBetween('  function setActiveVerse(verse, center) {', '  function updateActiveVerseFromViewport() {');
  assert.match(active, /scheduleReadingRouteReplace\(currentBook, currentChapter, nextVerse\)/);
  const pagehide = sourceBetween("  window.addEventListener('pagehide', function () {", "  window.addEventListener('pageshow', function (event) {");
  assert.match(pagehide, /flushReadingRouteReplace\(\);[\s\S]*rememberCurrentChapterPosition\(\);[\s\S]*flushChapterPositions\(\);/);

  const auth = sourceBetween("  auth.onAuthStateChanged(function (user) {", "\n\n  window.addEventListener('online'");
  assert.match(auth, /var retainedOwnerSheet = refreshOwnerScopedAppSheet\(\);[\s\S]*resetReaderForOwnerIsolation\(retainedOwnerSheet\);/,
    'signout resets only after owner-scoped sheet refresh');
  assert.match(auth, /isOwnerSwitch[\s\S]*resetReaderForOwnerIsolation\(/,
    'account switch resets the previous owner reader');
  assert.equal((auth.match(/openInitialViewFromUrl\s*\(/g) || []).length, 0,
    'auth resolution never performs a late startup jump');

  const load = sourceBetween('  function loadBibleData() {', '\n\n  loadBibleData();');
  assert.equal((load.match(/openInitialViewFromUrl\s*\(/g) || []).length, 1,
    'data load initializes the reader exactly once');
});

test('canonical route can be parsed on reload and routing guards are mutation-sensitive', () => {
  const first = startupHarness({ uiView: 'verses', currentBook: 'John', currentChapter: 3, activeVerse: '16' });
  first.api.replaceReadingRoute('John', 3, '16');
  const canonical = first.calls.replace[0].url;
  const reload = startupHarness({ search: new URL(canonical).search });
  reload.api.openInitialViewFromUrl();
  assert.deepEqual(reload.calls.show[0], { book: 'John', chapter: 3, verse: '16', navFromPop: true });

  assert.match(startupSource, /history\.replaceState\(/);
  assert.doesNotMatch(startupSource, /history\.pushState\(/);
  assert.match(startupSource, /isCurrentVersesView\(reference\.book, reference\.chapter\)/);
  assert.match(startupSource, /activeVerse !== reference\.verse/);
  assert.match(startupSource, /validatedAppSheetHistoryState\(appSheetState\.historyState\)/);
});
