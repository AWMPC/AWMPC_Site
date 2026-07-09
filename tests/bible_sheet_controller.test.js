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
assert.match(bible, /\.app-sheet\.snap-determined[\s\S]*70dvh/);
assert.match(bible, /\.app-sheet\.snap-fullscreen[\s\S]*100dvh/);
assert.match(bible, /\.app-sheet::backdrop[\s\S]*backdrop-filter: blur\(3px\)/);
assert.match(bible, /env\(safe-area-inset-bottom/);
assert.match(bible, /env\(safe-area-inset-top/);
assert.match(bible, /\.app-sheet\.snap-fullscreen[\s\S]*padding-top: env\(safe-area-inset-top/,
  'bottom-edge fullscreen preserves the top safe area');
assert.match(bible, /\.app-sheet\.edge-top \.app-sheet-handle\s*\{[^}]*order:\s*3/);

function controllerFunction(name) {
  const match = bible.match(new RegExp('  function ' + name + '\\([^\\n]*\\) \\{[\\s\\S]*?\\n  \\}'));
  assert.ok(match, name + ' controller function is present');
  return match[0];
}

function runHandleKeys(options) {
  const appSheet = fakeElement();
  const appSheetHandle = fakeElement();
  const closeCalls = [];
  const context = {
    appSheet,
    appSheetHandle,
    appSheetState: { edge: options.edge, snap: options.snap, kind: options.kind },
    resolveAppSheetDescriptor(kind) {
      const labels = { history: 'History', settings: 'Settings', search: 'Search', selection: 'Selection',
        'verse-actions': 'Verse Actions' };
      return labels[kind] ? { label: labels[kind] } : null;
    },
    setSheetSnap(snap) {
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
    dispatch(key) {
      const event = { key, prevented: false, preventDefault() { this.prevented = true; } };
      context.onAppSheetHandleKeyDown(event);
      return event;
    },
    snap: () => context.appSheetState.snap,
    dialogLabel: () => appSheet.getAttribute('aria-label'),
    handleLabel: () => appSheetHandle.getAttribute('aria-label'),
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
}

const pureStart = bible.indexOf('/* APP SHEET PURE HELPERS START */');
const pureEnd = bible.indexOf('/* APP SHEET PURE HELPERS END */');
assert.ok(pureStart >= 0 && pureEnd > pureStart, 'pure sheet decisions are testable');
const pureSource = bible.slice(pureStart, pureEnd) + '\nthis.hooks = {' +
  'validKind: isValidAppSheetKind, validEdge: isValidAppSheetEdge, validSnap: isValidAppSheetSnap,' +
  'finite: isFiniteAppSheetNumber, determinedHeight: appSheetDeterminedHeight,' +
  'effectiveDistance: appSheetEffectiveSnapDistance, outcome: appSheetReleaseOutcome,' +
  'axis: appSheetAxis, boundary: appSheetBoundaryAllowsDrag, phases: APP_SHEET_PHASES,' +
  'constants: [APP_SHEET_AXIS_LOCK_PX, APP_SHEET_SNAP_PX, APP_SHEET_SNAP_VELOCITY,' +
  'APP_SHEET_VELOCITY_RECENCY_MS, APP_SHEET_MAX_VELOCITY, APP_SHEET_CLICK_GUARD_MS],' +
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
assert.deepEqual(Array.from(h.phases), ['closed', 'idle', 'dragging', 'settling', 'closing']);
assert.deepEqual(Array.from(h.constants), [8, 80, .4, 80, 3, 500]);

assert.equal(h.finite(0), true);
assert.equal(h.finite(-1), true);
assert.equal(h.finite('1'), false, 'numeric strings are not geometry');
assert.equal(h.finite(Infinity), false);
assert.equal(h.finite(-Infinity), false);
assert.equal(h.finite(NaN), false);
assert.equal(h.finite(new Number(1)), false);

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
assert.equal(h.state({ view: 'books', sheet: { kind: 'history' } }), null);
assert.equal(h.state({ view: 'verses', book: '', chapter: '3', verse: '16', sheet: { kind: 'history' } }), null);
assert.equal(h.state({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'evil' } }), null);
assert.equal(h.state({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history', page: {} } }), null);
assert.equal(h.state({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history', page: '<script>' } }), null);

assert.match(bible, /var appSheetState = \{[\s\S]*pointer: null,[\s\S]*settleTimer: null,[\s\S]*contentCleanup: null/);
assert.match(bible, /pendingHistoryClose: false/);
assert.match(bible, /function installAppSheetListeners\(\)[\s\S]*if \(appSheetListenersInstalled\) return;[\s\S]*appSheetHandle\.addEventListener\('pointerdown'/);
assert.equal((bible.match(/installAppSheetListeners\(\);/g) || []).length, 1, 'listener installation has one startup call');
assert.match(bible, /setPointerCapture\(e\.pointerId\)/);
assert.match(bible, /'pointercancel'/);
assert.match(bible, /'lostpointercapture'/);
assert.match(bible, /cancelAnimationFrame\(appSheetState\.frame\)/);
assert.match(bible, /appSheetState\.pointer = null/);
assert.match(bible, /shouldReduceVerseMotion\(\)[\s\S]*setSheetSnap/);
assert.match(bible, /function openAppSheet\(kind, options\)/);
assert.match(bible, /function setSheetSnap\(snap, immediate\)/);
assert.match(bible, /function requestCloseAppSheet\(source\)/);
assert.match(bible, /function finishCloseAppSheet\(\)/);
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
  const captures = new Set();
  const attributes = Object.create(null);
  return {
    open: false,
    isConnected: true,
    offsetHeight: 500,
    scrollTop: 0,
    clientHeight: 400,
    scrollHeight: 400,
    textContent: '',
    listenerCount: 0,
    focusCount: 0,
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
      setProperty(name, value) { properties[name] = value; },
      removeProperty(name) { delete properties[name]; },
      getPropertyValue(name) { return properties[name] || ''; }
    },
    addEventListener(type, fn) {
      this.listenerCount += 1;
      (listeners[type] || (listeners[type] = [])).push(fn);
    },
    setAttribute(name, value) { attributes[name] = String(value); },
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null; },
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
    close() { this.open = false; },
    focus() { this.focusCount += 1; }
  };
}

const controllerStart = bible.indexOf('/* APP SHEET CONTROLLER START */');
const controllerEnd = bible.indexOf('/* APP SHEET CONTROLLER END */');
assert.ok(controllerStart >= 0 && controllerEnd > controllerStart);
const dialog = fakeElement();
const handle = fakeElement();
const body = fakeElement();
const measure = fakeElement();
const fadeTop = fakeElement();
const fadeBottom = fakeElement();
const opener = fakeElement();
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
const controllerContext = {
  Math,
  Date,
  appSheet: dialog,
  appSheetHandle: handle,
  appSheetBody: body,
  appSheetMeasure: measure,
  appSheetFadeTop: fadeTop,
  appSheetFadeBottom: fadeBottom,
  fabMain,
  document: { activeElement: opener },
  window: {
    innerHeight: 800,
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
  bible.slice(controllerStart, controllerEnd) + '\nthis.api = {' +
  'install: installAppSheetListeners, open: openAppSheet, close: requestCloseAppSheet,' +
  'pop: handleAppSheetPopState, snap: setSheetSnap, register: registerAppSheetDescriptor, state: appSheetState};';
vm.runInNewContext(controllerSource, controllerContext);
const api = controllerContext.api;

api.install();
const installedListenerCount = dialog.listenerCount + handle.listenerCount + body.listenerCount;
api.install();
assert.equal(dialog.listenerCount + handle.listenerCount + body.listenerCount, installedListenerCount,
  'listener setup is idempotent');

let cleanupCount = 0;
const historyRenderExpansion = [];
const settingsCleanupExpansion = [];
assert.equal(api.register('history', {
  title: 'Registered History',
  render(target, sheet) {
    historyRenderExpansion.push(fabMain.getAttribute('aria-expanded'));
    target.textContent = 'history:' + (sheet.page || 'root');
    return () => { cleanupCount += 1; };
  }
}), true);
assert.equal(api.register('settings', {
  title: 'Registered Settings',
  render() {
    return () => { settingsCleanupExpansion.push(fabMain.getAttribute('aria-expanded')); };
  }
}), true);
assert.equal(api.open('history', { opener, page: 'recent' }), true);
assert.equal(fabMain.getAttribute('aria-expanded'), 'false', 'History does not expand the Settings launcher');
assert.equal(dialog.open, true);
assert.equal(dialog.getAttribute('aria-label'), 'History — Bible panel');
assert.equal(handle.getAttribute('aria-label'), 'Expand History panel');
assert.equal(measure.textContent, 'history:recent');
assert.equal(historyCalls.push.length, 1, 'first open pushes one sheet entry');
assert.equal(historyCalls.replace.length, 0);

assert.equal(api.open('search', { page: 'results' }), true);
assert.equal(fabMain.getAttribute('aria-expanded'), 'false', 'kind switch away from Settings remains collapsed');
assert.equal(historyCalls.push.length, 1, 'switching an open sheet never pushes again');
assert.equal(historyCalls.replace.length, 1, 'switching kind/page replaces the owned sheet entry');
assert.equal(cleanupCount, 1, 'old content cleanup runs before replacement');
assert.equal(dialog.getAttribute('aria-label'), 'Search — Bible panel');
assert.notEqual(measure.textContent, '', 'default descriptors render deterministic content');

assert.equal(api.close('button'), true);
assert.equal(historyCalls.back, 1, 'dismissal traverses back from an owned entry');
assert.equal(dialog.open, true, 'dialog waits for popstate before closing');
assert.equal(api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16' }), true);
assert.equal(dialog.open, false);
assert.equal(opener.focusCount, 1, 'connected opener receives focus after close');
assert.equal(fabMain.getAttribute('aria-expanded'), 'false', 'close keeps Settings launcher collapsed');

assert.equal(api.open('settings', { opener }), true);
assert.equal(fabMain.getAttribute('aria-expanded'), 'true', 'opening Settings expands its launcher');
assert.equal(api.open('history', { opener }), true);
assert.equal(fabMain.getAttribute('aria-expanded'), 'false', 'switching kind collapses the Settings launcher');
assert.equal(historyRenderExpansion.at(-1), 'false', 'kind switch synchronizes before the next renderer runs');
assert.equal(settingsCleanupExpansion.at(-1), 'false', 'kind-switch cleanup observes Settings collapsed');
api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16' });

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

handle.dispatch('pointerdown', {
  isPrimary: true, button: 0, pointerId: 7, clientX: 10, clientY: 10, timeStamp: 1
});
assert.equal(api.state.pointer.id, 7);
handle.dispatch('pointermove', {
  pointerId: 7, clientX: 11, clientY: 110, timeStamp: 101, preventDefault() {}
});
const firstDragFrame = api.state.frame;
assert.ok(firstDragFrame, 'drag DOM writes are scheduled through RAF');
assert.equal(dialog.style.getPropertyValue('--sheet-drag-offset'), '');
handle.dispatch('pointermove', {
  pointerId: 7, clientX: 11, clientY: 120, timeStamp: 111, preventDefault() {}
});
assert.equal(api.state.frame, firstDragFrame, 'multiple drag moves coalesce into one RAF');
frames.get(firstDragFrame)();
frames.delete(firstDragFrame);
assert.equal(dialog.style.getPropertyValue('--sheet-drag-offset'), '110px');
assert.equal(dialog.style.getPropertyValue('--sheet-backdrop-opacity'), '0.78', 'backdrop progress is proportional');

handle.dispatch('pointermove', {
  pointerId: 7, clientX: 11, clientY: 130, timeStamp: 121, preventDefault() {}
});
const cancelledDragFrame = api.state.frame;
handle.dispatch('pointercancel', { pointerId: 7, clientY: 30 });
assert.equal(api.state.pointer, null, 'pointercancel resets pointer state');
assert.ok(cancelledFrames.includes(cancelledDragFrame), 'pointercancel cancels pending RAF');
assert.equal(handle.releaseCount, 1, 'pointercancel explicitly releases held pointer capture');

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
dialog.dispatch('cancel', { preventDefault() { cancelPrevented += 1; } });
assert.equal(cancelPrevented, 1, 'native Escape/cancel is prevented for the unified close path');
assert.equal(historyCalls.back, backsBeforeCancel + 1, 'Escape/cancel requests history dismissal');
api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16' });
assert.equal(dialog.classList.contains('edge-top'), false, 'close resets top-edge presentation state');
assert.equal(dialog.classList.contains('edge-bottom'), true);

api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
const backsBeforeBackdrop = historyCalls.back;
dialog.dispatch('click', { target: dialog });
assert.equal(historyCalls.back, backsBeforeBackdrop + 1, 'backdrop click uses the unified history close path');
api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16' });

api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
reduceMotion = false;
api.state.historyOwned = false;
api.close('test-timer');
const pendingSettleTimer = api.state.settleTimer;
assert.ok(pendingSettleTimer, 'animated close stores its settle timer');
api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
assert.ok(cancelledTimers.includes(pendingSettleTimer), 'reopen cancels the pending settle timer');
reduceMotion = true;

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
assert.equal(api.close('first'), true);
assert.equal(api.state.pendingHistoryClose, true);
assert.equal(api.close('second'), true, 'repeat dismiss while back is pending is idempotently handled');
assert.equal(historyCalls.back, backsBeforeDoubleClose + 1, 'double dismiss requests exactly one history.back');
assert.equal(api.open('search', { page: 'during-close' }), false, 'open is rejected while history close is pending');
assert.equal(api.state.pendingHistoryClose, true, 'rejected reopen cannot race the pending traversal');
assert.equal(dialog.open, true);
api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16' });
assert.equal(dialog.open, false);
assert.equal(api.state.pendingHistoryClose, false, 'popstate clears pending close state');

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
assert.equal(historyCalls.replace.length, popupReplacesBefore + 1, 'popup state is normalized in place');
assert.equal(historyCalls.replace.at(-1)[0].popup, undefined);
assert.equal(historyCalls.push.length, popupPushesBefore + 1, 'sheet then pushes over the canonical reader entry');
api.close('popup-normalized');
api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16' });

api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history' } });
body.scrollTop = 40;
body.scrollHeight = 800;
body.clientHeight = 400;
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
assert.equal(api.state.pointer, null, 'boundary reversal clears an applied body drag');
assert.equal(body.hasPointerCapture(40), false);
assert.equal(dialog.style.getPropertyValue('--sheet-drag-offset'), '');
assert.equal(dialog.style.getPropertyValue('--sheet-backdrop-opacity'), '');
assert.equal(api.state.snap, 'determined');
assert.equal(dialog.classList.contains('snap-determined'), true);
assert.equal(dialog.classList.contains('no-motion'), false, 'boundary reset restores stable transitions');

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
assert.equal(api.state.pointer, null, 'boundary reversal clears a pending body drag');
assert.equal(api.state.frame, null);
assert.ok(cancelledFrames.includes(pendingBodyFrame), 'boundary reversal cancels pending body RAF');
assert.equal(body.hasPointerCapture(41), false);
assert.equal(dialog.style.getPropertyValue('--sheet-drag-offset'), '');
assert.equal(dialog.style.getPropertyValue('--sheet-backdrop-opacity'), '');
assert.equal(api.state.snap, 'determined');

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

console.log('bible sheet controller tests passed');
