const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const bible = fs.readFileSync(path.join(root, 'bible.html'), 'utf8');
const functionNames = [
  'smootherstep',
  'verseChaseDurationForDistance',
  'stopVerseChase',
  'setVerseChaseTarget',
  'stepVerseChase'
];
const productionFunctions = functionNames.map((name) => {
  const match = bible.match(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}`));
  assert.ok(match, `missing ${name}`);
  return match[0];
}).join('\n');

const runContract = Function('assert', `${productionFunctions}
  const curve = [];
  for (let index = 0; index <= 1000; index += 1) curve.push(smootherstep(index / 1000));
  assert.equal(curve[0], 0);
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
  const viewEl = { scrollTop: 0 };
  let uiView = 'verses';
  let reduceMotion = false;
  function shouldReduceVerseMotion() { return reduceMotion; }
  function desiredVerseScrollTop(target) { return target.top; }
  let verseChaseFrame = null;
  let verseChaseTarget = null;
  let verseChaseStartTop = 0;
  let verseChaseDestinationTop = 0;
  let verseChaseStartTime = null;
  let verseChaseDuration = 0;

  setVerseChaseTarget({ top: 400 });
  assert.equal(frames.size, 1, 'initial target schedules one frame');
  viewEl.scrollTop = 100;
  setVerseChaseTarget({ top: 600 });
  assert.deepEqual(cancelled, [0], 'retarget cancels frame ID zero');
  assert.equal(frames.size, 1, 'retarget retains one frame');
  assert.equal(verseChaseStartTop, 100, 'retarget starts at current scroll position');

  let frameId = [...frames.keys()][0];
  frames.get(frameId)(0);
  frames.delete(frameId);
  frameId = [...frames.keys()][0];
  frames.get(frameId)(verseChaseDuration);
  frames.delete(frameId);
  assert.equal(viewEl.scrollTop, 600, 'completion reaches the exact destination');
  assert.equal(verseChaseFrame, null, 'completion clears the frame');
  assert.equal(verseChaseTarget, null, 'completion clears the target');
  assert.equal(frames.size, 0, 'completion retains no scheduled work');

  reduceMotion = true;
  viewEl.scrollTop = 10;
  setVerseChaseTarget({ top: 250 });
  assert.equal(viewEl.scrollTop, 250, 'reduced motion moves immediately');
  assert.equal(frames.size, 0, 'reduced motion schedules no frame');

  reduceMotion = false;
  setVerseChaseTarget({ top: 500 });
  assert.equal(frames.size, 1, 'a later target schedules one frame');
  stopVerseChase();
  assert.equal(frames.size, 0, 'explicit cancellation retains no scheduled work');
  assert.equal(verseChaseTarget, null, 'explicit cancellation clears the target');
`);

runContract(assert);
