# Bible Reader Sheet Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace destructive Bible utility views with one draggable native sheet, add the responsive three-page selector, restore the last private reading location, and remove marquee fading.

**Architecture:** Keep the verse reader as the sole mounted main view and render utilities into a singleton modal dialog controlled by explicit sheet, gesture, and browser-history state. Reuse the project's visual tokens and the main site's drag thresholds while adding pointer cancellation, fullscreen snaps, top-edge symmetry, asynchronous search indexing, and lifecycle cleanup.

**Tech Stack:** Static HTML/CSS, ES5-compatible browser JavaScript, native `<dialog>` and Pointer Events, Node built-in tests.

---

### Task 1: Remove Marquee Fading

**Files:**
- Modify: `bible.html:289-340`
- Modify: `tests/bible_motion_system.test.js`
- Modify: `tests/bible_ui_accessibility.test.js`

- [ ] **Step 1: Write failing tests**

Require `.marquee-line` overflow clipping and `marquee-sway`, but reject `--marquee-left-fade`, `--marquee-right-fade`, `mask-image`, `-webkit-mask-image`, and `marquee-mask-breathe`. Preserve assertions for the 0–18% and 82–100% endpoint holds.

- [ ] **Step 2: Run focused RED**

Run the two motion/accessibility test files. Expected: FAIL because the fade properties, masks, and fade keyframes still exist.

- [ ] **Step 3: Remove only fade behavior**

Retain the following movement contract and delete both registered fade properties, both mask declarations, `marquee-mask-breathe`, and its reduced-motion override:

```css
.marquee-line.is-marquee .marquee-text {
  animation: marquee-sway 3s var(--motion-ease) infinite alternate;
}
@keyframes marquee-sway {
  0%, 18% { transform: translateX(0); }
  82%, 100% { transform: translateX(calc(var(--marquee-distance, 0px) * -1)); }
}
```

- [ ] **Step 4: Run focused GREEN and create a signed checkpoint**

Expected: focused tests pass. Commit as `fix: remove Bible marquee fade`.

### Task 2: Build the Native Sheet Foundation

**Files:**
- Modify: `bible.html:470-677,1048-1122,1258-1314,2115-2359,3244-3317`
- Create: `tests/bible_sheet_controller.test.js`

- [ ] **Step 1: Write sheet structure and pure-decision tests**

Assert one `<dialog id="app-sheet">` with a handle, title, explicit close button, scroll body, and backdrop. Cover top/bottom symmetry, compact/fullscreen/closed decisions, axis lock, scroll-boundary ownership, pointer cancellation, and reduced-motion immediate settling using exported source helpers equivalent to:

```js
function dominantSheetAxis(dx, dy) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return null;
  return Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
}
```

- [ ] **Step 2: Run controller RED**

Expected: FAIL because the shared sheet and decision helpers do not exist.

- [ ] **Step 3: Add the shared dialog and controller**

Add one singleton state and implement `openAppSheet`, `renderAppSheet`, `setSheetSnap`, `requestCloseAppSheet`, and `finishCloseAppSheet`:

```js
var sheetState = {
  kind: null,
  edge: 'bottom',
  snap: 'compact',
  opener: null,
  pointer: null,
  settleTimer: null,
  searchCleanup: null
};
```

Use `showModal`, native backdrop inertness, captured/restored focus, `aria-labelledby`, safe-area padding, `100dvh`, and one startup-installed set of pointer listeners.

- [ ] **Step 4: Add browser-history bridging**

Opening from closed pushes `{view:'verses', book, chapter, verse, sheet:{kind,page}}` once. Switching content or pager pages replaces the current state. Escape, backdrop, close button, and swipe use `history.back()` when the active entry owns a sheet; `popstate` validates and renders or closes the descriptor.

- [ ] **Step 5: Run controller GREEN and create a signed checkpoint**

Expected: controller and accessibility tests pass. Commit as `feat: add native Bible sheet controller`.

### Task 3: Migrate Verse Actions, History, Settings, and Search

**Files:**
- Modify: `bible.html:1258-1314,2315-2941,3244-3317,4338-4550,4578-4848`
- Create: `tests/bible_sheet_content.test.js`

- [ ] **Step 1: Write failing renderer and cleanup tests**

Assert the four launchers call `openAppSheet` with `verse-actions`, `history`, `settings`, and `search`; reject destructive reader clearing from popup renderers. Test that closing Search clears debounce/focus timers and increments a generation token so detached results cannot mutate.

- [ ] **Step 2: Run content RED**

Expected: FAIL because the existing panels and Search are independent/destructive.

- [ ] **Step 3: Move content into sheet renderers**

Implement `renderVerseActionsSheet`, `renderHistorySheet`, `renderSettingsSheet`, and `renderSearchSheet`. Move live settings nodes rather than cloning IDs. Preserve copy/share generation guards and safe text sinks. Remove the old independent panel/dialog lifecycle after all launchers use the shared sheet.

- [ ] **Step 4: Make search nonblocking and cancellable**

Build the index in bounded idle chunks with a `setTimeout` fallback, display existing skeleton spans until ready, and cap locally persisted queries:

```js
function boundedSearchQuery(value) {
  return String(value == null ? '' : value).trim().slice(0, 160);
}
```

Never add query text to URL/history. Selecting a result replaces the sheet entry with the canonical verse route and renders that location.

- [ ] **Step 5: Run content GREEN and create a signed checkpoint**

Expected: content and accessibility tests pass. Commit as `feat: move Bible tools into sheets`.

### Task 4: Add the Responsive Three-Page Selection Sheet

**Files:**
- Modify: `bible.html:1369-1382,2181-2214,4033-4181,4674-4682`
- Modify: `tests/bible_selection_grid.test.js`
- Create: `tests/bible_selection_sheet.test.js`

- [ ] **Step 1: Write failing pager tests**

Test the `books|chapters|verses` page enum, navbar direct-open behavior, one-page horizontal transitions, three dot buttons with active semantics, top edge at 640px and below, bottom edge otherwise, context updates, and commit-only reader replacement.

- [ ] **Step 2: Run pager RED**

Expected: FAIL because selection currently replaces the main reader view.

- [ ] **Step 3: Implement the persistent pager**

Render one track with three labelled panels and accessible dot buttons. Use:

```js
var selectionPages = ['books', 'chapters', 'verses'];
function setSelectionPage(page, replaceHistory) {
  if (selectionPages.indexOf(page) < 0) return;
  selectionSheetPage = page;
  selectionTrack.style.transform = 'translateX(' + (-100 * selectionPages.indexOf(page)) + '%)';
  retargetSelectionGrid(activeSelectionGridFor(page));
  if (replaceHistory) replaceCurrentSheetState();
}
```

Horizontal movement belongs to the pager only after horizontal axis lock and advances at most one page. Vertical movement remains handle-driven.

- [ ] **Step 4: Preserve modulo-three lifecycle**

Reuse `selectionColumnCount`, retarget the one `ResizeObserver` after the active page is visible, coalesce measurement through one RAF, disconnect on close, and reject hidden zero-width grid measurement.

- [ ] **Step 5: Run pager GREEN and create a signed checkpoint**

Expected: pager, grid, and responsive chrome tests pass. Commit as `feat: add Bible selection sheet pager`.

### Task 5: Restore and Track the Last Reading Location

**Files:**
- Modify: `bible.html:1962-2003,3040-3154,3351-3388,3613-3633,4857-4880`
- Create: `tests/bible_startup_location.test.js`

- [ ] **Step 1: Write startup-precedence tests**

Cover valid URL over MRU, valid MRU over Genesis, corrupt/foreign/quarantined MRU falling back to Genesis, absent Genesis falling back to the first dataset verse, invalid query cleanup, sign-out privacy reset, and no late authentication jump.

- [ ] **Step 2: Write route-replacement tests**

Assert active verse changes debounce `history.replaceState`, never push, preserve a current sheet descriptor while open, update the canonical URL, and flush before `pagehide`.

- [ ] **Step 3: Run startup RED**

Expected: FAIL because startup renders Books and active scrolling does not update the route.

- [ ] **Step 4: Implement normalized fallback and route tracking**

Add `lastReadingReference`, `genesisReference`, `firstDatasetReference`, and `initialReadingReference`. Normalize stored MRUs against loaded data. Change initial rendering and sign-out reset to the selected verse. Add debounced `replaceReadingRoute` from active-verse changes and flush it with chapter-position persistence.

- [ ] **Step 5: Run startup GREEN and create a signed checkpoint**

Expected: startup and accessibility tests pass. Commit as `feat: restore the last Bible location`.

### Task 6: Lifecycle, Security, and Rendered Verification

**Files:**
- Modify: `tests/bible_sheet_controller.test.js`
- Modify: `tests/bible_sheet_content.test.js`
- Modify: `tests/bible_selection_sheet.test.js`
- Modify: `tests/bible_startup_location.test.js`

- [ ] **Step 1: Add repeated lifecycle and mutation tests**

Exercise repeated open/close cycles and assert one dialog, one listener installation, released pointer capture, cleared frames/timers, disconnected observers, no detached search writes, no query URL state, and no unsafe `innerHTML` data sinks.

- [ ] **Step 2: Run full automated verification**

Run every `tests/*.test.js` file and `git diff --check`. Expected: all tests pass and whitespace validation exits 0.

- [ ] **Step 3: Render and compare at target widths**

Verify 320px, 640px, and desktop states: compact/fullscreen/dismiss from both edges, nested scrolling, horizontal pager, dots, dark/light, reduced motion, virtual keyboard, Back/Forward, reload restoration, and unfaded `1 Thessalonians`. Compare the rendered sheet against the existing copy-verse popup and `wmpc_pager.php` at the same viewport.

- [ ] **Step 4: Run final privacy and leak review**

Confirm committed code contains no credentials, private domains, customer/company data, query logs, new cloud-sync path, unbounded retained collection, or unreleased observer/timer/listener.

- [ ] **Step 5: Create the signed verification checkpoint**

Commit only test/doc refinements as `test: verify Bible sheet interactions` when a distinct final checkpoint exists.
