const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const bible = fs.readFileSync(path.join(root, 'bible.html'), 'utf8');
const functionNames = [
  'beginProgrammaticVerseScroll',
  'endProgrammaticVerseScroll',
  'setUIView',
  'cubicVerseEase',
  'verseChaseDurationForDistance',
  'keepVerseChaseTargetVisible',
  'stopVerseChase',
  'releaseVerseChaseForFreeScroll',
  'setVerseChaseTarget',
  'stepVerseChase'
];
const productionFunctions = functionNames.map((name) => {
  const match = bible.match(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}`));
  assert.ok(match, `missing ${name}`);
  return match[0];
}).join('\n');

function sourceBetween(start, end) {
  const from = bible.indexOf(start);
  assert.notEqual(from, -1, `missing source marker: ${start}`);
  const to = bible.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing source marker: ${end}`);
  return bible.slice(from, to);
}

function sourceFunction(signature) {
  const from = bible.indexOf(signature);
  assert.notEqual(from, -1, `missing function: ${signature}`);
  const to = bible.indexOf('\n  function ', from + signature.length);
  assert.notEqual(to, -1, `missing next function after: ${signature}`);
  return bible.slice(from, to);
}

test('pointer and Arrow verse activation share the active verse state', () => {
  const activeVerse = sourceBetween('  function setActiveVerse(verse, center) {', '  function updateActiveVerseFromViewport() {');
  assert.match(activeVerse, /viewInner\.querySelector\('\.verse\.active'\)/);
  assert.match(activeVerse, /if \(!target\) return;[\s\S]*var prev = viewInner\.querySelector\('\.verse\.active'\)/);
  assert.match(activeVerse, /prev\.classList\.remove\('active'\)/);
  assert.match(activeVerse, /target\.classList\.add\('active'\)/);

  const pointerActivation = sourceBetween("  document.addEventListener('pointerup', function (e) {", "  document.addEventListener('pointercancel', function (e) {");
  assert.match(pointerActivation, /setActiveVerse\(state\.verse\.getAttribute\('data-v'\), true\)/);

  const arrowNavigation = sourceBetween('  function showAdjacentVerse(direction) {', '  // ===================== BROWSER HISTORY =====================');
  assert.match(arrowNavigation, /setActiveVerse\(verse, false\)/);
  assert.match(arrowNavigation, /setActiveVerse\(verse, false\);[\s\S]*try \{ target\.focus\(\{ preventScroll: true \}\); \} catch \(e\) \{ target\.focus\(\); \}/);
  assert.match(arrowNavigation, /if \(key === 'ArrowUp'\) return showAdjacentVerse\(-1\);/);
  assert.match(arrowNavigation, /if \(key === 'ArrowDown'\) return showAdjacentVerse\(1\);/);
});

test('verse activation has no deferred double-click action path', () => {
  assert.doesNotMatch(bible, /pendingReaderVerseAction|READER_(?:MOUSE_)?DOUBLE_ACTIVATE_MS/);
  assert.doesNotMatch(bible, /scheduleReaderVerse(?:Mouse)?FootnoteToggle|isMatchingReader(?:Mouse)?DoubleActivation/);
  assert.doesNotMatch(bible, /document\.addEventListener\('dblclick'/);
});

test('touch, pen, mouse, and keyboard verse activations avoid duplicate footnote toggles', () => {
  const pointerDown = sourceBetween("  document.addEventListener('pointerdown', function (e) {\n    if (readerPointerState", "  document.addEventListener('pointermove', function (e) {");
  assert.match(pointerDown, /e\.pointerType !== 'touch' && e\.pointerType !== 'pen'/);
  const pointerUp = sourceBetween("  document.addEventListener('pointerup', function (e) {", "  document.addEventListener('pointercancel', function (e) {");
  assert.match(pointerUp, /suppressFollowingReaderClick\(e, state\.verse\);/);
  assert.equal((pointerUp.match(/toggleAllVerseFootnotes\(state\.verse\)/g) || []).length, 1);
  assert.doesNotMatch(pointerUp, /openVerseActions|setTimeout|scheduleReader/);
  assert.match(pointerUp, /else\s*setActiveVerse\(state\.verse\.getAttribute\('data-v'\), true\)/);

  const mouseClick = sourceBetween("  document.addEventListener('click', function (e) {\n    if (uiView !== 'verses'", "  document.addEventListener('contextmenu', function (e) {");
  assert.match(mouseClick, /e\.detail === 0[^;]*return/);
  assert.match(mouseClick, /e\.pointerType === 'touch' \|\| e\.pointerType === 'pen'/);
  assert.equal((mouseClick.match(/toggleAllVerseFootnotes\(verseEl\)/g) || []).length, 1);
  assert.doesNotMatch(mouseClick, /setTimeout|scheduleReader/);
  assert.doesNotMatch(mouseClick, /openVerseActions\(verseEl\)/);
  assert.match(mouseClick, /else\s*setActiveVerse\(verseEl\.getAttribute\('data-v'\), true\)/);

  const contextMenu = sourceBetween("  document.addEventListener('contextmenu', function (e) {", "  viewEl.addEventListener('scroll', function () {");
  assert.match(contextMenu, /verseEl\.classList\.contains\('active'\)/);
  assert.match(contextMenu, /e\.preventDefault\(\);[\s\S]*openVerseActions\(verseEl\);/);

  const keyboard = sourceBetween('  function handleBibleKeyboardNavigation(e) {', '  // ===================== BROWSER HISTORY =====================');
  assert.match(keyboard, /key === 'ContextMenu' \|\| \(key === 'F10' && e\.shiftKey\)/);
  assert.match(keyboard, /handled = openVerseActions\(shortcutVerse\)/);
  assert.match(keyboard, /if \(key === 'Enter'\) handled = uiView === 'verses' \? handleReadingEnterKey\(e\.target\)/);
  assert.match(bible, /target\.setAttribute\('aria-keyshortcuts', 'Shift\+F10'\)/);
});

const runContract = Function('assert', `${productionFunctions}
  const curve = [];
  for (let index = 0; index <= 1000; index += 1) curve.push(cubicVerseEase(index / 1000));
  assert.equal(curve[0], 0);
  assert.equal(curve[500], .5);
  assert.equal(curve[curve.length - 1], 1);
  curve.forEach((value, index) => {
    assert.ok(value >= 0 && value <= 1, 'curve stays bounded');
    if (index > 0) assert.ok(value >= curve[index - 1], 'curve stays monotonic');
  });
  assert.equal(verseChaseDurationForDistance(0), 350);
  assert.equal(verseChaseDurationForDistance(1000), 820);
  assert.equal(verseChaseDurationForDistance(-400), verseChaseDurationForDistance(400));

  const frames = new Map();
  const cancelled = [];
  let nextFrame = 0;
  function requestAnimationFrame(callback) {
    const id = nextFrame;
    nextFrame += 1;
    frames.set(id, callback);
    return id;
  }
  function cancelAnimationFrame(id) {
    cancelled.push(id);
    frames.delete(id);
  }
  let programmaticVerseScroll = false;
  let viewScrollTop = 0;
  const scrollWriteOwnership = [];
  const viewClassToggles = [];
  const viewInner = { classList: { toggle: (...args) => viewClassToggles.push(args) } };
  const viewEl = {
    get scrollTop() { return viewScrollTop; },
    set scrollTop(value) {
      viewScrollTop = value;
      scrollWriteOwnership.push(programmaticVerseScroll);
    },
    scrollHeight: 1200,
    clientHeight: 400
  };
  let uiView = 'verses';
  let reduceMotion = false;
  function shouldReduceVerseMotion() { return reduceMotion; }
  function desiredVerseScrollTop(target) { return target.top; }
  function readingViewportMetrics() {
    return { top: 100, bottom: 500, height: 400, centerY: 300 };
  }
  function target(top, rectTop, rectBottom) {
    return {
      top,
      getBoundingClientRect() {
        return { top: rectTop, bottom: rectBottom, height: rectBottom - rectTop };
      }
    };
  }
  let verseChaseFrame = null;
  let verseChaseTarget = null;
  let verseChaseStartTop = 0;
  let verseChaseDestinationTop = 0;
  let verseChaseStartTime = null;
  let verseChaseDuration = 0;
  let lastViewScrollTop = viewEl.scrollTop;

  setVerseChaseTarget(target(300, 490, 530));
  assert.equal(programmaticVerseScroll, true, 'ownership starts before visibility correction');
  assert.equal(scrollWriteOwnership[0], true, 'visibility correction writes only after ownership starts');
  assert.equal(verseChaseFrame, 0, 'first chase retains pending frame ID zero');
  releaseVerseChaseForFreeScroll();
  assert.equal(programmaticVerseScroll, false, 'manual interruption releases ownership before movement');
  assert.equal(lastViewScrollTop, viewEl.scrollTop, 'manual interruption synchronizes the baseline');
  assert.equal(frames.size, 0, 'free scroll cancels pending frame ID zero');
  assert.deepEqual(cancelled, [0], 'frame ID zero reaches cancellation');
  assert.equal(verseChaseFrame, null, 'frame ID zero cleanup clears frame state');
  assert.equal(verseChaseTarget, null, 'frame ID zero cleanup clears target state');

  viewEl.scrollTop = 5;
  keepVerseChaseTargetVisible(target(0, 80, 120));
  assert.equal(viewEl.scrollTop, 0, 'visibility correction clamps at the scroll start');
  viewEl.scrollTop = 790;
  keepVerseChaseTargetVisible(target(0, 490, 530));
  assert.equal(viewEl.scrollTop, 800, 'visibility correction clamps at the scroll end');

  viewEl.scrollTop = 0;
  setVerseChaseTarget(target(400, 180, 220));
  assert.equal(programmaticVerseScroll, true, 'animated chase owns scripted scrolling');
  assert.equal(frames.size, 1, 'initial target schedules one frame');
  const firstFrame = [...frames.keys()][0];
  viewEl.scrollTop = 100;
  setVerseChaseTarget(target(520, 360, 400));
  setVerseChaseTarget(target(610, 390, 430));
  setVerseChaseTarget(target(700, 420, 460));
  assert.equal(frames.size, 1, 'key repeat retains one scheduled frame');
  assert.equal([...frames.keys()][0], firstFrame, 'retarget does not replace the live frame');
  assert.deepEqual(cancelled, [0], 'retarget does not add a cancellation/restart');
  assert.equal(verseChaseDestinationTop, 700, 'latest verse owns destination');
  assert.equal(verseChaseStartTop, 100, 'retarget starts at current scroll position');
  assert.equal(verseChaseStartTime, null, 'retarget is ready on the next frame');

  setVerseChaseTarget(target(760, 490, 530));
  assert.equal(viewEl.scrollTop, 154, 'visibility guard corrects before the next frame');
  assert.equal(verseChaseStartTop, 154, 'guard correction becomes the rendered start');
  assert.equal(verseChaseDestinationTop, 760, 'guard retains the latest centering destination');
  assert.equal([...frames.keys()][0], firstFrame, 'visibility correction reuses the live frame');

  let frameId = [...frames.keys()][0];
  frames.get(frameId)(0);
  frames.delete(frameId);
  frameId = [...frames.keys()][0];
  frames.get(frameId)(verseChaseDuration);
  frames.delete(frameId);
  assert.equal(viewEl.scrollTop, 760, 'completion reaches the exact destination');
  assert.equal(verseChaseFrame, null, 'completion clears the frame');
  assert.equal(verseChaseTarget, null, 'completion clears the target');
  assert.equal(frames.size, 0, 'completion retains no scheduled work');
  assert.equal(programmaticVerseScroll, false, 'normal completion releases ownership');
  assert.equal(lastViewScrollTop, 760, 'normal completion synchronizes the exact destination');

  reduceMotion = true;
  viewEl.scrollTop = 10;
  setVerseChaseTarget(target(250, 180, 220));
  assert.equal(viewEl.scrollTop, 250, 'reduced motion moves immediately');
  assert.equal(frames.size, 0, 'reduced motion schedules no frame');
  assert.equal(programmaticVerseScroll, false, 'reduced motion releases ownership after its immediate write');
  assert.equal(lastViewScrollTop, 250, 'reduced motion synchronizes the immediate destination');

  reduceMotion = false;
  viewEl.scrollTop = 100;
  setVerseChaseTarget(target(100.25, 180, 220));
  assert.equal(viewEl.scrollTop, 100.25, 'subpixel completion performs the exact final write');
  assert.equal(programmaticVerseScroll, false, 'subpixel completion releases ownership');
  assert.equal(lastViewScrollTop, 100.25, 'subpixel completion synchronizes the exact destination');

  setVerseChaseTarget(target(500, 180, 220));
  assert.equal(frames.size, 1, 'a later target schedules one frame');
  releaseVerseChaseForFreeScroll();
  assert.equal(frames.size, 0, 'free scroll retains no scheduled work');
  assert.equal(verseChaseTarget, null, 'free scroll clears the target');
  assert.deepEqual(cancelled, [0, 3], 'free scroll cancels the scheduled frame');
  assert.equal(programmaticVerseScroll, false, 'wheel or touch release clears ownership');

  setVerseChaseTarget(target(600, 180, 220));
  assert.equal(programmaticVerseScroll, true, 'a new chase reacquires ownership');
  stopVerseChase();
  assert.equal(programmaticVerseScroll, false, 'explicit cancellation releases ownership');

  setVerseChaseTarget(target(650, 180, 220));
  uiView = 'books';
  frameId = [...frames.keys()][0];
  frames.get(frameId)(0);
  frames.delete(frameId);
  assert.equal(programmaticVerseScroll, false, 'leaving the verses view releases ownership');
  assert.equal(verseChaseTarget, null, 'view transition clears the target');

  const nonVerseViews = ['books', 'chapters', 'verse-picker', 'search'];
  nonVerseViews.forEach((nextView, index) => {
    setUIView('verses');
    beginProgrammaticVerseScroll();
    const finalTop = 123 + (index * 37);
    viewEl.scrollTop = finalTop;
    setUIView(nextView);
    assert.equal(programmaticVerseScroll, false, nextView + ' transition immediately releases ownership');
    assert.equal(lastViewScrollTop, finalTop, nextView + ' transition synchronizes the exact baseline');
  });
  assert.deepEqual(viewClassToggles.slice(-8), [
    ['reader-gestures', true], ['reader-gestures', false],
    ['reader-gestures', true], ['reader-gestures', false],
    ['reader-gestures', true], ['reader-gestures', false],
    ['reader-gestures', true], ['reader-gestures', false]
  ], 'all production view transitions retain reader gesture state');
`);

runContract(assert);

test('reader wheel adapter owns claimed paging while native wheel and touch release verse chase', () => {
  const readerWheel = sourceFunction('  function onBibleReaderWheel(event) {');
  assert.match(readerWheel, /var direction = accumulateBibleWheel\(event\);/);
  assert.match(readerWheel, /if \(!direction\) \{[\s\S]*releaseVerseChaseForFreeScroll\(\);[\s\S]*return;/);
  assert.match(readerWheel, /event\.preventDefault\(\);[\s\S]*bibleWheelBurst\.consumed = true;[\s\S]*showAdjacentChapter\(direction\);/);
  assert.doesNotMatch(readerWheel.slice(readerWheel.lastIndexOf('event.preventDefault()')), /releaseVerseChaseForFreeScroll\(\)/,
    'claimed chapter paging must not cancel destination positioning');
  assert.match(bible, /viewEl\.addEventListener\('wheel', onBibleReaderWheel, \{ passive: false \}\);/);
  assert.match(bible, /viewEl\.addEventListener\('touchstart', releaseVerseChaseForFreeScroll, \{ passive: true \}\);/);
});
