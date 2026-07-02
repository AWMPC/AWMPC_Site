# Bible Reader Scale and Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make footnote containers and active-verse glows shrink proportionally below 100% Text Scale, and replace the uneven spring chase with the approved half-speed quintic smootherstep centering motion.

**Architecture:** Keep the existing single-file `bible.html` SPA. Extend its current shrink-only reader geometry with one pure detail helper and semantic CSS variables, then replace the spring's velocity state with one bounded requestAnimationFrame interpolation that is cancellable, retargetable, and reduced-motion aware.

**Tech Stack:** HTML, CSS custom properties, browser JavaScript, JXA source/runtime contracts, and rendered in-app browser acceptance. No package, Node runtime, test dependency, network path, or storage schema is added.

---

## File Structure

- Modify `bible.html`: footnote/glow variables and consumers, Text Scale application, verse-centering math and lifecycle.
- Verify `bible.html`: strict self-contained JXA contracts execute extracted production helpers and application code; rendered checks use the existing local server and in-app browser.

### Task 1: Scale Footnote Containers and Active Glow Below 100%

**Files:**
- Modify: `bible.html:1-60`
- Modify: `bible.html:790-855`
- Modify: `bible.html:1200-1230`
- Modify: `bible.html:2220-2240`
- Test: `bible.html` via JXA contracts below

- [ ] **Step 1: Run the failing CSS-consumer contract**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} ["--footnote-indent","--footnote-pad-x","--footnote-visible-margin-top","--footnote-visible-margin-bottom","--footnote-visible-pad-y","--footnote-visible-pad-x","--footnote-radius","--verse-glow-offset-y","--verse-glow-blur","--verse-glow-strength"].forEach(function(n){ok(s.indexOf(n)>=0,"missing "+n);}); ok(/\.verse\.active\s*\{[^}]*box-shadow:\s*0 var\(--verse-glow-offset-y\) var\(--verse-glow-blur\)\s*color-mix\(in srgb,\s*var\(--accent-glow\) var\(--verse-glow-strength\),\s*transparent\)/.test(s),"active glow does not consume scale variables"); ok(/\.footnote-body\s*\{[^}]*margin:\s*0 0 0 var\(--footnote-indent\)[^}]*padding:\s*0 var\(--footnote-pad-x\)[^}]*border-radius:\s*var\(--footnote-radius\)/.test(s),"closed footnote does not consume scale variables"); ok(/\.footnote-body\.visible\s*\{[^}]*margin:\s*var\(--footnote-visible-margin-top\) 0 var\(--footnote-visible-margin-bottom\) var\(--footnote-indent\)[^}]*max-height:\s*40vh[^}]*padding:\s*var\(--footnote-visible-pad-y\) var\(--footnote-visible-pad-x\)[^}]*border-width:\s*1px[^}]*border-left-width:\s*4px/.test(s),"visible footnote geometry or fixed safety values mismatch"); "reader detail CSS contract passes"'
```

Expected: FAIL with `missing --footnote-indent`.

- [ ] **Step 2: Define the semantic defaults and route CSS through them**

Add these defaults beside the existing verse geometry variables in `:root`:

```css
    --footnote-indent: 20px;
    --footnote-pad-x: 12px;
    --footnote-visible-margin-top: 6px;
    --footnote-visible-margin-bottom: 4px;
    --footnote-visible-pad-y: 10px;
    --footnote-visible-pad-x: 12px;
    --footnote-radius: 20px;
    --verse-glow-offset-y: 8px;
    --verse-glow-blur: 28px;
    --verse-glow-strength: 100%;
```

Replace only the relevant fixed values in the three rules:

```css
  .verse.active {
    background: var(--pill-bg);
    border-color: color-mix(in srgb, var(--accent) 55%, transparent);
    box-shadow: 0 var(--verse-glow-offset-y) var(--verse-glow-blur)
      color-mix(in srgb, var(--accent-glow) var(--verse-glow-strength), transparent);
  }
  .footnote-body {
    margin: 0 0 0 var(--footnote-indent); max-height: 0; opacity: 0; overflow: hidden;
    padding: 0 var(--footnote-pad-x); background: var(--note-bg);
    border: 0 solid color-mix(in srgb, var(--note-border) 45%, transparent);
    border-left-width: 0; border-radius: var(--footnote-radius);
    font-size: var(--text-17); color: var(--fg2); line-height: 1.6;
    transform: translateY(-4px);
    transition: opacity 180ms ease, max-height 220ms ease, margin 220ms ease, padding 220ms ease, border-width 220ms ease, transform 220ms ease;
  }
  .footnote-body.visible {
    margin: var(--footnote-visible-margin-top) 0 var(--footnote-visible-margin-bottom) var(--footnote-indent);
    max-height: 40vh; opacity: 1;
    padding: var(--footnote-visible-pad-y) var(--footnote-visible-pad-x);
    border-width: 1px; border-left-width: 4px; transform: translateY(0);
  }
```

Keep the footnote font on `--text-17`, the animation transform at `-4px`, maximum height at `40vh`, and border widths at `1px`/`4px`.

- [ ] **Step 3: Run the CSS-consumer contract again**

Run Task 1 Step 1 exactly.

Expected: `reader detail CSS contract passes`.

- [ ] **Step 4: Run the failing detail-math contract**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var c=s.match(/var BASE_READER_DETAIL = \{[\s\S]*?\};/); var h=s.match(/function readerDetailForScale\(scale\) \{[\s\S]*?\n  \}/); ok(c&&h,"reader detail runtime missing"); eval(c[0]+"\n"+h[0]); var expected={50:[10,6,3,2,5,6,10,4,14,50],75:[15,9,4.5,3,7.5,9,15,6,21,75],100:[20,12,6,4,10,12,20,8,28,100],125:[20,12,6,4,10,12,20,8,28,100],150:[20,12,6,4,10,12,20,8,28,100]}; Object.keys(expected).forEach(function(k){var x=readerDetailForScale(Number(k)); var got=[x.footnoteIndent,x.footnotePadX,x.footnoteVisibleMarginTop,x.footnoteVisibleMarginBottom,x.footnoteVisiblePadY,x.footnoteVisiblePadX,x.footnoteRadius,x.glowOffsetY,x.glowBlur,x.glowStrength]; ok(JSON.stringify(got)===JSON.stringify(expected[k]),"detail mismatch at "+k+": "+got);}); "reader detail math contract passes"'
```

Expected: FAIL with `reader detail runtime missing`.

- [ ] **Step 5: Add the pure detail baseline and shrink-only helper**

Immediately after `verseSpacingForScale()`, add:

```javascript
  var BASE_READER_DETAIL = {
    footnoteIndent: 20,
    footnotePadX: 12,
    footnoteVisibleMarginTop: 6,
    footnoteVisibleMarginBottom: 4,
    footnoteVisiblePadY: 10,
    footnoteVisiblePadX: 12,
    footnoteRadius: 20,
    glowOffsetY: 8,
    glowBlur: 28,
    glowStrength: 100
  };

  function readerDetailForScale(scale) {
    var factor = Math.min(scale, 100) / 100;
    var result = {};
    Object.keys(BASE_READER_DETAIL).forEach(function (key) {
      result[key] = BASE_READER_DETAIL[key] * factor;
    });
    return result;
  }
```

- [ ] **Step 6: Apply all ten detail values in `applyTextScale()`**

After the existing six verse-spacing writes, add:

```javascript
    var readerDetail = readerDetailForScale(scale);
    document.documentElement.style.setProperty('--footnote-indent', readerDetail.footnoteIndent + 'px');
    document.documentElement.style.setProperty('--footnote-pad-x', readerDetail.footnotePadX + 'px');
    document.documentElement.style.setProperty('--footnote-visible-margin-top', readerDetail.footnoteVisibleMarginTop + 'px');
    document.documentElement.style.setProperty('--footnote-visible-margin-bottom', readerDetail.footnoteVisibleMarginBottom + 'px');
    document.documentElement.style.setProperty('--footnote-visible-pad-y', readerDetail.footnoteVisiblePadY + 'px');
    document.documentElement.style.setProperty('--footnote-visible-pad-x', readerDetail.footnoteVisiblePadX + 'px');
    document.documentElement.style.setProperty('--footnote-radius', readerDetail.footnoteRadius + 'px');
    document.documentElement.style.setProperty('--verse-glow-offset-y', readerDetail.glowOffsetY + 'px');
    document.documentElement.style.setProperty('--verse-glow-blur', readerDetail.glowBlur + 'px');
    document.documentElement.style.setProperty('--verse-glow-strength', readerDetail.glowStrength + '%');
```

- [ ] **Step 7: Run the exact application and mutation contract**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var constants=s.match(/var TEXT_SCALE_VALUES = \[[\s\S]*?var BASE_READER_DETAIL = \{[\s\S]*?\};/); var normalizer=s.match(/function normalizeTextScale\(value\) \{[\s\S]*?\n  \}/); var spacing=s.match(/function verseSpacingForScale\(scale\) \{[\s\S]*?\n  \}/); var detail=s.match(/function readerDetailForScale\(scale\) \{[\s\S]*?\n  \}/); var apply=s.match(/function applyTextScale\(value, persist\) \{[\s\S]*?\n  \}/); ok(constants&&normalizer&&spacing&&detail&&apply,"Text Scale detail application runtime missing"); var program=constants[0]+"\n"+normalizer[0]+"\n"+spacing[0]+"\n"+detail[0]+"\n"+apply[0]; function execute(source,scale){var writes={}; var document={documentElement:{style:{setProperty:function(n,v){writes[n]=v;}}}}; var textScaleSelect={value:""}; var State={setTextScale:function(){}}; var scheduleBottomChromeClearanceUpdate=function(){}; var scheduleMarqueeMeasure=function(){}; var run=Function("document","textScaleSelect","State","scheduleBottomChromeClearanceUpdate","scheduleMarqueeMeasure","scale",source+"\napplyTextScale(scale, false);"); run(document,textScaleSelect,State,scheduleBottomChromeClearanceUpdate,scheduleMarqueeMeasure,scale); return writes;} var names=["--footnote-indent","--footnote-pad-x","--footnote-visible-margin-top","--footnote-visible-margin-bottom","--footnote-visible-pad-y","--footnote-visible-pad-x","--footnote-radius","--verse-glow-offset-y","--verse-glow-blur","--verse-glow-strength"]; var expected={50:["10px","6px","3px","2px","5px","6px","10px","4px","14px","50%"],75:["15px","9px","4.5px","3px","7.5px","9px","15px","6px","21px","75%"],100:["20px","12px","6px","4px","10px","12px","20px","8px","28px","100%"],125:["20px","12px","6px","4px","10px","12px","20px","8px","28px","100%"],150:["20px","12px","6px","4px","10px","12px","20px","8px","28px","100%"]}; Object.keys(expected).forEach(function(k){var w=execute(program,Number(k)); var got=names.map(function(n){return w[n];}); ok(JSON.stringify(got)===JSON.stringify(expected[k]),"applied detail mismatch at "+k+": "+got);}); names.forEach(function(name){var quote=String.fromCharCode(39); var needle="document.documentElement.style.setProperty("+quote+name+quote; var mutated=program.replace(needle,"void ("+quote+name+quote); var writes=execute(mutated,50); ok(writes[name]===undefined,"mutation did not remove "+name);}); "reader detail application and mutation contract passes"'
```

Expected: `reader detail application and mutation contract passes`. The second loop proves every required CSS write is observable and independently necessary.

- [ ] **Step 8: Run all Task 1 contracts, parse, and whitespace checks**

Run Task 1 Steps 1, 4, and 7, then:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check -- bible.html
```

Expected: every contract passes, JavaScript parses, and `git diff --check` exits 0.

- [ ] **Step 9: Commit the scale fix**

```bash
git add bible.html
git commit -S -m "fix: scale Bible footnotes and glow"
```

### Task 2: Replace the Spring with Quintic Smootherstep Centering

**Files:**
- Modify: `bible.html:1940-1960`
- Modify: `bible.html:3215-3290`
- Test: `bible.html` via JXA math, lifecycle, and source contracts

- [ ] **Step 1: Run the failing motion-math contract**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var curve=s.match(/function smootherstep\(progress\) \{[\s\S]*?\n  \}/); var duration=s.match(/function verseChaseDurationForDistance\(distance\) \{[\s\S]*?\n  \}/); ok(curve&&duration,"quintic motion helpers missing"); eval(curve[0]+"\n"+duration[0]); ok(smootherstep(0)===0,"curve does not start at 0"); ok(smootherstep(1)===1,"curve does not end at 1"); var previous=0; for(var i=0;i<=1000;i++){var value=smootherstep(i/1000); ok(value>=0&&value<=1,"curve overshot at "+i); ok(value>=previous,"curve is not monotonic at "+i); previous=value;} ok(verseChaseDurationForDistance(0)===350,"zero-distance floor mismatch"); ok(verseChaseDurationForDistance(100)===385,"100px duration mismatch"); ok(verseChaseDurationForDistance(400)===640,"400px duration mismatch"); ok(verseChaseDurationForDistance(1000)===820,"duration cap mismatch"); ok(verseChaseDurationForDistance(-400)===640,"distance must be absolute"); "quintic motion math contract passes"'
```

Expected: FAIL with `quintic motion helpers missing`.

- [ ] **Step 2: Replace velocity state with bounded interpolation state**

Replace the four spring globals with:

```javascript
  var verseChaseFrame = null;
  var verseChaseTarget = null;
  var verseChaseStartTop = 0;
  var verseChaseDestinationTop = 0;
  var verseChaseStartTime = null;
  var verseChaseDuration = 0;
```

Add immediately before `stopVerseChase()`:

```javascript
  function smootherstep(progress) {
    var t = Math.min(1, Math.max(0, progress));
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function verseChaseDurationForDistance(distance) {
    return Math.min(820, Math.max(350, 300 + Math.abs(distance) * 0.85));
  }
```

- [ ] **Step 3: Run the motion-math contract again**

Run Task 2 Step 1 exactly.

Expected: `quintic motion math contract passes`.

- [ ] **Step 4: Run the failing lifecycle/source contract**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} ["verseChaseStartTop","verseChaseDestinationTop","verseChaseStartTime","verseChaseDuration"].forEach(function(n){ok(s.indexOf(n)>=0,"missing state "+n);}); ["verseChaseVelocity","verseChaseLastTs","var pull =","var damping =","var maxSpeed ="].forEach(function(n){ok(s.indexOf(n)<0,"retired spring code remains: "+n);}); var stop=s.match(/function stopVerseChase\(\) \{[\s\S]*?\n  \}/); ok(stop,"stopVerseChase missing"); ["verseChaseFrame = null","verseChaseTarget = null","verseChaseStartTop = 0","verseChaseDestinationTop = 0","verseChaseStartTime = null","verseChaseDuration = 0"].forEach(function(n){ok(stop[0].indexOf(n)>=0,"cleanup omits "+n);}); ok(/function setVerseChaseTarget\(target\)[\s\S]*stopVerseChase\(\);[\s\S]*verseChaseStartTop = viewEl\.scrollTop;[\s\S]*verseChaseDestinationTop = desiredVerseScrollTop\(target\);[\s\S]*requestAnimationFrame\(stepVerseChase\)/.test(s),"retarget does not restart from current position"); ok(/function stepVerseChase\(ts\)[\s\S]*smootherstep\(progress\)[\s\S]*verseChaseStartTop \+ \(\(verseChaseDestinationTop - verseChaseStartTop\) \* eased\)/.test(s),"frame does not interpolate with smootherstep"); ok(/function setVerseChaseTarget\(target\)[\s\S]*shouldReduceVerseMotion\(\)[\s\S]*viewEl\.scrollTop = desiredVerseScrollTop\(target\);[\s\S]*stopVerseChase\(\)/.test(s),"reduced motion is not immediate"); "verse chase lifecycle source contract passes"'
```

Expected: FAIL because the old spring globals and calculations remain.

- [ ] **Step 5: Implement cancellation, retargeting, and frame interpolation**

Replace `stopVerseChase()`, `setVerseChaseTarget()`, and `stepVerseChase()` with:

```javascript
  function stopVerseChase() {
    if (verseChaseFrame) cancelAnimationFrame(verseChaseFrame);
    verseChaseFrame = null;
    verseChaseTarget = null;
    verseChaseStartTop = 0;
    verseChaseDestinationTop = 0;
    verseChaseStartTime = null;
    verseChaseDuration = 0;
  }

  function setVerseChaseTarget(target) {
    if (!target) return;
    if (shouldReduceVerseMotion()) {
      viewEl.scrollTop = desiredVerseScrollTop(target);
      stopVerseChase();
      return;
    }
    stopVerseChase();
    verseChaseTarget = target;
    verseChaseStartTop = viewEl.scrollTop;
    verseChaseDestinationTop = desiredVerseScrollTop(target);
    var distance = verseChaseDestinationTop - verseChaseStartTop;
    if (Math.abs(distance) < 0.5) {
      viewEl.scrollTop = verseChaseDestinationTop;
      stopVerseChase();
      return;
    }
    verseChaseDuration = verseChaseDurationForDistance(distance);
    verseChaseFrame = requestAnimationFrame(stepVerseChase);
  }

  function stepVerseChase(ts) {
    if (!verseChaseTarget || uiView !== 'verses') {
      stopVerseChase();
      return;
    }
    if (verseChaseStartTime === null) verseChaseStartTime = ts;
    var progress = Math.min(1, Math.max(0, (ts - verseChaseStartTime) / verseChaseDuration));
    var eased = smootherstep(progress);
    viewEl.scrollTop = verseChaseStartTop + ((verseChaseDestinationTop - verseChaseStartTop) * eased);
    if (progress >= 1) {
      viewEl.scrollTop = verseChaseDestinationTop;
      stopVerseChase();
      return;
    }
    verseChaseFrame = requestAnimationFrame(stepVerseChase);
  }
```

Keep `releaseVerseChaseForFreeScroll()` and its existing wheel/touch listeners. Calling `stopVerseChase()` before retarget state assignment guarantees at most one scheduled frame and begins from the current scroll position.

- [ ] **Step 6: Run the lifecycle source contract again**

Run Task 2 Step 4 exactly.

Expected: `verse chase lifecycle source contract passes`.

- [ ] **Step 7: Run the deterministic frame-lifecycle contract**

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; function ok(v,m){if(!v)throw new Error(m);} var names=["smootherstep","verseChaseDurationForDistance","stopVerseChase","setVerseChaseTarget","stepVerseChase"]; var pieces=names.map(function(name){var r=new RegExp("function "+name.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&")+"\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}"); var m=s.match(r); ok(m,"missing "+name); return m[0];}); var frames={},next=1,cancelled=[]; function requestAnimationFrame(fn){var id=next++; frames[id]=fn; return id;} function cancelAnimationFrame(id){cancelled.push(id); delete frames[id];} var viewEl={scrollTop:0}; var uiView="verses"; var reduce=false; function shouldReduceVerseMotion(){return reduce;} function desiredVerseScrollTop(target){return target.top;} var verseChaseFrame=null,verseChaseTarget=null,verseChaseStartTop=0,verseChaseDestinationTop=0,verseChaseStartTime=null,verseChaseDuration=0; eval(pieces.join("\n")); var first={top:400}; setVerseChaseTarget(first); ok(Object.keys(frames).length===1,"first target did not schedule one frame"); var firstId=Number(Object.keys(frames)[0]); frames[firstId](0); delete frames[firstId]; ok(Object.keys(frames).length===1,"frame did not reschedule exactly once"); viewEl.scrollTop=100; var second={top:600}; setVerseChaseTarget(second); ok(cancelled.length>=1,"retarget did not cancel prior frame"); ok(Object.keys(frames).length===1,"retarget retained multiple frames"); ok(verseChaseStartTop===100&&verseChaseDestinationTop===600,"retarget did not start from current position"); var id=Number(Object.keys(frames)[0]); frames[id](0); delete frames[id]; id=Number(Object.keys(frames)[0]); frames[id](verseChaseDuration); delete frames[id]; ok(viewEl.scrollTop===600,"animation did not finish exactly at destination"); ok(verseChaseFrame===null&&verseChaseTarget===null&&Object.keys(frames).length===0,"completion retained animation state"); reduce=true; viewEl.scrollTop=10; setVerseChaseTarget({top:250}); ok(viewEl.scrollTop===250&&Object.keys(frames).length===0,"reduced motion scheduled a frame"); reduce=false; setVerseChaseTarget({top:500}); stopVerseChase(); ok(Object.keys(frames).length===0&&verseChaseTarget===null,"explicit cancellation retained work"); "verse chase frame lifecycle contract passes"'
```

Expected: `verse chase frame lifecycle contract passes`.

- [ ] **Step 8: Run all motion contracts, parse, and whitespace checks**

Run Task 2 Steps 1, 4, and 7, then:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check -- bible.html
```

Expected: all contracts pass, JavaScript parses, and `git diff --check` exits 0.

- [ ] **Step 9: Commit the motion fix**

```bash
git add bible.html
git commit -S -m "fix: smooth Bible verse centering"
```

### Task 3: Rendered Regression, Accessibility, Resource, and Security Verification

**Files:**
- Verify: `bible.html`
- Preserve: `.context/`, `.superpowers/`, `IMG_5255.png`, `bible.json`

- [ ] **Step 1: Start the existing static app server**

```bash
python3 -m http.server 61542
```

Expected: the server reports it is serving on port 61542. Leave it running while performing browser checks.

- [ ] **Step 2: Verify scaled footnote geometry and text**

In the in-app browser at `http://localhost:61542/`, open a chapter containing footnotes and inspect 50%, 75%, 100%, 125%, and 150% Text Scale.

Expected:

- footnote text scales at every setting through `--text-17`;
- at 50%, footnote indentation/radius are 10px, closed horizontal padding is 6px, visible margins are `3px 0 2px 10px`, and visible padding is `5px 6px`;
- at 75%, those values are 15px, 9px, `4.5px 0 3px 15px`, and `7.5px 9px`;
- 100%, 125%, and 150% retain the baseline container geometry;
- visible borders remain 1px/4px, the open body remains capped at 40vh, text is not clipped, and no horizontal overflow appears on mobile.

- [ ] **Step 3: Verify active glow geometry in every palette mode**

At 50%, 75%, and 100%, activate verses with neighboring content above and below. Sample light/dark modes and at least two seasons.

Expected: the glow remains centered on the active container; its offset/blur/strength visibly reduce below 100%; it does not encroach distractingly on adjacent verses; 100–150% remain unchanged; and `color-mix` preserves each theme's existing accent color and WCAG-conscious foreground/background choices.

- [ ] **Step 4: Verify near, far, retargeted, interrupted, and reduced motion**

Perform these checks:

1. Click a verse one position from center.
2. Click a verse far from center.
3. While a distant centering animation runs, click a verse in the opposite direction.
4. While animation runs, use a mouse wheel and then a touch drag on a mobile viewport.
5. Enable `prefers-reduced-motion: reduce` in browser emulation and activate another verse.

Expected: nearby centering is prompt and smooth (about 350ms); distant centering is smoother and moderately longer but never exceeds 820ms; neither path overshoots; retargeting starts from the current position without a jump or two competing loops; wheel/touch input immediately restores free scrolling; reduced-motion centering is immediate.

- [ ] **Step 5: Check console, frame cleanup, and adjacent reader behavior**

Expected:

- no browser console error or unhandled rejection;
- after completion/cancellation, `verseChaseFrame` and `verseChaseTarget` are null and no continuous animation-frame work remains;
- mouse and keyboard verse activation still share one active border;
- active-verse footnotes still toggle, long press still opens verse actions, mobile chapter swipe still works, and chapter position recall remains intact.

- [ ] **Step 6: Run the full strict contract suite and inspect the final diff**

Re-run every JXA command from Tasks 1 and 2, then:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m)throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
git diff --check
git diff -- bible.html
git status --short
```

Expected: all strict contracts pass; parsing and whitespace checks pass; the production diff is limited to the approved CSS variables/consumers, pure scaling helper/application, and animation lifecycle; no dynamic HTML, code execution, network/API, storage, PII, or dependency change is present; the four pre-existing untracked user paths remain untouched.

- [ ] **Step 7: Commit verification-only changes only if necessary**

If verification required a small correction, repeat the affected RED/GREEN contract first, then make a signed micro-commit with an accurate conventional message. If no file changed during verification, do not create an empty commit.

## Final Self-Review Checklist

- [ ] Every approved footnote baseline, glow baseline, shrink-only threshold, curve formula, duration coefficient, duration bound, cancellation path, and reduced-motion path is represented by an exact test or rendered check.
- [ ] Search this plan for `TODO`, `TBD`, `placeholder`, `later`, and ellipses; none may stand in for implementation details.
- [ ] Confirm CSS percentage strings are used only for `--verse-glow-strength`, while geometry values use pixel strings and helper math remains numeric.
- [ ] Confirm the implementation adds no framework, module split, background worker, API call, persistent data, or PII-bearing fixture.
- [ ] Confirm all commits are signed, conventional, small, and ordered so scale and motion can be reverted independently.
