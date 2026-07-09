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
