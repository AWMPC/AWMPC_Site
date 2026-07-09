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
    [1, .5, 800], [1, 0, Infinity], [1, 0, 0], ['1', 0, 800]
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
});

function functionSource(name) {
  const match = bible.match(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}`));
  assert.ok(match, `${name} missing`);
  return match[0];
}

function wheelHarness(page = 'chapters') {
  const timers = [];
  const pages = [];
  const pager = {
    clientWidth: 640,
    contains(target) { return target && target.inside === true; }
  };
  const windowObject = {
    innerWidth: 800,
    visualViewport: { width: 700 },
    getSelection() { return { isCollapsed: true }; },
    setTimeout(fn, ms) { const timer = { fn, ms, cleared: false }; timers.push(timer); return timer; },
    clearTimeout(timer) { if (timer) timer.cleared = true; }
  };
  const api = Function('window', 'document', 'selectionPager', 'pages', 'timers', `
    var BIBLE_WHEEL_AXIS_RATIO = 1.25;
    var BIBLE_WHEEL_ACTIVATION_PX = 48;
    var BIBLE_WHEEL_IDLE_MS = 160;
    var BIBLE_WHEEL_LINE_PX = 16;
    var BIBLE_WHEEL_MAX_EVENT_PX = 120;
    var selectionPages = ['books', 'chapters', 'verses'];
    var selectionSheetPage = ${JSON.stringify(page)};
    var appSheet = { open: true };
    var appSheetState = { kind: 'selection', phase: 'idle', pointer: null, candidate: null };
    var selectionPointer = null;
    var bibleWheelBurst = { x: 0, y: 0, consumed: false, direction: 0, timer: null, generation: 0 };
    function isFiniteAppSheetNumber(value) { return typeof value === 'number' && Number.isFinite(value); }
    ${functionSource('normalizeBibleWheelDelta')}
    ${functionSource('bibleWheelClaimDirection')}
    ${functionSource('resetBibleWheelBurst')}
    ${functionSource('bibleWheelTargetBlocked')}
    ${functionSource('accumulateBibleWheel')}
    ${functionSource('onSelectionWheel')}
    function setSelectionPage(next, replace, mode) {
      selectionSheetPage = next;
      pages.push([next, replace, mode]);
    }
    return {
      wheel: onSelectionWheel,
      reset: resetBibleWheelBurst,
      burst: function () { return bibleWheelBurst; },
      page: function () { return selectionSheetPage; },
      phase: function (value) { appSheetState.phase = value; },
      pointer: function (value) { appSheetState.pointer = value; selectionPointer = value; },
      selection: function (value) { window.getSelection = function () { return value; }; },
      expire: function (index) { var timer = timers[index == null ? timers.length - 1 : index]; if (timer) timer.fn(); }
    };
  `)(windowObject, { documentElement: { clientWidth: 600 } }, pager, pages, timers);
  return { api, pages, timers, pager, windowObject };
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
  api.wheel(second);
  assert.equal(first.prevented, false);
  assert.equal(second.prevented, true);
  assert.deepEqual(pages, [['verses', true, 'pointer']]);

  const momentum = wheelEvent(120);
  api.wheel(momentum);
  assert.equal(momentum.prevented, true, 'claimed momentum remains owned');
  assert.equal(pages.length, 1, 'momentum cannot page twice');
  assert.equal(timers.at(-1).ms, 160);

  api.expire();
  api.wheel(wheelEvent(-24));
  const fresh = wheelEvent(-24);
  api.wheel(fresh);
  assert.equal(fresh.prevented, true);
  assert.deepEqual(pages.at(-1), ['chapters', true, 'pointer']);
});

test('wheel direction locks, normalization is integrated, and vertical gestures stay native', () => {
  const { api, pages } = wheelHarness();
  api.wheel(wheelEvent(24));
  api.wheel(wheelEvent(-120));
  assert.equal(pages.length, 0, 'reversal cannot claim the opposite page');
  const line = wheelEvent(2, 0, { deltaMode: 1 });
  api.wheel(line);
  assert.equal(line.prevented, true, 'line-mode motion joins the locked forward burst');
  assert.deepEqual(pages, [['verses', true, 'pointer']]);

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
    wheelEvent(120, 0, { shiftKey: true }), wheelEvent(120, 0, { target: editable }),
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

test('selector claims endpoints and stale idle callbacks cannot reset a newer burst', () => {
  const { api, pages, timers } = wheelHarness('verses');
  const endpoint = wheelEvent(120);
  api.wheel(endpoint);
  assert.equal(endpoint.prevented, true, 'endpoint blocks browser history navigation');
  assert.equal(pages.length, 0);
  const stale = timers.at(-1);
  api.reset();
  api.wheel(wheelEvent(-24));
  stale.fn();
  api.wheel(wheelEvent(-24));
  assert.deepEqual(pages, [['chapters', true, 'pointer']], 'stale timer leaves the newer burst intact');
});
