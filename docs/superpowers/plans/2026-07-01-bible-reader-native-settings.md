# Bible Reader Native Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three wrapping settings button groups with homogeneous, full-width native dropdown menus while preserving all current setting behavior.

**Architecture:** Keep the existing single-file SPA and State API. Replace only the settings markup, its local CSS, and the three DOM synchronization paths; each native select sends its fixed value into the existing application function, which remains the sole place that validates, renders, persists, and synchronizes the setting.

**Tech Stack:** Static HTML, CSS, ES5-style browser JavaScript, native `<select>` controls, JavaScript for Automation source checks, and rendered in-app browser acceptance.

---

## File map

- Modify `bible.html`: replace the three segmented controls, add one shared select style, and synchronize each select through the existing appearance, season, and display-size functions.
- Do not modify `bible.json`, Firebase fields, service-worker behavior, application dependencies, or unrelated reader interactions.
- Do not add Node infrastructure or split the SPA into modules. The strict automated contract check runs directly against `bible.html`; rendered acceptance covers native picker behavior and responsive geometry.

### Task 1: Replace all three setting groups with native selects

**Files:**
- Modify: `bible.html:624-669`
- Modify: `bible.html:1137-1162`
- Modify: `bible.html:2073-2213`

- [ ] **Step 1: Run the strict native-settings contract and confirm it fails**

Run:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} ok((s.match(/<select[^>]+class="setting-select"/g)||[]).length===3,"expected three setting selects"); ok(/<label class="fab-card-title" for="theme-mode-select">Appearance<\/label>/.test(s),"appearance label missing"); ok(/<label class="fab-card-title" for="season-select">Season<\/label>/.test(s),"season label missing"); ok(/<label class="fab-card-title" for="display-size-select">Display Size<\/label>/.test(s),"display label missing"); [["light","☀️ Light"],["dark","🌙 Dark"],["auto","🖥️ System"],["spring","🌱 Spring"],["summer","🏖️ Summer"],["fall","🍁 Fall"],["winter","❄️ Winter"],["0","S Small"],["1","M Medium"],["2","L Large"]].forEach(function(x){ok(s.indexOf("value=\""+x[0]+"\">"+x[1]+"</option>")>=0,"option missing: "+x[1]);}); ok(s.indexOf("themeModeSelect.value = mode;")>=0,"appearance synchronization missing"); ok(s.indexOf("seasonSelect.value = choice;")>=0,"season synchronization missing"); ok(s.indexOf("displaySizeSelect.value = String(step);")>=0,"display synchronization missing"); ok((s.match(/\.addEventListener\('change'/g)||[]).length>=3,"change listeners missing"); ok(s.indexOf("themeModeButtons")<0&&s.indexOf("seasonButtons")<0&&s.indexOf("displaySizeButtons")<0,"retired button state remains"); "native settings contract passes"'
```

Expected: FAIL with `expected three setting selects` because the current implementation still uses segmented buttons.

- [ ] **Step 2: Replace the three setting groups with labeled native selects**

Replace the three setting cards with:

```html
<div class="fab-card setting-control-wrap">
  <label class="fab-card-title" for="theme-mode-select">Appearance</label>
  <select id="theme-mode-select" class="setting-select">
    <option value="light">☀️ Light</option>
    <option value="dark">🌙 Dark</option>
    <option value="auto">🖥️ System</option>
  </select>
</div>
<div class="fab-card setting-control-wrap">
  <label class="fab-card-title" for="season-select">Season</label>
  <select id="season-select" class="setting-select">
    <option value="auto">🗓️ Auto</option>
    <option value="spring">🌱 Spring</option>
    <option value="summer">🏖️ Summer</option>
    <option value="fall">🍁 Fall</option>
    <option value="winter">❄️ Winter</option>
  </select>
</div>
<div class="fab-card setting-control-wrap">
  <label class="fab-card-title" for="display-size-select">Display Size</label>
  <select id="display-size-select" class="setting-select">
    <option value="0">S Small</option>
    <option value="1">M Medium</option>
    <option value="2">L Large</option>
  </select>
</div>
```

Do not add `selected` attributes. The current State values are authoritative and will be reflected by JavaScript during initialization.

- [ ] **Step 3: Replace segmented-button CSS with one overflow-safe native style**

Remove `.theme-mode-wrap`, `.theme-mode-label`, `.theme-mode-control`, `.season-control`, `.theme-mode-button`, `.setting-emoji`, and `.display-size-wrap` rules that exist only for the retired controls. Add:

```css
.setting-control-wrap {
  display: grid;
  gap: var(--display-panel-gap);
  min-width: 0;
}
.setting-select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: var(--display-segment-height);
  border: 1px solid var(--border2);
  border-radius: var(--radius-sm);
  background: var(--pill-bg);
  color: var(--fg);
  font: inherit;
  font-size: var(--display-control-font-size);
  line-height: 1.2;
  padding: 0 var(--display-control-pad-x);
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.setting-select:hover {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border2));
}
.setting-select:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
  outline: none;
}
.setting-select option {
  background: var(--surface);
  color: var(--fg);
}
```

Keep the browser's native arrow and native picker by not setting `appearance: none`. Remove the obsolete mobile `.season-control .theme-mode-button` override. In the existing `html.theme-transitioning` selector list, replace the retired settings selectors with `.setting-select`.

- [ ] **Step 4: Synchronize Appearance through the native select**

Replace the appearance button collection with:

```javascript
var themeModeSelect = document.getElementById('theme-mode-select');
```

Inside `applyThemeMode()`, replace the button loop with:

```javascript
if (themeModeSelect) themeModeSelect.value = mode;
```

Replace the button listener loop with:

```javascript
if (themeModeSelect) {
  themeModeSelect.addEventListener('change', function (event) {
    event.stopPropagation();
    applyThemeMode(themeModeSelect.value);
  });
}
```

Leave `resolveThemeMode()`, media-query handling, transition timing, `updateThemeColor()`, and `State.setThemeMode()` unchanged.

- [ ] **Step 5: Synchronize Season through the native select**

Replace the season button collection with:

```javascript
var seasonSelect = document.getElementById('season-select');
```

Inside `renderSeason()`, replace the button loop with:

```javascript
if (seasonSelect) seasonSelect.value = choice;
```

Replace the button listener loop with:

```javascript
if (seasonSelect) {
  seasonSelect.addEventListener('change', function (event) {
    event.stopPropagation();
    var choice = seasonSelect.value;
    State.setSeason(choice);
    renderSeason(choice);
  });
}
```

Leave the astronomical-season boundaries, `visibilitychange` refresh, theme transition, palette resolution, and stored values unchanged.

- [ ] **Step 6: Synchronize Display Size through the native select**

Replace the display-size button collection with:

```javascript
var displaySizeSelect = document.getElementById('display-size-select');
```

Inside `applyDisplayStep()`, replace the button loop with:

```javascript
if (displaySizeSelect) displaySizeSelect.value = String(step);
```

Replace the button listener loop with:

```javascript
if (displaySizeSelect) {
  displaySizeSelect.addEventListener('change', function (event) {
    event.stopPropagation();
    applyDisplayStep(displaySizeSelect.value);
  });
}
```

Leave the existing clamping, CSS variable updates, persistence, bottom-clearance update, and marquee measurement unchanged.

- [ ] **Step 7: Run strict source, syntax, and whitespace checks**

Re-run the Step 1 contract exactly.

Then run:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m) throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check -- bible.html
```

Expected: `native settings contract passes`, `bible inline JavaScript parses`, and no whitespace errors.

- [ ] **Step 8: Commit the implementation**

```bash
git add bible.html
git commit -S -m "fix: use native Bible settings menus"
```

### Task 2: Verify native behavior and responsive geometry

**Files:**
- Verify: `bible.html`

- [ ] **Step 1: Open the app and inspect the initial settings state**

Use the in-app browser to open `bible.html`, wait for Bible data to finish loading, and open the menu.

Expected: exactly three settings cards appear in order—Appearance, Season, Display Size—and each contains one full-width native select. Every displayed choice matches the value already stored by the app.

- [ ] **Step 2: Exercise every value and persistence path**

Choose each Appearance value, each Season value, and each Display Size value once. End with Appearance `System`, Season `Auto`, and Display Size `Large`. Close and reopen the menu, reload the page, and reopen it again.

Expected: every choice applies immediately, the page remains interactive during theme transitions, the select displays the applied choice, and the final three values survive menu reopening and reload. Appearance `System` continues to follow the OS preference; Season `Auto` continues to resolve astronomically without changing the displayed `Auto` choice.

- [ ] **Step 3: Verify mobile and enlarged-layout bounds**

At 320 px and 390 px viewport widths with Display Size set to Large, inspect each select and its card using bounding rectangles.

Run in the browser console for each width:

```javascript
Array.from(document.querySelectorAll('.setting-select')).map(function (select) {
  var selectBox = select.getBoundingClientRect();
  var cardBox = select.closest('.fab-card').getBoundingClientRect();
  return {
    id: select.id,
    insideLeft: selectBox.left >= cardBox.left,
    insideRight: selectBox.right <= cardBox.right,
    width: selectBox.width,
    cardWidth: cardBox.width
  };
});
```

Expected: all `insideLeft` and `insideRight` values are `true`; no setting label, closed select value, settings card, or panel creates horizontal scrolling or wrapping.

- [ ] **Step 4: Verify keyboard, focus, and native picker behavior**

Tab through all three controls, change options with the keyboard, then activate each control by touch/click.

Expected: focus order follows the visual order, each label is announced with the select, focus is clearly visible in every seasonal light/dark palette, and touch/click opens the operating system's native picker rather than a project popover.

- [ ] **Step 5: Check leaks, security scope, and unrelated behavior**

Change all three settings repeatedly, close/reopen the panel ten times, and inspect the DOM and console.

Expected: the DOM still contains exactly three `.setting-select` elements, no retired setting buttons, no duplicate event effects, no console errors, and no network request caused solely by opening a picker. Confirm that only fixed `<option>` values reach the existing normalization functions and that no HTML is constructed from a selected value.

- [ ] **Step 6: Run the final verification set**

Run:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m) throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check
git status --short
```

Expected: JavaScript parses, no whitespace errors are reported, and only the user's known untracked files remain. Review the final diff to confirm there are no Firebase, service-worker, Bible-data, or unrelated reader changes.
