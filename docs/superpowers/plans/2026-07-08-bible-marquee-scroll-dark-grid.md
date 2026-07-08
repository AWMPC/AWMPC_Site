# Bible Marquee, Reader Chrome, Dark Palette, and Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make overflowing labels fully readable, improve dark reader hierarchy, prevent scripted scrolling from hiding navigation, and snap chapter/verse grids to the largest fitting multiple of three.

**Architecture:** Keep the single-file application structure and add only bounded state and pure helpers. CSS owns marquee phases and grid rendering; JavaScript owns programmatic-scroll provenance and width/scale-aware column calculation; existing Node contract tests execute the extracted production helpers.

**Tech Stack:** Static HTML/CSS/ES5-compatible JavaScript, Node 24 built-in test runner, in-app Browser validation.

**Status:** Executed and verified on 2026-07-08. The unchecked steps below are retained as the historical execution template; completion evidence is recorded in the final task and test output.

---

## File Map

- Modify `bible.html`: palette tokens, marquee keyframes, active verse styling, scroll ownership, pure modulo-three grid calculation, one reusable grid observer, and scale integration.
- Modify `tests/bible_motion_system.test.js`: marquee endpoint-hold regression.
- Modify `tests/bible_palette_contrast.test.js`: dark surface hierarchy and quiet active-border regression.
- Modify `tests/bible_responsive_chrome.test.js`: programmatic-scroll provenance regression.
- Modify `tests/bible_verse_motion.test.js`: verse-chase ownership lifecycle regression.
- Modify `tests/bible_ui_scale_reflow.test.js`: scale scheduling contract.
- Create `tests/bible_selection_grid.test.js`: pure grid arithmetic, CSS consumption, observation, and cleanup contracts.

Commit operations require the user-mandated 1Password signing integration. If that integration is unavailable, leave each verified checkpoint uncommitted and report that limitation; do not bypass signing.

### Task 1: Preserve Both Marquee Endpoints

**Files:**
- Modify: `tests/bible_motion_system.test.js`
- Modify: `bible.html:289-339`

- [ ] **Step 1: Write the failing endpoint-hold test**

Add this test to `tests/bible_motion_system.test.js`:

```js
test('marquee translation holds while each endpoint is fully revealed', () => {
  const sway = css.match(/@keyframes marquee-sway \{([\s\S]*?)\n  \}/);
  assert.ok(sway, 'marquee sway keyframes exist');
  assert.match(sway[1], /0%, 18% \{ transform: translateX\(0\); \}/);
  assert.match(sway[1], /82%, 100% \{ transform: translateX\(calc\(var\(--marquee-distance, 0px\) \* -1\)\); \}/);

  const mask = css.match(/@keyframes marquee-mask-breathe \{([\s\S]*?)\n  \}/);
  assert.ok(mask, 'marquee mask keyframes exist');
  assert.match(mask[1], /0%, 18%[\s\S]*--marquee-left-fade: 0px;/);
  assert.match(mask[1], /82%, 100%[\s\S]*--marquee-right-fade: 0px;/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
mise exec node@24 -- node --test tests/bible_motion_system.test.js
```

Expected: FAIL because `marquee-sway` has only `from` and `to` keyframes.

- [ ] **Step 3: Implement synchronized movement holds**

Replace `@keyframes marquee-sway` in `bible.html` with:

```css
  @keyframes marquee-sway {
    0%, 18% { transform: translateX(0); }
    82%, 100% { transform: translateX(calc(var(--marquee-distance, 0px) * -1)); }
  }
```

Also align only overflowing book-label marquees to the inline start so the button's ordinary centered flex alignment cannot pre-clip the first glyph:

```css
  .floating-nav .fn-book.is-marquee { justify-content: flex-start; }
```

Keep ordinary navigation buttons centered. Extend reduced-motion assertions to require the static left-readable mask and `transform: none`.

- [ ] **Step 4: Verify GREEN**

Run the focused command from Step 2. Expected: all tests in the file pass.

- [ ] **Step 5: Create a signed checkpoint when available**

Stage `bible.html` and `tests/bible_motion_system.test.js`, then use the 1Password signing integration for:

```bash
git commit -S -m "fix: reveal marquee endpoints"
```

### Task 2: Rebalance the Dark Reader Surface and Active Border

**Files:**
- Modify: `tests/bible_palette_contrast.test.js`
- Modify: `tests/bible_ui_accessibility.test.js`
- Modify: `bible.html:53-203`
- Modify: `bible.html:880-902`

- [ ] **Step 1: Change the palette expectations first**

Update the dark backgrounds in `selectionFillModes`:

```js
  ['html.dark', '#05080d', '#111722'],
  ['html[data-season="spring"].dark', '#061008', '#101a11'],
  ['html[data-season="summer"].dark', '#100b03', '#1e190d'],
  ['html[data-season="fall"].dark', '#100704', '#22120c'],
  ['html[data-season="winter"].dark', '#040d14', '#0d1b28']
```

Add `verse-active-border` to `derived`, then replace the active-verse expectations with:

```js
  assert.equal(
    declaration(root, 'verse-active-border'),
    'color-mix(in srgb, var(--accent) 60%, var(--selection-fill))'
  );
  assert.match(active, /background:\s*var\(--selection-fill\)/);
  assert.match(active, /border-color:\s*var\(--verse-active-border\)/);
  assert.doesNotMatch(active, /border-color:\s*var\(--accent\)/);
  assert.doesNotMatch(active, /box-shadow:/);
```

Add an sRGB mixing helper and verify that the derived border reaches 3:1 against every dark active fill:

```js
function mixSrgb(foreground, background, foregroundWeight) {
  const backgroundChannels = rgb(background);
  const channels = rgb(foreground).map((channel, index) => (
    Math.round(channel * foregroundWeight + backgroundChannels[index] * (1 - foregroundWeight))
  ));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

  const darkModes = selectionFillModes.filter(([mode]) => mode.endsWith('.dark'));
  assert.equal(darkModes.length, 5, 'expected base plus four seasonal dark palettes');
  for (const [selector] of darkModes) {
    const block = cssBlock(selector);
    const fill = declaration(block, 'selection-fill');
    const mixedBorder = mixSrgb(declaration(block, 'accent'), fill, 0.6);
    assert.ok(
      contrast(mixedBorder, fill) >= 3,
      `${selector} active border is below 3:1 against its selection fill`
    );
  }
```

Require the keyboard focus treatment in both palette and accessibility contracts:

```js
  assert.match(focusVisible, /outline:\s*2px solid var\(--verse-active-border\)/);
  assert.match(focusVisible, /outline-offset:\s*2px/);
```

Scan every stylesheet rule whose selector group contains `.verse.active`, including pseudo-state and grouped rules. Reject any `box-shadow` and any `border` or `border-*` declaration containing direct `var(--accent)`. Mutation-check this guard with temporary `.verse.active:hover` raw-accent border and shadow declarations, confirm each focused test run fails, and restore each mutation before continuing.

```js
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
```

Inside the dark-mode branch of the surface test, add:

```js
      assert.ok(
        contrast(fill, background) >= 1.08,
        `${selector} active fill is not visibly separated from its background`
      );
```

- [ ] **Step 2: Run palette tests and verify RED**

Run:

```bash
mise exec node@24 -- node --test tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js
```

Expected: FAIL on old background values, the outdated `--verse-active-border`, absent focus outline, raw accent border, and active shadow.

- [ ] **Step 3: Implement the palette and border hierarchy**

In `:root`, add:

```css
    --verse-active-border: color-mix(in srgb, var(--accent) 60%, var(--selection-fill));
```

Set the five dark `--bg` values to the values in Step 1 without changing their approved `--selection-fill` values. Change `.verse.active` to:

```css
  .verse.active {
    background: var(--selection-fill);
    border-color: var(--verse-active-border);
    border-width: 1px;
  }
  .verse:focus-visible {
    outline: 2px solid var(--verse-active-border);
    outline-offset: 2px;
  }
```

- [ ] **Step 4: Verify palette GREEN**

Run the focused palette and accessibility command:

```bash
mise exec node@24 -- node --test tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js
```

Expected: all focused tests pass, including foreground contrast, five dark border/fill contrast checks, focus-visible semantics, and selector-wide no-shadow/raw-accent mutation protection.

- [ ] **Step 5: Create a signed checkpoint when available**

Stage the three files and use 1Password signing for:

```bash
git commit -S -m "fix: soften dark reader selection"
```

### Task 3: Distinguish Scripted Verse Movement from Manual Scroll

**Files:**
- Modify: `tests/bible_responsive_chrome.test.js`
- Modify: `tests/bible_verse_motion.test.js`
- Modify: `bible.html:2094-2103`
- Modify: `bible.html:2216-2234`
- Modify: `bible.html:3478-3534`

- [ ] **Step 1: Write the failing chrome provenance test**

Extend the lifecycle source in `tests/bible_responsive_chrome.test.js` with `var programmaticVerseScroll = false;`, expose `setProgrammatic(value)` and `baseline()`, and add these assertions using the harness's existing frame map:

```js
  lifecycle.setProgrammatic(true);
  viewEl.scrollTop = 40;
  lifecycle.schedule();
  runNextFrame();
  assert.deepEqual(hiddenStates, [], 'scripted movement does not hide chrome');

  lifecycle.setProgrammatic(false);
  viewEl.scrollTop = 56;
  lifecycle.schedule();
  runNextFrame();
  assert.deepEqual(hiddenStates, [true], 'later manual movement still hides chrome');
```

The harness must also expose the synchronized baseline and assert it is `40` after the scripted event.

- [ ] **Step 2: Write failing verse-chase lifecycle assertions**

In `tests/bible_verse_motion.test.js`, include `programmaticVerseScroll` in the extracted program and assert:

```js
assert.equal(state.programmatic(), true, 'ownership starts before visibility correction');
state.finishAnimation();
assert.equal(state.programmatic(), false, 'normal completion releases ownership');
state.start();
state.releaseForManualScroll();
assert.equal(state.programmatic(), false, 'manual interruption releases ownership');
```

For the reduced-motion fixture, call `setVerseChaseTarget(target)` and assert `programmaticVerseScroll === false` after the immediate `scrollTop` write. For a target whose destination differs by less than `0.5`, call `setVerseChaseTarget(target)` and assert the same released state after the exact destination write.

- [ ] **Step 3: Run both focused files and verify RED**

Run:

```bash
mise exec node@24 -- node --test tests/bible_responsive_chrome.test.js tests/bible_verse_motion.test.js
```

Expected: FAIL because production has no programmatic ownership state.

- [ ] **Step 4: Implement bounded ownership helpers**

Add state beside the verse-chase fields:

```js
  var programmaticVerseScroll = false;
```

Add helpers beside the chrome scroll functions:

```js
  function beginProgrammaticVerseScroll() {
    programmaticVerseScroll = true;
    lastViewScrollTop = viewEl.scrollTop;
  }

  function endProgrammaticVerseScroll() {
    programmaticVerseScroll = false;
    lastViewScrollTop = viewEl.scrollTop;
  }
```

At the start of `updateBottomChromeFromScroll`, after reading `nextTop`, add:

```js
    if (programmaticVerseScroll) {
      lastViewScrollTop = nextTop;
      return;
    }
```

Call `beginProgrammaticVerseScroll()` before the first scripted scroll write in `setVerseChaseTarget`. Ensure reduced-motion, sub-pixel, normal completion, `stopVerseChase`, and `releaseVerseChaseForFreeScroll` all call `endProgrammaticVerseScroll()` after their final scripted write. Keep helpers idempotent so repeated cleanup is harmless.

- [ ] **Step 5: Verify scroll GREEN**

Run the focused command from Step 3. Expected: both files pass and manual-scroll expectations remain unchanged.

- [ ] **Step 6: Create a signed checkpoint when available**

Stage the three files and use 1Password signing for:

```bash
git commit -S -m "fix: keep chrome visible during verse positioning"
```

### Task 4: Snap Selection Grids to the Largest Fitting Multiple of Three

**Files:**
- Create: `tests/bible_selection_grid.test.js`
- Modify: `tests/bible_ui_scale_reflow.test.js`
- Modify: `bible.html:49-52`
- Modify: `bible.html:860-877`
- Modify: `bible.html:1360-1380`
- Modify: `bible.html:2094-2110`
- Modify: `bible.html:2388-2433`
- Modify: `bible.html:4000-4100`

- [ ] **Step 1: Create the failing pure arithmetic tests**

Create `tests/bible_selection_grid.test.js` with the standard `node:test`, `assert`, `fs`, and `path` imports used by the suite. Extract `selectionGridColumnCount` from `bible.html` and test:

```js
test('selection grid snaps to the largest fitting multiple of three', () => {
  const columnsFor = productionFunction('selectionGridColumnCount');
  assert.equal(columnsFor(320, 58, 8), 3);
  assert.equal(columnsFor(388, 58, 8), 6);
  assert.equal(columnsFor(586, 58, 8), 9);
  assert.equal(columnsFor(784, 58, 8), 12);
  for (const width of [0, 1, 160, 320, 388, 586, 784, 960]) {
    const columns = columnsFor(width, 58, 8);
    assert.ok(columns >= 3);
    assert.equal(columns % 3, 0);
  }
});

test('selection grid reacts to scaled minimum width and gap', () => {
  const columnsFor = productionFunction('selectionGridColumnCount');
  assert.equal(columnsFor(500, 87, 8), 3);
  assert.equal(columnsFor(500, 58, 8), 6);
  assert.equal(columnsFor(500, 43.5, 6), 9);
  assert.equal(columnsFor(500, 29, 4), 15);
});
```

Use the exact formula `(availableWidth + gap) / (minimumCellWidth + gap)` and correct boundary values if integer arithmetic proves a listed width is one pixel short; the invariant is the specification, not the illustrative boundary number.

- [ ] **Step 2: Add failing structure and cleanup tests**

In the same file, assert both grid rules use:

```css
grid-template-columns: repeat(var(--selection-grid-columns), minmax(0, 1fr));
```

Extract `observeSelectionGrid` and test one observer instance observes the current grid, disconnects before retargeting, and calls the layout function. Assert the no-`ResizeObserver` fallback still schedules one layout calculation.

In `tests/bible_ui_scale_reflow.test.js`, pass `scheduleSelectionGridLayout` into `executeApplication` and assert `applyTextScale` calls it once after writing scale variables.

- [ ] **Step 3: Run grid tests and verify RED**

Run:

```bash
mise exec node@24 -- node --test tests/bible_selection_grid.test.js tests/bible_ui_scale_reflow.test.js
```

Expected: FAIL because the helper, custom property, observer, cleanup, and scale scheduling do not exist.

- [ ] **Step 4: Add grid CSS and pure calculations**

Add the root default:

```css
    --selection-grid-columns: 3;
```

Change both grid declarations to:

```css
    grid-template-columns: repeat(var(--selection-grid-columns), minmax(0, 1fr));
```

Add a scale-aware selection baseline beside `BASE_UI_GEOMETRY`:

```js
  var BASE_SELECTION_CELL_WIDTH = 58;

  function selectionCellWidthForScale(scale) {
    return BASE_SELECTION_CELL_WIDTH * scale / 100;
  }
```

Add the pure helper:

```js
  function selectionGridColumnCount(availableWidth, minimumCellWidth, gap) {
    var width = Number(availableWidth);
    var cell = Number(minimumCellWidth);
    var spacing = Number(gap);
    if (!isFinite(width) || width < 0) width = 0;
    if (!isFinite(cell) || cell <= 0) cell = 58;
    if (!isFinite(spacing) || spacing < 0) spacing = 0;
    var raw = Math.floor((width + spacing) / (cell + spacing));
    return Math.max(3, Math.floor(raw / 3) * 3);
  }
```

- [ ] **Step 5: Add one reusable observer and coalesced writer**

Add tracked state:

```js
  var selectionGridResizeObserver = null;
  var selectionGridFrame = null;
  var selectionGridScale = DEFAULT_TEXT_SCALE;
```

Implement `disconnectSelectionGrid`, `updateSelectionGridLayout`, `scheduleSelectionGridLayout`, and `observeSelectionGrid`. The writer must read the current `.chapter-grid,.verse-grid`, its `clientWidth`, the computed `--ui-grid-gap`, and `selectionCellWidthForScale(selectionGridScale)`; it then sets `--selection-grid-columns` on that grid only. The scheduler must allow at most one pending animation frame. The disconnect helper must disconnect the observer and cancel the pending frame.

Call `disconnectSelectionGrid()` before each view clears `viewInner`. After appending a chapter or verse grid, call `observeSelectionGrid(grid)`. In `applyTextScale`, set `selectionGridScale = scale` and call `scheduleSelectionGridLayout()` after all geometry writes.

- [ ] **Step 6: Verify grid GREEN**

Run the focused command from Step 3. Expected: both files pass, including observer cleanup and scale transitions.

- [ ] **Step 7: Create a signed checkpoint when available**

Stage the three files and use 1Password signing for:

```bash
git commit -S -m "feat: snap Bible pickers to mod-three columns"
```

### Task 5: Full Automated and Rendered Verification

**Files:**
- Verify: `bible.html`
- Verify: `tests/*.test.js`

- [ ] **Step 1: Run the complete Node suite**

Run:

```bash
mise exec node@24 -- node --test tests/*.test.js
```

Expected: exit 0, no failures, no warnings introduced by the changes.

- [ ] **Step 2: Run static hygiene checks**

Run:

```bash
git diff --check
rg -n "innerHTML|insertAdjacentHTML|eval\(|new Function" bible.html
```

Expected: `git diff --check` exits 0. The sink inventory does not gain a new occurrence in the edited paths.

- [ ] **Step 3: Start the existing local server**

Run this local-only server and retain its session ID. Do not run `static.sh`, which downloads production pages, and do not install dependencies.

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

- [ ] **Step 4: Validate with the in-app Browser**

Test this flow at a desktop viewport and a 320px-wide mobile viewport:

```text
bible.html loads -> choose 1 Thessalonians -> overflow label holds full first and last glyphs
-> enter a chapter -> click Next Chapter twice at an ordinary cadence
-> bottom navigation remains visible during scripted centering
-> manually scroll downward -> bottom navigation hides
-> switch among 50%, 100%, and 150% scale and resize viewport
-> chapter and verse grid column counts remain divisible by three
-> enable dark mode -> default reader surface is visibly darker than active verse and border is subdued
```

Check page identity, meaningful DOM, no framework/error overlay, no relevant console warnings/errors, screenshots, and state changes after each interaction.

- [ ] **Step 5: Inspect resource cleanup**

Navigate repeatedly among books, chapters, verse picker, and reader. Confirm there is only one live selection-grid observer target and no increasing queue of animation-frame callbacks or scroll listeners.

- [ ] **Step 6: Review the final diff against the approved spec**

Confirm all four requested behaviors, reduced-motion preservation, foreground contrast, manual scroll behavior, modulo-three width/scale transitions, PII safety, and observer/frame cleanup. Report any unverified browser or viewport limitation explicitly.
