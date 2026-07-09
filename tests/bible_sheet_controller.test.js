const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const biblePath = process.env.BIBLE_UNDER_TEST || path.join(root, 'bible.html');
const bible = fs.readFileSync(biblePath, 'utf8');

const dialogs = [...bible.matchAll(/<dialog\b[^>]*\bid="app-sheet"[^>]*>/g)];
assert.equal(dialogs.length, 1, 'one persistent app sheet dialog is present');
assert.match(dialogs[0][0], /aria-label="Bible panel"/);
assert.match(bible, /id="app-sheet-handle"[^>]*aria-label="Expand Bible panel"/);
assert.match(bible, /id="app-sheet-body"[^>]*tabindex="0"/);
assert.match(bible, /id="app-sheet-measure" class="app-sheet-measure"/);
assert.match(bible, /class="app-sheet-fade app-sheet-fade-top" aria-hidden="true"/);
assert.match(bible, /class="app-sheet-fade app-sheet-fade-bottom" aria-hidden="true"/);
assert.doesNotMatch(bible, /aria-labelledby="app-sheet-title"|id="app-sheet-title"|id="app-sheet-close"/);
assert.doesNotMatch(bible, /var appSheetTitle|var appSheetClose|appSheetClose\.addEventListener/);
assert.match(bible, /\.app-sheet\.edge-top/);
assert.match(bible, /\.app-sheet\.snap-determined[\s\S]*var\(--sheet-height, min\(70dvh,\s*720px\)\)/);
assert.match(bible, /\.app-sheet\.snap-fullscreen[\s\S]*100dvh/);
assert.match(bible, /\.app-sheet::backdrop[\s\S]*backdrop-filter: blur\(3px\)/);
assert.match(bible, /env\(safe-area-inset-bottom/);
assert.match(bible, /env\(safe-area-inset-top/);
assert.match(bible, /\.app-sheet\.snap-fullscreen[\s\S]*padding-top: env\(safe-area-inset-top/,
  'bottom-edge fullscreen preserves the top safe area');
assert.match(bible, /\.app-sheet\.edge-top \.app-sheet-handle\s*\{[^}]*order:\s*3/);
assert.match(bible, /\.app-sheet-shell\s*\{[^}]*grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s*;/,
  'bottom-edge sheet keeps the intrinsic handle above flexible content');
assert.match(bible,
  /\.app-sheet\.edge-top \.app-sheet-shell\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\)\s+auto\s*;/,
  'top-edge sheet swaps the flexible content and intrinsic handle row tracks');
assert.match(bible, /\.app-sheet\.is-dragging\s*\{[^}]*height:\s*var\(--sheet-live-height\)[^}]*transition:\s*none/s,
  'dragging consumes RAF-authored live height without transitions');
assert.match(bible, /\.app-sheet\.is-dragging::backdrop\s*\{[^}]*transition:\s*none/s,
  'dragging backdrop has no transition latency');

function controllerFunction(name) {
  const match = bible.match(new RegExp('  function ' + name + '\\([^\\n]*\\) \\{[\\s\\S]*?\\n  \\}'));
  assert.ok(match, name + ' controller function is present');
  return match[0];
}

assert.doesNotMatch(controllerFunction('openAppSheet'), /options\.(?:render|content)/,
  'openAppSheet cannot accept executable renderer callbacks');

function runHandleKeys(options) {
  const appSheet = fakeElement();
  const appSheetHandle = fakeElement();
  const closeCalls = [];
  const snapCalls = [];
  const context = {
    appSheet,
    appSheetHandle,
    appSheetState: { edge: options.edge, snap: options.snap, kind: options.kind, phase: options.phase || 'idle' },
    resolveAppSheetDescriptor(kind) {
      const labels = { history: 'History', settings: 'Settings', search: 'Search', selection: 'Selection',
        'verse-actions': 'Verse Actions' };
      return labels[kind] ? { label: labels[kind] } : null;
    },
    setSheetSnap(snap) {
      snapCalls.push(snap);
      context.appSheetState.snap = snap;
      context.syncAppSheetAccessibleState();
      return true;
    },
    requestCloseAppSheet(...args) { closeCalls.push(args); return true; }
  };
  vm.runInNewContext(controllerFunction('syncAppSheetAccessibleState') + '\n' +
    controllerFunction('onAppSheetHandleKeyDown') +
    '\nthis.syncAppSheetAccessibleState = syncAppSheetAccessibleState;' +
    '\nthis.onAppSheetHandleKeyDown = onAppSheetHandleKeyDown;', context);
  context.syncAppSheetAccessibleState();
  return {
    dispatch(key, repeat = false) {
      const event = { key, repeat, prevented: false, preventDefault() { this.prevented = true; } };
      context.onAppSheetHandleKeyDown(event);
      return event;
    },
    snap: () => context.appSheetState.snap,
    dialogLabel: () => appSheet.getAttribute('aria-label'),
    handleLabel: () => appSheetHandle.getAttribute('aria-label'),
    snapCalls: () => snapCalls,
    closeCalls: () => closeCalls
  };
}

{
  let harness = runHandleKeys({ edge: 'bottom', snap: 'determined', kind: 'history' });
  let event = harness.dispatch('Enter');
  assert.equal(event.prevented, true);
  assert.equal(harness.snap(), 'fullscreen');
  assert.equal(harness.dialogLabel(), 'History — Bible panel');
  assert.equal(harness.handleLabel(), 'Restore History panel size');

  event = harness.dispatch(' ');
  assert.equal(event.prevented, true);
  assert.equal(harness.snap(), 'determined');
  assert.equal(harness.handleLabel(), 'Expand History panel');

  harness = runHandleKeys({ edge: 'bottom', snap: 'determined', kind: 'history' });
  assert.equal(harness.dispatch('ArrowUp').prevented, true);
  assert.equal(harness.snap(), 'fullscreen');
  harness = runHandleKeys({ edge: 'bottom', snap: 'determined', kind: 'history' });
  assert.equal(harness.dispatch('ArrowDown').prevented, true);
  assert.deepEqual(harness.closeCalls(), [['keyboard-handle', 'restore-opener']]);

  harness = runHandleKeys({ edge: 'top', snap: 'determined', kind: 'search' });
  assert.equal(harness.dispatch('ArrowDown').prevented, true);
  assert.equal(harness.snap(), 'fullscreen');
  harness = runHandleKeys({ edge: 'top', snap: 'determined', kind: 'search' });
  assert.equal(harness.dispatch('ArrowUp').prevented, true);
  assert.deepEqual(harness.closeCalls(), [['keyboard-handle', 'restore-opener']]);

  harness = runHandleKeys({ edge: 'bottom', snap: 'fullscreen', kind: 'settings' });
  assert.equal(harness.dispatch('ArrowDown').prevented, true);
  assert.equal(harness.snap(), 'determined');
  harness = runHandleKeys({ edge: 'top', snap: 'fullscreen', kind: 'settings' });
  assert.equal(harness.dispatch('ArrowUp').prevented, true);
  assert.equal(harness.snap(), 'determined');

  harness = runHandleKeys({ edge: 'bottom', snap: 'fullscreen', kind: 'settings' });
  assert.equal(harness.dispatch('ArrowUp').prevented, true);
  assert.equal(harness.snap(), 'fullscreen');
  harness = runHandleKeys({ edge: 'top', snap: 'fullscreen', kind: 'settings' });
  assert.equal(harness.dispatch('ArrowDown').prevented, true);
  assert.equal(harness.snap(), 'fullscreen');

  event = harness.dispatch('Escape');
  assert.equal(event.prevented, true);
  assert.deepEqual(harness.closeCalls(), [['keyboard-handle', 'restore-opener']]);

  for (const edge of ['bottom', 'top']) {
    for (const key of ['Enter', ' ', 'ArrowUp', 'ArrowDown']) {
      harness = runHandleKeys({ edge, snap: 'determined', kind: 'settings', phase: 'opening' });
      event = harness.dispatch(key);
      assert.equal(event.prevented, false, `opening ${edge}/${key} remains native and ignored`);
      assert.equal(harness.snap(), 'determined');
      assert.deepEqual(harness.snapCalls(), []);
      assert.deepEqual(harness.closeCalls(), []);
    }
  }
  harness = runHandleKeys({ edge: 'bottom', snap: 'determined', kind: 'settings', phase: 'opening' });
  event = harness.dispatch('Escape');
  assert.equal(event.prevented, true, 'opening Escape retains the unified close path');
  assert.deepEqual(harness.closeCalls(), [['keyboard-handle', 'restore-opener']]);

  for (const edge of ['bottom', 'top']) {
    for (const snap of ['determined', 'fullscreen']) {
      for (const key of ['Enter', ' ', 'ArrowUp', 'ArrowDown', 'Escape']) {
        harness = runHandleKeys({ edge, snap, kind: 'settings' });
        const dialogLabel = harness.dialogLabel();
        const handleLabel = harness.handleLabel();
        event = harness.dispatch(key, true);
        assert.equal(event.prevented, false, `repeat ${edge}/${snap}/${key} is ignored before handling`);
        assert.equal(harness.snap(), snap, `repeat ${edge}/${snap}/${key} preserves snap`);
        assert.deepEqual(harness.snapCalls(), [], `repeat ${edge}/${snap}/${key} never invokes the snap setter`);
        assert.deepEqual(harness.closeCalls(), [], `repeat ${edge}/${snap}/${key} never closes`);
        assert.equal(harness.dialogLabel(), dialogLabel);
        assert.equal(harness.handleLabel(), handleLabel);
      }
    }
  }
}

const pureStart = bible.indexOf('/* APP SHEET PURE HELPERS START */');
const pureEnd = bible.indexOf('/* APP SHEET PURE HELPERS END */');
assert.ok(pureStart >= 0 && pureEnd > pureStart, 'pure sheet decisions are testable');
const pureSource = bible.slice(pureStart, pureEnd) + '\nthis.hooks = {' +
  'validKind: isValidAppSheetKind, validEdge: isValidAppSheetEdge, validSnap: isValidAppSheetSnap,' +
  'validAnchor: isValidAppSheetAnchor,' +
  'finite: isFiniteAppSheetNumber, determinedHeight: appSheetDeterminedHeight,' +
  'width: appSheetDeterminedWidth, anchor: appSheetHorizontalAnchor,' +
  'effectiveDistance: appSheetEffectiveSnapDistance, outcome: appSheetReleaseOutcome,' +
  'visual: appSheetGestureVisual,' +
  'axis: appSheetAxis, boundary: appSheetBoundaryAllowsDrag, phases: APP_SHEET_PHASES,' +
  'constants: [APP_SHEET_AXIS_LOCK_PX, APP_SHEET_SNAP_PX, APP_SHEET_SNAP_VELOCITY,' +
  'APP_SHEET_VELOCITY_RECENCY_MS, APP_SHEET_MAX_VELOCITY, APP_SHEET_CLICK_GUARD_MS,' +
  'APP_SHEET_OPEN_CLOSE_MS, APP_SHEET_RESIZE_MS],' +
  'state: validatedAppSheetHistoryState};';
const context = { Math };
vm.runInNewContext(pureSource, context);
const h = context.hooks;

assert.equal(h.validKind('history'), true);
assert.equal(h.validKind('verse-actions'), true, 'verse actions is an approved sheet kind');
assert.equal(h.validKind('__proto__'), false, 'kind enum rejects inherited/property attacks');
assert.equal(h.validEdge('top'), true);
assert.equal(h.validEdge('side'), false);
assert.equal(h.validSnap('fullscreen'), true);
assert.equal(h.validSnap('determined'), true);
assert.equal(h.validSnap('compact'), false);
assert.equal(h.validSnap('half'), false);
assert.equal(h.validAnchor('left'), true);
assert.equal(h.validAnchor('right'), true);
assert.equal(h.validAnchor('center'), false);
assert.equal(h.validAnchor('__proto__'), false, 'anchor enum rejects inherited/property attacks');
assert.equal(h.validAnchor(0), false, 'anchor enum rejects non-string values');
assert.deepEqual(Array.from(h.phases), ['closed', 'opening', 'idle', 'dragging', 'settling', 'closing']);
assert.deepEqual(Array.from(h.constants), [8, 80, .4, 80, 3, 500, 280, 320]);

assert.equal(h.finite(0), true);
assert.equal(h.finite(-1), true);
assert.equal(h.finite('1'), false, 'numeric strings are not geometry');
assert.equal(h.finite(Infinity), false);
assert.equal(h.finite(-Infinity), false);
assert.equal(h.finite(NaN), false);
assert.equal(h.finite(new Number(1)), false);

assert.equal(h.width(180, 40, 1200, 220, 24, false), 220,
  'desktop sheet width respects its minimum');
assert.equal(h.width(179, 40, 1200, 220, 24, false), 220,
  'intrinsic width below the minimum is raised to the minimum');
assert.equal(h.width(420, 40, 1200, 220, 24, false), 460,
  'desktop sheet width includes fixed chrome');
assert.equal(h.width(900, 40, 1200, 220, 24, false), 600,
  'desktop sheet width caps at half the viewport');
assert.equal(h.width(120, 40, 1200, 220, 24, true), 600,
  'panel-filling desktop sheets use the available maximum');
assert.equal(h.width(300, 40, 500, 100, 300, false), 200,
  'viewport-minus-gutter can be the limiting width');
assert.equal(h.width(900, 40, 1001, 220, 24, false), 500,
  'fractional maximum width is floored');
assert.equal(h.width(180.2, 40.1, 1200, 220, 24, false), 221,
  'fractional intrinsic width is rounded up');
assert.equal(h.width(180, 40, 300, 220, 24, false), 150,
  'a positive viewport maximum below the minimum remains usable');
assert.equal(h.width(0, 0, 100, 220, 100, false), null,
  'a nonpositive viewport maximum below the minimum is unusable');

const invalidWidthInputs = [
  ['negative content', [-1, 40, 1200, 220, 24, false]],
  ['infinite content', [Infinity, 40, 1200, 220, 24, false]],
  ['negative infinite content', [-Infinity, 40, 1200, 220, 24, false]],
  ['NaN content', [NaN, 40, 1200, 220, 24, false]],
  ['string content', ['180', 40, 1200, 220, 24, false]],
  ['boxed content', [new Number(180), 40, 1200, 220, 24, false]],
  ['negative chrome', [180, -1, 1200, 220, 24, false]],
  ['infinite chrome', [180, Infinity, 1200, 220, 24, false]],
  ['negative infinite chrome', [180, -Infinity, 1200, 220, 24, false]],
  ['NaN chrome', [180, NaN, 1200, 220, 24, false]],
  ['string chrome', [180, '40', 1200, 220, 24, false]],
  ['boxed chrome', [180, new Number(40), 1200, 220, 24, false]],
  ['zero viewport', [180, 40, 0, 220, 24, false]],
  ['negative viewport', [180, 40, -1, 220, 24, false]],
  ['infinite viewport', [180, 40, Infinity, 220, 24, false]],
  ['negative infinite viewport', [180, 40, -Infinity, 220, 24, false]],
  ['NaN viewport', [180, 40, NaN, 220, 24, false]],
  ['string viewport', [180, 40, '1200', 220, 24, false]],
  ['boxed viewport', [180, 40, new Number(1200), 220, 24, false]],
  ['zero minimum', [180, 40, 1200, 0, 24, false]],
  ['negative minimum', [180, 40, 1200, -1, 24, false]],
  ['infinite minimum', [180, 40, 1200, Infinity, 24, false]],
  ['negative infinite minimum', [180, 40, 1200, -Infinity, 24, false]],
  ['NaN minimum', [180, 40, 1200, NaN, 24, false]],
  ['string minimum', [180, 40, 1200, '220', 24, false]],
  ['boxed minimum', [180, 40, 1200, new Number(220), 24, false]],
  ['negative gutter', [180, 40, 1200, 220, -1, false]],
  ['infinite gutter', [180, 40, 1200, 220, Infinity, false]],
  ['negative infinite gutter', [180, 40, 1200, 220, -Infinity, false]],
  ['NaN gutter', [180, 40, 1200, 220, NaN, false]],
  ['string gutter', [180, 40, 1200, 220, '24', false]],
  ['boxed gutter', [180, 40, 1200, 220, new Number(24), false]],
  ['numeric fillsPanel', [180, 40, 1200, 220, 24, 0]],
  ['string fillsPanel', [180, 40, 1200, 220, 24, 'false']],
  ['null fillsPanel', [180, 40, 1200, 220, 24, null]],
  ['undefined fillsPanel', [180, 40, 1200, 220, 24, undefined]],
  ['boxed fillsPanel', [180, 40, 1200, 220, 24, new Boolean(false)]]
];
for (const [label, args] of invalidWidthInputs) {
  assert.equal(h.width(...args), null, `invalid determined width input: ${label}`);
}

assert.equal(h.anchor(0, 80, 1200), 'left');
assert.equal(h.anchor(560, 80, 1200), 'right', 'midpoint ties anchor right');
assert.equal(h.anchor(900, 80, 1200), 'right');
const invalidAnchorInputs = [
  ['infinite opener left', [Infinity, 80, 1200]],
  ['negative infinite opener left', [-Infinity, 80, 1200]],
  ['NaN opener left', [NaN, 80, 1200]],
  ['string opener left', ['0', 80, 1200]],
  ['boxed opener left', [new Number(0), 80, 1200]],
  ['negative opener width', [0, -1, 1200]],
  ['infinite opener width', [0, Infinity, 1200]],
  ['negative infinite opener width', [0, -Infinity, 1200]],
  ['NaN opener width', [0, NaN, 1200]],
  ['string opener width', [0, '80', 1200]],
  ['boxed opener width', [0, new Number(80), 1200]],
  ['zero viewport', [0, 80, 0]],
  ['negative viewport', [0, 80, -1]],
  ['infinite viewport', [0, 80, Infinity]],
  ['negative infinite viewport', [0, 80, -Infinity]],
  ['NaN viewport', [0, 80, NaN]],
  ['string viewport', [0, 80, '1200']],
  ['boxed viewport', [0, 80, new Number(1200)]]
];
for (const [label, args] of invalidAnchorInputs) {
  assert.equal(h.anchor(...args), null, `invalid horizontal anchor input: ${label}`);
}

assert.equal(h.determinedHeight(176, 48, 800), 224, 'short content keeps its natural height');
assert.equal(h.determinedHeight(900, 48, 800), 560, 'long content caps at floor(70dvh)');
assert.equal(h.determinedHeight(0, 560.1, 800), null, 'fixed chrome that rounds above the cap is impossible');
assert.equal(h.determinedHeight(0, 559.1, 800), 560, 'fixed chrome is rounded up before comparison');
assert.equal(h.determinedHeight(0, 0, 800), null, 'a determined sheet must have positive height');
for (const args of [
  [-1, 48, 800], [176, -1, 800], [176, 48, 0], [176, 48, -1],
  [Infinity, 48, 800], [176, Infinity, 800], [176, 48, Infinity], ['176', 48, 800]
]) assert.equal(h.determinedHeight(...args), null, `invalid determined height input: ${String(args)}`);

assert.equal(h.effectiveDistance(40), 40);
assert.equal(h.effectiveDistance(80), 80);
assert.equal(h.effectiveDistance(120), 80);
for (const value of [0, -1, Infinity, NaN, '40']) {
  assert.equal(h.effectiveDistance(value), null, `invalid adjacent distance: ${String(value)}`);
}

assert.equal(h.axis(7, 7), null, 'axis remains unlocked before 8px');
assert.equal(h.axis(9, 2), 'x', 'horizontal motion locks horizontal');
assert.equal(h.axis(2, -9), 'y', 'vertical motion locks vertical');
assert.equal(h.boundary('bottom', 1, 0, 100, 500), true, 'bottom close drag starts at scroll top');
assert.equal(h.boundary('bottom', 1, 12, 100, 500), false, 'nested scroll consumes bottom close drag');
assert.equal(h.boundary('top', -1, 400, 100, 500), true, 'top close drag starts at scroll bottom');
assert.equal(h.boundary('top', -1, 350, 100, 500), false);

assert.deepEqual(JSON.parse(JSON.stringify(h.visual('bottom', 'determined', 200, 600, -40))),
  { height: 240, offset: 0, backdrop: 1 }, 'bottom inward drag grows determined sheet in place');
assert.deepEqual(JSON.parse(JSON.stringify(h.visual('bottom', 'determined', 200, 600, 40))),
  { height: 200, offset: 40, backdrop: .8 }, 'bottom outward drag keeps height frozen and follows the finger');
assert.deepEqual(JSON.parse(JSON.stringify(h.visual('top', 'determined', 200, 600, -40))),
  { height: 200, offset: -40, backdrop: .8 }, 'top outward drag uses the edge-signed offset');
assert.deepEqual(JSON.parse(JSON.stringify(h.visual('bottom', 'fullscreen', 200, 600, 40))),
  { height: 560, offset: 0, backdrop: 1 }, 'fullscreen only shrinks toward its adjacent determined state');
assert.deepEqual(JSON.parse(JSON.stringify(h.visual('bottom', 'fullscreen', 200, 600, -40))),
  { height: 600, offset: 0, backdrop: 1 }, 'fullscreen cannot drag into a nonexistent inward state');
for (const args of [
  ['side', 'determined', 200, 600, 10], ['bottom', 'compact', 200, 600, 10],
  ['bottom', 'determined', '200', 600, 10], ['bottom', 'determined', 200, '600', 10],
  ['bottom', 'determined', 200, 600, '10'], ['bottom', 'determined', Infinity, 600, 10],
  ['bottom', 'determined', 0, 600, 10], ['bottom', 'determined', 600, 600, 10]
]) assert.equal(h.visual(...args), null, `invalid visual geometry: ${String(args)}`);

const release = (edge, snap, displacement, velocity, determinedHeight = 224, viewportHeight = 800,
  velocityAge = 0) => h.outcome(edge, snap, displacement, velocity, determinedHeight, viewportHeight, velocityAge);
assert.equal(release('bottom', 'determined', -80, -0.1), 'fullscreen', 'bottom inward expands at threshold');
assert.equal(release('bottom', 'determined', 80, 0.1), 'closed', 'bottom outward closes at threshold');
assert.equal(release('top', 'determined', 80, 0.1), 'fullscreen', 'top inward expands at threshold');
assert.equal(release('top', 'determined', -80, -0.1), 'closed', 'top outward closes at threshold');
assert.equal(release('bottom', 'fullscreen', 80, 0.1), 'determined', 'fullscreen moves outward only');
assert.equal(release('top', 'fullscreen', -80, -0.1), 'determined');
assert.equal(release('bottom', 'fullscreen', -1000, -3), 'fullscreen', 'fullscreen has no inward state');
assert.equal(release('bottom', 'fullscreen', 500, 0), 'determined',
  'above-threshold displacement alone advances one state and kills equality-only comparison mutants');
assert.equal(release('bottom', 'determined', 79.999, 0), 'determined', 'below threshold stays put');
assert.equal(release('bottom', 'determined', 10, .4, 224, 800, 80), 'closed',
  'same-direction velocity qualifies through the exact recency window');
assert.equal(release('bottom', 'determined', 10, .399), 'determined',
  'positive velocity below threshold preserves the starting snap');
assert.equal(release('bottom', 'determined', -10, -.399), 'determined',
  'negative velocity below threshold preserves the starting snap');
assert.equal(release('bottom', 'determined', 0, .4, 224, 800, 81), 'determined', 'expired velocity is ignored');
assert.equal(release('bottom', 'determined', -10, .4), 'determined',
  'outward velocity is ignored after inward displacement');
assert.equal(release('bottom', 'determined', 10, -.4), 'determined',
  'inward velocity is ignored after outward displacement');
assert.equal(release('bottom', 'determined', 40, 0, 40, 800), 'closed',
  'short close distance is the effective threshold');
assert.equal(release('bottom', 'determined', 39.999, 0, 40, 800), 'determined');
assert.equal(release('bottom', 'determined', -40, 0, 560, 600), 'fullscreen',
  'short expand distance is direction-specific');
assert.equal(release('bottom', 'determined', -39.999, 0, 560, 600), 'determined');
for (const args of [
  ['side', 'determined', 80, 0, 224, 800, 0],
  ['bottom', 'compact', 80, 0, 224, 800, 0],
  ['bottom', 'determined', '80', 0, 224, 800, 0],
  ['bottom', 'determined', 80, Infinity, 224, 800, 0],
  ['bottom', 'determined', 80, 0, '224', 800, 0],
  ['bottom', 'determined', 80, 0, 224, 800, -1],
  ['bottom', 'determined', 80, 0, 800, 800, 0]
]) assert.equal(h.outcome(...args), null, `invalid release input: ${String(args)}`);
const validReleaseFields = ['bottom', 'determined', 80, 0, 224, 800, 0];
for (const fieldIndex of [2, 3, 4, 5, 6]) {
  for (const invalidValue of ['1', Infinity]) {
    const invalidFields = validReleaseFields.slice();
    invalidFields[fieldIndex] = invalidValue;
    assert.equal(h.outcome(...invalidFields), null,
      `release numeric field ${fieldIndex} rejects ${String(invalidValue)}`);
  }
}

const validState = h.state({
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'history', page: 'recent' }
});
assert.deepEqual(JSON.parse(JSON.stringify(validState)), {
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  readerRouteScope: 0,
  sheet: { kind: 'history', page: 'recent' }
});
const generatedState = h.state({
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'history', page: 'recent', generation: 7, returnGeneration: 5 }
});
assert.equal(generatedState.sheet.generation, 7, 'validated sheet history preserves only a strict scalar generation token');
assert.equal(generatedState.sheet.returnGeneration, 5, 'history-chain token is independently scalar-validated');
assert.equal(h.state({
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'history', generation: '7' }
}), null, 'history generation tokens reject coercion');
assert.equal(h.state({
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'history', generation: 7, returnGeneration: '5' }
}), null, 'history-chain tokens reject coercion');
assert.equal(h.state({ view: 'books', sheet: { kind: 'history' } }), null);
assert.equal(h.state({ view: 'verses', book: '', chapter: '3', verse: '16', sheet: { kind: 'history' } }), null);
assert.equal(h.state({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'evil' } }), null);
assert.equal(h.state({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history', page: {} } }), null);
assert.equal(h.state({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history', page: '<script>' } }), null);

for (const field of ['kind', 'edge', 'snap', 'anchor', 'phase', 'generation', 'determinedHeight', 'determinedWidth', 'candidate', 'gesture',
  'pointer', 'frame', 'measureFrame', 'settleTimer', 'historyTimer', 'resizeObserver', 'contentCleanup',
  'historyState', 'historyReturnGeneration', 'historyOwned', 'pendingHistoryClose', 'pendingPostCloseState',
  'pendingPostCloseDestination',
  'opener', 'nativeOpener', 'focusPolicy']) {
  assert.match(bible, new RegExp('var appSheetState = \\{[\\s\\S]*' + field + ':'), `state explicitly owns ${field}`);
}
assert.doesNotMatch(controllerFunction('openAppSheet'), /options\.(?:render|content)/);
assert.doesNotMatch(controllerFunction('openAppSheet'), /options\.fillsPanel/,
  'callers cannot control the trusted panel-filling width policy');
assert.match(controllerFunction('registerAppSheetDescriptor'),
  /fillsPanel:\s*descriptor\.fillsPanel === true/,
  'descriptor registration reduces the trusted fill flag to an exact boolean');
assert.match(bible,
  /\.app-sheet-measure\.is-measuring-intrinsic\s*\{[^}]*width:\s*max-content;[^}]*max-width:\s*none;/,
  'intrinsic measurement state releases the ordinary block fill width');
assert.match(controllerFunction('appSheetIntrinsicWidth'),
  /classList\.add\('is-measuring-intrinsic'\)[\s\S]*try[\s\S]*source\.scrollWidth[\s\S]*finally[\s\S]*classList\.remove\('is-measuring-intrinsic'\)/,
  'intrinsic width reads always restore their temporary live-content state');
assert.match(bible,
  /registerAppSheetDescriptor\('selection',\s*\{[\s\S]*?render:[\s\S]*?fillsPanel:\s*true\s*\}\);/,
  'only the static Selection descriptor fills the desktop panel');
for (const kind of ['history', 'settings', 'search', 'verse-actions']) {
  assert.doesNotMatch(bible, new RegExp("registerAppSheetDescriptor\\('" + kind + "',[^;]*fillsPanel"),
    `${kind} descriptor remains intrinsic-width`);
}
assert.doesNotMatch(bible, /appSheetState\.closing/);
assert.match(bible, /function isCurrentAppSheetGeneration\(generation\)/);
assert.match(controllerFunction('handleAppSheetPopState'),
  /!isCurrentAppSheetHistoryToken\(validated\.sheet\)/,
  'old sheet-entry callbacks are rejected while a newer sheet is open');
assert.match(controllerFunction('isCurrentAppSheetHistoryToken'),
  /sheet\.generation === appSheetState\.generation[\s\S]*sheet\.returnGeneration === appSheetState\.historyReturnGeneration/,
  'tagged callbacks require matching runtime and immutable chain identities');
assert.match(controllerFunction('handleAppSheetPopState'),
  /state\.sheetReturnGeneration !== appSheetState\.historyReturnGeneration/,
  'old close callbacks are rejected while a newer sheet is open');
assert.match(bible, /function applyTextScale\([\s\S]*scheduleAppSheetMeasurement\(appSheetState\.generation\)/,
  'text scale changes remeasure an open determined sheet');
assert.match(bible, /function finishSelectionPageSettle\([\s\S]*retargetAppSheetMeasurement\(\)/,
  'settled selection pages retarget intrinsic measurement');
assert.match(bible, /pendingHistoryClose: false/);
assert.match(bible, /function installAppSheetListeners\(\)[\s\S]*if \(appSheetListenersInstalled\) return;[\s\S]*appSheetHandle\.addEventListener\('pointerdown'/);
assert.equal((bible.match(/installAppSheetListeners\(\);/g) || []).length, 1, 'listener installation has one startup call');
assert.match(bible, /setPointerCapture\(candidate\.id\)/);
assert.match(bible, /'pointercancel'/);
assert.match(bible, /'lostpointercapture'/);
assert.match(bible, /cancelAnimationFrame\(appSheetState\.frame\)/);
assert.match(bible, /appSheetState\.pointer = null/);
assert.match(bible, /shouldReduceVerseMotion\(\)[\s\S]*setSheetSnap/);
assert.match(bible, /function openAppSheet\(kind, options\)/);
assert.match(bible, /function setSheetSnap\(snap, immediate\)/);
assert.doesNotMatch(controllerFunction('setSheetSnap'), /offsetHeight/, 'snap changes avoid forced synchronous layout');
assert.match(bible, /function requestCloseAppSheet\(source, focusPolicy\)/);
assert.match(bible, /function finishCloseAppSheet\(\)/);
for (const name of ['beginAppSheetGesture', 'claimAppSheetGesture', 'updateAppSheetGesture',
  'renderAppSheetGestureFrame', 'clearAppSheetGestureResources', 'finishAppSheetGesture',
  'cancelAppSheetGesture']) assert.match(bible, new RegExp('function ' + name + '\\('), `${name} is shared and named`);
const updateGestureSource = bible.slice(bible.indexOf('  function updateAppSheetGesture('),
  bible.indexOf('  function clearAppSheetGestureResources('));
const renderGestureSource = bible.slice(bible.indexOf('  function renderAppSheetGestureFrame('),
  bible.indexOf('  function updateAppSheetGesture('));
assert.doesNotMatch(updateGestureSource + renderGestureSource,
  /offsetHeight|getBoundingClientRect|scrollTop|scrollHeight|clientHeight/,
  'claimed gesture update and render paths perform no synchronous layout reads');
assert.match(bible, /history\.pushState\(historyState, '', window\.location\.href\)/);
assert.match(bible, /history\.replaceState\(historyState, '', window\.location\.href\)/);
assert.match(bible, /if \(appSheetState\.historyOwned && source !== 'popstate'\)[\s\S]*history\.back\(\)/);
assert.match(bible, /function handleAppSheetPopState\(state\)[\s\S]*validatedAppSheetHistoryState\(state\)[\s\S]*openAppSheet/);
assert.match(bible, /if \(handleAppSheetPopState\(s\)\) return;/);
assert.match(bible, /function handleBibleKeyboardNavigation\(e\) \{[\s\S]*if \(appSheet && appSheet\.open\) return;/);
assert.match(bible, /appSheetState\.opener[\s\S]*\.isConnected[\s\S]*\.focus/);
assert.match(bible, /appSheetState\.contentCleanup\(\)/);
assert.doesNotMatch(bible, /appSheetBody\.innerHTML/);
assert.equal((bible.match(/fabMain\.setAttribute\('aria-expanded'/g) || []).length, 1,
  'shared sheet lifecycle is the sole writer of Settings launcher expansion');

function fakeElement() {
  const listeners = Object.create(null);
  const classes = new Set();
  const properties = Object.create(null);
  const writes = Object.create(null);
  const captures = new Set();
  const attributes = Object.create(null);
  return {
    open: false,
    isConnected: true,
    offsetHeight: 500,
    scrollTop: 0,
    clientHeight: 400,
    scrollHeight: 400,
    scrollWidth: 400,
    rectHeight: 0,
    get styleWriteCount() { return writes['--sheet-height'] || 0; },
    get widthStyleWriteCount() { return writes['--sheet-width'] || 0; },
    textContent: '',
    listenerCount: 0,
    focusCount: 0,
    focusOptions: [],
    blurCount: 0,
    releaseCount: 0,
    classList: {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      toggle(name, force) {
        const enabled = force == null ? !classes.has(name) : force;
        if (enabled) classes.add(name); else classes.delete(name);
        return enabled;
      },
      contains(name) { return classes.has(name); }
    },
    style: {
      setProperty(name, value) { properties[name] = value; writes[name] = (writes[name] || 0) + 1; },
      removeProperty(name) { delete properties[name]; },
      getPropertyValue(name) { return properties[name] || ''; }
    },
    addEventListener(type, fn) {
      this.listenerCount += 1;
      (listeners[type] || (listeners[type] = [])).push(fn);
    },
    removeEventListener(type, fn) {
      const handlers = listeners[type] || [];
      const index = handlers.indexOf(fn);
      if (index >= 0) { handlers.splice(index, 1); this.listenerCount -= 1; }
    },
    setAttribute(name, value) { attributes[name] = String(value); },
    removeAttribute(name) { delete attributes[name]; },
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null; },
    contains() { return false; },
    dispatch(type, event = {}) {
      event.target = event.target || this;
      event.currentTarget = this;
      (listeners[type] || []).forEach(fn => fn(event));
    },
    setPointerCapture(id) { captures.add(id); },
    hasPointerCapture(id) { return captures.has(id); },
    releasePointerCapture(id) { captures.delete(id); this.releaseCount += 1; },
    losePointerCapture(id) { captures.delete(id); },
    showModal() { this.open = true; },
    close() { this.open = false; if (typeof this.onClose === 'function') this.onClose(); },
    focus(options) {
      this.focusCount += 1; this.focusOptions.push(options);
      if (typeof this.onFocus === 'function') this.onFocus();
    },
    blur() { this.blurCount += 1; if (typeof this.onBlur === 'function') this.onBlur(); }
  };
}

const controllerStart = bible.indexOf('/* APP SHEET CONTROLLER START */');
const controllerEnd = bible.indexOf('/* APP SHEET CONTROLLER END */');
assert.ok(controllerStart >= 0 && controllerEnd > controllerStart);
const selectionHistorySource = bible.match(/  function selectionHistoryState\([^\n]*\) \{[\s\S]*?\n  \}/)[0];
const selectionPageSource = bible.match(/  function setSelectionPage\([^\n]*\) \{[\s\S]*?\n  \}/)[0];
const dialog = fakeElement();
const handle = fakeElement();
const body = fakeElement();
const measure = fakeElement();
measure.scrollHeight = 180;
let measureIntrinsicWidth = 180;
let measureIntrinsicThrows = false;
Object.defineProperty(measure, 'scrollWidth', {
  get() {
    if (!measure.classList.contains('is-measuring-intrinsic')) return 600;
    if (measureIntrinsicThrows) throw new Error('hostile intrinsic geometry');
    return measureIntrinsicWidth;
  }
});
let activeMeasurementPanel = null;
const selectionIndicator = fakeElement();
selectionIndicator.rectHeight = 28;
selectionIndicator.getBoundingClientRect = () => ({ height: selectionIndicator.rectHeight });
measure.querySelector = selector => selector === '.selection-panel[aria-hidden="false"]' ? activeMeasurementPanel :
  (selector === '.selection-indicator' ? selectionIndicator : null);
const selectionTrackForHistory = fakeElement();
const fadeTop = fakeElement();
const fadeBottom = fakeElement();
const opener = fakeElement();
opener.tagName = 'BUTTON';
const replacementOpener = fakeElement();
replacementOpener.tagName = 'BUTTON';
const viewInner = fakeElement();
const fabMain = fakeElement();
fabMain.setAttribute('aria-expanded', 'false');
const historyCalls = { push: [], replace: [], back: 0 };
let reduceMotion = true;
let nextFrame = 1;
const frames = new Map();
const cancelledFrames = [];
let nextTimer = 1;
const timers = new Map();
const cancelledTimers = [];
let popupCloseCalls = 0;
let textSelectionActive = false;
let staticHistoryRenderCount = 0;
let legacySelectionOpenCalls = 0;
let bodyPaddingStart = 0;
let bodyPaddingEnd = 0;
let bodyPaddingInlineStart = 0;
let bodyPaddingInlineEnd = 0;
let sheetBorderBlockStart = 0;
let sheetBorderBlockEnd = 0;
let selectionCleanupCount = 0;
let trackSelectionResources = false;
const selectionMediaListeners = new Set();
const resizeObserverInstances = [];
const windowListeners = Object.create(null);
const viewportListeners = Object.create(null);
class FakeResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.targets = [];
    this.disconnected = false;
    resizeObserverInstances.push(this);
  }
  observe(target) { this.targets.push(target); }
  disconnect() { this.disconnected = true; this.targets = []; }
  fire() { this.callback([]); }
}
handle.rectHeight = 44;
handle.getBoundingClientRect = () => ({ height: handle.rectHeight });
opener.getBoundingClientRect = () => ({ left: 900, width: 40 });
let replacementOpenerLeft = 20;
replacementOpener.getBoundingClientRect = () => ({ left: replacementOpenerLeft, width: 40 });
const controllerContext = {
  Math,
  Date,
  appSheet: dialog,
  appSheetHandle: handle,
  appSheetBody: body,
  appSheetMeasure: measure,
  appSheetFadeTop: fadeTop,
  appSheetFadeBottom: fadeBottom,
  viewInner,
  fabMain,
  onSelectionTouchStart() {},
  onSelectionTouchMove() {},
  onSelectionTouchEnd() {},
  onSelectionTouchCancel() {},
  document: { activeElement: opener, documentElement: { clientHeight: 780 } },
  ResizeObserver: FakeResizeObserver,
  getComputedStyle(element) {
    if (element === handle || element === selectionIndicator) return { marginBlockStart: '0px', marginBlockEnd: '0px' };
    if (element === body) return {
      paddingBlockStart: bodyPaddingStart + 'px', paddingBlockEnd: bodyPaddingEnd + 'px',
      paddingInlineStart: bodyPaddingInlineStart + 'px', paddingInlineEnd: bodyPaddingInlineEnd + 'px'
    };
    if (element === dialog) return {
      borderInlineStartWidth: '1px', borderInlineEndWidth: '1px',
      borderBlockStartWidth: sheetBorderBlockStart + 'px', borderBlockEndWidth: sheetBorderBlockEnd + 'px'
    };
    return {};
  },
  renderHistorySheet(target, sheet) {
    staticHistoryRenderCount += 1;
    historyRenderExpansion.push(fabMain.getAttribute('aria-expanded'));
    target.textContent = 'history:' + (sheet.page || 'root');
    return () => { cleanupCount += 1; };
  },
  renderSettingsSheet() {
    return () => { settingsCleanupExpansion.push(fabMain.getAttribute('aria-expanded')); };
  },
  renderSelectionSheet(target) {
    target.textContent = 'selection';
    if (!trackSelectionResources) return;
    const mediaListener = () => {};
    selectionMediaListeners.add(mediaListener);
    const frame = nextFrame++;
    frames.set(frame, () => {});
    const timer = nextTimer++;
    timers.set(timer, () => {});
    return () => {
      selectionCleanupCount += 1;
      selectionMediaListeners.delete(mediaListener);
      cancelledFrames.push(frame);
      frames.delete(frame);
      cancelledTimers.push(timer);
      timers.delete(timer);
    };
  },
  normalizedSelectionPage(page) { return ['books', 'chapters', 'verses'].includes(page) ? page : 'books'; },
  sanitizedSelectionDataContext() { return { book: 'John', chapter: 3 }; },
  bibleData: { John: { 3: { 16: 'verse' } } },
  selectionPages: ['books', 'chapters', 'verses'],
  selectionSheetPage: 'books',
  selectionTrack: selectionTrackForHistory,
  selectionRetargetFrame: null,
  selectionRetargetTimer: null,
  selectionContext: { book: 'John', chapter: 3 },
  isValidSelectionPage(page) { return ['books', 'chapters', 'verses'].includes(page); },
  selectionSheetEdge() { return 'bottom'; },
  disconnectSelectionGridLayout() {},
  updateSelectionPageSemantics() {},
  scheduleSelectionGridRetarget() {},
  currentSelectionReaderReference() { return { book: 'John', chapter: 3, verse: 16 }; },
  normalizeVerseReference(book, chapter, verse) {
    return book && chapter && verse ? { book, chapter: Number(chapter), verse: Number(verse) } : null;
  },
  normalizedSelectionContext(book, chapter) { return { book, chapter }; },
  selectionHistoryState(reader, page) {
    return {
      view: 'verses', book: reader.book, chapter: String(reader.chapter), verse: String(reader.verse),
      sheet: { kind: 'selection', page }
    };
  },
  canonicalVerseUrl() { return '/bible'; },
  openSelectionSheet() { legacySelectionOpenCalls += 1; },
  window: {
    innerHeight: 800,
    innerWidth: 1200,
    visualViewport: {
      height: 800,
      addEventListener(type, fn) { (viewportListeners[type] || (viewportListeners[type] = [])).push(fn); },
      removeEventListener() {}
    },
    addEventListener(type, fn) { (windowListeners[type] || (windowListeners[type] = [])).push(fn); },
    removeEventListener() {},
    clearTimeout(id) { cancelledTimers.push(id); timers.delete(id); },
    setTimeout(fn) { const id = nextTimer++; timers.set(id, fn); return id; },
    getSelection() { return { isCollapsed: !textSelectionActive }; },
    location: { href: 'https://example.invalid/bible.html' }
  },
  history: {
    state: null,
    pushState(...args) { this.state = args[0]; historyCalls.push.push(args); },
    replaceState(...args) { this.state = args[0]; historyCalls.replace.push(args); },
    back() { historyCalls.back += 1; }
  },
  closeMenus() { popupCloseCalls += 1; },
  fabPanelHistoryOpen: false,
  currentNavStateForHistory() { return { view: 'verses', book: 'John', chapter: '3', verse: '16' }; },
  shouldReduceVerseMotion() { return reduceMotion; },
  requestAnimationFrame(fn) { const id = nextFrame++; frames.set(id, fn); return id; },
  cancelAnimationFrame(id) { cancelledFrames.push(id); frames.delete(id); }
};
const controllerSource = bible.slice(pureStart, pureEnd) + '\n' +
  bible.slice(controllerStart, controllerEnd) + '\n' + selectionHistorySource + '\n' + selectionPageSource + '\nthis.api = {' +
  'install: installAppSheetListeners, open: openAppSheet, close: requestCloseAppSheet,' +
  'pop: handleAppSheetPopState, snap: setSheetSnap, register: registerAppSheetDescriptor,' +
  'retarget: retargetAppSheetMeasurement, selectPage: setSelectionPage, state: appSheetState};';
vm.runInNewContext(controllerSource, controllerContext);
const api = controllerContext.api;
function currentReturnPopState() {
  const state = { view: 'verses', book: 'John', chapter: '3', verse: '16' };
  if (api.state.historyReturnGeneration !== null) {
    state.sheetReturnGeneration = api.state.historyReturnGeneration;
  }
  return state;
}

api.install();
const installedListenerCount = dialog.listenerCount + handle.listenerCount + body.listenerCount;
api.install();
assert.equal(dialog.listenerCount + handle.listenerCount + body.listenerCount, installedListenerCount,
  'listener setup is idempotent');

let cleanupCount = 0;
const historyRenderExpansion = [];
const settingsCleanupExpansion = [];
assert.equal(api.open('history', { opener, page: 'recent', render() { throw new Error('hostile renderer ran'); } }), true);
assert.equal(staticHistoryRenderCount, 1, 'trusted static History renderer runs exactly once');
assert.equal(fabMain.getAttribute('aria-expanded'), 'false', 'History does not expand the Settings launcher');
assert.equal(dialog.open, true);
assert.equal(opener.getAttribute('aria-expanded'), 'true', 'the concrete launcher reflects the open sheet');
assert.equal(opener.classList.contains('active'), true);
assert.equal(dialog.getAttribute('aria-label'), 'History — Bible panel');
assert.equal(handle.getAttribute('aria-label'), 'Expand History panel');
assert.equal(measure.textContent, 'history:recent');
assert.equal(frames.size, 2, 'opening schedules one measurement frame and one coalesced fade frame');
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '224px',
  'short content uses intrinsic height plus fixed chrome');
assert.equal(dialog.style.getPropertyValue('--sheet-width'), '220px',
  'normal fill-width blocks are measured at narrow max-content width and use the project desktop minimum');
assert.equal(measure.classList.contains('is-measuring-intrinsic'), false,
  'temporary intrinsic measurement state is restored after a successful read');
assert.equal(api.state.determinedHeight, 224);
assert.equal(api.state.determinedWidth, 220);
assert.equal(api.state.anchor, 'right', 'opener center on the midpoint or right side anchors right');
assert.equal(dialog.classList.contains('inline-right'), true);
assert.equal(dialog.classList.contains('inline-left'), false);
assert.equal(resizeObserverInstances.length, 2, 'measurement and overflow each own one scoped observer');

measure.scrollHeight = 900;
resizeObserverInstances[0].fire();
resizeObserverInstances[0].fire();
assert.equal(frames.size, 1, 'repeated observer callbacks coalesce into one measurement RAF');
const longMeasureFrame = [...frames.keys()][0];
frames.get(longMeasureFrame)();
frames.delete(longMeasureFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '560px', 'long content caps at 70 percent of viewport');
const heightWrites = dialog.styleWriteCount;
resizeObserverInstances[0].fire();
const unchangedFrame = [...frames.keys()][0];
frames.get(unchangedFrame)();
frames.delete(unchangedFrame);
assert.equal(dialog.styleWriteCount, heightWrites, 'unchanged rounded measurements do not write or loop');
const widthWrites = dialog.widthStyleWriteCount;
resizeObserverInstances[0].fire();
const unchangedWidthFrame = [...frames.keys()][0];
frames.get(unchangedWidthFrame)();
frames.delete(unchangedWidthFrame);
assert.equal(dialog.widthStyleWriteCount, widthWrites, 'unchanged rounded widths do not write or loop');

measure.scrollHeight = 120;
handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 71, clientX: 10, clientY: 10, timeStamp: 1
});
handle.dispatch('pointermove', {
  pointerId: 71, clientX: 10, clientY: 30, timeStamp: 2, preventDefault() {}
});
assert.equal(api.state.phase, 'dragging');
resizeObserverInstances[0].fire();
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '560px', 'measurement freezes during an active pointer');
handle.dispatch('pointercancel', { pointerId: 71, clientY: 30, timeStamp: 3 });
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '164px', 'measurement resumes after pointer cancellation');

measure.scrollHeight = 500;
controllerContext.window.visualViewport.height = 600;
viewportListeners.resize[0]();
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '420px', 'visual viewport changes recalculate the cap');

measure.scrollHeight = 900;
const savedVisualViewport = controllerContext.window.visualViewport;
delete controllerContext.window.visualViewport;
controllerContext.window.innerHeight = 700;
windowListeners.resize[0]();
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '489px', 'missing visualViewport falls back to finite innerHeight');
controllerContext.window.innerHeight = NaN;
controllerContext.document.documentElement.clientHeight = 600;
windowListeners.resize[0]();
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '420px',
  'missing visualViewport and nonfinite innerHeight fall back to clientHeight');
const fallbackWrites = dialog.styleWriteCount;
controllerContext.document.documentElement.clientHeight = -Infinity;
windowListeners.resize[0]();
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '420px');
assert.equal(dialog.styleWriteCount, fallbackWrites, 'fully hostile viewport geometry cannot write an unbounded height');
controllerContext.window.visualViewport = savedVisualViewport;
controllerContext.window.visualViewport.height = 600;
controllerContext.window.innerHeight = 800;
controllerContext.document.documentElement.clientHeight = 780;
api.snap('fullscreen', true);
measure.scrollHeight = 180;
viewportListeners.resize[0]();
assert.equal(frames.size, 1, 'fullscreen sheets skip measurement while coalescing one fade frame');
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
api.snap('determined', true);
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '224px');
assert.equal(dialog.classList.contains('inline-right'), true,
  'determined to fullscreen to determined retains the immutable opening anchor');

measureIntrinsicWidth = 900;
resizeObserverInstances[0].fire();
const wideFrame = [...frames.keys()][0];
frames.get(wideFrame)();
frames.delete(wideFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-width'), '600px', 'desktop width is capped at 50vw');
measureIntrinsicWidth = 180;

bodyPaddingInlineStart = 10;
bodyPaddingInlineEnd = 6;
measureIntrinsicWidth = 300;
resizeObserverInstances[0].fire();
const inlineChromeFrame = [...frames.keys()][0];
frames.get(inlineChromeFrame)();
frames.delete(inlineChromeFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-width'), '318px',
  'body inline padding and sheet inline borders are added exactly once');
bodyPaddingInlineStart = 0;
bodyPaddingInlineEnd = 0;
measureIntrinsicWidth = 180;

measure.scrollHeight = 100;
sheetBorderBlockStart = 2;
resizeObserverInstances[0].fire();
const blockStartBorderFrame = [...frames.keys()][0];
frames.get(blockStartBorderFrame)();
frames.delete(blockStartBorderFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '146px',
  'sheet block-start border is included in height chrome exactly once');
sheetBorderBlockStart = 0;
sheetBorderBlockEnd = 3;
resizeObserverInstances[0].fire();
const blockEndBorderFrame = [...frames.keys()][0];
frames.get(blockEndBorderFrame)();
frames.delete(blockEndBorderFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '147px',
  'sheet block-end border is included in height chrome exactly once');
const borderWrites = dialog.styleWriteCount;
sheetBorderBlockStart = 'invalid';
sheetBorderBlockEnd = 0;
resizeObserverInstances[0].fire();
const invalidBlockStartFrame = [...frames.keys()][0];
frames.get(invalidBlockStartFrame)();
frames.delete(invalidBlockStartFrame);
assert.equal(dialog.styleWriteCount, borderWrites, 'invalid block-start border suppresses geometry writes');
sheetBorderBlockStart = 0;
sheetBorderBlockEnd = 'invalid';
resizeObserverInstances[0].fire();
const invalidBlockEndFrame = [...frames.keys()][0];
frames.get(invalidBlockEndFrame)();
frames.delete(invalidBlockEndFrame);
assert.equal(dialog.styleWriteCount, borderWrites, 'invalid block-end border suppresses geometry writes');
sheetBorderBlockEnd = 0;

measureIntrinsicThrows = true;
const widthWritesBeforeThrow = dialog.widthStyleWriteCount;
resizeObserverInstances[0].fire();
const throwingIntrinsicFrame = [...frames.keys()][0];
frames.get(throwingIntrinsicFrame)();
frames.delete(throwingIntrinsicFrame);
assert.equal(dialog.widthStyleWriteCount, widthWritesBeforeThrow,
  'throwing intrinsic geometry cannot produce a style write');
assert.equal(measure.classList.contains('is-measuring-intrinsic'), false,
  'temporary intrinsic measurement state is restored when geometry throws');
measureIntrinsicThrows = false;

bodyPaddingStart = 10;
bodyPaddingEnd = 6;
measure.scrollHeight = 100;
resizeObserverInstances[0].fire();
const paddedFrame = [...frames.keys()][0];
frames.get(paddedFrame)();
frames.delete(paddedFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '160px',
  'body padding and safe-area contribution are added exactly once');
bodyPaddingStart = 0;
bodyPaddingEnd = 0;

measure.scrollHeight = Infinity;
const writesBeforeInvalidGeometry = dialog.styleWriteCount;
resizeObserverInstances[0].fire();
const invalidGeometryFrame = [...frames.keys()][0];
frames.get(invalidGeometryFrame)();
frames.delete(invalidGeometryFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '160px', 'invalid geometry preserves the bounded safe height');
assert.equal(dialog.styleWriteCount, writesBeforeInvalidGeometry, 'invalid geometry does not produce an unbounded style write');
measure.scrollHeight = 180;
measureIntrinsicWidth = Infinity;
const widthBeforeInvalidGeometry = dialog.style.getPropertyValue('--sheet-width');
resizeObserverInstances[0].fire();
const invalidWidthFrame = [...frames.keys()][0];
frames.get(invalidWidthFrame)();
frames.delete(invalidWidthFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-width'), widthBeforeInvalidGeometry,
  'invalid inline geometry preserves the last safe width');
measureIntrinsicWidth = 180;
const firstGenerationObserver = resizeObserverInstances[0];
assert.equal(historyCalls.push.length, 1, 'first open pushes one sheet entry');
assert.equal(historyCalls.replace.length, 1, 'first open tags the underlying reader entry for generation-safe Back');

assert.equal(api.open('search', { page: 'results' }), true);
assert.ok(firstGenerationObserver.disconnected, 'content replacement disconnects the previous observer');
assert.equal(fabMain.getAttribute('aria-expanded'), 'false', 'kind switch away from Settings remains collapsed');
assert.equal(historyCalls.push.length, 1, 'switching an open sheet never pushes again');
assert.equal(historyCalls.replace.length, 2, 'switching kind/page replaces the owned sheet entry');
assert.equal(cleanupCount, 1, 'old content cleanup runs before replacement');
assert.equal(dialog.getAttribute('aria-label'), 'Search — Bible panel');
assert.notEqual(measure.textContent, '', 'default descriptors render deterministic content');
assert.equal(api.state.anchor, 'right', 'replacement without a new opener retains its opener anchor');

assert.equal(api.open('history', { opener: replacementOpener, fillsPanel: true }), true);
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(api.state.anchor, 'left', 'an explicit replacement opener establishes the new generation anchor');
assert.equal(dialog.classList.contains('inline-left'), true);
assert.equal(dialog.classList.contains('inline-right'), false);
assert.equal(dialog.style.getPropertyValue('--sheet-width'), '220px',
  'caller-controlled fillsPanel cannot expand an intrinsic descriptor');

replacementOpenerLeft = 900;
body.scrollTop = 500;
assert.equal(api.open('selection', { page: 'books' }), true);
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(api.state.anchor, 'left',
  'replacement without a new opener preserves the generation anchor after its saved launcher moves');
assert.equal(dialog.classList.contains('inline-left'), true);
assert.equal(dialog.classList.contains('inline-right'), false);
assert.equal(dialog.style.getPropertyValue('--sheet-width'), '600px',
  'the trusted Selection descriptor alone fills the stable desktop half viewport');
assert.equal(body.scrollTop, 0,
  'Search scroll position is cleared before a Selection kind takes ownership of the sheet body');
assert.equal(api.state.kind, 'selection');

assert.equal(api.close('button'), true);
assert.equal(historyCalls.back, 1, 'dismissal traverses back from an owned entry');
assert.equal(dialog.open, false, 'reduced history-backed dismissal completes immediately');
assert.equal(api.state.phase, 'closed');
assert.equal(dialog.classList.contains('is-closing'), false);
assert.equal(fabMain.getAttribute('aria-expanded'), 'false', 'launcher state collapses immediately');
assert.equal(opener.getAttribute('aria-expanded'), 'false');
assert.equal(opener.classList.contains('active'), false, 'launcher highlight clears before popstate');
assert.equal(api.pop(currentReturnPopState()), false, 'late reduced-motion reconciliation is already complete');
assert.equal(dialog.open, false);
assert.equal(api.state.anchor, 'right');
assert.equal(api.state.determinedWidth, 0);
assert.equal(dialog.style.getPropertyValue('--sheet-width'), '');
assert.equal(dialog.classList.contains('inline-left'), false);
assert.equal(dialog.classList.contains('inline-right'), false);
assert.equal(opener.focusCount, 0, 'programmatic/history close preserves valid external focus');
assert.equal(fabMain.getAttribute('aria-expanded'), 'false', 'close keeps Settings launcher collapsed');

assert.equal(api.open('settings', { opener }), true);
assert.equal(api.state.anchor, 'right', 'a fresh opening recalculates its anchor from the supplied opener');
assert.equal(dialog.classList.contains('inline-right'), true);
assert.equal(dialog.classList.contains('inline-left'), false);
assert.equal(fabMain.getAttribute('aria-expanded'), 'true', 'opening Settings expands its launcher');
assert.equal(api.open('history', { opener }), true);
assert.equal(fabMain.getAttribute('aria-expanded'), 'false', 'switching kind collapses the Settings launcher');
assert.equal(historyRenderExpansion.at(-1), 'false', 'kind switch synchronizes before the next renderer runs');
assert.equal(settingsCleanupExpansion.at(-1), 'false', 'kind-switch cleanup observes Settings collapsed');
api.pop(currentReturnPopState());

const pushesBeforeForward = historyCalls.push.length;
assert.equal(api.pop({
  view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history', page: 'recent' }
}), true, 'Forward reopens a validated sheet state');
assert.equal(dialog.open, true);
assert.equal(dialog.getAttribute('aria-label'), 'History — Bible panel', 'Forward resolves the trusted label');
assert.equal(measure.textContent, 'history:recent', 'Forward resolves registered content and page');
assert.equal(historyCalls.push.length, pushesBeforeForward, 'Forward restoration does not push');
assert.equal(api.pop({
  view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'settings' }
}), true, 'Forward restores Settings');
assert.equal(fabMain.getAttribute('aria-expanded'), 'true', 'Forward-expanded Settings synchronizes its launcher');
assert.equal(api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16' }), true);
assert.equal(fabMain.getAttribute('aria-expanded'), 'false', 'Forward-restored Settings collapses on close');
assert.equal(settingsCleanupExpansion.at(-1), 'false', 'close cleanup observes Settings collapsed');
api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
assert.equal(api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'bad' } }), true);
assert.equal(dialog.open, false, 'invalid Forward sheet state cannot remain open');

api.open('history', { opener });
assert.equal(dialog.classList.contains('edge-top'), false);
api.open('history', { opener, edge: 'top' });
assert.equal(api.state.edge, 'top');
assert.equal(dialog.classList.contains('edge-top'), true, 'top edge state and class move together');
const topMeasureFrame = [...frames.keys()][0];
frames.get(topMeasureFrame)();
frames.delete(topMeasureFrame);

handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 7, clientX: 10, clientY: 10, timeStamp: 1
});
assert.equal(api.state.candidate.id, 7, 'pointerdown creates only an unclaimed candidate');
assert.equal(api.state.pointer, null);
assert.equal(api.state.phase, 'idle');
assert.equal(dialog.classList.contains('is-dragging'), false);
assert.equal(handle.hasPointerCapture(7), false);
handle.dispatch('pointerdown', {
  isPrimary: false, button: 0, pointerId: 77, clientX: 10, clientY: 10, timeStamp: 2
});
assert.equal(api.state.candidate, null, 'a second pointer cancels the active candidate without replacing it');
assert.equal(api.state.pointer, null);
assert.equal(api.state.snap, 'determined', 'candidate cancellation returns to the frozen starting snap');
assert.equal(handle.hasPointerCapture(77), false);
handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 7, clientX: 10, clientY: 10, timeStamp: 3
});
handle.dispatch('pointermove', {
  pointerId: 7, clientX: 11, clientY: 17, timeStamp: 7, preventDefault() { throw new Error('pre-lock move claimed'); }
});
assert.equal(api.state.phase, 'idle', 'motion below the exact 8px axis lock stays a candidate');
assert.equal(api.state.frame, null);
handle.dispatch('pointermove', {
  pointerId: 7, clientX: 11, clientY: 110, timeStamp: 101, preventDefault() {}
});
assert.equal(api.state.phase, 'dragging');
const firstDragFrame = api.state.frame;
assert.ok(firstDragFrame, 'drag DOM writes are scheduled through RAF');
assert.equal(dialog.style.getPropertyValue('--sheet-drag-offset'), '');
handle.dispatch('pointermove', {
  pointerId: 7, clientX: 11, clientY: 120, timeStamp: 111, preventDefault() {}
});
assert.equal(api.state.frame, firstDragFrame, 'multiple drag moves coalesce into one RAF');
frames.get(firstDragFrame)();
frames.delete(firstDragFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-live-height'), '334px');
assert.equal(dialog.style.getPropertyValue('--sheet-drag-offset'), '0px');
assert.equal(dialog.style.getPropertyValue('--sheet-backdrop-opacity'), '1', 'inward expansion keeps backdrop stable');

handle.dispatch('pointermove', {
  pointerId: 7, clientX: 11, clientY: 130, timeStamp: 121, preventDefault() {}
});
const cancelledDragFrame = api.state.frame;
const releasesBeforeConcurrentPointer = handle.releaseCount;
handle.dispatch('pointerdown', {
  isPrimary: false, button: 0, pointerId: 78, clientX: 12, clientY: 130, timeStamp: 122
});
assert.equal(api.state.pointer, null, 'a second pointer cancels the claimed gesture');
assert.equal(api.state.gesture, null);
assert.equal(api.state.frame, null);
assert.ok(cancelledFrames.includes(cancelledDragFrame));
assert.equal(handle.releaseCount, releasesBeforeConcurrentPointer + 1);
assert.equal(handle.hasPointerCapture(78), false, 'the second pointer never becomes a gesture');
assert.equal(dialog.classList.contains('is-dragging'), false);
assert.equal(dialog.style.getPropertyValue('--sheet-live-height'), '');
assert.equal(dialog.style.getPropertyValue('--sheet-drag-offset'), '');
assert.equal(dialog.style.getPropertyValue('--sheet-backdrop-opacity'), '');
assert.equal(api.state.snap, 'determined', 'claimed cancellation returns to the frozen starting snap');
handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 7, clientX: 10, clientY: 10, timeStamp: 123
});
handle.dispatch('pointermove', {
  pointerId: 7, clientX: 11, clientY: 130, timeStamp: 130, preventDefault() {}
});
const explicitCancelFrame = api.state.frame;
handle.dispatch('pointercancel', { pointerId: 7, clientY: 30 });
assert.equal(api.state.pointer, null, 'pointercancel resets pointer state');
assert.ok(cancelledFrames.includes(explicitCancelFrame), 'pointercancel cancels pending RAF');
assert.equal(handle.releaseCount, releasesBeforeConcurrentPointer + 2,
  'pointercancel explicitly releases held pointer capture');

const validHeightBeforeInvalidClaim = api.state.determinedHeight;
api.state.determinedHeight = 0;
handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 79, clientX: 10, clientY: 10, timeStamp: 140
});
handle.dispatch('pointermove', {
  pointerId: 79, clientX: 10, clientY: 30, timeStamp: 150, preventDefault() {}
});
assert.equal(api.state.candidate, null, 'invalid frozen handle geometry fully cancels the candidate');
assert.equal(api.state.pointer, null);
assert.equal(api.state.gesture, null);
assert.equal(dialog.classList.contains('is-dragging'), false);
assert.equal(dialog.style.getPropertyValue('--sheet-live-height'), '');
assert.equal(dialog.style.getPropertyValue('--sheet-drag-offset'), '');
api.state.determinedHeight = validHeightBeforeInvalidClaim;

handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 8, clientX: 10, clientY: 10, timeStamp: 1
});
handle.dispatch('pointermove', {
  pointerId: 8, clientX: 11, clientY: 100, timeStamp: 90, preventDefault() {}
});
const lostFrame = api.state.frame;
handle.losePointerCapture(8);
handle.dispatch('lostpointercapture', { pointerId: 8 });
assert.equal(api.state.pointer, null, 'lost capture clears pointer state');
assert.ok(cancelledFrames.includes(lostFrame), 'lost capture cancels pending RAF');

let cancelPrevented = 0;
const backsBeforeCancel = historyCalls.back;
const focusBeforeCancel = opener.focusCount;
let nativeRestoreCount = 0;
controllerContext.document.activeElement = body;
dialog.onClose = () => { nativeRestoreCount += 1; controllerContext.document.activeElement = opener; };
dialog.dispatch('cancel', { preventDefault() { cancelPrevented += 1; } });
assert.equal(cancelPrevented, 1, 'native Escape/cancel is prevented for the unified close path');
assert.equal(historyCalls.back, backsBeforeCancel + 1, 'Escape/cancel requests history dismissal');
assert.equal(opener.classList.contains('active'), false, 'Escape clears launcher highlight before history/animation completion');
assert.equal(opener.getAttribute('aria-expanded'), 'false');
api.pop(currentReturnPopState());
assert.equal(nativeRestoreCount, 1, 'native close restores the opener exactly once');
assert.equal(controllerContext.document.activeElement, opener);
assert.equal(opener.focusCount, focusBeforeCancel, 'restore-opener does not double-focus a native-restored opener');
dialog.onClose = null;
controllerContext.document.activeElement = opener;
assert.equal(dialog.classList.contains('edge-top'), false, 'close resets top-edge presentation state');
assert.equal(dialog.classList.contains('edge-bottom'), true);

api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
const backsBeforeBackdrop = historyCalls.back;
const focusBeforeBackdrop = opener.focusCount;
const blurBeforeBackdrop = opener.blurCount;
controllerContext.document.activeElement = body;
dialog.contains = node => node === body;
dialog.onClose = () => { controllerContext.document.activeElement = opener; };
opener.onBlur = () => { controllerContext.document.activeElement = null; };
dialog.dispatch('click', { target: dialog });
assert.equal(historyCalls.back, backsBeforeBackdrop + 1, 'backdrop click uses the unified history close path');
assert.equal(opener.classList.contains('active'), false, 'pointer backdrop clears launcher highlight immediately');
assert.equal(opener.getAttribute('aria-expanded'), 'false');
api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16' });
assert.equal(opener.focusCount, focusBeforeBackdrop, 'pointer backdrop close never programmatically focuses');
assert.equal(opener.blurCount, blurBeforeBackdrop + 1, 'pointer none policy clears native-restored launcher focus by blurring');
assert.notEqual(controllerContext.document.activeElement, opener);
dialog.onClose = null;
opener.onBlur = null;
dialog.contains = () => false;
controllerContext.document.activeElement = opener;

api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
api.open('search', { opener: replacementOpener });
assert.equal(opener.classList.contains('active'), false, 'owner replacement clears the prior launcher');
assert.equal(replacementOpener.classList.contains('active'), true, 'owner replacement highlights only the new launcher');
assert.equal(api.state.nativeOpener, opener, 'replacement preserves the modal native restoration target');
let replacementNativeTarget = api.state.nativeOpener;
const originalBlurBeforeReplacement = opener.blurCount;
controllerContext.document.activeElement = body;
dialog.contains = node => node === body;
dialog.onClose = () => { controllerContext.document.activeElement = replacementNativeTarget; };
opener.onBlur = () => { controllerContext.document.activeElement = null; };
api.close('owner-replacement', 'none');
api.pop(currentReturnPopState());
assert.equal(replacementOpener.classList.contains('active'), false);
assert.equal(opener.blurCount, originalBlurBeforeReplacement + 1,
  'none blurs the original native target after logical opener replacement');
assert.notEqual(controllerContext.document.activeElement, opener);
dialog.onClose = null;
opener.onBlur = null;
dialog.contains = () => false;

controllerContext.document.activeElement = opener;
api.open('history', { opener });
api.open('search', { opener: replacementOpener });
replacementNativeTarget = api.state.nativeOpener;
const replacementFocusBefore = replacementOpener.focusCount;
controllerContext.document.activeElement = body;
dialog.contains = node => node === body;
dialog.onClose = () => { controllerContext.document.activeElement = replacementNativeTarget; };
replacementOpener.onFocus = () => { controllerContext.document.activeElement = replacementOpener; };
api.close('owner-replacement-restore', 'restore-opener');
api.pop(currentReturnPopState());
assert.equal(replacementOpener.focusCount, replacementFocusBefore + 1,
  'restore-opener focuses current logical opener B exactly once, not native target A');
assert.equal(controllerContext.document.activeElement, replacementOpener);
dialog.onClose = null;
replacementOpener.onFocus = null;
dialog.contains = () => false;

controllerContext.document.activeElement = opener;
api.open('history', { opener });
api.open('search', { opener: replacementOpener });
replacementNativeTarget = api.state.nativeOpener;
const replacementReaderBefore = viewInner.focusCount;
controllerContext.document.activeElement = body;
dialog.contains = node => node === body;
dialog.onClose = () => { controllerContext.document.activeElement = replacementNativeTarget; };
viewInner.onFocus = () => { controllerContext.document.activeElement = viewInner; };
api.close('owner-replacement-preserve');
api.pop(currentReturnPopState());
assert.equal(viewInner.focusCount, replacementReaderBefore + 1,
  'preserve-or-reader evaluates invalid pre-close focus instead of native-restored A');
assert.equal(controllerContext.document.activeElement, viewInner);
viewInner.dispatch('focusout');
dialog.onClose = null;
viewInner.onFocus = null;
dialog.contains = () => false;
controllerContext.document.activeElement = opener;

api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
const readerFocusBefore = viewInner.focusCount;
const readerListenerBaseline = viewInner.listenerCount;
reduceMotion = false;
assert.equal(api.close('selection-complete', 'reader'), true);
const terminalCloseTimer = api.state.historyTimer;
const terminalCloseCallback = timers.get(terminalCloseTimer);
const terminalCloseBacks = historyCalls.back;
const terminalCloseSnap = api.state.snap;
assert.equal(api.snap(terminalCloseSnap === 'determined' ? 'fullscreen' : 'determined', true), false,
  'direct snap mutation is rejected while closing');
handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 180, clientX: 0, clientY: 0, timeStamp: 1
});
assert.equal(api.state.candidate, null, 'closing cannot begin another gesture');
for (const key of ['Enter', 'ArrowUp', 'ArrowDown', 'Escape']) {
  handle.dispatch('keydown', { key, repeat: false, preventDefault() {} });
  assert.equal(api.state.phase, 'closing', `${key} cannot leave terminal closing phase`);
  assert.equal(api.state.focusPolicy, 'reader', `${key} cannot replace immutable close focus`);
  assert.equal(api.state.snap, terminalCloseSnap, `${key} cannot mutate snap while closing`);
}
assert.equal(historyCalls.back, terminalCloseBacks, 'close-time keyboard input cannot traverse history again');
assert.equal(api.close('late-policy-change', 'none'), true, 'repeat close is idempotent');
reduceMotion = true;
api.pop(currentReturnPopState());
assert.equal(viewInner.focusCount, readerFocusBefore + 1, 'completion returns focus to the reader');
assert.equal(viewInner.focusOptions.at(-1).preventScroll, true, 'reader focus never scrolls the underlying chapter');
assert.equal(viewInner.getAttribute('tabindex'), '-1', 'temporary reader tabindex remains while reader owns focus');
assert.equal(viewInner.listenerCount, readerListenerBaseline + 1, 'one focus-leave cleanup is installed');
terminalCloseCallback();
api.pop(currentReturnPopState());
assert.equal(viewInner.focusCount, readerFocusBefore + 1, 'late close callbacks never focus twice');
assert.equal(viewInner.listenerCount, readerListenerBaseline + 1, 'late callbacks cannot retain another cleanup listener');
viewInner.dispatch('focusout');
assert.equal(viewInner.getAttribute('tabindex'), null, 'temporary reader tabindex clears only after focus leaves');
assert.equal(viewInner.listenerCount, readerListenerBaseline, 'focus-leave cleanup removes its listener');

api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
controllerContext.document.activeElement = body;
dialog.contains = node => node === body;
dialog.onClose = () => { controllerContext.document.activeElement = opener; };
const fallbackReaderFocus = viewInner.focusCount;
api.close('owner-change');
api.pop(currentReturnPopState());
assert.equal(viewInner.focusCount, fallbackReaderFocus + 1,
  'preserve-or-reader falls back when focus is trapped in the closing sheet');
assert.equal(viewInner.getAttribute('tabindex'), '-1');
viewInner.dispatch('focusout');
assert.equal(viewInner.getAttribute('tabindex'), null);
assert.equal(viewInner.listenerCount, readerListenerBaseline);
dialog.onClose = null;
controllerContext.document.activeElement = opener;
dialog.contains = () => false;

for (let focusCycle = 0; focusCycle < 3; focusCycle += 1) {
  api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
  api.close('reader-focus-cycle', 'reader');
  api.pop(currentReturnPopState());
  assert.equal(viewInner.getAttribute('tabindex'), '-1');
  assert.equal(viewInner.listenerCount, readerListenerBaseline + 1);
  viewInner.dispatch('focusout');
  assert.equal(viewInner.getAttribute('tabindex'), null);
  assert.equal(viewInner.listenerCount, readerListenerBaseline, `reader focus cycle ${focusCycle} releases listener`);
}

api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
reduceMotion = false;
api.state.historyOwned = false;
const oldGeneration = api.state.generation;
const oldObserver = resizeObserverInstances.at(-1);
measure.scrollHeight = 260;
oldObserver.fire();
const oldMeasureFrameId = [...frames.keys()][0];
const oldMeasureFrameCallback = frames.get(oldMeasureFrameId);
api.close('test-timer');
const pendingSettleTimer = api.state.settleTimer;
const oldSettleCallback = timers.get(pendingSettleTimer);
assert.ok(pendingSettleTimer, 'animated close stores its settle timer');
const terminalReopenState = { view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } };
api.pop(terminalReopenState);
assert.equal(api.state.phase, 'closing', 'Forward cannot replace a generation while close is terminal');
assert.ok(oldObserver.disconnected, 'reopen disconnects the previous generation observer');
assert.ok(cancelledFrames.includes(oldMeasureFrameId), 'close cancels the previous generation measure RAF');
oldSettleCallback();
assert.equal(dialog.open, true, 'terminal finish applies the queued Forward state exactly once');
assert.notEqual(api.state.generation, oldGeneration, 'queued Forward opens only after terminal close finishes');
const reopened = {
  height: dialog.style.getPropertyValue('--sheet-height'), phase: api.state.phase,
  kind: api.state.kind, content: measure.textContent, focus: opener.focusCount
};
oldObserver.fire();
oldMeasureFrameCallback();
oldSettleCallback();
assert.deepEqual({
  height: dialog.style.getPropertyValue('--sheet-height'), phase: api.state.phase,
  kind: api.state.kind, content: measure.textContent, focus: opener.focusCount
}, reopened, 'stale observer, RAF, and timer callbacks cannot mutate the reopened generation');

reduceMotion = true;
api.state.historyOwned = false;
api.close('prepare-tagged-stale-history');
api.open('history', { page: 'old-generation' });
const staleGeneration = api.state.generation;
const staleReturnGeneration = api.state.historyReturnGeneration;
const staleSheetPop = {
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'search', page: 'old', generation: staleGeneration }
};
const staleClosePop = {
  view: 'verses', book: 'John', chapter: '3', verse: '16', sheetReturnGeneration: staleReturnGeneration
};
const untaggedStaleSheetPop = {
  view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'search', page: 'untagged-old' }
};
const untaggedStaleClosePop = { view: 'verses', book: 'John', chapter: '3', verse: '16' };
const untaggedInvalidSelectionFallback = {
  view: 'books', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'selection', page: 'books' }
};
api.state.historyOwned = false;
api.close('invalidate-old-history-generation');
api.open('history', { page: 'new' });
const currentAfterReopen = {
  generation: api.state.generation, kind: api.state.kind, content: measure.textContent,
  phase: api.state.phase, focus: opener.focusCount,
  historyPushes: historyCalls.push.length, historyReplaces: historyCalls.replace.length, historyBacks: historyCalls.back
};
assert.notEqual(currentAfterReopen.generation, staleGeneration);
assert.notEqual(api.state.historyReturnGeneration, staleReturnGeneration);
const collidingSheetPop = {
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: {
    kind: 'search', page: 'colliding-chain', generation: currentAfterReopen.generation,
    returnGeneration: staleReturnGeneration
  }
};
const collidingLegacySelectionFallback = {
  view: 'books', book: 'John', chapter: '3', verse: '16',
  sheet: {
    kind: 'selection', page: 'books', generation: currentAfterReopen.generation,
    returnGeneration: staleReturnGeneration
  }
};
assert.equal(api.pop(collidingSheetPop), true);
assert.equal(api.pop(collidingLegacySelectionFallback), true);
assert.equal(api.pop(staleSheetPop), true);
assert.equal(api.pop(staleClosePop), true);
assert.equal(api.pop(untaggedStaleSheetPop), true);
assert.equal(api.pop(untaggedStaleClosePop), true);
assert.equal(api.pop(untaggedInvalidSelectionFallback), true);
assert.deepEqual({
  generation: api.state.generation, kind: api.state.kind, content: measure.textContent,
  phase: api.state.phase, focus: opener.focusCount,
  historyPushes: historyCalls.push.length, historyReplaces: historyCalls.replace.length, historyBacks: historyCalls.back,
  legacySelectionOpenCalls
}, { ...currentAfterReopen, legacySelectionOpenCalls: 0 },
  'tagged and untagged stale sheet/close/legacy-selection callbacks cannot mutate a reopened sheet');

api.state.historyOwned = false;
api.close('prepare-forward-contract');
const forwardToken = 777;
assert.equal(api.pop({
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'history', page: 'forward', generation: forwardToken }
}), true);
assert.equal(dialog.open, true, 'user Forward still restores a generation-tagged sheet');
assert.equal(api.state.historyReturnGeneration, forwardToken);
assert.equal(api.pop({
  view: 'verses', book: 'John', chapter: '3', verse: '16', sheetReturnGeneration: forwardToken
}), true);
assert.equal(dialog.open, false, 'matching adjacent return token preserves user Back close semantics');
assert.equal(api.pop(untaggedInvalidSelectionFallback), true);
assert.equal(legacySelectionOpenCalls, 1,
  'tokenless legacy selection recovery remains available when no tagged lifecycle is active');

const cyclePushStart = historyCalls.push.length;
api.open('history', { page: 'cycle' });
const cycleReturnState = historyCalls.replace.at(-1)[0];
const cycleSheetState = historyCalls.push.at(-1)[0];
assert.equal(historyCalls.push.length, cyclePushStart + 1);
assert.equal(cycleReturnState.sheetReturnGeneration, cycleSheetState.sheet.returnGeneration,
  'fresh adjacent reader and sheet entries share one history-chain token');
api.pop(cycleReturnState);
assert.equal(dialog.open, false, 'first recorded Back closes');
api.pop(cycleSheetState);
assert.equal(dialog.open, true, 'first recorded Forward reopens');
const firstRewrittenCycleSheet = historyCalls.replace.at(-1)[0];
assert.equal(firstRewrittenCycleSheet.sheet.returnGeneration, cycleReturnState.sheetReturnGeneration,
  'Forward preserves the immutable chain token while runtime generation advances');
assert.notEqual(firstRewrittenCycleSheet.sheet.generation, cycleSheetState.sheet.generation,
  'Forward assigns a fresh runtime generation for stale callback rejection');
api.pop(cycleReturnState);
assert.equal(dialog.open, false, 'second recorded Back still closes');
api.pop(firstRewrittenCycleSheet);
assert.equal(dialog.open, true, 'second recorded Forward still reopens');
api.pop(cycleReturnState);
assert.equal(dialog.open, false, 'third recorded Back still closes');

api.open('history', { page: 'before-switch' });
const switchedReturnState = historyCalls.replace.at(-1)[0];
const beforeSwitchSheetState = historyCalls.push.at(-1)[0];
api.open('search', { page: 'after-switch' });
const switchedSheetState = historyCalls.replace.at(-1)[0];
assert.equal(switchedSheetState.sheet.returnGeneration, switchedReturnState.sheetReturnGeneration,
  'kind/page replacement preserves the chain token');
const switchedRuntime = { generation: api.state.generation, kind: api.state.kind, content: measure.textContent };
api.pop(beforeSwitchSheetState);
assert.deepEqual({ generation: api.state.generation, kind: api.state.kind, content: measure.textContent }, switchedRuntime,
  'an old same-chain sheet callback cannot undo a newer kind/page replacement');
api.pop(switchedReturnState);
assert.equal(dialog.open, false);
api.pop(switchedSheetState);
assert.equal(dialog.open, true);
assert.equal(api.state.kind, 'search');
api.pop(switchedReturnState);
assert.equal(dialog.open, false, 'switched sheet also survives Back/Forward/Back');

api.pop({
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'history', generation: 778 }
});
const pointerUpMeasureFrame = [...frames.keys()][0];
frames.get(pointerUpMeasureFrame)();
frames.delete(pointerUpMeasureFrame);

api.snap('determined', true);
const releasesBeforePointerUp = handle.releaseCount;
handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 9, clientX: 20, clientY: 120, timeStamp: 1
});
handle.dispatch('pointermove', {
  pointerId: 9, clientX: 21, clientY: 20, timeStamp: 101, preventDefault() {}
});
const pointerUpFrame = api.state.frame;
handle.dispatch('pointerup', { pointerId: 9, clientY: 20 });
assert.equal(api.state.snap, 'fullscreen', 'pointerup settles an inward bottom drag to fullscreen');
assert.equal(api.state.pointer, null, 'pointerup clears pointer state');
assert.ok(cancelledFrames.includes(pointerUpFrame), 'pointerup cancels the pending drag RAF');
assert.equal(handle.releaseCount, releasesBeforePointerUp + 1, 'pointerup releases held pointer capture');

api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
const backsBeforeDoubleClose = historyCalls.back;
reduceMotion = false;
assert.equal(api.close('first'), true);
assert.equal(api.state.pendingHistoryClose, true);
assert.equal(api.close('second'), true, 'repeat dismiss while back is pending is idempotently handled');
assert.equal(historyCalls.back, backsBeforeDoubleClose + 1, 'double dismiss requests exactly one history.back');
assert.equal(api.open('search', { page: 'during-close' }), false, 'open is rejected while history close is pending');
assert.equal(api.state.pendingHistoryClose, true, 'rejected reopen cannot race the pending traversal');
assert.equal(dialog.open, true);
reduceMotion = true;
api.pop(currentReturnPopState());
assert.equal(dialog.open, false);
assert.equal(api.state.pendingHistoryClose, false, 'popstate clears pending close state');

api.open('history', { opener, page: 'queue-origin' });
const queuedGeneration = api.state.generation;
const queuedReturnGeneration = api.state.historyReturnGeneration;
const queuedFocusBaseline = opener.focusCount + viewInner.focusCount;
reduceMotion = false;
api.close('queue-post-close', 'none');
const queuedFinishCallback = timers.get(api.state.historyTimer);
const queuedSearchState = {
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'search', page: 'queued-search', generation: queuedGeneration,
    returnGeneration: queuedReturnGeneration }
};
const queuedSettingsState = {
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'settings', page: 'queued-settings', generation: queuedGeneration,
    returnGeneration: queuedReturnGeneration }
};
api.pop(queuedSearchState);
assert.equal(api.state.phase, 'closing');
assert.equal(api.state.pendingPostCloseState.sheet.kind, 'search', 'valid desired state queues during terminal close');
assert.equal(api.state.pendingPostCloseDestination.kind, 'sheet');
api.pop({
  ...queuedSettingsState,
  sheet: { ...queuedSettingsState.sheet, returnGeneration: queuedReturnGeneration + 999 }
});
assert.equal(api.state.pendingPostCloseState.sheet.kind, 'search', 'cross-chain state cannot replace queued destination');
api.pop(queuedSettingsState);
assert.equal(api.state.pendingPostCloseState.sheet.kind, 'settings', 'latest valid same-chain destination wins');
reduceMotion = true;
queuedFinishCallback();
assert.equal(dialog.open, true, 'terminal finish applies queued sheet without browser replay');
assert.equal(api.state.kind, 'settings');
assert.equal(api.state.page, 'queued-settings');
assert.equal(api.state.pendingPostCloseState, null);
assert.equal(opener.focusCount + viewInner.focusCount, queuedFocusBaseline, 'queued reopen cannot replace or double-run none focus');
api.state.historyOwned = false;
api.close('queued-state-cleanup', 'none');

controllerContext.document.activeElement = opener;
api.open('history', { opener, page: 'legacy-selection-origin' });
const legacyClosingGeneration = api.state.generation;
const legacyClosingReturn = api.state.historyReturnGeneration;
const legacyOpenBaseline = legacySelectionOpenCalls;
reduceMotion = false;
api.close('legacy-selection-close', 'none');
const legacySelectionFinish = timers.get(api.state.historyTimer);
api.pop({
  view: 'books', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'selection', page: 'chapters', book: 'John', chapter: '3',
    generation: legacyClosingGeneration, returnGeneration: legacyClosingReturn }
});
assert.equal(api.state.phase, 'closing');
assert.equal(api.state.pendingPostCloseDestination.kind, 'sheet');
assert.equal(api.state.pendingPostCloseState.sheet.kind, 'selection');
assert.equal(api.state.pendingPostCloseState.sheet.generation, legacyClosingGeneration,
  'sanitized legacy selection is tagged to the closing runtime generation');
assert.equal(api.state.pendingPostCloseState.sheet.returnGeneration, legacyClosingReturn);
reduceMotion = true;
legacySelectionFinish();
assert.equal(dialog.open, true, 'accepted legacy selection opens after terminal finish');
assert.equal(api.state.kind, 'selection');
assert.equal(api.state.page, 'chapters');
const legacyQueuedRuntime = api.state.generation;
legacySelectionFinish();
assert.equal(api.state.generation, legacyQueuedRuntime, 'legacy pending destination applies exactly once');
assert.equal(legacySelectionOpenCalls, legacyOpenBaseline,
  'queued legacy selection uses the unified sheet lifecycle instead of a duplicate legacy open');
api.state.historyOwned = false;
api.close('legacy-selection-cleanup', 'none');

controllerContext.document.activeElement = opener;
api.open('history', { opener, page: 'sheet-then-reader' });
const sheetThenReaderGeneration = api.state.generation;
const sheetThenReaderReturn = api.state.historyReturnGeneration;
reduceMotion = false;
api.close('sheet-then-reader-close', 'none');
const sheetThenReaderCallback = timers.get(api.state.historyTimer);
api.pop({
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'search', page: 'must-not-reopen', generation: sheetThenReaderGeneration,
    returnGeneration: sheetThenReaderReturn }
});
assert.equal(api.state.pendingPostCloseState.sheet.kind, 'search');
api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheetReturnGeneration: sheetThenReaderReturn });
reduceMotion = true;
assert.equal(dialog.open, false, 'later accepted reader destination supersedes queued sheet before finish');
assert.equal(api.state.pendingPostCloseState, null);
sheetThenReaderCallback();
assert.equal(dialog.open, false, 'late fallback cannot resurrect superseded sheet destination');

controllerContext.document.activeElement = opener;
api.open('history', { opener, page: 'reader-then-sheet' });
const readerThenSheetGeneration = api.state.generation;
const readerThenSheetReturn = api.state.historyReturnGeneration;
reduceMotion = false;
api.close('reader-then-sheet-close', 'none');
const readerThenSheetCallback = timers.get(api.state.historyTimer);
api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheetReturnGeneration: readerThenSheetReturn });
assert.equal(dialog.open, false);
reduceMotion = true;
api.pop({
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'search', page: 'latest-sheet', generation: readerThenSheetGeneration,
    returnGeneration: readerThenSheetReturn }
});
assert.equal(dialog.open, true, 'later valid sheet event wins after accepted reader destination');
assert.equal(api.state.kind, 'search');
readerThenSheetCallback();
assert.equal(api.state.kind, 'search', 'old close fallback cannot undo latest sheet event');
api.state.historyOwned = false;
api.close('reader-then-sheet-cleanup', 'none');

api.open('history', { opener, page: 'stale-close-timer' });
reduceMotion = false;
api.close('history-timer');
const staleHistoryTimer = api.state.historyTimer;
const staleHistoryCallback = timers.get(staleHistoryTimer);
reduceMotion = true;
api.pop(currentReturnPopState());
api.open('search', { opener, page: 'new-generation' });
const generationAfterStaleClose = api.state.generation;
staleHistoryCallback();
assert.equal(api.state.generation, generationAfterStaleClose);
assert.equal(dialog.open, true, 'stale history fallback cannot close a reopened generation');
assert.equal(api.state.kind, 'search');
api.close('stale-history-cleanup');
api.pop(currentReturnPopState());

controllerContext.history.state = {
  view: 'verses', book: 'John', chapter: '3', verse: '16', popup: 'menu'
};
controllerContext.fabPanelHistoryOpen = true;
const popupClosesBefore = popupCloseCalls;
const popupReplacesBefore = historyCalls.replace.length;
const popupPushesBefore = historyCalls.push.length;
assert.equal(api.open('history', { opener }), true);
assert.equal(popupCloseCalls, popupClosesBefore + 1, 'opening a sheet closes an underlying popup menu');
assert.equal(controllerContext.fabPanelHistoryOpen, false);
assert.equal(historyCalls.replace.length, popupReplacesBefore + 2,
  'popup normalization is followed by generation-tagging the canonical return entry');
assert.equal(historyCalls.replace.at(-1)[0].popup, undefined);
assert.equal(historyCalls.push.length, popupPushesBefore + 1, 'sheet then pushes over the canonical reader entry');
api.close('popup-normalized');
api.pop(currentReturnPopState());

api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
const bodyMeasureFrame = [...frames.keys()][0];
frames.get(bodyMeasureFrame)();
frames.delete(bodyMeasureFrame);
body.scrollTop = 40;
body.scrollHeight = 800;
body.clientHeight = 400;
handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 18, clientX: 10, clientY: 10, timeStamp: 1
});
handle.dispatch('pointermove', {
  pointerId: 18, clientX: 10, clientY: 30, timeStamp: 20, preventDefault() {}
});
assert.equal(api.state.pointer.id, 18, 'bottom handle drag ignores the scrolled body origin');
handle.dispatch('pointercancel', { pointerId: 18, clientY: 30, timeStamp: 21 });
api.state.edge = 'top';
body.scrollTop = 0;
handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 19, clientX: 10, clientY: 30, timeStamp: 30
});
handle.dispatch('pointermove', {
  pointerId: 19, clientX: 10, clientY: 10, timeStamp: 50, preventDefault() {}
});
assert.equal(api.state.pointer.id, 19, 'top handle drag ignores a body that is not scrolled to its end');
handle.dispatch('pointercancel', { pointerId: 19, clientY: 10, timeStamp: 51 });
api.state.edge = 'bottom';
body.scrollTop = 40;
body.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 20, clientX: 10, clientY: 10, timeStamp: 1
});
let bodyPrevented = 0;
body.dispatch('pointermove', {
  pointerId: 20, clientX: 11, clientY: 30, timeStamp: 20, preventDefault() { bodyPrevented += 1; }
});
assert.equal(api.state.pointer, null, 'body drag does not transfer away from a scroll boundary');
assert.equal(bodyPrevented, 0);
assert.equal(body.hasPointerCapture(20), false);

body.scrollTop = 0;
body.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 21, clientX: 10, clientY: 10, timeStamp: 30
});
body.dispatch('pointermove', {
  pointerId: 21, clientX: 11, clientY: 35, timeStamp: 50, preventDefault() { bodyPrevented += 1; }
});
assert.equal(api.state.pointer.id, 21, 'body drag transfers to sheet at the relevant boundary');
assert.equal(body.hasPointerCapture(21), true);
assert.equal(bodyPrevented, 1);
body.dispatch('pointercancel', { pointerId: 21, clientY: 35 });
assert.equal(body.hasPointerCapture(21), false);

const selectorScroller = fakeElement();
selectorScroller.clientHeight = 200;
selectorScroller.scrollHeight = 600;
const selectorBlank = fakeElement();
selectorBlank.closest = () => null;
api.state.kind = 'selection';
activeMeasurementPanel = selectorScroller;
body.scrollTop = 0;
body.clientHeight = 400;
body.scrollHeight = 400;
for (const [pointerType, pointerId] of [['mouse', 22], ['pen', 23]]) {
  selectorScroller.scrollTop = 80;
  body.dispatch('pointerdown', {
    isPrimary: true, button: 0, pointerId, pointerType, target: selectorBlank,
    clientX: 10, clientY: 10, timeStamp: 1
  });
  selectorScroller.scrollTop = 0;
  let prevented = 0;
  body.dispatch('pointermove', {
    pointerId, pointerType, target: selectorBlank, clientX: 11, clientY: 35, timeStamp: 20,
    preventDefault() { prevented += 1; }
  });
  assert.equal(api.state.pointer, null, `${pointerType} uses the active selector's frozen mid-scroll geometry`);
  assert.equal(api.state.candidate, null);
  assert.equal(prevented, 0, `${pointerType} mid-scroll motion remains native`);
  assert.equal(body.hasPointerCapture(pointerId), false);
}

for (const [pointerType, pointerId] of [['mouse', 24], ['pen', 25]]) {
  selectorScroller.scrollTop = 0;
  body.dispatch('pointerdown', {
    isPrimary: true, button: 0, pointerId, pointerType, target: selectorBlank,
    clientX: 10, clientY: 10, timeStamp: 30
  });
  selectorScroller.scrollTop = 80;
  let prevented = 0;
  body.dispatch('pointermove', {
    pointerId, pointerType, target: selectorBlank, clientX: 11, clientY: 35, timeStamp: 50,
    preventDefault() { prevented += 1; }
  });
  assert.equal(api.state.pointer.id, pointerId, `${pointerType} can claim from the frozen selector boundary`);
  assert.equal(prevented, 1);
  assert.equal(body.hasPointerCapture(pointerId), true);
  body.dispatch('pointercancel', { pointerId, clientY: 35 });
}

const selectorGridCell = fakeElement();
selectorGridCell.tagName = 'BUTTON';
selectorGridCell.closest = selector => selector.includes('button') ? selectorGridCell : null;
for (const [pointerType, pointerId] of [['mouse', 26], ['pen', 27]]) {
  selectorScroller.scrollTop = 0;
  body.dispatch('pointerdown', {
    isPrimary: true, button: 0, pointerId, pointerType, target: selectorGridCell,
    clientX: 10, clientY: 10, timeStamp: 60
  });
  assert.equal(api.state.candidate, null, `${pointerType} grid cells remain horizontal-only`);
  assert.equal(api.state.pointer, null);
}

selectorScroller.scrollTop = Infinity;
body.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 28, pointerType: 'pen', target: selectorBlank,
  clientX: 10, clientY: 10, timeStamp: 70
});
assert.equal(api.state.candidate, null, 'nonfinite active-scroller geometry is rejected before ownership');
activeMeasurementPanel = null;
api.state.kind = 'history';

api.snap('determined', true);
body.scrollTop = 0;
body.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 40, clientX: 10, clientY: 10, timeStamp: 100
});
body.dispatch('pointermove', {
  pointerId: 40, clientX: 11, clientY: 40, timeStamp: 120, preventDefault() {}
});
const appliedBodyFrame = api.state.frame;
frames.get(appliedBodyFrame)();
frames.delete(appliedBodyFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-drag-offset'), '30px');
assert.equal(body.hasPointerCapture(40), true);
body.dispatch('pointermove', {
  pointerId: 40, clientX: 11, clientY: 0, timeStamp: 140, preventDefault() {}
});
assert.equal(api.state.pointer.id, 40, 'claimed gesture keeps its frozen geometry through direction reversal');
assert.equal(body.hasPointerCapture(40), true);
const reversedBodyFrame = api.state.frame;
frames.get(reversedBodyFrame)();
frames.delete(reversedBodyFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-live-height'), (api.state.determinedHeight + 10) + 'px');
body.dispatch('pointercancel', { pointerId: 40, clientY: 0, timeStamp: 141 });

body.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 41, clientX: 10, clientY: 10, timeStamp: 200
});
body.dispatch('pointermove', {
  pointerId: 41, clientX: 11, clientY: 40, timeStamp: 220, preventDefault() {}
});
const pendingBodyFrame = api.state.frame;
assert.ok(pendingBodyFrame);
body.dispatch('pointermove', {
  pointerId: 41, clientX: 11, clientY: 0, timeStamp: 240, preventDefault() {}
});
assert.equal(api.state.pointer.id, 41, 'pending frame is reused through direction reversal');
assert.equal(api.state.frame, pendingBodyFrame);
assert.equal(body.hasPointerCapture(41), true);
body.dispatch('pointercancel', { pointerId: 41, clientY: 0, timeStamp: 241 });
assert.ok(cancelledFrames.includes(pendingBodyFrame));

const interactiveTarget = { closest() { return this; } };
body.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 22, clientX: 10, clientY: 10, timeStamp: 60,
  target: interactiveTarget
});
assert.equal(api.state.pointer, null, 'body drag ignores controls and selectable interactive content');

textSelectionActive = true;
body.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 24, clientX: 10, clientY: 10, timeStamp: 65
});
assert.equal(api.state.pointer, null, 'body drag does not steal an active text selection');
textSelectionActive = false;

body.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 23, clientX: 10, clientY: 10, timeStamp: 70
});
body.dispatch('pointermove', {
  pointerId: 23, clientX: 35, clientY: 11, timeStamp: 80, preventDefault() { bodyPrevented += 1; }
});
assert.equal(api.state.pointer, null, 'horizontal body gesture is released to pager/content');
assert.equal(body.hasPointerCapture(23), false);

api.snap('fullscreen', true);
handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 30, clientX: 10, clientY: 100, timeStamp: 100
});
handle.dispatch('pointermove', {
  pointerId: 30, clientX: 11, clientY: 120, timeStamp: 120, preventDefault() {}
});
handle.dispatch('pointerup', { pointerId: 30, clientY: 120, timeStamp: 201 });
assert.equal(api.state.snap, 'fullscreen', 'velocity expires after an 81ms hold');

handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 31, clientX: 10, clientY: 100, timeStamp: 300
});
handle.dispatch('pointermove', {
  pointerId: 31, clientX: 11, clientY: 120, timeStamp: 320, preventDefault() {}
});
handle.dispatch('pointerup', { pointerId: 31, clientY: 120, timeStamp: 400 });
assert.equal(api.state.snap, 'determined', 'velocity remains fresh through the exact 80ms window');

const activePanelA = fakeElement();
activePanelA.scrollHeight = 180;
const activePanelB = fakeElement();
activePanelB.scrollHeight = 220;
const hiddenPanel = fakeElement();
hiddenPanel.scrollHeight = 900;
measure.scrollHeight = hiddenPanel.scrollHeight;
activeMeasurementPanel = activePanelA;
api.state.historyOwned = false;
api.close('selector-history-chain-setup');
api.open('selection', { page: 'books' });
assert.equal(resizeObserverInstances.at(-1).targets[0], activePanelA,
  'selection measurement observes only the active panel, not a taller hidden panel');
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '252px');
const firstSelectionObserver = resizeObserverInstances.at(-2);
activeMeasurementPanel = activePanelB;
api.retarget();
assert.ok(firstSelectionObserver.disconnected);
assert.equal(resizeObserverInstances.at(-1).targets[0], activePanelB, 'page settle retargets the observer');
for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
assert.equal(dialog.style.getPropertyValue('--sheet-height'), '292px',
  'active page changes recompute without hidden persistent panel inflation');

const selectorReturnState = historyCalls.replace.map(call => call[0]).findLast(state =>
  state && state.sheetReturnGeneration === api.state.historyReturnGeneration);
assert.ok(selectorReturnState, 'recorded selector chain has its adjacent reader return entry');
assert.equal(api.selectPage('chapters', true), true);
const selectorChapterState = historyCalls.replace.at(-1)[0];
assert.equal(selectorChapterState.sheet.generation, api.state.generation,
  'selector replacement preserves current runtime generation');
assert.equal(selectorChapterState.sheet.returnGeneration, api.state.historyReturnGeneration,
  'selector replacement preserves immutable return generation');
assert.equal(api.selectPage('verses', true), true);
const selectorReplacementState = historyCalls.replace.at(-1)[0];
assert.equal(selectorReplacementState.sheet.generation, selectorChapterState.sheet.generation);
assert.equal(selectorReplacementState.sheet.returnGeneration, selectorChapterState.sheet.returnGeneration,
  'book/chapter page advances retain both lifecycle tokens');
api.pop(selectorReturnState);
assert.equal(dialog.open, false);
api.pop(selectorReplacementState);
assert.equal(dialog.open, true);
assert.equal(api.state.kind, 'selection');
assert.equal(api.state.page, 'verses');
api.pop(selectorReturnState);
assert.equal(dialog.open, false, 'selector replacement survives recorded Back/Forward/Back');

for (let cycle = 0; cycle < 3; cycle += 1) {
  assert.equal(api.open('history', { opener, page: 'lifecycle-' + cycle }), true);
  for (const [id, callback] of [...frames]) { callback(); frames.delete(id); }
  handle.dispatch('pointerdown', {
    isPrimary: true, button: 0, pointerId: 200 + cycle, clientX: 0, clientY: 0, timeStamp: 1
  });
  handle.dispatch('pointermove', {
    pointerId: 200 + cycle, clientX: 0, clientY: 20, timeStamp: 20, preventDefault() {}
  });
  handle.dispatch('pointercancel', { pointerId: 200 + cycle, clientY: 20, timeStamp: 21 });
  assert.equal(api.close('lifecycle'), true);
  api.pop(currentReturnPopState());
  assert.equal(dialog.open, false);
  for (const field of ['candidate', 'pointer', 'gesture', 'frame', 'measureFrame', 'settleTimer',
    'historyTimer', 'resizeObserver', 'contentCleanup', 'closeGeneration', 'pendingPostCloseState',
    'pendingPostCloseDestination']) {
    assert.equal(api.state[field], null, `cycle ${cycle} releases ${field}`);
  }
  assert.equal(measure.textContent, '', `cycle ${cycle} releases rendered nodes`);
  assert.equal(handle.hasPointerCapture(200 + cycle), false, `cycle ${cycle} releases capture`);
  assert.equal(dialog.classList.contains('is-dragging'), false);
  assert.equal(dialog.classList.contains('is-closing'), false);
  assert.equal(dialog.listenerCount + handle.listenerCount + body.listenerCount, installedListenerCount,
    `cycle ${cycle} does not retain listeners`);
  assert.equal(resizeObserverInstances.at(-1).disconnected, true, `cycle ${cycle} disconnects observer`);
}

if (dialog.open) {
  api.state.historyOwned = false;
  api.close('motion-test-setup');
}
reduceMotion = false;
const motionClassSnapshot = () => [
  'is-preparing', 'is-opening', 'is-closing', 'no-motion', 'edge-top', 'edge-bottom',
  'inline-left', 'inline-right', 'snap-determined', 'snap-fullscreen'
].filter(name => dialog.classList.contains(name));
assert.equal(api.open('history', { opener, edge: 'top' }), true);
assert.equal(api.state.phase, 'opening');
assert.equal(dialog.classList.contains('is-preparing'), true,
  'new sheet is hidden before its first paint');
assert.equal(dialog.classList.contains('is-opening'), true,
  'new top sheet starts in its off-edge pose');
assert.equal(dialog.style.getPropertyValue('--sheet-backdrop-opacity'), '0',
  'sheet and backdrop begin at paired zero progress');
assert.equal(dialog.classList.contains('edge-top'), true);
assert.equal(dialog.classList.contains('inline-right'), true,
  'vertical opening motion preserves the immutable horizontal anchor');
for (const key of ['Enter', ' ', 'ArrowDown', 'ArrowUp']) {
  const openingEvent = { key, repeat: false, prevented: false, preventDefault() { this.prevented = true; } };
  handle.dispatch('keydown', openingEvent);
  assert.equal(openingEvent.prevented, false, `${key} before first opening paint is ignored`);
  assert.equal(api.state.snap, 'determined');
  assert.equal(api.state.phase, 'opening');
}
const interruptedOpenFrame = api.state.openFrame;
const interruptedOpenCallback = frames.get(interruptedOpenFrame);
interruptedOpenCallback();
frames.delete(interruptedOpenFrame);
assert.equal(dialog.classList.contains('is-preparing'), false,
  'first paint reveals the measured off-edge pose');
assert.equal(dialog.classList.contains('is-opening'), true);
assert.equal(dialog.style.getPropertyValue('--sheet-backdrop-opacity'), '0',
  'first reveal preserves paired zero progress for both backdrop and sheet');
for (const key of ['Enter', ' ', 'ArrowDown', 'ArrowUp']) {
  const openingEvent = { key, repeat: false, prevented: false, preventDefault() { this.prevented = true; } };
  handle.dispatch('keydown', openingEvent);
  assert.equal(openingEvent.prevented, false, `${key} between opening paints is ignored`);
  assert.equal(api.state.snap, 'determined');
  assert.equal(api.state.phase, 'opening');
}
const interruptedOpenFrame2 = api.state.openFrame2;
const interruptedOpenCallback2 = frames.get(interruptedOpenFrame2);
interruptedOpenCallback2();
frames.delete(interruptedOpenFrame2);
assert.equal(dialog.classList.contains('is-opening'), false);
assert.equal(dialog.style.getPropertyValue('--sheet-backdrop-opacity'), '',
  'second paint starts sheet and backdrop transitions together');
const pairedOpenTimer = api.state.settleTimer;
timers.get(pairedOpenTimer)();
timers.delete(pairedOpenTimer);
assert.equal(api.state.phase, 'idle');
assert.equal(dialog.classList.contains('is-preparing'), false);
assert.equal(dialog.classList.contains('is-opening'), false);
assert.equal(dialog.style.getPropertyValue('--sheet-backdrop-opacity'), '');
api.state.historyOwned = false;
api.close('paired-open-test-reset');
const pairedResetTimer = api.state.settleTimer;
timers.get(pairedResetTimer)();
timers.delete(pairedResetTimer);

assert.equal(api.open('history', { opener, edge: 'top' }), true);
const interruptedRevealFrame = api.state.openFrame;
frames.get(interruptedRevealFrame)();
frames.delete(interruptedRevealFrame);
const staleInterruptedFrame2 = api.state.openFrame2;
const staleInterruptedCallback2 = frames.get(staleInterruptedFrame2);
api.state.historyOwned = false;
const openingEscape = { key: 'Escape', repeat: false, prevented: false, preventDefault() { this.prevented = true; } };
handle.dispatch('keydown', openingEscape);
assert.equal(openingEscape.prevented, true, 'Escape can close between opening paints');
assert.ok(cancelledFrames.includes(staleInterruptedFrame2), 'close cancels the owned second opening frame');
assert.match(dialog.style.getPropertyValue('--sheet-drag-offset'), /^-\d+px$/,
  'top close reverses toward the same navbar edge');
const interruptedCloseSnapshot = {
  phase: api.state.phase,
  classes: motionClassSnapshot(),
  offset: dialog.style.getPropertyValue('--sheet-drag-offset'),
  focus: opener.focusCount
};
staleInterruptedCallback2();
assert.deepEqual({
  phase: api.state.phase,
  classes: motionClassSnapshot(),
  offset: dialog.style.getPropertyValue('--sheet-drag-offset'),
  focus: opener.focusCount
}, interruptedCloseSnapshot, 'stale second opening paint cannot mutate close state or focus');
const interruptedCloseTimer = api.state.settleTimer;
timers.get(interruptedCloseTimer)();
timers.delete(interruptedCloseTimer);
assert.equal(dialog.open, false);

assert.equal(api.open('history', { opener }), true);
const replacedOpenFrame = api.state.openFrame;
const replacedOpenCallback = frames.get(replacedOpenFrame);
assert.equal(api.open('search', { opener: replacementOpener }), true);
assert.ok(cancelledFrames.includes(replacedOpenFrame), 'kind replacement cancels the old opening paint');
const replacementSnapshot = {
  kind: api.state.kind,
  phase: api.state.phase,
  anchor: api.state.anchor,
  classes: motionClassSnapshot(),
  focus: replacementOpener.focusCount
};
replacedOpenCallback();
assert.deepEqual({
  kind: api.state.kind,
  phase: api.state.phase,
  anchor: api.state.anchor,
  classes: motionClassSnapshot(),
  focus: replacementOpener.focusCount
}, replacementSnapshot, 'stale kind opening callback cannot mutate its replacement');

const staleResizeFrame = api.state.measureFrame;
const staleResizeCallback = frames.get(staleResizeFrame);
api.retarget();
const writesBeforeStaleResize = dialog.styleWriteCount;
staleResizeCallback();
assert.equal(dialog.styleWriteCount, writesBeforeStaleResize,
  'a cancelled same-generation resize frame cannot write newer geometry');

const anchoredClass = api.state.anchor === 'left' ? 'inline-left' : 'inline-right';
api.snap('fullscreen', false);
const staleMaximizeTimer = api.state.settleTimer;
const staleMaximizeCallback = timers.get(staleMaximizeTimer);
assert.equal(dialog.classList.contains(anchoredClass), true,
  'maximize expands inward without changing the side anchor');
api.snap('determined', false);
const restoreTimer = api.state.settleTimer;
staleMaximizeCallback();
assert.equal(api.state.phase, 'settling', 'stale maximize completion cannot settle an interrupted restore');
assert.equal(api.state.snap, 'determined');
assert.equal(dialog.classList.contains(anchoredClass), true,
  'restore contracts toward the same immutable side anchor');
timers.get(restoreTimer)();
timers.delete(restoreTimer);
assert.equal(api.state.phase, 'idle');

api.state.historyOwned = false;
api.close('motion-test-normal-cleanup');
const normalCleanupTimer = api.state.settleTimer;
timers.get(normalCleanupTimer)();
timers.delete(normalCleanupTimer);
reduceMotion = true;
const frameCountBeforeReducedOpen = frames.size;
const timerCountBeforeReducedOpen = timers.size;
replacementOpenerLeft = 20;
assert.equal(api.open('history', { opener: replacementOpener, edge: 'bottom' }), true);
assert.equal(api.state.phase, 'idle', 'reduced motion reaches the final open phase synchronously');
assert.equal(api.state.openFrame, null);
assert.equal(api.state.openFrame2, null);
assert.equal(dialog.classList.contains('is-preparing'), false);
assert.equal(dialog.classList.contains('is-opening'), false);
assert.equal(dialog.classList.contains('edge-bottom'), true);
assert.equal(dialog.classList.contains('inline-left'), true,
  'bottom opening also preserves a left-side opener anchor');
assert.equal(timers.size, timerCountBeforeReducedOpen, 'reduced open has no animation fallback timer');
assert.equal(frames.size, frameCountBeforeReducedOpen + 2,
  'reduced open schedules only measurement and fade work, never lifecycle animation frames');
const reducedHistoryReturn = currentReturnPopState();
const reducedBacksBeforeClose = historyCalls.back;
const reducedFramesBeforeClose = frames.size;
const reducedTimersBeforeClose = timers.size;
assert.equal(api.state.historyOwned, true, 'reduced close test retains real history ownership');
assert.equal(api.close('motion-test-reduced-cleanup'), true);
assert.equal(historyCalls.back, reducedBacksBeforeClose + 1, 'history-owned reduced close requests Back exactly once');
assert.equal(dialog.open, false, 'history-owned reduced close completes synchronously');
assert.equal(api.state.phase, 'closed');
assert.equal(api.state.openFrame, null);
assert.equal(api.state.openFrame2, null);
assert.equal(api.state.historyTimer, null, 'reduced close owns no history fallback timer');
assert.equal(api.state.settleTimer, null, 'reduced close owns no lifecycle fallback timer');
assert.ok(frames.size <= reducedFramesBeforeClose, 'reduced close schedules no lifecycle animation frame');
assert.equal(timers.size, reducedTimersBeforeClose, 'reduced history close schedules no fallback timer');
assert.equal(api.pop(reducedHistoryReturn), false, 'late matching Back reconciliation is an idempotent no-op');
assert.equal(dialog.open, false);
assert.equal(api.close('motion-test-reduced-repeat'), false, 'repeat close remains idempotent after immediate completion');

const selectionFrameBaseline = frames.size;
const selectionTimerBaseline = timers.size;
trackSelectionResources = true;
for (let cycle = 0; cycle < 3; cycle += 1) {
  const cleanupBaseline = selectionCleanupCount;
  assert.equal(api.open('selection', { opener, page: 'books' }), true);
  assert.equal(selectionMediaListeners.size, 1, `selection cycle ${cycle} installs one media listener`);
  assert.equal(api.open('selection', { opener: replacementOpener, page: 'chapters' }), true);
  assert.equal(selectionCleanupCount, cleanupBaseline + 1, `selection cycle ${cycle} cleans replaced owner`);
  assert.equal(selectionMediaListeners.size, 1, `selection cycle ${cycle} replaces rather than retains media listener`);
  api.state.determinedHeight = 256;
  handle.dispatch('pointerdown', {
    isPrimary: true, button: 0, pointerId: 300 + cycle, clientX: 0, clientY: 0, timeStamp: 1
  });
  handle.dispatch('pointermove', {
    pointerId: 300 + cycle, clientX: 0, clientY: 20, timeStamp: 20, preventDefault() {}
  });
  assert.equal(handle.hasPointerCapture(300 + cycle), true);
  handle.dispatch('pointercancel', { pointerId: 300 + cycle, clientY: 20, timeStamp: 21 });
  assert.equal(api.close('selection-lifecycle'), true);
  api.pop(currentReturnPopState());
  assert.equal(selectionCleanupCount, cleanupBaseline + 2, `selection cycle ${cycle} invokes both cleanup callbacks`);
  assert.equal(selectionMediaListeners.size, 0, `selection cycle ${cycle} releases media listener`);
  assert.equal(frames.size, selectionFrameBaseline, `selection cycle ${cycle} returns RAF registry to baseline`);
  assert.equal(timers.size, selectionTimerBaseline, `selection cycle ${cycle} returns timer registry to baseline`);
  assert.equal(resizeObserverInstances.at(-1).disconnected, true);
  assert.equal(handle.hasPointerCapture(300 + cycle), false);
  assert.equal(measure.textContent, '', `selection cycle ${cycle} releases retained nodes`);
  assert.equal(dialog.listenerCount + handle.listenerCount + body.listenerCount, installedListenerCount);
}

console.log('bible sheet controller tests passed');
