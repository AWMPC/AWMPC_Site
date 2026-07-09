# Bible Sheet Desktop and Trackpad Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Bible sheets content-sized, side-anchored desktop geometry and polished motion; add deliberate horizontal trackpad navigation; and correct the remaining mobile search, handle, fade, spacing, and launcher-state defects.

**Architecture:** Extend the existing generation-safe app-sheet controller in `bible.html`. Keep geometry and wheel decisions in the existing pure-helper region, keep all sheet renderers behind the trusted descriptor registry, route selector paging through `setSelectionPage()`, and route reader paging through `showAdjacentChapter()` so canonical cross-book navigation, URL state, persistence, and programmatic scroll suppression stay unified.

**Tech Stack:** Static HTML/CSS/JavaScript, native `<dialog>`, Pointer/Touch/Wheel Events, `ResizeObserver`, `visualViewport`, Node.js built-in test runner, `node:assert`, and VM-extracted pure-function harnesses.

---

## File Structure

- Modify `bible.html`: sheet CSS, pure geometry/wheel helpers, controller lifecycle, selector wheel integration, reader wheel integration, mobile Search fullscreen ownership, and launcher hover behavior.
- Modify `tests/bible_sheet_controller.test.js`: trusted descriptor, dimensions, anchors, lifecycle phases, motion timers, launcher cleanup, Search viewport ownership, and leak assertions.
- Create `tests/bible_trackpad_navigation.test.js`: pure wheel normalization/burst tests plus selector-versus-reader routing and canonical chapter-boundary tests.
- Modify `tests/bible_selection_sheet.test.js`: selector wheel listener lifecycle, stable panel width, Tonal Float, grab bar, padding, and focus behavior.
- Modify `tests/bible_sheet_overflow_fade.test.js`: fade placement directly above the handle and boundary-driven visibility.
- Modify `tests/bible_motion_system.test.js`: 280ms open/close, 320ms maximize/restore, one easing token, and reduced-motion behavior.
- Modify `tests/bible_responsive_chrome.test.js`: `50vw` desktop cap, launcher-side anchoring, mobile full width, and coarse-pointer hover rules.
- Modify `tests/bible_sheet_content_behavior.test.js`: Search focus-to-fullscreen latch, keyboard viewport changes, generation rejection, and cleanup.
- Modify `tests/bible_verse_motion.test.js`: horizontal chapter navigation uses the existing programmatic scroll ownership and never hides chrome.

Do not split `bible.html` during this change. The repository intentionally keeps this application self-contained, and an architectural extraction would make rollback and regression analysis harder.

### Task 1: Pure Desktop Geometry and Wheel Decisions

**Files:**
- Modify: `bible.html:2308-2452`
- Modify: `tests/bible_sheet_controller.test.js:104-170`
- Create: `tests/bible_trackpad_navigation.test.js`

- [ ] **Step 1: Write failing pure-helper tests for desktop width and anchor resolution**

Extend the `hooks` object in `tests/bible_sheet_controller.test.js` with `width` and `anchor`, then add:

```js
assert.equal(h.width(180, 40, 1200, 220, 24, false), 220,
  'narrow content respects the project minimum');
assert.equal(h.width(420, 40, 1200, 220, 24, false), 460,
  'intrinsic content includes inline chrome once');
assert.equal(h.width(900, 40, 1200, 220, 24, false), 600,
  'desktop sheet never exceeds half the viewport');
assert.equal(h.width(120, 40, 1200, 220, 24, true), 600,
  'trusted panel-filling content receives the full half viewport');
assert.equal(h.width(Infinity, 40, 1200, 220, 24, false), null);
assert.equal(h.anchor(0, 80, 1200), 'left');
assert.equal(h.anchor(560, 80, 1200), 'right', 'midpoint ties resolve right');
assert.equal(h.anchor(900, 80, 1200), 'right');
assert.equal(h.anchor(0, 80, 0), null);
```

- [ ] **Step 2: Write failing wheel normalization and claim tests**

Create `tests/bible_trackpad_navigation.test.js` with the same pure-helper extraction pattern used by `bible_sheet_controller.test.js`:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');
const start = bible.indexOf('/* APP SHEET PURE HELPERS START */');
const end = bible.indexOf('/* APP SHEET PURE HELPERS END */');
assert.ok(start >= 0 && end > start);
const context = { Math };
vm.runInNewContext(bible.slice(start, end) + `
this.wheel = {
  normalize: normalizeBibleWheelDelta,
  direction: bibleWheelClaimDirection,
  constants: [BIBLE_WHEEL_AXIS_RATIO, BIBLE_WHEEL_ACTIVATION_PX,
    BIBLE_WHEEL_IDLE_MS, BIBLE_WHEEL_LINE_PX, BIBLE_WHEEL_MAX_EVENT_PX]
};`, context);

assert.deepEqual(Array.from(context.wheel.constants), [1.25, 48, 160, 16, 120]);
assert.equal(context.wheel.normalize(3, 0, 1000), 3);
assert.equal(context.wheel.normalize(3, 1, 1000), 48);
assert.equal(context.wheel.normalize(1, 2, 1000), 120);
assert.equal(context.wheel.normalize(-20, 0, 1000), -20);
assert.equal(context.wheel.normalize(Infinity, 0, 1000), null);
assert.equal(context.wheel.normalize(20, 9, 1000), null);
assert.equal(context.wheel.direction(48, 0), 1);
assert.equal(context.wheel.direction(-48, 0), -1);
assert.equal(context.wheel.direction(47.999, 0), 0);
assert.equal(context.wheel.direction(60, 50), 0, 'diagonal movement stays native');
assert.equal(context.wheel.direction(62.5, 50), 1, 'exact dominance ratio qualifies');
```

- [ ] **Step 3: Run the tests and confirm the helpers are missing**

Run:

```bash
node --test tests/bible_sheet_controller.test.js tests/bible_trackpad_navigation.test.js
```

Expected: FAIL because `appSheetDeterminedWidth`, `appSheetHorizontalAnchor`, `normalizeBibleWheelDelta`, and `bibleWheelClaimDirection` do not exist.

- [ ] **Step 4: Add the finite pure helpers and named constants**

Add inside `/* APP SHEET PURE HELPERS START */`:

```js
  var APP_SHEET_ANCHORS = ['left', 'right'];
  var BIBLE_WHEEL_AXIS_RATIO = 1.25;
  var BIBLE_WHEEL_ACTIVATION_PX = 48;
  var BIBLE_WHEEL_IDLE_MS = 160;
  var BIBLE_WHEEL_LINE_PX = 16;
  var BIBLE_WHEEL_MAX_EVENT_PX = 120;

  function isValidAppSheetAnchor(value) {
    return appSheetEnumHas(APP_SHEET_ANCHORS, value);
  }

  function appSheetDeterminedWidth(contentWidth, chromeWidth, viewportWidth,
      minimumWidth, gutterWidth, fillsPanel) {
    var values = [contentWidth, chromeWidth, viewportWidth, minimumWidth, gutterWidth];
    for (var i = 0; i < values.length; i++) {
      if (!isFiniteAppSheetNumber(values[i]) || values[i] < 0) return null;
    }
    if (viewportWidth <= 0 || minimumWidth <= 0 || typeof fillsPanel !== 'boolean') return null;
    var maximum = Math.floor(Math.min(viewportWidth * .5, viewportWidth - gutterWidth));
    if (maximum < minimumWidth) return maximum > 0 ? maximum : null;
    return Math.ceil(Math.max(minimumWidth,
      Math.min(fillsPanel ? maximum : contentWidth + chromeWidth, maximum)));
  }

  function appSheetHorizontalAnchor(openerLeft, openerWidth, viewportWidth) {
    if (!isFiniteAppSheetNumber(openerLeft) || !isFiniteAppSheetNumber(openerWidth) ||
        openerWidth < 0 || !isFiniteAppSheetNumber(viewportWidth) || viewportWidth <= 0) return null;
    return openerLeft + (openerWidth / 2) < viewportWidth / 2 ? 'left' : 'right';
  }

  function normalizeBibleWheelDelta(value, mode, viewportWidth) {
    if (!isFiniteAppSheetNumber(value) || !Number.isInteger(mode) || mode < 0 || mode > 2 ||
        !isFiniteAppSheetNumber(viewportWidth) || viewportWidth <= 0) return null;
    var pixels = mode === 1 ? value * BIBLE_WHEEL_LINE_PX :
      (mode === 2 ? value * viewportWidth : value);
    return Math.max(-BIBLE_WHEEL_MAX_EVENT_PX, Math.min(BIBLE_WHEEL_MAX_EVENT_PX, pixels));
  }

  function bibleWheelClaimDirection(deltaX, deltaY) {
    if (!isFiniteAppSheetNumber(deltaX) || !isFiniteAppSheetNumber(deltaY)) return 0;
    if (Math.abs(deltaX) < BIBLE_WHEEL_ACTIVATION_PX ||
        Math.abs(deltaX) < Math.abs(deltaY) * BIBLE_WHEEL_AXIS_RATIO) return 0;
    return deltaX > 0 ? 1 : -1;
  }
```

- [ ] **Step 5: Run the targeted tests and commit**

Run:

```bash
node --test tests/bible_sheet_controller.test.js tests/bible_trackpad_navigation.test.js
```

Expected: PASS.

Commit:

```bash
git add bible.html tests/bible_sheet_controller.test.js tests/bible_trackpad_navigation.test.js
git commit -S -m "test: define bible sheet geometry gestures"
```

### Task 2: Measured Desktop Width and Immutable Side Anchor

**Files:**
- Modify: `bible.html:1034-1065`
- Modify: `bible.html:2455-2664`
- Modify: `bible.html:2841-2880`
- Modify: `bible.html:2983-3055`
- Modify: `tests/bible_sheet_controller.test.js`
- Modify: `tests/bible_responsive_chrome.test.js`
- Modify: `tests/bible_selection_grid.test.js`
- Modify: `tests/bible_ui_scale_reflow.test.js`

- [ ] **Step 1: Write failing controller and CSS contract tests**

Add assertions that the trusted descriptor owns panel filling, state owns anchor/width, and CSS uses the measured variable:

```js
assert.match(bible, /registerAppSheetDescriptor\('selection',[\s\S]*fillsPanel:\s*true/);
assert.match(bible, /anchor:\s*'right'/);
assert.match(bible, /determinedWidth:\s*0/);
assert.match(bible, /--sheet-width/);
assert.match(bible, /\.app-sheet\.inline-left/);
assert.match(bible, /\.app-sheet\.inline-right/);
assert.match(bible, /@media \(min-width:\s*641px\)[\s\S]*max-width:\s*50vw/);
assert.match(bible, /@media \(max-width:\s*640px\)[\s\S]*\.app-sheet[\s\S]*width:\s*100%/);
assert.doesNotMatch(controllerFunction('openAppSheet'), /options\.fillsPanel/,
  'caller state cannot opt into panel-filling geometry');
```

Add a controller harness whose opener rectangles are `{left: 20, width: 80}` and `{left: 1100, width: 80}` in a 1200px viewport. Assert the applied classes remain unchanged after `setSheetSnap('fullscreen')` and `setSheetSnap('determined')`.

In `tests/bible_ui_scale_reflow.test.js`, assert that desktop sheet width remains expressed through `--sheet-width` with a `50vw` maximum, while the mobile media rule returns to `width: 100%`; this prevents text-scale rules from reintroducing a fixed pixel width.

- [ ] **Step 2: Run the geometry tests and confirm they fail**

Run:

```bash
node --test tests/bible_sheet_controller.test.js tests/bible_responsive_chrome.test.js tests/bible_selection_grid.test.js tests/bible_ui_scale_reflow.test.js
```

Expected: FAIL because desktop width, descriptor metadata, and inline anchor classes are absent.

- [ ] **Step 3: Extend the trusted descriptor and dimension measurement**

Change registry storage so only static descriptors can set `fillsPanel`:

```js
  function registerAppSheetDescriptor(kind, descriptor) {
    if (!isValidAppSheetKind(kind) || !descriptor || typeof descriptor.title !== 'string' ||
        !descriptor.title || typeof descriptor.render !== 'function') return false;
    var existing = appSheetDescriptors[kind];
    var label = typeof descriptor.label === 'string' && descriptor.label ? descriptor.label :
      existing && existing.label;
    if (!label) return false;
    appSheetDescriptors[kind] = {
      label: label,
      title: descriptor.title,
      render: descriptor.render,
      fillsPanel: descriptor.fillsPanel === true
    };
    return true;
  }
```

Set `fillsPanel: true` only on the static `selection` registration. Add `anchor: 'right'` and `determinedWidth: 0` to `appSheetState`.

Replace height-only measurement with a finite dimensions result:

```js
  function measureAppSheetContent(generation) {
    if (!isCurrentAppSheetGeneration(generation) || appSheetState.phase !== 'idle' ||
        appSheetState.snap !== 'determined' || appSheetState.pointer) return null;
    var source = currentAppSheetMeasurementSource();
    var contentHeight = source && source.scrollHeight;
    var contentWidth = source && source.scrollWidth;
    var bodyStyle = getComputedStyle(appSheetBody);
    var sheetStyle = getComputedStyle(appSheet);
    var handleHeight = appSheetOuterBlockSize(appSheetHandle);
    var blockStart = appSheetPixelValue(bodyStyle.paddingBlockStart);
    var blockEnd = appSheetPixelValue(bodyStyle.paddingBlockEnd);
    var inlineStart = appSheetPixelValue(bodyStyle.paddingInlineStart);
    var inlineEnd = appSheetPixelValue(bodyStyle.paddingInlineEnd);
    var borderStart = appSheetPixelValue(sheetStyle.borderInlineStartWidth);
    var borderEnd = appSheetPixelValue(sheetStyle.borderInlineEndWidth);
    var values = [contentHeight, contentWidth, handleHeight, blockStart, blockEnd,
      inlineStart, inlineEnd, borderStart, borderEnd];
    for (var i = 0; i < values.length; i++) {
      if (!isFiniteAppSheetNumber(values[i]) || values[i] < 0) return null;
    }
    var blockChrome = handleHeight + blockStart + blockEnd;
    var inlineChrome = inlineStart + inlineEnd + borderStart + borderEnd;
    var height = appSheetDeterminedHeight(contentHeight, blockChrome, appSheetViewportHeight());
    var descriptor = resolveAppSheetDescriptor(appSheetState.kind);
    var width = appSheetDeterminedWidth(contentWidth, inlineChrome, window.innerWidth,
      220, 24, !!(descriptor && descriptor.fillsPanel));
    return height === null || width === null ? null : { height: height, width: width };
  }
```

Preserve the existing selector panel padding and Tonal Float height additions in `blockChrome` before returning. In the measurement frame, update `--sheet-height` and `--sheet-width` only when each rounded value changes.

- [ ] **Step 4: Capture and preserve the opener-side anchor**

Before `showModal()` in `openAppSheet()`, resolve the effective opener and capture its rectangle:

```js
    var effectiveOpener = !wasOpen ? (options.opener || document.activeElement) :
      (options.opener || appSheetState.opener);
    if (!wasOpen || options.opener) {
      var openerRect = effectiveOpener && typeof effectiveOpener.getBoundingClientRect === 'function' ?
        effectiveOpener.getBoundingClientRect() : null;
      var anchor = openerRect && appSheetHorizontalAnchor(openerRect.left, openerRect.width, window.innerWidth);
      appSheetState.anchor = anchor || 'right';
    }
    appSheet.classList.toggle('inline-left', appSheetState.anchor === 'left');
    appSheet.classList.toggle('inline-right', appSheetState.anchor === 'right');
```

Reset the anchor to `right`, clear `determinedWidth`, remove `--sheet-width`, and remove both anchor classes in `resetAppSheetState()`. Do not touch the anchor in `setSheetSnap()`.

Add desktop/mobile CSS:

```css
  @media (min-width: 641px) {
    .app-sheet { width: var(--sheet-width, 50vw); max-width: 50vw; }
    .app-sheet.inline-left { margin-left: 0; margin-right: auto; }
    .app-sheet.inline-right { margin-left: auto; margin-right: 0; }
    .app-sheet.snap-fullscreen { width: 100vw; max-width: none; }
  }
  @media (max-width: 640px) {
    .app-sheet { width: 100%; max-width: none; margin-left: 0; margin-right: 0; }
  }
```

Keep the vertical top/bottom margins in the existing edge rules; the final four-value margin declarations must combine vertical edge and horizontal anchor without browser-default centering.

- [ ] **Step 5: Run geometry and grid tests, then commit**

Run:

```bash
node --test tests/bible_sheet_controller.test.js tests/bible_responsive_chrome.test.js tests/bible_selection_grid.test.js tests/bible_ui_scale_reflow.test.js
```

Expected: PASS, including stable `50vw` selector width and unchanged modulo-three grid behavior.

Commit:

```bash
git add bible.html tests/bible_sheet_controller.test.js tests/bible_responsive_chrome.test.js tests/bible_selection_grid.test.js tests/bible_ui_scale_reflow.test.js
git commit -S -m "feat: anchor desktop bible sheets"
```

### Task 3: Anchored Edge-Glide Motion and Interruption Safety

**Files:**
- Modify: `bible.html:1034-1074`
- Modify: `bible.html:2455-2487`
- Modify: `bible.html:2740-2970`
- Modify: `bible.html:3012-3079`
- Modify: `tests/bible_motion_system.test.js`
- Modify: `tests/bible_sheet_controller.test.js`

- [ ] **Step 1: Write failing motion-token and lifecycle tests**

Add:

```js
assert.match(css, /--sheet-open-close-duration:\s*280ms;/);
assert.match(css, /--sheet-resize-duration:\s*320ms;/);
assert.match(css, /\.app-sheet\.is-preparing/);
assert.match(css, /\.app-sheet\.is-opening/);
assert.match(css, /transform-origin:\s*var\(--sheet-inline-origin\) var\(--sheet-block-origin\);/);
assert.match(reducedMotion, /\.app-sheet[\s\S]*transition-duration:\s*0s/);
assert.match(controllerFunction('setSheetSnap'), /APP_SHEET_RESIZE_MS/);
assert.match(controllerFunction('requestCloseAppSheet'), /APP_SHEET_OPEN_CLOSE_MS/);
```

Extend the controller harness to interrupt an opening with close, replace an opening kind, and fire an old animation callback. Assert the stale callback does not change `phase`, focus, classes, or inline variables belonging to the new generation.

- [ ] **Step 2: Run the targeted motion tests and confirm failure**

Run:

```bash
node --test tests/bible_motion_system.test.js tests/bible_sheet_controller.test.js
```

Expected: FAIL because open motion and the approved duration tokens are not implemented.

- [ ] **Step 3: Add motion ownership and the pre-paint opening sequence**

Add controller constants and state:

```js
  var APP_SHEET_OPEN_CLOSE_MS = 280;
  var APP_SHEET_RESIZE_MS = 320;
```

```js
    openFrame: null,
    openFrame2: null,
```

Add complete frame cleanup and opening helpers:

```js
  function clearAppSheetOpenFrames() {
    if (appSheetState.openFrame !== null) cancelAnimationFrame(appSheetState.openFrame);
    if (appSheetState.openFrame2 !== null) cancelAnimationFrame(appSheetState.openFrame2);
    appSheetState.openFrame = null;
    appSheetState.openFrame2 = null;
  }

  function startAppSheetOpenMotion(generation) {
    clearAppSheetOpenFrames();
    if (!isCurrentAppSheetGeneration(generation)) return false;
    if (shouldReduceVerseMotion()) {
      appSheet.classList.remove('is-preparing', 'is-opening');
      return true;
    }
    appSheet.classList.add('is-preparing', 'is-opening');
    appSheetState.openFrame = requestAnimationFrame(function () {
      appSheetState.openFrame = null;
      if (!isCurrentAppSheetGeneration(generation)) return;
      appSheet.classList.remove('is-preparing');
      appSheetState.openFrame2 = requestAnimationFrame(function () {
        appSheetState.openFrame2 = null;
        if (!isCurrentAppSheetGeneration(generation)) return;
        appSheet.classList.remove('is-opening');
      });
    });
    return true;
  }
```

Apply the preparing/opening classes before `showModal()`, perform the first synchronous dimensions read while visibility is hidden, then call `startAppSheetOpenMotion(generation)`. Clear both frames during close, reset, replacement, and failed `showModal()`.

- [ ] **Step 4: Align CSS and settle fallbacks with the selected motion**

Use:

```css
  .app-sheet {
    --sheet-open-close-duration: 280ms;
    --sheet-resize-duration: 320ms;
    --sheet-inline-origin: right;
    --sheet-block-origin: bottom;
    transform-origin: var(--sheet-inline-origin) var(--sheet-block-origin);
    transition-property: width, height, transform, opacity;
    transition-duration: var(--sheet-resize-duration), var(--sheet-resize-duration),
      var(--sheet-open-close-duration), var(--sheet-open-close-duration);
    transition-timing-function: var(--motion-ease);
  }
  .app-sheet.inline-left { --sheet-inline-origin: left; }
  .app-sheet.edge-top { --sheet-block-origin: top; }
  .app-sheet.is-preparing { visibility: hidden; transition-duration: 0s; }
  .app-sheet.is-opening.edge-bottom { transform: translateY(100%); }
  .app-sheet.is-opening.edge-top { transform: translateY(-100%); }
  .app-sheet.is-closing { pointer-events: none; }
```

Keep live dragging transition-free. Replace the 260ms `setSheetSnap()` fallback with `APP_SHEET_RESIZE_MS` and the 200/260ms close fallbacks with `APP_SHEET_OPEN_CLOSE_MS`. The backdrop uses the paired sheet duration. Reduced motion performs cleanup synchronously and creates no fallback timer.

- [ ] **Step 5: Run motion/controller tests and commit**

Run:

```bash
node --test tests/bible_motion_system.test.js tests/bible_sheet_controller.test.js
```

Expected: PASS.

Commit:

```bash
git add bible.html tests/bible_motion_system.test.js tests/bible_sheet_controller.test.js
git commit -S -m "feat: animate bible sheet lifecycle"
```

### Task 4: Mobile Handle, Fade, Top Inset, and Launcher Highlight

**Files:**
- Modify: `bible.html:388-398`
- Modify: `bible.html:445-455`
- Modify: `bible.html:575-586`
- Modify: `bible.html:1075-1168`
- Modify: `tests/bible_selection_sheet.test.js`
- Modify: `tests/bible_sheet_overflow_fade.test.js`
- Modify: `tests/bible_responsive_chrome.test.js`
- Modify: `tests/bible_ui_accessibility.test.js`

- [ ] **Step 1: Write failing CSS and state assertions**

Add assertions for the exact visual dimensions and layering:

```js
assert.match(bible, /\.app-sheet-handle::before\s*\{[^}]*width:\s*30px;[^}]*height:\s*3px;/s);
assert.match(bible, /\.app-sheet-handle\s*\{[^}]*min-height:\s*44px;/s);
assert.doesNotMatch(bible, /selection-sheet-host\s*~\s*\.app-sheet-fade-bottom\s*\{[^}]*bottom:\s*28px/);
assert.match(bible, /\.app-sheet\.edge-top \.selection-panel\s*\{[^}]*padding-top:\s*\.5rem;/s);
assert.match(bible, /\.selection-panel\s*\{[^}]*padding-bottom:[^;}]*52px/s);
assert.match(bible, /@media \(hover:\s*hover\) and \(pointer:\s*fine\)/);
```

In the close-state harness, begin with History, Search, Settings, and each selector opener active. Exercise drag, backdrop, Escape, history pop, selection commit, action completion, programmatic close, owner reset, and kind replacement. Assert exactly one active launcher while open and none as soon as close begins.

- [ ] **Step 2: Run the mobile visual and launcher tests and confirm failure**

Run:

```bash
node --test tests/bible_selection_sheet.test.js tests/bible_sheet_overflow_fade.test.js tests/bible_responsive_chrome.test.js tests/bible_ui_accessibility.test.js tests/bible_sheet_controller.test.js
```

Expected: FAIL on the 42×4 handle, the fixed 28px fade offset, missing top inset, and unconditional hover styling.

- [ ] **Step 3: Apply the visual corrections without shrinking hit targets**

Use these declarations:

```css
  .app-sheet-handle {
    width: 100%; min-height: 44px; padding: 10px; border: 0; background: transparent;
    cursor: ns-resize; touch-action: none;
  }
  .app-sheet-handle::before {
    content: ''; display: block; width: 30px; height: 3px; margin: auto;
    border-radius: var(--radius-pill); background: var(--fg4);
  }
  .app-sheet-fade-bottom { bottom: 0; }
  .selection-panel {
    padding-bottom: max(52px, calc(var(--display-panel-padding) + env(safe-area-inset-bottom)));
  }
  @media (max-width: 640px) {
    .app-sheet.edge-top .selection-panel { padding-top: .5rem; }
  }
```

Delete the `bottom: 28px` selection fade override. Keep the content frame clipped, fade at `z-index: 2`, Tonal Float at `z-index: 3`, and handle in the free-edge grid row. Preserve `pointer-events: none`, `aria-hidden`, and nonselectable indicator behavior.

- [ ] **Step 4: Separate hover capability from keyboard focus**

Keep the three `:focus-visible` rules unconditional and move only hover selectors under:

```css
  @media (hover: hover) and (pointer: fine) {
    .floating-nav button:hover,
    .bottom-action-button:hover,
    .fab-main:hover {
      color: var(--accent);
      border-color: var(--accent);
      background: var(--hover-bg);
    }
  }
```

Keep `syncAppSheetLauncherState()` as the only owner of `.active` and `aria-expanded`. Confirm `requestCloseAppSheet()` calls it immediately after setting `phase = 'closing'`; do not defer launcher clearing until the close animation finishes.

- [ ] **Step 5: Run mobile/accessibility tests and commit**

Run:

```bash
node --test tests/bible_selection_sheet.test.js tests/bible_sheet_overflow_fade.test.js tests/bible_responsive_chrome.test.js tests/bible_ui_accessibility.test.js tests/bible_sheet_controller.test.js
```

Expected: PASS.

Commit:

```bash
git add bible.html tests/bible_selection_sheet.test.js tests/bible_sheet_overflow_fade.test.js tests/bible_responsive_chrome.test.js tests/bible_ui_accessibility.test.js tests/bible_sheet_controller.test.js
git commit -S -m "fix: polish mobile bible sheets"
```

### Task 5: Shared Wheel Burst Engine and Selector Trackpad Paging

**Files:**
- Modify: `bible.html:2455-2487`
- Modify: `bible.html:3600-3670`
- Modify: `bible.html:4157-4256`
- Modify: `tests/bible_trackpad_navigation.test.js`
- Modify: `tests/bible_selection_sheet.test.js`

- [ ] **Step 1: Write failing burst and selector-routing tests**

Add a small VM harness with fake timers and these assertions:

```js
assert.equal(harness.wheel({ deltaX: 24, deltaY: 0, deltaMode: 0 }), false);
assert.equal(harness.wheel({ deltaX: 24, deltaY: 0, deltaMode: 0 }), true);
assert.deepEqual(harness.pages(), ['chapters'], 'one burst advances one page');
harness.wheel({ deltaX: 120, deltaY: 0, deltaMode: 0 });
assert.deepEqual(harness.pages(), ['chapters'], 'momentum cannot advance twice');
harness.flushIdle();
harness.wheel({ deltaX: -48, deltaY: 0, deltaMode: 0 });
assert.deepEqual(harness.pages(), ['chapters', 'books']);
assert.equal(harness.preventedAtEndpoint(), true, 'claimed endpoint blocks browser history swipe');
assert.equal(harness.wheel({ deltaX: 60, deltaY: 60, deltaMode: 0 }), false);
assert.equal(harness.wheel({ deltaX: 60, deltaY: 0, deltaMode: 0, ctrlKey: true }), false);
assert.equal(harness.wheelFromInput({ deltaX: 60, deltaY: 0, deltaMode: 0 }), false);
assert.equal(harness.listenerCountAfterCleanup(), 0);
```

- [ ] **Step 2: Run selector/wheel tests and confirm failure**

Run:

```bash
node --test tests/bible_trackpad_navigation.test.js tests/bible_selection_sheet.test.js
```

Expected: FAIL because no wheel burst state or selector listener exists.

- [ ] **Step 3: Add the shared generation-safe burst state**

Add:

```js
  var bibleWheelBurst = { x: 0, y: 0, consumed: false, direction: 0, timer: null, generation: 0 };

  function resetBibleWheelBurst() {
    if (bibleWheelBurst.timer !== null) window.clearTimeout(bibleWheelBurst.timer);
    bibleWheelBurst.x = 0;
    bibleWheelBurst.y = 0;
    bibleWheelBurst.consumed = false;
    bibleWheelBurst.direction = 0;
    bibleWheelBurst.timer = null;
    bibleWheelBurst.generation += 1;
  }

  function bibleWheelTargetBlocked(event) {
    if (!event || event.ctrlKey || event.metaKey || event.shiftKey ||
        appSheetState.phase === 'dragging' || appSheetState.phase === 'settling') return true;
    var target = event.target;
    if (target && typeof target.closest === 'function' &&
        target.closest('input,textarea,select,[contenteditable="true"]')) return true;
    try {
      var selection = window.getSelection();
      if (selection && !selection.isCollapsed) return true;
    } catch (error) {}
    return false;
  }

  function accumulateBibleWheel(event) {
    if (bibleWheelTargetBlocked(event)) return 0;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    var dx = normalizeBibleWheelDelta(event.deltaX, event.deltaMode, viewportWidth);
    var dy = normalizeBibleWheelDelta(event.deltaY, event.deltaMode, viewportWidth);
    if (dx === null || dy === null) return 0;
    if (bibleWheelBurst.direction && dx && Math.sign(dx) !== bibleWheelBurst.direction) return 0;
    bibleWheelBurst.x += dx;
    bibleWheelBurst.y += dy;
    var direction = bibleWheelClaimDirection(bibleWheelBurst.x, bibleWheelBurst.y);
    if (direction) bibleWheelBurst.direction = direction;
    if (bibleWheelBurst.timer !== null) window.clearTimeout(bibleWheelBurst.timer);
    var generation = bibleWheelBurst.generation;
    bibleWheelBurst.timer = window.setTimeout(function () {
      if (generation === bibleWheelBurst.generation) resetBibleWheelBurst();
    }, BIBLE_WHEEL_IDLE_MS);
    return bibleWheelBurst.consumed ? bibleWheelBurst.direction : direction;
  }
```

- [ ] **Step 4: Route a claimed selector burst and own its listener**

Add:

```js
  function onSelectionWheel(event) {
    if (!appSheet.open || appSheetState.kind !== 'selection' || !selectionPager ||
        !selectionPager.contains(event.target)) return;
    var direction = accumulateBibleWheel(event);
    if (!direction) return;
    event.preventDefault();
    if (bibleWheelBurst.consumed) return;
    bibleWheelBurst.consumed = true;
    var index = selectionPages.indexOf(selectionSheetPage);
    var next = Math.max(0, Math.min(selectionPages.length - 1, index + direction));
    if (next !== index) setSelectionPage(selectionPages[next], true, 'pointer');
  }
```

Install it with `{ passive: false }` in `renderSelectionSheet()` and remove it in `cleanupSelectionSheet()`. Reset the burst on selector close/replacement, visibility loss, window blur, and viewport resize. Do not reset immediately after a successful page action; the consumed state must survive momentum until the 160ms idle reset.

- [ ] **Step 5: Run selector/wheel tests and commit**

Run:

```bash
node --test tests/bible_trackpad_navigation.test.js tests/bible_selection_sheet.test.js
```

Expected: PASS.

Commit:

```bash
git add bible.html tests/bible_trackpad_navigation.test.js tests/bible_selection_sheet.test.js
git commit -S -m "feat: page bible selector by trackpad"
```

### Task 6: Continuous Reader Chapter Paging Across Book Boundaries

**Files:**
- Modify: `bible.html:5072-5100`
- Modify: `bible.html:5700-5982`
- Modify: `bible.html:7100-7110`
- Modify: `tests/bible_trackpad_navigation.test.js`
- Modify: `tests/bible_verse_motion.test.js`

- [ ] **Step 1: Write failing canonical chapter and reader-routing tests**

Extract `prevChapterNav`, `nextChapterNav`, and `showAdjacentChapter` into a VM harness with a canonical fixture:

```js
const data = {
  Genesis: { 1: {}, 2: {} },
  Exodus: { 1: {}, 2: {}, 3: {} },
  Revelation: { 21: {}, 22: {} }
};
assert.deepEqual(harness.next('Genesis', 2), { book: 'Exodus', chapter: 1 });
assert.deepEqual(harness.prev('Exodus', 1), { book: 'Genesis', chapter: 2 });
assert.equal(harness.prev('Genesis', 1), null);
assert.equal(harness.next('Revelation', 22), null);
harness.readerAt('Genesis', 2, '9');
harness.wheelForward();
assert.deepEqual(harness.transition(), { book: 'Exodus', chapter: 1, verse: '1' });
harness.remember('Genesis', 2, '7');
harness.readerAt('Exodus', 1, '1');
harness.wheelBackward();
assert.deepEqual(harness.transition(), { book: 'Genesis', chapter: 2, verse: '7' });
assert.equal(harness.selectorCalls(), 0, 'reader routing is exclusive');
```

Add a verse-motion assertion that `showAdjacentChapter()` reaches `showVersesViewWithTransition()` and that destination chasing holds `programmaticVerseScroll` until positioning completes.

- [ ] **Step 2: Run the trackpad and verse-motion tests and confirm failure**

Run:

```bash
node --test tests/bible_trackpad_navigation.test.js tests/bible_verse_motion.test.js
```

Expected: FAIL because `viewEl` does not route horizontal wheel bursts.

- [ ] **Step 3: Add the scoped reader wheel adapter**

Add:

```js
  function onBibleReaderWheel(event) {
    if (appSheet.open || uiView !== 'verses' || !viewEl.contains(event.target)) {
      releaseVerseChaseForFreeScroll();
      return;
    }
    var direction = accumulateBibleWheel(event);
    if (!direction) {
      releaseVerseChaseForFreeScroll();
      return;
    }
    event.preventDefault();
    if (bibleWheelBurst.consumed) return;
    bibleWheelBurst.consumed = true;
    showAdjacentChapter(direction);
  }
```

Replace the existing passive `viewEl` wheel listener with:

```js
  viewEl.addEventListener('wheel', onBibleReaderWheel, { passive: false });
```

Keep the touchstart listener unchanged. Do not create a second chapter navigation or history function.

- [ ] **Step 4: Make canonical ordering and programmatic positioning explicit**

Keep `showAdjacentChapter()` as the only sink:

```js
  function showAdjacentChapter(direction) {
    if (!bibleData || navBook == null || navChapter == null) return false;
    var next = direction < 0 ? prevChapterNav(navBook, navChapter) : nextChapterNav(navBook, navChapter);
    if (!next) return false;
    prepareToLeaveReadingView();
    showVersesViewWithTransition(next.book, next.chapter,
      recalledChapterVerse(next.book, next.chapter) || '1');
    return true;
  }
```

Verify Bible data initialization preserves canonical book order in its existing trusted data object. Do not sort book names alphabetically. At Genesis 1 and Revelation 22, the claimed burst remains prevented and consumed even though `showAdjacentChapter()` returns `false`.

Do not call `resetBibleWheelBurst()` from the successful chapter render path; momentum remains locked until the idle timer. Reset on unrelated view changes, window blur, document visibility loss, resize, and a new direct navigation action.

- [ ] **Step 5: Run navigation/motion tests and commit**

Run:

```bash
node --test tests/bible_trackpad_navigation.test.js tests/bible_verse_motion.test.js tests/bible_responsive_chrome.test.js
```

Expected: PASS, including book-boundary traversal and unchanged hide-bars state during destination positioning.

Commit:

```bash
git add bible.html tests/bible_trackpad_navigation.test.js tests/bible_verse_motion.test.js tests/bible_responsive_chrome.test.js
git commit -S -m "feat: navigate bible chapters by trackpad"
```

### Task 7: Mobile Search Fullscreen Keyboard Ownership

**Files:**
- Modify: `bible.html:2455-2487`
- Modify: `bible.html:2566-2580`
- Modify: `bible.html:2841-2870`
- Modify: `bible.html:3358-3372`
- Modify: `bible.html:6817-6915`
- Modify: `tests/bible_sheet_content_behavior.test.js`
- Modify: `tests/bible_sheet_controller.test.js`

- [ ] **Step 1: Write failing focus-latch and visual-viewport lifecycle tests**

Add a harness with a mobile media query and fake `visualViewport`:

```js
assert.equal(harness.openSearch().snap(), 'determined');
harness.runAutofocusTimer();
assert.equal(harness.snap(), 'fullscreen', 'fullscreen commits before focus');
assert.equal(harness.focusCalls(), 1);
harness.blurInput();
assert.equal(harness.snap(), 'fullscreen');
harness.viewport.resize({ height: 420, offsetTop: 20 });
harness.flushFrame();
assert.equal(harness.style('--sheet-viewport-height'), '420px');
assert.equal(harness.style('--sheet-viewport-top'), '20px');
harness.close();
assert.equal(harness.viewport.listenerCount('resize'), 0);
assert.equal(harness.pendingFrames(), 0);
harness.fireStaleViewportCallback();
assert.equal(harness.style('--sheet-viewport-height'), null);
```

Also test invalid `height`, invalid `offsetTop`, rotation/resize, manual input focus, and a Search close/reopen generation change.

- [ ] **Step 2: Run Search/controller tests and confirm failure**

Run:

```bash
node --test tests/bible_sheet_content_behavior.test.js tests/bible_sheet_controller.test.js
```

Expected: FAIL because Search focus does not latch fullscreen and the global viewport listener is not generation-owned.

- [ ] **Step 3: Add generation-owned Search viewport state and cleanup**

Add to `appSheetState`:

```js
    searchFullscreenLatched: false,
    viewportFrame: null,
    viewportListener: null,
```

Add:

```js
  function cleanupAppSheetViewportOwnership() {
    if (appSheetState.viewportFrame !== null) cancelAnimationFrame(appSheetState.viewportFrame);
    appSheetState.viewportFrame = null;
    if (window.visualViewport && appSheetState.viewportListener) {
      window.visualViewport.removeEventListener('resize', appSheetState.viewportListener);
      window.visualViewport.removeEventListener('scroll', appSheetState.viewportListener);
    }
    appSheetState.viewportListener = null;
    appSheet.style.removeProperty('--sheet-viewport-height');
    appSheet.style.removeProperty('--sheet-viewport-top');
    appSheet.classList.remove('search-viewport-fullscreen');
  }

  function updateSearchViewportGeometry(generation) {
    if (!isCurrentAppSheetGeneration(generation) || appSheetState.kind !== 'search' ||
        !appSheetState.searchFullscreenLatched) return;
    var viewport = window.visualViewport;
    var height = viewport && isFiniteAppSheetNumber(viewport.height) && viewport.height > 0 ?
      viewport.height : appSheetViewportHeight();
    var top = viewport && isFiniteAppSheetNumber(viewport.offsetTop) && viewport.offsetTop >= 0 ?
      viewport.offsetTop : 0;
    if (height === null) return;
    appSheet.style.setProperty('--sheet-viewport-height', height + 'px');
    appSheet.style.setProperty('--sheet-viewport-top', top + 'px');
  }

  function latchMobileSearchFullscreen(generation) {
    if (!isCurrentAppSheetGeneration(generation) || appSheetState.kind !== 'search' ||
        !window.matchMedia('(max-width: 640px)').matches) return false;
    var firstLatch = !appSheetState.searchFullscreenLatched;
    appSheetState.searchFullscreenLatched = true;
    appSheet.classList.add('search-viewport-fullscreen');
    if (firstLatch) installSearchViewportOwnership(generation);
    setSheetSnap('fullscreen', false);
    updateSearchViewportGeometry(generation);
    return true;
  }

  function installSearchViewportOwnership(generation) {
    if (!window.visualViewport || !isCurrentAppSheetGeneration(generation) ||
        appSheetState.kind !== 'search') return false;
    if (appSheetState.viewportListener) return true;
    appSheetState.viewportListener = function () {
      if (!isCurrentAppSheetGeneration(generation) || appSheetState.viewportFrame !== null) return;
      appSheetState.viewportFrame = requestAnimationFrame(function () {
        appSheetState.viewportFrame = null;
        if (isCurrentAppSheetGeneration(generation)) updateSearchViewportGeometry(generation);
      });
    };
    window.visualViewport.addEventListener('resize', appSheetState.viewportListener, { passive: true });
    window.visualViewport.addEventListener('scroll', appSheetState.viewportListener, { passive: true });
    return true;
  }
```

Call `installSearchViewportOwnership(generation)` the first time the latch activates. Remove the old permanent visual viewport listener from `installAppSheetListeners()`.

- [ ] **Step 4: Promote before autofocus and preserve fullscreen until close**

In `renderSearchSheet()`, add `var sheetGeneration = appSheetState.generation;`, add a focus listener that calls `latchMobileSearchFullscreen(sheetGeneration)`, and change delayed autofocus to:

```js
    focusTimer = window.setTimeout(function () {
      focusTimer = null;
      if (generation !== searchSheetGeneration || !target.isConnected ||
          !isCurrentAppSheetGeneration(sheetGeneration) || appSheetState.kind !== 'search') return;
      latchMobileSearchFullscreen(sheetGeneration);
      input.focus({ preventScroll: true });
    }, 100);
```

The manual `focus` listener calls the same latch. Blur never demotes the sheet. `resetAppSheetState()` and Search content cleanup clear the latch and viewport ownership.

Use:

```css
  .app-sheet.search-viewport-fullscreen.snap-fullscreen {
    top: var(--sheet-viewport-top, 0px);
    bottom: auto;
    height: var(--sheet-viewport-height, 100dvh);
    max-height: var(--sheet-viewport-height, 100dvh);
  }
```

- [ ] **Step 5: Run Search/controller tests and commit**

Run:

```bash
node --test tests/bible_sheet_content_behavior.test.js tests/bible_sheet_controller.test.js tests/bible_ui_accessibility.test.js
```

Expected: PASS.

Commit:

```bash
git add bible.html tests/bible_sheet_content_behavior.test.js tests/bible_sheet_controller.test.js tests/bible_ui_accessibility.test.js
git commit -S -m "fix: keep mobile bible search visible"
```

### Task 8: Leak Soak, Security Regression, Full Suite, and Browser QA

**Files:**
- Modify: `tests/bible_sheet_controller.test.js`
- Modify: `tests/bible_trackpad_navigation.test.js`
- Modify: `tests/bible_ui_accessibility.test.js`
- Modify: `tests/bible_ui_scale_reflow.test.js`
- Modify: `bible.html` only for failures proven by this task

- [ ] **Step 1: Add repeated-lifecycle resource and hostile-input tests**

Add a 100-cycle harness that opens, measures, maximizes, restores, wheels, focuses Search, resizes the visual viewport, and closes every sheet kind. Compare the final counts to the initial counts:

```js
assert.deepEqual(harness.resources(), {
  wheelListeners: 0,
  viewportListeners: 0,
  resizeObservers: 0,
  timers: 0,
  animationFrames: 0,
  pointerCaptures: 0,
  detachedContentNodes: 0
});
```

Add hostile scalar cases:

```js
for (const value of [NaN, Infinity, -Infinity, '50vw', {}, [], new Number(48)]) {
  assert.equal(harness.applyWheelDelta(value), false);
  assert.equal(harness.applyViewportHeight(value), false);
}
assert.equal(harness.openFromHistory({ kind: '__proto__', fillsPanel: true }), false);
assert.equal(harness.committedDiagnosticsContain('search-secret'), false);
```

- [ ] **Step 2: Run the complete automated suite**

Run:

```bash
node --test tests/*.test.js
```

Expected: all tests PASS with zero failures, cancellations, or skipped regressions.

- [ ] **Step 3: Reconcile any failure with its owning task and rerun**

If the suite fails, stop this task and return to the earlier task that owns the failing behavior. Apply that task's red-green implementation step, rerun its targeted command, then resume here. Do not weaken assertions, expand history-state trust, add a fourth sheet state, or introduce a second chapter-navigation path.

Run again:

```bash
node --test tests/*.test.js
```

Expected: all tests PASS.

- [ ] **Step 4: Perform rendered browser QA in the in-app browser**

Serve the repository locally and verify these states at desktop, mobile, light, dark, and reduced-motion settings:

```bash
python3 -m http.server 60467
```

Checklist:

- History and Settings fit narrow desktop content; selector width is exactly the available `50vw` cap.
- Launchers on each viewport half produce stable left/right anchoring through maximize and restore.
- Opening and closing glide vertically from the navbar edge; maximize and restore expand inward without flashes or stale callbacks.
- Trackpad momentum changes only one selector page or one chapter per burst.
- Genesis 1, a middle book boundary in each direction, and Revelation 22 behave correctly.
- Vertical and diagonal wheel input still scrolls content.
- Mobile Search is visible above the keyboard and remains fullscreen after keyboard dismissal.
- Drag, backdrop, Escape, history, selection, and replacement closure clear launcher highlighting.
- The 30×3 handle is visually thin but easy to drag; the fade sits directly above it; the last grid row remains readable; the first top row has 0.5rem clearance.
- DevTools console contains no relevant error or warning.

- [ ] **Step 5: Commit the final verified regression coverage**

```bash
git add bible.html tests/bible_sheet_controller.test.js tests/bible_trackpad_navigation.test.js tests/bible_ui_accessibility.test.js tests/bible_ui_scale_reflow.test.js
git commit -S -m "test: verify bible sheet refinements"
```

Run one final verification:

```bash
node --test tests/*.test.js
git status --short
git log -1 --show-signature --format=fuller
```

Expected: all tests PASS; only the user's unrelated pre-existing untracked paths remain; the final commit reports a good signature.
