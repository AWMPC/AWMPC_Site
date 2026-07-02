# Bible Text Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Display Size with a five-value Text Scale that scales every visible string from 50% to 150% while leaving UI geometry fixed at the current 100% dimensions.

**Architecture:** Keep the single-file SPA and compatibility storage/cloud field. Normalize old indices and Boolean values into percentages, drive all typography through scale-aware CSS variables, and stop mutating geometry variables when the preference changes.

**Tech Stack:** Static HTML, CSS custom properties, ES5-style browser JavaScript, native `<select>`, JavaScript for Automation contracts, and rendered in-app browser acceptance.

---

## File map

- Modify `bible.html`: Text Scale markup, semantic typography variables, state migration, cloud normalization, and runtime application.
- Do not modify `bible.json`, service-worker behavior, Firebase field names, dependencies, or unrelated reader interactions.
- Do not add Node infrastructure. Use actual-source contracts and rendered acceptance.

### Task 1: Introduce percentage state and migration

**Files:**
- Modify: `bible.html:14-25`
- Modify: `bible.html:1138-1144`
- Modify: `bible.html:1179-1184`
- Modify: `bible.html:1443-1450`
- Modify: `bible.html:1684-1692`
- Modify: `bible.html:1797-1802`
- Modify: `bible.html:2157-2184`
- Modify: all hydration calls to the renamed getter/application functions

- [ ] **Step 1: Run a failing markup/state contract**

Run this actual-source check:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} ok(/<label class="fab-card-title" for="text-scale-select">Text Scale<\/label>/.test(s),"Text Scale label missing"); var block=s.match(/<select id="text-scale-select" class="setting-select">([\s\S]*?)<\/select>/); ok(block,"Text Scale select missing"); var a=[],r=/<option value="([^"]+)">([^<]+)<\/option>/g,m; while((m=r.exec(block[1])))a.push([m[1],m[2]]); ok(JSON.stringify(a)===JSON.stringify([["50","50%"],["75","75%"],["100","100%"],["125","125%"],["150","150%"]]),"Text Scale options mismatch"); ok(s.indexOf("function normalizeTextScale(")>=0,"normalizer missing"); ok(s.indexOf("getTextScale: function")>=0&&s.indexOf("setTextScale: function")>=0,"Text Scale state API missing"); ok(s.indexOf("applyTextScale(State.getTextScale(), false)")>=0,"Text Scale initialization missing"); ok(s.indexOf("DISPLAY_SIZE_STEPS")<0&&s.indexOf("getDisplayStep")<0&&s.indexOf("applyDisplayStep")<0,"retired Display Size implementation remains"); "Text Scale markup/state contract passes"'
```

Expected: FAIL with `Text Scale label missing`.

- [ ] **Step 2: Add fixed 100% geometry and semantic typography variables**

Keep the existing geometry variables at their current Medium values. Replace the two direct font values and add this complete semantic set in `:root`:

```css
--text-12: 12px;
--text-13: 13px;
--text-14: 14px;
--text-15: 15px;
--text-16: 16px;
--text-17: 17px;
--text-18: 18px;
--text-20: 20px;
--text-22: 22px;
--reader-font-size: var(--text-20);
--reader-line-height: 1.8;
--display-control-font-size: var(--text-20);
--display-control-height: 48px;
--display-icon-button-size: 48px;
--display-control-pad-y: 8px;
--display-control-pad-x: 12px;
--display-segment-height: 48px;
--display-panel-padding: 12px;
--display-panel-gap: 8px;
--display-nav-padding: 6px;
```

Add `font-size: var(--text-16);` to `body`. This scales text that previously inherited the browser's 16px default.

- [ ] **Step 3: Replace the dropdown with plain percentage choices**

Use this exact markup:

```html
<div class="fab-card setting-control-wrap">
  <label class="fab-card-title" for="text-scale-select">Text Scale</label>
  <select id="text-scale-select" class="setting-select">
    <option value="50">50%</option>
    <option value="75">75%</option>
    <option value="100">100%</option>
    <option value="125">125%</option>
    <option value="150">150%</option>
  </select>
</div>
```

Do not add emoji or a hardcoded `selected` attribute.

- [ ] **Step 4: Replace the preset array with percentage normalization**

Use:

```javascript
var TEXT_SCALE_VALUES = [50, 75, 100, 125, 150];
var DEFAULT_TEXT_SCALE = 100;
var LEGACY_DISPLAY_STEP_TO_SCALE = { 0: 75, 1: 100, 2: 125 };
var BASE_TEXT_PIXELS = [12, 13, 14, 15, 16, 17, 18, 20, 22];

function normalizeTextScale(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  var number = Number(value);
  if (!isFinite(number) || Math.floor(number) !== number) return null;
  if (TEXT_SCALE_VALUES.indexOf(number) !== -1) return number;
  if (Object.prototype.hasOwnProperty.call(LEGACY_DISPLAY_STEP_TO_SCALE, number)) {
    return LEGACY_DISPLAY_STEP_TO_SCALE[number];
  }
  return null;
}
```

This accepts native-select strings, new numeric percentages, and old `0/1/2` indices without accepting partial numeric strings.

- [ ] **Step 5: Rename and migrate the State API**

Replace the old getter/setter with:

```javascript
getTextScale: function () {
  var stored = normalizeTextScale(this._get('bible_font_step', null));
  if (stored !== null) return stored;
  var legacyLarge = this._get('bible_large_font', null);
  if (legacyLarge === true) return 125;
  if (legacyLarge === false) return 100;
  return DEFAULT_TEXT_SCALE;
},
setTextScale: function (value) {
  var scale = normalizeTextScale(value);
  this._set('bible_font_step', scale === null ? DEFAULT_TEXT_SCALE : scale);
  try { localStorage.removeItem('bible_large_font'); } catch(e) {}
},
```

Keep the compatibility key `bible_font_step`. In `_syncPayload()`, send `font: State.getTextScale()`.

- [ ] **Step 6: Normalize cloud values before storage**

Replace the cloud `font` branches with:

```javascript
if (skippedFields.indexOf('font') === -1 && typeof data.font === 'number') {
  var cloudTextScale = normalizeTextScale(data.font);
  if (cloudTextScale !== null) {
    try { localStorage.setItem('bible_font_step', JSON.stringify(cloudTextScale)); } catch(e) {}
  }
} else if (skippedFields.indexOf('font') === -1 && typeof data.font === 'boolean') {
  try { localStorage.setItem('bible_font_step', JSON.stringify(data.font ? 125 : 100)); } catch(e) {}
}
```

Invalid cloud values do not overwrite a valid local/default value.

- [ ] **Step 7: Replace runtime preset application with text-only application**

Use:

```javascript
var textScaleSelect = document.getElementById('text-scale-select');
function applyTextScale(value, persist) {
  var scale = normalizeTextScale(value);
  if (scale === null) scale = DEFAULT_TEXT_SCALE;
  BASE_TEXT_PIXELS.forEach(function (pixels) {
    var scaled = Math.round(pixels * scale) / 100;
    document.documentElement.style.setProperty('--text-' + pixels, scaled + 'px');
  });
  if (textScaleSelect) textScaleSelect.value = String(scale);
  if (persist !== false) State.setTextScale(scale);
  scheduleBottomChromeClearanceUpdate();
  scheduleMarqueeMeasure();
}
applyTextScale(State.getTextScale(), false);
if (textScaleSelect) {
  textScaleSelect.addEventListener('change', function (event) {
    event.stopPropagation();
    applyTextScale(textScaleSelect.value);
  });
}
```

Remove every geometry `style.setProperty()` from the old application function. Rename all hydration calls from `applyDisplayStep(State.getDisplayStep(), false)` to `applyTextScale(State.getTextScale(), false)`.

- [ ] **Step 8: Run the markup/state contract and migration fixture**

Re-run Step 1. Then run this actual-code migration fixture:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var constants=s.match(/var TEXT_SCALE_VALUES = [\s\S]*?function normalizeTextScale\(value\) \{[\s\S]*?\n\}/); ok(constants,"Text Scale constants missing"); eval(constants[0]); var getterSource=s.match(/getTextScale: function \(\) \{([\s\S]*?)\n    \},\n    setTextScale:/); var setterSource=s.match(/setTextScale: function \(value\) \{([\s\S]*?)\n    \},/); ok(getterSource&&setterSource,"Text Scale State methods missing"); eval("var getter=function(){"+getterSource[1]+"}; var setter=function(value){"+setterSource[1]+"};"); function get(raw,legacy){return getter.call({_get:function(key,fallback){if(key==="bible_font_step")return raw===undefined?fallback:raw;if(key==="bible_large_font")return legacy===undefined?fallback:legacy;return fallback;}});} [[undefined,undefined,100],[0,undefined,75],[1,undefined,100],[2,undefined,125],[50,undefined,50],[75,undefined,75],[100,undefined,100],[125,undefined,125],[150,undefined,150],[999,undefined,100],["100junk",undefined,100],[undefined,false,100],[undefined,true,125]].forEach(function(c){ok(get(c[0],c[1])===c[2],"migration failed: "+c);}); var writes=[],localStorage={removeItem:function(){}}; [50,75,100,125,150,999].forEach(function(v){setter.call({_set:function(key,value){writes.push([key,value]);}},v);}); ok(writes.every(function(w){return w[0]==="bible_font_step"&&TEXT_SCALE_VALUES.indexOf(w[1])!==-1;}),"setter wrote unsupported scale"); "Text Scale migration fixture passes"'
```

Expected: every tuple returns its third value, and `setTextScale()` writes only one of the five allowed percentages.

### Task 2: Route every visible string through Text Scale

**Files:**
- Modify: every `font-size` declaration in `bible.html:340-1087`

- [ ] **Step 1: Run the typography audit and confirm it fails**

Run:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var style=s.match(/<style>([\s\S]*?)<\/style>/)[1],r=/font-size\s*:\s*([^;]+);/g,m,bad=[]; while((m=r.exec(style))){var v=m[1].trim(); if(v!==".7em"&&!/^var\(--(?:text-\d+|reader-font-size|display-control-font-size)\)$/.test(v))bad.push(v);} if(bad.length)throw new Error("unscaled font-size declarations: "+bad.join(", ")); "typography audit passes"'
```

Expected: FAIL listing the existing raw-pixel and `min/max/calc` font sizes.

- [ ] **Step 2: Replace raw typography with semantic scaled values**

Apply this exact baseline mapping everywhere in the stylesheet:

| Current 100% font expression | Replacement |
|---|---|
| `12px` | `var(--text-12)` |
| `13px` | `var(--text-13)` |
| `14px` | `var(--text-14)` |
| `15px` | `var(--text-15)` |
| `16px` | `var(--text-16)` |
| `17px` | `var(--text-17)` |
| `18px` | `var(--text-18)` |
| `20px` | `var(--text-20)` |
| `22px` | `var(--text-22)` |
| `min(var(--display-control-font-size), 22px)` | `var(--display-control-font-size)` |
| `min(max(12px, calc(var(--display-control-font-size) - 5px)), 18px)` | `var(--text-15)` |
| `max(12px, calc(var(--display-control-font-size) - 6px))` | `var(--text-14)` |
| `max(12px, calc(var(--display-control-font-size) - 5px))` | `var(--text-15)` |
| `max(13px, calc(var(--display-control-font-size) - 5px))` | `var(--text-15)` |
| `max(13px, calc(var(--display-control-font-size) - 3px))` | `var(--text-17)` |
| `calc(var(--display-control-font-size) + 2px)` | `var(--text-22)` |
| `max(15px, calc(var(--display-control-font-size) - 2px))` | `var(--text-18)` |
| mobile `min(var(--display-control-font-size), 20px)` | `var(--display-control-font-size)` |
| mobile `min(max(15px, calc(var(--display-control-font-size) - 2px)), 20px)` | `var(--text-18)` |

Apply the mapping only to `font-size` declaration values; identical pixel tokens used by geometry must remain unchanged.

Leave `.verse-num { font-size: .7em; }` unchanged so it remains proportional to scripture. Do not change any width, height, min-height, padding, margin, gap, border, radius, or icon/image dimension.

- [ ] **Step 3: Re-run the typography and geometry contracts**

Re-run the Step 1 audit; expected: `typography audit passes`.

Capture the 100% geometry declarations before and after the change with:

```bash
rg -n -- '--display-control-height: 48px|--display-icon-button-size: 48px|--display-control-pad-y: 8px|--display-control-pad-x: 12px|--display-segment-height: 48px|--display-panel-padding: 12px|--display-panel-gap: 8px|--display-nav-padding: 6px' bible.html
```

Expected: all eight fixed declarations remain present exactly once, and `applyTextScale()` contains no geometry property names.

- [ ] **Step 4: Run syntax, source-scope, and security checks**

Run:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check -- bible.html
git diff --name-only
```

Expected: JavaScript parses, no whitespace errors, and `bible.html` is the only implementation file. Inspect the diff for fixed option values only, one select listener, no new timers, no HTML construction from the value, and no new network/storage key.

- [ ] **Step 5: Commit the implementation**

```bash
git add bible.html
git commit -S -m "feat: add Bible text scaling"
```

### Task 3: Rendered browser acceptance

**Files:**
- Verify: `bible.html`

- [ ] **Step 1: Verify default, ordering, and persistence**

Serve the isolated worktree on a fresh loopback origin and open the settings panel in the in-app browser.

Expected: the label is `Text Scale`; options are exactly `50%, 75%, 100%, 125%, 150%`; no option contains emoji; fresh default is 100%. Select each value and reload after 50%, 100%, and 150%; each selected percentage survives.

- [ ] **Step 2: Verify representative text ratios**

At each scale, read computed font sizes for representative elements: `body`, `.verse`, `.verse-num`, `.floating-nav button`, `.fab-card-title`, `.setting-select`, `.search-input`, `.search-text`, `.footnote-toggle`, `.footnote-body`, and `.verse-actions h2`.

Expected: each 100% baseline font changes by the selected factor, allowing normal subpixel rounding. The verse number remains 70% of the verse font.

- [ ] **Step 3: Verify geometry remains fixed**

At 50%, 100%, and 150%, record bounding rectangles for `#fab-main`, `.setting-select`, `.floating-nav button`, `.bottom-action-button`, and `.search-input`.

Expected: heights, widths governed by their fixed containers, padding, and touch-target dimensions do not change because of Text Scale. Text wrapping or marquee activation may change.

- [ ] **Step 4: Verify mobile extremes**

At a 320px viewport, inspect the app and settings panel at 50% and 150%.

Expected: document `scrollWidth` remains 320px; each settings select stays inside its card; search/history content wraps or truncates without growing controls past the viewport; settings remain operable.

- [ ] **Step 5: Check console, lifecycle, and final contract**

Expected: no relevant app errors; only the pre-existing Firebase persistence deprecation warning may appear. After repeated changes, there is one Text Scale select and one listener effect, no extra DOM nodes or timers, and no extra network request caused by scaling.

Re-run both Task 1 and Task 2 source contracts, inline JavaScript parsing, `git diff --check`, signature verification, and clean-worktree status before branch completion.
