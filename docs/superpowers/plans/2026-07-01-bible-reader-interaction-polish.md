# Bible Reader Interaction Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the Bible reader’s verse-action dialog, sharing choices, settings labels, and destination-verse highlight without adding dependencies or changing stored data.

**Architecture:** Keep the existing single-file SPA and native `<dialog>`. Add small, generation-aware transition helpers around the current verse-action state, reuse the existing rendered-DOM verse payload, and replace the two-stage highlight timers with one bounded found-to-active transition.

**Tech Stack:** HTML, CSS, browser-native JavaScript, native Dialog/Clipboard/Web Share APIs, JavaScript for Automation syntax checks, and rendered in-app browser acceptance.

---

## File map

- Modify `bible.html`: settings labels, dialog markup/styles/state, verse clipboard/share handlers, and destination-highlight transition.
- Do not modify `bible.json`, Firebase data, service-worker routing, or application dependencies.
- Do not add a Node test harness. Use extracted actual-code checks and rendered browser acceptance, per prior user direction.

### Task 1: Add decorative settings emoji without changing behavior

**Files:**
- Modify: `bible.html:624-664`
- Modify: `bible.html:1126-1142`

- [ ] **Step 1: Capture the current native-button contract**

Run:

```bash
rg -n 'data-theme-mode=|data-season=|aria-pressed' bible.html
```

Expected: three appearance buttons and five season buttons, all native buttons with their existing data attributes and `aria-pressed` values.

- [ ] **Step 2: Add decorative emoji and stable label spans**

Replace the eight button contents with this structure while preserving every existing button attribute:

```html
<button class="theme-mode-button" type="button" data-theme-mode="light" aria-pressed="true"><span class="setting-emoji" aria-hidden="true">☀️</span><span>Light</span></button>
<button class="theme-mode-button" type="button" data-theme-mode="dark" aria-pressed="false"><span class="setting-emoji" aria-hidden="true">🌙</span><span>Dark</span></button>
<button class="theme-mode-button" type="button" data-theme-mode="auto" aria-pressed="false"><span class="setting-emoji" aria-hidden="true">🖥️</span><span>System</span></button>

<button class="theme-mode-button" type="button" data-season="auto" aria-pressed="true"><span class="setting-emoji" aria-hidden="true">🗓️</span><span>Auto</span></button>
<button class="theme-mode-button" type="button" data-season="spring" aria-pressed="false"><span class="setting-emoji" aria-hidden="true">🌱</span><span>Spring</span></button>
<button class="theme-mode-button" type="button" data-season="summer" aria-pressed="false"><span class="setting-emoji" aria-hidden="true">🏖️</span><span>Summer</span></button>
<button class="theme-mode-button" type="button" data-season="fall" aria-pressed="false"><span class="setting-emoji" aria-hidden="true">🍁</span><span>Fall</span></button>
<button class="theme-mode-button" type="button" data-season="winter" aria-pressed="false"><span class="setting-emoji" aria-hidden="true">❄️</span><span>Winter</span></button>
```

- [ ] **Step 3: Keep emoji left-aligned and mobile-safe**

Add to the existing settings CSS:

```css
.theme-mode-button { gap: .35em; min-width: 0; white-space: normal; overflow-wrap: anywhere; }
.setting-emoji { flex: 0 0 auto; line-height: 1; }
.theme-mode-button > span:last-child { min-width: 0; }
```

Do not change the grid columns, button handlers, persistence keys, or cloud fields.

- [ ] **Step 4: Verify markup and accessible labels**

Run:

```bash
rg -n 'setting-emoji.*aria-hidden="true"' bible.html
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m) throw new Error("inline script missing"); Function(m[1]); "inline JavaScript parses"'
git diff --check -- bible.html
```

Expected: eight decorative emoji spans, valid inline JavaScript, and no whitespace errors.

- [ ] **Step 5: Commit**

```bash
git add bible.html
git commit -S -m "feat: label Bible themes with emoji"
```

### Task 2: Separate copy text, copy link, and combined sharing

**Files:**
- Modify: `bible.html:1169-1175`
- Modify: `bible.html:1859-1863`
- Modify: `bible.html:2856-2871`
- Modify: `bible.html:4147-4200`

- [ ] **Step 1: Add the three explicit action buttons**

Change the dialog buttons to native buttons with decorative emoji spans:

```html
<button type="button" id="copy-verse" value="copy-text"><span aria-hidden="true">📋</span><span>Copy Verse Text</span></button>
<button type="button" id="copy-verse-link" value="copy-link"><span aria-hidden="true">🔗</span><span>Copy Verse Link</span></button>
<button type="button" id="share-verse" value="share"><span aria-hidden="true">📤</span><span>Share Verse</span></button>
<button type="button" id="cancel-verse-actions" class="verse-actions-cancel">Cancel</button>
```

Add DOM references beside the existing references:

```javascript
var copyVerseButton = document.getElementById('copy-verse');
var copyVerseLinkButton = document.getElementById('copy-verse-link');
var shareVerseButton = document.getElementById('share-verse');
var cancelVerseActionsButton = document.getElementById('cancel-verse-actions');
```

- [ ] **Step 2: Give the existing rendered-DOM payload explicit forms**

Keep `renderedVerseText()` unchanged. Return these payload fields from `verseActionPayload()`:

```javascript
var copyText = reference + ' \u2014 ' + text;
return {
  reference: reference,
  text: text,
  copyText: copyText,
  copyLink: url,
  combined: copyText + '\n' + url,
  url: url
};
```

Do not read verse text directly from `bibleData`; synthesized blank-key verses must still use their final `.verse-reading-text` DOM.

- [ ] **Step 3: Add Copy Link and update sharing semantics**

Use `payload.copyText` for Copy Text and add this handler for Copy Link:

```javascript
if (copyVerseLinkButton) {
  copyVerseLinkButton.addEventListener('click', function () {
    if (verseActionInFlight) return;
    var token = verseActionGeneration;
    var payload = currentVerseAction(token);
    if (!payload) return announceStatus('Select an active verse first.');
    verseActionInFlight = true;
    writeClipboardText(payload.copyLink).then(function () {
      finishVerseAction(token, 'Verse link copied.', true);
    }).catch(function () {
      finishVerseAction(token, 'Unable to copy the verse link. Try again.', false);
    });
  });
}
```

For native sharing, pass both rendered text and URL:

```javascript
navigator.share({
  title: payload.reference,
  text: payload.copyText,
  url: payload.url
});
```

When `navigator.share` is unavailable, copy `payload.combined` and announce `Verse text and link copied.` Keep the dialog open on rejection. Treat `AbortError` as a user cancellation rather than an error.

- [ ] **Step 4: Run an extracted payload contract check**

Run this check against the actual committed function bodies:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var a=s.indexOf("  function renderedVerseText("); var b=s.indexOf("  function announceStatus(",a); if(a<0||b<0) throw new Error("payload source missing"); eval(s.slice(a,b)); var currentBook="Matthew",currentChapter=17; var viewInner={contains:function(){return true;}}; function validChapterVerse(){return "21";} function canonicalVerseUrl(){return "https://example.test/bible.html?book=Matthew&chapter=17&verse=21";} var removed=0; var clone={textContent:"But this kind does not go out except by prayer and fasting.",querySelectorAll:function(){return [{remove:function(){removed++;}},{remove:function(){removed++;}}];}}; var reading={cloneNode:function(){return clone;}}; var verse={isConnected:true,classList:{contains:function(n){return n==="active";}},getAttribute:function(){return "21";},querySelector:function(){return reading;}}; var q=verseActionPayload(verse); var text="Matthew 17:21 \u2014 But this kind does not go out except by prayer and fasting."; var link="https://example.test/bible.html?book=Matthew&chapter=17&verse=21"; if(!q||q.copyText!==text||q.copyLink!==link||q.combined!==text+"\n"+link||removed!==2) throw new Error("payload contract failed"); "rendered payload contract passes"'
```

Expected: `rendered payload contract passes`. The mock removal count also proves that the verse-number and footnote-toggle nodes are excluded before copying.

- [ ] **Step 5: Commit**

```bash
git add bible.html
git commit -S -m "feat: separate Bible verse sharing actions"
```

### Task 3: Animate the native verse-action dialog in and out

**Files:**
- Modify: `bible.html:945-989`
- Modify: `bible.html:1095-1102`
- Modify: `bible.html:1898-1901`
- Modify: `bible.html:2923-2971`
- Modify: `bible.html:3079-3086`
- Modify: `bible.html:4141-4146`

- [ ] **Step 1: Add entry, exit, and backdrop transitions**

Extend the dialog CSS with explicit states:

```css
.verse-actions {
  opacity: 0;
  transform: translateY(10px) scale(.97);
  transition: opacity 190ms cubic-bezier(.2,.8,.2,1), transform 210ms cubic-bezier(.2,.8,.2,1);
}
.verse-actions.is-open { opacity: 1; transform: translateY(0) scale(1); }
.verse-actions.is-closing { opacity: 0; transform: translateY(8px) scale(.98); pointer-events: none; }
.verse-actions::backdrop { opacity: 0; transition: opacity 190ms ease; }
.verse-actions.is-open::backdrop { opacity: 1; }
.verse-actions.is-closing::backdrop { opacity: 0; }
.verse-actions button > span[aria-hidden="true"] { margin-right: .4em; }
```

The existing reduced-motion rule will remove visible durations; JavaScript must also finalize closing immediately when reduced motion is requested.

- [ ] **Step 2: Add bounded transition state**

Declare beside the current verse-action state:

```javascript
var verseActionClosing = false;
var verseActionOpenFrame = null;
var verseActionCloseTimer = null;
var VERSE_ACTION_CLOSE_MS = 220;
```

Add helpers with these exact responsibilities:

```javascript
function resetVerseActionTransition() {
  if (verseActionOpenFrame) cancelAnimationFrame(verseActionOpenFrame);
  if (verseActionCloseTimer) window.clearTimeout(verseActionCloseTimer);
  verseActionOpenFrame = null;
  verseActionCloseTimer = null;
  verseActionClosing = false;
  if (verseActionsDialog) verseActionsDialog.classList.remove('is-open', 'is-closing');
}

function finalizeVerseActionsClose() {
  if (!verseActionsDialog) return;
  resetVerseActionTransition();
  if (verseActionsDialog.open) verseActionsDialog.close();
  else if (verseActionTarget) clearVerseActionState();
}

function closeVerseActions(immediate) {
  if (!verseActionsDialog) return;
  if (!verseActionsDialog.open) {
    resetVerseActionTransition();
    if (verseActionTarget) clearVerseActionState();
    return;
  }
  if (verseActionClosing) return;
  if (immediate || shouldReduceVerseMotion()) return finalizeVerseActionsClose();
  verseActionClosing = true;
  verseActionInFlight = true;
  verseActionsDialog.classList.remove('is-open');
  verseActionsDialog.classList.add('is-closing');
  verseActionCloseTimer = window.setTimeout(finalizeVerseActionsClose, VERSE_ACTION_CLOSE_MS);
}
```

- [ ] **Step 3: Animate opening and guard stale frames**

After `showModal()` succeeds, capture the current generation and schedule one frame:

```javascript
var openingToken = verseActionGeneration;
resetVerseActionTransition();
verseActionOpenFrame = requestAnimationFrame(function () {
  verseActionOpenFrame = null;
  if (openingToken !== verseActionGeneration || !verseActionsDialog.open) return;
  verseActionsDialog.classList.add('is-open');
});
```

For reduced motion, add `is-open` synchronously instead of scheduling the frame.
If `openVerseActions()` is ever called while the dialog is already open, finalize the old dialog immediately before assigning the new target; do not start a second modal or overlap exit and entry state.

- [ ] **Step 4: Route every close path through the controller**

- Change Cancel to a click listener calling `closeVerseActions(false)`.
- On dialog `cancel`, call `preventDefault()` and `closeVerseActions(false)` so Escape animates.
- Keep backdrop click detection, but call `closeVerseActions(false)`.
- On native `close`, call `resetVerseActionTransition()` and then `clearVerseActionState()`.
- In `prepareToLeaveReadingView()`, call `closeVerseActions(true)` so replacing the owning view never leaves a modal dialog behind.
- Successful action completion calls the animated close path; failed actions reset `verseActionInFlight` and leave the dialog open.
- Update Copy Text, Copy Link, and Share guards to return when either `verseActionInFlight` or `verseActionClosing` is true.

- [ ] **Step 5: Check transition lifecycle with extracted actual code**

Run this fixture against the transition functions from `bible.html`:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var a=s.indexOf("  function resetVerseActionTransition("); var b=s.indexOf("  function currentVerseAction(",a); if(a<0||b<0) throw new Error("transition source missing"); var frames=[],timers=[],cancelled=[],cleared=[]; function requestAnimationFrame(fn){frames.push(fn);return frames.length;} function cancelAnimationFrame(id){cancelled.push(id);} var window={setTimeout:function(fn,ms){timers.push({fn:fn,ms:ms});return timers.length;},clearTimeout:function(id){cleared.push(id);}}; var classes={}; var classList={add:function(n){classes[n]=true;},remove:function(){for(var i=0;i<arguments.length;i++) delete classes[arguments[i]];}}; var verseActionsDialog={open:false,classList:classList,showModal:function(){this.open=true;},close:function(){this.open=false;}}; var verseActionsTitle={textContent:""}; var verseActionTarget=null,verseActionGeneration=0,verseActionInFlight=false,verseActionClosing=false,verseActionOpenFrame=null,verseActionCloseTimer=null,VERSE_ACTION_CLOSE_MS=220; function shouldReduceVerseMotion(){return false;} function verseActionPayload(){return {reference:"Matthew 17:21"};} function clearVerseActionState(){verseActionTarget=null;verseActionInFlight=false;verseActionGeneration++;} function announceStatus(){} eval(s.slice(a,b)); if(!openVerseActions({})||frames.length!==1) throw new Error("open frame contract"); verseActionGeneration++; frames[0](); if(classes["is-open"]) throw new Error("stale frame opened dialog"); verseActionsDialog.open=true; verseActionClosing=false; verseActionOpenFrame=null; closeVerseActions(false); if(timers.length!==1||timers[0].ms!==220) throw new Error("close timer contract"); closeVerseActions(false); if(timers.length!==1) throw new Error("duplicate timer"); timers[0].fn(); if(verseActionsDialog.open) throw new Error("dialog did not close"); timers=[]; verseActionsDialog.open=true; verseActionClosing=false; closeVerseActions(true); if(timers.length!==0||verseActionsDialog.open) throw new Error("immediate close contract"); "dialog lifecycle contract passes"'
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m) throw new Error("inline script missing"); Function(m[1]); "inline JavaScript parses"'
git diff --check -- bible.html
```

Expected: `dialog lifecycle contract passes`, valid inline JavaScript, and a clean diff.

- [ ] **Step 6: Commit**

```bash
git add bible.html
git commit -S -m "feat: animate Bible verse actions"
```

### Task 4: Transition directly from found color to active color

**Files:**
- Modify: `bible.html:794-816`
- Modify: `bible.html:1877-1879`
- Modify: `bible.html:3048-3053`
- Modify: `bible.html:3180-3215`
- Modify: `bible.html:3832-3853`

- [ ] **Step 1: Replace the transparent fade state with found and settling states**

Replace `.verse.highlight` and `.verse.highlight-fade` with:

```css
.verse.found-highlight {
  transition: none;
  background: rgba(197,160,50,.18);
  border-color: rgba(197,160,50,.6);
  box-shadow: 0 0 18px rgba(197,160,50,.35), inset 0 0 8px rgba(197,160,50,.1);
}
.verse.found-highlight-settling {
  transition: background 450ms cubic-bezier(.2,.8,.2,1),
              border-color 450ms cubic-bezier(.2,.8,.2,1),
              box-shadow 450ms cubic-bezier(.2,.8,.2,1);
}
html.dark .verse.found-highlight {
  background: rgba(224,192,48,.15);
  border-color: rgba(224,192,48,.5);
  box-shadow: 0 0 22px rgba(224,192,48,.3), inset 0 0 8px rgba(224,192,48,.08);
}
```

There must be no transparent intermediate style.

- [ ] **Step 2: Replace two timers with one owned target, frame, and cleanup timer**

Use these state variables:

```javascript
var verseHighlightTarget = null;
var verseHighlightFrame = null;
var verseHighlightCleanupTimer = null;
```

Replace `clearVerseHighlightTimers()` with:

```javascript
function clearVerseHighlightTransition() {
  if (verseHighlightFrame) cancelAnimationFrame(verseHighlightFrame);
  if (verseHighlightCleanupTimer) window.clearTimeout(verseHighlightCleanupTimer);
  if (verseHighlightTarget) {
    verseHighlightTarget.classList.remove('found-highlight', 'found-highlight-settling');
  }
  verseHighlightTarget = null;
  verseHighlightFrame = null;
  verseHighlightCleanupTimer = null;
}
```

- [ ] **Step 3: Add one direct transition helper**

```javascript
function startVerseFoundTransition(target, book, chapter) {
  clearVerseHighlightTransition();
  if (!target || shouldReduceVerseMotion()) return;
  verseHighlightTarget = target;
  target.classList.add('found-highlight');
  verseHighlightFrame = requestAnimationFrame(function () {
    verseHighlightFrame = requestAnimationFrame(function () {
      verseHighlightFrame = null;
      if (!isCurrentVersesView(book, chapter) || verseHighlightTarget !== target || !viewInner.contains(target)) {
        clearVerseHighlightTransition();
        return;
      }
      target.classList.add('found-highlight-settling');
      target.classList.remove('found-highlight');
      verseHighlightCleanupTimer = window.setTimeout(clearVerseHighlightTransition, 500);
    });
  });
}
```

The two animation frames establish the initial found color before transitioning; they do not block input.

- [ ] **Step 4: Use the helper for every explicit go-to path**

In `showVersesView()`, keep `setActiveVerse()` and `scrollVerseToCenter()`, then call:

```javascript
startVerseFoundTransition(target, bookName, chapterNum);
```

Remove the 1800 ms and 3500 ms timers. Rename all cleanup calls to `clearVerseHighlightTransition()`. When `setActiveVerse()` selects a different target during an active transition, clear the old transition before updating the active verse.

- [ ] **Step 5: Verify no long highlight timers remain**

Run:

```bash
if rg -n 'highlight-fade|verseHighlightFadeTimer|1800|3500' bible.html; then exit 1; else echo 'legacy highlight sequence removed'; fi
rg -n 'found-highlight|500|450ms' bible.html
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m) throw new Error("inline script missing"); Function(m[1]); "inline JavaScript parses"'
git diff --check -- bible.html
```

Expected: the legacy names/delays are absent, the new transition is present, JavaScript parses, and the diff is clean.

- [ ] **Step 6: Commit**

```bash
git add bible.html
git commit -S -m "fix: shorten Bible verse highlighting"
```

### Task 5: Rendered browser acceptance and final review

**Files:**
- Verify: `bible.html`
- Verify: `sw.js`
- Do not commit: local `bible.json`

- [ ] **Step 1: Run fresh static verification**

Run:

```bash
git diff --check HEAD~4..HEAD
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/bible.html"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; var m=s.match(/<script>([\s\S]*?)<\/script>/); if(!m) throw new Error("inline script missing"); Function(m[1]); "bible inline JavaScript parses"'
osascript -l JavaScript -e 'ObjC.import("Foundation"); var p=$.NSFileManager.defaultManager.currentDirectoryPath.js+"/sw.js"; var e=Ref(); var s=$.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,e).js; Function(s); "service worker JavaScript parses"'
```

Expected: clean diff and both scripts parse.

- [ ] **Step 2: Serve the existing SPA without modifying tracked data**

Run `python3 -m http.server 8765` from the repository root. Use the existing local untracked `bible.json`; do not add it to Git.

- [ ] **Step 3: Verify the dialog at mobile and desktop widths**

At 320, 375, 430, and 768 CSS pixels:

- Open actions by long press, context menu, and Shift+F10 on an active verse.
- Confirm entry and exit animate through action success, Cancel, backdrop, and Escape.
- Confirm focus returns to the active verse.
- Repeat open/close at least ten times; confirm one dialog, no retained state classes, no console errors, and no growing timers/listeners.
- Enable reduced motion; confirm entry/exit are immediate.

- [ ] **Step 4: Verify all action payloads**

- Open Matthew 17:21 through its canonical query link.
- Confirm Copy Verse Text uses the final rendered standalone text and contains no URL.
- Confirm Copy Verse Link contains only the canonical URL.
- Confirm native Share receives rendered text plus URL.
- With native share unavailable, confirm Share copies reference, rendered text, newline, and canonical URL.
- Reject clipboard permission and confirm the dialog remains open with an accessible failure message.
- Cancel the native share sheet and confirm there is no false error.

- [ ] **Step 5: Verify settings and destination highlights**

- Confirm every appearance and season button shows its matching emoji to the left of its text.
- Confirm screen-reader names remain `Light`, `Dark`, `System`, `Auto`, `Spring`, `Summer`, `Fall`, and `Winter` without emoji announcements.
- At every viewport and large display size, confirm no horizontal overflow.
- Navigate to verses from search, history, deep links, and the verse picker.
- Confirm one brief gold-to-seasonal-active transition with no transparent gap or second fade.
- During the transition, press the verse, toggle footnotes, scroll, and navigate; all interactions must respond immediately.
- In reduced motion, confirm the final active style appears immediately.

- [ ] **Step 6: Inspect security and lifecycle boundaries**

Confirm:

- canonical URL validation is unchanged;
- copy/share text still originates from rendered DOM;
- no new `innerHTML`, dynamic script, external request, PII, or cloud field was added;
- dialog frames/timers and highlight frames/timers are cleared on view replacement;
- no tracked or staged file exists beyond the planned documents and `bible.html` changes.

- [ ] **Step 7: Request whole-change review**

Review all commits from the design baseline through HEAD against the approved spec. Fix Critical, Important, and Minor findings in signed microcommits, then repeat Steps 1 and 3–6 before declaring completion.
