const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const bible = fs.readFileSync(path.join(root, 'templates', 'bible.html'), 'utf8');

function functionSource(name) {
  const match = bible.match(new RegExp('  function ' + name + '\\([^\\n]*\\) \\{[\\s\\S]*?\\n  \\}'));
  assert.ok(match, `${name} is present`);
  return match[0];
}

assert.match(bible,
  /id="refresh-bible-text"[^>]*aria-describedby="refresh-bible-text-status"[^>]*>Refresh Bible Text<\/button>/);
assert.match(bible,
  /id="refresh-bible-text-status"[^>]*role="status"[^>]*aria-live="polite"/);
assert.match(bible, /refreshBibleTextButton\.addEventListener\('click', refreshBibleText\)/);
assert.match(bible, /new URL\('bible\.json', window\.location\.href\)/);
assert.match(bible, /searchParams\.set\('refresh', String\(Date\.now\(\)\)\)/);
assert.match(bible, /cache: 'no-store', credentials: 'same-origin'/);

function refreshHarness(fetchImpl) {
  const button = {
    disabled: false,
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; }
  };
  const status = { textContent: '' };
  const announcements = [];
  let reloads = 0;
  const context = {
    Promise,
    URL,
    Date: { now() { return 12345; } },
    bibleTextRefreshInFlight: false,
    refreshBibleTextButton: button,
    refreshBibleTextStatus: status,
    announceStatus(message) { announcements.push(message); },
    window: {
      fetch: fetchImpl,
      location: {
        href: 'https://example.test/bible.html?book=Genesis&chapter=1&verse=1',
        reload() { reloads += 1; }
      }
    }
  };
  vm.runInNewContext([
    functionSource('isUsableBibleDataset'),
    functionSource('setBibleTextRefreshState'),
    functionSource('refreshBibleText'),
    'this.api = { refreshBibleText, isUsableBibleDataset };'
  ].join('\n'), context);
  return { api: context.api, button, status, announcements, reloads: () => reloads };
}

test('refresh validates a cache-busted same-origin dataset before reload', async () => {
  const calls = [];
  const harness = refreshHarness((url, options) => {
    calls.push({ url, options });
    return Promise.resolve({
      ok: true,
      json() { return Promise.resolve({ Genesis: { 1: { 1: 'In the beginning' } } }); }
    });
  });

  assert.equal(await harness.api.refreshBibleText(), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://example.test/bible.json?refresh=12345');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(harness.reloads(), 1);
  assert.equal(harness.button.disabled, true);
  assert.equal(harness.button.attributes['aria-busy'], 'true');
  assert.match(harness.status.textContent, /Reloading/);
});

test('failed or malformed refresh keeps current text and restores the control', async () => {
  for (const response of [
    { ok: false, json() { throw new Error('must not parse'); } },
    { ok: true, json() { return Promise.resolve({ Genesis: { 1: { 1: '' } } }); } }
  ]) {
    const harness = refreshHarness(() => Promise.resolve(response));
    assert.equal(await harness.api.refreshBibleText(), false);
    assert.equal(harness.reloads(), 0);
    assert.equal(harness.button.disabled, false);
    assert.equal(harness.button.attributes['aria-busy'], 'false');
    assert.match(harness.status.textContent, /current Bible text is still available/);
    assert.match(harness.announcements.at(-1), /current text was kept/);
  }
});

test('dataset validation rejects arrays and non-string verse payloads', () => {
  const harness = refreshHarness(() => Promise.reject(new Error('unused')));
  assert.equal(harness.api.isUsableBibleDataset([]), false);
  assert.equal(harness.api.isUsableBibleDataset({}), false);
  assert.equal(harness.api.isUsableBibleDataset({ Genesis: { 1: { 1: {} } } }), false);
  assert.equal(harness.api.isUsableBibleDataset({ Genesis: { 1: { 1: 'Text' } } }), true);
});
