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

test('selection renderer owns one persistent three-panel track and decorative indicator', () => {
  const renderer = extract(
    /function renderSelectionSheet\(target, sheet\) \{[\s\S]*?\n  \}/,
    'selection renderer missing'
  );
  const panelFactory = extract(/function createSelectionPanel\(page, label\) \{[\s\S]*?\n  \}/, 'selection panel factory missing');
  const semantics = extract(/function updateSelectionPageSemantics\([^)]*\) \{[\s\S]*?\n  \}/, 'selection semantics updater missing');
  assert.match(renderer, /selection-track/);
  assert.match(renderer, /selection-indicator/);
  assert.match(panelFactory, /role', 'region'/);
  assert.match(renderer, /createSelectionPanel\('books', 'Books'\)/);
  assert.match(renderer, /createSelectionPanel\('chapters', 'Chapters'\)/);
  assert.match(renderer, /createSelectionPanel\('verses', 'Verses'\)/);
  assert.match(renderer, /selectionPages\.length/);
  assert.match(renderer, /document\.createElement\('span'\)/);
  assert.match(renderer, /aria-hidden', 'true'/);
  assert.match(semantics, /classList\.toggle\('is-active'/);
  assert.doesNotMatch(renderer, /innerHTML/);

  const css = extract(/\.selection-pager \{[\s\S]*?\.app-sheet\.edge-top \.selection-viewport \{[^}]*\}/, 'selection pager CSS missing');
  assert.match(css, /\.selection-track\s*\{[\s\S]*?display:\s*flex/);
  assert.match(css, /\.selection-panel\s*\{[\s\S]*?flex:\s*0 0 100%/);
  assert.match(css, /\.selection-indicator[\s\S]*?bottom:/);
});

function pixelDeclaration(rule, property) {
  const match = rule.match(new RegExp(`${property}:\\s*(\\d+(?:\\.\\d+)?)px`));
  assert.ok(match, `${property} pixel declaration missing`);
  return Number(match[1]);
}

test('selection indicator is a compact noninteractive 36 by 28 tonal float', () => {
  const target = extract(/\.selection-indicator \{[^}]*\}/, 'selection indicator rule missing');
  const marker = extract(/\.selection-indicator-dot \{[^}]*\}/, 'selection indicator marker rule missing');
  assert.equal(pixelDeclaration(target, 'width'), 36);
  assert.equal(pixelDeclaration(target, 'height'), 28);
  assert.equal(pixelDeclaration(marker, 'width'), 4);
  assert.equal(pixelDeclaration(marker, 'height'), 4);
  assert.match(target, /pointer-events:\s*none/);
  assert.match(target, /user-select:\s*none/);
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
  assert.match(book, /setSelectionPage\('chapters', true, 'keyboard'\)/);
  assert.doesNotMatch(book, /showVersesView|showSelectedVerse/);
  assert.match(chapter, /selectionContext\.chapter = normalized\.chapter/);
  assert.match(chapter, /setSelectionPage\('verses', true, 'keyboard'\)/);
  assert.doesNotMatch(chapter, /showVersesView|showSelectedVerse/);
  assert.match(commit, /normalizeVerseReference/);
  assert.match(commit, /history\.replaceState/);
  assert.match(commit, /showSelectedVerseWithTransition/);
  assert.doesNotMatch(commit, /history\.pushState|pushNav/);
});

test('selection page switches replace sheet history and retarget only the settled visible grid', () => {
  const setter = extract(/function setSelectionPage\(page, replaceHistory, focusMode\) \{[\s\S]*?\n  \}/, 'selection page setter missing');
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
  contains(child) { return child === this || this.children.some(item => item.contains && item.contains(child)); }
  querySelector() { return this.children.find(child => child.tagName === 'BUTTON') || null; }
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
    var bibleData = {};
    var selectionSheetPage = 'books';
    var selectionContext = null;
    var selectionGrids = null;
    var selectionPager = null;
    var selectionDots = null;
    var selectionTrack = null;
    var selectionPanels = null;
    var selectionLive = null;
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
    function onSelectionTouchStart() {}
    function onSelectionTouchMove() {}
    function onSelectionTouchEnd() {}
    function onSelectionTouchCancel() {}
    function guardSelectionClick() {}
    function onSelectionPagerKeyDown() {}
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

test('decorative indicator renders spans while panels retain named region semantics', () => {
  const rendered = runDotRenderer();
  assert.deepEqual(rendered.dots.map(dot => dot.tagName), ['SPAN', 'SPAN', 'SPAN']);
  assert.deepEqual(rendered.dots.map(dot => dot.getAttribute('role')), [null, null, null]);
  assert.deepEqual(rendered.panels.map(panel => panel.getAttribute('role')), ['region', 'region', 'region']);
});

function runDotSemantics(source = bible) {
  const update = extractFrom(source, /function updateSelectionPageSemantics\([^)]*\) \{[\s\S]*?\n  \}/,
    'selection semantics updater missing');
  const dots = [new FakeElement('button'), new FakeElement('button'), new FakeElement('button')];
  const panels = [new FakeElement('section'), new FakeElement('section'), new FakeElement('section')];
  Function('selectionDots', 'selectionPanels', `
    var selectionPages = ['books', 'chapters', 'verses'];
    var selectionSheetPage = 'chapters';
    var document = { activeElement: null };
    function focusSelectionPanel() {}
    ${update}
    updateSelectionPageSemantics();
  `)(dots, panels);
  return { dots, panels };
}

test('indicator active state and inactive panel semantics execute', () => {
  const state = runDotSemantics();
  assert.deepEqual(state.dots.map(dot => dot.classList.values.has('is-active')), [false, true, false]);
  assert.deepEqual(state.panels.map(panel => panel.getAttribute('aria-hidden')), ['true', 'false', 'true']);
});

test('pointer focus relocates before old panel inerting and keyboard focus selects first enabled control', () => {
  const focusSource = functionSource('focusSelectionPanel');
  const semanticsSource = functionSource('updateSelectionPageSemantics');
  const panels = [new FakeElement('section'), new FakeElement('section'), new FakeElement('section')];
  const dots = [new FakeElement('span'), new FakeElement('span'), new FakeElement('span')];
  panels.forEach(panel => { panel.inert = false; });
  const focusedButton = new FakeElement('button');
  panels[2].appendChild(focusedButton);
  const oldButton = new FakeElement('button');
  panels[1].appendChild(oldButton);
  const focusOrder = [];
  panels[2].focus = function () { focusOrder.push(['panel', panels[1].inert]); };
  focusedButton.focus = function () { focusOrder.push(['button']); };
  const api = Function('selectionPanels', 'selectionDots', 'document', `
    var selectionPages = ['books', 'chapters', 'verses'];
    var selectionSheetPage = 'verses';
    ${focusSource}
    ${semanticsSource}
    return updateSelectionPageSemantics;
  `)(panels, dots, { activeElement: oldButton });
  api('pointer', panels[1]);
  assert.deepEqual(focusOrder[0], ['panel', false], 'new panel receives focus before the old panel becomes inert');
  assert.equal(panels[1].inert, true);
  api('keyboard', panels[1]);
  assert.deepEqual(focusOrder.at(-1), ['button']);
});

test('Alt arrow paging is bounded, focuses through the setter, and announces the resulting page', () => {
  const keyboard = functionSource('onSelectionPagerKeyDown');
  const events = [];
  const api = Function('events', `
    var selectionPages = ['books', 'chapters', 'verses'];
    var selectionSheetPage = 'chapters';
    var selectionLive = { textContent: '' };
    function setSelectionPage(page, replace, focusMode) {
      events.push([page, replace, focusMode]); selectionSheetPage = page;
    }
    ${keyboard}
    return { key: onSelectionPagerKeyDown, live: selectionLive,
      page: function () { return selectionSheetPage; } };
  `)(events);
  let prevented = 0;
  api.key({ altKey: true, key: 'ArrowRight', preventDefault() { prevented += 1; } });
  assert.deepEqual(events, [['verses', true, 'keyboard']]);
  api.key({ altKey: true, key: 'ArrowRight', preventDefault() { prevented += 1; } });
  assert.equal(api.page(), 'verses');
  assert.equal(api.live.textContent, 'Verses');
  assert.equal(prevented, 2);
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
    function setSelectionPage(page, replace, focusMode) { events.push(['page', page, replace, focusMode]); return true; }
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
  assert.deepEqual(events.find(event => event[0] === 'page'), ['page', 'chapters', true, 'keyboard']);
  assert.equal(events.some(event => event[0] === 'reader' || event[0] === 'replace'), false);
  assert.equal(api.chapter(999), false);
  assert.equal(api.chapter(4), true);
  assert.deepEqual(api.context(), { book: 'John', chapter: 4 });
  assert.deepEqual(events.filter(event => event[0] === 'page').at(-1), ['page', 'verses', true, 'keyboard']);
  assert.equal(events.some(event => event[0] === 'reader' || event[0] === 'replace'), false);
  assert.equal(api.verse(999), false);
  assert.equal(api.verse(1), true);
  assert.deepEqual(events.filter(event => event[0] === 'replace').length, 1);
  assert.deepEqual(events.filter(event => event[0] === 'reader'), [['reader', 'John', 4, '1']]);
  assert.deepEqual(events.at(-1), ['close', 'selection-complete', 'reader']);
});

test('real focused book activation relocates focus before the old panel becomes inert', () => {
  const panels = [new FakeElement('section'), new FakeElement('section'), new FakeElement('section')];
  const dots = [new FakeElement('span'), new FakeElement('span'), new FakeElement('span')];
  panels.forEach(panel => { panel.inert = false; });
  const oldButton = new FakeElement('button');
  const nextButton = new FakeElement('button');
  panels[0].appendChild(oldButton);
  panels[1].appendChild(nextButton);
  const focusOrder = [];
  const document = { activeElement: oldButton };
  nextButton.focus = function () { focusOrder.push(['next', panels[0].inert]); document.activeElement = nextButton; };
  const api = Function('selectionPanels', 'selectionDots', 'document', `
    var selectionPages = ['books', 'chapters', 'verses'];
    var bibleData = {};
    var selectionSheetPage = 'books';
    var selectionContext = { book: 'Genesis', chapter: 1 };
    var selectionTrack = { style: { transform: '' }, classList: { toggle: function () {} } };
    var selectionRetargetFrame = null;
    var selectionRetargetTimer = null;
    var selectionLive = { textContent: '' };
    var appSheetState = { page: 'books', kind: 'selection', historyOwned: false };
    var appSheet = { open: false };
    var window = { setTimeout: function () { return 1; }, clearTimeout: function () {}, location: { href: '' } };
    var history = { replaceState: function () {} };
    function selectionChapterKeys() { return ['1']; }
    function sanitizedSelectionDataContext() { return { book: 'John', chapter: 1 }; }
    function renderSelectionChapters() {}
    function renderSelectionVerses() {}
    function disconnectSelectionGridLayout() {}
    function cancelAnimationFrame() {}
    function shouldReduceVerseMotion() { return true; }
    function retargetAppSheetMeasurement() {}
    function scheduleSelectionGridRetarget() {}
    function selectionHistoryState() { return null; }
    function currentSelectionReaderReference() { return null; }
    function tagAppSheetHistoryStateForCurrentLifecycle() { return null; }
    function isValidSelectionPage(page) { return selectionPages.indexOf(page) >= 0; }
    ${functionSource('focusSelectionPanel')}
    ${functionSource('updateSelectionPageSemantics')}
    ${functionSource('setSelectionPage')}
    ${functionSource('selectSelectionBook')}
    return selectSelectionBook;
  `)(panels, dots, document);
  assert.equal(api('John'), true);
  assert.deepEqual(focusOrder, [['next', false]]);
  assert.equal(panels[0].inert, true);
  assert.equal(panels[1].inert, false);
});

function runGestureProgram(source = bible, selectionCollapsed = true) {
  const helpers = extractFrom(source,
    /\/\* SELECTION SHEET PURE HELPERS START \*\/[\s\S]*?\/\* SELECTION SHEET PURE HELPERS END \*\//,
    'selection pure helpers missing');
  const axis = extractFrom(source, /function appSheetAxis\(dx, dy\) \{[\s\S]*?\n  \}/, 'axis helper missing');
  const names = [
    'selectionPointerTargetAllowsSwipe', 'selectionCellTarget', 'clearSelectionClickGuard',
    'armSelectionClickGuard', 'guardSelectionClick', 'clearSelectionCompatibilityGuard',
    'rememberSelectionTouchCompatibility', 'isSelectionCompatibilityPointer',
    'resetSelectionPointerToStablePage', 'renderSelectionPointerFrame', 'releaseSelectionPointer', 'onSelectionPointerDown',
    'onSelectionPointerMove', 'settleSelectionPointer', 'onSelectionPointerUp',
    'onSelectionPointerCancel', 'onSelectionLostPointerCapture'
  ];
  const functions = names.map(name => extractFrom(source,
    new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}`), `${name} missing`)).join('\n');
  const pages = [];
  const captures = [];
  const timers = [];
  const pager = {
    clientWidth: 320,
    setPointerCapture(id) { captures.push(['set', id]); },
    hasPointerCapture() { return true; },
    releasePointerCapture(id) { captures.push(['release', id]); }
  };
  const api = Function('window', 'selectionPager', 'pages', 'timers', `
    ${helpers}
    ${axis}
    var selectionSheetPage = 'chapters';
    var selectionPointer = null;
    var selectionTrack = { style: { transform: '' }, classList: { add: function () {} } };
    var selectionPointerFrame = null;
    var selectionTouchIdentifiers = new Map();
    var selectionClickGuard = null;
    var selectionClickGuardTimer = null;
    var selectionCompatibilityGuard = null;
    var selectionCompatibilityGuardTimer = null;
    var appSheetState = { generation: 1 };
    var SELECTION_POINTER_RECENCY_MS = 80;
    var SELECTION_CLICK_GUARD_MS = 500;
    var SELECTION_COMPATIBILITY_GUARD_MS = 500;
    var SELECTION_ENDPOINT_RESISTANCE_PX = 32;
    function requestAnimationFrame(fn) { fn(); return 1; }
    function cancelAnimationFrame() {}
    function setSelectionPage(page) { selectionSheetPage = page; pages.push(page); }
    ${functions}
    return {
      down: onSelectionPointerDown, move: onSelectionPointerMove, up: onSelectionPointerUp,
      cancel: onSelectionPointerCancel, lost: onSelectionLostPointerCapture,
      guardClick: guardSelectionClick,
      guardArmed: function () { return !!selectionClickGuard; },
      generation: function (value) { appSheetState.generation = value; },
      expire: function () { while (timers.length) timers.shift().fn(); },
      track: function () { return selectionTrack.style.transform; },
      setPage: function (page) { selectionSheetPage = page; selectionTrack.style.transform =
        'translateX(' + (-100 * selectionPages.indexOf(page)) + '%)'; },
      page: function () { return selectionSheetPage; }, pointer: function () { return selectionPointer; }
    };
  `)({
    getSelection: () => ({ isCollapsed: selectionCollapsed }),
    setTimeout: function (fn, ms) { timers.push({ fn, ms }); return timers.length; }, clearTimeout: function () {}
  }, pager, pages, timers);
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

function gridTarget(kind = '.chapter-btn') {
  return {
    panel: null,
    closest(selector) {
      if (selector === '.book-btn,.chapter-btn,.verse-btn') return this;
      if (selector === '.selection-panel') return this.panel;
      if (selector.split(',').map(value => value.trim()).includes('button')) return this;
      return selector.split(',').map(value => value.trim()).includes(kind) ? this : null;
    }
  };
}

function blankTouchTarget(panel = null) {
  return { closest(selector) { return selector === '.selection-panel' ? panel : null; } };
}

function nestedButtonTarget(panel = null) {
  const button = {};
  return {
    closest(selector) {
      if (selector === '.selection-panel') return panel;
      return selector.split(',').map(value => value.trim()).includes('button') ? button : null;
    }
  };
}

test('inputs and links stay native while real grid buttons can claim horizontal paging', () => {
  for (const kind of ['input', 'a']) {
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
  const selectedDown = pointerEvent(21, 100, 0, 1, gridTarget());
  const selectedMove = pointerEvent(21, 0, 1, 10, gridTarget());
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
  const mutationDown = pointerEvent(22, 100, 0, 1, gridTarget());
  const mutationMove = pointerEvent(22, 0, 1, 10, mutationDown.target);
  selectedMutation.api.down(mutationDown);
  selectedMutation.api.move(mutationMove);
  assert.notDeepEqual(selectedMutation.captures, [], 'selected-text guard mutation is observable');
  assert.equal(mutationMove.prevented, true);

  const grid = runGestureProgram();
  const target = gridTarget('.book-btn');
  const down = pointerEvent(23, 100, 0, 1, target);
  const move = pointerEvent(23, 0, 1, 10, target);
  grid.api.down(down);
  grid.api.move(move);
  assert.notDeepEqual(grid.captures, []);
  assert.equal(move.prevented, true);
});

test('horizontal gestures execute one page both ways while vertical, cancel, and lost capture do not page', () => {
  const h = runGestureProgram();
  const target = gridTarget();
  h.api.down(pointerEvent(1, 100, 20, 1, target));
  h.api.move(pointerEvent(1, 0, 22, 20, target));
  h.api.up(pointerEvent(1, 0, 22, 22, target));
  assert.equal(h.api.page(), 'verses');
  assert.deepEqual(h.pages, ['verses']);

  h.api.down(pointerEvent(2, 0, 20, 30, target));
  h.api.move(pointerEvent(2, 100, 21, 45, target));
  h.api.up(pointerEvent(2, 100, 21, 47, target));
  assert.equal(h.api.page(), 'chapters');
  assert.deepEqual(h.pages, ['verses', 'chapters']);

  h.api.down(pointerEvent(3, 0, 0, 50, target));
  h.api.move(pointerEvent(3, 2, 90, 60, target));
  assert.equal(h.api.pointer(), null, 'vertical ownership transfers to the sheet controller');
  assert.equal(h.api.page(), 'chapters');

  h.api.down(pointerEvent(4, 100, 0, 70, target));
  h.api.move(pointerEvent(4, 0, 0, 80, target));
  h.api.cancel(pointerEvent(4, 0, 0, 81, target));
  assert.equal(h.api.page(), 'chapters');
  assert.equal(h.api.pointer(), null);

  h.api.down(pointerEvent(5, 100, 0, 90, target));
  h.api.move(pointerEvent(5, 0, 0, 100, target));
  h.api.lost(pointerEvent(5, 0, 0, 101, target));
  assert.equal(h.api.page(), 'chapters');
  assert.equal(h.api.pointer(), null);

  const directionMutant = bible.replace('current + direction', 'current - direction');
  const mutated = runGestureProgram(directionMutant);
  mutated.api.down(pointerEvent(6, 100, 0, 1, target));
  mutated.api.move(pointerEvent(6, 0, 0, 10, target));
  mutated.api.up(pointerEvent(6, 0, 0, 11, target));
  assert.notEqual(mutated.api.page(), 'verses', 'gesture direction mutation is observable');

  const cancelMutant = bible.replace(
    'function onSelectionPointerCancel(e) { settleSelectionPointer(e, true); }',
    'function onSelectionPointerCancel(e) { settleSelectionPointer(e, false); }'
  );
  const cancelled = runGestureProgram(cancelMutant);
  cancelled.api.down(pointerEvent(7, 100, 0, 1, target));
  cancelled.api.move(pointerEvent(7, 0, 0, 10, target));
  cancelled.api.cancel(pointerEvent(7, 0, 0, 11, target));
  assert.notEqual(cancelled.api.page(), 'chapters', 'cancel-listener mutation is observable');
});

test('real book, chapter, and verse cells support pen and mouse paging with one-shot click suppression', () => {
  for (const kind of ['.book-btn', '.chapter-btn', '.verse-btn']) {
    for (const pointerType of ['pen', 'mouse']) {
      const h = runGestureProgram();
      const target = gridTarget(kind);
      const down = { ...pointerEvent(50, 180, 40, 1, target), pointerType };
      const move = { ...pointerEvent(50, 80, 42, 20, target), pointerType };
      h.api.down(down);
      h.api.move(move);
      assert.match(h.api.track(), /-100px/, `${pointerType} ${kind} follows the pointer live`);
      h.api.up({ ...pointerEvent(50, 80, 42, 25, target), pointerType });
      h.api.lost({ ...pointerEvent(50, 80, 42, 26, target), pointerType });
      assert.equal(h.api.page(), 'verses');
      assert.equal(h.api.guardArmed(), true);
      assert.equal(h.api.guardClick({ detail: 0, target, preventDefault() {}, stopPropagation() {} }), false);
      assert.equal(h.api.guardArmed(), true, 'keyboard click leaves matching pointer guard armed');
      let prevented = 0;
      assert.equal(h.api.guardClick({ detail: 1, target, preventDefault() { prevented += 1; }, stopPropagation() {} }), true);
      assert.equal(prevented, 1);
      assert.equal(h.api.guardClick({ detail: 1, target, preventDefault() {}, stopPropagation() {} }), false);
    }
  }
});

test('a different pointer cancels candidate and claimed paging without adopting either pointer', () => {
  const target = gridTarget('.chapter-btn');
  const candidate = runGestureProgram();
  candidate.api.down(pointerEvent(70, 180, 40, 1, target));
  candidate.api.down(pointerEvent(71, 170, 40, 2, target));
  assert.equal(candidate.api.pointer(), null);
  assert.equal(candidate.api.guardArmed(), false, 'unclaimed candidate collision does not arm click suppression');
  assert.equal(candidate.api.track(), 'translateX(-100%)');
  candidate.api.move(pointerEvent(70, 50, 40, 10, target));
  candidate.api.move(pointerEvent(71, 50, 40, 11, target));
  assert.equal(candidate.api.page(), 'chapters');

  const claimed = runGestureProgram();
  claimed.api.down(pointerEvent(72, 180, 40, 1, target));
  claimed.api.move(pointerEvent(72, 80, 40, 10, target));
  claimed.api.down(pointerEvent(73, 170, 40, 11, target));
  assert.equal(claimed.api.pointer(), null);
  assert.equal(claimed.api.track(), 'translateX(-100%)');
  assert.equal(claimed.api.guardArmed(), true, 'claimed collision arms matching-target suppression');
  claimed.api.lost(pointerEvent(72, 80, 40, 12, target));
  const unrelated = gridTarget('.verse-btn');
  assert.equal(claimed.api.guardClick({ detail: 1, target: unrelated, preventDefault() {}, stopPropagation() {} }), false);
  assert.equal(claimed.api.guardArmed(), true, 'unrelated click does not consume the guard');
  assert.equal(claimed.api.guardClick({ detail: 0, target, preventDefault() {}, stopPropagation() {} }), false);
  assert.equal(claimed.api.guardArmed(), true, 'keyboard activation does not consume the guard');
  let suppressed = 0;
  assert.equal(claimed.api.guardClick({ detail: 1, target, preventDefault() { suppressed += 1; }, stopPropagation() {} }), true);
  assert.equal(suppressed, 1);
  assert.equal(claimed.api.guardClick({ detail: 1, target, preventDefault() {}, stopPropagation() {} }), false,
    'matching pointer click is suppressed once');
  claimed.api.up(pointerEvent(72, 40, 40, 20, target));
  claimed.api.up(pointerEvent(73, 40, 40, 21, target));
  assert.equal(claimed.api.page(), 'chapters');

  const stale = runGestureProgram();
  stale.api.down(pointerEvent(74, 180, 40, 1, target));
  stale.api.move(pointerEvent(74, 80, 40, 10, target));
  stale.api.down(pointerEvent(75, 170, 40, 11, target));
  stale.api.generation(2);
  assert.equal(stale.api.guardClick({ detail: 1, target, preventDefault() {}, stopPropagation() {} }), false);
  assert.equal(stale.api.guardArmed(), false, 'generation change clears collision suppression');

  const expired = runGestureProgram();
  expired.api.down(pointerEvent(76, 180, 40, 1, target));
  expired.api.move(pointerEvent(76, 80, 40, 10, target));
  expired.api.down(pointerEvent(77, 170, 40, 11, target));
  expired.api.expire();
  assert.equal(expired.api.guardArmed(), false, 'collision suppression expires after its timeout');
});

test('endpoint resistance is finite and bounded for hostile huge displacement', () => {
  const target = gridTarget('.book-btn');
  const h = runGestureProgram();
  h.api.setPage('books');
  h.api.down(pointerEvent(80, 0, 40, 1, target));
  h.api.move(pointerEvent(80, Number.MAX_VALUE, 40, 10, target));
  const booksTransform = h.api.track();
  assert.doesNotMatch(booksTransform, /NaN|Infinity/);
  assert.match(booksTransform, /\+ 32px/);
  h.api.cancel(pointerEvent(80, Number.MAX_VALUE, 40, 11, target));

  h.api.setPage('verses');
  h.api.down(pointerEvent(81, 0, 40, 20, target));
  h.api.move(pointerEvent(81, -Number.MAX_VALUE, 40, 30, target));
  const versesTransform = h.api.track();
  assert.doesNotMatch(versesTransform, /NaN|Infinity/);
  assert.match(versesTransform, /\+ -32px/);
  h.api.up(pointerEvent(81, -Number.MAX_VALUE, 40, 31, target));
  assert.equal(h.api.page(), 'verses', 'endpoint release never skips or wraps a page');
});

function runTouchAdapter() {
  const helpers = extract(/\/\* SELECTION SHEET PURE HELPERS START \*\/[\s\S]*?\/\* SELECTION SHEET PURE HELPERS END \*\//,
    'selection helpers missing');
  const axis = functionSource('appSheetAxis');
  const boundary = functionSource('appSheetBodyBoundaryAllowsDrag');
  const names = [
    'selectionPointerTargetAllowsSwipe', 'appSheetTouchTargetAllowsVertical', 'selectionCellTarget', 'clearSelectionClickGuard',
    'armSelectionClickGuard', 'guardSelectionClick', 'clearSelectionCompatibilityGuard',
    'rememberSelectionTouchCompatibility', 'isSelectionCompatibilityPointer',
    'resetSelectionPointerToStablePage', 'renderSelectionPointerFrame', 'releaseSelectionPointer',
    'onSelectionPointerDown', 'onSelectionPointerMove', 'settleSelectionPointer', 'onSelectionPointerCancel',
    'selectionTouchByIdentifier', 'clearSelectionTouch', 'selectionTouchInput',
    'cancelSelectionTouchCollision',
    'onSelectionTouchStart', 'onSelectionTouchMove', 'settleSelectionTouch',
    'onSelectionTouchEnd', 'onSelectionTouchCancel'
  ];
  const source = names.map(functionSource).join('\n');
  const frames = [];
  const timers = [];
  const captures = new Set();
  const pager = {
    clientWidth: 320, releaseCount: 0,
    setPointerCapture(id) { captures.add(id); }, hasPointerCapture(id) { return captures.has(id); },
    releasePointerCapture(id) { captures.delete(id); this.releaseCount += 1; },
    captureCount() { return captures.size; }
  };
  return Function('window', 'pager', 'frames', 'timers', `
    ${helpers}
    ${axis}
    ${boundary}
    var selectionSheetPage = 'chapters';
    var selectionPager = pager;
    var selectionTrack = { style: { transform: '' }, classList: { add: function () {} } };
    var selectionPointer = null;
    var selectionPointerFrame = null;
    var selectionClickGuard = null;
    var selectionClickGuardTimer = null;
    var selectionCompatibilityGuard = null;
    var selectionCompatibilityGuardTimer = null;
    var selectionTouchIdentifiers = new Map();
    var SELECTION_POINTER_RECENCY_MS = 80;
    var SELECTION_CLICK_GUARD_MS = 500;
    var SELECTION_COMPATIBILITY_GUARD_MS = 500;
    var SELECTION_TOUCH_TIMEOUT_MS = 1200;
    var SELECTION_ENDPOINT_RESISTANCE_PX = 32;
    var appSheetBody = { scrollTop: 0, clientHeight: 200, scrollHeight: 500 };
    var appSheetState = { generation: 7, kind: 'selection', edge: 'bottom', candidate: null, pointer: null };
    function requestAnimationFrame(fn) { frames.push(fn); return frames.length; }
    function cancelAnimationFrame() { selectionPointerFrame = null; }
    function beginAppSheetGesture(e) { appSheetState.candidate = {
      id: e.pointerId, startY: e.clientY, pointerType: e.pointerType || '', originTarget: e.target,
      touchAdapter: e.isTouchAdapter === true, generation: appSheetState.generation
    }; }
    function cancelAppSheetGesture(e) {
      if (appSheetState.candidate && appSheetState.candidate.id === e.pointerId) appSheetState.candidate = null;
      if (appSheetState.pointer && appSheetState.pointer.id === e.pointerId) appSheetState.pointer = null;
    }
    function updateAppSheetGesture(e) {
      var candidate = appSheetState.candidate;
      if (candidate && !appSheetBodyBoundaryAllowsDrag(appSheetState.edge,
          e.clientY > candidate.startY ? 1 : -1, candidate.scrollTop,
          candidate.clientHeight, candidate.scrollHeight)) {
        appSheetState.candidate = null;
        return;
      }
      if (candidate) { appSheetState.pointer = { id: e.pointerId }; e.preventDefault(); }
      appSheetState.candidate = null;
    }
    function finishAppSheetGesture() { appSheetState.pointer = null; }
    function setSelectionPage(page) { selectionSheetPage = page; }
    ${source}
    return {
      start: onSelectionTouchStart, move: onSelectionTouchMove, end: onSelectionTouchEnd,
      cancel: onSelectionTouchCancel, pointerDown: onSelectionPointerDown, pointerMove: onSelectionPointerMove,
      bodyPointerDown: beginAppSheetGesture,
      page: function () { return selectionSheetPage; }, pointer: function () { return selectionPointer; },
      count: function () { return selectionTouchIdentifiers.size; },
      boundary: function () { return appSheetState.candidate && {
        scrollTop: appSheetState.candidate.scrollTop,
        clientHeight: appSheetState.candidate.clientHeight,
        scrollHeight: appSheetState.candidate.scrollHeight
      }; },
      track: function () { return selectionTrack.style.transform; },
      generation: function (value) { appSheetState.generation = value; },
      kind: function (value) { appSheetState.kind = value; },
      compatibilityArmed: function () { return !!selectionCompatibilityGuard; },
      releaseCount: function () { return selectionPager.releaseCount; },
      captureCount: function () { return selectionPager.captureCount(); },
      frameCount: function () { return frames.length; },
      guardArmed: function () { return !!selectionClickGuard; },
      guardClick: guardSelectionClick,
      sheetPointer: function () { return appSheetState.pointer; },
      flush: function () { while (frames.length) frames.shift()(); },
      expireCompatibility: function () {
        var pending = timers.splice(0, timers.length);
        pending.filter(item => item.ms === 500).forEach(item => item.fn());
        pending.filter(item => item.ms !== 500).forEach(item => timers.push(item));
      },
      expire: function () { while (timers.length) timers.shift().fn(); },
      cancelPointer: onSelectionPointerCancel
    };
  `)({
    getSelection: () => ({ isCollapsed: true }),
    setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {}
  }, pager, frames, timers);
}

function touchEvent(id, x, y, time, target) {
  return {
    changedTouches: [{ identifier: id, clientX: x, clientY: y }], target, timeStamp: time,
    prevented: 0, stopped: 0,
    preventDefault() { this.prevented += 1; }, stopPropagation() { this.stopped += 1; }
  };
}

function multiTouchEvent(count, time, target) {
  return {
    changedTouches: Array.from({ length: count }, (_, index) => ({
      identifier: 1000 + index, clientX: 100 + index, clientY: 40 + index
    })),
    target, timeStamp: time, prevented: 0, stopped: 0,
    preventDefault() { this.prevented += 1; }, stopPropagation() { this.stopped += 1; }
  };
}

test('touch adapter pages once, deduplicates compatibility pointers, and clears identifiers', () => {
  const h = runTouchAdapter();
  const target = gridTarget('.verse-btn');
  target.panel = { scrollTop: 120, clientHeight: 240, scrollHeight: 720 };
  h.start(touchEvent(2, 180, 40, 1, target));
  assert.equal(h.count(), 1);
  assert.equal(h.boundary(), null, 'grid-cell touch starts horizontal paging only');
  h.start(touchEvent(9, 160, 40, 2, target));
  assert.equal(h.count(), 0, 'a different second touch cancels ownership without adopting either touch');
  assert.equal(h.pointer(), null);
  assert.equal(h.sheetPointer(), null);
  h.move(touchEvent(2, 80, 42, 3, target));
  h.move(touchEvent(9, 80, 42, 4, target));
  assert.equal(h.page(), 'chapters', 'neither touch can continue after the collision');

  h.start(touchEvent(6, 180, 40, 5, target));
  h.move(touchEvent(6, 80, 42, 10, target));
  h.flush();
  assert.match(h.track(), /-100px/, 'first touch reaches claimed live displacement');
  h.start(touchEvent(7, 170, 40, 11, target));
  assert.equal(h.count(), 0);
  assert.equal(h.pointer(), null);
  assert.equal(h.track(), 'translateX(-100%)', 'claimed collision returns to the starting stable page');
  assert.equal(h.guardArmed(), true, 'claimed touch collision arms matching-target suppression');
  assert.equal(h.guardClick({ detail: 0, target, preventDefault() {}, stopPropagation() {} }), false);
  assert.equal(h.guardArmed(), true);
  const unrelated = gridTarget('.chapter-btn');
  assert.equal(h.guardClick({ detail: 1, target: unrelated, preventDefault() {}, stopPropagation() {} }), false);
  let touchSuppressed = 0;
  assert.equal(h.guardClick({ detail: 1, target, preventDefault() { touchSuppressed += 1; }, stopPropagation() {} }), true);
  assert.equal(touchSuppressed, 1);
  assert.equal(h.guardClick({ detail: 1, target, preventDefault() {}, stopPropagation() {} }), false);
  h.end(touchEvent(6, 20, 42, 12, target));
  h.end(touchEvent(7, 20, 42, 13, target));
  assert.equal(h.page(), 'chapters');

  h.start(touchEvent(2, 180, 40, 5, target));
  h.pointerDown(pointerEvent(99, 180, 40, 2, target));
  assert.equal(h.pointer().id, -3, 'compatibility pointer cannot replace active touch');
  const move = touchEvent(2, 80, 42, 20, target);
  h.move(move);
  h.flush();
  assert.match(h.track(), /-100px/);
  assert.ok(move.prevented > 0);
  h.end(touchEvent(2, 80, 42, 25, target));
  assert.equal(h.page(), 'verses');
  assert.equal(h.count(), 0);

  h.start(touchEvent(3, 180, 40, 30, target));
  h.cancel(touchEvent(3, 100, 40, 35, target));
  assert.equal(h.count(), 0, 'cancel clears the identifier');
  h.start(touchEvent(4, 180, 40, 40, target));
  h.generation(8);
  h.move(touchEvent(4, 170, 40, 45, target));
  assert.equal(h.count(), 0, 'generation change clears stale touch ownership');
  h.start(touchEvent(5, 180, 40, 50, target));
  h.expire();
  assert.equal(h.count(), 0, 'timeout clears abandoned touch ownership');
  assert.equal(h.pointer(), null, 'timeout also releases retained gesture state');
});

test('touch pointer compatibility is rejected before registration and briefly after cleanup', () => {
  const h = runTouchAdapter();
  const target = gridTarget('.book-btn');
  const earlyTouchPointer = { ...pointerEvent(101, 180, 40, 1, target), pointerType: 'touch' };
  h.pointerDown(earlyTouchPointer);
  assert.equal(h.pointer(), null, 'touch-origin PointerEvent is rejected before TouchEvent registration');

  h.start(touchEvent(12, 180, 40, 2, target));
  h.end(touchEvent(12, 180, 40, 3, target));
  assert.equal(h.count(), 0);
  h.pointerDown({ ...pointerEvent(102, 180, 40, 4, target), pointerType: 'mouse' });
  assert.equal(h.pointer(), null, 'post-touch compatibility mouse is rejected during the guard window');
  h.expireCompatibility();
  h.pointerDown({ ...pointerEvent(103, 180, 40, 5, target), pointerType: 'mouse' });
  assert.equal(h.pointer().id, 103, 'real mouse remains usable after the short guard');

  h.cancelPointer(pointerEvent(103, 180, 40, 6, target));
  h.start(touchEvent(13, 180, 40, 7, target));
  h.end(touchEvent(13, 180, 40, 8, target));
  h.generation(9);
  h.pointerDown({ ...pointerEvent(105, 180, 40, 9, target), pointerType: 'touch' });
  assert.equal(h.pointer(), null, 'touch-origin PointerEvent remains rejected across a stale generation');
  h.pointerDown({ ...pointerEvent(104, 180, 40, 9, target), pointerType: 'mouse' });
  assert.equal(h.pointer().id, 104, 'stale-generation guard is discarded rather than blocking real mouse');
  assert.equal(h.compatibilityArmed(), false);
});

test('grid-button vertical motion stays native even at a boundary', () => {
  const mid = runTouchAdapter();
  const midTarget = gridTarget('.book-btn');
  midTarget.panel = { scrollTop: 80, clientHeight: 200, scrollHeight: 600 };
  mid.start(touchEvent(10, 100, 40, 1, midTarget));
  const nativeMove = touchEvent(10, 102, 90, 20, midTarget);
  mid.move(nativeMove);
  assert.equal(mid.sheetPointer(), null);
  assert.equal(nativeMove.prevented, 0, 'mid-scroll vertical movement remains native');
  mid.cancel(touchEvent(10, 102, 90, 21, midTarget));

  const edge = runTouchAdapter();
  const edgeTarget = gridTarget('.book-btn');
  edgeTarget.panel = { scrollTop: 0, clientHeight: 200, scrollHeight: 600 };
  edge.start(touchEvent(11, 100, 40, 1, edgeTarget));
  const edgeMove = touchEvent(11, 102, 90, 20, edgeTarget);
  edge.move(edgeMove);
  assert.equal(edge.sheetPointer(), null);
  assert.equal(edgeMove.prevented, 0, 'grid vertical movement remains native for horizontal-only cells');
  edge.cancel(touchEvent(11, 102, 90, 21, edgeTarget));
  assert.equal(edge.count(), 0);
});

test('sheet-body touch adapter owns generic and selector blank-region boundary drags', () => {
  const verticalGuard = functionSource('appSheetTouchTargetAllowsVertical');
  assert.match(verticalGuard, /button,a,input,select,textarea,label/);
  assert.doesNotMatch(verticalGuard, /\bp,span,li\b/);
  assert.match(bible, /appSheetBody\.addEventListener\('touchstart', onSelectionTouchStart, \{ passive: false \}\)/);
  assert.match(bible, /appSheetBody\.addEventListener\('touchmove', onSelectionTouchMove, \{ passive: false \}\)/);
  assert.doesNotMatch(bible, /selectionPager\.addEventListener\('touchstart'/);

  const generic = runTouchAdapter();
  generic.kind('history');
  const genericTarget = blankTouchTarget(null);
  generic.start(touchEvent(30, 100, 40, 1, genericTarget));
  const genericMove = touchEvent(30, 102, 90, 20, genericTarget);
  generic.move(genericMove);
  assert.equal(generic.sheetPointer().id, -31);
  assert.ok(genericMove.prevented > 0);
  generic.cancel(touchEvent(30, 102, 90, 21, genericTarget));
  assert.equal(generic.count(), 0);

  const selector = runTouchAdapter();
  const panel = { scrollTop: 0, clientHeight: 200, scrollHeight: 600 };
  const selectorTarget = blankTouchTarget(panel);
  selector.start(touchEvent(31, 100, 40, 1, selectorTarget));
  assert.equal(selector.pointer(), null, 'blank selector content does not start horizontal paging');
  const selectorMove = touchEvent(31, 102, 90, 20, selectorTarget);
  selector.move(selectorMove);
  assert.equal(selector.sheetPointer().id, -32);
  assert.ok(selectorMove.prevented > 0);
  selector.cancel(touchEvent(31, 102, 90, 21, selectorTarget));
});

test('touch compatibility pointer candidate is replaced by Touch ownership on blank content', () => {
  for (const scenario of [
    { kind: 'history', target: blankTouchTarget(null), id: 40 },
    { kind: 'selection', target: blankTouchTarget({ scrollTop: 0, clientHeight: 200, scrollHeight: 600 }), id: 41 }
  ]) {
    const h = runTouchAdapter();
    h.kind(scenario.kind);
    h.bodyPointerDown({ ...pointerEvent(200 + scenario.id, 100, 40, 1, scenario.target),
      pointerType: 'touch', currentTarget: {}, isTouchAdapter: false });
    assert.ok(h.boundary(), 'touch-origin PointerEvent creates the pre-Touch candidate');
    h.start(touchEvent(scenario.id, 100, 40, 2, scenario.target));
    assert.equal(h.count(), 1, 'TouchEvent safely replaces the compatibility candidate');
    const move = touchEvent(scenario.id, 102, 90, 20, scenario.target);
    h.move(move);
    assert.equal(h.sheetPointer().id, -(scenario.id + 1));
    assert.ok(move.prevented > 0);
    h.cancel(touchEvent(scenario.id, 102, 90, 21, scenario.target));
    assert.equal(h.count(), 0);
  }

  for (const pointerType of ['mouse', 'pen']) {
    const h = runTouchAdapter();
    const target = blankTouchTarget(null);
    h.kind('history');
    h.bodyPointerDown({ ...pointerEvent(300, 100, 40, 1, target), pointerType, currentTarget: {} });
    h.start(touchEvent(42, 100, 40, 2, target));
    assert.equal(h.count(), 0);
    assert.equal(h.sheetPointer(), null, `genuine ${pointerType} collision adopts neither input`);
  }
});

test('generic and action buttons cannot originate vertical touch dragging', () => {
  for (const kind of ['history', 'settings', 'search', 'verse-actions']) {
    const h = runTouchAdapter();
    h.kind(kind);
    const target = nestedButtonTarget();
    h.start(touchEvent(50, 100, 40, 1, target));
    const move = touchEvent(50, 102, 90, 20, target);
    h.move(move);
    assert.equal(h.count(), 0, `${kind} button touch is never adopted`);
    assert.equal(h.boundary(), null);
    assert.equal(h.sheetPointer(), null);
    assert.equal(move.prevented, 0);
  }
});

test('initial multi-contact touchstart is rejected atomically and single-touch recovery works', () => {
  const scenarios = [
    { kind: 'history', target: blankTouchTarget(null), count: 2, compat: true },
    { kind: 'selection', target: gridTarget('.book-btn'), count: 2, compat: false },
    { kind: 'selection', target: blankTouchTarget({ scrollTop: 0, clientHeight: 200, scrollHeight: 600 }),
      count: 32, compat: true }
  ];
  for (const scenario of scenarios) {
    const h = runTouchAdapter();
    h.kind(scenario.kind);
    if (scenario.compat) {
      h.bodyPointerDown({ ...pointerEvent(500, 100, 40, 1, scenario.target), pointerType: 'touch',
        currentTarget: {}, isTouchAdapter: false });
      assert.ok(h.boundary());
    }
    const start = multiTouchEvent(scenario.count, 2, scenario.target);
    h.start(start);
    assert.equal(h.count(), 0);
    assert.equal(h.pointer(), null);
    assert.equal(h.sheetPointer(), null);
    assert.equal(h.boundary(), null, 'matching compatibility candidate is cleared');
    assert.equal(h.frameCount(), 0);
    assert.equal(h.captureCount(), 0);
    assert.equal(h.guardArmed(), false);
    assert.equal(start.prevented, 0);

    h.start(touchEvent(60, 100, 40, 3, scenario.target));
    assert.equal(h.count(), 1, 'subsequent single-touch starts from a clean state');
    h.cancel(touchEvent(60, 100, 40, 4, scenario.target));
    assert.equal(h.count(), 0);
  }
});

test('touch arriving during mouse or pen paging cancels without reverse-hybrid adoption', () => {
  for (const pointerType of ['mouse', 'pen']) {
    const candidate = runTouchAdapter();
    const target = gridTarget('.chapter-btn');
    candidate.pointerDown({ ...pointerEvent(120, 180, 40, 1, target), pointerType });
    candidate.start(touchEvent(20, 170, 40, 2, target));
    assert.equal(candidate.pointer(), null);
    assert.equal(candidate.count(), 0);
    assert.equal(candidate.guardArmed(), false, 'unclaimed reverse hybrid does not arm suppression');

    const claimed = runTouchAdapter();
    claimed.pointerDown({ ...pointerEvent(121, 180, 40, 1, target), pointerType });
    claimed.pointerMove({ ...pointerEvent(121, 80, 40, 10, target), pointerType });
    claimed.start(touchEvent(21, 170, 40, 11, target));
    claimed.flush();
    assert.equal(claimed.pointer(), null);
    assert.equal(claimed.count(), 0);
    assert.equal(claimed.track(), 'translateX(-100%)');
    assert.equal(claimed.guardArmed(), true);
    assert.equal(claimed.releaseCount(), 1, 'reverse hybrid releases captured mouse/pen ownership');
    claimed.pointerMove({ ...pointerEvent(121, 20, 40, 12, target), pointerType });
    claimed.move(touchEvent(21, 20, 40, 13, target));
    assert.equal(claimed.page(), 'chapters');
  }
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
    var selectionPointerFrame = null;
    var selectionClickGuard = null;
    var selectionClickGuardTimer = null;
    var selectionTouchIdentifiers = new Map();
    var selectionLive = null;
    var selectionRetargetFrame = null;
    var selectionRetargetTimer = null;
    function disconnectSelectionGridLayout() {}
    function releaseSelectionPointer() { selectionPointer = null; }
    function clearSelectionClickGuard() { selectionClickGuard = null; }
    function clearSelectionCompatibilityGuard() {}
    function clearSelectionTouch(identifier) { selectionTouchIdentifiers.delete(identifier); }
    function onSelectionPointerDown() {} function onSelectionPointerMove() {}
    function onSelectionPointerUp() {} function onSelectionPointerCancel() {}
    function onSelectionLostPointerCapture() {} function onSelectionTouchStart() {}
    function onSelectionTouchMove() {} function onSelectionTouchEnd() {}
    function onSelectionTouchCancel() {} function guardSelectionClick() {}
    function onSelectionPagerKeyDown() {} function finishSelectionPageSettle() {}
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

test('selector touch adapter, click guard, and live frame are wired to real grid cells', () => {
  const guard = functionSource('selectionPointerTargetAllowsSwipe');
  assert.match(guard, /\.book-btn,\.chapter-btn,\.verse-btn/);
  assert.match(guard, /a,input,select,textarea,label/);
  const start = functionSource('onSelectionTouchStart');
  const move = functionSource('onSelectionTouchMove');
  const cleanup = functionSource('clearSelectionTouch');
  assert.match(start, /changedTouches/);
  assert.match(start, /selectionTouchIdentifiers\.set/);
  assert.match(start, /generation:\s*appSheetState\.generation/);
  assert.match(move, /preventDefault\(\)/);
  assert.match(move, /onSelectionPointerMove/);
  assert.match(cleanup, /selectionTouchIdentifiers\.delete/);
  assert.match(cleanup, /clearTimeout/);
  assert.match(bible, /addEventListener\('touchstart', onSelectionTouchStart, \{ passive: false \}\)/);
  assert.match(bible, /addEventListener\('touchmove', onSelectionTouchMove, \{ passive: false \}\)/);
  assert.match(bible, /function renderSelectionPointerFrame\(pointer\)[\s\S]*translateX/);
  assert.match(bible, /function guardSelectionClick\(e\)[\s\S]*e\.detail === 0/);
  assert.match(bible, /SELECTION_CLICK_GUARD_MS\s*=\s*500/);
});

test('selector panels provide inert focus-safe paging and bounded keyboard announcements', () => {
  const semantics = functionSource('updateSelectionPageSemantics');
  const focus = functionSource('focusSelectionPanel');
  assert.match(semantics, /document\.activeElement/);
  assert.match(focus, /focus\(\{ preventScroll: true \}\)/);
  assert.match(semantics, /setAttribute\('aria-hidden', active \? 'false' : 'true'\)/);
  assert.match(semantics, /\.inert = !active/);
  const keyboard = functionSource('onSelectionPagerKeyDown');
  assert.match(keyboard, /e\.altKey/);
  assert.match(keyboard, /ArrowLeft/);
  assert.match(keyboard, /ArrowRight/);
  assert.match(focus, /querySelector\('button:not\(\[disabled\]\)'\)/);
  assert.match(functionSource('setSelectionPage'), /selectionLive\.textContent/);
});

test('approved decorative Tonal Float replaces interactive selector dots at the bottom', () => {
  const render = extract(/function renderSelectionSheet\(target, sheet\) \{[\s\S]*?\n  \}/, 'selection renderer missing');
  assert.match(render, /indicator\.className = 'selection-indicator'/);
  assert.match(render, /indicator\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(render, /dot = document\.createElement\('span'\)/);
  assert.doesNotMatch(render, /dot\.addEventListener\('click'|role', 'tab'|tablist/);
  const css = extract(/\.selection-indicator \{[\s\S]*?\.selection-indicator-dot\.is-active \{[^}]*\}/,
    'Tonal Float CSS missing');
  assert.match(css, /width:\s*36px/);
  assert.match(css, /height:\s*28px/);
  assert.match(css, /bottom:/);
  assert.match(css, /backdrop-filter:\s*blur/);
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /user-select:\s*none/);
  assert.doesNotMatch(bible, /\.app-sheet\.edge-top \.selection-(?:dots|indicator)[^{]*\{[^}]*order:/);
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
