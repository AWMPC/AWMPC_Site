const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');
const seasonalCore = [
  'bg', 'bg2', 'bg3', 'bg4', 'surface', 'surface-hi',
  'fg', 'fg2', 'fg3', 'fg4', 'border', 'border2', 'border3',
  'accent', 'accent-fg', 'verse-num', 'note-bg', 'note-border', 'pill-bg'
];
const derived = [
  'verse-bg', 'verse-active-border', 'fab-bg', 'fab-fg',
  'float-nav-bg', 'float-nav-fg', 'card-bg', 'card-border',
  'menu-bg', 'hover-bg'
];
const seasonModes = [
  ['spring', false], ['spring', true],
  ['summer', false], ['summer', true],
  ['fall', false], ['fall', true],
  ['winter', false], ['winter', true]
];
const expectedBorders = new Map([
  ['html[data-season="spring"]', ['rgba(24,48,27,.14)', 'rgba(24,48,27,.20)', 'rgba(24,48,27,.32)']],
  ['html[data-season="spring"].dark', ['rgba(236,247,232,.10)', 'rgba(236,247,232,.16)', 'rgba(236,247,232,.28)']],
  ['html[data-season="summer"]', ['rgba(53,44,20,.14)', 'rgba(53,44,20,.20)', 'rgba(53,44,20,.32)']],
  ['html[data-season="summer"].dark', ['rgba(255,245,206,.10)', 'rgba(255,245,206,.16)', 'rgba(255,245,206,.28)']],
  ['html[data-season="fall"]', ['rgba(60,33,22,.14)', 'rgba(60,33,22,.20)', 'rgba(60,33,22,.32)']],
  ['html[data-season="fall"].dark', ['rgba(255,233,216,.10)', 'rgba(255,233,216,.16)', 'rgba(255,233,216,.28)']],
  ['html[data-season="winter"]', ['rgba(20,43,62,.14)', 'rgba(20,43,62,.20)', 'rgba(20,43,62,.32)']],
  ['html[data-season="winter"].dark', ['rgba(233,246,255,.10)', 'rgba(233,246,255,.16)', 'rgba(233,246,255,.28)']]
]);

function cssBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = bible.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `missing ${selector} block`);
  return match[1];
}

function declaration(block, token) {
  const match = block.match(new RegExp(`--${token}\\s*:\\s*([^;]+);`));
  assert.ok(match, `missing --${token}`);
  return match[1].trim();
}

function rgb(hex) {
  const value = hex.replace('#', '');
  assert.match(value, /^[0-9a-f]{6}$/i, `expected six-digit hex, got ${hex}`);
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
}

function luminance(hex) {
  return rgb(hex)
    .map((value) => value / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('every seasonal light and dark mode owns every palette primitive', () => {
  for (const [season, dark] of seasonModes) {
    const selector = `html[data-season="${season}"]${dark ? '.dark' : ''}`;
    const block = cssBlock(selector);
    for (const token of seasonalCore) {
      assert.match(block, new RegExp(`--${token}\\s*:`), `${selector} missing --${token}`);
    }
    assert.deepEqual(
      ['border', 'border2', 'border3'].map((token) => declaration(block, token)),
      expectedBorders.get(selector),
      `${selector} border primitives changed`
    );
  }
});

test('ordinary UI aliases derive from season primitives without base blue literals', () => {
  const root = cssBlock(':root');
  const allowedPrimitives = new Set(seasonalCore);

  for (const token of derived) {
    const value = declaration(root, token);
    assert.doesNotMatch(value, /#(?:0b63ce|5b9bf4|8bb9ff)/i, `--${token} hardcodes a base blue`);
    assert.doesNotMatch(value, /rgba?\(/i, `--${token} hardcodes an ordinary UI color`);
    const references = [...value.matchAll(/var\(--([\w-]+)\)/g)].map((match) => match[1]);
    assert.ok(references.length > 0, `--${token} must derive from a primitive`);
    for (const reference of references) {
      assert.ok(allowedPrimitives.has(reference), `--${token} derives from non-season primitive --${reference}`);
    }
  }

  const dark = cssBlock('html.dark');
  for (const token of derived) {
    assert.doesNotMatch(dark, new RegExp(`--${token}\\s*:`), `html.dark overrides shared --${token}`);
  }
});

test('actual seasonal text and active-border declarations meet WCAG contrast', () => {
  for (const [season, dark] of seasonModes) {
    const selector = `html[data-season="${season}"]${dark ? '.dark' : ''}`;
    const block = cssBlock(selector);
    const fg = declaration(block, 'fg');
    const bg = declaration(block, 'bg');
    const border = declaration(block, 'accent');
    assert.ok(contrast(fg, bg) >= 4.5, `${fg} on ${bg} is below 4.5:1`);
    assert.ok(contrast(border, bg) >= 3, `${border} against ${bg} is below 3:1`);
  }
});

test('verses always use a seasonal surface and only active verses gain a visible border', () => {
  const verse = cssBlock('.verse');
  assert.match(verse, /background:\s*var\(--verse-bg\)/);
  assert.match(verse, /border:\s*2px solid transparent/);

  const active = cssBlock('.verse.active');
  assert.match(active, /border-color:\s*var\(--verse-active-border\)/);
  assert.match(active, /box-shadow:\s*none/);
  assert.doesNotMatch(active, /accent-glow|verse-glow/);

  const focus = cssBlock('.verse:focus-visible');
  assert.match(focus, /outline:\s*3px solid var\(--accent\)/);
  const activeFocus = cssBlock('.verse.active:focus-visible');
  assert.match(activeFocus, /outline:\s*none/);

  const footnotesOpen = cssBlock('.verse.footnotes-open');
  assert.doesNotMatch(footnotesOpen, /(?:^|;)\s*(?:background|border-color|box-shadow)\s*:/);

  assert.doesNotMatch(bible, /found-highlight/);
  assert.doesNotMatch(bible, /startVerseFoundTransition|clearVerseHighlightTransition|verseHighlight(?:Target|Frame|CleanupTimer)/);

  const verseRules = [...bible.matchAll(/([^{}]*\.verse(?![-\w])[^{}]*)\{([^}]*)\}/g)];
  for (const [, selector, body] of verseRules) {
    if (/\.verse\.active(?:\s|,|$)/.test(selector)) continue;
    assert.doesNotMatch(body, /box-shadow\s*:/, `${selector.trim()} adds a verse shadow`);
    assert.doesNotMatch(body, /border-color\s*:/, `${selector.trim()} overrides the reserved/active border`);
  }
});

test('retired verse glow is absent from CSS and text scaling', () => {
  assert.doesNotMatch(bible, /--verse-glow-/);
  assert.doesNotMatch(bible, /\bglow(?:OffsetY|Blur|Strength)\s*:/);
});
