const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const bible = fs.readFileSync(path.join(root, 'templates', 'bible.html'), 'utf8');

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = bible.match(new RegExp('(?:^|\\n)\\s*' + escaped + '\\s*\\{([^}]*)\\}'));
  assert.ok(match, `missing CSS rule for ${selector}`);
  return match[1];
}

function productionFunction(name, source = bible) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing production function ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`unterminated production function ${name}`);
}

function clearanceFixture(options = {}, source = bible) {
  const writes = {};
  let mobile = options.mobile === true;
  const viewportHeight = 800;
  const floatingNav = {
    offsetHeight: options.navHeight ?? 60,
    offsetTop: options.navTop ?? (mobile ? 8 : 732),
    classList: { contains: (name) => name === 'hidden' && options.navHidden === true },
  };
  const actionChrome = {
    offsetHeight: options.actionHeight ?? 60,
    offsetTop: options.actionTop ?? 732,
  };
  const window = {
    innerHeight: viewportHeight,
    matchMedia: (query) => {
      assert.equal(query, '(max-width: 640px)');
      return { matches: mobile };
    },
  };
  const document = {
    documentElement: {
      clientHeight: viewportHeight,
      style: { setProperty: (name, value) => { writes[name] = value; } },
    },
  };
  const update = Function(
    'bottomChrome', 'actionChrome', 'floatingNav', 'window', 'document',
    `${productionFunction('updateBottomChromeClearance', source)}; return updateBottomChromeClearance;`,
  )({}, actionChrome, floatingNav, window, document);
  return { update, writes, floatingNav, actionChrome, window, setMobile: (value) => { mobile = value; } };
}

test('action chrome owns History, Search, then the menu action in semantic DOM order', () => {
  assert.match(bible, /<div class="action-chrome" id="action-chrome">\s*<div class="bottom-actions" aria-label="Quick actions">\s*<button[^>]*id="btn-history"[^>]*>History<\/button>\s*<button[^>]*id="btn-search"[^>]*>Search<\/button>\s*<\/div>\s*<div class="fab-root">[\s\S]*?id="fab-main"[\s\S]*?<\/div>\s*<\/div>/);
});

test('desktop chrome is a collision-safe viewport flex row with distinct surfaces', () => {
  assert.match(rule('.bottom-chrome'), /position:\s*fixed;/);
  assert.match(rule('.bottom-chrome'), /inset:\s*0;/);
  assert.match(rule('.bottom-chrome'), /pointer-events:\s*none;/);
  assert.match(rule('.bottom-chrome'), /display:\s*flex;/);
  assert.match(rule('.bottom-chrome'), /align-items:\s*flex-end;/);
  assert.match(rule('.bottom-chrome'), /justify-content:\s*space-between;/);
  assert.match(rule('.bottom-chrome'), /gap:\s*var\(--display-panel-gap\);/);
  assert.match(rule('.bottom-chrome'), /padding:[^;]*12px[^;]*env\(safe-area-inset-bottom, 0px\)/);
  assert.doesNotMatch(rule('.bottom-chrome'), /background:|border:|box-shadow:|backdrop-filter:/);

  const nav = rule('.floating-nav');
  assert.match(nav, /position:\s*static;/);
  assert.match(nav, /flex:\s*0 1 auto;/);
  assert.match(nav, /min-width:\s*0;/);
  assert.match(nav, /max-width:\s*min\(/);
  assert.match(nav, /pointer-events:\s*auto;/);
  assert.match(nav, /background:\s*var\(--float-nav-bg\);/);

  const actions = rule('.action-chrome');
  assert.match(actions, /position:\s*static;/);
  assert.match(actions, /flex:\s*0 0 auto;/);
  assert.match(actions, /pointer-events:\s*auto;/);
  assert.match(actions, /background:\s*var\(--float-nav-bg\);/);
});

test('one hidden state drives both desktop surfaces with a shared motion token', () => {
  assert.match(bible, /--chrome-motion:\s*220ms;/);
  assert.match(rule('.floating-nav'), /transition-duration:\s*var\(--chrome-motion\);/);
  assert.match(rule('.action-chrome'), /transition-duration:\s*var\(--chrome-motion\);/);
  assert.match(rule('.bottom-chrome.scroll-hidden .floating-nav'), /translateY\(calc\(100% \+ 18px \+ env\(safe-area-inset-bottom, 0px\)\)\)/);
  assert.match(rule('.bottom-chrome.scroll-hidden .action-chrome'), /translateY\(calc\(100% \+ 18px \+ env\(safe-area-inset-bottom, 0px\)\)\)/);
  assert.match(bible, /function setBottomChromeHidden\(hidden\)[\s\S]*?bottomChrome\.classList\.toggle\('scroll-hidden', hidden\);/);
});

test('mobile puts navigation at top and full-width actions at bottom with opposite exits', () => {
  const mobile = bible.match(/@media \(max-width: 640px\) \{([\s\S]*?)\n  \}/);
  assert.ok(mobile, 'missing 640px responsive chrome rules');
  assert.match(mobile[1], /\.floating-nav\s*\{[\s\S]*?top:\s*calc\(8px \+ env\(safe-area-inset-top, 0px\)\);[\s\S]*?bottom:\s*auto;/);
  assert.match(mobile[1], /\.floating-nav\s*\{[\s\S]*?position:\s*absolute;/);
  assert.match(mobile[1], /\.floating-nav\s*\{[^}]*left:\s*12px;[^}]*right:\s*12px;[^}]*width:\s*auto;[^}]*max-width:\s*none;[^}]*flex:\s*none;/);
  assert.match(mobile[1], /\.action-chrome\s*\{[\s\S]*?left:\s*12px;[\s\S]*?right:\s*12px;[\s\S]*?bottom:\s*calc\(8px \+ env\(safe-area-inset-bottom, 0px\)\);/);
  assert.match(mobile[1], /\.action-chrome\s*\{[\s\S]*?position:\s*absolute;/);
  assert.match(mobile[1], /\.fab-root\s*\{[^}]*margin-left:\s*auto;/);
  assert.match(mobile[1], /\.bottom-chrome\.scroll-hidden \.floating-nav\s*\{[^}]*translateY\(calc\(-100% - 18px - env\(safe-area-inset-top, 0px\)\)\)/);
  assert.match(mobile[1], /\.bottom-chrome\.scroll-hidden \.action-chrome\s*\{[^}]*translateY\(calc\(100% \+ 18px \+ env\(safe-area-inset-bottom, 0px\)\)\)/);
});

test('desktop sheets use measured half-viewport-bounded widths and immutable side origins', () => {
  assert.match(bible, /@media \(min-width: 641px\) \{[\s\S]*?\.app-sheet\.snap-determined\s*\{[^}]*width:\s*min\(var\(--sheet-width,\s*50vw\),\s*50vw\);/,
    'the live CSS width caps stale measured pixels after viewport narrowing');
  assert.match(bible, /@media \(min-width: 641px\) \{[\s\S]*?\.app-sheet\.inline-left[^}]*margin-left:\s*12px;[^}]*margin-right:\s*auto;/);
  assert.match(bible, /@media \(min-width: 641px\) \{[\s\S]*?\.app-sheet\.inline-right[^}]*margin-left:\s*auto;[^}]*margin-right:\s*12px;/);
  assert.match(bible, /@media \(min-width: 641px\) \{[\s\S]*?\.app-sheet\.snap-fullscreen\s*\{[^}]*width:\s*min\(100vw,\s*100vw\);/,
    'fullscreen keeps the same animatable math-function shape as determined width');
  assert.doesNotMatch(bible, /\.app-sheet\.snap-determined\s*\{[^}]*max-width\s*:/,
    'determined width does not introduce a non-animatable constraint during restore');
  assert.doesNotMatch(bible, /\.app-sheet\.snap-fullscreen\s*\{[^}]*max-width\s*:/,
    'fullscreen width shares the same unconstrained max-width used by determined sheets');
  assert.match(bible, /@media \(min-width: 641px\) \{[\s\S]*?\.app-sheet\.snap-fullscreen\.inline-left\s*\{[^}]*margin-left:\s*0;[^}]*margin-right:\s*auto;/,
    'left-anchored fullscreen sheets keep their auto end margin while expanding right');
  assert.match(bible, /@media \(min-width: 641px\) \{[\s\S]*?\.app-sheet\.snap-fullscreen\.inline-right\s*\{[^}]*margin-left:\s*auto;[^}]*margin-right:\s*0;/,
    'right-anchored fullscreen sheets keep their auto start margin while expanding left');
  assert.equal(Math.min(600, 800 * .5), 400,
    'a stale 600px measured width resolves to the live 50vw cap after narrowing to 800px');
});

test('mobile sheet width remains fluid despite determined measurements and text scaling', () => {
  assert.match(bible, /@media \(max-width: 640px\) \{[\s\S]*?\.app-sheet\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;[^}]*margin-left:\s*0;[^}]*margin-right:\s*0;/);
});

test('top and bottom clearance independently track both responsive surfaces', () => {
  assert.match(bible, /--top-chrome-clearance:\s*0px;/);
  assert.match(bible, /--bottom-chrome-clearance:/);
  assert.match(bible, /var actionChrome = document\.getElementById\('action-chrome'\);/);
  assert.match(bible, /function updateBottomChromeClearance\(\) \{[\s\S]*?window\.matchMedia\('\(max-width: 640px\)'\)\.matches[\s\S]*?floatingNav\.classList\.contains\('hidden'\)[\s\S]*?floatingNav\.offsetHeight[\s\S]*?actionChrome\.offsetHeight[\s\S]*?setProperty\('--top-chrome-clearance',[\s\S]*?setProperty\('--bottom-chrome-clearance',/);
  assert.match(bible, /new ResizeObserver\(updateBottomChromeClearance\)[\s\S]*?\.observe\(floatingNav\);[\s\S]*?\.observe\(actionChrome\);/);
  assert.match(rule('.view-inner'), /padding-top:\s*calc\(16px \+ var\(--top-chrome-clearance\)\);/);
  assert.match(rule('.view-inner'), /padding-bottom:\s*calc\(16px \+ var\(--bottom-chrome-clearance\)\);/);
  assert.match(rule('.fab-panel'), /bottom:\s*var\(--bottom-chrome-clearance\);/);
  assert.match(rule('.bottom-history-menu'), /bottom:\s*var\(--bottom-chrome-clearance\);/);
});

test('minimum targets and narrow reflow protections remain intact', () => {
  assert.match(bible, /button,[\s\S]*?\[role="button"\]\s*\{[\s\S]*?min-width:\s*24px;[\s\S]*?min-height:\s*24px;/);
  assert.match(bible, /@media \(max-width: 320px\) \{[\s\S]*?\.view-inner,[\s\S]*?\.fab-panel,[\s\S]*?min-width:\s*0;[\s\S]*?max-width:\s*100%;/);
});

test('chrome hover paint is fine-pointer only while keyboard focus paint is unconditional', () => {
  const capability = bible.match(/@media \(hover:hover\) and \(pointer:fine\) \{([\s\S]*?)\n  \}/);
  assert.ok(capability, 'fine-pointer hover capability query missing');
  for (const selector of ['.floating-nav button:hover', '.bottom-action-button:hover', '.fab-main:hover']) {
    assert.match(capability[1], new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${selector} must be capability gated`);
    const outsideCapability = bible.slice(0, capability.index) + bible.slice(capability.index + capability[0].length);
    assert.doesNotMatch(outsideCapability, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${selector} must not stick on coarse pointers`);
  }
  for (const selector of ['.floating-nav button:focus-visible', '.bottom-action-button:focus-visible', '.fab-main:focus-visible']) {
    assert.match(bible, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${selector} keyboard paint missing`);
    assert.doesNotMatch(capability[1], new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${selector} must remain unconditional`);
  }
});

test('production clearance lifecycle recomputes across desktop, mobile, and hidden navigation', () => {
  const fixture = clearanceFixture({ navHeight: 72, navTop: 720, actionHeight: 60, actionTop: 732 });
  fixture.update();
  assert.deepEqual(fixture.writes, {
    '--top-chrome-clearance': '0px',
    '--bottom-chrome-clearance': '92px',
  });

  fixture.setMobile(true);
  fixture.floatingNav.offsetTop = 8;
  fixture.update();
  assert.deepEqual(fixture.writes, {
    '--top-chrome-clearance': '92px',
    '--bottom-chrome-clearance': '80px',
  });

  const hidden = clearanceFixture({ mobile: true, navHidden: true, navHeight: 300, navTop: 8 });
  hidden.update();
  assert.equal(hidden.writes['--top-chrome-clearance'], '0px');
  assert.equal(hidden.writes['--bottom-chrome-clearance'], '80px');
});

test('production ResizeObserver observes exactly both surfaces and recomputes on callback', () => {
  const fixture = clearanceFixture({ actionHeight: 60, actionTop: 732 });
  const observed = [];
  let observerCallback;
  function ResizeObserver(callback) {
    observerCallback = callback;
    this.observe = (target) => observed.push(target);
  }
  const listeners = {};
  fixture.window.ResizeObserver = ResizeObserver;
  fixture.window.addEventListener = (name, callback) => { listeners[name] = callback; };
  const observe = Function(
    'updateBottomChromeClearance', 'window', 'ResizeObserver', 'floatingNav', 'actionChrome',
    'scheduleMarqueeMeasure', 'bottomChromeResizeObserver',
    `${productionFunction('observeBottomChromeClearance')}; return observeBottomChromeClearance;`,
  )(fixture.update, fixture.window, ResizeObserver, fixture.floatingNav, fixture.actionChrome, () => {}, null);

  observe();
  assert.deepEqual(observed, [fixture.floatingNav, fixture.actionChrome]);
  assert.deepEqual(Object.keys(listeners).sort(), ['orientationchange', 'resize']);
  fixture.actionChrome.offsetHeight = 84;
  fixture.actionChrome.offsetTop = 708;
  observerCallback();
  assert.equal(fixture.writes['--bottom-chrome-clearance'], '104px');
});

test('production hidden and scroll lifecycle shares one state and coalesces animation frames', () => {
  const toggles = [];
  const clearanceFrames = [];
  const bottomChrome = { classList: { toggle: (...args) => toggles.push(args) } };
  const fabPanel = { classList: { contains: () => false } };
  let clearanceUpdates = 0;
  const setHidden = Function(
    'bottomChrome', 'fabPanel', 'openMenu', 'scheduleBottomChromeClearanceUpdate',
    `${productionFunction('setBottomChromeHidden')}; return setBottomChromeHidden;`,
  )(bottomChrome, fabPanel, null, () => { clearanceUpdates += 1; clearanceFrames.push('scheduled'); });
  setHidden(true);
  assert.deepEqual(toggles, [['scroll-hidden', true]]);
  assert.equal(clearanceUpdates, 1);

  const frames = new Map();
  let nextFrame = 1;
  const hiddenStates = [];
  const viewEl = { scrollTop: 24 };
  const lifecycle = Function(
    'viewEl', 'requestAnimationFrame', 'setBottomChromeHidden',
    `var lastViewScrollTop = 0; var bottomChromeScrollFrame = null; var programmaticVerseScroll = false;
     ${productionFunction('updateBottomChromeFromScroll')}
     ${productionFunction('scheduleBottomChromeScrollUpdate')}
     return { schedule: scheduleBottomChromeScrollUpdate, state: function () { return bottomChromeScrollFrame; } };`,
  )(viewEl, (callback) => { const id = nextFrame++; frames.set(id, callback); return id; }, (value) => hiddenStates.push(value));
  lifecycle.schedule();
  lifecycle.schedule();
  assert.equal(frames.size, 1);
  const [[id, callback]] = frames;
  frames.delete(id);
  callback();
  assert.deepEqual(hiddenStates, [true]);
  assert.equal(lifecycle.state(), null);
  viewEl.scrollTop = 2;
  lifecycle.schedule();
  const [[nextId, nextCallback]] = frames;
  frames.delete(nextId);
  nextCallback();
  assert.deepEqual(hiddenStates, [true, false]);
});

test('programmatic verse scrolling advances the chrome baseline without changing visibility', () => {
  const frames = [];
  const hiddenStates = [];
  const viewEl = { scrollTop: 0 };
  const lifecycle = Function(
    'viewEl', 'requestAnimationFrame', 'setBottomChromeHidden',
    `var lastViewScrollTop = 0;
     var bottomChromeScrollFrame = null;
     var programmaticVerseScroll = false;
     ${productionFunction('beginProgrammaticVerseScroll')}
     ${productionFunction('endProgrammaticVerseScroll')}
     ${productionFunction('updateBottomChromeFromScroll')}
     ${productionFunction('scheduleBottomChromeScrollUpdate')}
     return {
       begin: beginProgrammaticVerseScroll,
       end: endProgrammaticVerseScroll,
       schedule: scheduleBottomChromeScrollUpdate,
       baseline: function () { return lastViewScrollTop; },
       programmatic: function () { return programmaticVerseScroll; }
     };`,
  )(viewEl, (callback) => { frames.push(callback); return frames.length; }, (value) => hiddenStates.push(value));
  const runNextFrame = () => frames.shift()();

  lifecycle.begin();
  lifecycle.begin();
  viewEl.scrollTop = 16;
  lifecycle.schedule();
  runNextFrame();
  assert.deepEqual(hiddenStates, [], 'scripted downward movement does not hide chrome');
  assert.equal(lifecycle.baseline(), 16, 'owned scroll events advance the baseline');

  lifecycle.end();
  lifecycle.end();
  assert.equal(lifecycle.programmatic(), false, 'repeated cleanup remains released');
  assert.equal(lifecycle.baseline(), 16, 'release synchronizes the final scripted position');
  viewEl.scrollTop = 23;
  lifecycle.schedule();
  runNextFrame();
  viewEl.scrollTop = 16;
  lifecycle.schedule();
  runNextFrame();
  assert.deepEqual(hiddenStates, [], 'manual movement below the 8px threshold does not toggle chrome');

  viewEl.scrollTop = 24;
  lifecycle.schedule();
  runNextFrame();
  assert.deepEqual(hiddenStates, [true], 'later manual downward movement still hides chrome');

  viewEl.scrollTop = 16;
  lifecycle.schedule();
  runNextFrame();
  viewEl.scrollTop = 2;
  lifecycle.schedule();
  runNextFrame();
  assert.deepEqual(hiddenStates, [true, false, false], 'manual upward movement and the top reveal behavior are unchanged');

  lifecycle.begin();
  viewEl.scrollTop = 18;
  lifecycle.schedule();
  lifecycle.end();
  runNextFrame();
  assert.deepEqual(hiddenStates, [true, false, false], 'a delayed final scripted scroll event cannot hide chrome');
  assert.equal(lifecycle.baseline(), 18, 'delayed final events retain the released baseline');
});

test('clearance mutation guards reject missing critical writes and observations', () => {
  const missingTopWrite = bible.replace(
    "document.documentElement.style.setProperty('--top-chrome-clearance', Math.ceil(topClearance) + 'px');",
    '',
  );
  const fixture = clearanceFixture({ mobile: true }, missingTopWrite);
  fixture.update();
  assert.equal(fixture.writes['--top-chrome-clearance'], undefined);
  assert.notDeepEqual(fixture.writes, {
    '--top-chrome-clearance': '80px',
    '--bottom-chrome-clearance': '80px',
  });
  function observedTargets(source) {
    const fixture = clearanceFixture();
    const observed = [];
    function ResizeObserver() { this.observe = (target) => observed.push(target); }
    fixture.window.ResizeObserver = ResizeObserver;
    fixture.window.addEventListener = () => {};
    const observe = Function(
      'updateBottomChromeClearance', 'window', 'ResizeObserver', 'floatingNav', 'actionChrome',
      'scheduleMarqueeMeasure', 'bottomChromeResizeObserver',
      `${productionFunction('observeBottomChromeClearance', source)}; return observeBottomChromeClearance;`,
    )(fixture.update, fixture.window, ResizeObserver, fixture.floatingNav, fixture.actionChrome, () => {}, null);
    observe();
    return observed.map((target) => target === fixture.floatingNav ? 'nav' : target === fixture.actionChrome ? 'action' : 'unknown');
  }
  assert.deepEqual(observedTargets(bible), ['nav', 'action']);
  const noNavObserve = bible.replace('bottomChromeResizeObserver.observe(floatingNav);', '');
  const noActionObserve = bible.replace('bottomChromeResizeObserver.observe(actionChrome);', '');
  assert.equal(observedTargets(noNavObserve).length, 1);
  assert.equal(observedTargets(noActionObserve).length, 1);
});
