const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const bible = fs.readFileSync(path.join(__dirname, '..', 'bible.html'), 'utf8');

function functionSource(name) {
  const start = bible.indexOf(`  function ${name}(`);
  assert.notEqual(start, -1, `${name} is present`);
  const open = bible.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = open; i < bible.length; i += 1) {
    const char = bible[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return bible.slice(start, i + 1);
  }
  assert.fail(`${name} is complete`);
}

test('overflow fade geometry is strict and uses a one-pixel edge tolerance', () => {
  const source = functionSource('isFiniteAppSheetNumber') + '\n' +
    functionSource('appSheetOverflowFadeState') +
    '\nthis.fadeState = appSheetOverflowFadeState;';
  const context = { Number };
  vm.runInNewContext(source, context);
  const state = (...args) => JSON.parse(JSON.stringify(context.fadeState(...args)));

  assert.deepEqual(state(0, 100, 100), { top: false, bottom: false });
  assert.deepEqual(state(0, 100, 220), { top: false, bottom: true });
  assert.deepEqual(state(60, 100, 220), { top: true, bottom: true });
  assert.deepEqual(state(120, 100, 220), { top: true, bottom: false });
  assert.deepEqual(state(1, 100, 220), { top: false, bottom: true });
  assert.deepEqual(state(119, 100, 220), { top: true, bottom: false });
  for (const args of [['0', 100, 220], [0, '100', 220], [0, 100, '220'],
    [Infinity, 100, 220], [0, Infinity, 220], [0, 100, Infinity],
    [-1, 100, 220], [0, -1, 220], [0, 100, -1]]) {
    assert.deepEqual(state(...args), { top: false, bottom: false }, `hostile geometry: ${args}`);
  }
});

function fakeClassList() {
  const values = new Set();
  return {
    toggle(name, force) { if (force) values.add(name); else values.delete(name); },
    contains(name) { return values.has(name); }
  };
}

function fakeScroller() {
  const listeners = new Map();
  return {
    scrollTop: 0, clientHeight: 100, scrollHeight: 220,
    addCount: 0, removeCount: 0,
    addEventListener(type, fn, options) { this.addCount += 1; listeners.set(type, { fn, options }); },
    removeEventListener(type, fn) {
      const current = listeners.get(type);
      if (current && current.fn === fn) { this.removeCount += 1; listeners.delete(type); }
    },
    fire(type) { const listener = listeners.get(type); if (listener) listener.fn(); },
    listenerCount() { return listeners.size; }
  };
}

function lifecycleHarness() {
  const frames = new Map();
  const cancelled = [];
  let nextFrame = 1;
  const observers = [];
  class FakeResizeObserver {
    constructor(callback) { this.callback = callback; this.targets = []; this.disconnectCount = 0; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnectCount += 1; this.targets = []; }
    fire() { this.callback(); }
  }
  const body = fakeScroller();
  const firstPanel = fakeScroller();
  const secondPanel = fakeScroller();
  let activePanel = firstPanel;
  const fadeTop = { classList: fakeClassList() };
  const fadeBottom = { classList: fakeClassList() };
  const state = {
    kind: 'history', phase: 'idle', generation: 4,
    overflowFrame: null, overflowObserver: null, overflowScroller: null, overflowListener: null
  };
  const context = {
    Number,
    appSheetState: state,
    appSheetBody: body,
    appSheetMeasure: { querySelector() { return activePanel; } },
    appSheetFadeTop: fadeTop,
    appSheetFadeBottom: fadeBottom,
    ResizeObserver: FakeResizeObserver,
    requestAnimationFrame(callback) { const id = nextFrame++; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { cancelled.push(id); frames.delete(id); },
    isCurrentAppSheetGeneration(generation) { return generation === state.generation; }
  };
  const names = [
    'isFiniteAppSheetNumber', 'appSheetOverflowFadeState', 'currentAppSheetOverflowScroller',
    'renderAppSheetOverflowFades', 'scheduleAppSheetOverflowFades',
    'cleanupAppSheetOverflowFades', 'installAppSheetOverflowFades', 'retargetAppSheetOverflowFades'
  ];
  vm.runInNewContext(names.map(functionSource).join('\n') + '\nthis.api = {' +
    'install: installAppSheetOverflowFades, schedule: scheduleAppSheetOverflowFades,' +
    'render: renderAppSheetOverflowFades, cleanup: cleanupAppSheetOverflowFades,' +
    'retarget: retargetAppSheetOverflowFades};', context);
  return {
    api: context.api, state, body, firstPanel, secondPanel, fadeTop, fadeBottom, frames, cancelled, observers,
    setActivePanel(panel) { activePanel = panel; },
    flush() { const entries = [...frames]; frames.clear(); for (const [, callback] of entries) callback(); }
  };
}

test('overflow lifecycle observes one scroller, coalesces work, retargets, and rejects stale generations', () => {
  const h = lifecycleHarness();
  assert.equal(h.api.install(h.body), true);
  assert.equal(h.body.listenerCount(), 1);
  assert.equal(h.observers.length, 1);
  assert.deepEqual(h.observers[0].targets, [h.body]);
  assert.equal(h.frames.size, 0, 'initial state renders without competing with sheet measurement RAF');

  h.body.fire('scroll');
  h.observers[0].fire();
  assert.equal(h.frames.size, 1, 'scroll and resize share one RAF');
  h.flush();
  assert.equal(h.fadeTop.classList.contains('is-visible'), false);
  assert.equal(h.fadeBottom.classList.contains('is-visible'), true);

  h.body.scrollTop = 60;
  h.body.fire('scroll');
  h.flush();
  assert.equal(h.fadeTop.classList.contains('is-visible'), true);
  assert.equal(h.fadeBottom.classList.contains('is-visible'), true);

  const staleGeneration = h.state.generation;
  const staleObserver = h.observers[0];
  h.api.schedule(staleGeneration);
  const staleCallback = [...h.frames.values()][0];
  h.frames.clear();
  h.state.generation += 1;
  h.fadeTop.classList.toggle('is-visible', false);
  h.fadeBottom.classList.toggle('is-visible', false);
  staleObserver.fire();
  assert.equal(h.frames.size, 0, 'stale observer callback cannot schedule work');
  staleCallback();
  assert.equal(h.fadeTop.classList.contains('is-visible'), false);
  assert.equal(h.fadeBottom.classList.contains('is-visible'), false);

  h.state.kind = 'selection';
  h.api.retarget();
  assert.equal(h.body.listenerCount(), 0, 'generic body is released on selection retarget');
  assert.equal(h.firstPanel.listenerCount(), 1);
  assert.equal(h.observers.length, 2);
  assert.deepEqual(h.observers[1].targets, [h.firstPanel]);
  h.setActivePanel(h.secondPanel);
  h.api.retarget();
  assert.equal(h.firstPanel.listenerCount(), 0);
  assert.equal(h.secondPanel.listenerCount(), 1, 'only the active panel remains observed');
  assert.equal(h.observers.length, 3);
  assert.deepEqual(h.observers[2].targets, [h.secondPanel]);

  h.api.cleanup();
  h.api.cleanup();
  assert.equal(h.secondPanel.listenerCount(), 0);
  assert.equal(h.fadeTop.classList.contains('is-visible'), false);
  assert.equal(h.fadeBottom.classList.contains('is-visible'), false);
  assert.equal(h.state.overflowFrame, null);
  assert.equal(h.state.overflowObserver, null);
  assert.equal(h.state.overflowScroller, null);
  assert.equal(h.state.overflowListener, null);
});

test('overflow fades use decorative accessible surface gradients and respect platform modes', () => {
  assert.match(bible, /\.app-sheet-fade\s*\{[^}]*height:\s*28px[^}]*z-index:\s*2[^}]*pointer-events:\s*none/s);
  assert.match(bible, /\.app-sheet-fade\s*\{[^}]*transition-property:\s*opacity[^}]*transition-duration:\s*160ms[^}]*transition-timing-function:\s*var\(--motion-ease\)/s);
  assert.match(bible, /\.app-sheet-fade-top\s*\{[^}]*linear-gradient\(to bottom,\s*var\(--surface\),\s*transparent\)/s);
  assert.match(bible, /\.app-sheet-fade-bottom\s*\{[^}]*linear-gradient\(to top,\s*var\(--surface\),\s*transparent\)/s);
  assert.match(bible, /\.app-sheet-body\.selection-sheet-host\s*~\s*\.app-sheet-fade-bottom\s*\{[^}]*bottom:\s*28px/s);
  assert.match(bible, /\.selection-indicator\s*\{[^}]*z-index:\s*3/s);
  assert.match(bible, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.app-sheet-fade[\s\S]*transition-duration:\s*0s/);
  assert.match(bible, /@media \(forced-colors: active\)[\s\S]*\.app-sheet-fade[\s\S]*Canvas/);
  assert.match(bible, /@media \(forced-colors: active\)[\s\S]*\.selection-indicator[\s\S]*box-shadow:\s*none/);
  assert.equal((bible.match(/class="app-sheet-fade app-sheet-fade-(?:top|bottom)" aria-hidden="true"/g) || []).length, 2);
});

test('content, page-settle, snap, and viewport hooks schedule or retarget fades', () => {
  assert.match(functionSource('renderAppSheetContent'), /installAppSheetOverflowFades\(currentAppSheetOverflowScroller\(\)\)/);
  assert.match(functionSource('finishSelectionPageSettle'), /retargetAppSheetOverflowFades\(\)/);
  assert.match(functionSource('setSelectionPage'), /shouldReduceVerseMotion\(\)[\s\S]*retargetAppSheetOverflowFades\(\)/);
  assert.match(functionSource('setSheetSnap'), /renderAppSheetOverflowFades\(generation\)/);
  assert.match(functionSource('applyTextScale'), /renderAppSheetOverflowFades\(appSheetState\.generation\)/);
  assert.match(functionSource('resetAppSheetState'), /cleanupAppSheetOverflowFades\(\)/);
});
