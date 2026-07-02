const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');
const uiVariableNames = [
  '--display-control-height',
  '--display-icon-button-size',
  '--display-control-pad-y',
  '--display-control-pad-x',
  '--display-panel-padding',
  '--display-panel-gap',
  '--display-nav-padding',
  '--ui-radius',
  '--ui-grid-gap',
  '--ui-view-pad'
];

function extract(pattern, message) {
  const match = bible.match(pattern);
  assert.ok(match, message);
  return match[0];
}

function uiApplicationProgram() {
  return [
    extract(/var TEXT_SCALE_VALUES = \[[\s\S]*?var BASE_UI_GEOMETRY = \{[\s\S]*?\};/, 'Text Scale constants and UI geometry baseline missing'),
    extract(/function normalizeTextScale\(value\) \{[\s\S]*?\n  \}/, 'Text Scale normalizer missing'),
    extract(/function verseSpacingForScale\(scale\) \{[\s\S]*?\n  \}/, 'verse spacing helper missing'),
    extract(/function readerDetailForScale\(scale\) \{[\s\S]*?\n  \}/, 'reader detail helper missing'),
    extract(/function uiGeometryForScale\(scale\) \{[\s\S]*?\n  \}/, 'UI geometry helper missing'),
    extract(/function applyTextScale\(value, persist\) \{[\s\S]*?\n  \}/, 'Text Scale application missing')
  ].join('\n');
}

function executeApplication(source, scale) {
  const writes = {};
  const document = { documentElement: { style: { setProperty(name, value) { writes[name] = value; } } } };
  const textScaleSelect = { value: '' };
  const State = { setTextScale() {} };
  const scheduleBottomChromeClearanceUpdate = () => {};
  const scheduleMarqueeMeasure = () => {};
  const run = Function(
    'document',
    'textScaleSelect',
    'State',
    'scheduleBottomChromeClearanceUpdate',
    'scheduleMarqueeMeasure',
    'scale',
    `${source}\napplyTextScale(scale, false);`
  );
  run(document, textScaleSelect, State, scheduleBottomChromeClearanceUpdate, scheduleMarqueeMeasure, scale);
  return writes;
}

test('ordinary UI geometry uses exact shrink-only values at every Text Scale', () => {
  const constants = extract(/var BASE_UI_GEOMETRY = \{[\s\S]*?\};/, 'UI geometry baseline missing');
  const helper = extract(/function uiGeometryForScale\(scale\) \{[\s\S]*?\n  \}/, 'UI geometry helper missing');
  const geometryFor = Function(`${constants}\n${helper}; return uiGeometryForScale;`)();
  const keys = ['controlHeight', 'iconSize', 'padY', 'padX', 'panelPadding', 'panelGap', 'navPadding', 'radius', 'gridGap', 'viewPad'];
  const expected = {
    50: [24, 24, 4, 6, 6, 4, 3, 10, 4, 6],
    75: [36, 36, 6, 9, 9, 6, 4.5, 15, 6, 9],
    100: [48, 48, 8, 12, 12, 8, 6, 20, 8, 12],
    125: [48, 48, 8, 12, 12, 8, 6, 20, 8, 12],
    150: [48, 48, 8, 12, 12, 8, 6, 20, 8, 12]
  };

  for (const [scale, values] of Object.entries(expected)) {
    assert.deepEqual(keys.map((key) => geometryFor(Number(scale))[key]), values, `geometry at ${scale}%`);
  }
});

test('Text Scale application writes all ten exact UI values and each write is mutation-sensitive', () => {
  const program = uiApplicationProgram();
  const expected = {
    50: ['24px', '24px', '4px', '6px', '6px', '4px', '3px', '10px', '4px', '6px'],
    75: ['36px', '36px', '6px', '9px', '9px', '6px', '4.5px', '15px', '6px', '9px'],
    100: ['48px', '48px', '8px', '12px', '12px', '8px', '6px', '20px', '8px', '12px'],
    125: ['48px', '48px', '8px', '12px', '12px', '8px', '6px', '20px', '8px', '12px'],
    150: ['48px', '48px', '8px', '12px', '12px', '8px', '6px', '20px', '8px', '12px']
  };

  for (const [scale, values] of Object.entries(expected)) {
    const writes = executeApplication(program, Number(scale));
    assert.deepEqual(uiVariableNames.map((name) => writes[name]), values, `writes at ${scale}%`);
  }

  for (const name of uiVariableNames) {
    const needle = `document.documentElement.style.setProperty('${name}'`;
    assert.ok(program.includes(needle), `application write missing for ${name}`);
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const write = new RegExp(`document\\.documentElement\\.style\\.setProperty\\('${escapedName}',[^;]+;`);
    const mutated = program.replace(write, `void ('${name}');`);
    assert.equal(executeApplication(mutated, 50)[name], undefined, `mutation must remove ${name}`);
  }
});

test('50 percent scale preserves a 24px minimum interactive target', () => {
  assert.match(bible, /button,\s*input,\s*select,\s*\[role="button"\] \{[\s\S]*?min-width: 24px;[\s\S]*?min-height: 24px;/);
  assert.match(bible, /\.bottom-history-menu \.dd-item \{[^}]*min-width: 0;[^}]*min-height: 24px;/,
    'the higher-specificity history rule must preserve the 24px target minimum');
  assert.match(bible, /--display-control-height:\s*48px;/);
  assert.match(bible, /--display-icon-button-size:\s*48px;/);
});

test('major reader, selection, search, history, settings, verse, and footnote surfaces are bounded', () => {
  assert.match(bible, /html, body \{[^}]*height: 100%;[^}]*max-width: 100%;[^}]*overflow-x: hidden;/);
  assert.match(bible, /\.view-inner \{[^}]*width: 100%;[^}]*max-width: 960px;[^}]*min-width: 0;/, '.view-inner must be viewport-bounded');
  for (const selector of ['.selection-card', '.search-bar', '.search-result', '.bottom-history-menu', '.fab-panel', '.verse', '.footnote-body']) {
    const escaped = selector.replace('.', '\\.');
    assert.match(bible, new RegExp(`${escaped} \\{[^}]*max-width: 100%;`), `${selector} must be viewport-bounded`);
  }
  assert.match(bible, /\.view-inner \{[^}]*max-width: 960px;/, 'desktop reader measure must remain unchanged');
  assert.doesNotMatch(bible, /\.view-inner \{[^}]*max-width:\s*320px/);
});

test('320px reflow explicitly wraps every major surface and search control', () => {
  const media = extract(/@media \(max-width: 320px\) \{[\s\S]*?\n  \}/, '320px reflow rules missing');
  for (const selector of ['.view-inner', '.selection-card', '.search-bar', '.search-result', '.bottom-history-menu', '.fab-panel', '.verse', '.footnote-body']) {
    assert.match(media, new RegExp(selector.replace('.', '\\.') + '[,\\s]'), `${selector} missing from 320px rule`);
  }
  assert.match(media, /min-width: 0;[\s\S]*max-width: 100%;[\s\S]*overflow-wrap: anywhere;/);
  assert.match(media, /\.search-bar \{ flex-wrap: wrap; \}/);
  assert.match(media, /\.search-input \{ flex-basis: 100%; \}/);
});

test('ordinary radius, grid gaps, and view/card padding use scalable UI tokens', () => {
  assert.match(bible, /--ui-radius:\s*20px;/);
  assert.match(bible, /--ui-grid-gap:\s*8px;/);
  assert.match(bible, /--ui-view-pad:\s*12px;/);
  assert.match(bible, /--oneui-radius:\s*var\(--ui-radius\);/);
  assert.match(bible, /\.chapter-grid \{[^}]*gap: var\(--ui-grid-gap\);/);
  assert.match(bible, /\.verse-grid \{[^}]*gap: var\(--ui-grid-gap\);/);
  assert.match(bible, /\.search-bar \{[^}]*gap: var\(--ui-grid-gap\);/);
  assert.match(bible, /\.view-inner \{[^}]*padding: 16px var\(--ui-view-pad\);/);
  assert.match(bible, /\.search-result \{[^}]*padding: var\(--ui-view-pad\);/);
  assert.match(bible, /border:\s*1px solid/);
});

test('remaining component spacing is routed through shrink-only UI geometry tokens', () => {
  const contracts = [
    [/\.profile-card \{[^}]*padding: 0 var\(--display-panel-padding\) 0 0;/, 'profile padding'],
    [/\.fab-history-menu \{[^}]*gap: min\(6px, var\(--display-panel-gap\)\);/, 'history gap'],
    [/\.dd-item \{[^}]*gap: min\(10px, calc\(var\(--display-panel-gap\) \* 1\.25\)\);/, 'menu gap'],
    [/\.testaments \{[^}]*gap: min\(12px, calc\(var\(--ui-grid-gap\) \* 1\.5\)\);/, 'testament gap'],
    [/\.book-btn \{[^}]*padding: min\(10px, calc\(var\(--display-control-pad-y\) \* 1\.25\)\) var\(--display-control-pad-x\);/, 'book padding'],
    [/\.verse-actions form \{[^}]*gap: min\(10px, calc\(var\(--display-panel-gap\) \* 1\.25\)\);[^}]*padding: min\(20px, calc\(var\(--display-panel-padding\) \* 1\.6667\)\);/, 'context dialog'],
    [/@media \(max-width: 640px\) \{[\s\S]*\.search-input \{[^}]*padding-inline: var\(--display-control-pad-x\);/, 'mobile search padding']
  ];
  for (const [pattern, label] of contracts) assert.match(bible, pattern, label);
});

test('profile and context action geometry computes shrink-only values at every scale', () => {
  const constants = extract(/var BASE_UI_GEOMETRY = \{[\s\S]*?\};/, 'UI geometry baseline missing');
  const helper = extract(/function uiGeometryForScale\(scale\) \{[\s\S]*?\n  \}/, 'UI geometry helper missing');
  const geometryFor = Function(`${constants}\n${helper}; return uiGeometryForScale;`)();
  const computed = (scale) => {
    const g = geometryFor(scale);
    return {
      profileHeight: Math.max(24, Math.min(92, g.controlHeight + g.panelPadding * 3.6667)),
      avatar: Math.max(24, Math.min(28, g.iconSize)),
      photo: Math.max(24, Math.min(36, g.iconSize)),
      gap: Math.min(10, g.panelGap * 1.25),
      profileGap: g.panelPadding,
      signoutHeight: Math.max(24, Math.min(34, g.controlHeight)),
      signoutPad: [Math.min(6, g.padY), Math.min(10, g.padX)],
      actionHeight: Math.max(24, Math.min(44, g.controlHeight)),
      actionPad: [Math.min(10, g.padY * 1.25), Math.min(14, g.padX * 7 / 6)],
      mobileForm: [Math.min(18, g.panelPadding * 1.5), Math.min(16, g.panelPadding * 4 / 3)],
      bookPadY: Math.min(10, g.padY * 1.25)
    };
  };
  assert.deepEqual([50, 75, 100, 125, 150].map(computed), [
    { profileHeight: 46.0002, avatar: 24, photo: 24, gap: 5, profileGap: 6, signoutHeight: 24, signoutPad: [4, 6], actionHeight: 24, actionPad: [5, 7], mobileForm: [9, 8], bookPadY: 5 },
    { profileHeight: 69.00030000000001, avatar: 28, photo: 36, gap: 7.5, profileGap: 9, signoutHeight: 34, signoutPad: [6, 9], actionHeight: 36, actionPad: [7.5, 10.5], mobileForm: [13.5, 12], bookPadY: 7.5 },
    ...Array(3).fill({ profileHeight: 92, avatar: 28, photo: 36, gap: 10, profileGap: 12, signoutHeight: 34, signoutPad: [6, 10], actionHeight: 44, actionPad: [10, 14], mobileForm: [18, 16], bookPadY: 10 })
  ]);
  assert.match(bible, /\.profile-card \{[^}]*min-height: max\(24px, min\(92px, calc\(var\(--display-control-height\) \+ \(var\(--display-panel-padding\) \* 3\.6667\)\)\)\);/);
  assert.match(bible, /\.verse-actions button \{[^}]*min-height: max\(24px, min\(44px, var\(--display-control-height\)\)\);/);
  assert.match(bible, /\.profile-avatar \{[^}]*width: max\(24px, min\(28px, var\(--display-icon-button-size\)\)\);/);
});
