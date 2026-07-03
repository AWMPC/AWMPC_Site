# Bible Selection Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Darken the app surface, give active and picker selections a lighter WCAG-compliant seasonal fill, and make desktop chapter navigation content-sized.

**Architecture:** Add a `--selection-fill` primitive to every base and seasonal palette, then consume it only in active verses and book/chapter picker buttons. Keep the reader’s inactive verses transparent. Desktop navigation reserves the longest book label using a tokenized 16ch book control, while the existing mobile override preserves the marquee constraint.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner.

---

### Task 1: Lock the selection surface and contrast contract

**Files:**
- Modify: `tests/bible_palette_contrast.test.js:5-170`
- Modify: `tests/bible_ui_accessibility.test.js:40-155`
- Modify: `bible.html:56-205, 860-900`

- [ ] **Step 1: Write failing palette and component assertions**

Extend `seasonalCore` with `selection-fill`. Add a contrast test that reads `fg` and `selection-fill` from each selector and requires `contrast(fg, selectionFill) >= 4.5`.

```js
test('selection fills meet normal-text WCAG contrast in every season', () => {
  for (const [season, dark] of seasonModes) {
    const selector = `html[data-season="${season}"]${dark ? '.dark' : ''}`;
    const block = cssBlock(selector);
    assert.ok(contrast(declaration(block, 'fg'), declaration(block, 'selection-fill')) >= 4.5, selector);
  }
});
```

Require `.verse.active` to use `background: var(--selection-fill)`, inactive `.verse` to remain transparent, and `.book-btn, .chapter-btn` to use `background: var(--selection-fill)`.

- [ ] **Step 2: Run focused tests to verify failure**

Run: `node --test tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js`

Expected: FAIL because no `selection-fill` primitive or active-verse/picker fill exists.

- [ ] **Step 3: Add palette primitives and consumer rules**

Define `--selection-fill` beside every palette’s `--bg` and use the following values, which keep the default surface darker than the selection fill:

```css
:root { --bg: #e2ebf5; --selection-fill: #f4f7fb; }
html.dark { --bg: #0a0e14; --selection-fill: #171c28; }
html[data-season="spring"] { --bg: #deedd7; --selection-fill: #f3faef; }
html[data-season="spring"].dark { --bg: #0b140d; --selection-fill: #1b2d1e; }
html[data-season="summer"] { --bg: #f0e7bd; --selection-fill: #fff9df; }
html[data-season="summer"].dark { --bg: #171207; --selection-fill: #302717; }
html[data-season="fall"] { --bg: #f2d8c5; --selection-fill: #fff3e8; }
html[data-season="fall"].dark { --bg: #190d08; --selection-fill: #352016; }
html[data-season="winter"] { --bg: #dcecf8; --selection-fill: #eef7ff; }
html[data-season="winter"].dark { --bg: #08131d; --selection-fill: #172b3a; }

.verse.active { background: var(--selection-fill); border-color: var(--accent); border-width: 2px; }
.book-btn, .chapter-btn { background: var(--selection-fill); }
```

Keep inactive `.verse { background: transparent; }` unchanged. Keep selected picker rules in place so their existing active distinction remains additive.

- [ ] **Step 4: Verify focused tests pass**

Run: `node --test tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js`

Expected: PASS with no failures.

### Task 2: Make desktop navigation content-sized while preserving mobile marquee

**Files:**
- Modify: `bible.html:37-90, 360-420, mobile floating-nav media rule`
- Modify: `tests/bible_ui_accessibility.test.js:119-150`

- [ ] **Step 1: Write failing navigation geometry assertions**

Require a root `--floating-nav-book-width: 16ch`, desktop `.floating-nav { flex: 0 1 auto; }`, and desktop `.fn-book` width/flex-basis using that token. Require the mobile rule to retain `max-width: 42vw` and existing marquee-line width behavior.

- [ ] **Step 2: Run the focused accessibility contract test to verify failure**

Run: `node --test tests/bible_ui_accessibility.test.js`

Expected: FAIL because desktop navigation currently uses `flex: 1 1 auto` and has no 16ch width token.

- [ ] **Step 3: Implement the navigation sizing rules**

```css
:root { --floating-nav-book-width: 16ch; }
.floating-nav { width: auto; max-width: calc(100% - 180px); flex: 0 1 auto; }
.floating-nav .fn-book {
  flex: 0 1 var(--floating-nav-book-width);
  width: var(--floating-nav-book-width);
  max-width: var(--floating-nav-book-width);
  min-width: 0;
}
@media (max-width: 640px) {
  .floating-nav .fn-book { max-width: 42vw; }
}
```

Retain the existing 44px chapter/verse minimum and `.marquee-line { width: 100%; }`.

- [ ] **Step 4: Run all automated tests**

Run: `node --test tests/*.test.js && git diff --check`

Expected: all tests pass and no whitespace errors.

- [ ] **Step 5: Browser verification**

At desktop width, open a long-book chapter and confirm the nav ends after the reserved book/chapter/verse controls rather than stretching across the viewport. At mobile width, confirm the book label remains constrained and uses its existing marquee behavior. In a seasonal light and dark palette, confirm inactive reader verses reveal the darker surface, active verses and picker buttons use the lighter fill, and active scripture text remains legible.

- [ ] **Step 6: Commit the implementation**

```bash
git add bible.html tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js
git commit -S -m "fix: refine bible selection surface"
```
