# Bible Settings Auto-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put both automatic appearance/season choices first and make System the Appearance fallback for users without a valid saved or legacy preference.

**Architecture:** Keep the single-file SPA and existing State/application paths. Reorder only the Appearance options and replace the final `getThemeMode()` fallback with the validated `auto` value; saved modern values, legacy Boolean values, cloud hydration, and rendering continue through existing code.

**Tech Stack:** Static HTML, ES5-style browser JavaScript, native `<select>`, JavaScript for Automation contract checks, and rendered in-app browser acceptance.

---

## File map

- Modify `bible.html`: Appearance option order and the final `State.getThemeMode()` fallback.
- Do not modify Season, Display Size, storage keys, Firebase fields, service-worker behavior, data files, or dependencies.
- Do not add Node infrastructure. Use the extracted actual-code contract and rendered browser acceptance.

### Task 1: Align automatic option ordering and default Appearance to System

**Files:**
- Modify: `bible.html:1122-1126`
- Modify: `bible.html:1654-1661`

- [ ] **Step 1: Run the source/state contract and confirm it fails**

Run:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var select=s.match(/<select id="theme-mode-select" class="setting-select">([\s\S]*?)<\/select>/); ok(select,"appearance select missing"); var options=[],r=/<option value="([^"]+)">([^<]+)<\/option>/g,m; while((m=r.exec(select[1])))options.push([m[1],m[2]]); ok(JSON.stringify(options)===JSON.stringify([["auto","🖥️ System"],["light","☀️ Light"],["dark","🌙 Dark"]]),"appearance order/default mismatch"); var method=s.match(/getThemeMode: function \(\) \{([\s\S]*?)\n    \},\n    setThemeMode:/); ok(method,"getThemeMode source missing"); var getThemeMode=Function("return function(){"+method[1]+"}")(); function value(values){return getThemeMode.call({_get:function(key,fallback){return Object.prototype.hasOwnProperty.call(values,key)?values[key]:fallback;}});} ok(value({})==="auto","fresh fallback must be auto"); ok(value({bible_theme_mode:"light"})==="light","saved light changed"); ok(value({bible_theme_mode:"dark"})==="dark","saved dark changed"); ok(value({bible_theme_mode:"auto"})==="auto","saved auto changed"); ok(value({bible_dark:true})==="dark","legacy true changed"); ok(value({bible_dark:false})==="light","legacy false changed"); ok(value({bible_theme_mode:"invalid"})==="auto","invalid fallback must be auto"); "auto-first appearance contract passes"'
```

Expected: FAIL with `appearance order/default mismatch` because System is currently last and the no-preference fallback is Light.

- [ ] **Step 2: Put System first in the Appearance select**

Change only the option order:

```html
<select id="theme-mode-select" class="setting-select">
  <option value="auto">🖥️ System</option>
  <option value="light">☀️ Light</option>
  <option value="dark">🌙 Dark</option>
</select>
```

Do not add a `selected` attribute. `State.getThemeMode()` remains authoritative during initialization and hydration.

- [ ] **Step 3: Make valid automatic appearance the final fallback**

In `State.getThemeMode()`, preserve the modern and legacy checks and change only the final return:

```javascript
getThemeMode: function () {
  var mode = this._get('bible_theme_mode', null);
  if (mode === 'light' || mode === 'dark' || mode === 'auto') return mode;
  var legacyDark = this._get('bible_dark', null);
  if (legacyDark === true) return 'dark';
  if (legacyDark === false) return 'light';
  return 'auto';
},
```

Returning the literal validated value avoids re-reading and returning an invalid modern stored value. Do not persist the fallback from this getter.

- [ ] **Step 4: Run the exact contract and syntax checks**

Re-run the Step 1 command, then run:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m) throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check -- bible.html
```

Expected: `auto-first appearance contract passes`, `bible inline JavaScript parses`, and no whitespace errors. The extracted method checks fresh, saved Light/Dark/System, legacy true/false, and invalid-value behavior against the actual implementation.

- [ ] **Step 5: Inspect security and lifecycle scope**

Run:

```bash
git diff -- bible.html
rg -n 'bible_theme_mode|bible_dark|theme-mode-select|season-select' bible.html
```

Expected: the diff contains exactly one three-option reorder and one fallback-line replacement. There are no new storage writes, listeners, timers, network calls, HTML construction, or user-provided values.

- [ ] **Step 6: Commit the implementation**

```bash
git add bible.html
git commit -S -m "fix: default Bible appearance to system"
```

### Task 2: Verify rendered defaults and compatibility

**Files:**
- Verify: `bible.html`

- [ ] **Step 1: Verify a fresh origin**

Serve the implementation from a new loopback port so the browser origin has no prior local preference, then open `bible.html` and the settings menu in the in-app browser.

Expected: Appearance displays `System` and orders `System, Light, Dark`; Season displays `Auto` and orders `Auto, Spring, Summer, Fall, Winter`. The root light/dark class matches the operating system preference.

- [ ] **Step 2: Verify an explicit choice still wins**

Select Light, reload, and reopen settings; then select Dark, reload, and reopen settings.

Expected: Light and Dark each survive reload and remain selected. Changing the default does not migrate or overwrite an explicit preference.

- [ ] **Step 3: Restore System and check responsive layout**

Select System and inspect the open settings panel at 320 px with Display Size set to Large.

Expected: Appearance remains `System`, Season remains `Auto`, all options are in the approved order, and every `.setting-select` stays inside its card with no horizontal document overflow.

- [ ] **Step 4: Run final source verification**

Run the Step 1 contract again plus:

```bash
git diff --check
git status --short
```

Expected: the exact behavior contract passes, no whitespace errors are reported, and only the user's known untracked files remain outside the isolated implementation scope.
