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
  assert.match(bible, /registerAppSheetDescriptor\('selection', \{ title: 'Selection', render: function \(target, sheet\) \{\s*return renderSelectionSheet\(target, sheet\);/);
  const validator = extract(/function validatedAppSheetHistoryState\(state\) \{[\s\S]*?\n  \}/, 'sheet state validator missing');
  assert.match(validator, /normalizedSelectionPage/);
  const cleanup = extract(/function cleanupSelectionSheet\(\) \{[\s\S]*?\n  \}/, 'selection cleanup missing');
  assert.match(cleanup, /selectionPointer = null/);
  assert.match(cleanup, /selectionTrack = null/);
  assert.match(cleanup, /selectionGrids = null/);
  assert.match(cleanup, /selectionMediaQuery = null/);
});
