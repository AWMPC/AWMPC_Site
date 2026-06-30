# Bible Reader Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the existing Bible SPA's mobile layout, touch navigation, settled history, verse actions and links, seasonal themes, motion, loading, and resilience without changing its single-file application architecture.

**Architecture:** Keep UI, state, and reader behavior in `bible.html`, organized into focused internal sections that reuse existing navigation and rendering functions. Modify `sw.js` only to make query-parameter verse links work from the offline cache. Per the approved design, add no framework, build step, Node module, or new automated test harness; verify behavior directly in a browser.

**Tech Stack:** Static HTML/CSS, browser JavaScript compatible with the existing ES5-style code, DOM Pointer Events, Web Share and Clipboard APIs, Firebase compat SDK, Service Worker Cache API.

---

## File Map

- Modify `bible.html`: responsive CSS, seasonal tokens and settings, state persistence, history timing, gestures, verse presses, action dialog, deep links, copy/share, loading skeleton, and Firebase retry behavior.
- Modify `sw.js`: offline fallback for `bible.html` requests carrying verse query parameters.
- Do not create runtime files or change `bible.json`.
- Do not add or extend automated tests. Each task instead includes a focused browser acceptance checkpoint.

## Task 1: Responsive Layout, Motion, Ripple, Skeleton, and Dialog Shell

**Files:**
- Modify: `bible.html:13-883`
- Modify: `bible.html:885-930`

- [ ] **Step 1: Add responsive search and proportional verse-number CSS**

Replace the fixed verse-number rule and extend the search rules with these bounded styles:

```css
.verse-num {
  font-size: .7em;
  font-weight: 700;
  color: var(--verse-num);
  vertical-align: super;
  margin-right: .2em;
}

.search-bar,
.search-input,
.search-hist-item,
.search-hist-item .sh-query,
.search-result,
.search-ref,
.search-text {
  min-width: 0;
  max-width: 100%;
}
.search-bar { width: 100%; }
.search-input { width: 100%; }
.search-hist-item .sh-query,
.search-text {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.search-ref {
  white-space: normal;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .search-bar { display: grid; grid-template-columns: minmax(0, 1fr); }
  .search-input {
    font-size: min(var(--display-control-font-size), 20px);
    padding-left: min(var(--display-control-pad-x), 12px);
    padding-right: min(var(--display-control-pad-x), 12px);
  }
  .search-text { font-size: min(max(15px, calc(var(--display-control-font-size) - 2px)), 20px); }
  .search-hist-item .sh-query { font-size: min(var(--display-control-font-size), 20px); }
}
```

- [ ] **Step 2: Shorten motion and add press-feedback CSS**

Set `CHAPTER_CROSSFADE_MS` to `200` in the script, change the `.view-inner` chapter opacity durations to `200ms cubic-bezier(.2,.8,.2,1)`, change theme transitions to `200ms`, and add:

```css
.press-ripple-host { position: relative; overflow: hidden; isolation: isolate; }
.press-ripple {
  position: absolute;
  z-index: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  pointer-events: none;
  background: color-mix(in srgb, var(--accent) 24%, transparent);
  transform: translate(-50%, -50%) scale(0);
  animation: press-ripple 320ms cubic-bezier(.16,.84,.32,1) forwards;
}
@keyframes press-ripple {
  70% { opacity: .8; transform: translate(-50%, -50%) scale(var(--ripple-scale, 16)); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(var(--ripple-scale, 16)); }
}
@media (prefers-reduced-motion: reduce) {
  .press-ripple { animation: none; opacity: .14; transform: translate(-50%, -50%) scale(2); }
}
```

- [ ] **Step 3: Replace the text loader and add reusable status and dialog markup**

Replace `<p id="loading">Loading&hellip;</p>` and insert the dialog after `#view`:

```html
<div id="loading" class="loading-skeleton" role="status" aria-label="Loading Bible">
  <span></span><span></span><span></span><span></span>
</div>
<div id="status-live" class="sr-only" aria-live="polite" aria-atomic="true"></div>

<dialog id="verse-actions" class="verse-actions" aria-labelledby="verse-actions-title">
  <form method="dialog" class="verse-actions-sheet">
    <h2 id="verse-actions-title">Verse actions</h2>
    <button type="button" id="copy-verse">Copy Verse Text</button>
    <button type="button" id="share-verse">Share Link to Verse</button>
    <button type="submit" value="cancel">Cancel</button>
  </form>
</dialog>
```

Add the matching styles:

```css
.loading-skeleton { display:grid; gap:12px; padding:40px 20px; }
.loading-skeleton span {
  display:block; height:20px; border-radius:var(--radius-xs);
  background:linear-gradient(90deg,var(--bg4),var(--surface),var(--bg4));
  background-size:200% 100%; animation:skeleton-shimmer 1.2s ease-in-out infinite;
}
.loading-skeleton span:nth-child(2) { width:92%; }
.loading-skeleton span:nth-child(3) { width:84%; }
.loading-skeleton span:nth-child(4) { width:66%; }
@keyframes skeleton-shimmer { to { background-position:-200% 0; } }
.verse-actions { border:0; padding:0; background:transparent; color:var(--fg); }
.verse-actions::backdrop { background:rgba(0,0,0,.38); backdrop-filter:blur(3px); }
.verse-actions-sheet {
  min-width:min(360px,calc(100vw - 32px)); padding:var(--display-panel-padding);
  border:var(--card-border); border-radius:var(--radius-md); background:var(--surface);
  box-shadow:var(--menu-shadow); display:grid; gap:var(--display-panel-gap);
}
.verse-actions-sheet h2 { font-size:var(--display-control-font-size); }
.verse-actions-sheet button {
  min-height:var(--display-control-height); padding:var(--display-control-pad-y) var(--display-control-pad-x);
  border:var(--card-border); border-radius:var(--radius-xs); background:var(--card-bg);
  color:var(--fg); font:inherit; text-align:left;
}
@media(max-width:640px) {
  .verse-actions { margin:auto 0 0; width:100%; max-width:none; }
  .verse-actions-sheet { width:100%; border-radius:var(--radius-md) var(--radius-md) 0 0; }
}
@media(prefers-reduced-motion:reduce) { .loading-skeleton span { animation:none; } }
```

- [ ] **Step 4: Run the first browser checkpoint**

Run:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/bible.html`, set the viewport to 320, 375, 430, and 768 CSS pixels, and check Small, Medium, and Large modes. Expected: no horizontal scrollbar in Search, long snippets wrap, verse numbers scale with text, the skeleton appears before data, and reduced-motion mode removes shimmer and ripple expansion.

- [ ] **Step 5: Commit the layout shell**

```bash
git add bible.html
git commit -S -m "fix: fit Bible reader on mobile"
```

## Task 2: Seasonal Theme State, Palettes, and Controls

**Files:**
- Modify: `bible.html:14-145`
- Modify: `bible.html:904-922`
- Modify: `bible.html:970-1090`
- Modify: `bible.html:1314-1370`

- [ ] **Step 1: Add the independent Season control**

Keep the existing appearance buttons but rename the title and Auto label, then insert the season card immediately after it:

```html
<div class="fab-card theme-mode-wrap">
  <div class="fab-card-title">Appearance</div>
  <div class="theme-mode-control" role="group" aria-label="Appearance">
    <button class="theme-mode-button" type="button" data-theme-mode="light" aria-pressed="true">Light</button>
    <button class="theme-mode-button" type="button" data-theme-mode="dark" aria-pressed="false">Dark</button>
    <button class="theme-mode-button" type="button" data-theme-mode="auto" aria-pressed="false">System</button>
  </div>
</div>
<div class="fab-card theme-mode-wrap">
  <div class="fab-card-title">Season</div>
  <div class="season-control" role="group" aria-label="Seasonal color scheme">
    <button class="theme-mode-button" type="button" data-season="auto" aria-pressed="true">Auto</button>
    <button class="theme-mode-button" type="button" data-season="spring" aria-pressed="false">Spring</button>
    <button class="theme-mode-button" type="button" data-season="summer" aria-pressed="false">Summer</button>
    <button class="theme-mode-button" type="button" data-season="fall" aria-pressed="false">Fall</button>
    <button class="theme-mode-button" type="button" data-season="winter" aria-pressed="false">Winter</button>
  </div>
</div>
```

Use a wrapping grid so five buttons remain bounded:

```css
.season-control {
  display:grid; grid-template-columns:repeat(3,minmax(0,1fr));
  gap:max(4px,calc(var(--display-panel-gap) / 2));
  padding:max(4px,calc(var(--display-panel-padding) / 3));
  border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--bg4);
}
```

- [ ] **Step 2: Add explicit seasonal light and dark token sets**

Keep the existing semantic variable names. Make Winter the ice-blue evolution of the current palette and add selectors for the other seasons:

```css
html[data-season="spring"] { --bg:#f3faef;--bg2:#fbfff9;--bg3:#f7fcf3;--bg4:#e6f3df;--surface:#fbfff9;--surface-hi:#e6f3df;--fg:#18301b;--fg2:#345438;--fg3:#536f56;--fg4:#687f69;--verse-num:#236c29;--accent:#2f7d32;--accent-fg:#fff;--accent-glow:rgba(47,125,50,.25);--note-bg:rgba(47,125,50,.1);--note-border:#2f7d32;--pill-bg:rgba(47,125,50,.1); }
html[data-season="spring"].dark { --bg:#101b12;--bg2:#162419;--bg3:#132016;--bg4:#203323;--surface:#162419;--surface-hi:#203323;--fg:#ecf7e8;--fg2:#c8dec2;--fg3:#a9c4a4;--fg4:#91aa8e;--verse-num:#95dc88;--accent:#78c96e;--accent-fg:#10210f;--accent-glow:rgba(120,201,110,.3);--note-bg:rgba(120,201,110,.13);--note-border:#78c96e;--pill-bg:rgba(120,201,110,.12); }
html[data-season="summer"] { --bg:#fff9df;--bg2:#fffdf2;--bg3:#fffbea;--bg4:#f7edc7;--surface:#fffdf2;--surface-hi:#f7edc7;--fg:#352c14;--fg2:#5e512d;--fg3:#796b43;--fg4:#8a7b55;--verse-num:#84600e;--accent:#9a6c10;--accent-fg:#fff;--accent-glow:rgba(154,108,16,.24);--note-bg:rgba(154,108,16,.1);--note-border:#9a6c10;--pill-bg:rgba(154,108,16,.1); }
html[data-season="summer"].dark { --bg:#211c0f;--bg2:#2a2413;--bg3:#251f11;--bg4:#3a3118;--surface:#2a2413;--surface-hi:#3a3118;--fg:#fff5ce;--fg2:#e8dcae;--fg3:#cdbf8e;--fg4:#b4a67c;--verse-num:#f0cf6a;--accent:#e2bd55;--accent-fg:#2c2208;--accent-glow:rgba(226,189,85,.3);--note-bg:rgba(226,189,85,.13);--note-border:#e2bd55;--pill-bg:rgba(226,189,85,.12); }
html[data-season="fall"] { --bg:#fff3e8;--bg2:#fffaf6;--bg3:#fff6ef;--bg4:#f7dfce;--surface:#fffaf6;--surface-hi:#f7dfce;--fg:#3c2116;--fg2:#674233;--fg3:#815e4d;--fg4:#93715f;--verse-num:#a34116;--accent:#b94d19;--accent-fg:#fff;--accent-glow:rgba(185,77,25,.25);--note-bg:rgba(185,77,25,.1);--note-border:#b94d19;--pill-bg:rgba(185,77,25,.1); }
html[data-season="fall"].dark { --bg:#24140e;--bg2:#301b13;--bg3:#291710;--bg4:#42251a;--surface:#301b13;--surface-hi:#42251a;--fg:#ffe9d8;--fg2:#edcbb4;--fg3:#d1ad95;--fg4:#b99580;--verse-num:#ff9a61;--accent:#ee7b3c;--accent-fg:#2f1004;--accent-glow:rgba(238,123,60,.31);--note-bg:rgba(238,123,60,.14);--note-border:#ee7b3c;--pill-bg:rgba(238,123,60,.13); }
html[data-season="winter"] { --bg:#eef7ff;--bg2:#fbfdff;--bg3:#f4faff;--bg4:#dfeef9;--surface:#fbfdff;--surface-hi:#dfeef9;--fg:#142b3e;--fg2:#38566d;--fg3:#587287;--fg4:#70889a;--verse-num:#0d669a;--accent:#146fa3;--accent-fg:#fff;--accent-glow:rgba(20,111,163,.24);--note-bg:rgba(20,111,163,.1);--note-border:#146fa3;--pill-bg:rgba(20,111,163,.1); }
html[data-season="winter"].dark { --bg:#0c1722;--bg2:#122130;--bg3:#0f1c29;--bg4:#1b3042;--surface:#122130;--surface-hi:#1b3042;--fg:#e9f6ff;--fg2:#c5ddeb;--fg3:#a5c2d3;--fg4:#8ba9bb;--verse-num:#8bd1f8;--accent:#69b9e8;--accent-fg:#082033;--accent-glow:rgba(105,185,232,.32);--note-bg:rgba(105,185,232,.13);--note-border:#69b9e8;--pill-bg:rgba(105,185,232,.12); }
```

- [ ] **Step 3: Extend State and cloud payload for the season preference**

Add these methods to `State` and include `season: State.getSeason()` in `_scheduleSync()`:

```javascript
getSeason: function () {
  var season = this._get('bible_season', 'auto');
  return /^(auto|spring|summer|fall|winter)$/.test(season) ? season : 'auto';
},
setSeason: function (season) {
  this._set('bible_season', /^(spring|summer|fall|winter)$/.test(season) ? season : 'auto');
},
```

In `applyCloudData`, accept the same allowlist before storing `bible_season`.

- [ ] **Step 4: Resolve Auto locally and update browser chrome**

Add and wire these functions beside `applyThemeMode`:

```javascript
var seasonButtons = Array.prototype.slice.call(document.querySelectorAll('[data-season]'));

function automaticSeason(date) {
  var monthDay = ((date.getMonth() + 1) * 100) + date.getDate();
  if (monthDay >= 320 && monthDay < 621) return 'spring';
  if (monthDay >= 621 && monthDay < 922) return 'summer';
  if (monthDay >= 922 && monthDay < 1221) return 'fall';
  return 'winter';
}

function resolvedSeason(choice) {
  return choice === 'auto' ? automaticSeason(new Date()) : choice;
}

function applySeason(choice) {
  choice = /^(spring|summer|fall|winter)$/.test(choice) ? choice : 'auto';
  var resolved = resolvedSeason(choice);
  document.documentElement.setAttribute('data-season', resolved);
  seasonButtons.forEach(function (button) {
    var selected = button.getAttribute('data-season') === choice;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  var themeColor = { spring:'#2f7d32',summer:'#9a6c10',fall:'#b94d19',winter:'#146fa3' }[resolved];
  document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
  State.setSeason(choice);
}

applySeason(State.getSeason());
seasonButtons.forEach(function (button) {
  button.addEventListener('click', function (event) {
    event.stopPropagation();
    beginThemeTransition();
    applySeason(button.getAttribute('data-season'));
  });
});
```

Reapply Auto after `visibilitychange` when the document becomes visible, so an app left open across a boundary date updates without reload.

- [ ] **Step 5: Verify palettes and commit**

In the browser, inspect every Season × Appearance combination, including reduced motion and the 320 px settings panel. Use the browser's accessibility color inspector on normal text, verse numbers, active buttons, focus rings, footnotes, and errors. Expected: normal text is at least 4.5:1; essential UI and large text are at least 3:1; Auto resolves to Summer on June 30; the five season buttons do not overflow.

```bash
git add bible.html
git commit -S -m "feat: add seasonal Bible themes"
```

## Task 3: Local Chapter Positions and Seven-Second History

**Files:**
- Modify: `bible.html:993-1062`
- Modify: `bible.html:1141-1160`
- Modify: `bible.html:1737-1772`
- Modify: `bible.html:2018-2024`
- Modify: `bible.html:2240-2338`

- [ ] **Step 1: Change history uniqueness from verse to chapter**

In `State.pushHistory`, filter by `book|chapter`, not `book|chapter|verse`:

```javascript
pushHistory: function (book, ch, verse) {
  var normalized = this.normalizeHistoryEntry({
    book: book, ch: ch, verse: verse || '1', selectedAt: new Date().toISOString()
  });
  if (!normalized) return;
  var chapterKey = normalized.book + '|' + normalized.ch;
  var list = this.getHistory().filter(function (entry) {
    return entry.book + '|' + entry.ch !== chapterKey;
  });
  list.unshift(normalized);
  this._set('bible_history', list.slice(0, 30));
},
```

- [ ] **Step 2: Add bounded local chapter-position storage**

Add state accessors:

```javascript
getChapterPositions: function () { return this._get('bible_chapter_positions', []); },
setChapterPositions: function (positions) {
  try { localStorage.setItem('bible_chapter_positions', JSON.stringify(positions.slice(0, 200))); }
  catch (e) {}
},
```

Do not call `_set` here because position memory must not trigger Firebase sync.

- [ ] **Step 3: Add the in-memory position map and flush lifecycle**

Add beside other reader globals:

```javascript
var chapterPositions = State.getChapterPositions();
var chapterPositionTimer = null;
var historySettleTimer = null;
var HISTORY_SETTLE_MS = 7000;

function chapterPositionKey(book, chapter) { return book + '|' + String(chapter); }
function rememberChapterPosition(book, chapter, verse) {
  if (!book || !chapter || !verse) return;
  var key = chapterPositionKey(book, chapter);
  chapterPositions = chapterPositions.filter(function (item) { return item.key !== key; });
  chapterPositions.unshift({ key:key, book:book, chapter:String(chapter), verse:String(verse) });
  chapterPositions = chapterPositions.slice(0, 200);
  clearTimeout(chapterPositionTimer);
  chapterPositionTimer = setTimeout(flushChapterPositions, 500);
}
function flushChapterPositions() {
  clearTimeout(chapterPositionTimer);
  chapterPositionTimer = null;
  State.setChapterPositions(chapterPositions);
}
function recalledChapterVerse(book, chapter) {
  var key = chapterPositionKey(book, chapter);
  var item = chapterPositions.find(function (candidate) { return candidate.key === key; });
  var verses = bibleData && bibleData[book] && bibleData[book][String(chapter)];
  return item && verses && Object.prototype.hasOwnProperty.call(verses, item.verse) ? item.verse : null;
}
window.addEventListener('pagehide', flushChapterPositions);
```

- [ ] **Step 4: Replace immediate history writes with settled commits**

Remove `State.pushHistory(...)` from `showVersesView` and add:

```javascript
function cancelSettledHistory() {
  clearTimeout(historySettleTimer);
  historySettleTimer = null;
}
function scheduleSettledHistory(book, chapter) {
  cancelSettledHistory();
  historySettleTimer = setTimeout(function () {
    historySettleTimer = null;
    if (uiView !== 'verses' || currentBook !== book || String(currentChapter) !== String(chapter)) return;
    State.pushHistory(book, chapter, activeVerse || '1');
  }, HISTORY_SETTLE_MS);
}
```

Call `scheduleSettledHistory(bookName, chapterNum)` after the chapter DOM is built. Call `cancelSettledHistory()` before every non-reading render. In `setActiveVerse`, call `rememberChapterPosition(currentBook, currentChapter, activeVerse)` and `scheduleSettledHistory(currentBook, currentChapter)`. Each new active verse restarts the same seven-second timer, so the initial entry and later refreshes use one path.

- [ ] **Step 5: Make adjacent navigation restore remembered verses only**

Replace `showAdjacentChapter` with:

```javascript
function showAdjacentChapter(direction) {
  if (!bibleData || navBook == null || navChapter == null) return false;
  rememberChapterPosition(navBook, navChapter, activeVerse || '1');
  flushChapterPositions();
  var next = direction < 0 ? prevChapterNav(navBook, navChapter) : nextChapterNav(navBook, navChapter);
  if (!next) return false;
  showVersesViewWithTransition(next.book, next.chapter, recalledChapterVerse(next.book, next.chapter) || '1');
  return true;
}
```

Change the Previous and Next button handlers to call `showAdjacentChapter(-1)` and `showAdjacentChapter(1)`. Leave search, history, picker, and deep-link callers on their explicit verse paths.

- [ ] **Step 6: Verify timing and restore behavior, then commit**

In the browser, navigate to chapter 5 verse 20, press Next three times in under seven seconds, and remain on the final chapter. Expected: skipped chapters never appear in History; the final chapter appears after seven seconds with its active verse. Return with Previous until chapter 5; expected: verse 20 is centered. Enter chapter 5 through the chapter picker; expected: verse 1. Reload and repeat adjacent navigation; expected: local recall survives. Inspect Firebase writes; expected: `bible_chapter_positions` is absent.

```bash
git add bible.html
git commit -S -m "feat: settle Bible reading history"
```

## Task 4: Swipe Navigation, Short Verse Presses, Footnote Toggle, and Ripples

**Files:**
- Modify: `bible.html:1976-2004`
- Modify: `bible.html:2240-2338`
- Modify: `bible.html:2619-2645`

- [ ] **Step 1: Extract one all-footnotes toggle function**

Replace duplicate keyboard logic with:

```javascript
function toggleAllVerseFootnotes(verseEl) {
  var buttons = verseEl.querySelectorAll('.footnote-toggle');
  var bodies = verseEl.querySelectorAll('.footnote-body');
  if (!bodies.length) return false;
  var shouldOpen = Array.prototype.some.call(bodies, function (body) {
    return !body.classList.contains('visible');
  });
  Array.prototype.forEach.call(bodies, function (body) { body.classList.toggle('visible', shouldOpen); });
  Array.prototype.forEach.call(buttons, function (button) {
    button.classList.toggle('open', shouldOpen);
    button.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  });
  verseEl.classList.toggle('footnotes-open', shouldOpen);
  return true;
}
```

Set each generated footnote button's `aria-expanded` to `false` and update its existing individual click handler to maintain that value.

- [ ] **Step 2: Add delegated ripple creation**

Add one document-level pointerdown handler:

```javascript
function addPressRipple(event) {
  if (event.button != null && event.button !== 0) return;
  var host = event.target.closest('button,.dd-item,.book-btn,.chapter-btn,.search-result,.search-hist-item,.verse');
  if (!host || host.disabled) return;
  host.classList.add('press-ripple-host');
  var rect = host.getBoundingClientRect();
  var ripple = document.createElement('span');
  ripple.className = 'press-ripple';
  ripple.setAttribute('aria-hidden', 'true');
  ripple.style.left = (event.clientX - rect.left) + 'px';
  ripple.style.top = (event.clientY - rect.top) + 'px';
  ripple.style.setProperty('--ripple-scale', String(Math.ceil(Math.max(rect.width, rect.height) / 6) + 2));
  host.appendChild(ripple);
  setTimeout(function () { ripple.remove(); }, 340);
}
document.addEventListener('pointerdown', addPressRipple, { passive:true });
```

- [ ] **Step 3: Add one pointer state machine for verse press and swipe**

Add these globals and handlers:

```javascript
var readerPointer = null;
var suppressReaderClick = false;

function clearReaderPointer() {
  readerPointer = null;
}
function onReaderPointerDown(event) {
  if (uiView !== 'verses' || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) return;
  if (event.target.closest('button,dialog')) return;
  var verse = event.target.closest('.verse');
  readerPointer = { id:event.pointerId, x:event.clientX, y:event.clientY, verse:verse, moved:false };
}
function onReaderPointerMove(event) {
  if (!readerPointer || readerPointer.id !== event.pointerId) return;
  var dx = event.clientX - readerPointer.x;
  var dy = event.clientY - readerPointer.y;
  if (Math.hypot(dx, dy) > 10) readerPointer.moved = true;
}
function onReaderPointerUp(event) {
  if (!readerPointer || readerPointer.id !== event.pointerId) return;
  var state = readerPointer;
  var dx = event.clientX - state.x;
  var dy = event.clientY - state.y;
  clearReaderPointer();
  if (Math.abs(dx) >= 72 && Math.abs(dx) >= Math.abs(dy) * 1.25 && !window.getSelection().toString()) {
    suppressReaderClick = true;
    showAdjacentChapter(dx < 0 ? 1 : -1);
    return;
  }
  if (state.moved || !state.verse || suppressReaderClick) return;
  suppressReaderClick = true;
  var verseNumber = state.verse.getAttribute('data-v');
  if (!state.verse.classList.contains('active')) setActiveVerse(verseNumber, true);
  else toggleAllVerseFootnotes(state.verse);
}
viewEl.addEventListener('pointerdown', onReaderPointerDown, { passive:true });
viewEl.addEventListener('pointermove', onReaderPointerMove, { passive:true });
viewEl.addEventListener('pointerup', onReaderPointerUp, { passive:true });
viewEl.addEventListener('pointercancel', clearReaderPointer, { passive:true });
viewEl.addEventListener('click', function (event) {
  if (!suppressReaderClick) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  suppressReaderClick = false;
}, true);
```

Call `clearReaderPointer()` during every view transition. The capture-phase click handler consumes the synthetic click after a successful swipe and then resets `suppressReaderClick`.

- [ ] **Step 4: Add mouse short-press and keyboard footnote parity**

Add a delegated `click` handler for mouse-created verse clicks and update `handleReadingEnterKey()`:

```javascript
viewEl.addEventListener('click', function (event) {
  if (uiView !== 'verses' || event.detail === 0 || suppressReaderClick) return;
  if (event.target.closest('button')) return;
  var verseEl = event.target.closest('.verse');
  if (!verseEl) return;
  if (!verseEl.classList.contains('active')) setActiveVerse(verseEl.getAttribute('data-v'), true);
  else toggleAllVerseFootnotes(verseEl);
});
function handleReadingEnterKey() {
  var active = viewInner.querySelector('.verse.active');
  return active ? toggleAllVerseFootnotes(active) : false;
}
```

- [ ] **Step 5: Verify gestures, presses, cleanup, and commit**

On a touch-capable mobile viewport, verify vertical scroll never changes chapters; short horizontal movement does nothing; 72 px left/right swipes match arrow navigation; swipes beginning on footnote buttons do nothing; inactive short press centers; active short press toggles every footnote. Repeat 50 chapter changes and confirm the DOM contains no `.press-ripple` elements after animations and exactly one dormant `#verse-actions` dialog.

```bash
git add bible.html
git commit -S -m "feat: add Bible touch interactions"
```

## Task 5: Rendered Verse Copy, Native Share, and Validated Deep Links

**Files:**
- Modify: `bible.html:1123-1160`
- Modify: `bible.html:2062-2089`
- Modify: `bible.html:2240-2338`
- Modify: `bible.html:2662-2687`
- Modify: `sw.js:35-86`

- [ ] **Step 1: Give each verse a stable safe identifier and readable paragraph class**

When rendering a verse, add:

```javascript
div.id = 'verse-' + encodeURIComponent(bookName) + '-' + String(chapterNum) + '-' + keys[i];
div.setAttribute('tabindex', '-1');
div.setAttribute('aria-label', bookName + ' ' + chapterNum + ':' + keys[i]);
p.className = 'verse-reading-text';
```

Continue using `data-v` for internal queries; never interpolate URL input directly into a selector.

- [ ] **Step 2: Add validated reference parsing and canonical URL creation**

Add:

```javascript
function requestedVerseReference() {
  var params = new URLSearchParams(window.location.search);
  var book = (params.get('book') || '').slice(0, 80);
  var chapter = (params.get('chapter') || '').slice(0, 4);
  var verse = (params.get('verse') || '').slice(0, 4);
  if (!/^\d{1,3}$/.test(chapter) || !/^\d{1,3}$/.test(verse)) return null;
  if (!bibleData[book] || !bibleData[book][chapter]) return null;
  if (!Object.prototype.hasOwnProperty.call(bibleData[book][chapter], verse)) return null;
  return { book:book, chapter:parseInt(chapter,10), verse:verse };
}
function canonicalVerseUrl(book, chapter, verse) {
  var url = new URL('bible.html', window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('book', book);
  url.searchParams.set('chapter', String(chapter));
  url.searchParams.set('verse', String(verse));
  return url.href;
}
```

- [ ] **Step 3: Extract only rendered reading text**

Add:

```javascript
function renderedVerseText(verseEl) {
  var paragraph = verseEl && verseEl.querySelector('.verse-reading-text');
  if (!paragraph) return '';
  var clone = paragraph.cloneNode(true);
  Array.prototype.forEach.call(clone.querySelectorAll('.verse-num,.footnote-toggle'), function (node) { node.remove(); });
  return clone.textContent.replace(/\s+/g, ' ').trim();
}
function verseActionPayload(verseEl) {
  var verse = verseEl.getAttribute('data-v');
  var reference = currentBook + ' ' + currentChapter + ':' + verse;
  var text = renderedVerseText(verseEl);
  return { reference:reference, text:text, copy:reference + ' — ' + text,
    url:canonicalVerseUrl(currentBook,currentChapter,verse) };
}
```

This deliberately copies the final rendered paragraph but excludes the verse-number span, footnote buttons, and separate footnote bodies.

- [ ] **Step 4: Wire the modal dialog, clipboard, and native share**

Add:

```javascript
var verseActions = document.getElementById('verse-actions');
var verseActionTarget = null;
var statusLive = document.getElementById('status-live');
function announceStatus(message) { statusLive.textContent = ''; setTimeout(function () { statusLive.textContent = message; }, 0); }
function writeClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  return new Promise(function (resolve, reject) {
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); }
    catch (error) { reject(error); }
    field.remove();
  });
}
function openVerseActions(verseEl) {
  if (!verseEl || !verseEl.classList.contains('active')) return;
  verseActionTarget = verseEl;
  document.getElementById('verse-actions-title').textContent = verseEl.getAttribute('aria-label') + ' actions';
  verseActions.showModal();
}
verseActions.addEventListener('close', function () {
  var target = verseActionTarget;
  verseActionTarget = null;
  if (target && target.isConnected) target.focus({ preventScroll:true });
});
document.getElementById('copy-verse').addEventListener('click', function () {
  var payload = verseActionPayload(verseActionTarget);
  writeClipboard(payload.copy).then(function () {
    verseActions.close(); announceStatus('Verse copied.');
  }).catch(function () { announceStatus('Unable to copy verse.'); });
});
document.getElementById('share-verse').addEventListener('click', function () {
  var payload = verseActionPayload(verseActionTarget);
  var share = navigator.share ? navigator.share({ title:payload.reference, text:payload.copy, url:payload.url })
    : writeClipboard(payload.url);
  share.then(function () {
    verseActions.close(); announceStatus(navigator.share ? 'Verse shared.' : 'Verse link copied.');
  }).catch(function (error) {
    if (error && error.name === 'AbortError') { verseActions.close(); return; }
    announceStatus('Unable to share verse.');
  });
});
```

Add backdrop-click handling that closes only when the dialog itself, not its sheet, is the event target. Close the dialog before every chapter/view transition.

- [ ] **Step 5: Add active-verse long press and desktop context-menu parity**

Extend the Task 4 pointer state with one timer and replace `clearReaderPointer`, `onReaderPointerDown`, and the movement cancellation branch as follows:

```javascript
var longPressTimer = null;
function clearReaderPointer() {
  clearTimeout(longPressTimer);
  longPressTimer = null;
  readerPointer = null;
}
function onReaderPointerDown(event) {
  if (uiView !== 'verses' || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) return;
  if (event.target.closest('button,dialog')) return;
  var verse = event.target.closest('.verse');
  readerPointer = { id:event.pointerId, x:event.clientX, y:event.clientY, verse:verse, moved:false };
  if (verse && verse.classList.contains('active')) {
    longPressTimer = setTimeout(function () {
      suppressReaderClick = true;
      openVerseActions(verse);
      clearReaderPointer();
    }, 500);
  }
}
function onReaderPointerMove(event) {
  if (!readerPointer || readerPointer.id !== event.pointerId) return;
  var dx = event.clientX - readerPointer.x;
  var dy = event.clientY - readerPointer.y;
  if (Math.hypot(dx, dy) > 10) {
    readerPointer.moved = true;
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}
viewEl.addEventListener('contextmenu', function (event) {
  var verse = event.target.closest('.verse.active');
  if (!verse || uiView !== 'verses') return;
  event.preventDefault();
  openVerseActions(verse);
});
verseActions.addEventListener('click', function (event) {
  if (event.target === verseActions) verseActions.close();
});
```

Call `clearReaderPointer()` and `verseActions.close()` when leaving the reading view if the dialog is open. A long press on an inactive verse continues through the short-press path and only activates/centers it; it never opens the menu.

- [ ] **Step 6: Open validated deep links after data loads**

In the successful Bible-data load path, replace unconditional `showBooksView()` with:

```javascript
var requested = requestedVerseReference();
if (requested) {
  history.replaceState({ view:'verses', book:requested.book, chapter:requested.chapter, verse:requested.verse }, '');
  showVersesView(requested.book, requested.chapter, requested.verse);
} else {
  history.replaceState({ view:'books' }, '', 'bible.html');
  showBooksView();
  if (window.location.search) announceStatus('The requested verse link is not valid.');
}
```

- [ ] **Step 7: Make query links work from the offline service-worker cache**

Before the general fetch handler in `sw.js`, add:

```javascript
if (e.request.mode === 'navigate' && url.pathname.endsWith('bible.html')) {
  e.respondWith(
    fetch(e.request).catch(function () {
      return caches.open(CACHE_NAME).then(function (cache) {
        return cache.match('bible.html', { ignoreSearch:true }).then(function (cached) {
          return cached || Response.error();
        });
      });
    })
  );
  return;
}
```

- [ ] **Step 8: Verify long press, Matthew 17:21, invalid input, offline links, and commit**

Open `http://localhost:8000/bible.html?book=Matthew&chapter=17&verse=21`. Expected: Matthew 17:21 is standalone, centered, active, and arrival-highlighted. A 500 ms active long press and desktop right-click open the same modal without toggling footnotes; an inactive long press only activates and centers. Copy must equal `Matthew 17:21 — But this kind does not go out except by prayer and fasting.` Share must use the same text and canonical URL. Test an encoded book with a space, then malformed, oversized, nonexistent, and HTML-like parameters; expected: no script/markup execution and a safe starting view. Install the service worker, switch offline, and reload the Matthew link; expected: the cached app opens and resolves the verse from cached data.

```bash
git add bible.html sw.js
git commit -S -m "feat: share linked Bible verses"
```

## Task 6: Graceful Data Retry and Firebase Sync Backoff

**Files:**
- Modify: `bible.html:958-993`
- Modify: `bible.html:1123-1128`
- Modify: `bible.html:2659-2687`

- [ ] **Step 1: Replace one-shot Bible loading with an explicit retry action**

Build the error UI with DOM methods and reuse one loader function:

```javascript
function showLoadError(message) {
  loadingEl.style.display = 'none';
  errorEl.textContent = '';
  errorEl.style.display = 'block';
  var text = document.createElement('p');
  text.textContent = message;
  var retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Retry';
  retry.addEventListener('click', loadBibleData, { once:true });
  errorEl.appendChild(text);
  errorEl.appendChild(retry);
}
function loadBibleData() {
  errorEl.style.display = 'none';
  loadingEl.style.display = 'grid';
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'bible.json', true);
  xhr.responseType = 'json';
  xhr.onload = function () {
    if (xhr.status !== 200 || !xhr.response) {
      showLoadError('Failed to load the Bible.');
      return;
    }
    loadingEl.style.display = 'none';
    bibleData = xhr.response;
    initNavAnchor();
    openInitialViewFromUrl();
  };
  xhr.onerror = function () { showLoadError('Network error loading the Bible.'); };
  xhr.send();
}
loadBibleData();
```

Move the deep-link success logic from Task 5 into `openInitialViewFromUrl()` so retry success follows the same path exactly once.

- [ ] **Step 2: Add bounded, jittered Firebase synchronization retry**

Replace the current single-attempt `_scheduleSync` internals with one in-flight write and these retry controls:

```javascript
var _syncRetryTimer = null;
var _syncRetryAttempt = 0;
var _syncInFlight = false;
var _syncPending = false;
var SYNC_DELAYS = [1000, 2000, 4000, 8000, 16000];

function _isPermanentSyncError(error) {
  return error && /^(permission-denied|unauthenticated|invalid-argument)$/.test(error.code || '');
}
function _retryDelay(attempt) {
  var base = SYNC_DELAYS[Math.min(attempt, SYNC_DELAYS.length - 1)];
  return Math.round(base * (.8 + Math.random() * .4));
}
function _runSync() {
  if (_syncInFlight || !_currentUid || !navigator.onLine) { _syncPending = true; return; }
  var doc = _userDoc();
  if (!doc) return;
  _syncInFlight = true;
  _syncPending = false;
  _setSyncStatus('Syncing…');
  doc.set({
    themeMode:State.getThemeMode(), season:State.getSeason(), font:State.getDisplayStep(),
    history:State.getHistory(), searchHistory:State.getSearchHistory(),
    updatedAt:firebase.firestore.FieldValue.serverTimestamp()
  }, { merge:true }).then(function () {
    _syncInFlight = false; _syncRetryAttempt = 0; _setSyncStatus('Synced ✓');
    if (_syncPending) _scheduleSync();
  }).catch(function (error) {
    _syncInFlight = false;
    if (_isPermanentSyncError(error)) { _setSyncStatus('Sync unavailable'); return; }
    if (_syncRetryAttempt >= SYNC_DELAYS.length) { _setSyncStatus('Offline — will sync later'); return; }
    var delay = _retryDelay(_syncRetryAttempt++);
    clearTimeout(_syncRetryTimer);
    _syncRetryTimer = setTimeout(_runSync, delay);
  });
}
function _scheduleSync() {
  if (!_currentUid) return;
  _syncPending = true;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(_runSync, 1500);
}
window.addEventListener('online', function () {
  _syncRetryAttempt = 0;
  if (_syncPending || _currentUid) _scheduleSync();
});
```

On sign-out, clear `_syncTimer` and `_syncRetryTimer`, reset attempt/in-flight/pending state, and never retry with the prior UID.

- [ ] **Step 3: Verify failure behavior and commit**

Use browser network controls to fail `bible.json`; expected: skeleton becomes a readable error and Retry makes one new request. Toggle offline during a signed-in preference change; expected: local UI updates immediately, status remains non-blocking, at most one Firestore write is in flight, retry delays grow, and the online event resumes synchronization. Sign out while a retry is pending; expected: the pending retry is cancelled and no write uses the prior account.

```bash
git add bible.html
git commit -S -m "fix: retry Bible data gracefully"
```

## Task 7: Full Browser Acceptance and Release Check

**Files:**
- Verify: `bible.html`
- Verify: `sw.js`
- Reference: `docs/superpowers/specs/2026-06-30-bible-reader-improvements-design.md`

- [ ] **Step 1: Run a syntax and accidental-secret review without invoking the Node test suite**

Run:

```bash
git diff --check
rg -n "innerHTML|bible_chapter_positions.*themeMode|book=.*email|customer|company" bible.html sw.js
```

Expected: `git diff --check` is silent. Any `innerHTML` match must be pre-existing and unrelated; new rendering uses DOM methods or `textContent`. No chapter positions appear in the Firebase payload and no non-public identifiers were introduced.

- [ ] **Step 2: Complete the responsive and accessibility matrix**

At 320, 375, 430, and 768 CSS-pixel widths, check all three display sizes, keyboard-only operation, reduced motion, and every Season × Appearance combination. Expected: no horizontal overflow, visible focus, bounded settings, proportional verse numbers, readable skeleton/error states, semantic dialog behavior, and the contrast thresholds in the spec.

- [ ] **Step 3: Complete the navigation, timing, and leak matrix**

Verify rapid Next navigation, seven-second history settlement, history refresh at a later active verse, adjacent position recall after reload, general-entry verse 1 behavior, vertical scrolling, text selection, swipes, short press, long press, right-click, Escape, and keyboard footnote toggle. After 50 repeated chapter transitions, inspect the DOM and timers in browser tooling. Expected: one dialog, no completed ripple nodes, no stale retiring views, no abandoned history commit, and stable responsiveness.

- [ ] **Step 4: Complete link, security, offline, and failure verification**

Verify Matthew 17:21 and a spaced book name through direct URL, Copy, native Share, fallback Copy Link, malformed parameters, offline reload, data retry, sync retry, share cancellation, and clipboard denial. Expected: exact rendered verse text, public reference-only URLs, no injection, no blocked reading UI, and concise accessible status feedback.

- [ ] **Step 5: Review the final diff and create the release commit only if fixes remain**

Run:

```bash
git diff --stat HEAD~6..HEAD
git status --short
```

Expected: only `bible.html`, `sw.js`, the approved design, and this plan are part of the work; unrelated user files remain untouched. If acceptance fixes were needed after Task 6, commit only those files:

```bash
git add bible.html sw.js
git commit -S -m "fix: finish Bible reader acceptance"
```
