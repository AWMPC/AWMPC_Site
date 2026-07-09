const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');

assert.doesNotMatch(bible, /function showSearchView(?:WithTransition)?\s*\(/,
  'legacy destructive search view functions are removed');
assert.doesNotMatch(bible, /setUIView\('search'\)/, 'Search never replaces the mounted reader view');
assert.doesNotMatch(bible, /uiView === 'search'/, 'no lifecycle branch can re-enter the retired Search view');

function sourceBetween(startMarker, endMarker) {
  const start = bible.indexOf(startMarker);
  const end = bible.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `missing source boundary: ${startMarker}`);
  return bible.slice(start, end);
}

function functionSource(name, endMarker = '\n  function ') {
  const startMarker = `  function ${name}(`;
  const start = bible.indexOf(startMarker);
  const end = bible.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `missing function: ${name}`);
  return bible.slice(start, end);
}

const searchRendererSource = functionSource('renderSearchSheet', '\n\n\n  // ===================== BOOK BUTTON FACTORY');
assert.doesNotMatch(searchRendererSource, /cleanupAppSheetViewportOwnership/,
  'content rerenders cannot tear down controller-owned Search viewport lifetime');
assert.match(searchRendererSource,
  /if \(!appSheetState\.searchFullscreenLatched \|\| appSheetState\.viewportOwnerGeneration !== sheetGeneration\)[\s\S]*focusTimer = window\.setTimeout/,
  'a same-generation latched Search refresh does not schedule a second autofocus lifecycle');

{
  const refreshSource = functionSource('refreshOwnerScopedAppSheet');
  const body = fakeElement('main');
  let ownerText = 'owner-a-history';
  let cleanupCalls = 0;
  let readerJumps = 0;
  const context = {
    appSheet: { open: true },
    appSheetState: { kind: 'history', contentCleanup: () => { cleanupCalls += 1; } },
    appSheetBody: body,
    resolveAppSheetDescriptor() {
      return { render(target) { target.textContent = ownerText; } };
    },
    renderAppSheetContent(descriptor) {
      if (typeof context.appSheetState.contentCleanup === 'function') context.appSheetState.contentCleanup();
      context.appSheetState.contentCleanup = null;
      body.textContent = '';
      descriptor.render(body);
    },
    showBooksView() { readerJumps += 1; }
  };
  vm.runInNewContext(`${refreshSource}\nthis.refresh = refreshOwnerScopedAppSheet;`, context);
  context.refresh();
  assert.equal(body.textContent, 'owner-a-history');
  ownerText = 'signed-out-empty';
  context.refresh();
  assert.equal(body.textContent, 'signed-out-empty', 'sign-out replaces prior owner History immediately');
  ownerText = 'owner-b-history';
  context.refresh();
  assert.equal(body.textContent, 'owner-b-history', 'A-to-B hydration replaces isolated History content');
  assert.equal(cleanupCalls, 1, 'the stale owner renderer cleanup runs before its first replacement');
  assert.equal(readerJumps, 0, 'ownership refresh never navigates the reader');

  context.appSheetState.kind = 'search';
  let searchGeneration = 10;
  const armSearchCleanup = () => {
    context.appSheetState.contentCleanup = () => { searchGeneration += 1; cleanupCalls += 1; };
  };
  ownerText = 'owner-a-search';
  armSearchCleanup();
  context.refresh();
  assert.equal(body.textContent, 'owner-a-search');
  ownerText = 'signed-out-search-empty';
  armSearchCleanup();
  context.refresh();
  assert.equal(body.textContent, 'signed-out-search-empty', 'sign-out replaces prior owner Search immediately');
  ownerText = 'owner-b-search';
  armSearchCleanup();
  context.refresh();
  assert.equal(searchGeneration, 13, 'each Search ownership refresh invalidates its previous generation');
  assert.equal(cleanupCalls, 4);
  assert.equal(body.textContent, 'owner-b-search');
}

const authSource = sourceBetween("  auth.onAuthStateChanged(function (user) {", "\n\n  window.addEventListener('online'");
assert.match(authSource, /_syncedLocalStateQuarantined = !signoutStorageCleared;[\s\S]*refreshOwnerScopedAppSheet\(\);/,
  'sign-out refreshes owner-scoped sheet after State isolation');
assert.match(authSource, /var retainedOwnerSheet = refreshOwnerScopedAppSheet\(\);[\s\S]*resetReaderForOwnerIsolation\(retainedOwnerSheet\);/,
  'sign-out delegates the safe reader reset while preserving a retained owner-scoped sheet');
assert.match(authSource, /_syncedLocalStateQuarantined = true;[\s\S]*refreshOwnerScopedAppSheet\(\);[\s\S]*_setSyncStatus\('Sync unavailable'\)/,
  'failed owner switch quarantine refreshes before returning');
assert.match(authSource, /_setLocalOwnerUid\(authUid\);[\s\S]*refreshOwnerScopedAppSheet\(\);/,
  'successful A-to-B isolation refreshes before hydration');
assert.match(sourceBetween('    applyCloudData: function (data, skippedFields) {', '\n    }\n  };'), /refreshOwnerScopedAppSheet\(\);/,
  'cloud hydration refreshes visible owner-scoped content');

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    json(key) { const value = this.getItem(key); return value == null ? null : JSON.parse(value); }
  };
}

function loadState(initial = {}) {
  const storage = makeStorage(initial);
  const pure = sourceBetween('/* SEARCH SHEET PURE HELPERS START */', '/* SEARCH SHEET PURE HELPERS END */');
  const stateSource = sourceBetween('  var State = {', '\n\n  // ===================== CONSTANTS');
  const syncPayload = functionSource('_syncPayload');
  const context = {
    localStorage: storage,
    _syncedLocalStateQuarantined: false,
    SYNCED_LOCAL_KEYS: [],
    _localRevision: 0,
    LOCAL_KEY_TO_SYNC_FIELD: Object.create(null),
    _localFieldRevisions: Object.create(null),
    _scheduleSync() {},
    DEFAULT_TEXT_SCALE: 100,
    normalizeTextScale(value) { return typeof value === 'number' ? value : null; },
    refreshOwnerScopedAppSheet() {},
    firebase: { firestore: { FieldValue: { serverTimestamp() { return 'server-time'; } } } }
  };
  vm.runInNewContext(`${pure}\n${stateSource}\n${syncPayload}\nthis.api = { State, sync: _syncPayload };`, context);
  return { ...context.api, storage };
}

{
  const hostile = [
    ' x ', 'valid query', ` ${'z'.repeat(220)} `, 'valid query', null, {}, 'ok', 'x', '  another  '
  ];
  const { State, sync, storage } = loadState({ bible_search_hist: JSON.stringify(hostile) });
  const normalized = JSON.parse(JSON.stringify(State.getSearchHistory()));
  assert.deepEqual(normalized, ['valid query', 'z'.repeat(160), 'ok', 'another']);
  assert.ok(normalized.every(query => typeof query === 'string' && query.length >= 2 && query.length <= 160));
  assert.deepEqual(JSON.parse(JSON.stringify(sync().searchHistory)), normalized,
    'cloud payload is normalized even when local storage was hostile');

  State.pushSearchHistory(`  ${'p'.repeat(200)}  `);
  assert.equal(State.getSearchHistory()[0], 'p'.repeat(160));
  const beforeShortPush = JSON.stringify(State.getSearchHistory());
  State.pushSearchHistory(' q ');
  assert.equal(JSON.stringify(State.getSearchHistory()), beforeShortPush, 'short queries are never persisted');
  const hostileInput = { toString() { throw new Error('untrusted coercion ran'); } };
  assert.doesNotThrow(() => State.pushSearchHistory(hostileInput));
  assert.doesNotThrow(() => State.removeSearchHistory(hostileInput));
  assert.equal(JSON.stringify(State.getSearchHistory()), beforeShortPush, 'non-string State inputs are rejected');
  State.removeSearchHistory(` ${'p'.repeat(200)} `);
  assert.equal(State.getSearchHistory().includes('p'.repeat(160)), false, 'remove normalizes its input');

  State.applyCloudData({
    searchHistory: [` ${'c'.repeat(200)} `, 'hi', ' h ', 'hi', 42, 'cloud valid']
  }, []);
  assert.deepEqual(storage.json('bible_search_hist'), ['c'.repeat(160), 'hi', 'cloud valid'],
    'cloud hydration is normalized before local persistence');
  State.applyCloudData({ searchHistory: Array.from({ length: 25 }, (_, index) => `cloud-${index}`) }, []);
  assert.equal(storage.json('bible_search_hist').length, 20, 'cloud hydration retains the existing 20-query cap');

  storage.setItem('bible_history', JSON.stringify([{ book: 'John', ch: '3', verse: '16' }]));
  State.clearHistory();
  assert.deepEqual(storage.json('bible_history'), [], 'clearHistory persists through the State boundary');
}

{
  const pure = sourceBetween('/* SEARCH SHEET PURE HELPERS START */', '/* SEARCH SHEET PURE HELPERS END */');
  const mutated = pure.replace('.slice(0, 160)', '.slice(0, 200)');
  assert.notEqual(mutated, pure, 'query-limit mutation must alter production source');
  const context = {};
  vm.runInNewContext(`${mutated}\nthis.bounded = boundedSearchQuery;`, context);
  assert.equal(context.bounded('x'.repeat(220)).length, 200, '160-to-200 mutation is behaviorally observable');
}

{
  let popHandler = null;
  const calls = { open: 0, destructive: 0, books: 0 };
  const context = {
    bibleData: { John: { 3: { 16: 'text' } } },
    window: { addEventListener(type, handler) { if (type === 'popstate') popHandler = handler; } },
    handleAppSheetPopState() { return false; },
    suppressNextPopupPop: false,
    fabPanel: { classList: { contains() { return false; } } },
    openMenu: null,
    closeMenus() {},
    fabPanelHistoryOpen: false,
    openFabPanel() {},
    navFromPop: false,
    normalizeVerseReference(book, chapter, verse) {
      return book === 'John' && String(chapter) === '3' && String(verse) === '16' ?
        { book: 'John', chapter: 3, verse: '16' } : null;
    },
    normalizeBookChapter() { return null; },
    showSelectedVerseWithTransition() {},
    showVersePickerViewWithTransition() {},
    showChaptersViewWithTransition() {},
    showSearchViewWithTransition() { calls.destructive += 1; },
    showBooksViewWithTransition() { calls.books += 1; },
    currentNavStateForHistory() { return { view: 'verses', book: 'John', chapter: 3, verse: '16' }; },
    canonicalVerseUrl() { return 'https://example.invalid/bible.html?book=John&chapter=3&verse=16'; },
    history: {
      replaceState(state, _title, url) {
        assert.equal(Object.prototype.hasOwnProperty.call(state, 'query'), false);
        assert.equal(url.includes('must-not-survive'), false);
      }
    },
    openAppSheet(kind, options) {
      assert.equal(kind, 'search');
      assert.equal(options.fromPop, true);
      assert.deepEqual(JSON.parse(JSON.stringify(options.historyState)), {
        view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'search' }
      });
      calls.open += 1;
      return true;
    }
  };
  vm.runInNewContext(sourceBetween("  window.addEventListener('popstate', function (e) {", '\n\n  // ===================== VIEW: BOOKS'), context);
  assert.equal(typeof popHandler, 'function');
  popHandler({ state: { view: 'search', query: 'must-not-survive' } });
  assert.deepEqual(calls, { open: 1, destructive: 0, books: 0 },
    'legacy search state opens a query-free sheet without replacing the reader');
}

function fakeElement(tag = 'div') {
  const listeners = Object.create(null);
  const classes = new Set();
  let text = '';
  const element = {
    tag, children: [], parentNode: null, value: '', style: {}, isConnected: true,
    className: '', type: '', maxLength: 0,
    classList: {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      contains(name) { return classes.has(name); }
    },
    setAttribute() {},
    appendChild(child) {
      if (child.parentNode) {
        const index = child.parentNode.children.indexOf(child);
        if (index >= 0) child.parentNode.children.splice(index, 1);
      }
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    addEventListener(type, handler) { (listeners[type] || (listeners[type] = [])).push(handler); },
    removeEventListener(type, handler) {
      const handlers = listeners[type] || [];
      const index = handlers.indexOf(handler);
      if (index >= 0) handlers.splice(index, 1);
    },
    dispatch(type, event = {}) { (listeners[type] || []).forEach(handler => handler({ target: this, ...event })); },
    click() { this.dispatch('click', { stopPropagation() {} }); },
    focus() { this.focused = true; }
  };
  Object.defineProperty(element, 'textContent', {
    get() { return text; },
    set(value) { text = String(value); if (text === '') element.children.length = 0; }
  });
  Object.defineProperty(element, 'firstChild', { get() { return element.children[0] || null; } });
  return element;
}

{
  const created = [];
  let clearCalls = 0;
  let historyList = [{ book: 'Bad', ch: '99', verse: '99' }];
  const target = fakeElement();
  const context = {
    document: {
      createElement(tag) { const node = fakeElement(tag); created.push(node); return node; }
    },
    State: {
      getHistory() { return historyList; },
      normalizeHistoryEntry(entry) { return entry; },
      clearHistory() { clearCalls += 1; historyList = []; }
    },
    normalizeVerseReference() { return null; },
    setMarqueeText(node, value) { node.textContent = value; },
    formatHistoryTimestamp() { return 'time'; },
    history: {}, canonicalVerseUrl() {}, finishCloseAppSheet() {}, navFromPop: false,
    showVersesViewWithTransition() {}
  };
  vm.runInNewContext(`${functionSource('renderHistorySheet', '\n  function renderSettingsSheet')}\nthis.render = renderHistorySheet;`, context);
  context.render(target);
  assert.ok(target.children.some(node => node.className === 'dd-empty'), 'all-invalid history renders empty state');
  const clear = target.children.find(node => node.className === 'search-hist-clear');
  assert.ok(clear, 'history sheet renders a clear control');
  clear.click();
  assert.equal(clearCalls, 1);
  assert.ok(target.children.some(node => node.className === 'dd-empty'), 'clear immediately rerenders empty state');
  assert.equal(target.children.some(node => node.className === 'search-hist-clear'), false,
    'clear control is removed after history is empty');
}

{
  const first = fakeElement('section');
  const second = fakeElement('section');
  const fabPanel = fakeElement('aside');
  fabPanel.appendChild(first);
  fabPanel.appendChild(second);
  const target = fakeElement('main');
  const context = { fabPanel };
  vm.runInNewContext(`${functionSource('renderSettingsSheet', '\n  function renderSearchSheet')}\nthis.render = renderSettingsSheet;`, context);
  for (let cycle = 0; cycle < 3; cycle++) {
    const cleanup = context.render(target);
    assert.deepEqual(target.children, [first, second], 'settings moves the same live nodes into the sheet');
    assert.equal(fabPanel.children.length, 0);
    cleanup();
    assert.deepEqual(fabPanel.children, [first, second], 'settings cleanup returns the same live nodes');
    assert.equal(target.children.length, 0);
  }
}

{
  const timers = new Map();
  let nextTimer = 1;
  const runQueries = [];
  const created = [];
  const focusOrder = [];
  let viewportCleanupCalls = 0;
  const context = {
    searchSheetGeneration: 0,
    searchIndexReady: false,
    appSheet: { open: true },
    appSheetState: { generation: 41, kind: 'search' },
    latchMobileSearchFullscreen(generation) {
      focusOrder.push(['latch', generation]);
      return true;
    },
    cleanupAppSheetViewportOwnership() { viewportCleanupCalls += 1; },
    document: { createElement(tag) { const node = fakeElement(tag); created.push(node); return node; } },
    window: {
      setTimeout(handler) { const id = nextTimer++; timers.set(id, handler); return id; },
      clearTimeout(id) { timers.delete(id); }
    },
    clearTimeout(id) { timers.delete(id); },
    boundedSearchQuery(value) { return String(value == null ? '' : value).trim().slice(0, 160); },
    State: { pushSearchHistory() {} },
    renderSearchHistory() {},
    renderSearchSkeleton() {},
    runSearch(query) { runQueries.push(query); }
  };
  vm.runInNewContext(`${functionSource('renderSearchSheet', '\n\n\n  // ===================== BOOK BUTTON FACTORY')}\nthis.render = renderSearchSheet;`, context);
  const target = fakeElement();
  const cleanup = context.render(target);
  const input = created.find(node => node.tag === 'input');
  input.focus = options => { focusOrder.push(['focus', options]); };
  input.dispatch('focus');
  assert.deepEqual(focusOrder, [['latch', 41]],
    'manual input focus uses the generation-owned mobile fullscreen latch');
  input.value = ' pending truth ';
  input.dispatch('input');
  context.searchIndexReady = true;
  const [readinessId, readiness] = [...timers.entries()][0];
  timers.delete(readinessId);
  readiness();
  assert.deepEqual(runQueries, ['pending truth'], 'index readiness reruns the current bounded query');
  const remainingAfterReady = [...timers.values()];
  timers.clear();
  remainingAfterReady.forEach(callback => callback());
  assert.deepEqual(runQueries, ['pending truth'], 'readiness cancels the superseded input debounce');
  assert.equal(JSON.stringify(focusOrder), JSON.stringify([['latch', 41], ['latch', 41], ['focus', { preventScroll: true }]]),
    'delayed autofocus commits the fullscreen latch before exactly one preventScroll focus');

  context.appSheetState.searchFullscreenLatched = true;
  context.appSheetState.viewportOwnerGeneration = 41;
  const refreshTarget = fakeElement();
  const cleanupRefresh = context.render(refreshTarget);
  assert.equal(timers.size, 0, 'same-generation latched refresh schedules no second autofocus timer');
  cleanupRefresh();
  assert.equal(viewportCleanupCalls, 0, 'Search content cleanup cannot release controller viewport ownership');
  context.appSheetState.searchFullscreenLatched = false;
  context.appSheetState.viewportOwnerGeneration = null;

  const detachedTarget = fakeElement();
  const cleanupDetached = context.render(detachedTarget);
  const detachedInput = created.filter(node => node.tag === 'input').at(-1);
  detachedInput.value = 'must not run';
  detachedInput.dispatch('input');
  const lateCallbacks = [...timers.values()];
  cleanupDetached();
  detachedTarget.isConnected = false;
  lateCallbacks.forEach(callback => callback());
  assert.deepEqual(runQueries, ['pending truth'], 'closed generations cannot rerun detached search work');
  assert.equal(focusOrder.filter(entry => entry[0] === 'focus').length, 1,
    'detached Search generations cannot receive stale autofocus');
  context.appSheetState.generation += 1;
  context.appSheetState.kind = 'history';
  lateCallbacks.forEach(callback => callback());
  assert.equal(focusOrder.filter(entry => entry[0] === 'focus').length, 1,
    'autofocus verifies the current app sheet generation and kind');
  const latchCallsBeforeCleanup = focusOrder.filter(entry => entry[0] === 'latch').length;
  cleanup();
  input.dispatch('focus');
  assert.equal(focusOrder.filter(entry => entry[0] === 'latch').length, latchCallsBeforeCleanup,
    'Search cleanup removes its input focus listener');

  context.appSheetState.generation = 55;
  context.appSheetState.kind = 'search';
  context.appSheetState.phase = 'closing';
  const closingTarget = fakeElement();
  const cleanupClosing = context.render(closingTarget);
  const closingInput = created.filter(node => node.tag === 'input').at(-1);
  closingInput.focus = options => { focusOrder.push(['closing-focus', options]); };
  const closingCallbacks = [...timers.values()];
  timers.clear();
  closingCallbacks.forEach(callback => callback());
  assert.equal(focusOrder.some(entry => entry[0] === 'closing-focus'), false,
    'a pending autofocus callback cannot summon the keyboard after close begins');
  cleanupClosing();
}

{
  const closeCalls = [];
  let legacyFinishCalls = 0;
  const context = {
    selectionContext: { book: 'John', chapter: 3 },
    normalizeVerseReference(book, chapter, verse) { return { book, chapter, verse }; },
    readerRouteScope: 0,
    history: { replaceState() {} },
    canonicalVerseUrl() { return '/bible'; },
    appSheetState: { historyOwned: true },
    navFromPop: false,
    showSelectedVerseWithTransition() {},
    requestCloseAppSheet(...args) { closeCalls.push(args); return true; },
    finishCloseAppSheet() { legacyFinishCalls += 1; }
  };
  vm.runInNewContext(`${functionSource('commitSelectionVerse')}
this.commit = commitSelectionVerse;`, context);
  assert.equal(context.commit(16), true);
  assert.deepEqual(closeCalls, [['selection-complete', 'reader']],
    'selection completion freezes reader focus in the generation-safe close lifecycle');
  assert.equal(legacyFinishCalls, 0, 'selection completion cannot bypass close policy and generation checks');
}

console.log('Bible sheet content behavior tests pass');
