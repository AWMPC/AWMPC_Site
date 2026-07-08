const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');
const seasonalCore = [
  'bg', 'bg2', 'bg3', 'bg4', 'surface', 'surface-hi',
  'fg', 'fg2', 'fg3', 'fg4', 'border', 'border2', 'border3',
  'accent', 'accent-glow', 'accent-fg', 'verse-num', 'selection-fill',
  'note-bg', 'note-border', 'pill-bg'
];
const derived = [
  'verse-bg', 'verse-active-border', 'fab-bg', 'fab-fg',
  'float-nav-bg', 'float-nav-fg', 'float-nav-shadow',
  'card-bg', 'card-border', 'menu-bg', 'menu-shadow', 'hover-bg', 'shadow'
];
const seasonModes = [
  ['spring', false], ['spring', true],
  ['summer', false], ['summer', true],
  ['fall', false], ['fall', true],
  ['winter', false], ['winter', true]
];
const selectionFillModes = [
  [':root', '#e8eff7', '#f4f7fb'],
  ['html.dark', '#05080d', '#111722'],
  ['html[data-season="spring"]', '#e8f3e2', '#f3faef'],
  ['html[data-season="spring"].dark', '#061008', '#101a11'],
  ['html[data-season="summer"]', '#f5edca', '#fff9df'],
  ['html[data-season="summer"].dark', '#100b03', '#1e190d'],
  ['html[data-season="fall"]', '#f6e2d4', '#fff3e8'],
  ['html[data-season="fall"].dark', '#100704', '#22120c'],
  ['html[data-season="winter"]', '#e6f1fa', '#eef7ff'],
  ['html[data-season="winter"].dark', '#040d14', '#0d1b28']
];
const formerLightSurfaces = new Map([
  [':root', '#e2ebf5'],
  ['html[data-season="spring"]', '#deedd7'],
  ['html[data-season="summer"]', '#f0e7bd'],
  ['html[data-season="fall"]', '#f2d8c5'],
  ['html[data-season="winter"]', '#dcecf8']
]);
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

function mixSrgb(foreground, background, foregroundWeight) {
  const backgroundChannels = rgb(background);
  const channels = rgb(foreground).map((channel, index) => (
    Math.round(channel * foregroundWeight + backgroundChannels[index] * (1 - foregroundWeight))
  ));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
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

test('every palette owns its approved background and readable direct selection fill', () => {
  for (const [selector, expectedBackground, expectedFill] of selectionFillModes) {
    const block = cssBlock(selector);
    const background = declaration(block, 'bg');
    const fill = declaration(block, 'selection-fill');
    assert.equal(background, expectedBackground, `${selector} background changed`);
    assert.equal(fill, expectedFill, `${selector} selection fill changed`);
    assert.ok(contrast(declaration(block, 'fg'), background) >= 4.5, `${selector} foreground on reader background is below 4.5:1`);
    assert.ok(contrast(declaration(block, 'fg'), fill) >= 4.5, `${selector} foreground on selection fill is below 4.5:1`);

    if (formerLightSurfaces.has(selector)) {
      assert.ok(luminance(background) > luminance(formerLightSurfaces.get(selector)), `${selector} light surface did not become lighter`);
      assert.ok(luminance(background) < luminance(fill), `${selector} light surface must remain darker than its selection fill`);
    }
    if (selector.endsWith('.dark')) {
      assert.ok(luminance(fill) > luminance(background), `${selector} dark selection fill must be barely lighter than its background`);
      assert.ok(contrast(fill, background) >= 1.08, `${selector} dark selection fill is below 1.08:1 against its background`);
    }
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

test('verses reserve the derived seasonal border for the active selection', () => {
  const root = cssBlock(':root');
  assert.equal(declaration(root, 'verse-highlight'), 'var(--hover-bg)');
  assert.equal(declaration(root, 'verse-active-border'), 'color-mix(in srgb, var(--accent) 60%, var(--selection-fill))');

  const darkModes = selectionFillModes.filter(([mode]) => mode.endsWith('.dark'));
  assert.equal(darkModes.length, 5, 'expected base plus four seasonal dark palettes');
  for (const [selector] of darkModes) {
    const block = cssBlock(selector);
    const fill = declaration(block, 'selection-fill');
    const mixedBorder = mixSrgb(declaration(block, 'accent'), fill, 0.6);
    assert.ok(contrast(mixedBorder, fill) >= 3, `${selector} active border is below 3:1 against its selection fill`);
  }

  const verse = cssBlock('.verse');
  assert.match(verse, /background:\s*transparent/);
  assert.match(verse, /border:\s*1px solid transparent/);

  const active = cssBlock('.verse.active');
  assert.match(active, /background:\s*var\(--selection-fill\)/);
  assert.match(active, /border-color:\s*var\(--verse-active-border\)/);
  assert.doesNotMatch(active, /border-color:\s*var\(--accent\)/);
  assert.match(active, /border-width:\s*1px/);
  assert.doesNotMatch(active, /box-shadow\s*:/);

  const focusVisible = cssBlock('.verse:focus-visible');
  assert.match(focusVisible, /outline:\s*2px solid var\(--verse-active-border\)/);
  assert.match(focusVisible, /outline-offset:\s*2px/);

  const footnotesOpen = cssBlock('.verse.footnotes-open');
  const footnoteDeclarations = [...footnotesOpen.matchAll(/(?:^|;)\s*([\w-]+)\s*:/g)]
    .map((match) => match[1]);
  assert.deepEqual(footnoteDeclarations, ['padding'], 'open footnotes may only change verse padding');

  assert.doesNotMatch(bible, /found-highlight/);
  assert.doesNotMatch(bible, /startVerseFoundTransition|clearVerseHighlightTransition|verseHighlight(?:Target|Frame|CleanupTimer)/);

  const stylesheet = bible.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(stylesheet, 'missing stylesheet');
  const cssRules = [...stylesheet[1].matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const activeVerseRules = cssRules.filter(([, selectorGroup]) => (
    selectorGroup.split(',').some((selector) => /\.verse\.active(?![-\w])/.test(selector.trim()))
  ));
  assert.ok(activeVerseRules.length > 0, 'missing active verse rule');
  for (const [, selectorGroup, body] of activeVerseRules) {
    assert.doesNotMatch(body, /box-shadow\s*:/, `${selectorGroup.trim()} adds an active verse shadow`);
    assert.doesNotMatch(
      body,
      /(?:^|;)\s*border(?:-[\w-]+)?\s*:[^;]*var\(\s*--accent\s*\)[^;]*(?:;|$)/,
      `${selectorGroup.trim()} directly restores the raw accent border`
    );
  }

  const verseRules = cssRules.filter(([, selectorGroup]) => /\.verse(?![-\w])/.test(selectorGroup));
  for (const [, selectorGroup, body] of verseRules) {
    for (const selector of selectorGroup.split(',').map((selector) => selector.trim())) {
      const isActiveVerse = /\.verse\.active(?:[:\s]|$)/.test(selector);
      if (!isActiveVerse) {
        assert.doesNotMatch(body, /box-shadow\s*:/, `${selector} adds a verse shadow`);
      }
      if (!/\.verse:focus-visible(?:\s|$)/.test(selector)) {
        assert.doesNotMatch(body, /outline\s*:/, `${selector} adds a verse outline`);
      }
      if (!isActiveVerse) {
        assert.doesNotMatch(body, /border-color\s*:/, `${selector} overrides the reserved/active border`);
      }
    }
  }
});

test('book and chapter buttons use the selection fill', () => {
  assert.match(cssBlock('.book-btn'), /background:\s*var\(--selection-fill\)/);
  assert.match(bible, /\.chapter-btn \{[\s\S]*?background:\s*var\(--selection-fill\)/);
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
