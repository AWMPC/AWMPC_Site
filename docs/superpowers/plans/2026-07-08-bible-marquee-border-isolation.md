# Bible Marquee Border Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Confine marquee fading to text inside button borders while preserving endpoint readability, alignment, motion, and compatibility with non-button marquee hosts.

**Architecture:** `setMarqueeText` will create an inner `.marquee-line` only for button hosts; non-button hosts retain the current direct class. Existing measurement and animation code continues to operate on `.marquee-line`, so the button's border and background never enter the mask compositing layer.

**Tech Stack:** Static HTML/CSS/ES5-compatible JavaScript and Node 24 built-in tests.

---

### Task 1: Isolate Button Marquee Masks

**Files:**
- Modify: `bible.html:289-340,415-422,2157-2170,2216-2223`
- Modify: `tests/bible_motion_system.test.js`
- Modify: `tests/bible_ui_accessibility.test.js`

- [ ] **Step 1: Write failing structure and style tests**

Add production-helper tests proving that a `BUTTON` host receives an inner `.marquee-line`, never receives that class itself, and contains `.marquee-text`; a non-button host itself becomes `.marquee-line`. Require text assignment through `textContent`.

Add CSS assertions requiring:

```css
.floating-nav .fn-book .marquee-line { width: 100%; text-align: center; }
.floating-nav .fn-book .marquee-line.is-marquee { text-align: left; }
```

Reject the former host-level selector:

```css
.floating-nav .fn-book.is-marquee
```

Assert that `mask-image` and `-webkit-mask-image` exist only in the `.marquee-line.is-marquee` rule, so the bordered button cannot be masked.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
mise exec node@24 -- node --test tests/bible_motion_system.test.js tests/bible_ui_accessibility.test.js
```

Expected: FAIL because button hosts currently receive `.marquee-line` directly and the CSS still targets `.fn-book.is-marquee`.

- [ ] **Step 3: Implement the minimal helper change**

Replace `setMarqueeText` with:

```js
  function setMarqueeText(el, value) {
    el.textContent = '';
    var line = el;
    if (el.tagName === 'BUTTON') {
      line = document.createElement('span');
      line.className = 'marquee-line';
      el.appendChild(line);
    } else {
      el.classList.add('marquee-line');
    }
    var text = document.createElement('span');
    text.className = 'marquee-text';
    text.textContent = value == null ? '' : String(value);
    line.appendChild(text);
    scheduleMarqueeMeasure();
  }
```

Replace the floating-book alignment rules with:

```css
  .floating-nav .fn-book .marquee-line { width: 100%; text-align: center; }
  .floating-nav .fn-book .marquee-line.is-marquee { text-align: left; }
```

Do not change mask keyframes, translation keyframes, reduced-motion rules, or measurement arithmetic.

- [ ] **Step 4: Verify focused and full GREEN**

Run:

```bash
mise exec node@24 -- node --test tests/bible_motion_system.test.js tests/bible_ui_accessibility.test.js
mise exec node@24 -- node --test tests/*.test.js
git diff --check
```

Expected: all tests pass and `git diff --check` exits 0.

- [ ] **Step 5: Render the regression target**

At desktop and 320px mobile widths, load `1 Thessalonians` in light and dark modes. Confirm the text fades and reaches both endpoints while the left and right button-border pixels remain continuously opaque. Confirm short labels remain centered and reduced motion shows the readable start.

- [ ] **Step 6: Create a signed implementation checkpoint**

```bash
git add bible.html tests/bible_motion_system.test.js tests/bible_ui_accessibility.test.js docs/superpowers/plans/2026-07-08-bible-marquee-border-isolation.md docs/superpowers/specs/2026-07-08-bible-marquee-border-isolation-design.md
git commit -S -m "fix: isolate Bible marquee fade"
```
