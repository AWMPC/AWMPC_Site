const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');
const pureStart = bible.indexOf('/* APP SHEET PURE HELPERS START */');
const pureEnd = bible.indexOf('/* APP SHEET PURE HELPERS END */');
assert.ok(pureStart >= 0 && pureEnd > pureStart, 'pure sheet decisions are testable');
const pureSource = bible.slice(pureStart, pureEnd) + '\nthis.hooks = {' +
  'normalize: normalizeBibleWheelDelta, claim: bibleWheelClaimDirection,' +
  'constants: [BIBLE_WHEEL_AXIS_RATIO, BIBLE_WHEEL_ACTIVATION_PX, BIBLE_WHEEL_IDLE_MS,' +
  'BIBLE_WHEEL_LINE_PX, BIBLE_WHEEL_MAX_EVENT_PX]};';
const context = { Math };
vm.runInNewContext(pureSource, context);
const h = context.hooks;

test('wheel constants preserve navigation tuning', () => {
  assert.deepEqual(Array.from(h.constants), [1.25, 48, 160, 16, 120]);
});

test('wheel deltas normalize pixel, line, and page modes with a per-event cap', () => {
  assert.equal(h.normalize(40, 0, 800), 40, 'pixel deltas remain pixels');
  assert.equal(h.normalize(8, 1, 800), 120, 'line deltas convert to pixels and cap');
  assert.equal(h.normalize(.1, 2, 800), 80, 'page deltas scale by viewport width');
  assert.equal(h.normalize(2, 2, 800), 120, 'large page deltas cap');
  assert.equal(h.normalize(-2, 1, 800), -32, 'negative line deltas preserve direction');
  assert.equal(h.normalize(-2, 2, 800), -120, 'negative page deltas cap symmetrically');
});

test('wheel delta normalization rejects invalid geometry and modes', () => {
  for (const args of [
    [Infinity, 0, 800], [1, Infinity, 800], [1, 3, 800], [1, -1, 800],
    [1, .5, 800], [1, 0, Infinity], [1, 0, 0], ['1', 0, 800],
    [NaN, 0, 800], [-Infinity, 0, 800], [new Number(1), 0, 800],
    [{ valueOf() { return 1; } }, 0, 800], [[1], 0, 800],
    [1, '0', 800], [1, new Number(0), 800], [1, [], 800],
    [1, 0, '800'], [1, 0, new Number(800)], [1, 0, [800]],
    [Number.MAX_VALUE, 2, 800]
  ]) assert.equal(h.normalize(...args), null, `invalid normalized delta input: ${String(args)}`);
});

test('wheel claiming requires activation and horizontal axis dominance at inclusive boundaries', () => {
  assert.equal(h.claim(47.999, 0), 0, 'sub-threshold horizontal motion is ignored');
  assert.equal(h.claim(48, 0), 1, 'activation threshold is inclusive');
  assert.equal(h.claim(-48, 0), -1, 'negative motion preserves direction at threshold');
  assert.equal(h.claim(50, 40), 1, 'axis dominance boundary is inclusive');
  assert.equal(h.claim(49.999, 40), 0, 'motion below the axis dominance ratio is ignored');
  assert.equal(h.claim(120, -96), 1, 'vertical sign does not change horizontal claiming');
  assert.equal(h.claim(Infinity, 0), 0, 'invalid horizontal input is ignored');
  assert.equal(h.claim(48, Infinity), 0, 'invalid vertical input is ignored');
  assert.equal(h.claim('48', 0), 0, 'numeric strings are ignored');
  for (const hostile of [NaN, -Infinity, new Number(48), { valueOf() { return 48; } }, [48]]) {
    assert.equal(h.claim(hostile, 0), 0, 'hostile horizontal geometry is ignored');
    assert.equal(h.claim(48, hostile), 0, 'hostile vertical geometry is ignored');
  }
});

function functionSource(name) {
  const match = bible.match(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}`));
  assert.ok(match, `${name} missing`);
  return match[0];
}

function makeWheelPager() {
  const listeners = new Map();
  return {
    clientWidth: 640,
    contains(target) { return target && target.inside === true; },
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    removeEventListener(type, handler) {
      listeners.set(type, (listeners.get(type) || []).filter(item => item !== handler));
    },
    dispatch(type, event) { for (const handler of listeners.get(type) || []) handler(event); },
    listenerCount(type) { return (listeners.get(type) || []).length; }
  };
}

function wheelHarness(page = 'chapters') {
  const timers = [];
  const pages = [];
  const selectionPanels = [0, 1, 2].map(panel => ({
    contains(element) { return element && element.panel === panel; }
  }));
  const documentObject = {
    documentElement: { clientWidth: 600 },
    activeElement: { panel: ['books', 'chapters', 'verses'].indexOf(page) }
  };
  const pager = makeWheelPager();
  const windowObject = {
    innerWidth: 800,
    visualViewport: { width: 700 },
    getSelection() { return { isCollapsed: true }; },
    setTimeout(fn, ms) { const timer = { fn, ms, cleared: false }; timers.push(timer); return timer; },
    clearTimeout(timer) { if (timer) timer.cleared = true; }
  };
  const api = Function('window', 'document', 'selectionPager', 'selectionPanels', 'pages', 'timers', `
    var BIBLE_WHEEL_AXIS_RATIO = 1.25;
    var BIBLE_WHEEL_ACTIVATION_PX = 48;
    var BIBLE_WHEEL_IDLE_MS = 160;
    var BIBLE_WHEEL_LINE_PX = 16;
    var BIBLE_WHEEL_MAX_EVENT_PX = 120;
    var SELECTION_WHEEL_RENEW_REFRACTORY_MS = 48;
    var SELECTION_WHEEL_RELEASE_PX = 12;
    var SELECTION_WHEEL_REBOUND_PX = 24;
    var SELECTION_WHEEL_REBOUND_RATIO = 2.25;
    var SELECTION_WHEEL_REBOUND_DELTA_PX = 16;
    var selectionPages = ['books', 'chapters', 'verses'];
    var selectionSheetPage = ${JSON.stringify(page)};
    var appSheet = { open: true };
    var appSheetState = { kind: 'selection', phase: 'idle', pointer: null, candidate: null, generation: 7 };
    var selectionPointer = null;
    var bibleWheelBurst = { x: 0, y: 0, consumed: false, direction: 0, timer: null, generation: 0 };
    var bibleReaderWheelTransitionLock = { active: false, direction: 0, generation: 0 };
    var selectionWheelImpulse = null;
    function isFiniteAppSheetNumber(value) { return typeof value === 'number' && Number.isFinite(value); }
    ${functionSource('scaleBibleWheelDelta')}
    ${functionSource('normalizeBibleWheelDelta')}
    ${functionSource('bibleWheelClaimDirection')}
    ${functionSource('resetSelectionWheelImpulse')}
    ${functionSource('selectionWheelEventVector')}
    ${functionSource('markSelectionWheelClaim')}
    ${functionSource('selectionWheelShouldRenew')}
    ${functionSource('clearBibleReaderWheelTransitionLock')}
    ${functionSource('resetBibleWheelBurst')}
    ${functionSource('restoreBibleWheelConsumedLock')}
    ${functionSource('bibleWheelTargetBlocked')}
    ${functionSource('accumulateBibleWheel')}
    ${functionSource('onSelectionWheel')}
    ${functionSource('installSelectionWheelListener')}
    ${functionSource('removeSelectionWheelListener')}
    function setSelectionPage(next, replace, mode) {
      selectionSheetPage = next;
      pages.push([next, replace, mode]);
      if (mode) document.activeElement = { panel: selectionPages.indexOf(next) };
    }
    return {
      wheel: onSelectionWheel,
      mount: installSelectionWheelListener,
      unmount: function () { removeSelectionWheelListener(); resetBibleWheelBurst(); },
      replacePager: function (next) {
        removeSelectionWheelListener();
        resetBibleWheelBurst();
        selectionPager = next;
        return installSelectionWheelListener();
      },
      selectionPage: function (next) { selectionSheetPage = next; },
      liveTimers: function () { return timers.filter(function (timer) { return !timer.cleared; }).length; },
      reset: resetBibleWheelBurst,
      burst: function () { return bibleWheelBurst; },
      impulse: function () { return selectionWheelImpulse; },
      generation: function (value) { appSheetState.generation = value; },
      page: function () { return selectionSheetPage; },
      phase: function (value) { appSheetState.phase = value; },
      pointer: function (value) { appSheetState.pointer = value; },
      selectionPointer: function (value) { selectionPointer = value; },
      candidate: function (value) { appSheetState.candidate = value; },
      sheet: function (open, kind) { appSheet.open = open; appSheetState.kind = kind; },
      focus: function (value) { document.activeElement = value; },
      selection: function (value) { window.getSelection = function () { return value; }; },
      selectionError: function () { window.getSelection = function () { throw new Error('selection unavailable'); }; },
      viewport: function (visual, inner, fallback) {
        window.visualViewport = visual; window.innerWidth = inner; document.documentElement.clientWidth = fallback;
      },
      expire: function (index) { var timer = timers[index == null ? timers.length - 1 : index]; if (timer) timer.fn(); }
    };
  `)(windowObject, documentObject, pager, selectionPanels, pages, timers);
  return { api, pages, timers, pager, windowObject, documentObject };
}

function wheelEvent(dx, dy = 0, options = {}) {
  return Object.assign({
    deltaX: dx, deltaY: dy, deltaMode: 0, target: { inside: true, closest() { return null; } },
    ctrlKey: false, metaKey: false, shiftKey: false, prevented: false,
    preventDefault() { this.prevented = true; }
  }, options);
}

test('selector wheel accumulates one claimed page per idle-delimited burst', () => {
  const { api, pages, timers } = wheelHarness();
  const first = wheelEvent(24);
  const second = wheelEvent(24);
  api.wheel(first);
  assert.equal(timers[0].cleared, false);
  api.wheel(second);
  assert.equal(timers[0].cleared, true, 'rearming clears the previous idle timer');
  assert.equal(first.prevented, false);
  assert.equal(second.prevented, true);
  assert.deepEqual(pages, [['verses', true, 'pointer']]);

  const momentum = wheelEvent(120);
  api.wheel(momentum);
  assert.equal(momentum.prevented, true, 'claimed momentum remains owned');
  assert.equal(pages.length, 1, 'momentum cannot page twice');
  const oppositeMomentum = wheelEvent(-120);
  api.wheel(oppositeMomentum);
  assert.equal(oppositeMomentum.prevented, true, 'opposite momentum remains owned after direction locks');
  assert.equal(pages.length, 1, 'opposite momentum cannot flip direction or page twice');
  assert.equal(timers.at(-1).ms, 160);

  api.expire();
  api.wheel(wheelEvent(-24));
  const fresh = wheelEvent(-24);
  api.wheel(fresh);
  assert.equal(fresh.prevented, true);
  assert.deepEqual(pages.at(-1), ['chapters', true, 'pointer']);
});

test('selector wheel rearms on a decayed tail plus deliberate rebound before idle or page settle', () => {
  const { api, pages } = wheelHarness('books');
  api.wheel(wheelEvent(24, 0, { timeStamp: 1 }));
  api.wheel(wheelEvent(24, 0, { timeStamp: 9 }));
  assert.deepEqual(pages, [['chapters', true, 'pointer']]);

  api.wheel(wheelEvent(11, 0, { timeStamp: 60 }));
  assert.equal(api.impulse().tailObserved, true, 'a low post-refractory tail opens only the rearm window');
  api.wheel(wheelEvent(32, 0, { timeStamp: 76 }));
  assert.deepEqual(pages, [['chapters', true, 'pointer']], 'the rebound starts fresh accumulation');
  api.wheel(wheelEvent(20, 0, { timeStamp: 84 }));
  assert.deepEqual(pages, [
    ['chapters', true, 'pointer'],
    ['verses', true, 'pointer']
  ], 'the renewed gesture pages before either timeout or transitionend');
});

test('selector renewed impulse requires refractory decay and cannot promote momentum or spikes', () => {
  for (const tail of [
    [[40, 15], [32, 30], [24, 45], [18, 60], [11, 70], [8, 80]],
    [[120, 20], [120, 40], [-120, 60]],
    [[8, 20], [48, 35]]
  ]) {
    const { api, pages } = wheelHarness('books');
    api.wheel(wheelEvent(48, 0, { timeStamp: 1 }));
    for (const [dx, timeStamp] of tail) api.wheel(wheelEvent(dx, 0, { timeStamp }));
    assert.deepEqual(pages, [['chapters', true, 'pointer']], 'one physical tail owns one page');
  }
});

test('selector renewed impulse supports a deliberate reverse gesture and resets across generations', () => {
  const reverse = wheelHarness('chapters');
  reverse.api.wheel(wheelEvent(48, 0, { timeStamp: 1 }));
  reverse.api.wheel(wheelEvent(8, 0, { timeStamp: 60 }));
  reverse.api.wheel(wheelEvent(-48, 0, { timeStamp: 80 }));
  assert.deepEqual(reverse.pages, [
    ['verses', true, 'pointer'],
    ['chapters', true, 'pointer']
  ]);

  const stale = wheelHarness('books');
  stale.api.wheel(wheelEvent(48, 0, { timeStamp: 1 }));
  stale.api.wheel(wheelEvent(8, 0, { timeStamp: 60 }));
  stale.api.generation(8);
  stale.api.wheel(wheelEvent(48, 0, { timeStamp: 80 }));
  assert.deepEqual(stale.pages, [['chapters', true, 'pointer']], 'old-sheet decay cannot rearm a new generation');
  assert.equal(stale.api.impulse().sheetGeneration, 8);

  stale.api.reset();
  assert.equal(stale.api.impulse().claimed, false);
  assert.equal(stale.api.impulse().tailObserved, false);
  assert.equal(stale.api.impulse().valleyAbsX, Infinity);
});

test('selector wheel accepts vertical then horizontal input at the same target after a claimed page', () => {
  const { api, pages, timers } = wheelHarness('books');
  const target = { inside: true, closest() { return null; } };
  const claimed = wheelEvent(48, 0, { target });
  api.wheel(claimed);
  assert.equal(claimed.prevented, true);
  assert.deepEqual(pages, [['chapters', true, 'pointer']]);
  const claimedTimer = timers.at(-1);

  const vertical = wheelEvent(0, 80, { target });
  api.wheel(vertical);
  assert.equal(vertical.prevented, false, 'vertical input remains native without moving the pointer');
  assert.equal(claimedTimer.cleared, true, 'the prior horizontal ownership timer is released');
  assert.equal(api.burst().x, 0);
  assert.equal(api.burst().y, 0);
  assert.equal(api.burst().consumed, false);
  assert.equal(api.burst().direction, 0);
  assert.equal(api.burst().timer, null);

  const nextHorizontal = wheelEvent(48, 0, { target });
  api.wheel(nextHorizontal);
  assert.equal(nextHorizontal.prevented, true, 'the next same-target horizontal gesture can claim immediately');
  assert.deepEqual(pages, [
    ['chapters', true, 'pointer'],
    ['verses', true, 'pointer']
  ]);
});

test('vertical axis boundaries clear partial horizontal poison and rebuild the threshold', () => {
  const { api, pages, timers } = wheelHarness('books');
  api.wheel(wheelEvent(24));
  const partialTimer = timers.at(-1);

  const vertical = wheelEvent(0, 80);
  api.wheel(vertical);
  assert.equal(vertical.prevented, false);
  assert.equal(partialTimer.cleared, true);
  assert.equal(api.liveTimers(), 0, 'a vertical boundary does not own an idle timer');

  api.wheel(wheelEvent(24));
  assert.equal(pages.length, 0, 'pre-boundary horizontal motion cannot combine with the fresh gesture');
  const threshold = wheelEvent(24);
  api.wheel(threshold);
  assert.equal(threshold.prevented, true);
  assert.deepEqual(pages, [['chapters', true, 'pointer']]);
});

test('repeated vertical input stays native while ambiguous and horizontal momentum retain one-page ownership', () => {
  const vertical = wheelHarness('chapters');
  for (const dy of [8, 40, -80, 120]) {
    const event = wheelEvent(0, dy);
    vertical.api.wheel(event);
    assert.equal(event.prevented, false);
    assert.equal(vertical.api.liveTimers(), 0, 'vertical input does not extend shared wheel ownership');
  }
  assert.equal(vertical.pages.length, 0);

  const locked = wheelHarness('books');
  locked.api.wheel(wheelEvent(48));
  for (const event of [wheelEvent(50, 41), wheelEvent(120), wheelEvent(-120)]) {
    locked.api.wheel(event);
    assert.equal(event.prevented, true, 'non-vertical momentum remains inside the claimed burst');
  }
  assert.deepEqual(locked.pages, [['chapters', true, 'pointer']], 'one gesture still pages exactly once');
});

test('selector vertical boundary is inclusive while just-below diagonal momentum stays locked', () => {
  const boundary = wheelHarness('books');
  boundary.api.wheel(wheelEvent(48));
  const equalRatio = wheelEvent(40, 50);
  boundary.api.wheel(equalRatio);
  assert.equal(equalRatio.prevented, false, 'the exact 1.25 vertical ratio releases selector ownership');
  assert.equal(boundary.api.burst().consumed, false);
  const boundaryFresh = wheelEvent(48);
  boundary.api.wheel(boundaryFresh);
  assert.equal(boundaryFresh.prevented, true);
  assert.deepEqual(boundary.pages, [
    ['chapters', true, 'pointer'],
    ['verses', true, 'pointer']
  ]);

  const below = wheelHarness('books');
  below.api.wheel(wheelEvent(48));
  const justBelowRatio = wheelEvent(40, 49.999);
  below.api.wheel(justBelowRatio);
  assert.equal(justBelowRatio.prevented, true, 'sub-boundary diagonal momentum remains in the claimed gesture');
  assert.equal(below.api.burst().consumed, true);
  assert.deepEqual(below.pages, [['chapters', true, 'pointer']]);
});

test('selector classifies vertical boundaries before pixel, line, and page accumulation caps', () => {
  for (const event of [
    wheelEvent(100, 200),
    wheelEvent(8, 16, { deltaMode: 1 }),
    wheelEvent(.2, .4, { deltaMode: 2 })
  ]) {
    const { api, pages } = wheelHarness('books');
    api.wheel(wheelEvent(48));
    api.wheel(event);
    assert.equal(event.prevented, false, `saturated delta mode ${event.deltaMode} remains vertically classified`);
    assert.equal(api.burst().consumed, false);
    assert.deepEqual(pages, [['chapters', true, 'pointer']]);
  }
});

test('selector wheel relocates focus only when the old panel owns it', () => {
  const focused = wheelHarness('chapters');
  focused.api.wheel(wheelEvent(48));
  assert.deepEqual(focused.pages, [['verses', true, 'pointer']]);
  assert.equal(focused.documentObject.activeElement.panel, 2, 'focused old panel moves safely before inerting');

  for (const externalFocus of [{ role: 'sheet-handle' }, { role: 'external-control' }]) {
    const external = wheelHarness('chapters');
    external.api.focus(externalFocus);
    external.api.wheel(wheelEvent(48));
    assert.deepEqual(external.pages, [['verses', true, undefined]]);
    assert.equal(external.documentObject.activeElement, externalFocus, 'trackpad paging preserves external focus');
  }
});

test('wheel direction locks only after a claim, normalization is integrated, and vertical gestures stay native', () => {
  const { api, pages } = wheelHarness();
  api.wheel(wheelEvent(24));
  const reversal = wheelEvent(-120);
  api.wheel(reversal);
  assert.equal(reversal.prevented, true, 'pre-claim deltas accumulate algebraically to a backward claim');
  assert.deepEqual(pages, [['books', true, 'pointer']]);

  api.reset();
  const line = wheelEvent(3, 0, { deltaMode: 1 });
  api.wheel(line);
  assert.equal(line.prevented, true, 'line-mode motion reaches the shared activation threshold');
  assert.deepEqual(pages.at(-1), ['chapters', true, 'pointer']);
  api.reset();
  for (const event of [wheelEvent(50, 41), wheelEvent(120, 120), wheelEvent(Infinity),
    wheelEvent(.1, 0, { deltaMode: 2 })]) {
    api.wheel(event);
    if (Number.isFinite(event.deltaX) && event.deltaMode === 2) assert.equal(event.prevented, true);
    else assert.equal(event.prevented, false);
    api.reset();
  }
});

test('wheel target and sheet state guards preserve browser, zoom, editing, and drag behavior', () => {
  const { api, pages } = wheelHarness();
  const editable = { inside: true, closest() { return this; } };
  const blocked = [
    wheelEvent(120, 0, { ctrlKey: true }), wheelEvent(120, 0, { metaKey: true }),
    wheelEvent(120, 0, { altKey: true }), wheelEvent(120, 0, { shiftKey: true }),
    wheelEvent(120, 0, { target: editable }),
    wheelEvent(120, 0, { target: { inside: false, closest() { return null; } } })
  ];
  api.selection({ isCollapsed: false });
  blocked.push(wheelEvent(120));
  for (const event of blocked) { api.wheel(event); assert.equal(event.prevented, false); }
  api.selection({ isCollapsed: true });
  for (const phase of ['dragging', 'settling', 'opening', 'closing']) {
    api.phase(phase);
    const event = wheelEvent(120);
    api.wheel(event);
    assert.equal(event.prevented, false, phase);
  }
  api.phase('idle');
  api.pointer({ id: 1 });
  const dragging = wheelEvent(120);
  api.wheel(dragging);
  assert.equal(dragging.prevented, false);
  assert.equal(pages.length, 0);
});

test('wheel guards independently block candidates, pointers, editable targets, selection errors, and wrong sheets', () => {
  for (const configure of [
    api => api.candidate({ id: 1 }), api => api.pointer({ id: 1 }), api => api.selectionPointer({ id: 1 }),
    api => api.selectionError(), api => api.sheet(false, 'selection'), api => api.sheet(true, 'history')
  ]) {
    const { api, pages } = wheelHarness();
    configure(api);
    const event = wheelEvent(120);
    api.wheel(event);
    assert.equal(event.prevented, false);
    assert.equal(pages.length, 0);
  }
  const editable = wheelHarness();
  const event = wheelEvent(120, 0, {
    target: { inside: true, isContentEditable: true, closest() { return null; } }
  });
  editable.api.wheel(event);
  assert.equal(event.prevented, false);
  assert.equal(editable.pages.length, 0);
});

test('blocked native interactions reset partial wheel bursts before normal motion resumes', () => {
  const cases = [
    { event: () => wheelEvent(24, 0, { ctrlKey: true }) },
    { event: () => wheelEvent(24, 0, { metaKey: true }) },
    { event: () => wheelEvent(24, 0, { shiftKey: true }) },
    { event: () => wheelEvent(24, 0, {
      target: { inside: true, isContentEditable: true, closest() { return null; } }
    }) },
    { before: api => api.selection({ isCollapsed: false }), after: api => api.selection({ isCollapsed: true }),
      event: () => wheelEvent(24) },
    { before: api => api.pointer({ id: 1 }), after: api => api.pointer(null), event: () => wheelEvent(24) },
    { before: api => api.candidate({ id: 1 }), after: api => api.candidate(null), event: () => wheelEvent(24) },
    { before: api => api.phase('settling'), after: api => api.phase('idle'), event: () => wheelEvent(24) }
  ];
  for (const entry of cases) {
    const { api, pages, timers } = wheelHarness();
    api.wheel(wheelEvent(24));
    const partialTimer = timers.at(-1);
    if (entry.before) entry.before(api);
    const blocked = entry.event();
    api.wheel(blocked);
    if (entry.after) entry.after(api);
    assert.equal(blocked.prevented, false, 'blocked/native input stays native');
    assert.equal(partialTimer.cleared, true, 'blocked input clears the partial-burst timer');
    api.wheel(wheelEvent(24));
    assert.equal(pages.length, 0, 'post-boundary motion cannot combine with stale motion');
    api.reset();
    api.wheel(wheelEvent(48));
    assert.equal(pages.length, 1, 'a fresh deliberate burst may still claim');
  }
});

test('blocked input after a consumed claim cannot turn residual momentum into a second page', () => {
  const { api, pages } = wheelHarness('books');
  api.wheel(wheelEvent(48));
  assert.equal(pages.length, 1);
  const blocked = wheelEvent(24, 0, { ctrlKey: true });
  api.wheel(blocked);
  assert.equal(blocked.prevented, false);
  const residualMomentum = wheelEvent(120);
  api.wheel(residualMomentum);
  assert.equal(residualMomentum.prevented, true, 'the one-action lock survives a blocked boundary');
  assert.equal(pages.length, 1);
  api.expire();
  api.wheel(wheelEvent(48));
  assert.equal(pages.length, 2, 'a deliberate burst after idle may page again');
});

test('invalid wheel deltas reset partial state instead of combining across an untrusted event', () => {
  const { api, pages, timers } = wheelHarness();
  api.wheel(wheelEvent(24));
  const partialTimer = timers.at(-1);
  const invalid = wheelEvent(Infinity);
  api.wheel(invalid);
  assert.equal(invalid.prevented, false);
  assert.equal(partialTimer.cleared, true);
  api.wheel(wheelEvent(24));
  assert.equal(pages.length, 0);
});

test('wheel page-mode normalization falls back to the document viewport width', () => {
  const { api, pages } = wheelHarness();
  api.viewport({ width: NaN }, NaN, 600);
  const event = wheelEvent(.08, 0, { deltaMode: 2 });
  api.wheel(event);
  assert.equal(event.prevented, true);
  assert.deepEqual(pages, [['verses', true, 'pointer']]);
});

test('selector claims endpoints and stale idle callbacks cannot reset a newer burst', () => {
  const { api, pages, timers } = wheelHarness('verses');
  const endpoint = wheelEvent(120);
  api.wheel(endpoint);
  assert.equal(endpoint.prevented, true, 'endpoint blocks browser history navigation');
  assert.equal(pages.length, 0);
  const stale = timers.at(-1);
  api.reset();
  assert.equal(stale.cleared, true, 'reset and selector cleanup clear the active timer');
  api.wheel(wheelEvent(-24));
  stale.fn();
  api.wheel(wheelEvent(-24));
  assert.deepEqual(pages, [['chapters', true, 'pointer']], 'stale timer leaves the newer burst intact');
});

test('100 mounted selector wheel lifecycles release the real listener, timer, and burst state', () => {
  const { api, pages } = wheelHarness('chapters');
  let activePager = null;
  for (let cycle = 0; cycle < 100; cycle += 1) {
    const pager = makeWheelPager();
    const actionBaseline = pages.length;
    const retiredPager = activePager;
    api.replacePager(pager);
    api.selectionPage('chapters');
    api.focus({ panel: 1 });
    assert.equal(pager.listenerCount('wheel'), 1, `cycle ${cycle} mounts one real wheel listener`);
    if (retiredPager) {
      assert.equal(retiredPager.listenerCount('wheel'), 0, `cycle ${cycle} removes the retired pager listener`);
      retiredPager.dispatch('wheel', wheelEvent(120));
      assert.equal(pages.length, actionBaseline, `cycle ${cycle} retired pager is inert after replacement`);
      assert.equal(api.liveTimers(), 0, `cycle ${cycle} retired pager cannot reacquire a timer`);
    }
    const partial = wheelEvent(24);
    pager.dispatch('wheel', partial);
    const claim = wheelEvent(24);
    pager.dispatch('wheel', claim);
    assert.equal(claim.prevented, true, `cycle ${cycle} dispatches through the installed handler`);
    assert.deepEqual(pages.slice(actionBaseline), [['verses', true, 'pointer']],
      `cycle ${cycle} adds exactly one action to the shared registry`);
    assert.equal(api.liveTimers(), 1, `cycle ${cycle} owns one wheel quiet timer`);
    activePager = pager;
  }
  api.unmount();
  assert.equal(activePager.listenerCount('wheel'), 0, 'final unmount removes the last pager listener');
  assert.equal(api.liveTimers(), 0, 'final unmount clears the shared quiet timer');
  assert.equal(api.burst().x, 0);
  assert.equal(api.burst().y, 0);
  assert.equal(api.burst().consumed, false);
  assert.equal(api.burst().direction, 0);
  assert.equal(api.burst().timer, null, 'final unmount resets shared wheel state');
  assert.equal(api.impulse().claimed, false);
  assert.equal(api.impulse().tailObserved, false);
  assert.equal(pages.length, 100, 'one shared action registry contains exactly one action per replacement cycle');
});

function readerWheelHarness(options = {}) {
  const timers = [];
  const chapters = [];
  const stats = { releases: 0 };
  const viewEl = {
    contains(target) { return target && target.inside === true; }
  };
  const documentObject = {
    documentElement: { clientWidth: 600 },
    hidden: false,
    activeElement: null
  };
  const windowObject = {
    innerWidth: 800,
    visualViewport: { width: 700 },
    getSelection() { return { isCollapsed: true }; },
    setTimeout(fn, ms) { const timer = { fn, ms, cleared: false }; timers.push(timer); return timer; },
    clearTimeout(timer) { if (timer) timer.cleared = true; }
  };
  const api = Function('window', 'document', 'viewEl', 'chapters', 'timers', 'stats', `
    var BIBLE_WHEEL_AXIS_RATIO = 1.25;
    var BIBLE_WHEEL_ACTIVATION_PX = 48;
    var BIBLE_WHEEL_IDLE_MS = 160;
    var BIBLE_WHEEL_LINE_PX = 16;
    var BIBLE_WHEEL_MAX_EVENT_PX = 120;
    var uiView = ${JSON.stringify(options.uiView || 'verses')};
    var appSheet = { open: ${options.sheetOpen === true} };
    var appSheetState = { phase: 'idle', pointer: null, candidate: null };
    var selectionPointer = null;
    var bibleReaderWheelAction = false;
    var bibleWheelBurst = { x: 0, y: 0, consumed: false, direction: 0, timer: null, generation: 0 };
    var bibleReaderWheelTransitionLock = { active: false, direction: 0, generation: 0 };
    function isFiniteAppSheetNumber(value) { return typeof value === 'number' && Number.isFinite(value); }
    function releaseVerseChaseForFreeScroll() { stats.releases++; }
    function showAdjacentChapter(direction) { chapters.push(direction); return ${options.endpoint === true ? 'false' : 'true'}; }
    ${functionSource('scaleBibleWheelDelta')}
    ${functionSource('normalizeBibleWheelDelta')}
    ${functionSource('bibleWheelClaimDirection')}
    ${functionSource('bibleWheelEventHorizontalDirection')}
    ${functionSource('clearBibleReaderWheelTransitionLock')}
    ${functionSource('resetBibleWheelBurst')}
    ${functionSource('restoreBibleWheelConsumedLock')}
    ${functionSource('holdBibleReaderWheelTransitionLock')}
    ${functionSource('finishBibleReaderWheelTransitionLock')}
    ${functionSource('bibleWheelTargetBlocked')}
    ${functionSource('accumulateBibleWheel')}
    ${functionSource('onBibleReaderWheel')}
    return {
      wheel: onBibleReaderWheel,
      reset: resetBibleWheelBurst,
      burst: function () { return bibleWheelBurst; },
      releases: function () { return stats.releases; },
      expire: function () { var timer = timers[timers.length - 1]; if (timer) timer.fn(); },
      sheet: function (open) { appSheet.open = open; },
      view: function (next) { uiView = next; },
      selection: function (value) { window.getSelection = function () { return value; }; }
    };
  `)(windowObject, documentObject, viewEl, chapters, timers, stats);
  return { api, chapters, timers };
}

test('reader wheel claims exactly one chapter through the existing adjacent chapter action', () => {
  const { api, chapters } = readerWheelHarness();
  const partial = wheelEvent(24);
  api.wheel(partial);
  assert.equal(partial.prevented, false);
  assert.equal(api.releases(), 1, 'unclaimed movement releases chase for native scrolling');
  const claim = wheelEvent(24);
  api.wheel(claim);
  assert.equal(claim.prevented, true);
  assert.deepEqual(chapters, [1]);
  assert.equal(api.releases(), 1, 'claimed navigation preserves destination chase ownership');

  for (const delta of [120, -120, 80]) {
    const momentum = wheelEvent(delta);
    api.wheel(momentum);
    assert.equal(momentum.prevented, true, 'all residual momentum remains owned');
  }
  assert.deepEqual(chapters, [1], 'a render cannot unlock the active burst');
  assert.equal(api.releases(), 1, 'consumed momentum cannot cancel programmatic destination positioning');

  api.expire();
  const backward = wheelEvent(-48);
  api.wheel(backward);
  assert.equal(backward.prevented, true);
  assert.deepEqual(chapters, [1, -1]);
});

test('reader wheel leaves vertical and guarded interactions native and the selector exclusive', () => {
  for (const configure of [
    () => readerWheelHarness({ sheetOpen: true }),
    () => readerWheelHarness({ uiView: 'chapters' })
  ]) {
    const { api, chapters } = configure();
    const event = wheelEvent(120);
    api.wheel(event);
    assert.equal(event.prevented, false);
    assert.deepEqual(chapters, []);
    assert.equal(api.releases(), 1);
  }
  const { api, chapters } = readerWheelHarness();
  const guarded = [
    wheelEvent(120, 120), wheelEvent(50, 41),
    wheelEvent(120, 0, { ctrlKey: true }),
    wheelEvent(120, 0, { altKey: true }),
    wheelEvent(120, 0, { target: { inside: false, closest() { return null; } } }),
    wheelEvent(120, 0, { target: { inside: true, isContentEditable: true, closest() { return null; } } })
  ];
  api.selection({ isCollapsed: false });
  guarded.push(wheelEvent(120));
  for (const event of guarded) {
    api.wheel(event);
    assert.equal(event.prevented, false);
  }
  assert.deepEqual(chapters, []);
  assert.equal(api.releases(), guarded.length);
});

test('reader claims canonical endpoints to prevent browser history for the entire burst', () => {
  const { api, chapters } = readerWheelHarness({ endpoint: true });
  for (const delta of [48, 120, -120]) {
    const event = wheelEvent(delta);
    api.wheel(event);
    assert.equal(event.prevented, true);
  }
  assert.deepEqual(chapters, [1], 'endpoint action is attempted only once per burst');
  assert.equal(api.burst().consumed, true);
});

test('reader listener is unique and nonpassive while touch release remains passive', () => {
  assert.equal((bible.match(/viewEl\.addEventListener\('wheel'/g) || []).length, 1);
  assert.match(bible, /viewEl\.addEventListener\('wheel', onBibleReaderWheel, \{ passive: false \}\);/);
  assert.match(bible, /viewEl\.addEventListener\('touchstart', releaseVerseChaseForFreeScroll, \{ passive: true \}\);/);
});

test('chapter navigation follows trusted dataset insertion order and numeric chapter order', () => {
  const source = [functionSource('sortedChapterKeys'), functionSource('prevChapterNav'), functionSource('nextChapterNav')].join('\n');
  const navigate = Function('bibleData', `${source}; return { prevChapterNav, nextChapterNav };`);
  const data = {
    Genesis: { '2': {}, '1': {} },
    Exodus: { '3': {}, '1': {}, '2': {} },
    Revelation: { '22': {}, '1': {} }
  };
  const nav = navigate(data);
  assert.deepEqual(nav.nextChapterNav('Genesis', 1), { book: 'Genesis', chapter: 2 });
  assert.deepEqual(nav.nextChapterNav('Genesis', 2), { book: 'Exodus', chapter: 1 });
  assert.deepEqual(nav.prevChapterNav('Exodus', 1), { book: 'Genesis', chapter: 2 });
  assert.deepEqual(nav.prevChapterNav('Revelation', 1), { book: 'Exodus', chapter: 3 });
  assert.equal(nav.prevChapterNav('Genesis', 1), null);
  assert.equal(nav.nextChapterNav('Revelation', 22), null);
  assert.doesNotMatch(source, /Object\.keys\(bibleData\)\.sort/);
});

test('adjacent chapter action retains recalled verse fallback and the established transition path', () => {
  const adjacent = functionSource('showAdjacentChapter');
  assert.match(adjacent, /recalledChapterVerse\(next\.book, next\.chapter\) \|\| '1'/);
  assert.match(adjacent, /showVersesViewWithTransition\(next\.book, next\.chapter,/);
  assert.doesNotMatch(adjacent, /history\.|State\.|pushNav|replaceState|pushState/);
  const transition = bible.slice(bible.indexOf('  function showVersesViewWithTransition('),
    bible.indexOf('  function shouldIgnoreBibleShortcut('));
  assert.match(transition, /if \(chapterCrossfadeGeneration !== readerTransitionGeneration\) return;/,
    'stale transition callbacks cannot unlock a newer wheel burst');
  assert.match(transition, /finishBibleReaderWheelTransitionLock\(readerWheelLockGeneration\)/,
    'transition completion is scoped to its reader wheel lock token');
});

test('reader transition owns the consumed lock across idle expiry and starts quiet time after completion', () => {
  const timers = [];
  const chapters = [];
  const classList = { add() {}, remove() {} };
  const viewInner = {
    classList,
    offsetWidth: 1,
    cloneNode() {
      return {
        className: '', style: {}, classList, removeAttribute() {}, setAttribute() {},
        querySelectorAll() { return []; }, remove() {}
      };
    }
  };
  const viewEl = {
    scrollTop: 0,
    contains(target) { return target && target.inside === true; },
    appendChild() {}
  };
  const documentObject = { documentElement: { clientWidth: 600 } };
  const windowObject = {
    innerWidth: 800,
    visualViewport: { width: 700 },
    getSelection() { return { isCollapsed: true }; },
    setTimeout(fn, ms) { const timer = { fn, ms, cleared: false }; timers.push(timer); return timer; },
    clearTimeout(timer) { if (timer) timer.cleared = true; }
  };
  const source = [
    'scaleBibleWheelDelta', 'normalizeBibleWheelDelta', 'bibleWheelClaimDirection', 'clearBibleReaderWheelTransitionLock',
    'bibleWheelEventHorizontalDirection',
    'resetBibleWheelBurst', 'restoreBibleWheelConsumedLock', 'holdBibleReaderWheelTransitionLock',
    'finishBibleReaderWheelTransitionLock', 'bibleWheelTargetBlocked', 'accumulateBibleWheel',
    'onBibleReaderWheel', 'showVersesViewWithTransition'
  ].map(functionSource).join('\n');
  const api = Function('window', 'document', 'viewEl', 'viewInner', 'timers', 'chapters', `
    var BIBLE_WHEEL_AXIS_RATIO = 1.25;
    var BIBLE_WHEEL_ACTIVATION_PX = 48;
    var BIBLE_WHEEL_IDLE_MS = 160;
    var BIBLE_WHEEL_LINE_PX = 16;
    var BIBLE_WHEEL_MAX_EVENT_PX = 120;
    var CHAPTER_CROSSFADE_MS = 200;
    var uiView = 'verses';
    var appSheet = { open: false };
    var appSheetState = { phase: 'idle', pointer: null, candidate: null };
    var selectionPointer = null;
    var bibleReaderWheelAction = false;
    var bibleWheelBurst = { x: 0, y: 0, consumed: false, direction: 0, timer: null, generation: 0 };
    var bibleReaderWheelTransitionLock = { active: false, direction: 0, generation: 0 };
    var chapterCrossfadeTimer = null;
    var chapterCrossfadeGeneration = 0;
    var preservingChapterCrossfade = false;
    function isFiniteAppSheetNumber(value) { return typeof value === 'number' && Number.isFinite(value); }
    function releaseVerseChaseForFreeScroll() {}
    function closeVerseActions() {}
    function clearReaderPointerState() {}
    function shouldReduceChapterMotion() { return false; }
    function clearChapterCrossfadeTimer() {
      chapterCrossfadeGeneration++;
      if (chapterCrossfadeTimer) window.clearTimeout(chapterCrossfadeTimer);
      chapterCrossfadeTimer = null;
    }
    function clearRetiringChapterViews() {}
    function prepareRetiringView() {}
    function showVersesView() {}
    function requestAnimationFrame() { return 1; }
    function showAdjacentChapter(direction) {
      chapters.push(direction);
      holdBibleReaderWheelTransitionLock(direction);
      showVersesViewWithTransition('Genesis', chapters.length + 1, '1');
      return true;
    }
    ${source}
    return {
      wheel: onBibleReaderWheel,
      burst: function () { return bibleWheelBurst; },
      lock: function () { return bibleReaderWheelTransitionLock; },
      reset: resetBibleWheelBurst,
      finish: finishBibleReaderWheelTransitionLock
    };
  `)(windowObject, documentObject, viewEl, viewInner, timers, chapters);

  const claim = wheelEvent(48);
  api.wheel(claim);
  assert.equal(claim.prevented, true);
  assert.deepEqual(chapters, [1]);
  assert.equal(api.lock().active, true);
  const originalIdle = timers.find(timer => timer.ms === 160);
  const transition = timers.find(timer => timer.ms === 200);
  assert.ok(originalIdle && transition);
  assert.equal(originalIdle.cleared, true, 'transition ownership cancels the ordinary idle timer');

  originalIdle.fn();
  assert.equal(api.burst().consumed, true, 'stale pre-transition idle cannot release ownership');
  for (const delta of [120, -120]) {
    const residual = wheelEvent(delta);
    api.wheel(residual);
    assert.equal(residual.prevented, true);
  }
  assert.deepEqual(chapters, [1]);

  transition.fn();
  assert.equal(api.lock().active, false);
  const verticalDuringQuiet = wheelEvent(0, 80);
  api.wheel(verticalDuringQuiet);
  const horizontalResidual = wheelEvent(120);
  api.wheel(horizontalResidual);
  assert.equal(horizontalResidual.prevented, true, 'reader quiet ownership survives a vertical-dominant event');
  assert.deepEqual(chapters, [1], 'vertical input cannot release residual momentum into a second chapter');

  const afterTransition = wheelEvent(120);
  api.wheel(afterTransition);
  assert.equal(afterTransition.prevented, true);
  assert.deepEqual(chapters, [1], 'post-transition momentum remains locked');

  timers.at(-1).fn();
  const fresh = wheelEvent(-48);
  api.wheel(fresh);
  assert.equal(fresh.prevented, true);
  assert.deepEqual(chapters, [1, -1], 'a fresh burst is allowed after post-transition quiet time');

  const staleGeneration = api.lock().generation;
  const staleTransition = timers.filter(timer => timer.ms === 200).at(-1);
  api.reset();
  assert.equal(api.lock().active, false, 'unrelated reset cancels transition ownership');
  staleTransition.fn();
  api.finish(staleGeneration);
  assert.equal(api.lock().active, false, 'stale completion cannot restore or release a newer owner');
});

test('reduced-motion reader render skips crossfade timing but preserves a fresh consumed quiet lock', () => {
  const timers = [];
  const chapters = [];
  const classList = { add() {}, remove() {} };
  const viewInner = { classList, children: [{}] };
  const viewEl = {
    contains(target) { return target && target.inside === true; },
    querySelectorAll() { return []; }
  };
  const documentObject = { documentElement: { clientWidth: 600 } };
  const windowObject = {
    innerWidth: 800,
    visualViewport: { width: 700 },
    getSelection() { return { isCollapsed: true }; },
    setTimeout(fn, ms) { const timer = { fn, ms, cleared: false }; timers.push(timer); return timer; },
    clearTimeout(timer) { if (timer) timer.cleared = true; }
  };
  const source = [
    'scaleBibleWheelDelta', 'normalizeBibleWheelDelta', 'bibleWheelClaimDirection', 'clearBibleReaderWheelTransitionLock',
    'bibleWheelEventHorizontalDirection', 'resetBibleWheelBurst', 'restoreBibleWheelConsumedLock',
    'holdBibleReaderWheelTransitionLock', 'finishBibleReaderWheelTransitionLock',
    'bibleWheelTargetBlocked', 'accumulateBibleWheel', 'onBibleReaderWheel',
    'showVersesViewWithTransition'
  ].map(functionSource).join('\n');
  const api = Function('window', 'document', 'viewEl', 'viewInner', 'timers', 'chapters', `
    var BIBLE_WHEEL_AXIS_RATIO = 1.25;
    var BIBLE_WHEEL_ACTIVATION_PX = 48;
    var BIBLE_WHEEL_IDLE_MS = 160;
    var BIBLE_WHEEL_LINE_PX = 16;
    var BIBLE_WHEEL_MAX_EVENT_PX = 120;
    var CHAPTER_CROSSFADE_MS = 200;
    var uiView = 'verses';
    var appSheet = { open: false };
    var appSheetState = { phase: 'idle', pointer: null, candidate: null };
    var selectionPointer = null;
    var bibleReaderWheelAction = false;
    var bibleWheelBurst = { x: 0, y: 0, consumed: false, direction: 0, timer: null, generation: 0 };
    var bibleReaderWheelTransitionLock = { active: false, direction: 0, generation: 0 };
    var chapterCrossfadeTimer = null;
    var chapterCrossfadeGeneration = 0;
    function isFiniteAppSheetNumber(value) { return typeof value === 'number' && Number.isFinite(value); }
    function releaseVerseChaseForFreeScroll() {}
    function closeVerseActions() {}
    function clearReaderPointerState() {}
    function shouldReduceChapterMotion() { return true; }
    function clearChapterCrossfadeTimer() {
      chapterCrossfadeGeneration++;
      if (chapterCrossfadeTimer) window.clearTimeout(chapterCrossfadeTimer);
      chapterCrossfadeTimer = null;
    }
    function clearRetiringChapterViews() {}
    function showVersesView() {}
    function showAdjacentChapter(direction) {
      chapters.push(direction);
      holdBibleReaderWheelTransitionLock(direction);
      showVersesViewWithTransition('Genesis', chapters.length + 1, '1');
      return true;
    }
    ${source}
    return { wheel: onBibleReaderWheel, burst: function () { return bibleWheelBurst; } };
  `)(windowObject, documentObject, viewEl, viewInner, timers, chapters);

  api.wheel(wheelEvent(48));
  assert.deepEqual(chapters, [1], 'the synchronous reduced-motion render performs one chapter action');
  assert.equal(timers.some(timer => timer.ms === 200), false, 'reduced motion owns no crossfade timer');
  const quiet = timers.filter(timer => timer.ms === 160 && !timer.cleared).at(-1);
  assert.ok(quiet, 'synchronous completion establishes a fresh 160ms consumed quiet lock');
  api.wheel(wheelEvent(120));
  api.wheel(wheelEvent(-120));
  assert.deepEqual(chapters, [1], 'residual momentum in either direction cannot perform a second action');
  timers.filter(timer => timer.ms === 160 && !timer.cleared).at(-1).fn();
  api.wheel(wheelEvent(-48));
  assert.deepEqual(chapters, [1, -1], 'a new action is accepted after the reduced-motion quiet period');
});
