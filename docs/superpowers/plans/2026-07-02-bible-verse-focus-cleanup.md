# Bible Verse Focus Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove inactive verse fills and make Arrow-key verse navigation show only the existing active border.

**Architecture:** Verse state remains unchanged: `setActiveVerse()` assigns `.active` before `showAdjacentVerse()` moves DOM focus. CSS supplies the visual contract: a transparent base verse and the existing active accent border; a narrow focus-visible reset prevents the browser user-agent outline from duplicating that indicator.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner.

---

### Task 1: Define and implement the single verse indicator

**Files:**
- Modify: `tests/bible_palette_contrast.test.js:117-133`
- Modify: `tests/bible_ui_accessibility.test.js:42-46`
- Modify: `bible.html:866-889`

- [ ] **Step 1: Write the failing visual-contract tests**

Replace the quiet-highlight assertions with a transparent base rule and an explicit focus rule:

```js
test('verses leave inactive content unfilled and use one active border', () => {
  const verse = cssBlock('.verse');
  assert.match(verse, /background:\\s*transparent/);
  assert.match(verse, /border:\\s*2px solid transparent/);

  const active = cssBlock('.verse.active');
  assert.match(active, /border-color:\\s*var\\(--accent\\)/);
  assert.match(active, /border-width:\\s*2px/);

  const focus = cssBlock('.verse:focus-visible');
  assert.match(focus, /outline:\\s*none/);
});
```

Update the static accessibility assertions to require `background: transparent` on `.verse`, retain the active 2px accent border, and require `.verse:focus-visible { outline: none; }`.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `node --test tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js`

Expected: FAIL because `.verse` still uses `var(--verse-highlight)` and lacks a verse focus-visible declaration.

- [ ] **Step 3: Implement the CSS contract**

In the existing verses-view rules, use this exact base and focus state while retaining the current `.verse.active` block:

```css
.verse {
  /* existing geometry and transition declarations remain */
  border: 2px solid transparent;
  background: transparent;
}
.verse:focus-visible {
  outline: none;
}
.verse.active {
  border-color: var(--accent);
  border-width: 2px;
}
```

Do not remove the `target.focus({ preventScroll: true })` call in `showAdjacentVerse()`; it preserves keyboard focus while the active border supplies its visual indicator.

- [ ] **Step 4: Run focused and complete regression suites**

Run: `node --test tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js && node --test tests/*.test.js`

Expected: every test passes with no failures.

- [ ] **Step 5: Perform browser verification**

Open a verse chapter, click one verse, then press ArrowDown. Confirm that the inactive verse has no fill and the keyboard-selected verse has the same one seasonal active border as pointer selection, with no additional focus ring.

- [ ] **Step 6: Commit the implementation**

```bash
git add bible.html tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js
git commit -S -m "fix: unify verse focus border"
```
