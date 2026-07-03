# Bible Verse Glow and Double Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the historical active-verse glow with a thinner border, refine light/dark seasonal palettes, and replace long press with a reliable double tap/double click action menu.

**Architecture:** Keep the single-file Bible SPA and its static Node contracts. Palette assertions remain centralized in `bible_palette_contrast.test.js`; reader gesture contracts live in `bible_verse_motion.test.js`. A small pending active-verse action state replaces the long-press timer, so a deferred single action can be cancelled safely by a matching second activation.

**Tech Stack:** HTML, CSS custom properties, browser Pointer Events, vanilla JavaScript, Node.js built-in test runner.

---

## File structure

- `bible.html` — seasonal palette primitives, verse CSS, and reader pointer/click lifecycle.
- `tests/bible_palette_contrast.test.js` — direct palette, selection contrast, glow, and border contracts.
- `tests/bible_verse_motion.test.js` — reader single/double activation and timer-cleanup contracts.

### Task 1: Define palette and verse-visual contracts

**Files:**
- Modify: `tests/bible_palette_contrast.test.js:24-36, 122-165`

- [ ] **Step 1: Write failing palette expectations**

Replace `selectionFillModes` with the intended page surface and selection-fill values:

```js
const selectionFillModes = [
  [':root', '#e8eff7', '#f4f7fb'],
  ['html.dark', '#0a0e14', '#1d2533'],
  ['html[data-season="spring"]', '#e8f3e2', '#f3faef'],
  ['html[data-season="spring"].dark', '#0b140d', '#233827'],
  ['html[data-season="summer"]', '#f5edca', '#fff9df'],
  ['html[data-season="summer"].dark', '#171207', '#3a301d'],
  ['html[data-season="fall"]', '#f6e2d4', '#fff3e8'],
  ['html[data-season="fall"].dark', '#190d08', '#42291d'],
  ['html[data-season="winter"]', '#e6f1fa', '#eef7ff'],
  ['html[data-season="winter"].dark', '#08131d', '#203848']
];
```

Extend the palette test with per-mode assertions: each light surface is lighter than its prior value but darker than its fill; each dark fill is lighter than its prior value; and `contrast(fg, fill) >= 4.5`.

Change the active-verse contract to require the historical glow and a 1px border:

```js
assert.match(active, /border-width:\s*1px/);
assert.match(active, /box-shadow:\s*0 8px 28px var\(--accent-glow\)/);
```

Keep assertions that `.verse` is transparent and that no non-active verse rule adds a shadow or border color.

- [ ] **Step 2: Run the targeted contract and confirm it fails**

Run: `node --test tests/bible_palette_contrast.test.js`

Expected: FAIL because the current palette values still represent the earlier surface/fill values and the active verse has a 2px, glow-free border.

### Task 2: Implement palette and historical active-verse styling

**Files:**
- Modify: `bible.html:95-210, 880-901`

- [ ] **Step 1: Update only the approved seasonal primitives**

Set light-mode `--bg` to `#e8eff7`, `#e8f3e2`, `#f5edca`, `#f6e2d4`, and `#e6f1fa` for base, spring, summer, fall, and winter. Leave dark `--bg` values unchanged. Set dark `--selection-fill` to `#1d2533`, `#233827`, `#3a301d`, `#42291d`, and `#203848` in the same order. Do not change `--fg`, `--accent`, or the existing light selection fills.

- [ ] **Step 2: Restore the active-verse visual treatment without reviving inactive styling**

Make the active rule exactly:

```css
.verse.active {
  background: var(--selection-fill);
  border-color: var(--accent);
  border-width: 1px;
  box-shadow: 0 8px 28px var(--accent-glow);
}
```

Keep the base verse rule transparent and `border: 1px solid transparent` so the thinner active border does not change layout. Do not add found-highlight classes, inactive backgrounds, or focus outlines.

- [ ] **Step 3: Run the targeted visual contracts**

Run: `node --test tests/bible_palette_contrast.test.js`

Expected: PASS with all palette and verse visual assertions green.

- [ ] **Step 4: Commit the isolated visual change**

```bash
git add bible.html tests/bible_palette_contrast.test.js
git commit -S -m "fix: restore Bible verse glow"
```

### Task 3: Define reader double-activation contracts

**Files:**
- Modify: `tests/bible_verse_motion.test.js:30-45`

- [ ] **Step 1: Write failing reader-action assertions**

Add a source-contract test which requires these stable seams:

```js
assert.match(bible, /var pendingReaderVerseAction = null;/);
assert.match(bible, /var READER_DOUBLE_ACTIVATE_MS = 280;/);
assert.match(bible, /function scheduleReaderVerseFootnoteToggle\(verse, event\)/);
assert.match(bible, /function clearPendingReaderVerseAction\(\)/);
assert.match(bible, /function isMatchingReaderDoubleActivation\(event, verse\)/);
assert.match(bible, /openVerseActions\(verse\);/);
assert.doesNotMatch(bible, /READER_LONG_PRESS_MS|readerLongPressTimer/);
```

Assert that `prepareToLeaveReadingView`, `pointercancel`, and `pointermove` call `clearPendingReaderVerseAction()`, and that a matching second activation clears the pending toggle before calling `openVerseActions`.

- [ ] **Step 2: Run the targeted action contract and confirm it fails**

Run: `node --test tests/bible_verse_motion.test.js`

Expected: FAIL because the production handler still owns `readerLongPressTimer` and lacks the double-activation helpers.

### Task 4: Replace long press with a leak-safe double activation state

**Files:**
- Modify: `bible.html:2105-2110, 3336-3364, 4581-4682`

- [ ] **Step 1: Replace long-press state with one cancellable pending action**

Declare:

```js
var pendingReaderVerseAction = null;
var READER_DOUBLE_ACTIVATE_MS = 280;
```

Implement `clearPendingReaderVerseAction()` to clear its timeout, null the state, and tolerate an already-cleared state. Call it from `prepareToLeaveReadingView`, gesture cancellation, pointer movement beyond the existing 10px threshold, and before replacing a pending activation. This prevents callbacks from acting on stale or detached verse elements.

- [ ] **Step 2: Schedule the single active-verse action and detect a matching double activation**

Use a small state object containing the active verse element, pointer type, pointer ID or mouse marker, coordinates, and timer. `scheduleReaderVerseFootnoteToggle(verse, event)` must wait `READER_DOUBLE_ACTIVATE_MS`, verify `verse.isConnected`, `uiView === 'verses'`, and `verse.classList.contains('active')`, then call `toggleAllVerseFootnotes(verse)` exactly once. `isMatchingReaderDoubleActivation(event, verse)` must require the same active verse, same pointer family, and coordinates within 28px.

On matching second activation, clear the timer, suppress the browser's follow-up click where necessary, then call `openVerseActions(verse)`. A normal single press on an inactive verse continues to call `setActiveVerse(verse.getAttribute('data-v'), true)` immediately.

- [ ] **Step 3: Wire touch/pen and mouse without duplicate native click behavior**

Remove the long-press scheduling block from `pointerdown`. Handle touch and pen in the existing reader `pointerup` flow. Replace the current mouse-only click handler with a click path that schedules active-verse footnote toggles and a `dblclick` path that cancels that scheduled toggle and opens the menu. Keep `e.detail === 0` excluded so keyboard Enter behavior is unchanged. Keep the `contextmenu` handler for right-click parity.

- [ ] **Step 4: Run targeted action and regression tests**

Run: `node --test tests/bible_verse_motion.test.js tests/bible_ui_accessibility.test.js`

Expected: PASS. The contracts must show no long-press state remains, one delayed single action is owned at a time, and keyboard/pointer activation still share the active verse state.

- [ ] **Step 5: Commit the isolated interaction change**

```bash
git add bible.html tests/bible_verse_motion.test.js
git commit -S -m "fix: double activate Bible verse actions"
```

### Task 5: End-to-end verification and visual QA

**Files:**
- Verify: `bible.html`
- Verify: `tests/*.test.js`

- [ ] **Step 1: Run the full suite and static safety checks**

Run: `node --test tests/*.test.js && git diff --check`

Expected: every test passes and `git diff --check` has no output.

- [ ] **Step 2: Verify in the in-app browser**

Open a chapter in one light seasonal mode and one dark seasonal mode. Confirm the light page surface is slightly brighter, the dark active fill is slightly lighter, inactive verses remain transparent, and the selected verse has the historical broad glow with a thin border. On an active verse, verify one tap/click toggles footnotes after the brief double-activation window; verify two taps/clicks open the context menu without changing footnotes; verify right-click still opens it.

- [ ] **Step 3: Inspect lifecycle and security constraints**

Check that only one pending reader timeout can exist, every escape path clears it, no listener is duplicated, and no scripture text, profile data, copied text, or external values are added to source or test fixtures.

- [ ] **Step 4: Commit any verification-only correction**

```bash
git add bible.html tests/bible_palette_contrast.test.js tests/bible_verse_motion.test.js
git commit -S -m "test: cover Bible verse activation"
```

