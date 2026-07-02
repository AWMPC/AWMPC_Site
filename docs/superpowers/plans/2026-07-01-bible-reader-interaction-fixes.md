# Bible Reader Interaction Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give keyboard and mouse verse selection the same single highlight, shrink verse-container spacing only below 100% Text Scale, and restore reliable native mobile chapter swiping.

**Architecture:** Keep the single-file SPA and its existing reader state machine. Add narrowly scoped CSS variables and pure helpers around the existing Text Scale and pointer paths, preserving current chapter navigation, long-press, history, and position-recall behavior.

**Tech Stack:** HTML, CSS custom properties, browser JavaScript, JXA source/runtime contracts, and rendered in-app browser acceptance.

---

## File Structure

- Modify `bible.html`: reader focus styling, verse-only spacing variables, Text Scale application, reader-view gesture ownership, and swipe qualification.
- Verify `bible.html`: self-contained JXA contracts run against the real inline CSS/JavaScript; no Node test framework or dependency is added.

### Task 1: Unify Keyboard and Mouse Verse Highlighting

**Files:**
- Modify: `bible.html:794-802`
- Test: `bible.html` via the JXA contract below

- [ ] **Step 1: Run the failing focus-parity contract**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var css=s.match(/<style>([\s\S]*?)<\/style>/)[1]; function ok(v,m){if(!v)throw new Error(m);} ok(/\.verse\.active:focus-visible\s*\{[^}]*outline:\s*none/.test(css),"active keyboard verse still has a second outline"); ok(/\.verse:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--accent\)/.test(css),"inactive defensive focus indicator was removed"); "verse focus parity contract passes"'
```

Expected: FAIL with `active keyboard verse still has a second outline`.

- [ ] **Step 2: Add the narrow active-focus override**

Immediately after the existing `.verse:focus-visible` rule, add:

```css
  .verse.active:focus-visible {
    outline: none;
  }
```

Do not change the `.verse.active` border, background, shadow, or any global focus rule.

- [ ] **Step 3: Run the focus-parity contract again**

Run the exact command from Step 1.

Expected: `verse focus parity contract passes`.

- [ ] **Step 4: Verify inline JavaScript and whitespace**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check -- bible.html
```

Expected: JavaScript parses and `git diff --check` exits 0.

- [ ] **Step 5: Commit the focus fix**

```bash
git add bible.html
git commit -S -m "fix: unify Bible verse focus styling"
```

### Task 2: Scale Verse Spacing Only Below 100%

**Files:**
- Modify: `bible.html:14-35`
- Modify: `bible.html:782-792`
- Modify: `bible.html:1193-1207`
- Modify: `bible.html:2191-2202`
- Test: `bible.html` via source and extracted-runtime JXA contracts

- [ ] **Step 1: Run the failing verse-spacing source contract**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} ["--verse-margin-bottom","--verse-radius","--verse-pad-y","--verse-pad-x","--verse-open-pad-y","--verse-open-pad-x"].forEach(function(n){ok(s.indexOf(n)>=0,"missing "+n);}); ok(/\.verse\s*\{[^}]*margin-bottom:\s*var\(--verse-margin-bottom\)[^}]*border-radius:\s*var\(--verse-radius\)[^}]*padding:\s*var\(--verse-pad-y\) var\(--verse-pad-x\)/.test(s),"verse does not use spacing variables"); ok(/\.verse\.footnotes-open\s*\{[^}]*padding:\s*var\(--verse-open-pad-y\) var\(--verse-open-pad-x\)/.test(s),"open footnotes do not use spacing variables"); "verse spacing source contract passes"'
```

Expected: FAIL with `missing --verse-margin-bottom`.

- [ ] **Step 2: Define default verse spacing variables**

Add after `--reader-line-height` in `:root`:

```css
    --verse-margin-bottom: 12px;
    --verse-radius: 20px;
    --verse-pad-y: 8px;
    --verse-pad-x: 10px;
    --verse-open-pad-y: 10px;
    --verse-open-pad-x: 12px;
```

- [ ] **Step 3: Route the verse container through the variables**

Replace the fixed declarations with:

```css
  .verse {
    margin-bottom: var(--verse-margin-bottom); font-size: var(--reader-font-size); line-height: var(--reader-line-height); position: relative;
    border-radius: var(--verse-radius); padding: var(--verse-pad-y) var(--verse-pad-x); border: 2px solid transparent;
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, padding 0.2s ease, border-width 0.2s ease;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .verse.footnotes-open {
    border-width: 3px;
    padding: var(--verse-open-pad-y) var(--verse-open-pad-x);
    background: color-mix(in srgb, var(--pill-bg) 72%, transparent);
  }
```

- [ ] **Step 4: Run the verse-spacing source contract again**

Run the exact command from Step 1.

Expected: `verse spacing source contract passes`.

- [ ] **Step 5: Run the failing spacing-runtime contract**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var constants=s.match(/var BASE_VERSE_SPACING = \{[\s\S]*?\};/); var helper=s.match(/function verseSpacingForScale\(scale\) \{[\s\S]*?\n  \}/); ok(constants&&helper,"verse spacing runtime missing"); eval(constants[0]+"\n"+helper[0]); var expected={50:[6,10,4,5,5,6],75:[9,15,6,7.5,7.5,9],100:[12,20,8,10,10,12],125:[12,20,8,10,10,12],150:[12,20,8,10,10,12]}; Object.keys(expected).forEach(function(k){var x=verseSpacingForScale(Number(k)); var got=[x.marginBottom,x.radius,x.padY,x.padX,x.openPadY,x.openPadX]; ok(JSON.stringify(got)===JSON.stringify(expected[k]),"spacing mismatch at "+k+": "+got);}); "verse spacing runtime contract passes"'
```

Expected: FAIL with `verse spacing runtime missing`.

- [ ] **Step 6: Add a pure verse-spacing helper**

After `BASE_TEXT_PIXELS`, add:

```javascript
  var BASE_VERSE_SPACING = {
    marginBottom: 12,
    radius: 20,
    padY: 8,
    padX: 10,
    openPadY: 10,
    openPadX: 12
  };

  function verseSpacingForScale(scale) {
    var factor = Math.min(scale, 100) / 100;
    var result = {};
    Object.keys(BASE_VERSE_SPACING).forEach(function (key) {
      result[key] = BASE_VERSE_SPACING[key] * factor;
    });
    return result;
  }
```

- [ ] **Step 7: Apply verse spacing with Text Scale**

In `applyTextScale()`, immediately after the `BASE_TEXT_PIXELS.forEach` block, add:

```javascript
    var verseSpacing = verseSpacingForScale(scale);
    document.documentElement.style.setProperty('--verse-margin-bottom', verseSpacing.marginBottom + 'px');
    document.documentElement.style.setProperty('--verse-radius', verseSpacing.radius + 'px');
    document.documentElement.style.setProperty('--verse-pad-y', verseSpacing.padY + 'px');
    document.documentElement.style.setProperty('--verse-pad-x', verseSpacing.padX + 'px');
    document.documentElement.style.setProperty('--verse-open-pad-y', verseSpacing.openPadY + 'px');
    document.documentElement.style.setProperty('--verse-open-pad-x', verseSpacing.openPadX + 'px');
```

Do not alter any `--display-*` geometry variable or border width.

- [ ] **Step 8: Run the spacing contracts and prior Text Scale contract**

Run the exact commands from Task 2 Steps 1 and 5, then run:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var constants=s.match(/var TEXT_SCALE_VALUES = \[[\s\S]*?var BASE_VERSE_SPACING = \{[\s\S]*?\};/); var normalizer=s.match(/function normalizeTextScale\(value\) \{[\s\S]*?\n  \}/); var helper=s.match(/function verseSpacingForScale\(scale\) \{[\s\S]*?\n  \}/); var apply=s.match(/function applyTextScale\(value, persist\) \{[\s\S]*?\n  \}/); ok(constants&&normalizer&&helper&&apply,"Text Scale application runtime missing"); eval(constants[0]+"\n"+normalizer[0]+"\n"+helper[0]+"\n"+apply[0]); var names=["--verse-margin-bottom","--verse-radius","--verse-pad-y","--verse-pad-x","--verse-open-pad-y","--verse-open-pad-x"]; var expected={50:[6,10,4,5,5,6],75:[9,15,6,7.5,7.5,9],100:[12,20,8,10,10,12],125:[12,20,8,10,10,12],150:[12,20,8,10,10,12]}; var writes={}; var document={documentElement:{style:{setProperty:function(name,value){writes[name]=value;}}}}; var textScaleSelect={value:""}; var State={setTextScale:function(){}}; function scheduleBottomChromeClearanceUpdate(){} function scheduleMarqueeMeasure(){} Object.keys(expected).forEach(function(k){writes={}; applyTextScale(Number(k),false); var got=names.map(function(name){return writes[name];}); var want=expected[k].map(function(value){return value+"px";}); ok(JSON.stringify(got)===JSON.stringify(want),"applied spacing mismatch at "+k+": "+got);}); "verse spacing application contract passes"'

osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} ok(/<label class="fab-card-title" for="text-scale-select">Text Scale<\/label>/.test(s),"Text Scale label missing"); var b=s.match(/<select id="text-scale-select" class="setting-select">([\s\S]*?)<\/select>/); var a=[],r=/<option value="([^"]+)">([^<]+)<\/option>/g,m; while((m=r.exec(b[1])))a.push([m[1],m[2]]); ok(JSON.stringify(a)===JSON.stringify([["50","50%"],["75","75%"],["100","100%"],["125","125%"],["150","150%"]]),"Text Scale options mismatch"); ok(s.indexOf("DISPLAY_SIZE_STEPS")<0&&s.indexOf("getDisplayStep")<0&&s.indexOf("applyDisplayStep")<0,"retired Display Size code remains"); "prior Text Scale contract passes"'
```

Expected: all four contracts pass. The application contract executes the extracted `applyTextScale()` with a stub document and verifies all six exact CSS property writes at every supported scale.

- [ ] **Step 9: Commit the spacing fix**

```bash
git add bible.html
git commit -S -m "fix: scale Bible verse spacing down"
```

### Task 3: Restore Native Mobile Chapter Swiping

**Files:**
- Modify: `bible.html:702-712`
- Modify: `bible.html:1923-1927`
- Modify: `bible.html:3670-4060`
- Modify: `bible.html:4388-4401`
- Test: `bible.html` via source and extracted-runtime JXA contracts

- [ ] **Step 1: Run the failing gesture-ownership contract**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var q=String.fromCharCode(39); ok(/\.view-inner\.reader-gestures\s*\{[^}]*touch-action:\s*pan-y/.test(s),"reader does not preserve vertical pan and horizontal pointer delivery"); ok(s.indexOf("function setUIView(nextView)")>=0,"view gesture ownership helper missing"); ok(s.split("setUIView("+q+"verses"+q+")").length-1===1,"verses gesture state is not set exactly once"); ["books","chapters","verse-picker","search"].forEach(function(v){ok(s.indexOf("setUIView("+q+v+q+")")>=0,"missing view state: "+v);}); "reader gesture ownership contract passes"'
```

Expected: FAIL with `reader does not preserve vertical pan and horizontal pointer delivery`.

- [ ] **Step 2: Add native reader gesture ownership CSS**

After `.view-inner` add:

```css
  .view-inner.reader-gestures { touch-action: pan-y; }
```

Do not use `touch-action: none`; vertical scrolling must remain native.

- [ ] **Step 3: Synchronize gesture ownership with UI view state**

Immediately after `var uiView = 'books';`, add:

```javascript
  function setUIView(nextView) {
    uiView = nextView;
    viewInner.classList.toggle('reader-gestures', nextView === 'verses');
  }
```

Replace the five direct assignments:

```javascript
    setUIView('books');
    setUIView('chapters');
    setUIView('verse-picker');
    setUIView('verses');
    setUIView('search');
```

Each replacement stays in its corresponding existing view renderer. No navigation order or history call changes.

- [ ] **Step 4: Run the gesture-ownership contract again**

Run the exact command from Step 1.

Expected: `reader gesture ownership contract passes`.

Run the extracted-runtime ownership contract and its negative control:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var helper=s.match(/function setUIView\(nextView\) \{[\s\S]*?\n  \}/); ok(helper,"view helper missing"); function verify(source){var calls=[],viewInner={classList:{toggle:function(name,enabled){calls.push([name,enabled]);}}}; var api=Function("viewInner","var uiView=\"initial\";"+source+";return {set:setUIView,get:function(){return uiView;}};")(viewInner); ["books","chapters","verse-picker","search","verses"].forEach(function(view){calls=[]; api.set(view); ok(api.get()===view,"uiView mismatch: "+view); ok(calls.length===1,"toggle count mismatch: "+view); ok(calls[0][0]==="reader-gestures","toggle class mismatch: "+view); ok(calls[0][1]===(view==="verses"),"toggle state mismatch: "+view);});} verify(helper[0]); var failed=false; try{verify(helper[0].replace(/\s*viewInner\.classList\.toggle\([^;]+;/,""));}catch(err){failed=true;} ok(failed,"ownership negative control did not fail"); "reader gesture ownership runtime contract passes; removed-toggle mutation rejected"'
```

Expected: the actual helper updates `uiView`, enables reader gesture ownership only for verses, and the removed-toggle mutation fails verification.

- [ ] **Step 5: Run the failing swipe-qualification contract**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var helper=s.match(/function readerSwipeDirection\(dx, dy, hasSelection\) \{[\s\S]*?\n  \}/); ok(helper,"swipe helper missing"); eval(helper[0]); [[-72,0,false,1],[72,0,false,-1],[-120,80,false,1],[120,80,false,-1],[-71,0,false,0],[72,58,false,0],[-120,0,true,0]].forEach(function(c){ok(readerSwipeDirection(c[0],c[1],c[2])===c[3],"swipe mismatch: "+c);}); ok(/var direction = readerSwipeDirection\(dx, dy, hasSelection\);[\s\S]*?if \(direction\)[\s\S]*?showAdjacentChapter\(direction\)/.test(s),"pointerup does not use swipe helper exactly once"); "reader swipe qualification contract passes"'
```

Expected: FAIL with `swipe helper missing`.

- [ ] **Step 6: Extract swipe qualification into a pure helper**

Immediately before `clearReaderPointerState()`, add:

```javascript
  function readerSwipeDirection(dx, dy, hasSelection) {
    if (hasSelection) return 0;
    if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.25) return 0;
    return dx < 0 ? 1 : -1;
  }
```

- [ ] **Step 7: Use the helper in pointer completion**

Replace the current inline swipe condition in `pointerup` with:

```javascript
    var direction = readerSwipeDirection(dx, dy, hasSelection);
    if (direction) {
      e.preventDefault();
      suppressFollowingReaderClick(e, state.verse || state.target);
      showAdjacentChapter(direction);
      return;
    }
```

Leave interactive-descendant exclusions, text-selection detection, pointer cancellation, long-press cancellation, and tap handling unchanged.

- [ ] **Step 8: Run both swipe contracts and syntax checks**

Run the exact commands from Task 3 Steps 1 and 5, then:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var helper=s.match(/function readerSwipeDirection\(dx, dy, hasSelection\) \{[\s\S]*?\n  \}/); var handler=s.match(/document\.addEventListener\(\x27pointerup\x27,[\s\S]*?\n  \}\);(?=\n  document\.addEventListener\(\x27pointercancel\x27)/); ok(helper&&handler,"swipe runtime source missing"); function verify(source){var captured=null,calls=[],window={getSelection:function(){return {isCollapsed:true};}},document={addEventListener:function(name,callback){ok(name==="pointerup","wrong event");captured=callback;}}; function clearReaderPointerState(){} function suppressFollowingReaderClick(){} function showAdjacentChapter(direction){calls.push(direction);} function toggleAllVerseFootnotes(){} function setActiveVerse(){} var api=Function("document","window","clearReaderPointerState","suppressFollowingReaderClick","showAdjacentChapter","toggleAllVerseFootnotes","setActiveVerse","var readerPointerState=null;"+helper[0]+";"+source+";return {setState:function(value){readerPointerState=value;}};")(document,window,clearReaderPointerState,suppressFollowingReaderClick,showAdjacentChapter,toggleAllVerseFootnotes,setActiveVerse); ok(captured,"pointerup callback missing"); function run(x,y,selected){calls=[]; api.setState({id:7,x:100,y:100,moved:false,verse:null,target:{}}); window.getSelection=function(){return {isCollapsed:!selected};}; captured({pointerId:7,clientX:x,clientY:y,preventDefault:function(){}}); return calls.slice();} [[28,100,false,[1]],[172,100,false,[-1]],[29,100,false,[]],[28,158,false,[]],[28,100,true,[]]].forEach(function(c){var got=run(c[0],c[1],c[2]);ok(JSON.stringify(got)===JSON.stringify(c[3]),"pointerup calls mismatch: "+c+" got "+got);});} verify(handler[0]); function rejects(source,label){var failed=false;try{verify(source);}catch(err){failed=true;}ok(failed,label+" mutation was not rejected");} rejects(handler[0].replace("      showAdjacentChapter(direction);",""),"removed call"); rejects(handler[0].replace("      showAdjacentChapter(direction);","      showAdjacentChapter(direction);\n      showAdjacentChapter(direction);"),"duplicated call"); "reader pointerup runtime contract passes; removed and duplicated calls rejected"'
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check -- bible.html
```

Expected: both gesture contracts pass; the actual pointerup callback invokes one adjacent chapter for qualifying left/right swipes and none for rejected gestures; removed and duplicated calls fail verification; JavaScript parses; and the diff check exits 0.

- [ ] **Step 9: Commit the swipe fix**

```bash
git add bible.html
git commit -S -m "fix: restore Bible chapter swiping"
```

### Task 4: Rendered Acceptance and Final Audit

**Files:**
- Verify: `bible.html`

- [ ] **Step 1: Start a loopback server in the implementation worktree**

```bash
python3 -m http.server 8768 --bind 127.0.0.1
```

Open `http://127.0.0.1:8768/bible.html` with the in-app browser. Use the existing untracked `bible.json` only as a temporary runtime fixture; do not add or commit it.

- [ ] **Step 2: Verify focus parity in a rendered chapter**

Navigate to a chapter, click a verse, then use Arrow Up and Arrow Down.

Expected: mouse and keyboard-selected active verses have the same computed border, background, shadow, and no additional outline. Keyboard arrows still move and center the active verse.

- [ ] **Step 3: Verify rendered verse spacing at all scales**

Measure a normal verse and an open-footnote verse at 50%, 75%, 100%, 125%, and 150%.

Expected computed values:

| Scale | Margin | Radius | Normal padding | Open padding |
|---|---:|---:|---:|---:|
| 50% | 6px | 10px | 4px 5px | 5px 6px |
| 75% | 9px | 15px | 6px 7.5px | 7.5px 9px |
| 100% | 12px | 20px | 8px 10px | 10px 12px |
| 125% | 12px | 20px | 8px 10px | 10px 12px |
| 150% | 12px | 20px | 8px 10px | 10px 12px |

Expected: verse border widths remain 2px normally and 3px with footnotes open; fixed UI controls remain 48px tall.

- [ ] **Step 4: Verify mobile gestures at 320px**

Set the browser viewport to 320×844. In a scripture chapter:

1. Swipe left over inactive verse text: exactly one next-chapter navigation.
2. Swipe right over active verse text: exactly one previous-chapter navigation and recalled verse position.
3. Scroll vertically: no chapter navigation.
4. Tap a footnote control: it toggles normally and does not navigate.
5. Select text and move horizontally: no chapter navigation.

Expected: all five behaviors pass at both 50% and 150%, with `document.documentElement.scrollWidth === document.documentElement.clientWidth`.

- [ ] **Step 5: Inspect browser health and resource behavior**

Inspect browser console warnings/errors and the DOM after repeated scale changes and swipes.

Expected: no relevant warning or error; one reader pointer listener set, no accumulating DOM nodes, no extra network request, and no retained long-press timer after pointer completion/cancellation.

- [ ] **Step 6: Run the complete source contract set**

Run every JXA command from Tasks 1–3, then:

```bash
git diff --check
git status --short
git log --show-signature -3 --format='%h %G? %s'
```

Expected: all contracts pass, no whitespace error, only intended tracked changes, and each implementation commit reports a good signature.

- [ ] **Step 7: Perform the changed-code security and memory scan**

```bash
git diff HEAD~3..HEAD -- bible.html | rg '^\+.*(fetch\(|XMLHttpRequest|setInterval|innerHTML|outerHTML|insertAdjacentHTML|eval\()' || true
git diff HEAD~3..HEAD -- bible.html | rg '^\+.*(addEventListener|setTimeout|requestAnimationFrame)' || true
```

Expected: no new network, HTML-injection, or dynamic-code execution path. No new event listener, timer, or animation-frame loop is added; the changes reuse existing pointer handlers.

- [ ] **Step 8: Stop the server and clean temporary runtime data**

Stop the loopback server, remove only any temporary worktree copy of `bible.json`, reset the browser viewport, and close the QA tab.

Expected: implementation worktree is clean and the main worktree's existing untracked files remain untouched.
