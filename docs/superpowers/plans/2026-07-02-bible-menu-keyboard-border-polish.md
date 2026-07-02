# Bible Menu, Keyboard Follow, and Verse Border Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scale the custom settings panel below 100%, make held-arrow verse navigation follow continuously, and introduce subtle inactive/quiet active verse borders.

**Architecture:** Extend the existing shrink-only `BASE_UI_GEOMETRY` token pipeline rather than adding a second scale system. Rework the existing verse-chase state machine so retargets reuse one scheduled frame and apply a visibility guard, then express verse borders as seasonal decorative tokens with an explicit contrast hierarchy.

**Tech Stack:** Single-file HTML/CSS/ES5 JavaScript SPA, Node built-in test runner, JXA syntax validation, in-app browser QA.

---

## File map

- Modify `bible.html`: panel geometry tokens, verse border tokens/styles, and verse-chase retargeting.
- Modify `tests/bible_ui_scale_reflow.test.js`: five-scale panel geometry and 320px bounding contracts.
- Modify `tests/bible_verse_motion.test.js`: one-frame continuous retarget and reduced-motion contracts.
- Modify `tests/bible_palette_contrast.test.js`: seasonal inactive/active/text contrast hierarchy.

### Task 1: Scale the custom settings panel

**Files:**
- Modify: `bible.html:40-60,590-618,1347-1380,2383-2418`
- Test: `tests/bible_ui_scale_reflow.test.js`

- [ ] **Step 1: Add a failing five-scale panel geometry contract**

Add `panelWidth`, `viewportInset`, and `motionOffset` to the test's expected geometry table:

```js
const panelGeometry = {
  50: { width: 180, inset: 6, motion: 3 },
  75: { width: 270, inset: 9, motion: 4.5 },
  100: { width: 360, inset: 12, motion: 6 },
  125: { width: 360, inset: 12, motion: 6 },
  150: { width: 360, inset: 12, motion: 6 }
};

for (const [scale, expected] of Object.entries(panelGeometry)) {
  const geometry = uiGeometryForScale(Number(scale));
  assert.equal(geometry.panelWidth, expected.width);
  assert.equal(geometry.viewportInset, expected.inset);
  assert.equal(geometry.motionOffset, expected.motion);
}
```

Assert `.fab-panel` consumes `--display-panel-width`, `--display-viewport-inset`, and `--display-panel-motion-offset`, including its width, right/bottom clearance, maximum-height expression, and closed transform.

- [ ] **Step 2: Run the focused test and confirm red**

Run: `node --test tests/bible_ui_scale_reflow.test.js`

Expected: FAIL because the geometry properties and CSS custom properties do not exist.

- [ ] **Step 3: Extend the existing UI geometry source**

Add the exact 100% baselines:

```js
var BASE_UI_GEOMETRY = {
  controlHeight: 48,
  iconSize: 48,
  padY: 8,
  padX: 12,
  panelPadding: 12,
  panelGap: 8,
  panelWidth: 360,
  viewportInset: 12,
  motionOffset: 6,
  navPadding: 6,
  radius: 20,
  gridGap: 8,
  viewPad: 12
};
```

Write the three results in `applyTextScale`:

```js
document.documentElement.style.setProperty('--display-panel-width', uiGeometry.panelWidth + 'px');
document.documentElement.style.setProperty('--display-viewport-inset', uiGeometry.viewportInset + 'px');
document.documentElement.style.setProperty('--display-panel-motion-offset', uiGeometry.motionOffset + 'px');
```

Replace fixed panel geometry with:

```css
.fab-panel {
  right: var(--display-viewport-inset);
  width: min(var(--display-panel-width), calc(100vw - (var(--display-viewport-inset) * 2)));
  max-height: calc(100dvh - var(--bottom-chrome-clearance) - var(--display-viewport-inset));
  transform: translateY(var(--display-panel-motion-offset));
}
```

Keep the open transform at `translateY(0)` and preserve the existing 320px max-width/overflow rules.

- [ ] **Step 4: Run the focused test and syntax validation**

Run: `node --test tests/bible_ui_scale_reflow.test.js`

Expected: all scale/reflow tests PASS.

Run:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
```

Expected: `bible inline JavaScript parses`.

- [ ] **Step 5: Commit the panel scaling**

```bash
git add bible.html tests/bible_ui_scale_reflow.test.js
git commit -S -m "fix: scale Bible settings panel"
```

### Task 2: Add the quiet two-tier verse borders

**Files:**
- Modify: `bible.html:90-195,870-897`
- Test: `tests/bible_palette_contrast.test.js`

- [ ] **Step 1: Write a failing seasonal contrast-hierarchy test**

For every season in both light and dark mode, resolve the verse surface, scripture foreground, inactive border, and active border. Composite translucent borders over the verse surface and enforce:

```js
const inactiveRatio = contrast(composite(inactiveBorder, verseSurface), verseSurface);
const activeRatio = contrast(composite(activeBorder, verseSurface), verseSurface);
const textRatio = contrast(scriptureForeground, verseSurface);

assert.ok(inactiveRatio > 1, `${name} inactive border remains perceptible`);
assert.ok(inactiveRatio < activeRatio, `${name} active border is stronger`);
assert.ok(activeRatio < textRatio, `${name} active border stays quieter than scripture`);
```

Also assert `.verse` uses `1px solid var(--verse-border)` and `.verse.active` uses only `var(--verse-active-border)`, with no glow or box shadow.

- [ ] **Step 2: Run the palette test and confirm red**

Run: `node --test tests/bible_palette_contrast.test.js`

Expected: FAIL because inactive verses are transparent and active border contrast is currently too strong.

- [ ] **Step 3: Define seasonal decorative border tokens and update verse CSS**

In each season/mode block, derive the two tokens from that palette's foreground/accent and verse surface. Use the approved visual relationship as the starting values:

```css
--verse-border: color-mix(in srgb, var(--fg) 10%, transparent);
--verse-active-border: color-mix(in srgb, var(--accent) 40%, transparent);
```

If a seasonal test fails, adjust only the percentage needed to satisfy `inactive < active < text`; do not target 3:1 because these borders are supplemental decoration.

Update the verse declarations:

```css
.verse {
  border: 1px solid var(--verse-border);
}
.verse.footnotes-open {
  border-width: 1px;
}
.verse.active {
  border-color: var(--verse-active-border);
  box-shadow: none;
}
.verse.active:focus-visible { outline: none; }
```

Do not add keyboard-specific border rules.

- [ ] **Step 4: Run palette and accessibility tests**

Run: `node --test tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js`

Expected: all tests PASS with inactive < active < scripture contrast in eight palette combinations.

- [ ] **Step 5: Commit the border hierarchy**

```bash
git add bible.html tests/bible_palette_contrast.test.js tests/bible_ui_accessibility.test.js
git commit -S -m "fix: soften Bible verse borders"
```

### Task 3: Make held-arrow centering continuously follow the active verse

**Files:**
- Modify: `bible.html:2089-2094,3374-3445,3450-3480`
- Test: `tests/bible_verse_motion.test.js`

- [ ] **Step 1: Replace the old cancellation expectation with a failing continuous-retarget contract**

Extend the harness with a viewport and target rectangles. After scheduling the first target, simulate one frame, move `viewEl.scrollTop`, and retarget three times without consuming the scheduled callback:

```js
setVerseChaseTarget({ top: 400, rectTop: 180, rectBottom: 220 });
assert.equal(frames.size, 1);
const firstFrame = [...frames.keys()][0];

viewEl.scrollTop = 100;
setVerseChaseTarget({ top: 520, rectTop: 360, rectBottom: 400 });
setVerseChaseTarget({ top: 610, rectTop: 390, rectBottom: 430 });
setVerseChaseTarget({ top: 700, rectTop: 420, rectBottom: 460 });

assert.equal(frames.size, 1, 'key repeat retains one scheduled frame');
assert.equal([...frames.keys()][0], firstFrame, 'retarget does not replace the live frame');
assert.deepEqual(cancelled, [], 'retarget does not cancel/restart');
assert.equal(verseChaseDestinationTop, 700, 'latest verse owns destination');
assert.equal(verseChaseStartTop, 100, 'retarget starts at rendered position');
assert.equal(verseChaseStartTime, null, 'retarget is ready on the next frame');
```

Add a target outside the visibility guard and assert the harness scroll position is corrected before the next animation frame. Retain reduced-motion and explicit-stop assertions.

- [ ] **Step 2: Run the motion test and confirm red**

Run: `node --test tests/bible_verse_motion.test.js`

Expected: FAIL because current retargeting calls `stopVerseChase`, cancels the live frame, and schedules a replacement.

- [ ] **Step 3: Add a visibility guard helper**

Add a helper beside `desiredVerseScrollTop`:

```js
function keepVerseChaseTargetVisible(target) {
  var metrics = readingViewportMetrics();
  var rect = target.getBoundingClientRect();
  var guard = Math.min(24, metrics.height * 0.08);
  if (rect.top < metrics.top + guard) {
    viewEl.scrollTop -= (metrics.top + guard) - rect.top;
  } else if (rect.bottom > metrics.bottom - guard) {
    viewEl.scrollTop += rect.bottom - (metrics.bottom - guard);
  }
}
```

Clamp the resulting `scrollTop` to `0..scrollHeight-clientHeight` in production and mirror that bound in the harness.

- [ ] **Step 4: Retarget the one live frame instead of restarting it**

Replace `setVerseChaseTarget` with this state transition:

```js
function setVerseChaseTarget(target) {
  if (!target) return;
  if (shouldReduceVerseMotion()) {
    viewEl.scrollTop = desiredVerseScrollTop(target);
    stopVerseChase();
    return;
  }
  keepVerseChaseTargetVisible(target);
  verseChaseTarget = target;
  verseChaseStartTop = viewEl.scrollTop;
  verseChaseDestinationTop = desiredVerseScrollTop(target);
  var distance = verseChaseDestinationTop - verseChaseStartTop;
  if (Math.abs(distance) < 0.5) {
    viewEl.scrollTop = verseChaseDestinationTop;
    stopVerseChase();
    return;
  }
  verseChaseStartTime = null;
  verseChaseDuration = verseChaseDurationForDistance(distance);
  if (verseChaseFrame === null) verseChaseFrame = requestAnimationFrame(stepVerseChase);
}
```

At the start of `stepVerseChase`, set `verseChaseFrame = null` because that callback is being consumed. At the end, schedule the next frame only if no retarget call has already scheduled one:

```js
if (verseChaseFrame === null) verseChaseFrame = requestAnimationFrame(stepVerseChase);
```

Ensure completion calls `stopVerseChase` and no frame ID, including zero, survives cleanup.

- [ ] **Step 5: Run motion, parse, and full tests**

Run: `node --test tests/bible_verse_motion.test.js`

Expected: PASS for one-frame retargeting, visibility guard, reduced motion, completion, and cancellation.

Run: `node --test tests/*.test.js`

Expected: all tests PASS with zero failures.

Run the JXA parse command from Task 1 and `git diff --check`.

Expected: JavaScript parses and the diff check exits 0.

- [ ] **Step 6: Commit continuous following**

```bash
git add bible.html tests/bible_verse_motion.test.js
git commit -S -m "fix: follow Bible keyboard navigation"
```

### Task 4: Rendered verification and final review

**Files:**
- Verify: `bible.html`
- Verify: `tests/*.test.js`

- [ ] **Step 1: Start the local static server and open the app**

Run: `python3 -m http.server 61544`

Open: `http://localhost:61544/bible.html?book=Matthew&chapter=17&verse=20`

Expected: the Bible reader loads with no console errors.

- [ ] **Step 2: Verify panel scaling in the browser**

At 50%, 75%, 100%, 125%, and 150%, inspect `.fab-panel.getBoundingClientRect()`.

Expected widths: 180, 270, 360, 360, 360 CSS pixels unless constrained by the viewport. At a 320px viewport, right and left bounds remain inside the viewport with no horizontal document overflow.

- [ ] **Step 3: Verify held-key navigation**

Focus a verse and hold ArrowDown for at least ten verse changes, then ArrowUp for at least ten.

Expected: the active border remains visible, the reader moves continuously without an idle pause after key release, and only one animation frame loop owns movement. Release returns smoothly to centered position.

- [ ] **Step 4: Verify border hierarchy across representative palettes**

Check Spring Light, Summer Dark, Fall Light, and Winter Dark.

Expected: all verses have a faint one-pixel border; the active border matches option B, remains quieter than text, and has no glow/double/keyboard-only border.

- [ ] **Step 5: Run final automated verification**

Run:

```bash
node --test tests/*.test.js
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check
git status --short
```

Expected: every test passes, JavaScript parses, diff check is clean, and only the user's pre-existing untracked files remain.

- [ ] **Step 6: Request final code review**

Review the complete branch against `docs/superpowers/specs/2026-07-02-bible-menu-keyboard-border-polish-design.md`, including accessibility, animation-frame cleanup, security/PII, and scope. Address any material finding with a new failing test and signed micro-commit before integration.
