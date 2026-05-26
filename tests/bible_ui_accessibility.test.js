const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const bible = fs.readFileSync(path.join(root, 'bible.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

assert.match(bible, /var APP_VERSION = '3\.0\.0';/);
assert.match(sw, /var CACHE_NAME = 'bible-v3\.0\.0';/);
assert.match(bible, /id="app-version"/);
assert.match(bible, /Version <span id="app-version">3\.0\.0<\/span>/);

assert.match(bible, /id="font-size-slider"/);
assert.match(bible, /var FONT_STEPS = \[16, 18, 20, 22, 24\];/);
assert.match(bible, /--reader-font-size/);
assert.match(bible, /bible_font_step/);
assert.match(bible, /class="font-slider-track"/);
assert.match(bible, /class="font-slider-ticks"/);
assert.match(bible, /<span style="left: 0%;">16<\/span>[\s\S]*<span style="left: 25%;">18<\/span>[\s\S]*<span style="left: 50%;">20<\/span>[\s\S]*<span style="left: 75%;">22<\/span>[\s\S]*<span style="left: 100%;">24<\/span>/);

assert.match(bible, /\.fab-panel\.open \{ display: flex; \}/);
assert.match(bible, /width: 100vw;/);
assert.match(bible, /height: 100dvh;/);
assert.match(bible, /\.fab-history-menu \{ flex: 1 1 auto; min-height: 0; overflow-y: auto; \}/);
assert.match(bible, /\.fab-root:has\(\.fab-panel\.open\) \.fab-main/);
assert.doesNotMatch(bible, /id="fab-close"/);
assert.doesNotMatch(bible, /fabClose\.addEventListener\('click'/);

assert.match(bible, /id="fn-verse"/);
assert.match(bible, /function showVersePickerView\(bookName, chapterNum\)/);
assert.match(bible, /view: 'verse-picker'/);
assert.match(bible, /fnVerse\.textContent = activeVerse \? activeVerse : '1';/);
assert.doesNotMatch(bible, /fnVerse\.textContent = activeVerse \? activeVerse : 'Verse';/);
assert.doesNotMatch(bible, /fnVerse\.textContent = activeVerse \? ':' \+ activeVerse : 'Verse';/);
assert.match(bible, /setActiveVerse\(keys\[0\], false\)/);
assert.match(bible, /scheduleActiveVerseCenter\(best\.getAttribute\('data-v'\)\)/);
assert.match(bible, /function materialEaseOut\(t\)/);
assert.match(bible, /function scrollVerseToCenter\(target\)/);
assert.match(bible, /Math\.min\(maxTop, Math\.max\(0, desiredTop\)\)/);
assert.match(bible, /\.verse-tail-spacer/);
assert.match(bible, /tailSpacer\.className = 'verse-tail-spacer';/);
assert.doesNotMatch(bible, /function isNearScrollBottom\(\)/);
assert.doesNotMatch(bible, /scrollIntoView\(\{ behavior: 'smooth', block: 'center' \}\)/);
assert.match(bible, /\.verse\.active/);
assert.match(bible, /ACTIVE_VERSE_SETTLE_MS = 1500/);

assert.match(bible, /--verse-num: #555;/);
assert.match(bible, /--verse-num: #b8b8b8;/);
