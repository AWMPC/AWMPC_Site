const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const bible = fs.readFileSync(path.join(root, 'bible.html'), 'utf8');
const functionNames = [
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
  assert.match(activeVerse, /prev\.classList\.remove\('active'\)/);
  assert.match(activeVerse, /target\.classList\.add\('active'\)/);

  const pointerActivation = sourceBetween("  document.addEventListener('pointerup', function (e) {", "  document.addEventListener('pointercancel', function (e) {");
  assert.match(pointerActivation, /else setActiveVerse\(state\.verse\.getAttribute\('data-v'\), true\)/);

  const arrowNavigation = sourceBetween('  function showAdjacentVerse(direction) {', '  // ===================== BROWSER HISTORY =====================');
  assert.match(arrowNavigation, /setActiveVerse\(verse, false\)/);
  assert.match(arrowNavigation, /setActiveVerse\(verse, false\);[\s\S]*try \{ target\.focus\(\{ preventScroll: true \}\); \} catch \(e\) \{ target\.focus\(\); \}/);
  assert.match(arrowNavigation, /if \(key === 'ArrowUp'\) return showAdjacentVerse\(-1\);/);
  assert.match(arrowNavigation, /if \(key === 'ArrowDown'\) return showAdjacentVerse\(1\);/);
});

test('active verses use deferred double activation instead of long press', () => {
  assert.match(bible, /var pendingReaderVerseAction = null;/);
  assert.match(bible, /var READER_DOUBLE_ACTIVATE_MS = 280;/);
  assert.match(bible, /function scheduleReaderVerseFootnoteToggle\(verse, event\) \{/);
  assert.match(bible, /function clearPendingReaderVerseAction\(\) \{/);
  assert.match(bible, /function isMatchingReaderDoubleActivation\(event, verse\) \{/);
  assert.match(bible, /function isMatchingReaderMouseDoubleActivation\(event, verse\) \{/);
  assert.doesNotMatch(bible, /READER_LONG_PRESS_MS|readerLongPressTimer/);

  const leaveReading = sourceBetween('  function prepareToLeaveReadingView() {', '  function showAdjacentChapter(direction) {');
  assert.match(leaveReading, /clearPendingReaderVerseAction\(\);/);

  const pointerMove = sourceBetween("  document.addEventListener('pointermove', function (e) {", "  document.addEventListener('pointerup', function (e) {");
  assert.match(pointerMove, /Math\.sqrt\(\(dx \* dx\) \+ \(dy \* dy\)\) > 10[\s\S]*clearPendingReaderVerseAction\(\);/);

  const pointerCancel = sourceBetween("  document.addEventListener('pointercancel', function (e) {", "  document.addEventListener('click', function (e) {");
  assert.match(pointerCancel, /clearReaderPointerState\(\);[\s\S]*clearPendingReaderVerseAction\(\);/);
});

test('deferred verse actions only toggle a live matching active verse once', () => {
  const clearPending = sourceFunction('  function clearPendingReaderVerseAction() {');
  assert.match(clearPending, /window\.clearTimeout\(pendingReaderVerseAction\.timer\)/);
  assert.match(clearPending, /pendingReaderVerseAction = null;/);

  const scheduleToggle = sourceFunction('  function scheduleReaderVerseFootnoteToggle(verse, event) {');
  assert.match(scheduleToggle, /clearPendingReaderVerseAction\(\);[\s\S]*window\.setTimeout/);
  assert.match(scheduleToggle, /verse\.isConnected/);
  assert.match(scheduleToggle, /uiView === 'verses'/);
  assert.match(scheduleToggle, /verse\.classList\.contains\('active'\)/);
  assert.equal((scheduleToggle.match(/toggleAllVerseFootnotes\(verse\)/g) || []).length, 1);

  const matchingActivation = sourceFunction('  function isMatchingReaderDoubleActivation(event, verse) {');
  assert.match(matchingActivation, /pendingReaderVerseAction\.verse\s*===\s*verse/);
  assert.match(matchingActivation, /pendingReaderVerseAction\.pointerType\s*===\s*event\.pointerType/);
  assert.match(matchingActivation, /Math\.abs\(event\.clientX\s*-\s*pendingReaderVerseAction\.x\)\s*<=\s*28/);
  assert.match(matchingActivation, /Math\.abs\(event\.clientY\s*-\s*pendingReaderVerseAction\.y\)\s*<=\s*28/);

  const mouseMatchingActivation = sourceFunction('  function isMatchingReaderMouseDoubleActivation(event, verse) {');
  assert.match(mouseMatchingActivation, /pendingReaderVerseAction\.verse\s*===\s*verse/);
  assert.match(mouseMatchingActivation, /pendingReaderVerseAction\.pointerType\s*===\s*'mouse'/);
  assert.match(mouseMatchingActivation, /Math\.abs\(event\.clientX\s*-\s*pendingReaderVerseAction\.x\)\s*<=\s*28/);
  assert.match(mouseMatchingActivation, /Math\.abs\(event\.clientY\s*-\s*pendingReaderVerseAction\.y\)\s*<=\s*28/);
});

test('touch, pen, mouse, and keyboard verse activations avoid duplicate footnote toggles', () => {
  const pointerUp = sourceBetween("  document.addEventListener('pointerup', function (e) {", "  document.addEventListener('pointercancel', function (e) {");
  assert.match(pointerUp, /state\.pointerType === 'touch' \|\| state\.pointerType === 'pen'/);
  assert.match(pointerUp, /suppressFollowingReaderClick\(e, state\.verse\);/);
  assert.match(pointerUp, /isMatchingReaderDoubleActivation\(e, state\.verse\)[\s\S]*suppressFollowingReaderClick\(e, state\.verse\);[\s\S]*clearPendingReaderVerseAction\(\);[\s\S]*openVerseActions\(state\.verse\);/);
  assert.match(pointerUp, /else scheduleReaderVerseFootnoteToggle\(state\.verse, e\);/);
  assert.doesNotMatch(pointerUp, /toggleAllVerseFootnotes\(state\.verse\)/);
  assert.match(pointerUp, /else setActiveVerse\(state\.verse\.getAttribute\('data-v'\), true\)/);

  const mouseClick = sourceBetween("  document.addEventListener('click', function (e) {\n    if (uiView !== 'verses'", "  document.addEventListener('dblclick', function (e) {");
  assert.match(mouseClick, /e\.detail === 0[^;]*return/);
  assert.match(mouseClick, /e\.pointerType === 'touch' \|\| e\.pointerType === 'pen'/);
  assert.match(mouseClick, /else scheduleReaderVerseFootnoteToggle\(verseEl, e\);/);
  assert.doesNotMatch(mouseClick, /toggleAllVerseFootnotes\(verseEl\)/);
  assert.doesNotMatch(mouseClick, /openVerseActions\(verseEl\)/);
  assert.match(mouseClick, /else setActiveVerse\(verseEl\.getAttribute\('data-v'\), true\)/);

  const mouseDoubleClick = sourceBetween("  document.addEventListener('dblclick', function (e) {", "  document.addEventListener('contextmenu', function (e) {");
  assert.match(mouseDoubleClick, /e\.button !== 0/);
  assert.match(mouseDoubleClick, /verseEl\.classList\.contains\('active'\)/);
  assert.match(mouseDoubleClick, /isMatchingReaderMouseDoubleActivation\(e, verseEl\)[\s\S]*clearPendingReaderVerseAction\(\);[\s\S]*openVerseActions\(verseEl\);/);

  const contextMenu = sourceBetween("  document.addEventListener('contextmenu', function (e) {", "  viewEl.addEventListener('scroll', function () {");
  assert.match(contextMenu, /verseEl\.classList\.contains\('active'\)/);
  assert.match(contextMenu, /e\.preventDefault\(\);[\s\S]*openVerseActions\(verseEl\);/);
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
  const viewEl = { scrollTop: 0, scrollHeight: 1200, clientHeight: 400 };
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

  setVerseChaseTarget(target(300, 180, 220));
  assert.equal(verseChaseFrame, 0, 'first chase retains pending frame ID zero');
  releaseVerseChaseForFreeScroll();
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

  reduceMotion = true;
  viewEl.scrollTop = 10;
  setVerseChaseTarget(target(250, 180, 220));
  assert.equal(viewEl.scrollTop, 250, 'reduced motion moves immediately');
  assert.equal(frames.size, 0, 'reduced motion schedules no frame');

  reduceMotion = false;
  setVerseChaseTarget(target(500, 180, 220));
  assert.equal(frames.size, 1, 'a later target schedules one frame');
  releaseVerseChaseForFreeScroll();
  assert.equal(frames.size, 0, 'free scroll retains no scheduled work');
  assert.equal(verseChaseTarget, null, 'free scroll clears the target');
  assert.deepEqual(cancelled, [0, 3], 'free scroll cancels the scheduled frame');
`);

runContract(assert);
