# Bible Sheet Gesture Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Bible sheet content-sized, content-first, and responsive to low-latency three-state dragging while preserving native scrolling, selector paging, accessibility, privacy, and deterministic cleanup.

**Architecture:** Keep the native `<dialog>` and the existing static renderer registry in `bible.html`, but replace the current compact/fullscreen controller with one generation-scoped state machine. Pointer and Touch Event adapters feed the same pure axis, velocity, snap, rendering, and cleanup functions; measurement and fade observers are separate lifecycle-owned helpers. The selector retains three persistent panels, but its visual indicator becomes decorative and horizontal gestures share the controller's arbitration rules.

**Tech Stack:** Native HTML/CSS/JavaScript, Pointer Events, Touch Events, `<dialog>`, `ResizeObserver`, `requestAnimationFrame`, Node's built-in test runner, in-app browser QA.

**Design reference:** `docs/superpowers/specs/2026-07-09-bible-sheet-gesture-refinement-design.md`

---

## File Map

- Modify `bible.html`: sheet structure, CSS, pure sizing/snap helpers, generation-scoped controller, gesture adapters, selector semantics, overflow fades, focus policy, and trusted renderer entry points.
- Modify `tests/bible_sheet_controller.test.js`: sizing, three-state snap decisions, phase/generation behavior, real-time rendering, close/focus policies, cancellation, multi-input, and lifecycle cleanup.
- Modify `tests/bible_selection_sheet.test.js`: decorative Tonal Float, button-origin swipes, live track movement, click suppression, inert panels, keyboard paging, focus relocation, and responsive placement.
- Modify `tests/bible_ui_accessibility.test.js`: no chrome title/close button, kind-specific dialog naming, edge-aware handle semantics, decorative fades/indicator, and keyboard contracts.
- Create `tests/bible_sheet_overflow_fade.test.js`: isolated scroll-boundary fade state, observer/frame coalescing, active selector scroller, and cleanup tests.

Do not split `bible.html` during this change. Its inline tests already extract named source regions, and an unrelated module migration would weaken rollback safety.

Resolve the bundled Node executable once per shell and use it for every test command in this worktree:

```bash
NODE_BIN="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
test -x "$NODE_BIN"
```

Expected: `test` exits 0 without output. This path contains no repository data or committed machine username.

Per the user's explicit repository instruction, 1Password MCP is disabled for this task. Use the already configured local signing identity without reading or printing private key material. Before the first implementation commit, run this non-secret preflight once:

```bash
git config --get commit.gpgsign
git config --get gpg.format
git config --get user.signingkey
git log -1 --show-signature --format='%G? %s'
```

Expected: signing is enabled/configured and the existing spec commit reports signature status `G`. Every later commit still uses `git commit -S`, and final verification rejects any non-`G` implementation commit.

## Task 1: Define the Three-State Sizing and Snap Contract

**Files:**
- Modify: `tests/bible_sheet_controller.test.js`
- Modify: `bible.html:2264-2293`

- [ ] **Step 1: Write failing pure-helper tests**

Replace the old compact-state expectations with exact determined/fullscreen helpers. Add tests that extract and execute these named functions:

```js
test('determined height is natural, finite, and capped at 70 percent of the viewport', () => {
  assert.equal(h.determinedHeight(180, 44, 800), 224);
  assert.equal(h.determinedHeight(900, 44, 800), 560);
  assert.equal(h.determinedHeight(20, 700, 800), null);
  assert.equal(h.determinedHeight(-1, 44, 800), null);
  assert.equal(h.determinedHeight(Infinity, 44, 800), null);
});

test('snap displacement never exceeds the adjacent state distance', () => {
  assert.equal(h.effectiveDistance(40), 40);
  assert.equal(h.effectiveDistance(80), 80);
  assert.equal(h.effectiveDistance(240), 80);
  assert.equal(h.effectiveDistance(0), null);
});

test('release advances only one adjacent state with same-direction fresh velocity', () => {
  assert.equal(h.outcome('bottom', 'determined', -80, 0, 200, 600, 20), 'fullscreen');
  assert.equal(h.outcome('bottom', 'determined', 80, 0, 200, 600, 20), 'closed');
  assert.equal(h.outcome('bottom', 'fullscreen', 80, 0, 200, 600, 20), 'determined');
  assert.equal(h.outcome('bottom', 'fullscreen', 500, 3, 200, 600, 20), 'determined');
  assert.equal(h.outcome('bottom', 'determined', -20, -0.4, 200, 600, 20), 'fullscreen');
  assert.equal(h.outcome('bottom', 'determined', -20, -0.4, 200, 600, 100), 'determined');
  assert.equal(h.outcome('bottom', 'determined', -20, 0.9, 200, 600, 20), 'determined');
  assert.equal(h.outcome('bottom', 'determined', -40, 0, 760, 800, 20), 'fullscreen');
  assert.equal(h.outcome('sideways', 'determined', -80, 0, 200, 600, 20), null);
  assert.equal(h.outcome('bottom', 'compact', -80, 0, 200, 600, 20), null);
  assert.equal(h.outcome('bottom', 'determined', '-80', 0, 200, 600, 20), null);
  assert.equal(h.outcome('bottom', 'determined', -80, 0, 200, 600, -1), null);
  assert.equal(h.outcome('bottom', 'determined', -80, 0, 600, 600, 20), null);
});
```

The helper harness must expose `appSheetDeterminedHeight`, `appSheetEffectiveSnapDistance`, and `appSheetReleaseOutcome` from the `APP SHEET PURE HELPERS` source region.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
"$NODE_BIN" --test tests/bible_sheet_controller.test.js
```

Expected: FAIL because the three named helpers and the `determined` snap do not exist.

- [ ] **Step 3: Add the minimal pure helpers and constants**

In `bible.html`, replace the compact snap enum and old `appSheetDragOutcome` with:

```js
var APP_SHEET_SNAPS = ['determined', 'fullscreen'];
var APP_SHEET_PHASES = ['closed', 'idle', 'dragging', 'settling', 'closing'];
var APP_SHEET_AXIS_LOCK_PX = 8;
var APP_SHEET_SNAP_PX = 80;
var APP_SHEET_SNAP_VELOCITY = .4;
var APP_SHEET_VELOCITY_RECENCY_MS = 80;
var APP_SHEET_MAX_VELOCITY = 3;
var APP_SHEET_CLICK_GUARD_MS = 500;

function isFiniteAppSheetNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function appSheetDeterminedHeight(contentHeight, chromeHeight, viewportHeight) {
  if (![contentHeight, chromeHeight, viewportHeight].every(function (value) {
    return isFiniteAppSheetNumber(value) && value >= 0;
  }) || viewportHeight <= 0) return null;
  var fixed = Math.ceil(chromeHeight);
  var cap = Math.floor(viewportHeight * .7);
  if (fixed > cap) return null;
  return Math.max(fixed, Math.min(Math.ceil(contentHeight + chromeHeight), cap));
}

function appSheetEffectiveSnapDistance(adjacentDistance) {
  return isFiniteAppSheetNumber(adjacentDistance) && adjacentDistance > 0 ?
    Math.min(APP_SHEET_SNAP_PX, adjacentDistance) : null;
}

function appSheetReleaseOutcome(edge, snap, displacement, velocity, determinedHeight, viewportHeight, velocityAge) {
  if (!isValidAppSheetEdge(edge) || !isValidAppSheetSnap(snap) ||
      ![displacement, velocity, determinedHeight, viewportHeight, velocityAge].every(isFiniteAppSheetNumber) ||
      determinedHeight <= 0 || viewportHeight <= determinedHeight || velocityAge < 0) return null;
  velocity = Math.max(-APP_SHEET_MAX_VELOCITY, Math.min(APP_SHEET_MAX_VELOCITY, velocity));
  var inwardSign = edge === 'bottom' ? -1 : 1;
  var freshVelocity = velocityAge <= APP_SHEET_VELOCITY_RECENCY_MS && Math.abs(velocity) >= APP_SHEET_SNAP_VELOCITY;
  var velocityAgrees = freshVelocity && (!displacement || Math.sign(velocity) === Math.sign(displacement));
  var direction = displacement ? Math.sign(displacement) : (velocityAgrees ? Math.sign(velocity) : 0);
  if (!direction || (snap === 'fullscreen' && direction === inwardSign)) return snap;
  var adjacentDistance = snap === 'fullscreen' || direction === inwardSign ?
    viewportHeight - determinedHeight : determinedHeight;
  var threshold = appSheetEffectiveSnapDistance(adjacentDistance);
  var distanceQualifies = threshold !== null && Math.abs(displacement) >= threshold;
  if (!distanceQualifies && !velocityAgrees) return snap;
  if (snap === 'fullscreen') return direction === -inwardSign ? 'determined' : 'fullscreen';
  return direction === inwardSign ? 'fullscreen' : 'closed';
}
```

Keep `validatedAppSheetHistoryState` unchanged.

Mechanically rename the existing open snap from `compact` to `determined` in controller defaults, validation, history restoration, class toggles, tests, and markup. Keep the temporary pre-measurement CSS behavior under the new class so Task 1 remains independently green:

```css
.app-sheet.snap-determined { height:min(70dvh, 720px); }
```

Task 3 replaces this temporary fixed height with the measured `--sheet-height` contract.

- [ ] **Step 4: Run focused and full tests and verify GREEN**

Run:

```bash
"$NODE_BIN" --test tests/bible_sheet_controller.test.js
"$NODE_BIN" --test tests/*.test.js
```

Expected: the focused test and all 91 baseline tests plus new tests PASS.

- [ ] **Step 5: Commit the pure contract**

```bash
git add bible.html tests/bible_sheet_controller.test.js
git commit -S -m "refactor: define Bible sheet snap states"
```

## Task 2: Remove Sheet Chrome and Add the Accessible Content Shell

**Files:**
- Modify: `tests/bible_ui_accessibility.test.js:228-231`
- Modify: `tests/bible_sheet_controller.test.js:10-22, 94-116`
- Modify: `bible.html:1020-1089, 1392-1401, 2198-2204, 2417-2439, 2519-2560, 2718-2739`

- [ ] **Step 1: Write failing structure and accessibility tests**

Require the new shell and reject retired chrome:

```js
assert.match(bible, /<dialog id="app-sheet"[^>]*aria-label="Bible panel"/);
assert.match(bible, /id="app-sheet-handle"[^>]*aria-label="Expand Bible panel"/);
assert.match(bible, /id="app-sheet-measure" class="app-sheet-measure"/);
assert.match(bible, /class="app-sheet-fade app-sheet-fade-top" aria-hidden="true"/);
assert.match(bible, /class="app-sheet-fade app-sheet-fade-bottom" aria-hidden="true"/);
assert.doesNotMatch(bible, /id="app-sheet-close"|id="app-sheet-title"|class="app-sheet-header"/);
assert.match(bible, /\.app-sheet\.edge-top \.app-sheet-handle\s*\{[^}]*order:\s*3/);
assert.doesNotMatch(bible, /appSheetTitle|appSheetClose/);
assert.doesNotMatch(bible, /appSheetClose\.addEventListener/);
assert.match(bible, /function syncAppSheetAccessibleState\(\)/);
assert.match(bible, /History — Bible panel|Search — Bible panel|Settings — Bible panel/);
assert.match(bible, /function onAppSheetHandleKeyDown\(e\)[\s\S]*Enter[\s\S]*ArrowUp[\s\S]*ArrowDown[\s\S]*Escape/);
```

Replace the opening controller assertions in `tests/bible_sheet_controller.test.js` at the same RED step:

```js
assert.equal((bible.match(/<dialog\b[^>]*\bid="app-sheet"[^>]*>/g) || []).length, 1);
assert.match(bible, /<dialog\b[^>]*\bid="app-sheet"[^>]*aria-label="Bible panel"/);
assert.match(bible, /id="app-sheet-handle"[^>]*aria-label="Expand Bible panel"/);
assert.doesNotMatch(bible, /aria-labelledby="app-sheet-title"|id="app-sheet-title"|id="app-sheet-close"/);
assert.doesNotMatch(bible, /var appSheetTitle|var appSheetClose/);
```

Add behavior-first controller tests using a small harness that extracts `syncAppSheetAccessibleState` and `onAppSheetHandleKeyDown`, provides fake `appSheet`, `appSheetHandle`, `setSheetSnap`, and `requestCloseAppSheet`, and exposes `dispatch(key)`:

```js
test('sheet handle keyboard controls are edge-aware and preserve immutable close policy', () => {
  let h = runHandleKeys({ edge: 'bottom', snap: 'determined', kind: 'history' });
  let event = h.dispatch('Enter');
  assert.equal(event.prevented, true);
  assert.equal(h.snap(), 'fullscreen');
  assert.equal(h.handleLabel(), 'Restore History panel size');

  event = h.dispatch(' ');
  assert.equal(event.prevented, true);
  assert.equal(h.snap(), 'determined');
  assert.equal(h.handleLabel(), 'Expand History panel');

  h = runHandleKeys({ edge: 'bottom', snap: 'determined', kind: 'history' });
  assert.equal(h.dispatch('ArrowUp').prevented, true);
  assert.equal(h.snap(), 'fullscreen');
  h = runHandleKeys({ edge: 'bottom', snap: 'determined', kind: 'history' });
  assert.equal(h.dispatch('ArrowDown').prevented, true);
  assert.deepEqual(h.closeCalls(), [['keyboard-handle', 'restore-opener']]);

  h = runHandleKeys({ edge: 'top', snap: 'determined', kind: 'search' });
  assert.equal(h.dispatch('ArrowDown').prevented, true);
  assert.equal(h.snap(), 'fullscreen');
  h = runHandleKeys({ edge: 'top', snap: 'determined', kind: 'search' });
  assert.equal(h.dispatch('ArrowUp').prevented, true);
  assert.deepEqual(h.closeCalls(), [['keyboard-handle', 'restore-opener']]);

  h = runHandleKeys({ edge: 'top', snap: 'fullscreen', kind: 'settings' });
  assert.equal(h.dispatch('ArrowUp').prevented, true);
  assert.equal(h.snap(), 'determined');
  assert.equal(h.dispatch('Escape').prevented, true);
  assert.deepEqual(h.closeCalls(), [['keyboard-handle', 'restore-opener']]);

  h = runHandleKeys({ edge: 'bottom', snap: 'fullscreen', kind: 'settings' });
  assert.equal(h.dispatch('ArrowDown').prevented, true);
  assert.equal(h.snap(), 'determined');

  h = runHandleKeys({ edge: 'bottom', snap: 'fullscreen', kind: 'settings' });
  assert.equal(h.dispatch('ArrowUp').prevented, true);
  assert.equal(h.snap(), 'fullscreen', 'bottom-sheet inward arrow cannot move past fullscreen');
  h = runHandleKeys({ edge: 'top', snap: 'fullscreen', kind: 'settings' });
  assert.equal(h.dispatch('ArrowDown').prevented, true);
  assert.equal(h.snap(), 'fullscreen', 'top-sheet inward arrow cannot move past fullscreen');
});
```

The harness must call `syncAppSheetAccessibleState()` after every snap so this test executes label synchronization rather than checking source text only.

- [ ] **Step 2: Run the focused tests and verify RED**

```bash
"$NODE_BIN" --test tests/bible_ui_accessibility.test.js tests/bible_sheet_controller.test.js
```

Expected: FAIL on the old heading, close button, missing measure/fade shell, and fixed handle order.

- [ ] **Step 3: Implement the content-first shell**

Replace the dialog markup with:

```html
<dialog id="app-sheet" class="app-sheet edge-bottom snap-determined" aria-label="Bible panel">
  <div class="app-sheet-shell">
    <button type="button" id="app-sheet-handle" class="app-sheet-handle" aria-label="Expand Bible panel"></button>
    <div class="app-sheet-content-frame">
      <div id="app-sheet-body" class="app-sheet-body" tabindex="0">
        <div id="app-sheet-measure" class="app-sheet-measure"></div>
      </div>
      <div class="app-sheet-fade app-sheet-fade-top" aria-hidden="true"></div>
      <div class="app-sheet-fade app-sheet-fade-bottom" aria-hidden="true"></div>
    </div>
  </div>
</dialog>
```

Update DOM references to remove `appSheetTitle`/`appSheetClose` and add `appSheetMeasure`, `appSheetFadeTop`, and `appSheetFadeBottom`. Render and clear content through `appSheetMeasure`, not by replacing the body wrapper.

Use shell ordering rather than moving DOM nodes:

```css
.app-sheet-shell { display:grid; grid-template-rows:auto minmax(0,1fr); height:100%; }
.app-sheet-handle { order:0; min-height:44px; touch-action:none; }
.app-sheet-content-frame { order:1; position:relative; min-height:0; }
.app-sheet.edge-top .app-sheet-content-frame { order:0; }
.app-sheet.edge-top .app-sheet-handle { order:3; }
```

Keep the existing interactive selector dots unchanged in this task. Task 5 adds keyboard paging, focus relocation, and announcements before replacing those controls with the decorative Tonal Float, so every intermediate commit remains accessible.

- [ ] **Step 4: Add kind-specific naming and handle keys**

Store trusted `label` values in the static descriptor registry. On open/snap changes, set:

```js
function syncAppSheetAccessibleState() {
  var descriptor = resolveAppSheetDescriptor(appSheetState.kind);
  var label = descriptor ? descriptor.label : 'Bible';
  appSheet.setAttribute('aria-label', label + ' — Bible panel');
  appSheetHandle.setAttribute('aria-label',
    (appSheetState.snap === 'fullscreen' ? 'Restore ' : 'Expand ') + label + ' panel' +
    (appSheetState.snap === 'fullscreen' ? ' size' : ''));
}
```

Add a handle `keydown` function: Enter/Space toggles determined/fullscreen; edge-relative inward arrow expands; outward arrow restores fullscreen or requests close from determined; Escape requests close with keyboard focus policy.

- [ ] **Step 5: Run focused and full tests and verify GREEN**

```bash
"$NODE_BIN" --test tests/bible_ui_accessibility.test.js tests/bible_sheet_controller.test.js
"$NODE_BIN" --test tests/*.test.js
```

Expected: all tests PASS and no old title or close target remains. Existing selector-dot tests continue to pass until Task 5 provides their replacement keyboard contract.

- [ ] **Step 6: Commit the structure**

```bash
git add bible.html tests/bible_ui_accessibility.test.js tests/bible_sheet_controller.test.js
git commit -S -m "feat: simplify Bible sheet chrome"
```

## Task 3: Measure Determined Height with a Generation-Scoped Lifecycle

**Files:**
- Modify: `tests/bible_sheet_controller.test.js`
- Modify: `bible.html:2327-2608`

- [ ] **Step 1: Write failing controller lifecycle tests**

Extend the existing fake dialog harness with a fake `ResizeObserver`, dynamic viewport height, measure-wrapper `scrollHeight`, handle geometry, and selector indicator inset. Assert:

```js
assert.equal(api.open('history', { opener }), true);
frames.flush();
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '224px');

measure.scrollHeight = 900;
resizeObserver.fire();
assert.equal(frames.pending(), 1);
frames.flush();
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '560px');

api.beginDrag();
measure.scrollHeight = 120;
resizeObserver.fire();
frames.flush();
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '560px', 'measurement freezes while dragging');
api.cancelDrag();
frames.flush();
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '164px');
```

Add a generation test that opens, closes, reopens, then fires the old observer/frame/timer; no stale callback may mutate the reopened sheet.

Add a separate RED assertion for the renderer trust boundary:

```js
const openSource = functionSource('openAppSheet');
assert.doesNotMatch(openSource, /options\.(?:render|content)/);
assert.equal(api.open('history', { render() { throw new Error('must never run'); } }), true);
assert.equal(staticHistoryRenderCount, 1);
```

Expected before implementation: the source assertion fails because caller-supplied callbacks are still accepted into the registry.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
"$NODE_BIN" --test tests/bible_sheet_controller.test.js
```

Expected: FAIL because phase, generation, measurement frame, observer, and `--sheet-height` do not exist.

- [ ] **Step 3: Add phase, generation, and measurement state**

Replace boolean closing/compact state with explicit fields:

```js
var appSheetState = {
  kind: null, edge: 'bottom', snap: 'determined', phase: 'closed', generation: 0,
  determinedHeight: 0, candidate: null, gesture: null, frame: null, measureFrame: null,
  settleTimer: null, historyTimer: null, resizeObserver: null,
  contentCleanup: null, historyState: null, historyOwned: false,
  pendingHistoryClose: false, opener: null, focusPolicy: 'none'
};
```

Add `isCurrentAppSheetGeneration(generation)`, `measureAppSheetContent()`, `scheduleAppSheetMeasurement()`, `installAppSheetMeasurement()`, and `cleanupAppSheetMeasurement()`. Read measure-wrapper/active-panel `scrollHeight`, fixed chrome, safe area, and viewport only in the measurement function; write `--sheet-height` in the scheduled frame only when generation matches and the rounded height changed.

Use CSS:

```css
.app-sheet { height:var(--sheet-height, auto); max-height:100dvh; }
.app-sheet.snap-determined { height:var(--sheet-height); }
.app-sheet.snap-fullscreen { height:100dvh; }
```

`setSheetSnap` must not force `offsetHeight`. It sets phase `settling`, applies the target class, and finishes to `idle` on a generation-checked transition timer/event. Reduced motion finishes synchronously.

- [ ] **Step 4: Restrict renderer functions to the static registry**

Delete the `options.render` and `options.content` branches from `openAppSheet`. `registerAppSheetDescriptor` remains the only renderer registration boundary and is called only during static initialization. Validate all caller options as scalars before resolving a registry descriptor.

Add mutation-sensitive assertions that `openAppSheet` contains neither `options.render` nor `options.content`, and that hostile route/history state cannot install a renderer.

- [ ] **Step 5: Run focused and full tests and verify GREEN**

```bash
"$NODE_BIN" --test tests/bible_sheet_controller.test.js tests/bible_sheet_content_behavior.test.js
"$NODE_BIN" --test tests/*.test.js
```

Expected: all tests PASS; repeated equal ResizeObserver results schedule no extra write.

- [ ] **Step 6: Commit measurement and lifecycle state**

```bash
git add bible.html tests/bible_sheet_controller.test.js tests/bible_sheet_content_behavior.test.js
git commit -S -m "feat: size Bible sheets to content"
```

## Task 4: Implement Low-Latency Vertical Drag, Adjacent Snaps, and Focus-Safe Close

**Files:**
- Modify: `tests/bible_sheet_controller.test.js`
- Modify: `bible.html:2382-2739`

- [ ] **Step 1: Write failing real-time drag and close tests**

Extend the controller harness to assert:

```js
handle.dispatch('pointerdown', pointer(7, 300, 1));
assert.equal(api.state.phase, 'idle', 'pointerdown is only a candidate before axis lock');
assert.equal(dialog.classList.contains('is-dragging'), false);
handle.dispatch('pointermove', pointer(7, 220, 16));
assert.equal(dialog.classList.contains('is-dragging'), true);
assert.equal(frames.pending(), 1);
assert.equal(layoutReadCount, readsBeforeMove, 'move performs no layout reads');
frames.flush();
assert.equal(dialog.style.getPropertyValue('--sheet-live-height'), '304px');

handle.dispatch('pointerup', pointer(7, 220, 18));
assert.equal(api.state.snap, 'fullscreen');
assert.equal(api.state.phase, 'settling');

api.open('history', { opener });
api.dragClose();
assert.equal(dialog.classList.contains('is-closing'), true, 'visual close begins before popstate');
assert.equal(history.backCalls, 1);
assert.equal(opener.focusCount, 0, 'pointer close does not refocus launcher');
assert.equal(historyButton.getAttribute('aria-expanded'), 'false');
```

Add a CSS/DOM contract assertion proving the live height is consumed rather than merely written:

```js
assert.match(bible, /\.app-sheet\.is-dragging\s*\{[^}]*height:\s*var\(--sheet-live-height\)[^}]*transition:\s*none/);
assert.match(bible, /\.app-sheet\.is-dragging::backdrop\s*\{[^}]*transition:\s*none/);

assert.equal(h.visual('bottom', 'determined', 200, 600, -40).height, 240);
assert.equal(h.visual('bottom', 'determined', '200', 600, -40), null);
assert.equal(h.visual('sideways', 'determined', 200, 600, -40), null);
assert.equal(h.visual('bottom', 'compact', 200, 600, -40), null);
assert.equal(h.visual('bottom', 'determined', 600, 600, -40), null);
```

Add exact threshold, reverse velocity, velocity expiry, fullscreen-to-determined-only, cancellation, second-pointer, lost-capture, one-RAF-per-frame, and reduced-motion cases. Verify every close reason maps to an immutable focus policy and a late callback cannot focus twice. Add a repeated open/replace/close, owner-change, cancellation, and history loop that asserts listener, observer, timer, RAF, capture, media-query-listener, cleanup-callback, and retained-node counts return to the baseline after every iteration.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
"$NODE_BIN" --test tests/bible_sheet_controller.test.js
```

Expected: FAIL because current live values trail through a 240ms transform transition, compact state remains, close waits for `popstate`, and every close restores focus.

- [ ] **Step 3: Implement the shared vertical gesture functions**

Create the shared visual helper and named functions used by both adapters:

```js
function appSheetGestureVisual(edge, snap, determinedHeight, viewportHeight, displacement) {
  if (![determinedHeight, viewportHeight, displacement].every(isFiniteAppSheetNumber) || determinedHeight <= 0 ||
      viewportHeight <= determinedHeight || !isValidAppSheetEdge(edge) || !isValidAppSheetSnap(snap)) return null;
  var inward = (edge === 'bottom' ? -1 : 1) * displacement;
  if (snap === 'fullscreen') {
    return { height: Math.max(determinedHeight, viewportHeight + Math.min(0, inward)), offset: 0 };
  }
  if (inward >= 0) return { height: Math.min(viewportHeight, determinedHeight + inward), offset: 0 };
  var outward = Math.min(determinedHeight, -inward);
  return { height: determinedHeight, offset: (edge === 'bottom' ? 1 : -1) * outward };
}

function beginAppSheetGesture(input) {
  if (!input || appSheetState.phase !== 'idle' || appSheetState.candidate || appSheetState.gesture ||
      !isFiniteAppSheetNumber(input.x) || !isFiniteAppSheetNumber(input.y) ||
      !isFiniteAppSheetNumber(input.time) || input.generation !== appSheetState.generation) return false;
  appSheetState.candidate = {
    id: input.id, generation: input.generation, source: input.source,
    startX: input.x, startY: input.y, lastX: input.x, lastY: input.y,
    lastTime: input.time, axis: null, viewportHeight: input.viewportHeight,
    verticalAllowed: input.verticalAllowed === true
  };
  return true;
}

function claimAppSheetGesture(candidate) {
  if (!candidate || !candidate.verticalAllowed || candidate.generation !== appSheetState.generation) return false;
  appSheetState.gesture = {
    id: candidate.id, generation: candidate.generation, source: candidate.source,
    startX: candidate.startX, startY: candidate.startY,
    lastX: candidate.lastX, lastY: candidate.lastY, lastTime: candidate.lastTime,
    lastMoveTime: null, velocity: 0, axis: 'y', startSnap: appSheetState.snap,
    determinedHeight: appSheetState.determinedHeight,
    viewportHeight: candidate.viewportHeight, pendingDisplacement: 0
  };
  appSheetState.candidate = null;
  appSheetState.phase = 'dragging';
  appSheet.classList.add('is-dragging');
  return true;
}

function updateAppSheetGesture(input) {
  var candidate = appSheetState.candidate;
  if (candidate && candidate.id === input.id) {
    var axis = appSheetAxis(input.x - candidate.startX, input.y - candidate.startY);
    if (axis === null) return true;
    if (axis !== 'y' || !claimAppSheetGesture(candidate)) {
      appSheetState.candidate = null;
      return false;
    }
  }
  var gesture = appSheetState.gesture;
  if (!gesture || gesture.id !== input.id || gesture.generation !== appSheetState.generation) return false;
  var dy = input.y - gesture.startY;
  var elapsed = input.time - gesture.lastTime;
  if (elapsed > 0) gesture.velocity = Math.max(-APP_SHEET_MAX_VELOCITY,
    Math.min(APP_SHEET_MAX_VELOCITY, (input.y - gesture.lastY) / elapsed));
  gesture.lastY = input.y;
  gesture.lastTime = input.time;
  gesture.lastMoveTime = input.time;
  gesture.pendingDisplacement = dy;
  if (appSheetState.frame === null) {
    var generation = gesture.generation;
    appSheetState.frame = requestAnimationFrame(function () { renderAppSheetGestureFrame(generation); });
  }
  return true;
}

function renderAppSheetGestureFrame(generation) {
  appSheetState.frame = null;
  var gesture = appSheetState.gesture;
  if (!gesture || gesture.generation !== generation || !isCurrentAppSheetGeneration(generation)) return;
  var visual = appSheetGestureVisual(appSheetState.edge, gesture.startSnap,
    gesture.determinedHeight, gesture.viewportHeight, gesture.pendingDisplacement);
  if (!visual) return cancelAppSheetGesture('invalid-geometry');
  appSheet.style.setProperty('--sheet-live-height', visual.height + 'px');
  appSheet.style.setProperty('--sheet-drag-offset', visual.offset + 'px');
  appSheet.style.setProperty('--sheet-backdrop-opacity',
    String(Math.max(0, Math.min(1, 1 - Math.abs(visual.offset) / gesture.determinedHeight))));
}

function clearAppSheetGestureResources() {
  if (appSheetState.frame !== null) cancelAnimationFrame(appSheetState.frame);
  appSheetState.frame = null;
  releaseAppSheetPointer();
  appSheetState.candidate = null;
  appSheetState.gesture = null;
  appSheet.classList.remove('is-dragging');
  appSheet.style.removeProperty('--sheet-live-height');
  appSheet.style.removeProperty('--sheet-drag-offset');
  appSheet.style.removeProperty('--sheet-backdrop-opacity');
  if (appSheetState.phase === 'dragging') appSheetState.phase = 'idle';
}

function finishAppSheetGesture(input, cancelled) {
  if (appSheetState.candidate && appSheetState.candidate.id === input.id) {
    appSheetState.candidate = null;
    return false;
  }
  var gesture = appSheetState.gesture;
  if (!gesture || gesture.id !== input.id) return false;
  var velocityAge = gesture.lastMoveTime === null ? Infinity : input.time - gesture.lastMoveTime;
  var target = cancelled ? gesture.startSnap : appSheetReleaseOutcome(appSheetState.edge,
    gesture.startSnap, input.y - gesture.startY, gesture.velocity,
    gesture.determinedHeight, gesture.viewportHeight, velocityAge);
  clearAppSheetGestureResources();
  if (target === 'closed') return requestCloseAppSheet('drag', 'none');
  return setSheetSnap(target, false);
}

function cancelAppSheetGesture(reason) {
  var startSnap = appSheetState.gesture ? appSheetState.gesture.startSnap : appSheetState.snap;
  clearAppSheetGestureResources();
  return setSheetSnap(startSnap, shouldReduceVerseMotion());
}
```

At claim time add `.is-dragging`; CSS must disable all sheet/backdrop transitions in that class. For determined-to-fullscreen and fullscreen-to-determined, write a clamped `--sheet-live-height`. For determined-to-closed, keep the frozen height and write edge-signed `--sheet-drag-offset`. Never read layout in `updateAppSheetGesture` or `renderAppSheetGestureFrame`.

Consume the live height in CSS:

```css
.app-sheet.is-dragging { height:var(--sheet-live-height); transition:none; }
.app-sheet.is-dragging::backdrop { transition:none; }
```

- [ ] **Step 4: Make visible close immediate and generation-safe**

Change `requestCloseAppSheet(source, focusPolicy)` so it immediately:

1. freezes the current generation and immutable focus policy;
2. sets phase `closing`;
3. clears launcher states;
4. applies edge-signed closed transform/backdrop progress;
5. starts `history.back()` when history-owned;
6. installs a generation-checked fallback timer;
7. lets `popstate` or the fallback call the same idempotent finish function.

Implement focus policies `restore-opener`, `none`, `reader`, and `preserve-or-reader`. Pointer drag/backdrop use `none` and never programmatically focus; Escape/handle keyboard use `restore-opener`; selection/action completion use `reader`; owner/history/programmatic close use `preserve-or-reader`, preserving valid external focus or falling back to the reader. The reader fallback focuses `#view-inner` with temporary `tabindex="-1"` and `preventScroll`.

- [ ] **Step 5: Run focused and full tests and verify GREEN**

```bash
"$NODE_BIN" --test tests/bible_sheet_controller.test.js tests/bible_sheet_content_behavior.test.js
"$NODE_BIN" --test tests/*.test.js
```

Expected: all tests PASS; no live gesture retains a transition, RAF, capture, or stale callback.

- [ ] **Step 6: Commit vertical interaction**

```bash
git add bible.html tests/bible_sheet_controller.test.js tests/bible_sheet_content_behavior.test.js
git commit -S -m "feat: refine Bible sheet dragging"
```

## Task 5: Unify Mobile Selector Swiping and Touch Boundary Dragging

**Files:**
- Modify: `tests/bible_selection_sheet.test.js:526-678`
- Modify: `tests/bible_sheet_controller.test.js`
- Modify: `bible.html:3141-3338`

- [ ] **Step 1: Rewrite failing selector gesture tests around real targets**

Replace the test that rejects every button with:

```js
test('grid buttons tap normally but horizontal movement claims one page swipe', () => {
  const h = runGestureProgram();
  const button = interactiveTarget('button', { selectionCell: true });
  h.api.start(touch(1, 180, 40, 0, button));
  h.api.end(touch(1, 180, 40, 10, button));
  assert.equal(h.clicksSuppressed, 0);

  h.api.start(touch(2, 180, 40, 20, button));
  h.api.move(touch(2, 80, 42, 40, button));
  h.frames.flush();
  assert.equal(h.trackOffset(), -100);
  h.api.end(touch(2, 80, 42, 45, button));
  assert.equal(h.api.page(), 'verses');
  h.api.lostCapture(2);
  assert.equal(h.api.guardArmed(), true);
  assert.equal(h.api.guardClick(keyboardClick(button)), false);
  assert.equal(h.api.guardArmed(), true, 'keyboard activation does not consume the pointer guard');
  assert.equal(h.api.guardClick(pointerClick(button)), true);
  assert.equal(h.api.guardArmed(), false);
  assert.equal(h.api.guardClick(pointerClick(button)), false, 'the matching pointer click is suppressed once');
});
```

Add cases for input/link exclusions, selected text, vertical native scroll, boundary-origin vertical sheet drag, no mid-scroll transfer, cancellation, second touch, endpoint resistance, one-page maximum, and `pointerup -> lostpointercapture -> click`. Add pen and mouse swipes originating on each grid-button type. Add compatibility-event deduplication tests proving one touch gesture cannot also start the Pointer/Mouse adapter, and touch-identifier cleanup tests for end, cancel, generation change, and timeout.

- [ ] **Step 2: Write failing selector semantics/focus tests**

Assert inactive panels are `inert` and `aria-hidden="true"`; the active panel is exposed. Pointer paging from a focused old-panel button must focus the new panel container before inerting the old panel. `Alt+ArrowLeft/Right` must move one page, focus the first logical control for keyboard paging, and announce `Books`, `Chapters`, or `Verses` through the bounded live region.

Require the replacement indicator and exact approved styling in the same RED step:

```js
assert.match(renderSource, /indicator\.className = 'selection-indicator'/);
assert.match(renderSource, /indicator\.setAttribute\('aria-hidden', 'true'\)/);
assert.match(renderSource, /dot = document\.createElement\('span'\)/);
assert.doesNotMatch(renderSource, /dot\.addEventListener\('click'|role', 'tab'|tablist/);
assert.match(css, /\.selection-indicator\s*\{[^}]*width:\s*36px[^}]*height:\s*28px/);
assert.match(css, /\.selection-indicator\s*\{[^}]*bottom:/);
assert.match(css, /\.selection-indicator\s*\{[^}]*pointer-events:\s*none[^}]*user-select:\s*none/);
assert.doesNotMatch(css, /\.app-sheet\.edge-top \.selection-(?:dots|indicator)[^{]*\{[^}]*order:/);
```

- [ ] **Step 3: Run focused tests and verify RED**

```bash
"$NODE_BIN" --test tests/bible_selection_sheet.test.js tests/bible_sheet_controller.test.js
```

Expected: FAIL because buttons are currently excluded, the track does not follow live displacement, dots own keyboard behavior, and no Touch Events adapter exists.

- [ ] **Step 4: Implement the touch adapter and live pager**

Add one non-passive touch adapter on the sheet content/pager that converts the primary changed touch into the shared gesture input shape. It may claim vertical sheet dragging only when the scroller was at the relevant boundary at touch start and the initial vertical direction is unconsumable. Otherwise vertical motion stays native; it never transfers mid-scroll.

For horizontal selection ownership:

- permit only `.book-btn`, `.chapter-btn`, and `.verse-btn` button origins;
- apply the shared 8px axis lock;
- call `preventDefault()` only after horizontal claim;
- write live track displacement in the shared frame;
- clamp endpoint resistance;
- settle at most one page;
- arm a matching-target one-shot click guard for 500ms;
- retain that guard through ordinary release, cancellation, and lost capture;
- ignore `click.detail === 0`.

Deduplicate compatibility pointer/mouse events while an active touch identifier/generation exists.

The focused test must exercise the adapters, not only pure helpers: one touch followed by its compatibility pointer sequence produces exactly one page change, and cleanup restores the active touch-identifier count to zero.

- [ ] **Step 5: Implement panel semantics and focus relocation**

Before toggling panel `inert`/`aria-hidden`, record whether the old panel contains active focus. Keyboard paging focuses the first enabled control in the new panel. Pointer paging temporarily gives the new panel `tabindex="-1"`, focuses with `preventScroll`, and removes the temporary attribute on blur. Replace the interactive dots only after this keyboard path exists: render an `aria-hidden` indicator with three spans, update `.is-active` visually, and apply exact 36x28 Tonal Float CSS with bottom placement, seasonal translucency, blur, restrained shadow, `pointer-events:none`, and `user-select:none`.

- [ ] **Step 6: Run focused and full tests and verify GREEN**

```bash
"$NODE_BIN" --test tests/bible_selection_sheet.test.js tests/bible_sheet_controller.test.js
"$NODE_BIN" --test tests/*.test.js
```

Expected: all tests PASS, including real button-origin swipe simulations and lifecycle counts.

- [ ] **Step 7: Commit selector interaction**

```bash
git add bible.html tests/bible_selection_sheet.test.js tests/bible_sheet_controller.test.js
git commit -S -m "feat: enable mobile Bible selector swipes"
```

## Task 6: Add Dynamic Scroll Overflow Fades

**Files:**
- Create: `tests/bible_sheet_overflow_fade.test.js`
- Modify: `bible.html:1077-1089, 1120-1129, 2382-2608, 2890-3365`

- [ ] **Step 1: Create failing fade-state tests**

Create `tests/bible_sheet_overflow_fade.test.js` with source extraction and a fake scroller/RAF/ResizeObserver harness. Cover:

```js
test('fade state follows fitting, top, middle, and bottom scroll positions', () => {
  assert.deepEqual(fadeState({ scrollTop: 0, clientHeight: 300, scrollHeight: 300 }), { top: false, bottom: false });
  assert.deepEqual(fadeState({ scrollTop: 0, clientHeight: 300, scrollHeight: 700 }), { top: false, bottom: true });
  assert.deepEqual(fadeState({ scrollTop: 120, clientHeight: 300, scrollHeight: 700 }), { top: true, bottom: true });
  assert.deepEqual(fadeState({ scrollTop: 400, clientHeight: 300, scrollHeight: 700 }), { top: true, bottom: false });
  assert.deepEqual(fadeState({ scrollTop: Infinity, clientHeight: 300, scrollHeight: 700 }), { top: false, bottom: false });
  assert.deepEqual(fadeState({ scrollTop: '120', clientHeight: 300, scrollHeight: 700 }), { top: false, bottom: false });
});

test('fade lifecycle observes one active scroller and returns to baseline on cleanup', () => {
  const h = installFadeHarness();
  h.install(h.body);
  h.install(h.activePanel);
  assert.equal(h.observed(), h.activePanel);
  h.scroll(); h.scroll(); h.resize();
  assert.equal(h.pendingFrames(), 1);
  h.cleanup();
  assert.equal(h.listenerCount(), 0);
  assert.equal(h.observerCount(), 0);
  assert.equal(h.pendingFrames(), 0);
});
```

Also assert fades have `pointer-events:none`, `aria-hidden="true"`, remain inside the content frame, sit below the Tonal Float/handle, and use the sheet surface color. Add RED assertions requiring reduced motion to remove fade/indicator transitions and forced colors to replace translucent fade/indicator treatment with system colors while preserving their decorative/noninteractive behavior.

- [ ] **Step 2: Run the new test and verify RED**

```bash
"$NODE_BIN" --test tests/bible_sheet_overflow_fade.test.js
```

Expected: FAIL because fade helpers and lifecycle do not exist.

- [ ] **Step 3: Implement the fade helper and lifecycle**

Add:

```js
function appSheetOverflowFadeState(scroller) {
  if (!scroller) return { top: false, bottom: false };
  var values = [scroller.scrollTop, scroller.clientHeight, scroller.scrollHeight];
  if (!values.every(function (value) { return typeof value === 'number' && isFinite(value) && value >= 0; })) {
    return { top: false, bottom: false };
  }
  var top = scroller.scrollTop;
  var client = scroller.clientHeight;
  var total = scroller.scrollHeight;
  return { top: top > 1, bottom: top + client < total - 1 };
}
```

Add `installAppSheetOverflowFades(scroller)`, `scheduleAppSheetOverflowFades()`, `renderAppSheetOverflowFades(generation)`, and `cleanupAppSheetOverflowFades()`. Observe exactly one scroller: generic body normally, active selector panel for selection. Retarget after page settle and snap change. Coalesce scroll/resize updates into one RAF and generation-check every callback.

Use exact seasonal CSS and reserve the indicator inset so the bottom fade does not visually cut through Tonal Float:

```css
.app-sheet-fade { position:absolute; left:0; right:0; height:28px; z-index:2; opacity:0; pointer-events:none; transition:opacity 160ms var(--motion-ease); }
.app-sheet-fade-top { top:0; background:linear-gradient(to bottom, var(--surface), color-mix(in srgb, var(--surface) 0%, transparent)); }
.app-sheet-fade-bottom { bottom:0; background:linear-gradient(to top, var(--surface), color-mix(in srgb, var(--surface) 0%, transparent)); }
.app-sheet-content-frame.has-top-overflow .app-sheet-fade-top,
.app-sheet-content-frame.has-bottom-overflow .app-sheet-fade-bottom { opacity:1; }
.app-sheet.selection-sheet-open .app-sheet-fade-bottom { bottom:28px; }
@media (prefers-reduced-motion: reduce) {
  .app-sheet-fade, .selection-indicator, .selection-indicator-dot { transition:none; }
}
@media (forced-colors: active) {
  .app-sheet-fade-top { background:linear-gradient(to bottom, Canvas, transparent); forced-color-adjust:none; }
  .app-sheet-fade-bottom { background:linear-gradient(to top, Canvas, transparent); forced-color-adjust:none; }
  .selection-indicator { background:Canvas; box-shadow:none; forced-color-adjust:auto; }
  .selection-indicator-dot { background:GrayText; }
  .selection-indicator-dot.is-active { background:Highlight; }
}
```

- [ ] **Step 4: Run focused and full tests and verify GREEN**

```bash
"$NODE_BIN" --test tests/bible_sheet_overflow_fade.test.js tests/bible_selection_sheet.test.js tests/bible_sheet_controller.test.js
"$NODE_BIN" --test tests/*.test.js
```

Expected: all tests PASS and fade cleanup returns listener/observer/frame counts to baseline.

- [ ] **Step 5: Commit overflow fades**

```bash
git add bible.html tests/bible_sheet_overflow_fade.test.js tests/bible_selection_sheet.test.js tests/bible_sheet_controller.test.js
git commit -S -m "feat: fade overflowing Bible sheet content"
```

## Task 7: Integrated Security, Leak, Accessibility, and Browser Verification

**Files:**
- Modify if a discovered defect requires it: `bible.html`
- Modify if a regression test is required: `tests/bible_sheet_controller.test.js`, `tests/bible_selection_sheet.test.js`, `tests/bible_sheet_overflow_fade.test.js`, or `tests/bible_ui_accessibility.test.js`

- [ ] **Step 1: Run syntax, whitespace, full tests, and secret/PII scans**

```bash
"$NODE_BIN" --check bible.html
"$NODE_BIN" --test tests/*.test.js
git diff --check
git diff --check master...HEAD
rg -n "AKIA[0-9A-Z]{16}|-----BEGIN .*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9_]{20,}|xox[baprs]-|sk-[A-Za-z0-9]{20,}" bible.html tests docs/superpowers
```

Expected: syntax check succeeds, all tests PASS, diff check emits no output, and credential scan emits no matches. If `node --check bible.html` rejects HTML framing rather than inline JavaScript, extract the inline script into `/tmp/bible-inline.js` without modifying the repo and run `node --check` on that file.

- [ ] **Step 2: Run mutation-sensitive lifecycle checks**

Confirm tests fail when each critical guard is locally mutated in-memory: live-drag transition disabling, generation comparison, 70dvh cap, adjacent-state threshold, click-guard retention through lost capture, inactive-panel inerting, focus-policy mapping, observer disconnect, and fade `pointer-events:none`.

Expected: every mutant is rejected by at least one focused test.

- [ ] **Step 3: Start the local app and perform in-app browser QA**

Serve the worktree with the existing local static-server workflow and use the Browser plugin. The flow under test is:

```text
Bible reader -> open each sheet -> drag determined/fullscreen/closed -> scroll overflow -> swipe selector pages -> close -> launcher returns neutral
```

At desktop and 320x720 mobile viewports verify:

- History, Settings, Search, and verse actions open to natural height when short.
- Long Search and selection content initially cap at 70dvh.
- Top sheets place the handle at the bottom; bottom sheets place it at the top.
- Tonal Float remains at the bottom in both orientations.
- Top/bottom fades appear only while more content exists beyond that edge.
- Horizontal swipes start on real book/chapter/verse cells and follow the finger.
- Vertical native scroll is not stolen; a boundary-origin drag follows the finger without trailing easing.
- Determined/fullscreen/closed snaps are stable and fullscreen never skips directly to closed.
- Drag/backdrop close clears History, Search, Settings, and navbar launcher highlighting.
- Keyboard Escape, handle arrows/Enter/Space, selector Alt+Arrow paging, focus relocation, and reduced motion work.
- No relevant console error or warning occurs.

Capture before/after mobile screenshots outside the repository and record any mismatch against the approved Tonal Float mockup.

- [ ] **Step 4: Fix each discovered defect test-first**

For every browser or integration defect, add the smallest failing regression test to the relevant existing test file, verify RED, make the minimal production change, verify GREEN, run `git diff --check`, then rerun the focused browser interaction. Do not batch unrelated fixes.

- [ ] **Step 5: Commit any QA-only regression fix separately**

If Task 7 changed code or tests:

```bash
git add bible.html tests
git commit -S -m "fix: polish Bible sheet interactions"
```

If no defect was found, do not create an empty commit.

- [ ] **Step 6: Run final verification after every commit**

```bash
"$NODE_BIN" --test tests/*.test.js
git diff --check master...HEAD
git status --short
git log --show-signature --format='%h %G? %s' master..HEAD
```

Expected: all tests PASS, working-tree and branch diff checks are clean, the worktree is clean, and every implementation commit reports signature status `G`.

---

## Final Review Checklist

- [ ] Exactly three stable sheet states remain: closed, determined, fullscreen.
- [ ] Determined height is natural content height capped at 70dvh.
- [ ] Live drag uses no trailing transition and at most one write frame.
- [ ] Release moves only one adjacent state using the exact tested thresholds.
- [ ] Visible close starts before history traversal and is generation-safe.
- [ ] All close reasons have an immutable focus policy and clear launcher state.
- [ ] Sheet title/header/X are absent; trusted kind labels and keyboard close paths remain.
- [ ] Tonal Float is 36x28, bottom-positioned, decorative, and noninteractive.
- [ ] Top-sheet handle is bottom-positioned; bottom-sheet handle is top-positioned.
- [ ] Selector swipes begin on grid buttons without breaking taps or keyboard activation.
- [ ] Native scrolling, boundary dragging, and horizontal paging have exclusive ownership.
- [ ] Dynamic fades match actual overflow and release every resource.
- [ ] Static registry remains the sole renderer-function trust boundary.
- [ ] Owner isolation and privacy-safe history/search behavior remain unchanged.
- [ ] Full automated suite, browser QA, secret scan, signature check, and diff check pass.
