# Bible 3.3.3 Dark Fill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release version 3.3.3 and make each dark active-verse fill barely lighter than its corresponding dark background.

**Architecture:** Update only explicit palette/version constants in the existing single-file Bible SPA. Expand the existing static palette test to make the five chosen fills and both version render locations contractual, then make the minimal production edits.

**Tech Stack:** HTML, CSS custom properties, vanilla JavaScript, Node.js built-in test runner.

---

## File structure

- `bible.html` — version strings and dark seasonal `--selection-fill` primitives.
- `tests/bible_palette_contrast.test.js` — exact fill, background relationship, and text-contrast contracts.
- `tests/bible_ui_accessibility.test.js` — visible/script version contract, if no existing test owns it.

### Task 1: Define 3.3.3 palette and version contracts

**Files:**
- Modify: `tests/bible_palette_contrast.test.js:24-49, 122-141`
- Modify: `tests/bible_ui_accessibility.test.js`

- [ ] **Step 1: Write failing exact-fill and version tests**

Change the dark entries in `selectionFillModes` to:

```js
['html.dark', '#0a0e14', '#111722'],
['html[data-season="spring"].dark', '#0b140d', '#101a11'],
['html[data-season="summer"].dark', '#171207', '#1e190d'],
['html[data-season="fall"].dark', '#190d08', '#22120c'],
['html[data-season="winter"].dark', '#08131d', '#0d1b28']
```

Replace the former-dark-fill relation with an assertion that every dark fill is
lighter than its palette `--bg`, while preserving `contrast(fg, fill) >= 4.5`.
Add exact assertions for both version sites:

```js
assert.match(bible, /<span id="app-version">3\.3\.3<\/span>/);
assert.match(bible, /var APP_VERSION = '3\.3\.3';/);
```

- [ ] **Step 2: Run focused tests and confirm production mismatch**

Run: `node --test tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js`

Expected: FAIL because production still uses `3.3.0` and the current lighter
dark selection fills.

### Task 2: Implement the patch release constants

**Files:**
- Modify: `bible.html:93-202, 1287, 1319`

- [ ] **Step 1: Update only five dark selection fills**

Set `--selection-fill` to `#111722`, `#101a11`, `#1e190d`, `#22120c`, and
`#0d1b28` for base, spring, summer, fall, and winter dark modes respectively.
Do not modify any dark `--bg`, light palette, accent, glow, inactive verse,
or interaction declaration.

- [ ] **Step 2: Update both visible and script version values**

Make both locations exactly 3.3.3:

```html
<span id="app-version">3.3.3</span>
```

```js
var APP_VERSION = '3.3.3';
```

- [ ] **Step 3: Run focused contracts**

Run: `node --test tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js`

Expected: PASS with each dark fill still lighter than its own background and
each scripture text/fill pair at 4.5:1 or above.

- [ ] **Step 4: Commit the minimal release patch**

```bash
git add bible.html tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js
git commit -S -m "fix: release Bible 3.3.3 palette"
```

### Task 3: Verify release safety

**Files:**
- Verify: `bible.html`
- Verify: `tests/*.test.js`

- [ ] **Step 1: Run full automated verification**

Run: `node --test tests/*.test.js && git diff --check`

Expected: all tests pass and the whitespace check has no output.

- [ ] **Step 2: Review change scope**

Use `git diff -- bible.html tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js` and confirm the diff contains only the two version locations, five dark fill values, and matching test assertions. Confirm no customer data, scripture data, account values, or external domains were added.

