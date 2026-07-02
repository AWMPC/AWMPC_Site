# Bible Responsive Seasonal UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Bible SPA proportionally compact below 100% Text Scale, fully seasonal, WCAG-reflow safe at 320 CSS pixels, visually consistent in verse emphasis, responsive through two coordinated chrome bars, and unified around quintic smootherstep motion.

**Architecture:** Extend the existing single-file SPA's semantic tokens and pure scale helpers instead of transform-scaling the document or modularizing the app. Separate chapter navigation from application actions in the DOM, drive responsive placement in CSS, and retain one scroll-state/rAF owner in JavaScript. Add focused dependency-free Node tests that execute or inspect production source, plus rendered in-app Browser acceptance.

**Tech Stack:** HTML, CSS custom properties and media queries, browser JavaScript, Node's built-in test/assert modules, JXA parse contracts, and the in-app Browser. No package or runtime dependency is added.

---

## File Structure

- Modify `bible.html`: semantic palettes, geometry tokens, responsive chrome markup/styles, shared motion easing, Text Scale application, clearance measurement, and verse styling.
- Modify `sw.js`: align the cache namespace with the current application version so the changed SPA is served reliably.
- Modify `tests/bible_ui_accessibility.test.js`: remove stale pre-change assertions and preserve broad regression coverage.
- Modify `tests/service_worker_cache.test.js`: align version and successful-response assertions with production behavior.
- Create `tests/bible_motion_system.test.js`: durable shared-easing and reduced-motion contract.
- Create `tests/bible_palette_contrast.test.js`: seasonal ownership, contrast, and verse-emphasis contract.
- Create `tests/bible_ui_scale_reflow.test.js`: shrink-only geometry and 320px reflow contract.
- Create `tests/bible_responsive_chrome.test.js`: responsive DOM, placement, clearance, and synchronized hide/show contract.

### Task 1: Restore a Trustworthy Version and Cache Baseline

**Files:**
- Modify: `sw.js:1`
- Modify: `tests/bible_ui_accessibility.test.js:9`
- Modify: `tests/service_worker_cache.test.js`

- [ ] **Step 1: Update the version tests first**

Replace the stale Bible version assertion with:

```javascript
assert.match(bible, /var APP_VERSION = '3\.2\.0';/);
```

In `tests/service_worker_cache.test.js`, assert the same cache version and accept the production guard's logically equivalent form:

```javascript
assert.match(sw, /const CACHE_NAME = 'bible-v3\.2\.0';/);
assert.match(sw, /response\.type === 'opaque' \|\| response\.status !== 200/);
```

- [ ] **Step 2: Run the two tests and verify RED**

```bash
node --test tests/bible_ui_accessibility.test.js tests/service_worker_cache.test.js
```

Expected: both files fail because the accessibility test still contains old source contracts and `sw.js` still declares `bible-v3.0.0`. Record all failures; Task 1 only fixes the version/cache assertions, while later tasks update the intentionally stale UI contracts.

- [ ] **Step 3: Align the service-worker cache namespace**

At the top of `sw.js`, replace the cache name with:

```javascript
const CACHE_NAME = 'bible-v3.2.0';
```

Do not alter the fetch strategy, cache contents, or failure behavior.

- [ ] **Step 4: Run the focused service-worker test**

```bash
node --test tests/service_worker_cache.test.js
```

Expected: PASS.

- [ ] **Step 5: Verify parsing and whitespace**

```bash
node --check sw.js
git diff --check -- sw.js tests/bible_ui_accessibility.test.js tests/service_worker_cache.test.js
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit the baseline correction**

```bash
git add sw.js tests/bible_ui_accessibility.test.js tests/service_worker_cache.test.js
git commit -S -m "fix: align Bible app cache version"
```

### Task 2: Establish One Quintic Motion System

**Files:**
- Modify: `bible.html:12-1130`
- Create: `tests/bible_motion_system.test.js`
- Modify: `tests/bible_ui_accessibility.test.js`

- [ ] **Step 1: Create the failing durable motion test**

Create `tests/bible_motion_system.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');

test('one quintic easing token owns application motion', () => {
  assert.match(bible, /--motion-ease-fallback: cubic-bezier\(\.64, 0, \.36, 1\);/);
  assert.match(bible, /--motion-ease: var\(--motion-ease-fallback\);/);
  assert.match(bible, /@supports \(transition-timing-function: linear\(0, 1\)\)[\s\S]*--motion-ease: linear\(0, 0\.00856 10%, 0\.05792 20%, 0\.16308 30%, 0\.31744 40%, 0\.5 50%, 0\.68256 60%, 0\.83692 70%, 0\.94208 80%, 0\.99144 90%, 1\);/);
  assert.match(bible, /transition-timing-function: var\(--motion-ease\);/);
  assert.doesNotMatch(bible, /cubic-bezier\((?!\.64, 0, \.36, 1)[^)]+\)/);
  assert.doesNotMatch(bible, /\b(?:ease|ease-in|ease-out|ease-in-out)\b/);
});

test('key animation families use shared easing and reduced motion disables them', () => {
  for (const name of ['press-ripple', 'marquee-mask-breathe', 'marquee-sway', 'loading-skeleton-shimmer']) {
    assert.match(bible, new RegExp(`animation: ${name} [^;]+ var\\(--motion-ease\\)`));
  }
  assert.match(bible, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration: 0\.01ms !important/);
  assert.match(bible, /\.press-ripple \{ animation: none;/);
  assert.match(bible, /\.loading-skeleton span \{ animation: none;/);
});

test('JavaScript smootherstep remains exact', () => {
  const source = bible.match(/function smootherstep\(progress\) \{[\s\S]*?\n  \}/);
  assert.ok(source, 'smootherstep source missing');
  const smootherstep = Function(`${source[0]}; return smootherstep;`)();
  assert.equal(smootherstep(0), 0);
  assert.equal(smootherstep(0.5), 0.5);
  assert.equal(smootherstep(1), 1);
});
```

- [ ] **Step 2: Run the motion test and verify RED**

```bash
node --test tests/bible_motion_system.test.js
```

Expected: FAIL because motion tokens do not exist and the source still contains several easing families.

- [ ] **Step 3: Define the shared easing tokens**

Add to `:root` immediately after the display geometry tokens:

```css
    --motion-ease-fallback: cubic-bezier(.64, 0, .36, 1);
    --motion-ease: var(--motion-ease-fallback);
```

Override the resolved token only when the browser supports CSS `linear()` easing:

```css
  @supports (transition-timing-function: linear(0, 1)) {
    :root {
      --motion-ease: linear(0, 0.00856 10%, 0.05792 20%, 0.16308 30%, 0.31744 40%, 0.5 50%, 0.68256 60%, 0.83692 70%, 0.94208 80%, 0.99144 90%, 1);
    }
  }
```

The sampled values are the exact quintic smootherstep values at 10% intervals. The feature query keeps the fallback valid at computed-value time in browsers without `linear()` support.

- [ ] **Step 4: Route transitions and keyframes through the tokens**

For each transition-bearing selector, preserve its duration and property list but remove inline easing from each property. Consume only the resolved token:

```css
    transition-property: background, border-color, box-shadow, color, transform;
    transition-duration: 180ms, 180ms, 180ms, 180ms, 120ms;
    transition-timing-function: var(--motion-ease);
```

Apply that pattern to buttons, theme transitions, chrome, panels, cards, verses, footnotes, search, dialogs, and chapter/view transitions. Visibility delays remain discrete through `transition-delay`; do not use `linear` as a timing function name outside the shared token.

Rewrite animation shorthands as:

```css
    animation: press-ripple 320ms var(--motion-ease) forwards;
    animation: marquee-mask-breathe 3s var(--motion-ease) infinite alternate;
    animation: marquee-sway 3s var(--motion-ease) infinite alternate;
    animation: loading-skeleton-shimmer 1.1s var(--motion-ease) infinite;
```

- [ ] **Step 5: Update the broad accessibility contracts**

In `tests/bible_ui_accessibility.test.js`, replace assertions that require literal `ease` or old cubic curves with assertions for `var(--motion-ease)` and the feature-query fallback pattern. Remove no unrelated accessibility assertion.

- [ ] **Step 6: Run the motion and existing verse-motion tests**

```bash
node --test tests/bible_motion_system.test.js tests/bible_verse_motion.test.js
```

Expected: 4 tests pass across both files.

- [ ] **Step 7: Verify all retired easing declarations are gone**

```bash
rg -n "cubic-bezier|ease-in-out|ease-in|ease-out|[[:space:]]ease([,;[:space:]]|$)" bible.html
```

Expected: only the single `--motion-ease-fallback` cubic declaration appears. Then run:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check
```

Expected: JavaScript parses and whitespace check exits 0.

- [ ] **Step 8: Commit the motion system**

```bash
git add bible.html tests/bible_motion_system.test.js tests/bible_ui_accessibility.test.js
git commit -S -m "refactor: unify Bible motion easing"
```

### Task 3: Complete Seasonal Ownership and Simplify Verse Emphasis

**Files:**
- Modify: `bible.html:52-186`
- Modify: `bible.html:799-839`
- Create: `tests/bible_palette_contrast.test.js`
- Modify: `tests/bible_ui_accessibility.test.js`

- [ ] **Step 1: Create the failing palette and verse test**

Create `tests/bible_palette_contrast.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');
const seasonalCore = ['bg','bg2','bg3','bg4','surface','surface-hi','fg','fg2','fg3','fg4','border','border2','border3','accent','accent-fg','verse-num','note-bg','note-border','pill-bg'];
const derived = ['verse-bg','verse-active-border','fab-bg','fab-fg','float-nav-bg','float-nav-fg','card-bg','card-border','menu-bg','hover-bg'];
const selectors = ['spring','spring"].dark','summer','summer"].dark','fall','fall"].dark','winter','winter"].dark'];

function blockFor(selector) {
  const pattern = selector.includes('dark')
    ? `html[data-season="${selector} {`
    : `html[data-season="${selector}"] {`;
  const start = bible.indexOf(pattern);
  assert.notEqual(start, -1, `missing ${pattern}`);
  return bible.slice(start, bible.indexOf('\n  }', start) + 4);
}

function rgb(hex) {
  const value = hex.replace('#', '');
  return [0,2,4].map(index => parseInt(value.slice(index,index+2),16));
}
function luminance(hex) {
  return rgb(hex).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum,value,index) => sum + value * [.2126,.7152,.0722][index], 0);
}
function contrast(a,b) {
  const values = [luminance(a),luminance(b)].sort((x,y) => y-x);
  return (values[0]+.05)/(values[1]+.05);
}

test('every seasonal mode owns every palette primitive', () => {
  for (const selector of selectors) {
    const block = blockFor(selector);
    for (const token of seasonalCore) assert.match(block, new RegExp(`--${token}:`), `${selector} missing --${token}`);
  }
});

test('ordinary UI tokens derive only from season-owned primitives', () => {
  const root = bible.slice(bible.indexOf(':root {'), bible.indexOf('\n  }', bible.indexOf(':root {')) + 4);
  for (const token of derived) assert.match(root, new RegExp(`--${token}:`), `missing --${token}`);
  for (const forbidden of ['#0b63ce','#5b9bf4','#8bb9ff']) {
    for (const token of derived) assert.doesNotMatch(root, new RegExp(`--${token}:[^;]*${forbidden}`, 'i'));
  }
});

test('primary text and active boundaries meet WCAG contrast', () => {
  const pairs = [
    ['#18301b','#f3faef','#2f7d32'], ['#ecf7e8','#101b12','#78c96e'],
    ['#352c14','#fff9df','#9a6c10'], ['#fff5ce','#211c0f','#e2bd55'],
    ['#3c2116','#fff3e8','#b94d19'], ['#ffe9d8','#24140e','#ee7b3c'],
    ['#142b3e','#eef7ff','#146fa3'], ['#e9f6ff','#0c1722','#69b9e8']
  ];
  for (const [fg,bg,border] of pairs) {
    assert.ok(contrast(fg,bg) >= 4.5, `${fg} on ${bg}`);
    assert.ok(contrast(border,bg) >= 3, `${border} against ${bg}`);
  }
});

test('all verses have a surface and only active verses gain visible border', () => {
  assert.match(bible, /\.verse \{[\s\S]*background: var\(--verse-bg\);[\s\S]*border: 2px solid transparent/);
  assert.match(bible, /\.verse\.active \{[\s\S]*border-color: var\(--verse-active-border\);[\s\S]*box-shadow: none/);
  assert.doesNotMatch(bible, /\.verse\.active \{[^}]*var\(--accent-glow\)/);
  assert.match(bible, /\.verse:focus-visible \{[\s\S]*outline:/);
});
```

- [ ] **Step 2: Run the test and verify RED**

```bash
node --test tests/bible_palette_contrast.test.js
```

Expected: FAIL because complete ownership and verse tokens do not exist.

- [ ] **Step 3: Complete seasonal primitives and derive every ordinary UI token**

Add explicit border primitives to each seasonal block using these exact declarations:

```css
  html[data-season="spring"] {
    --border: rgba(24,48,27,.14); --border2: rgba(24,48,27,.20); --border3: rgba(24,48,27,.32);
  }
  html[data-season="spring"].dark {
    --border: rgba(236,247,232,.10); --border2: rgba(236,247,232,.16); --border3: rgba(236,247,232,.28);
  }
  html[data-season="summer"] {
    --border: rgba(53,44,20,.14); --border2: rgba(53,44,20,.20); --border3: rgba(53,44,20,.32);
  }
  html[data-season="summer"].dark {
    --border: rgba(255,245,206,.10); --border2: rgba(255,245,206,.16); --border3: rgba(255,245,206,.28);
  }
  html[data-season="fall"] {
    --border: rgba(60,33,22,.14); --border2: rgba(60,33,22,.20); --border3: rgba(60,33,22,.32);
  }
  html[data-season="fall"].dark {
    --border: rgba(255,233,216,.10); --border2: rgba(255,233,216,.16); --border3: rgba(255,233,216,.28);
  }
  html[data-season="winter"] {
    --border: rgba(20,43,62,.14); --border2: rgba(20,43,62,.20); --border3: rgba(20,43,62,.32);
  }
  html[data-season="winter"].dark {
    --border: rgba(233,246,255,.10); --border2: rgba(233,246,255,.16); --border3: rgba(233,246,255,.28);
  }
```

Keep each block's existing season-specific background, foreground, accent, verse-number, note, and pill primitives. Replace the blue-bound ordinary aliases in `:root` and `html.dark` with one shared derived layer in `:root`:

```css
    --verse-bg: var(--bg2);
    --verse-active-border: var(--accent);
    --fab-bg: var(--surface-hi);
    --fab-fg: var(--accent);
    --float-nav-bg: color-mix(in srgb, var(--surface-hi) 92%, transparent);
    --float-nav-fg: var(--fg);
    --float-nav-shadow: 0 8px 22px color-mix(in srgb, var(--fg) 14%, transparent);
    --card-bg: color-mix(in srgb, var(--surface) 90%, var(--bg3));
    --card-border: 1px solid var(--border2);
    --menu-bg: var(--surface-hi);
    --menu-shadow: 0 12px 32px color-mix(in srgb, var(--fg) 18%, transparent);
    --hover-bg: color-mix(in srgb, var(--accent) 10%, transparent);
```

Remove the conflicting `--fab-*`, `--float-nav-*`, `--card-*`, `--menu-*`, and `--hover-bg` declarations from `html.dark`. Because every season/mode owns all primitives used above, ordinary chrome resolves entirely from the active season without duplicating 10 aliases eight times.

- [ ] **Step 4: Replace verse glow with background and border ownership**

Use:

```css
  .verse {
    margin-bottom: var(--verse-margin-bottom);
    font-size: var(--reader-font-size);
    line-height: var(--reader-line-height);
    position: relative;
    border-radius: var(--verse-radius);
    padding: var(--verse-pad-y) var(--verse-pad-x);
    border: 2px solid transparent;
    background: var(--verse-bg);
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .verse.active {
    border-color: var(--verse-active-border);
    box-shadow: none;
  }
  .verse:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
  .verse.active:focus-visible {
    outline: none;
  }
```

Keep transition properties/durations from Task 2. Remove `--verse-glow-*` definitions, `BASE_READER_DETAIL` glow keys, and their `applyTextScale()` writes because active glow no longer exists.

- [ ] **Step 5: Update broad source assertions**

Replace old active-glow and fixed seasonal assertions in `tests/bible_ui_accessibility.test.js` with assertions for `--verse-bg`, `--verse-active-border`, `box-shadow: none`, and complete seasonal blocks. Preserve footnote, focus, pointer, history, and hyperlink assertions.

- [ ] **Step 6: Run palette and existing reader tests**

```bash
node --test tests/bible_palette_contrast.test.js tests/bible_verse_motion.test.js
```

Expected: all tests pass.

- [ ] **Step 7: Verify source health and commit**

```bash
git diff --check
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git add bible.html tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js
git commit -S -m "feat: complete Bible seasonal palettes"
```

Expected: checks pass and the signed commit succeeds.

### Task 4: Scale Ordinary UI Geometry and Guarantee 320px Reflow

**Files:**
- Modify: `bible.html:12-1120`
- Modify: `bible.html:1210-1280`
- Modify: `bible.html:2259-2287`
- Create: `tests/bible_ui_scale_reflow.test.js`
- Modify: `tests/bible_ui_accessibility.test.js`

- [ ] **Step 1: Create the failing UI scale/reflow test**

Create `tests/bible_ui_scale_reflow.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');

test('ordinary UI geometry shrinks only below 100 percent', () => {
  const constants = bible.match(/var BASE_UI_GEOMETRY = \{[\s\S]*?\};/);
  const helper = bible.match(/function uiGeometryForScale\(scale\) \{[\s\S]*?\n  \}/);
  assert.ok(constants && helper, 'UI geometry runtime missing');
  const geometryFor = Function(`${constants[0]}\n${helper[0]}; return uiGeometryForScale;`)();
  const keys = ['controlHeight','iconSize','padY','padX','panelPadding','panelGap','navPadding','radius','gridGap','viewPad'];
  const expected = {
    50:[24,24,4,6,6,4,3,10,4,6], 75:[36,36,6,9,9,6,4.5,15,6,9],
    100:[48,48,8,12,12,8,6,20,8,12], 125:[48,48,8,12,12,8,6,20,8,12], 150:[48,48,8,12,12,8,6,20,8,12]
  };
  for (const scale of Object.keys(expected)) {
    const result = geometryFor(Number(scale));
    assert.deepEqual(keys.map(key => result[key]), expected[scale]);
  }
});

test('Text Scale application writes every ordinary UI variable', () => {
  const names = ['--display-control-height','--display-icon-button-size','--display-control-pad-y','--display-control-pad-x','--display-panel-padding','--display-panel-gap','--display-nav-padding','--ui-radius','--ui-grid-gap','--ui-view-pad'];
  for (const name of names) assert.match(bible, new RegExp(`setProperty\\('${name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}'`));
});

test('all major surfaces are bounded for 320px reflow', () => {
  assert.match(bible, /html, body \{[\s\S]*max-width: 100%;[\s\S]*overflow-x: hidden/);
  for (const selector of ['.search-bar','.search-result','.fab-panel','.bottom-history-menu','.verse','.footnote-body','.selection-card']) {
    assert.match(bible, new RegExp(`${selector.replace('.', '\\\.')}[^}]*max-width: 100%`));
  }
  assert.match(bible, /@media \(max-width: 320px\) \{[\s\S]*min-width: 0;[\s\S]*overflow-wrap: anywhere/);
});
```

- [ ] **Step 2: Run the test and verify RED**

```bash
node --test tests/bible_ui_scale_reflow.test.js
```

Expected: FAIL because the helper and reflow contracts do not exist.

- [ ] **Step 3: Add the pure UI geometry baseline/helper**

After `BASE_READER_DETAIL`, add:

```javascript
  var BASE_UI_GEOMETRY = {
    controlHeight: 48,
    iconSize: 48,
    padY: 8,
    padX: 12,
    panelPadding: 12,
    panelGap: 8,
    navPadding: 6,
    radius: 20,
    gridGap: 8,
    viewPad: 12
  };

  function uiGeometryForScale(scale) {
    var factor = Math.min(scale, 100) / 100;
    var result = {};
    Object.keys(BASE_UI_GEOMETRY).forEach(function (key) {
      result[key] = BASE_UI_GEOMETRY[key] * factor;
    });
    return result;
  }
```

- [ ] **Step 4: Apply every UI geometry token**

In `applyTextScale()`, after reader-detail writes, add:

```javascript
    var uiGeometry = uiGeometryForScale(scale);
    document.documentElement.style.setProperty('--display-control-height', uiGeometry.controlHeight + 'px');
    document.documentElement.style.setProperty('--display-icon-button-size', uiGeometry.iconSize + 'px');
    document.documentElement.style.setProperty('--display-control-pad-y', uiGeometry.padY + 'px');
    document.documentElement.style.setProperty('--display-control-pad-x', uiGeometry.padX + 'px');
    document.documentElement.style.setProperty('--display-panel-padding', uiGeometry.panelPadding + 'px');
    document.documentElement.style.setProperty('--display-panel-gap', uiGeometry.panelGap + 'px');
    document.documentElement.style.setProperty('--display-nav-padding', uiGeometry.navPadding + 'px');
    document.documentElement.style.setProperty('--ui-radius', uiGeometry.radius + 'px');
    document.documentElement.style.setProperty('--ui-grid-gap', uiGeometry.gridGap + 'px');
    document.documentElement.style.setProperty('--ui-view-pad', uiGeometry.viewPad + 'px');
```

Set `--oneui-radius: var(--ui-radius)` and route fixed 8px grid gaps and 12px view/card padding through `--ui-grid-gap` and `--ui-view-pad`. Keep visible 1px borders fixed. The 48px baseline yields a 24×24px control at 50%, so do not permit any interactive control to shrink below `24px` in either dimension; this preserves the WCAG 2.2 Target Size (Minimum) threshold without restoring full-size boxes.

- [ ] **Step 5: Add explicit 320px reflow safeguards**

Add `max-width: 100%`, `min-width: 0`, and `overflow-wrap: anywhere` to the bounded surfaces named by the test. Add:

```css
  html, body { height: 100%; max-width: 100%; overflow-x: hidden; }

  @media (max-width: 320px) {
    .view-inner,
    .selection-card,
    .search-bar,
    .search-result,
    .bottom-history-menu,
    .fab-panel,
    .verse,
    .footnote-body {
      min-width: 0;
      max-width: 100%;
      overflow-wrap: anywhere;
    }
    .search-bar { flex-wrap: wrap; }
    .search-input { flex-basis: 100%; }
  }
```

Do not set desktop scripture columns to 320px. Preserve the existing centered reader measure.

- [ ] **Step 6: Replace stale geometry assertions in the broad test**

Update `tests/bible_ui_accessibility.test.js` to assert the new variables/helper and remove literal fixed padding/radius assertions that contradict shrink-only geometry. Retain minimum-border, focus, reader, footnote, and pointer contracts.

- [ ] **Step 7: Run scale/reflow tests and mutation-check the writes**

```bash
node --test tests/bible_ui_scale_reflow.test.js
```

Expected: PASS. Then run this JXA application harness. It uses explicit `Function` parameter injection, checks all five scales, removes each required `setProperty` call in isolation, and asserts that the corresponding write disappears.

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var constants=s.match(/var TEXT_SCALE_VALUES = \[[\s\S]*?var BASE_UI_GEOMETRY = \{[\s\S]*?\};/); var normalize=s.match(/function normalizeTextScale\(value\) \{[\s\S]*?\n  \}/); var spacing=s.match(/function verseSpacingForScale\(scale\) \{[\s\S]*?\n  \}/); var detail=s.match(/function readerDetailForScale\(scale\) \{[\s\S]*?\n  \}/); var geometry=s.match(/function uiGeometryForScale\(scale\) \{[\s\S]*?\n  \}/); var apply=s.match(/function applyTextScale\(value, persist\) \{[\s\S]*?\n  \}/); ok(constants&&normalize&&spacing&&detail&&geometry&&apply,"Text Scale UI application runtime missing"); var program=[constants[0],normalize[0],spacing[0],detail[0],geometry[0],apply[0]].join("\n"); var names=["--display-control-height","--display-icon-button-size","--display-control-pad-y","--display-control-pad-x","--display-panel-padding","--display-panel-gap","--display-nav-padding","--ui-radius","--ui-grid-gap","--ui-view-pad"]; function execute(source,scale){var writes={};var document={documentElement:{style:{setProperty:function(n,v){writes[n]=v;}}}};var textScaleSelect={value:""};var State={setTextScale:function(){}};function scheduleBottomChromeClearanceUpdate(){}function scheduleMarqueeMeasure(){}var run=Function("document","textScaleSelect","State","scheduleBottomChromeClearanceUpdate","scheduleMarqueeMeasure","scale",source+"\napplyTextScale(scale,false);");run(document,textScaleSelect,State,scheduleBottomChromeClearanceUpdate,scheduleMarqueeMeasure,scale);return writes;} var expected={50:["24px","24px","4px","6px","6px","4px","3px","10px","4px","6px"],75:["36px","36px","6px","9px","9px","6px","4.5px","15px","6px","9px"],100:["48px","48px","8px","12px","12px","8px","6px","20px","8px","12px"],125:["48px","48px","8px","12px","12px","8px","6px","20px","8px","12px"],150:["48px","48px","8px","12px","12px","8px","6px","20px","8px","12px"]};Object.keys(expected).forEach(function(k){var writes=execute(program,Number(k));ok(JSON.stringify(names.map(function(n){return writes[n];}))===JSON.stringify(expected[k]),"UI geometry mismatch at "+k);});var q=String.fromCharCode(39);names.forEach(function(name){var needle="document.documentElement.style.setProperty("+q+name+q;var mutated=program.replace(needle,"void ("+q+name+q);var writes=execute(mutated,50);ok(writes[name]===undefined,"mutation did not remove "+name);});"UI geometry application and mutation contract passes"'
```

Expected: five-scale values and all ten mutations pass under `osascript`.

- [ ] **Step 8: Verify and commit**

```bash
node --check tests/bible_ui_scale_reflow.test.js
git diff --check
git add bible.html tests/bible_ui_scale_reflow.test.js tests/bible_ui_accessibility.test.js
git commit -S -m "feat: scale Bible UI geometry down"
```

### Task 5: Implement Responsive Two-Bar Chrome

**Files:**
- Modify: `bible.html:334-590`
- Modify: `bible.html:1136-1151`
- Modify: `bible.html:1937-2105`
- Create: `tests/bible_responsive_chrome.test.js`
- Modify: `tests/bible_ui_accessibility.test.js`

- [ ] **Step 1: Create the failing responsive chrome test**

Create `tests/bible_responsive_chrome.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');

test('chapter and action chrome are separate semantic groups', () => {
  assert.match(bible, /<div id="bottom-chrome"[\s\S]*<div id="floating-nav"[\s\S]*<div class="action-chrome" id="action-chrome">[\s\S]*<div class="bottom-actions"[\s\S]*id="btn-history"[\s\S]*id="btn-search"[\s\S]*<div class="fab-root">[\s\S]*id="fab-main"/);
});

test('desktop splits bottom-left chapter and bottom-right actions', () => {
  assert.match(bible, /\.floating-nav \{[\s\S]*position: absolute;[\s\S]*left: 0;[\s\S]*bottom: 0/);
  assert.match(bible, /\.action-chrome \{[\s\S]*position: absolute;[\s\S]*right: 0;[\s\S]*bottom: 0/);
});

test('mobile moves chapter navigation to top and splits bottom actions', () => {
  assert.match(bible, /@media \(max-width: 640px\) \{[\s\S]*\.floating-nav \{[\s\S]*top: calc\(8px \+ env\(safe-area-inset-top, 0px\)\);[\s\S]*bottom: auto/);
  assert.match(bible, /\.action-chrome \{[\s\S]*left: 0;[\s\S]*right: 0/);
  assert.match(bible, /\.action-chrome \.fab-root \{ margin-left: auto;/);
});

test('one scroll state hides both responsive bars in the correct directions', () => {
  assert.match(bible, /bottomChrome\.classList\.toggle\('scroll-hidden', hidden\)/);
  assert.match(bible, /\.bottom-chrome\.scroll-hidden \.floating-nav/);
  assert.match(bible, /\.bottom-chrome\.scroll-hidden \.action-chrome/);
  assert.match(bible, /@media \(max-width: 640px\)[\s\S]*scroll-hidden \.floating-nav[\s\S]*translateY\(calc\(-100%/);
});

test('clearance measures both bars and writes top and bottom variables', () => {
  assert.match(bible, /var actionChrome = document\.getElementById\('action-chrome'\);/);
  assert.match(bible, /--top-chrome-clearance/);
  assert.match(bible, /--bottom-chrome-clearance/);
  assert.match(bible, /bottomChromeResizeObserver\.observe\(floatingNav\)/);
  assert.match(bible, /bottomChromeResizeObserver\.observe\(actionChrome\)/);
});
```

- [ ] **Step 2: Run the test and verify RED**

```bash
node --test tests/bible_responsive_chrome.test.js
```

Expected: FAIL because `.action-chrome` and top clearance do not exist.

- [ ] **Step 3: Separate the action group in HTML**

Replace the chrome markup with:

```html
<div class="bottom-chrome" id="bottom-chrome">
  <div id="floating-nav" class="floating-nav hidden" role="navigation" aria-label="Chapter">
    <button type="button" id="fn-prev" aria-label="Previous chapter">←</button>
    <button type="button" class="fn-book" id="fn-book" aria-label="Choose book"></button>
    <button type="button" class="fn-chapter" id="fn-chapter" aria-label="Choose chapter"></button>
    <button type="button" class="fn-verse" id="fn-verse" aria-label="Choose verse"></button>
    <button type="button" id="fn-next" aria-label="Next chapter">→</button>
  </div>
  <div class="action-chrome" id="action-chrome">
    <div class="bottom-actions" aria-label="Quick actions">
      <button class="bottom-action-button" id="btn-history" type="button">History</button>
      <button class="bottom-action-button" id="btn-search" type="button">Search</button>
    </div>
    <div class="fab-root">
      <button type="button" id="fab-main" class="fab-main" aria-label="Menu" aria-expanded="false" aria-controls="fab-panel">☰</button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Implement desktop and mobile placement**

Make `.bottom-chrome` a pointer-transparent fixed viewport layer. Give `.floating-nav` and `.action-chrome` their own seasonal surfaces:

```css
  .bottom-chrome {
    position: fixed;
    inset: 0;
    z-index: 130;
    pointer-events: none;
  }
  .floating-nav,
  .action-chrome {
    position: absolute;
    bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    display: flex;
    align-items: center;
    gap: var(--display-panel-gap);
    padding: var(--display-nav-padding);
    min-height: calc(var(--display-control-height) + (var(--display-nav-padding) * 2));
    background: var(--float-nav-bg);
    border: var(--card-border);
    border-radius: var(--radius-md);
    box-shadow: var(--float-nav-shadow);
    backdrop-filter: var(--hdr-blur);
    pointer-events: auto;
  }
  .floating-nav { left: 12px; }
  .action-chrome { right: 12px; }
  .action-chrome .fab-root { margin-left: auto; }
```

At `max-width: 640px`, use:

```css
  @media (max-width: 640px) {
    .floating-nav {
      top: calc(8px + env(safe-area-inset-top, 0px));
      bottom: auto;
      left: 12px;
      right: 12px;
    }
    .floating-nav .fn-book { flex: 1 1 auto; max-width: none; }
    .action-chrome {
      left: 12px;
      right: 12px;
      bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    }
    .bottom-actions { justify-content: flex-start; }
    .action-chrome .fab-root { margin-left: auto; }
  }
```

- [ ] **Step 5: Synchronize directional hiding**

Keep `setBottomChromeHidden(hidden)` as the single state owner. Add transforms with shared motion easing:

```css
  .bottom-chrome.scroll-hidden .floating-nav,
  .bottom-chrome.scroll-hidden .action-chrome {
    transform: translateY(calc(100% + 18px + env(safe-area-inset-bottom, 0px)));
    opacity: 0;
    pointer-events: none;
  }
  @media (max-width: 640px) {
    .bottom-chrome.scroll-hidden .floating-nav {
      transform: translateY(calc(-100% - 18px - env(safe-area-inset-top, 0px)));
    }
  }
```

Apply transition properties/durations and the Task 2 fallback/token timing functions to each bar. The parent does not transform.

- [ ] **Step 6: Measure top and bottom clearance independently**

Add the DOM reference:

```javascript
  var actionChrome = document.getElementById('action-chrome');
```

Replace `updateBottomChromeClearance()` with:

```javascript
  function updateBottomChromeClearance() {
    if (!floatingNav || !actionChrome) return;
    var mobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
    var navHeight = floatingNav.classList.contains('hidden') ? 0 : floatingNav.offsetHeight;
    var actionHeight = actionChrome.offsetHeight;
    var topClearance = mobile && navHeight ? navHeight + 20 : 0;
    var bottomHeight = mobile ? actionHeight : Math.max(navHeight, actionHeight);
    document.documentElement.style.setProperty('--top-chrome-clearance', Math.ceil(topClearance) + 'px');
    document.documentElement.style.setProperty('--bottom-chrome-clearance', Math.ceil(bottomHeight + 20) + 'px');
  }
```

Observe both bars:

```javascript
    bottomChromeResizeObserver.observe(floatingNav);
    bottomChromeResizeObserver.observe(actionChrome);
```

Use both variables in `.view-inner`:

```css
    padding-top: calc(var(--ui-view-pad) + var(--top-chrome-clearance));
    padding-bottom: calc(var(--ui-view-pad) + var(--bottom-chrome-clearance));
```

Keep history and settings panels anchored above `--bottom-chrome-clearance`.

- [ ] **Step 7: Update broad chrome contracts**

Replace the obsolete single-surface and mobile grid assertions in `tests/bible_ui_accessibility.test.js` with assertions for `.action-chrome`, responsive bar placement, two clearance variables, and retained `aria-label`/button order.

- [ ] **Step 8: Run responsive, accessibility, and motion tests**

```bash
node --test tests/bible_responsive_chrome.test.js tests/bible_motion_system.test.js tests/bible_ui_accessibility.test.js
```

Expected: all tests pass.

- [ ] **Step 9: Verify cleanup and commit**

```bash
git diff --check
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git add bible.html tests/bible_responsive_chrome.test.js tests/bible_ui_accessibility.test.js
git commit -S -m "feat: split Bible responsive navigation"
```

Expected: checks pass and the signed commit succeeds.

### Task 6: Full Verification and Rendered Acceptance

**Files:**
- Verify: `bible.html`, `sw.js`, `tests/*.js`
- Preserve: `.context/`, `.superpowers/`, `IMG_5255.png`, `bible.json`

- [ ] **Step 1: Run the complete dependency-free test suite**

```bash
node --test tests/*.test.js
```

Expected: every test passes; no stale APP_VERSION, service-worker, geometry, palette, motion, or chrome assertion remains.

- [ ] **Step 2: Run source, parse, and repository checks**

```bash
node --check sw.js
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check
git status --short
```

Expected: parsing and whitespace checks pass; tracked worktree is clean after commits; only the four pre-existing untracked user paths remain.

- [ ] **Step 3: Start or reuse the static server and connect the in-app Browser**

```bash
python3 -m http.server 61542
```

The flow under test is: load `http://localhost:61542/bible.html` → enter Matthew 17 → vary Text Scale, season, appearance, viewport, and scrolling → verify proportional geometry, verse emphasis, responsive chrome, reflow, and motion without console errors.

- [ ] **Step 4: Verify all Text Scale values**

At 50%, 75%, 100%, 125%, and 150%, inspect reader, books, chapters, verse picker, search, history, settings, and context dialog.

Expected: text scales at every value; ordinary boxes/gaps/radii/icons shrink proportionally only at 50–75%; 100–150% control geometry stays at the 100% baseline; borders remain crisp; interactive targets remain at least 24×24 CSS pixels; no clipped labels or inaccessible controls.

- [ ] **Step 5: Verify 320px reflow and responsive chrome**

Use 320×568, 390×844, tablet, and default desktop viewports.

Expected:

- document, body, view, results, dialogs, and panels never exceed viewport width;
- mobile chapter bar is at top and action bar at bottom;
- History/Search stay left and hamburger/social stays far right;
- tablet/desktop chapter bar is bottom-left and action bar bottom-right;
- scripture is not covered by either bar;
- downward scroll hides both bars and upward scroll reveals both;
- mobile top bar exits upward, while bottom action bar exits downward;
- resize and rotation recompute clearances without stale gaps.

- [ ] **Step 6: Verify every seasonal light/dark combination**

Inspect Spring, Summer, Fall, and Winter in light and dark modes across navigation, cards, settings, inputs, dialogs, footnotes, search, and history.

Expected: no base blue remains in Spring, Summer, or Fall ordinary UI; Winter retains intentional ice blue; semantic error/search colors remain distinct; computed text, boundary, focus, and active-border contrast meets the thresholds in the spec.

- [ ] **Step 7: Verify verse emphasis and interaction**

Expected:

- all verses show subtle seasonal backgrounds;
- inactive verses show no visible border or shadow;
- active verse shows one border and no glow;
- keyboard and pointer selection produce the same active treatment;
- keyboard focus remains visible on inactive verses without becoming a border;
- found-to-active transition is direct and does not lock interaction;
- short press, long press/context actions, footnotes, hyperlinks, Matthew 17:21, copy, copy link, and share remain functional.

- [ ] **Step 8: Verify motion and cleanup**

Exercise buttons, ripple, panels, dialogs, chapter transitions, search/history navigation, bar hiding, marquee, skeleton, and verse centering.

Expected: motion shares the quintic acceleration/deceleration feel while durations remain appropriate; reduced-motion mode is immediate; retargeting and wheel/touch cancellation work; no repeated frame work remains after completion; console contains no relevant application error or warning.

- [ ] **Step 9: Inspect final diff and signatures**

```bash
git log --show-signature --format='%h %G? %s' -8
git diff 4d774d9..HEAD -- bible.html sw.js tests
git status --short
```

Expected: every feature commit has a Good signature; diff is limited to approved SPA/cache/tests; no dependency, PII, network, or storage change appears; existing untracked user files are untouched.

- [ ] **Step 10: Commit only verification-driven corrections**

If rendered verification exposes a defect, write a focused failing durable test first, make the minimum correction, rerun the full suite and affected browser flow, then create a signed conventional micro-commit. If verification changes no file, do not create an empty commit.

## Final Self-Review Checklist

- [ ] Every approved design requirement maps to a task and an executable or rendered check.
- [ ] Search this plan for incomplete placeholders; none may remain.
- [ ] Confirm `BASE_UI_GEOMETRY`, `uiGeometryForScale`, `actionChrome`, `--top-chrome-clearance`, `--bottom-chrome-clearance`, `--motion-ease`, `--verse-bg`, and `--verse-active-border` use the same names in every task.
- [ ] Confirm no task introduces transform scaling, a new preference, a package, a module split, an API, or PII-bearing data.
- [ ] Confirm commits are signed, conventional, small, and ordered so cache, motion, palette, geometry, and chrome can be reverted independently.
