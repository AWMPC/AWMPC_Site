const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');
const seasonalCore = [
  'bg', 'bg2', 'bg3', 'bg4', 'surface', 'surface-hi',
  'fg', 'fg2', 'fg3', 'fg4', 'border', 'border2', 'border3',
  'accent', 'accent-fg', 'verse-num',
  'note-bg', 'note-border', 'pill-bg'
];
const derived = [
  'verse-bg', 'fab-bg', 'fab-fg',
  'float-nav-bg', 'float-nav-fg', 'float-nav-shadow',
  'card-bg', 'card-border', 'menu-bg', 'menu-shadow', 'hover-bg', 'shadow'
];
const seasonModes = [
  ['spring', false], ['spring', true],
  ['summer', false], ['summer', true],
  ['fall', false], ['fall', true],
  ['winter', false], ['winter', true]
];
const expectedBorders = new Map([
  ['html[data-season="spring"]', ['rgba(24,48,27,.55)', 'rgba(24,48,27,.65)', 'rgba(24,48,27,.75)']],
  ['html[data-season="spring"].dark', ['rgba(236,247,232,.50)', 'rgba(236,247,232,.60)', 'rgba(236,247,232,.72)']],
  ['html[data-season="summer"]', ['rgba(53,44,20,.55)', 'rgba(53,44,20,.65)', 'rgba(53,44,20,.75)']],
  ['html[data-season="summer"].dark', ['rgba(255,245,206,.50)', 'rgba(255,245,206,.60)', 'rgba(255,245,206,.72)']],
  ['html[data-season="fall"]', ['rgba(60,33,22,.55)', 'rgba(60,33,22,.65)', 'rgba(60,33,22,.75)']],
  ['html[data-season="fall"].dark', ['rgba(255,233,216,.50)', 'rgba(255,233,216,.60)', 'rgba(255,233,216,.72)']],
  ['html[data-season="winter"]', ['rgba(20,43,62,.55)', 'rgba(20,43,62,.65)', 'rgba(20,43,62,.75)']],
  ['html[data-season="winter"].dark', ['rgba(233,246,255,.50)', 'rgba(233,246,255,.60)', 'rgba(233,246,255,.72)']]
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

function referencedToken(value, alias) {
  const match = value.match(/^var\(--([\w-]+)\)$/);
  assert.ok(match, `--${alias} must be a direct seasonal token reference`);
  return match[1];
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

function compositeRgba(value, background) {
  const match = value.match(/^rgba\((\d+),(\d+),(\d+),([.\d]+)\)$/);
  assert.ok(match, `expected rgba boundary, got ${value}`);
  const alpha = Number(match[4]);
  const bg = rgb(background);
  const channels = match.slice(1, 4).map(Number).map((channel, index) => Math.round(channel * alpha + bg[index] * (1 - alpha)));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
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

test('verses use quiet seasonal highlights and a stronger active accent', () => {
  const root = cssBlock(':root');
  assert.equal(declaration(root, 'verse-highlight'), 'var(--hover-bg)');

  const verse = cssBlock('.verse');
  assert.match(verse, /background:\s*var\(--verse-highlight\)/);
  assert.match(verse, /border:\s*2px solid transparent/);

  const active = cssBlock('.verse.active');
  assert.match(active, /border-color:\s*var\(--accent\)/);
  assert.match(active, /border-width:\s*2px/);
  assert.doesNotMatch(active, /background(?:-color)?\s*:/);
  assert.doesNotMatch(active, /(?:accent|verse)-glow/);

  const footnotesOpen = cssBlock('.verse.footnotes-open');
  const footnoteDeclarations = [...footnotesOpen.matchAll(/(?:^|;)\s*([\w-]+)\s*:/g)]
    .map((match) => match[1]);
  assert.deepEqual(footnoteDeclarations, ['padding'], 'open footnotes may only change verse padding');

  assert.doesNotMatch(bible, /found-highlight/);
  assert.doesNotMatch(bible, /startVerseFoundTransition|clearVerseHighlightTransition|verseHighlight(?:Target|Frame|CleanupTimer)/);

  const verseRules = [...bible.matchAll(/([^{}]*\.verse(?![-\w])[^{}]*)\{([^}]*)\}/g)];
  for (const [, selector, body] of verseRules) {
    assert.doesNotMatch(body, /box-shadow\s*:/, `${selector.trim()} adds a verse shadow`);
    assert.doesNotMatch(body, /outline\s*:/, `${selector.trim()} adds a verse outline`);
    if (!/\.verse\.active(?:\s|,|$)/.test(selector)) {
      assert.doesNotMatch(body, /border-color\s*:/, `${selector.trim()} overrides the reserved/active border`);
    }
  }
});

test('retired verse glow is absent from CSS and text scaling', () => {
  assert.doesNotMatch(bible, /--verse-glow-/);
  assert.doesNotMatch(bible, /\bglow(?:OffsetY|Blur|Strength)\s*:/);
});

test('ordinary component shadows derive from seasonal primitives without blue-gray leakage', () => {
  assert.doesNotMatch(bible, /rgba\(26,40,63,/);
  assert.match(cssBlock('.fab-card'), /box-shadow:\s*0 1px 8px color-mix\(in srgb, var\(--fg\) 8%, transparent\)/);
  assert.doesNotMatch(cssBlock('html.dark'), /--shadow\s*:/);
});

test('composited ordinary control boundaries and focus indicators meet 3 to 1', () => {
  for (const [season, dark] of seasonModes) {
    const selector = `html[data-season="${season}"]${dark ? '.dark' : ''}`;
    const block = cssBlock(selector);
    const surface = declaration(block, 'surface');
    for (const token of ['border', 'border2']) {
      const finalBoundary = compositeRgba(declaration(block, token), surface);
      assert.ok(contrast(finalBoundary, surface) >= 3, `${selector} --${token} composited on surface is below 3:1`);
    }
    assert.ok(contrast(declaration(block, 'accent'), surface) >= 3, `${selector} focus accent is below 3:1`);
  }
  assert.match(cssBlock('.setting-select'), /border:\s*1px solid var\(--border2\)/);
  assert.match(cssBlock('.floating-nav button'), /border:\s*1px solid var\(--border\)/);
  assert.match(declaration(cssBlock(':root'), 'card-border'), /1px solid var\(--border2\)/);
  assert.match(cssBlock('.setting-select:focus-visible'), /border-color:\s*var\(--accent\)/);
});
