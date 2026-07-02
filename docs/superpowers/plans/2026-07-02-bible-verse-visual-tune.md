# Bible Verse Visual Tune Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the non-quintic motion curve and a calm f22-era verse layout with highlighted unselected verses and a restrained 2px active border.

**Architecture:** Keep the app’s existing single motion token, but bind it directly to `cubic-bezier(.64, 0, .36, 1)` and use an equivalent JavaScript easing helper for the reader chase. Keep seasonal colors as CSS variables: a shared seasonal inactive highlight derives from `--hover-bg`, while the active border derives from `--accent`. The reader’s existing keyboard-follow lifecycle remains unchanged.

**Tech Stack:** Static HTML/CSS/JavaScript; Node built-in test runner.

---

### Task 1: Lock in the non-quintic motion contract

**Files:**
- Modify: `tests/bible_motion_system.test.js`
- Modify: `bible.html:48-95,3419-3472`

- [ ] **Step 1: Write the failing motion contract test**

Replace the first and third tests in `tests/bible_motion_system.test.js` with assertions that demand one direct cubic token and a JavaScript cubic helper:

```js
test('one cubic easing token owns application transitions', () => {
  assert.match(css, /--motion-ease: cubic-bezier\(\.64, 0, \.36, 1\);/);
  assert.doesNotMatch(css, /@supports \(transition-timing-function: linear\(0, 1\)\)/);
  assert.doesNotMatch(css, /linear\(0, 0\.00856/);
  assert.doesNotMatch(css, /smootherstep/);
});

test('JavaScript verse chase uses the cubic motion curve', () => {
  const cubic = bible.match(/function cubicVerseEase\([^)]*\) \{[\s\S]*?\n  \}/);
  assert.ok(cubic);
  const evaluate = Function(`${cubic[0]}; return [cubicVerseEase(0), cubicVerseEase(.5), cubicVerseEase(1)];`);
  assert.deepEqual(evaluate(), [0, 0.5, 1]);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --test tests/bible_motion_system.test.js`

Expected: FAIL because the app still exposes smootherstep and a `linear(...)` timing function.

- [ ] **Step 3: Implement the direct cubic motion token and JavaScript helper**

In `bible.html`, replace both motion-token declarations and the `@supports` block with:

```css
--motion-ease: cubic-bezier(.64, 0, .36, 1);
```

Replace `smootherstep()` with a `cubicVerseEase(progress)` helper that clamps the input, solves the cubic-bezier x coordinate for the parameter with bounded binary search, and returns the cubic y coordinate for control points `(0, 0)` and `(1, 1)` with handles `(.64, 0)` and `(.36, 1)`. Replace `smootherstep(progress)` in `stepVerseChase()` with `cubicVerseEase(progress)`.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run: `node --test tests/bible_motion_system.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the motion change**

```bash
git add bible.html tests/bible_motion_system.test.js
git commit -S -m "fix: restore Bible cubic motion"
```

### Task 2: Restore the quiet verse layout with a 2px active border

**Files:**
- Modify: `tests/bible_palette_contrast.test.js`
- Modify: `tests/bible_ui_accessibility.test.js`
- Modify: `bible.html:60-207,883-908`

- [ ] **Step 1: Write the failing verse treatment tests**

Update the palette test to require the root `--verse-highlight` alias to derive from `--hover-bg`, which is already season-owned in every mode, and replace the border-specific assertions with:

```js
assert.match(verse, /border:\s*2px solid transparent/);
assert.match(verse, /background:\s*var\(--verse-highlight\)/);
assert.match(active, /border-color:\s*var\(--accent\)/);
assert.match(active, /border-width:\s*2px/);
assert.doesNotMatch(verse, /--verse-border/);
assert.doesNotMatch(active, /box-shadow|outline/);
```

Update `tests/bible_ui_accessibility.test.js` to assert the transparent `2px` base border, `--verse-highlight: var(--hover-bg)`, and `border-color: var(--accent)` for `.verse.active`; remove assertions for `--verse-border` and `--verse-active-border`.

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run: `node --test tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js`

Expected: FAIL because inactive verse borders and the 1px active border are still present.

- [ ] **Step 3: Implement the seasonal highlight and active border**

In `:root`, declare `--verse-highlight: var(--hover-bg);`. Remove every `--verse-border` and `--verse-active-border` declaration. Update the reader rules to:

```css
.verse {
  border: 2px solid transparent;
  background: var(--verse-highlight);
}
.verse.active {
  border-color: var(--accent);
  border-width: 2px;
  box-shadow: none;
  outline: none;
}
```

Keep `.verse.footnotes-open` limited to padding and preserve the existing keyboard/pointer shared `.active` state.

- [ ] **Step 4: Run focused tests and confirm they pass**

Run: `node --test tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the verse visual change**

```bash
git add bible.html tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js
git commit -S -m "fix: restore Bible verse emphasis"
```

### Task 3: Verify the complete app and rendered reader behavior

**Files:**
- Verify: `bible.html`
- Verify: `tests/*.test.js`

- [ ] **Step 1: Run the complete automated suite**

Run: `node --test tests/*.test.js`

Expected: all tests pass.

- [ ] **Step 2: Parse the inline app script**

Run:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); const p=$("bible.html").stringByStandardizingPath; const s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,null).js; [...s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean).forEach(code=>new Function(code)); console.log("parsed");'
```

Expected: `parsed` and exit status 0.

- [ ] **Step 3: Browser-check representative seasonal modes**

Open Matthew 5 in the local browser, select Spring/light and Winter/dark, then verify: inactive verse has a seasonal-tint background and no visible border; active verse has the same background and a 2px accent border; no glow or shadow appears; ten ArrowDown and ArrowUp moves keep the active verse visible.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check master...HEAD && git status --short`

Expected: no whitespace errors and only the planned commits/files.
