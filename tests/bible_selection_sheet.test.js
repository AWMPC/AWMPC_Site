const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');

function extract(pattern, message) {
  const match = bible.match(pattern);
  assert.ok(match, message);
  return match[0];
}

function selectionHelpers() {
  const source = extract(
    /\/\* SELECTION SHEET PURE HELPERS START \*\/[\s\S]*?\/\* SELECTION SHEET PURE HELPERS END \*\//,
    'selection sheet pure helpers are missing'
  );
  return Function(`${source}; return {
    selectionPages, isValidSelectionPage, selectionSheetEdge,
    selectionSwipePage, normalizedSelectionPage
  };`)();
}

test('selection page enum and responsive edge are strict at the 640px boundary', () => {
  const h = selectionHelpers();
  assert.deepEqual(h.selectionPages, ['books', 'chapters', 'verses']);
  assert.equal(h.isValidSelectionPage('books'), true);
  assert.equal(h.isValidSelectionPage('chapter'), false);
  assert.equal(h.normalizedSelectionPage('not-a-page'), 'books');
  assert.equal(h.selectionSheetEdge(320), 'top');
  assert.equal(h.selectionSheetEdge(640), 'top');
  assert.equal(h.selectionSheetEdge(641), 'bottom');
  assert.equal(h.selectionSheetEdge(Infinity), 'bottom');
});

test('horizontal swipe changes at most one page and ignores vertical or short movement', () => {
  const { selectionSwipePage } = selectionHelpers();
  assert.equal(selectionSwipePage('chapters', -90, 0, 'x'), 'verses');
  assert.equal(selectionSwipePage('chapters', 90, 0, 'x'), 'books');
  assert.equal(selectionSwipePage('books', -500, 0, 'x'), 'chapters');
  assert.equal(selectionSwipePage('verses', 500, 0, 'x'), 'chapters');
  assert.equal(selectionSwipePage('chapters', -10, -0.1, 'x'), 'chapters');
  assert.equal(selectionSwipePage('chapters', -90, -1, 'y'), 'chapters');
  assert.equal(selectionSwipePage('chapters', -10, -0.5, 'x'), 'verses');
});

test('selection renderer owns one persistent three-panel track and three real accessible dots', () => {
  const renderer = extract(
    /function renderSelectionSheet\(target, sheet\) \{[\s\S]*?\n  \}/,
    'selection renderer missing'
  );
  const panelFactory = extract(/function createSelectionPanel\(page, label\) \{[\s\S]*?\n  \}/, 'selection panel factory missing');
  const semantics = extract(/function updateSelectionPageSemantics\(\) \{[\s\S]*?\n  \}/, 'selection semantics updater missing');
  assert.match(renderer, /selection-track/);
  assert.match(renderer, /role', 'tablist'/);
  assert.match(panelFactory, /role', 'tabpanel'/);
  assert.match(renderer, /createSelectionPanel\('books', 'Books'\)/);
  assert.match(renderer, /createSelectionPanel\('chapters', 'Chapters'\)/);
  assert.match(renderer, /createSelectionPanel\('verses', 'Verses'\)/);
  assert.match(renderer, /selectionPages\.length/);
  assert.match(renderer, /document\.createElement\('button'\)/);
  assert.match(renderer, /aria-selected/);
  assert.match(semantics, /aria-current/);
  assert.doesNotMatch(renderer, /innerHTML/);

  const css = extract(/\.selection-pager \{[\s\S]*?\.app-sheet\.edge-top \.selection-viewport \{[^}]*\}/, 'selection pager CSS missing');
  assert.match(css, /\.selection-track\s*\{[\s\S]*?display:\s*flex/);
  assert.match(css, /\.selection-panel\s*\{[\s\S]*?flex:\s*0 0 100%/);
  assert.match(css, /\.app-sheet\.edge-top[\s\S]*?\.selection-dots[\s\S]*?order:\s*2/);
});

function pixelDeclaration(rule, property) {
  const match = rule.match(new RegExp(`${property}:\\s*(\\d+(?:\\.\\d+)?)px`));
  assert.ok(match, `${property} pixel declaration missing`);
  return Number(match[1]);
}

test('selection dots keep a 44px native target around an 8px visual marker', () => {
  const target = extract(/\.selection-dot \{[^}]*\}/, 'selection dot target rule missing');
  const marker = extract(/\.selection-dot::before \{[^}]*\}/, 'selection dot visual marker rule missing');
  assert.ok(pixelDeclaration(target, 'width') >= 44, 'dot button width meets the native target floor');
  assert.ok(pixelDeclaration(target, 'min-height') >= 44, 'dot button height meets the native target floor');
  assert.equal(pixelDeclaration(marker, 'width'), 8, 'visual dot width remains 8px');
  assert.equal(pixelDeclaration(marker, 'height'), 8, 'visual dot height remains 8px');
  assert.match(bible, /\.selection-dot:focus-visible\s*\{[^}]*outline:/, 'dot target has a visible keyboard focus ring');
  assert.match(bible, /\.selection-dot\[aria-selected="true"\]::before/, 'selected semantics continue to style the marker');

  const targetMutant = bible.replace(target,
    target.replace('width: 44px; min-height: 44px;', 'width: 28px; min-height: 28px;'));
  const mutatedTarget = extractFrom(targetMutant, /\.selection-dot \{[^}]*\}/, 'mutated dot target rule missing');
  assert.ok(pixelDeclaration(mutatedTarget, 'width') < 44, 'undersized target mutation is observable');

  const markerMutant = bible.replace("content: ''; display: block; width: 8px; height: 8px;", "content: ''; display: block; width: 12px; height: 12px;");
  const mutatedMarker = extractFrom(markerMutant, /\.selection-dot::before \{[^}]*\}/, 'mutated dot marker rule missing');
  assert.notEqual(pixelDeclaration(mutatedMarker, 'width'), 8, 'visual marker mutation is observable');
});

test('navbar opens exact selection pages without invoking destructive legacy views', () => {
  const handlers = extract(/fnBook\.addEventListener\('click',[\s\S]*?fnVerse\.addEventListener\('click',[\s\S]*?\n  \}\);/, 'selection navbar handlers missing');
  assert.match(handlers, /openSelectionSheet\('books',\s*e\.currentTarget\)/);
  assert.match(handlers, /openSelectionSheet\('chapters',\s*e\.currentTarget\)/);
  assert.match(handlers, /openSelectionSheet\('verses',\s*e\.currentTarget\)/);
  assert.doesNotMatch(handlers, /showBooksView|showChaptersView|showVersePickerView/);
});

test('book and chapter choices update isolated context before advancing, while verse alone commits', () => {
  const book = extract(/function selectSelectionBook\(bookName\) \{[\s\S]*?\n  \}/, 'book selection handler missing');
  const chapter = extract(/function selectSelectionChapter\(chapter\) \{[\s\S]*?\n  \}/, 'chapter selection handler missing');
  const commit = extract(/function commitSelectionVerse\(verse\) \{[\s\S]*?\n  \}/, 'verse commit handler missing');
  assert.match(book, /selectionContext\.book = bookName/);
  assert.match(book, /selectionContext\.chapter =/);
  assert.match(book, /setSelectionPage\('chapters', true\)/);
  assert.doesNotMatch(book, /showVersesView|showSelectedVerse/);
  assert.match(chapter, /selectionContext\.chapter = normalized\.chapter/);
  assert.match(chapter, /setSelectionPage\('verses', true\)/);
  assert.doesNotMatch(chapter, /showVersesView|showSelectedVerse/);
  assert.match(commit, /normalizeVerseReference/);
  assert.match(commit, /history\.replaceState/);
  assert.match(commit, /showSelectedVerseWithTransition/);
  assert.doesNotMatch(commit, /history\.pushState|pushNav/);
});

test('selection page switches replace sheet history and retarget only the settled visible grid', () => {
  const setter = extract(/function setSelectionPage\(page, replaceHistory\) \{[\s\S]*?\n  \}/, 'selection page setter missing');
  assert.match(setter, /disconnectSelectionGridLayout\(\)/);
  assert.match(setter, /translateX\('/);
  assert.match(setter, /scheduleSelectionGridRetarget\(\)/);
  assert.match(setter, /history\.replaceState/);
  assert.doesNotMatch(setter, /history\.pushState/);

  const retarget = extract(/function retargetActiveSelectionGrid\(\) \{[\s\S]*?\n  \}/, 'settled grid retarget missing');
  assert.match(retarget, /clientWidth <= 0/);
  assert.match(retarget, /observeSelectionGrid\(grid\)/);
  const settle = extract(/function finishSelectionPageSettle\(event\) \{[\s\S]*?\n  \}/, 'track settle filter missing');
  assert.match(settle, /event\.target !== selectionTrack/);
  assert.match(settle, /event\.propertyName !== 'transform'/);
  const cleanup = extract(/function cleanupSelectionSheet\(\) \{[\s\S]*?\n  \}/, 'selection cleanup missing');
  assert.match(cleanup, /disconnectSelectionGridLayout\(\)/);
  assert.match(cleanup, /cancelAnimationFrame/);
  for (const listener of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture']) {
    assert.match(cleanup, new RegExp(`removeEventListener\\('${listener}'`), `${listener} listener is released`);
  }
  assert.match(cleanup, /removeEventListener\('transitionend', finishSelectionPageSettle\)/);
});

test('selection pointer locks at 8px without stealing controls, text selection, or vertical sheet drag', () => {
  const down = extract(/function onSelectionPointerDown\(e\) \{[\s\S]*?\n  \}/, 'selection pointerdown missing');
  const move = extract(/function onSelectionPointerMove\(e\) \{[\s\S]*?\n  \}/, 'selection pointermove missing');
  const settle = extract(/function settleSelectionPointer\(e, cancelled\) \{[\s\S]*?\n  \}/, 'selection pointer cleanup missing');
  assert.match(down, /selectionPointerTargetAllowsSwipe\(e\.target\)/);
  assert.match(move, /appSheetAxis\(dx, dy\)/, 'shared 8px lock must coordinate both gesture owners');
  assert.match(move, /axis === 'y'/);
  assert.match(move, /setPointerCapture/);
  assert.match(settle, /selectionSwipePage/);
  assert.match(settle, /cancelled/);
  assert.match(bible, /pointercancel', onSelectionPointerCancel\)/);
  assert.match(bible, /lostpointercapture', onSelectionLostPointerCapture\)/);
  assert.match(bible, /window\.getSelection/);
});

test('selection uses one live media listener and controller-owned top/bottom vertical behavior', () => {
  const responsive = extract(/function installSelectionEdgeListener\(\) \{[\s\S]*?\n  \}/, 'selection edge listener missing');
  const cleanup = extract(/function cleanupSelectionSheet\(\) \{[\s\S]*?\n  \}/, 'selection cleanup missing');
  assert.match(responsive, /matchMedia\('\(max-width: 640px\)'\)/);
  assert.match(responsive, /addEventListener\('change'/);
  assert.match(cleanup, /removeEventListener\('change'/);
  assert.match(bible, /openAppSheet\('selection', \{[\s\S]*?edge: selectionSheetEdge/);
  assert.doesNotMatch(responsive, /pointermove|appSheetDragOutcome/);
});

test('legacy selection history normalizes to a sheet over a validated reader and forward can restore it', () => {
  const pop = extract(/window\.addEventListener\('popstate',[\s\S]*?\n  \}\);/, 'popstate handler missing');
  assert.match(pop, /normalizeLegacySelectionHistory\(s\)/);
  assert.match(pop, /history\.replaceState/);
  assert.match(pop, /openSelectionSheet/);
  assert.doesNotMatch(pop, /else if \(s && s\.view === 'verse-picker'[\s\S]*?showVersePickerViewWithTransition/);

  const sheetPop = extract(/function handleAppSheetPopState\(state\) \{[\s\S]*?\n  \}/, 'sheet forward restoration missing');
  assert.match(sheetPop, /openAppSheet\(validated\.sheet\.kind/);
  assert.match(sheetPop, /fromPop: true/);
});

test('selection descriptor is real, invalid selection history is sanitized, and repeated cleanup resets state', () => {
  assert.match(bible, /registerAppSheetDescriptor\('selection', \{ label: 'Selection', title: 'Selection', render: function \(target, sheet\) \{\s*return renderSelectionSheet\(target, sheet\);/);
  const validator = extract(/function validatedAppSheetHistoryState\(state\) \{[\s\S]*?\n  \}/, 'sheet state validator missing');
  assert.match(validator, /normalizedSelectionPage/);
  const cleanup = extract(/function cleanupSelectionSheet\(\) \{[\s\S]*?\n  \}/, 'selection cleanup missing');
  assert.match(cleanup, /selectionPointer = null/);
  assert.match(cleanup, /selectionTrack = null/);
  assert.match(cleanup, /selectionGrids = null/);
  assert.match(cleanup, /selectionMediaQuery = null/);
});

function functionSource(name) {
  return extract(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}`), `${name} missing`);
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.className = '';
    this.id = '';
    this.style = { transform: '', setProperty() {} };
    this.classList = {
      values: new Set(),
      add: (...names) => names.forEach(name => this.classList.values.add(name)),
      remove: (...names) => names.forEach(name => this.classList.values.delete(name)),
      toggle: (name, force) => {
        if (force === false) this.classList.values.delete(name);
        else this.classList.values.add(name);
      }
    };
    this.isConnected = true;
    this.clientWidth = 320;
  }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  removeEventListener(type, listener) {
    const list = this.listeners.get(type) || [];
    this.listeners.set(type, list.filter(item => item !== listener));
  }
  dispatch(type, extras = {}) {
    const event = { currentTarget: this, target: this, preventDefault() {}, stopPropagation() {}, ...extras };
    for (const listener of this.listeners.get(type) || []) listener(event);
  }
  focus() { this.focused = true; }
}

function validatorFor(data, navBook = 'John', navChapter = 3) {
  const source = [
    extract(/\/\* SELECTION SHEET PURE HELPERS START \*\/[\s\S]*?\/\* SELECTION SHEET PURE HELPERS END \*\//,
      'selection helpers missing'),
    extract(/var APP_SHEET_KINDS = [\s\S]*?function validatedAppSheetHistoryState\(state\) \{[\s\S]*?\n  \}/,
      'sheet validator program missing')
  ].join('\n');
  return Function('data', 'fallbackBook', 'fallbackChapter', `
    var bibleData = data;
    var navBook = fallbackBook;
    var navChapter = fallbackChapter;
    ${source}
    return validatedAppSheetHistoryState;
  `)(data, navBook, navChapter);
}

test('hostile selection history is executable-data sanitized before it is returned', () => {
  const validate = validatorFor({
    Genesis: { 1: { 1: 'beginning' }, 2: { 1: 'second' } },
    John: { 3: { 16: 'love' }, 4: { 1: 'well' } }
  });
  const base = { view: 'verses', book: 'John', chapter: '3', verse: '16' };

  const hostile = validate({ ...base, sheet: { kind: 'selection', page: '../verses', book: '__proto__', chapter: '999' } });
  assert.deepEqual(hostile.sheet, { kind: 'selection', page: 'books', book: 'John', chapter: '3' });

  const invalidChapter = validate({ ...base, sheet: { kind: 'selection', page: 'verses', book: 'Genesis', chapter: '999' } });
  assert.deepEqual(invalidChapter.sheet, { kind: 'selection', page: 'verses', book: 'Genesis', chapter: '1' });

  const noNav = validatorFor({ Genesis: { 1: { 1: 'beginning' } } }, 'Missing', 88);
  const first = noNav({ ...base, sheet: { kind: 'selection', page: 'verses', book: 'Missing', chapter: '0' } });
  assert.deepEqual(first.sheet, { kind: 'selection', page: 'verses', book: 'Genesis', chapter: '1' });
});

function runOpenWithHistory(historyState, source = bible) {
  const open = extractFrom(source, /function openAppSheet\(kind, options\) \{[\s\S]*?\n  \}/, 'openAppSheet missing');
  const rendered = [];
  const appSheetState = {
    pendingHistoryClose: false, kind: null, edge: 'bottom', page: null,
    historyState: null, closing: false, opener: null, historyOwned: false
  };
  const appSheet = new FakeElement('dialog');
  appSheet.open = false;
  appSheet.showModal = function () { this.open = true; };
  const result = Function('supplied', 'appSheetState', 'appSheet', 'rendered', `
    var document = { activeElement: null };
    var history = { pushState: function () {}, replaceState: function () {} };
    var window = { location: { href: '/bible' } };
    var appSheetTitle = { textContent: '' };
    function isValidAppSheetKind(value) { return value === 'selection'; }
    function isValidAppSheetEdge(value) { return value === 'top' || value === 'bottom'; }
    function isValidAppSheetSnap(value) { return value === 'determined' || value === 'fullscreen'; }
    function registerAppSheetDescriptor() {}
    function resolveAppSheetDescriptor() { return { title: 'Selection', render: function () {} }; }
    function sheetHistoryState() { return null; }
    function validatedAppSheetHistoryState(state) {
      return {
        view: state.view, book: state.book, chapter: state.chapter, verse: state.verse,
        sheet: { kind: 'selection', page: 'books', book: 'John', chapter: '3' }
      };
    }
    function normalizePopupHistoryBeforeSheetOpen() {}
    function clearAppSheetMotion() {}
    function syncAppSheetLauncherState() {}
    function tagAppSheetHistoryStateForCurrentLifecycle(state) { return state; }
    function setSheetSnap() {}
    function resetAppSheetState() {}
    function renderAppSheetContent() { rendered.push(appSheetState.historyState); }
    ${open}
    return openAppSheet('selection', { fromPop: true, page: 'verses', historyState: supplied });
  `)(historyState, appSheetState, appSheet, rendered);
  return { result, appSheetState, rendered };
}

function runForwardHistory(state) {
  const handler = functionSource('handleAppSheetPopState');
  const validate = validatorFor({ Genesis: { 1: { 1: 'beginning' } }, John: { 3: { 16: 'love' } } });
  const replacements = [];
  const opens = [];
  const result = Function('state', 'validate', 'replacements', 'opens', `
    var appSheetState = { pendingHistoryClose: false, kind: null, historyOwned: false };
    var appSheet = { open: false };
    var window = { innerWidth: 500 };
    var history = { replaceState: function (next) { replacements.push(next); } };
    function validatedAppSheetHistoryState(value) { return validate(value); }
    function openAppSheet(kind, options) { opens.push([kind, options]); return true; }
    function selectionSheetEdge() { return 'top'; }
    function canonicalVerseUrl() { return '/bible'; }
    function normalizeVerseReference() { return null; }
    function normalizedSelectionContext() { return null; }
    function selectionHistoryState() { return null; }
    function normalizedSelectionPage() { return 'books'; }
    function openSelectionSheet() {}
    function requestCloseAppSheet() {}
    ${handler}
    return handleAppSheetPopState(state);
  `)(state, validate, replacements, opens);
  return { result, replacements, opens };
}

test('Forward history and app sheet render receive sanitized state immediately', () => {
  const hostile = {
    view: 'verses', book: 'John', chapter: '3', verse: '16',
    sheet: { kind: 'selection', page: '../verses', book: 'Missing', chapter: '999' }
  };
  const forward = runForwardHistory(hostile);
  assert.equal(forward.result, true);
  assert.deepEqual(forward.replacements[0].sheet, { kind: 'selection', page: 'books', book: 'John', chapter: '3' });
  assert.deepEqual(forward.opens[0][1].historyState, forward.replacements[0]);

  const opened = runOpenWithHistory(hostile);
  assert.equal(opened.result, true);
  assert.deepEqual(opened.appSheetState.historyState.sheet,
    { kind: 'selection', page: 'books', book: 'John', chapter: '3' });
  assert.deepEqual(opened.rendered[0], opened.appSheetState.historyState);

  const openMutation = bible.replace(
    'validatedAppSheetHistoryState(options.historyState || sheetHistoryState(kind, page))',
    'options.historyState || sheetHistoryState(kind, page)'
  );
  assert.notDeepEqual(runOpenWithHistory(hostile, openMutation).appSheetState.historyState.sheet,
    { kind: 'selection', page: 'books', book: 'John', chapter: '3' },
    'open-state sanitizer mutation is observable');
});

function runDotRenderer(source = bible) {
  const createPanel = extractFrom(source, /function createSelectionPanel\(page, label\) \{[\s\S]*?\n  \}/,
    'selection panel factory missing');
  const render = extractFrom(source, /function renderSelectionSheet\(target, sheet\) \{[\s\S]*?\n  \}/,
    'selection renderer missing');
  const calls = [];
  const document = { createElement: tag => new FakeElement(tag) };
  const api = Function('document', 'calls', `
    var selectionPages = ['books', 'chapters', 'verses'];
    var selectionSheetPage = 'books';
    var selectionContext = null;
    var selectionGrids = null;
    var selectionPager = null;
    var selectionDots = null;
    var selectionTrack = null;
    var selectionPanels = null;
    function normalizedSelectionPage(page) { return selectionPages.indexOf(page) < 0 ? 'books' : page; }
    function currentSelectionReaderReference() { return { book: 'John', chapter: 3, verse: '16' }; }
    function normalizedSelectionContext(book, chapter, fallback) { return { book: book || fallback.book, chapter: chapter || fallback.chapter }; }
    function renderSelectionBooks() {}
    function renderSelectionChapters() {}
    function renderSelectionVerses() {}
    function onSelectionPointerDown() {}
    function onSelectionPointerMove() {}
    function onSelectionPointerUp() {}
    function onSelectionPointerCancel() {}
    function onSelectionLostPointerCapture() {}
    function finishSelectionPageSettle() {}
    function onSelectionDotKeyDown() {}
    function installSelectionEdgeListener() {}
    function cleanupSelectionSheet() {}
    function setSelectionPage(page, replace) { calls.push([page, replace]); selectionSheetPage = page; }
    var appSheetBody = document.createElement('div');
    ${createPanel}
    ${render}
    var target = document.createElement('div');
    renderSelectionSheet(target, { page: 'books', context: { book: 'John', chapter: 3 } });
    return { dots: selectionDots, panels: selectionPanels, calls: calls };
  `)(document, calls);
  return api;
}

function extractFrom(source, pattern, message) {
  const match = source.match(pattern);
  assert.ok(match, message);
  return match[0];
}

test('dot tabs and activation execute, and a role mutation is observable', () => {
  const rendered = runDotRenderer();
  assert.deepEqual(rendered.dots.map(dot => dot.getAttribute('role')), ['tab', 'tab', 'tab']);
  assert.deepEqual(rendered.panels.map(panel => panel.getAttribute('role')), ['tabpanel', 'tabpanel', 'tabpanel']);
  rendered.dots[2].dispatch('click');
  assert.deepEqual(rendered.calls.at(-1), ['verses', true]);

  const mutant = bible.replace("dot.setAttribute('role', 'tab');", "dot.setAttribute('role', 'presentation');");
  assert.notDeepEqual(runDotRenderer(mutant).dots.map(dot => dot.getAttribute('role')), ['tab', 'tab', 'tab']);
});

function runDotSemantics(source = bible) {
  const update = extractFrom(source, /function updateSelectionPageSemantics\(\) \{[\s\S]*?\n  \}/,
    'selection semantics updater missing');
  const dots = [new FakeElement('button'), new FakeElement('button'), new FakeElement('button')];
  const panels = [new FakeElement('section'), new FakeElement('section'), new FakeElement('section')];
  Function('selectionDots', 'selectionPanels', `
    var selectionPages = ['books', 'chapters', 'verses'];
    var selectionSheetPage = 'chapters';
    ${update}
    updateSelectionPageSemantics();
  `)(dots, panels);
  return { dots, panels };
}

test('dot active semantics execute and an aria-selected mutation is observable', () => {
  const state = runDotSemantics();
  assert.deepEqual(state.dots.map(dot => dot.getAttribute('aria-selected')), ['false', 'true', 'false']);
  assert.deepEqual(state.dots.map(dot => dot.getAttribute('aria-current')), [null, 'page', null]);
  assert.deepEqual(state.panels.map(panel => panel.getAttribute('aria-hidden')), ['true', 'false', 'true']);

  const mutant = bible.replace(
    "selectionDots[i].setAttribute('aria-selected', active ? 'true' : 'false');",
    "selectionDots[i].setAttribute('aria-selected', active ? 'false' : 'true');"
  );
  assert.notDeepEqual(runDotSemantics(mutant).dots.map(dot => dot.getAttribute('aria-selected')),
    ['false', 'true', 'false']);
});

test('navbar direct-page launchers execute without touching the reader', () => {
  const handlers = extract(/fnBook\.addEventListener\('click',[\s\S]*?fnVerse\.addEventListener\('click',[\s\S]*?\n  \}\);/,
    'navbar handler program missing');
  const calls = [];
  const fnBook = new FakeElement('button');
  const fnChapter = new FakeElement('button');
  const fnVerse = new FakeElement('button');
  Function('fnBook', 'fnChapter', 'fnVerse', 'calls', `
    var bibleData = {};
    function openSelectionSheet(page, opener) { calls.push([page, opener]); }
    ${handlers}
  `)(fnBook, fnChapter, fnVerse, calls);
  fnBook.dispatch('click');
  fnChapter.dispatch('click');
  fnVerse.dispatch('click');
  assert.deepEqual(calls.map(call => call[0]), ['books', 'chapters', 'verses']);
  assert.deepEqual(calls.map(call => call[1]), [fnBook, fnChapter, fnVerse]);
});

function runSelectionFlow(events) {
  const source = [
    functionSource('selectionChapterKeys'),
    functionSource('sanitizedSelectionDataContext'),
    functionSource('selectSelectionBook'),
    functionSource('selectSelectionChapter'),
    functionSource('commitSelectionVerse')
  ].join('\n');
  return Function('events', `
    var bibleData = { Genesis: { 1: { 1: 'beginning' } }, John: { 3: { 16: 'love' }, 4: { 1: 'well' } } };
    var selectionContext = { book: 'Genesis', chapter: 1 };
    var appSheetState = { historyOwned: true };
    var navFromPop = false;
    var history = { replaceState: function (state, unused, url) { events.push(['replace', state, url]); } };
    function normalizeBookChapter(book, chapter) {
      if (!Object.prototype.hasOwnProperty.call(bibleData, book)) return null;
      var key = String(chapter);
      if (!Object.prototype.hasOwnProperty.call(bibleData[book], key)) return null;
      return { book: book, chapter: parseInt(key, 10) };
    }
    function normalizeVerseReference(book, chapter, verse) {
      var context = normalizeBookChapter(book, chapter);
      return context && Object.prototype.hasOwnProperty.call(bibleData[book][String(context.chapter)], String(verse)) ?
        { book: book, chapter: context.chapter, verse: String(verse) } : null;
    }
    function renderSelectionChapters() { events.push(['render-chapters']); }
    function renderSelectionVerses() { events.push(['render-verses']); }
    function setSelectionPage(page, replace) { events.push(['page', page, replace]); return true; }
    function canonicalVerseUrl(book, chapter, verse) { return book + '/' + chapter + '/' + verse; }
    function showSelectedVerseWithTransition(book, chapter, verse) { events.push(['reader', book, chapter, verse]); }
    function requestCloseAppSheet(source, focusPolicy) { events.push(['close', source, focusPolicy]); return true; }
    ${source}
    return {
      book: selectSelectionBook,
      chapter: selectSelectionChapter,
      verse: commitSelectionVerse,
      context: function () { return selectionContext; }
    };
  `)(events);
}

test('B to C to V executes validated context while only verse commit mutates reader/history', () => {
  const events = [];
  const api = runSelectionFlow(events);
  assert.equal(api.book('__proto__'), false);
  assert.equal(api.book('John'), true);
  assert.deepEqual(api.context(), { book: 'John', chapter: 3 });
  assert.equal(events.some(event => event[0] === 'reader' || event[0] === 'replace'), false);
  assert.equal(api.chapter(999), false);
  assert.equal(api.chapter(4), true);
  assert.deepEqual(api.context(), { book: 'John', chapter: 4 });
  assert.equal(events.some(event => event[0] === 'reader' || event[0] === 'replace'), false);
  assert.equal(api.verse(999), false);
  assert.equal(api.verse(1), true);
  assert.deepEqual(events.filter(event => event[0] === 'replace').length, 1);
  assert.deepEqual(events.filter(event => event[0] === 'reader'), [['reader', 'John', 4, '1']]);
  assert.deepEqual(events.at(-1), ['close', 'selection-complete', 'reader']);
});

function runGestureProgram(source = bible, selectionCollapsed = true) {
  const helpers = extractFrom(source,
    /\/\* SELECTION SHEET PURE HELPERS START \*\/[\s\S]*?\/\* SELECTION SHEET PURE HELPERS END \*\//,
    'selection pure helpers missing');
  const axis = extractFrom(source, /function appSheetAxis\(dx, dy\) \{[\s\S]*?\n  \}/, 'axis helper missing');
  const names = [
    'selectionPointerTargetAllowsSwipe', 'releaseSelectionPointer', 'onSelectionPointerDown',
    'onSelectionPointerMove', 'settleSelectionPointer', 'onSelectionPointerUp',
    'onSelectionPointerCancel', 'onSelectionLostPointerCapture'
  ];
  const functions = names.map(name => extractFrom(source,
    new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}`), `${name} missing`)).join('\n');
  const pages = [];
  const captures = [];
  const pager = {
    setPointerCapture(id) { captures.push(['set', id]); },
    hasPointerCapture() { return true; },
    releasePointerCapture(id) { captures.push(['release', id]); }
  };
  const api = Function('window', 'selectionPager', 'pages', `
    ${helpers}
    ${axis}
    var selectionSheetPage = 'chapters';
    var selectionPointer = null;
    var SELECTION_POINTER_RECENCY_MS = 80;
    function setSelectionPage(page) { selectionSheetPage = page; pages.push(page); }
    ${functions}
    return {
      down: onSelectionPointerDown, move: onSelectionPointerMove, up: onSelectionPointerUp,
      cancel: onSelectionPointerCancel, lost: onSelectionLostPointerCapture,
      page: function () { return selectionSheetPage; }, pointer: function () { return selectionPointer; }
    };
  `)({ getSelection: () => ({ isCollapsed: selectionCollapsed }) }, pager, pages);
  return { api, pages, captures };
}

function pointerEvent(id, x, y, time, target = { closest: () => null }) {
  return {
    pointerId: id, clientX: x, clientY: y, timeStamp: time, target,
    isPrimary: true, button: 0, prevented: false, stopped: false,
    preventDefault() { this.prevented = true; },
    stopPropagation() { this.stopped = true; }
  };
}

function interactiveTarget(kind) {
  return {
    closest(selector) {
      return selector.split(',').map(value => value.trim()).includes(kind) ? this : null;
    }
  };
}

test('controls and selected text never let the horizontal pager claim pointer ownership', () => {
  for (const kind of ['button', 'input', 'a']) {
    const h = runGestureProgram();
    const down = pointerEvent(20, 100, 0, 1, interactiveTarget(kind));
    const move = pointerEvent(20, 0, 1, 10, interactiveTarget(kind));
    h.api.down(down);
    h.api.move(move);
    assert.equal(h.api.pointer(), null, `${kind} never starts a pager pointer`);
    assert.deepEqual(h.captures, [], `${kind} is not captured`);
    assert.equal(down.prevented, false);
    assert.equal(move.prevented, false, `${kind} keeps native/control handling`);
    assert.equal(move.stopped, false, `${kind} still bubbles to vertical sheet ownership`);
    assert.equal(h.api.page(), 'chapters');
  }

  const selected = runGestureProgram(bible, false);
  const selectedDown = pointerEvent(21, 100, 0, 1);
  const selectedMove = pointerEvent(21, 0, 1, 10);
  selected.api.down(selectedDown);
  selected.api.move(selectedMove);
  assert.equal(selected.api.pointer(), null, 'non-collapsed text selection blocks pager ownership');
  assert.deepEqual(selected.captures, []);
  assert.equal(selectedMove.prevented, false);
  assert.equal(selectedMove.stopped, false);
  assert.equal(selected.api.page(), 'chapters');

  const pointerGuard = functionSource('selectionPointerTargetAllowsSwipe');
  const selectionGuardMutant = bible.replace(pointerGuard, pointerGuard.replace(
    'if (selection && !selection.isCollapsed) return false;',
    'if (selection && false) return false;'
  ));
  const selectedMutation = runGestureProgram(selectionGuardMutant, false);
  const mutationDown = pointerEvent(22, 100, 0, 1);
  const mutationMove = pointerEvent(22, 0, 1, 10);
  selectedMutation.api.down(mutationDown);
  selectedMutation.api.move(mutationMove);
  assert.notDeepEqual(selectedMutation.captures, [], 'selected-text guard mutation is observable');
  assert.equal(mutationMove.prevented, true);

  const buttonGuardMutant = bible.replace(
    "return !target.closest('button,a,input,select,textarea,label,p,pre,code,[role=\"button\"],[contenteditable=\"true\"]');",
    "return !target.closest('a,input,select,textarea,label,p,pre,code,[role=\"button\"],[contenteditable=\"true\"]');"
  );
  const buttonMutation = runGestureProgram(buttonGuardMutant);
  const buttonDown = pointerEvent(23, 100, 0, 1, interactiveTarget('button'));
  const buttonMove = pointerEvent(23, 0, 1, 10, interactiveTarget('button'));
  buttonMutation.api.down(buttonDown);
  buttonMutation.api.move(buttonMove);
  assert.notDeepEqual(buttonMutation.captures, [], 'button exclusion mutation is observable');
  assert.equal(buttonMove.prevented, true);
});

test('horizontal gestures execute one page both ways while vertical, cancel, and lost capture do not page', () => {
  const h = runGestureProgram();
  h.api.down(pointerEvent(1, 100, 20, 1));
  h.api.move(pointerEvent(1, 0, 22, 20));
  h.api.up(pointerEvent(1, 0, 22, 22));
  assert.equal(h.api.page(), 'verses');
  assert.deepEqual(h.pages, ['verses']);

  h.api.down(pointerEvent(2, 0, 20, 30));
  h.api.move(pointerEvent(2, 100, 21, 45));
  h.api.up(pointerEvent(2, 100, 21, 47));
  assert.equal(h.api.page(), 'chapters');
  assert.deepEqual(h.pages, ['verses', 'chapters']);

  h.api.down(pointerEvent(3, 0, 0, 50));
  h.api.move(pointerEvent(3, 2, 90, 60));
  assert.equal(h.api.pointer(), null, 'vertical ownership transfers to the sheet controller');
  assert.equal(h.api.page(), 'chapters');

  h.api.down(pointerEvent(4, 100, 0, 70));
  h.api.move(pointerEvent(4, 0, 0, 80));
  h.api.cancel(pointerEvent(4, 0, 0, 81));
  assert.equal(h.api.page(), 'chapters');
  assert.equal(h.api.pointer(), null);

  h.api.down(pointerEvent(5, 100, 0, 90));
  h.api.move(pointerEvent(5, 0, 0, 100));
  h.api.lost(pointerEvent(5, 0, 0, 101));
  assert.equal(h.api.page(), 'chapters');
  assert.equal(h.api.pointer(), null);

  const directionMutant = bible.replace('current + direction', 'current - direction');
  const mutated = runGestureProgram(directionMutant);
  mutated.api.down(pointerEvent(6, 100, 0, 1));
  mutated.api.move(pointerEvent(6, 0, 0, 10));
  mutated.api.up(pointerEvent(6, 0, 0, 11));
  assert.notEqual(mutated.api.page(), 'verses', 'gesture direction mutation is observable');

  const cancelMutant = bible.replace(
    'function onSelectionPointerCancel(e) { settleSelectionPointer(e, true); }',
    'function onSelectionPointerCancel(e) { settleSelectionPointer(e, false); }'
  );
  const cancelled = runGestureProgram(cancelMutant);
  cancelled.api.down(pointerEvent(7, 100, 0, 1));
  cancelled.api.move(pointerEvent(7, 0, 0, 10));
  cancelled.api.cancel(pointerEvent(7, 0, 0, 11));
  assert.notEqual(cancelled.api.page(), 'chapters', 'cancel-listener mutation is observable');
});

function runResponsiveCycle() {
  const source = [
    functionSource('applySelectionSheetEdge'),
    functionSource('installSelectionEdgeListener'),
    functionSource('cleanupSelectionSheet')
  ].join('\n');
  const media = {
    matches: true, added: [], removed: [],
    addEventListener(type, fn) { this.added.push([type, fn]); },
    removeEventListener(type, fn) { this.removed.push([type, fn]); }
  };
  const appSheet = new FakeElement('dialog');
  const appSheetBody = new FakeElement('div');
  const api = Function('window', 'appSheet', 'appSheetBody', `
    var appSheetState = { kind: 'selection', edge: 'bottom' };
    var selectionMediaQuery = null;
    var selectionMediaListener = null;
    var selectionPager = null;
    var selectionTrack = null;
    var selectionPanels = null;
    var selectionDots = null;
    var selectionGrids = null;
    var selectionContext = null;
    var selectionPointer = null;
    var selectionRetargetFrame = null;
    var selectionRetargetTimer = null;
    function disconnectSelectionGridLayout() {}
    function releaseSelectionPointer() { selectionPointer = null; }
    function cancelAnimationFrame() {}
    function clearTimeout() {}
    ${source}
    return { install: installSelectionEdgeListener, cleanup: cleanupSelectionSheet, state: appSheetState };
  `)({ matchMedia: () => media, clearTimeout() {} }, appSheet, appSheetBody);
  api.install();
  return { api, media, appSheet };
}

test('responsive edge listener executes live changes and leaves no listener across repeated cycles', () => {
  for (let i = 0; i < 3; i += 1) {
    const h = runResponsiveCycle();
    assert.equal(h.api.state.edge, 'top');
    assert.equal(h.media.added.length, 1);
    h.media.matches = false;
    h.media.added[0][1]();
    assert.equal(h.api.state.edge, 'bottom');
    h.api.cleanup();
    assert.equal(h.media.removed.length, 1);
    assert.equal(h.media.removed[0][1], h.media.added[0][1]);
  }
});

test('reduced motion page switching is immediate and retargets only after disconnect', () => {
  const setter = functionSource('setSelectionPage');
  const order = [];
  const track = new FakeElement('div');
  const api = Function('track', 'order', `
    var selectionPages = ['books', 'chapters', 'verses'];
    var selectionSheetPage = 'books';
    var selectionTrack = track;
    var selectionRetargetFrame = null;
    var selectionRetargetTimer = null;
    var selectionContext = { book: 'John', chapter: 3 };
    var appSheet = { open: false };
    var appSheetState = { page: null, kind: 'selection', historyOwned: false };
    var history = { replaceState: function () {} };
    var window = { clearTimeout: function () {} };
    function isValidSelectionPage(page) { return selectionPages.indexOf(page) >= 0; }
    function disconnectSelectionGridLayout() { order.push('disconnect'); }
    function cancelAnimationFrame() {}
    function shouldReduceVerseMotion() { return true; }
    function updateSelectionPageSemantics() { order.push('semantics'); }
    function scheduleSelectionGridRetarget() { order.push('retarget'); }
    function currentSelectionReaderReference() { return null; }
    function selectionHistoryState() { return null; }
    ${setter}
    return { set: setSelectionPage, page: function () { return selectionSheetPage; } };
  `)(track, order);
  assert.equal(api.set('verses', false), true);
  assert.equal(api.page(), 'verses');
  assert.equal(track.style.transform, 'translateX(-200%)');
  assert.equal(track.classList.values.has('no-motion'), true);
  assert.deepEqual(order, ['disconnect', 'semantics', 'retarget']);
});

function runActiveGridRetarget(source = bible) {
  const active = functionSource('activeSelectionGridFor');
  const retarget = extractFrom(source, /function retargetActiveSelectionGrid\(\) \{[\s\S]*?\n  \}/,
    'active grid retarget missing');
  const chapters = new FakeElement('div');
  const verses = new FakeElement('div');
  chapters.clientWidth = 0;
  verses.clientWidth = 320;
  const observed = [];
  const api = Function('chapters', 'verses', 'observed', `
    var selectionGrids = { chapters: chapters, verses: verses };
    var selectionTrack = { isConnected: true };
    var selectionSheetPage = 'chapters';
    var selectionRetargetFrame = 1;
    function observeSelectionGrid(grid) { observed.push(grid); }
    ${active}
    ${retarget}
    return { run: retargetActiveSelectionGrid, page: function (value) { selectionSheetPage = value; } };
  `)(chapters, verses, observed);
  return { api, chapters, verses, observed };
}

test('retarget executes only for the active visible grid and rejects a zero-width mutation', () => {
  const h = runActiveGridRetarget();
  h.api.run();
  assert.deepEqual(h.observed, [], 'zero-width active grid is never observed');
  h.api.page('verses');
  h.api.run();
  assert.deepEqual(h.observed, [h.verses]);

  const mutant = bible.replace('grid.clientWidth <= 0', 'grid.clientWidth < 0');
  const changed = runActiveGridRetarget(mutant);
  changed.api.run();
  assert.notDeepEqual(changed.observed, [], 'zero-width observer guard mutation is observable');
});
