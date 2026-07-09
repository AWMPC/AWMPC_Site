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

function selectionMath() {
  const source = [
    'var DEFAULT_TEXT_SCALE = 100;',
    extract(/var BASE_SELECTION_CELL_WIDTH = 58;/, 'selection cell baseline missing'),
    extract(/function selectionCellWidthForScale\(scale\) \{[\s\S]*?\n  \}/, 'scaled selection cell helper missing'),
    extract(/function selectionGridColumnCount\(width, cellWidth, gap\) \{[\s\S]*?\n  \}/, 'selection column helper missing')
  ].join('\n');
  return Function(`${source}; return { selectionCellWidthForScale, selectionGridColumnCount };`)();
}

test('selection cell width uses the full Text Scale and safely normalizes invalid values', () => {
  const { selectionCellWidthForScale } = selectionMath();
  assert.deepEqual(
    [50, 75, 100, 125, 150].map(selectionCellWidthForScale),
    [29, 43.5, 58, 72.5, 87]
  );
  for (const invalid of [NaN, Infinity, -Infinity, 0, -25, null, undefined, '', false, {}, []]) {
    assert.equal(selectionCellWidthForScale(invalid), 58, `safe default for ${String(invalid)}`);
  }

  const helper = extract(/function selectionCellWidthForScale\(scale\) \{[\s\S]*?\n  \}/, 'scaled selection cell helper missing');
  const mutated = helper.replace('/ 100', '/ 125');
  const mutant = Function('BASE_SELECTION_CELL_WIDTH', `${mutated}; return selectionCellWidthForScale;`)(58);
  assert.notDeepEqual([50, 75, 100, 125, 150].map(mutant), [29, 43.5, 58, 72.5, 87]);
});

test('selection columns are the largest fitting positive multiple of three', () => {
  const { selectionGridColumnCount } = selectionMath();
  const cell = 58;
  const gap = 8;
  const cases = [
    [0, 3],
    [189.999, 3],
    [190, 3],
    [387.999, 3],
    [388, 6],
    [585.999, 6],
    [586, 9],
    [783.999, 9],
    [784, 12]
  ];
  for (const [width, expected] of cases) {
    assert.equal(selectionGridColumnCount(width, cell, gap), expected, `width ${width}`);
  }

  for (const scale of [50, 75, 100, 125, 150]) {
    const scaledCell = cell * scale / 100;
    for (const width of [0, 80, 190, 320, 640, 960, 1440]) {
      const count = selectionGridColumnCount(width, scaledCell, gap);
      const raw = Math.floor((width + gap) / (scaledCell + gap));
      assert.ok(count >= 3, 'minimum is three columns');
      assert.equal(count % 3, 0, 'columns remain a multiple of three');
      if (raw >= 3) {
        assert.ok(count <= raw, 'result fits when at least three columns fit');
        assert.ok(count + 3 > raw, 'no larger multiple of three fits');
      }
    }
  }

  const helper = extract(/function selectionGridColumnCount\(width, cellWidth, gap\) \{[\s\S]*?\n  \}/, 'selection column helper missing');
  const mutated = helper.replace('Math.floor(raw / 3) * 3', 'raw');
  const mutant = Function(`${mutated}; return selectionGridColumnCount;`)();
  assert.equal(mutant(520, cell, gap) % 3, 2, 'modulo snapping mutation must be observable');
});

test('selection column helper validates numeric geometry inputs', () => {
  const { selectionGridColumnCount } = selectionMath();
  for (const args of [
    [NaN, 58, 8], [Infinity, 58, 8], [-1, 58, 8], ['388', 58, 8],
    [388, NaN, 8], [388, 0, 8], [388, -1, 8], [388, '58', 8],
    [388, 58, NaN], [388, 58, -1], [388, 58, '8']
  ]) {
    const result = selectionGridColumnCount(...args);
    assert.ok(Number.isInteger(result));
    assert.ok(result >= 3);
    assert.equal(result % 3, 0);
  }
});

test('one root column token drives both selection grids with natural rows', () => {
  assert.match(bible, /:root \{[\s\S]*?--selection-grid-columns:\s*3;/);
  const chapter = extract(/\.chapter-grid \{[^}]*\}/, 'chapter grid rule missing');
  const verse = extract(/\.verse-grid \{[^}]*\}/, 'verse grid rule missing');
  for (const [name, rule] of [['chapter', chapter], ['verse', verse]]) {
    assert.match(rule, /grid-template-columns:\s*repeat\(var\(--selection-grid-columns\),\s*minmax\(0,\s*1fr\)\);/, `${name} grid token consumer`);
    assert.doesNotMatch(rule, /auto-fill|auto-fit/);
  }
  assert.doesNotMatch(bible, /className\s*=\s*['"][^'"]*(?:grid-filler|selection-filler)/, 'selection grids use natural rows without filler nodes');

  const mutated = bible.replace(
    /(\.verse-grid \{[^}]*?)grid-template-columns:\s*repeat\(var\(--selection-grid-columns\),\s*minmax\(0,\s*1fr\)\);/,
    '$1grid-template-columns: repeat(3, minmax(0, 1fr));'
  );
  assert.doesNotMatch(mutated.match(/\.verse-grid \{[^}]*\}/)[0], /repeat\(var\(--selection-grid-columns\)/,
    'removing either CSS consumer must be mutation-sensitive');
});

function extractFrom(source, pattern, message) {
  const match = source.match(pattern);
  assert.ok(match, message);
  return match[0];
}

function lifecycleProgram(source = bible) {
  return [
    'var DEFAULT_TEXT_SCALE = 100;',
    'var viewInner = { contains: function () { return true; } };',
    extractFrom(source, /var BASE_SELECTION_CELL_WIDTH = 58;/, 'selection cell baseline missing'),
    extractFrom(source, /function selectionCellWidthForScale\(scale\) \{[\s\S]*?\n  \}/, 'scaled selection cell helper missing'),
    extractFrom(source, /function selectionGridColumnCount\(width, cellWidth, gap\) \{[\s\S]*?\n  \}/, 'selection column helper missing'),
    extractFrom(source, /var activeSelectionGrid = null;\n  var selectionGridResizeObserver = null;\n  var selectionGridFrame = null;\n  var currentSelectionScale = DEFAULT_TEXT_SCALE;/,
      'selection grid lifecycle state missing'),
    extractFrom(source, /function updateSelectionGridLayout\(\) \{[\s\S]*?\n  \}/, 'selection grid writer missing'),
    extractFrom(source, /function scheduleSelectionGridLayout\(\) \{[\s\S]*?\n  \}/, 'selection grid scheduler missing'),
    extractFrom(source, /function disconnectSelectionGridLayout\(\) \{[\s\S]*?\n  \}/, 'selection grid cleanup missing'),
    extractFrom(source, /function observeSelectionGrid\(grid\) \{[\s\S]*?\n  \}/, 'selection grid observer missing')
  ].join('\n');
}

function makeLifecycleHarness(rafId = 7, source = bible) {
  const queued = [];
  const cancelled = [];
  const rootWrites = [];
  const observers = [];
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.observed = []; this.disconnects = 0; observers.push(this); }
    observe(target) { this.observed.push(target); }
    disconnect() { this.disconnects += 1; }
  }
  const document = { documentElement: { style: { setProperty(name, value) { rootWrites.push([name, value]); } } } };
  const window = {
    ResizeObserver,
    getComputedStyle(target) { return { columnGap: `${target.gap}px` }; }
  };
  const requestAnimationFrame = (callback) => { queued.push(callback); return rafId; };
  const cancelAnimationFrame = (id) => { cancelled.push(id); };
  const api = Function('window', 'ResizeObserver', 'document', 'requestAnimationFrame', 'cancelAnimationFrame',
    `${lifecycleProgram(source)}; return {
      observeSelectionGrid, disconnectSelectionGridLayout, scheduleSelectionGridLayout,
      setScale(value) { currentSelectionScale = value; },
      target() { return activeSelectionGrid; }, frame() { return selectionGridFrame; }
    };`)(window, ResizeObserver, document, requestAnimationFrame, cancelAnimationFrame);
  return { api, queued, cancelled, rootWrites, observers };
}

function gridFixture(width, gap) {
  const writes = [];
  return {
    clientWidth: width,
    gap,
    isConnected: true,
    writes,
    style: { setProperty(name, value) { writes.push([name, value]); } }
  };
}

test('selection observer reuses one instance, disconnects before retarget, and reacts through RAF', () => {
  const h = makeLifecycleHarness();
  const first = gridFixture(388, 8);
  const second = gridFixture(586, 8);

  h.api.observeSelectionGrid(first);
  assert.equal(h.observers.length, 1);
  assert.deepEqual(h.observers[0].observed, [first]);
  assert.deepEqual(first.writes.at(-1), ['--selection-grid-columns', '6']);
  assert.deepEqual(h.rootWrites, [], 'the root keeps only its CSS fallback');

  h.api.observeSelectionGrid(second);
  assert.equal(h.observers.length, 1, 'observer instance is reused');
  assert.equal(h.observers[0].disconnects, 2, 'initial setup and retarget both clear prior observation');
  assert.deepEqual(h.observers[0].observed, [first, second]);
  assert.equal(h.api.target(), second);
  assert.deepEqual(second.writes.at(-1), ['--selection-grid-columns', '9']);

  second.clientWidth = 388;
  h.observers[0].callback([{ target: second }]);
  assert.equal(h.queued.length, 1);
  h.queued.shift()();
  assert.deepEqual(second.writes.at(-1), ['--selection-grid-columns', '6']);

  h.api.disconnectSelectionGridLayout();
  assert.equal(h.api.target(), null);
  assert.equal(h.observers[0].disconnects, 3);

  const disconnectedMutation = bible.replace(
    'if (selectionGridResizeObserver) selectionGridResizeObserver.disconnect();',
    'if (selectionGridResizeObserver) { /* mutation: retained observer */ }'
  );
  const mutant = makeLifecycleHarness(7, disconnectedMutation);
  mutant.api.observeSelectionGrid(gridFixture(388, 8));
  mutant.api.observeSelectionGrid(gridFixture(586, 8));
  mutant.api.disconnectSelectionGridLayout();
  assert.notEqual(mutant.observers[0].disconnects, 3, 'observer-disconnect mutation is observable');
});

test('writer uses live full scale and resolved gap to cross modulo-three tiers', () => {
  const h = makeLifecycleHarness();
  const grid = gridFixture(1, 1);
  h.api.observeSelectionGrid(grid);
  grid.writes.length = 0;

  const cases = [
    { scale: 50, gap: 4, width: 590, columns: 18 },
    { scale: 75, gap: 6, width: 588, columns: 12 },
    { scale: 100, gap: 8, width: 586, columns: 9 },
    { scale: 125, gap: 10, width: 485, columns: 6 },
    { scale: 150, gap: 12, width: 285, columns: 3 }
  ];
  for (const sample of cases) {
    h.api.setScale(sample.scale);
    grid.gap = sample.gap;
    grid.clientWidth = sample.width;
    h.observers[0].callback([{ target: grid }]);
    h.queued.shift()();
    assert.deepEqual(grid.writes.at(-1), ['--selection-grid-columns', String(sample.columns)],
      `${sample.scale}% at the ${sample.columns}-column threshold with ${sample.gap}px gap`);
  }
  assert.deepEqual(h.rootWrites, []);

  const fixedScale = bible.replace('selectionCellWidthForScale(currentSelectionScale)', '58');
  const scaleMutant = makeLifecycleHarness(7, fixedScale);
  const scaleGrid = gridFixture(590, 4);
  scaleMutant.api.setScale(50);
  scaleMutant.api.observeSelectionGrid(scaleGrid);
  assert.notDeepEqual(scaleGrid.writes.at(-1), ['--selection-grid-columns', '18'], 'fixed 100% cell width must fail');

  const fixedGap = bible.replace('parseFloat(window.getComputedStyle(grid).columnGap)', '8');
  const gapMutant = makeLifecycleHarness(7, fixedGap);
  const gapGrid = gridFixture(590, 4);
  gapMutant.api.setScale(50);
  gapMutant.api.observeSelectionGrid(gapGrid);
  assert.notDeepEqual(gapGrid.writes.at(-1), ['--selection-grid-columns', '18'], 'fixed 8px gap must fail');

  const rootWrite = bible.replace(
    "grid.style.setProperty('--selection-grid-columns', String(columns));",
    "document.documentElement.style.setProperty('--selection-grid-columns', String(columns));"
  );
  const rootMutant = makeLifecycleHarness(7, rootWrite);
  const rootGrid = gridFixture(388, 8);
  rootMutant.api.observeSelectionGrid(rootGrid);
  assert.deepEqual(rootGrid.writes, [], 'root-scoped mutation must not update the active grid');
  assert.notDeepEqual(rootMutant.rootWrites, [], 'root-scoped mutation is observable');
});

test('supported 320px viewport keeps at least three shrinkable tracks within available width at every scale', () => {
  const { selectionCellWidthForScale, selectionGridColumnCount } = selectionMath();
  const availableWidth = 320 - (2 * 12) - (2 * 12);
  const gap = 8;
  for (const scale of [50, 75, 100, 125, 150]) {
    const columns = selectionGridColumnCount(availableWidth, selectionCellWidthForScale(scale), gap);
    assert.ok(columns >= 3, `${scale}% retains at least three columns`);
    assert.equal(columns % 3, 0);
    const actualTrackWidth = (availableWidth - ((columns - 1) * gap)) / columns;
    assert.ok(actualTrackWidth >= 24, `${scale}% tracks retain the minimum interactive width`);
    assert.ok((actualTrackWidth * columns) + (gap * (columns - 1)) <= availableWidth,
      `${scale}% tracks do not overflow`);
  }
  // Viewports below the project's supported 320px floor are intentionally out of scope.
});

test('selection RAF coalesces even when the browser returns frame id zero', () => {
  const h = makeLifecycleHarness(0);
  h.api.scheduleSelectionGridLayout();
  h.api.scheduleSelectionGridLayout();
  assert.equal(h.queued.length, 1);
  assert.equal(h.api.frame(), 0);
  h.queued.shift()();
  assert.equal(h.api.frame(), null);
  h.api.scheduleSelectionGridLayout();
  assert.equal(h.queued.length, 1, 'a new frame can be scheduled after the callback');
  h.api.disconnectSelectionGridLayout();
  assert.deepEqual(h.cancelled, [0], 'cleanup cancels a pending id-zero frame');
  assert.equal(h.api.frame(), null);
});

test('view replacement cleans selection layout first and new grids attach before initial measurement', () => {
  const replacements = [...bible.matchAll(/(^|\n)(\s*)viewInner\.textContent = '';/g)];
  assert.equal(replacements.length, 4, 'all four remaining view renderers are audited');
  for (const match of replacements) {
    const before = bible.slice(Math.max(0, match.index - 100), match.index);
    assert.match(before, /disconnectSelectionGridLayout\(\);\s*$/, 'cleanup must precede view removal');
  }

  for (const className of ['chapter-grid', 'verse-grid']) {
    const matches = [...bible.matchAll(new RegExp(`grid\\.className = '${className}'`, 'g'))];
    assert.equal(matches.length, 2, `${className} has one sheet and one legacy builder during migration`);
    const sheetTail = bible.slice(matches[0].index, matches[0].index + 1800);
    assert.match(sheetTail, /panel\.appendChild\(card\);\s*selectionGrids\.(?:chapters|verses) = grid;/,
      `${className} sheet grid connects before becoming an observer target`);
    const legacyTail = bible.slice(matches[1].index, matches[1].index + 1400);
    assert.match(legacyTail, /viewInner\.appendChild\(card\);\s*observeSelectionGrid\(grid\);/,
      `${className} legacy grid remains connected before initial measurement`);
  }

  const resizePath = extract(/window\.addEventListener\('resize',[\s\S]*?\n    \}\);/, 'existing resize path missing');
  assert.match(resizePath, /scheduleSelectionGridLayout\(\);/, 'no-ResizeObserver fallback uses the existing resize path');
  assert.equal((bible.match(/addEventListener\('resize'/g) || []).length, 1, 'no per-view resize listener accumulates');
});

test('selection pager keeps one stable full panel width across all modulo-three grids', () => {
  assert.match(bible, /registerAppSheetDescriptor\('selection',\s*\{[\s\S]*?fillsPanel:\s*true\s*\}\);/);
  assert.match(bible, /\.selection-track\s*\{[^}]*width:\s*100%;/);
  assert.match(bible, /\.selection-panel\s*\{[^}]*flex:\s*0 0 100%;[^}]*min-width:\s*0;/);
  assert.match(bible, /function selectionGridColumnCount[\s\S]*Math\.floor\(raw\s*\/\s*3\)\s*\*\s*3/,
    'full-width paging must preserve modulo-three column quantization');
});
