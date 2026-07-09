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
  const source = options.source || startupSource;
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
    bibleData: options.dataLoaded === false ? null : dataset,
    chapterPositions: positions,
    chapterPositionsDirty: false,
    readingRouteReplaceTimer: null,
    pendingReadingRoute: null,
    READING_ROUTE_REPLACE_MS: 120,
    readerRouteScope: options.readerRouteScope || 0,
    pendingReaderOwnerIsolation: false,
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
  vm.runInNewContext(`${source}\nthis.startupApi = {
    firstDatasetVerseReference,
    newestValidChapterPosition,
    defaultStartupReadingReference,
    startupReadingReference,
    openInitialViewFromUrl,
    openInitialReaderAfterDataLoad: typeof openInitialReaderAfterDataLoad === 'function' ? openInitialReaderAfterDataLoad : null,
    resetReaderForOwnerIsolation,
    replaceReadingRoute,
    scheduleReadingRouteReplace,
    flushReadingRouteReplace,
    isCurrentReaderRouteState: typeof isCurrentReaderRouteState === 'function' ? isCurrentReaderRouteState : null
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

test('owner isolation always resets the reader canonically even when a private sheet is retained', () => {
  const reset = startupHarness({ uiView: 'verses', currentBook: 'John', currentChapter: 3, activeVerse: '16' });
  assert.equal(reset.api.resetReaderForOwnerIsolation(false), true);
  assert.deepEqual(reset.calls.show[0], { book: 'Genesis', chapter: 1, verse: '1', navFromPop: true });
  assert.equal(reset.calls.push.length, 0);
  assert.equal(reset.calls.replace.length, 1);

  const retained = startupHarness({ uiView: 'verses', currentBook: 'John', currentChapter: 3, activeVerse: '16' });
  retained.context.appSheet.open = true;
  retained.context.appSheetState.historyOwned = true;
  retained.context.appSheetState.historyState = {
    view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' }
  };
  assert.equal(retained.api.resetReaderForOwnerIsolation(true), true);
  assert.deepEqual(retained.calls.show[0], { book: 'Genesis', chapter: 1, verse: '1', navFromPop: true });
  assert.equal(retained.calls.replace.length, 1, 'the prior owner route is replaced beneath the retained sheet');
  assert.equal(retained.context.appSheetState.historyOwned, false,
    'closing the retained sheet must not traverse back to the prior owner route');
  assert.deepEqual(clone(retained.context.appSheetState.historyState), {
    view: 'verses', book: 'Genesis', chapter: 1, verse: '1', readerRouteScope: 1
  }, 'sheet history state is rebased to the safe reader route');
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
  assert.equal((load.match(/openInitialReaderAfterDataLoad\s*\(/g) || []).length, 1,
    'data load initializes the reader exactly once');
});

test('canonical route can be parsed on reload and routing guards reject executable mutations', () => {
  const first = startupHarness({ uiView: 'verses', currentBook: 'John', currentChapter: 3, activeVerse: '16' });
  first.api.replaceReadingRoute('John', 3, '16');
  const canonical = first.calls.replace[0].url;
  const reload = startupHarness({ search: new URL(canonical).search });
  reload.api.openInitialViewFromUrl();
  assert.deepEqual(reload.calls.show[0], { book: 'John', chapter: 3, verse: '16', navFromPop: true });

  const retainedLeak = startupSource.replace(
    'readerRouteScope += 1;',
    'if (retainedOwnerSheet) return false;\n    readerRouteScope += 1;'
  );
  assert.notEqual(retainedLeak, startupSource, 'retained-sheet privacy mutant must apply');
  const leaked = startupHarness({
    source: retainedLeak,
    uiView: 'verses', currentBook: 'John', currentChapter: 3, activeVerse: '16'
  });
  assert.equal(leaked.api.resetReaderForOwnerIsolation(true), false,
    'the mutant demonstrates the previous-owner reader leak');

  const reversedPrecedence = startupSource.replace(
    'linkedReference || newestValidChapterPosition() || defaultStartupReadingReference()',
    'newestValidChapterPosition() || linkedReference || defaultStartupReadingReference()'
  );
  assert.notEqual(reversedPrecedence, startupSource, 'URL precedence mutant must apply');
  const wrongPriority = startupHarness({
    source: reversedPrecedence,
    search: '?book=John&chapter=3&verse=16',
    positions: [{ key: 'Psalms|23', book: 'Psalms', chapter: '23', verse: '1' }]
  });
  wrongPriority.api.openInitialViewFromUrl();
  assert.deepEqual(wrongPriority.calls.show[0], {
    book: 'Psalms', chapter: 23, verse: '1', navFromPop: true
  }, 'the mutant demonstrates why an explicit URL must remain first');

  const pushMutation = startupSource.replace(
    'history.replaceState(state, \'\', canonicalVerseUrl(reference.book, reference.chapter, reference.verse));',
    'history.pushState(state, \'\', canonicalVerseUrl(reference.book, reference.chapter, reference.verse));'
  );
  assert.notEqual(pushMutation, startupSource, 'replace-only route mutant must apply');
  const historyGrowth = startupHarness({
    source: pushMutation,
    uiView: 'verses', currentBook: 'John', currentChapter: 3, activeVerse: '16'
  });
  historyGrowth.api.replaceReadingRoute('John', 3, '16');
  assert.equal(historyGrowth.calls.push.length, 1, 'the mutant demonstrates unwanted history growth');
});

test('pagehide executes route and chapter-position flushes in privacy-safe order', () => {
  const pagehide = sourceBetween(
    "  window.addEventListener('pagehide', function () {",
    "  window.addEventListener('pageshow', function (event) {"
  );
  const body = pagehide.slice(pagehide.indexOf('{') + 1, pagehide.lastIndexOf('}'));
  function execute(source) {
    const calls = [];
    vm.runInNewContext(`(function () {${source}})()`, {
      _clearSyncTimers() { calls.push('sync'); },
      flushReadingRouteReplace() { calls.push('route'); },
      rememberCurrentChapterPosition() { calls.push('remember'); },
      flushChapterPositions() { calls.push('positions'); },
      cancelHistorySettle() { calls.push('settle'); },
      clearPendingReaderVerseAction() { calls.push('reader-action'); },
      clearSuppressReaderClick() { calls.push('reader-click'); },
      closeVerseActions() { calls.push('verse-actions'); },
      uiView: 'verses',
      bibleLoadGeneration: 0,
      bibleLoadRequest: null
    });
    return calls;
  }
  const persistenceCalls = calls => calls.filter(call => ['route', 'remember', 'positions'].includes(call));
  assert.deepEqual(persistenceCalls(execute(body)), ['route', 'remember', 'positions']);
  const withoutRouteFlush = body.replace('flushReadingRouteReplace();', '');
  assert.notDeepEqual(persistenceCalls(execute(withoutRouteFlush)), ['route', 'remember', 'positions'],
    'removing the route flush must be observable');
});

test('owner route scope rejects Back navigation into a prior owner history entry', () => {
  const h = startupHarness({
    readerRouteScope: 4,
    uiView: 'verses', currentBook: 'Genesis', currentChapter: 1, activeVerse: '1'
  });
  assert.equal(typeof h.api.isCurrentReaderRouteState, 'function');
  assert.equal(h.api.isCurrentReaderRouteState({
    view: 'verses', book: 'Genesis', chapter: 1, verse: '1', readerRouteScope: 4
  }), true);
  assert.equal(h.api.isCurrentReaderRouteState({
    view: 'verses', book: 'John', chapter: 3, verse: '16', readerRouteScope: 3
  }), false, 'a previous owner/session route must not be restorable with Back');
  assert.equal(h.api.isCurrentReaderRouteState({
    view: 'verses', book: 'John', chapter: 3, verse: '16'
  }), false, 'legacy unscoped routes become stale after owner isolation');

  const popstate = sourceBetween(
    "  window.addEventListener('popstate', function (e) {",
    '\n\n  function normalizeLegacySelectionHistory'
  );
  assert.match(popstate, /isCurrentReaderRouteState\(s\)/);
  assert.match(popstate, /showCanonicalReadingReference\(defaultStartupReadingReference\(\)\)/);
});

test('empty, array, and structurally invalid Bible data have no startup reference', () => {
  assert.equal(startupHarness({ dataset: {} }).api.firstDatasetVerseReference(), null);
  assert.equal(startupHarness({ dataset: [] }).api.firstDatasetVerseReference(), null);
  assert.equal(startupHarness({ dataset: { Genesis: { nope: [] } } }).api.firstDatasetVerseReference(), null);

  const loader = sourceBetween('  function loadBibleData() {', '\n\n  loadBibleData();');
  assert.match(loader, /firstDatasetVerseReference\(\)/,
    'the loader must validate that the response contains at least one usable verse');
  assert.match(loader, /showLoadError\(/,
    'invalid data must retain a retryable error surface');
});

test('owner isolation before data load scopes stale routes and forces the safe post-load default', () => {
  const h = startupHarness({
    dataLoaded: false,
    search: '?book=John&chapter=3&verse=16',
    uiView: 'verses', currentBook: 'John', currentChapter: 3, activeVerse: '16'
  });
  assert.equal(typeof h.api.openInitialReaderAfterDataLoad, 'function');
  assert.equal(h.api.resetReaderForOwnerIsolation(false), false, 'reset waits for validated Bible data');
  assert.equal(h.context.readerRouteScope, 1, 'scope invalidates prior owner history immediately');
  assert.equal(h.context.pendingReaderOwnerIsolation, true);
  assert.equal(h.api.isCurrentReaderRouteState({
    view: 'verses', book: 'John', chapter: 3, verse: '16', readerRouteScope: 0
  }), false);

  h.context.bibleData = {
    Genesis: { 1: { 1: 'Beginning' } },
    John: { 3: { 16: 'Loved' } }
  };
  assert.equal(h.api.openInitialReaderAfterDataLoad(), true);
  assert.equal(h.context.pendingReaderOwnerIsolation, false);
  assert.deepEqual(h.calls.show[0], { book: 'Genesis', chapter: 1, verse: '1', navFromPop: true },
    'the previous owner URL cannot win after delayed data load');
});
