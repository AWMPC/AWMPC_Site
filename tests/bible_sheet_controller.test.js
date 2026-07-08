const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const biblePath = process.env.BIBLE_UNDER_TEST || path.join(root, 'bible.html');
const bible = fs.readFileSync(biblePath, 'utf8');

const dialogs = [...bible.matchAll(/<dialog\b[^>]*\bid="app-sheet"[^>]*>/g)];
assert.equal(dialogs.length, 1, 'one persistent app sheet dialog is present');
assert.match(dialogs[0][0], /aria-labelledby="app-sheet-title"/);
assert.match(bible, /id="app-sheet-handle"[^>]*aria-label="Resize sheet"/);
assert.match(bible, /id="app-sheet-close"[^>]*aria-label="Close"/);
assert.match(bible, /id="app-sheet-body"[^>]*tabindex="0"/);
assert.match(bible, /\.app-sheet\.edge-top/);
assert.match(bible, /\.app-sheet\.snap-compact[\s\S]*70dvh/);
assert.match(bible, /\.app-sheet\.snap-fullscreen[\s\S]*100dvh/);
assert.match(bible, /\.app-sheet::backdrop[\s\S]*backdrop-filter: blur\(3px\)/);
assert.match(bible, /env\(safe-area-inset-bottom/);
assert.match(bible, /env\(safe-area-inset-top/);
assert.match(bible, /\.app-sheet\.snap-fullscreen[\s\S]*padding-top: env\(safe-area-inset-top/,
  'bottom-edge fullscreen preserves the top safe area');

const pureStart = bible.indexOf('/* APP SHEET PURE HELPERS START */');
const pureEnd = bible.indexOf('/* APP SHEET PURE HELPERS END */');
assert.ok(pureStart >= 0 && pureEnd > pureStart, 'pure sheet decisions are testable');
const pureSource = bible.slice(pureStart, pureEnd) + '\nthis.hooks = {' +
  'validKind: isValidAppSheetKind, validEdge: isValidAppSheetEdge, validSnap: isValidAppSheetSnap,' +
  'axis: appSheetAxis, boundary: appSheetBoundaryAllowsDrag, outcome: appSheetDragOutcome,' +
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
assert.equal(h.validSnap('half'), false);

assert.equal(h.axis(7, 7), null, 'axis remains unlocked before 8px');
assert.equal(h.axis(9, 2), 'x', 'horizontal motion locks horizontal');
assert.equal(h.axis(2, -9), 'y', 'vertical motion locks vertical');
assert.equal(h.boundary('bottom', 1, 0, 100, 500), true, 'bottom close drag starts at scroll top');
assert.equal(h.boundary('bottom', 1, 12, 100, 500), false, 'nested scroll consumes bottom close drag');
assert.equal(h.boundary('top', -1, 400, 100, 500), true, 'top close drag starts at scroll bottom');
assert.equal(h.boundary('top', -1, 350, 100, 500), false);

assert.equal(h.outcome('bottom', 'compact', -90, -0.1), 'fullscreen');
assert.equal(h.outcome('bottom', 'compact', 90, 0.1), 'closed');
assert.equal(h.outcome('top', 'compact', 90, 0.1), 'fullscreen');
assert.equal(h.outcome('top', 'compact', -90, -0.1), 'closed');
assert.equal(h.outcome('bottom', 'compact', 10, 0.41), 'closed', 'velocity threshold dismisses');
assert.equal(h.outcome('bottom', 'fullscreen', 90, 0.1), 'compact');
assert.equal(h.outcome('top', 'fullscreen', -90, -0.1), 'compact');
assert.equal(h.outcome('bottom', 'compact', 20, 0.1), 'compact');
assert.equal(h.outcome('bottom', 'compact', 79, 0), 'compact');
assert.equal(h.outcome('bottom', 'compact', 80, 0), 'compact');
assert.equal(h.outcome('bottom', 'compact', 81, 0), 'closed', 'distance changes immediately above 80px');
assert.equal(h.outcome('bottom', 'compact', 20, 0.399), 'compact');
assert.equal(h.outcome('bottom', 'compact', 20, 0.4), 'compact');
assert.equal(h.outcome('bottom', 'compact', 20, 0.401), 'closed', 'velocity changes immediately above .4px/ms');

function outcomeFromMutation(find, replacement, displacement, velocity) {
  const mutated = bible.slice(pureStart, pureEnd).replace(find, replacement);
  assert.notEqual(mutated, bible.slice(pureStart, pureEnd), 'requested mutation must alter production source');
  const mutatedContext = { Math };
  vm.runInNewContext(mutated + '\nthis.outcome = appSheetDragOutcome;', mutatedContext);
  return mutatedContext.outcome('bottom', 'compact', displacement, velocity);
}
assert.equal(outcomeFromMutation(/> 80/g, '> 89', 81, 0), 'compact', '80-to-89 mutation is killed');
assert.equal(outcomeFromMutation(/> \.4/g, '> .405', 20, 0.401), 'compact', '.4-to-.405 mutation is killed');

const validState = h.state({
  view: 'verses', book: 'John', chapter: '3', verse: '16',
  sheet: { kind: 'history', page: 'recent' }
});
assert.deepEqual(JSON.parse(JSON.stringify(validState)), {
  view: 'verses', book: 'John', chapter: '3', verse: '16',
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

function fakeElement() {
  const listeners = Object.create(null);
  const classes = new Set();
  const properties = Object.create(null);
  const captures = new Set();
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
const close = fakeElement();
const title = fakeElement();
const body = fakeElement();
const opener = fakeElement();
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
  appSheetClose: close,
  appSheetTitle: title,
  appSheetBody: body,
  document: { activeElement: opener },
  window: {
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
const installedListenerCount = dialog.listenerCount + handle.listenerCount + close.listenerCount;
api.install();
assert.equal(dialog.listenerCount + handle.listenerCount + close.listenerCount, installedListenerCount,
  'listener setup is idempotent');

let cleanupCount = 0;
assert.equal(api.register('history', {
  title: 'Registered History',
  render(target, sheet) {
    target.textContent = 'history:' + (sheet.page || 'root');
    return () => { cleanupCount += 1; };
  }
}), true);
assert.equal(api.open('history', { opener, page: 'recent' }), true);
assert.equal(dialog.open, true);
assert.equal(title.textContent, 'Registered History');
assert.equal(body.textContent, 'history:recent');
assert.equal(historyCalls.push.length, 1, 'first open pushes one sheet entry');
assert.equal(historyCalls.replace.length, 0);

assert.equal(api.open('search', { page: 'results' }), true);
assert.equal(historyCalls.push.length, 1, 'switching an open sheet never pushes again');
assert.equal(historyCalls.replace.length, 1, 'switching kind/page replaces the owned sheet entry');
assert.equal(cleanupCount, 1, 'old content cleanup runs before replacement');
assert.equal(title.textContent, 'Search');
assert.notEqual(body.textContent, '', 'default descriptors render deterministic content');

assert.equal(api.close('button'), true);
assert.equal(historyCalls.back, 1, 'dismissal traverses back from an owned entry');
assert.equal(dialog.open, true, 'dialog waits for popstate before closing');
assert.equal(api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16' }), true);
assert.equal(dialog.open, false);
assert.equal(opener.focusCount, 1, 'connected opener receives focus after close');

assert.equal(api.pop({
  view: 'verses', book: 'John', chapter: '3', verse: '16', sheet: { kind: 'history', page: 'recent' }
}), true, 'Forward reopens a validated sheet state');
assert.equal(dialog.open, true);
assert.equal(title.textContent, 'Registered History', 'Forward resolves the registered title');
assert.equal(body.textContent, 'history:recent', 'Forward resolves registered content and page');
assert.equal(historyCalls.push.length, 1, 'Forward restoration does not push');
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

api.snap('compact', true);
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

const backsBeforeCloseButton = historyCalls.back;
close.dispatch('click');
assert.equal(historyCalls.back, backsBeforeCloseButton + 1, 'explicit close button uses requestCloseAppSheet/history.back');
assert.equal(dialog.open, true, 'history-owned close button waits for popstate');
api.pop({ view: 'verses', book: 'John', chapter: '3', verse: '16' });
assert.equal(dialog.open, false, 'close-button dismissal converges on closure after popstate');

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

api.snap('compact', true);
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
assert.equal(api.state.snap, 'compact');
assert.equal(dialog.classList.contains('snap-compact'), true);
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
assert.equal(api.state.snap, 'compact');

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
assert.equal(api.state.snap, 'compact', 'velocity remains fresh through the exact 80ms window');

console.log('bible sheet controller tests passed');
