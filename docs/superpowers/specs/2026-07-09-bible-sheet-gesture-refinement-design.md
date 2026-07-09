# Bible Sheet Gesture Refinement Design

Date: 2026-07-09

## Goal

Refine every Bible popup sheet into a content-first, low-latency surface that follows a finger in real time, settles predictably into exactly three states, and preserves scrolling, paging, accessibility, privacy, and history behavior.

The design applies to History, Settings, Search, verse actions, and the Books/Chapters/Verses selector.

## Approved Visual Direction

- Remove the close button, title text, and title/header bar from every application sheet.
- Keep only the content, the drag handle, overflow fades when needed, and the selector's page indicator.
- Use the selected **Tonal Float** treatment for the Books/Chapters/Verses indicator:
  - 36 by 28 CSS pixels;
  - three tightly spaced visual dots;
  - a translucent seasonal surface with backdrop blur and a restrained shadow;
  - no border;
  - always positioned at the bottom inside edge of the sheet, regardless of whether the sheet opens from the top or bottom;
  - visual only: not focusable, clickable, selectable, or exposed as navigation controls.
- Keep the drag handle adjacent to the sheet's free edge:
  - bottom edge for a top-opening sheet;
  - top edge for a bottom-opening sheet.
- Retain the current seasonal palette, typography, radii, shadows, darkened/blurred backdrop, safe-area handling, and native HTML dialog foundation.

## Sheet States and Sizing

Every sheet has exactly three stable states:

1. **Closed**: no visible sheet and no active sheet interaction state.
2. **Determined height**: the natural height required by the current content and sheet chrome, capped at 70dvh.
3. **Fullscreen**: the full available dynamic viewport height, including safe-area treatment.

The determined height is computed as:

```text
min(content's natural block size + required sheet chrome and safe-area space, 70dvh)
```

Short content therefore opens at its natural height instead of a shared 70% default. Content taller than 70dvh initially opens at 70dvh and becomes internally scrollable. An inward drag may settle it into fullscreen.

Dynamic content such as search skeletons and search results may remeasure the determined height while the sheet is settled. A dedicated unconstrained content-measure wrapper supplies its rounded-up intrinsic `scrollHeight`. The controller adds the drag handle's measured outer block size, the selector indicator's reserved bottom inset when present, sheet padding, and safe-area inset exactly once, then clamps the result between that fixed chrome total and 70% of the current dynamic viewport height. Observer-triggered measurement is scheduled outside the observer callback in one animation frame and ignored when the rounded result is unchanged, preventing feedback loops.

Measurement is suspended for the duration of an active gesture, and the determined target is frozen at pointer start. Measurement resumes after settling so layout cannot move underneath the finger. Viewport, safe-area, text-scale, and content-size changes remeasure a determined sheet; they do not demote a fullscreen sheet.

The measured value must be finite, positive, viewport-bounded, and derived from live layout rather than persisted history or user-controlled route data.

## Unified Gesture Controller

One state machine owns vertical sheet dragging, horizontal selector paging, nested scrolling, capture, cancellation, velocity, and settling. It has two narrow input adapters rather than two controllers:

- Pointer Events own the dedicated drag handle plus pen and mouse input.
- A non-passive Touch Events adapter feeds the same state machine for touch gestures that originate on sheet content, including selector paging. This mirrors the proven main-site sheet behavior and permits `preventDefault()` only after the controller has claimed a boundary drag or horizontal page swipe.

The adapters deduplicate compatibility Pointer/Mouse events by active touch identifier and controller generation. They share all axis, velocity, state-decision, rendering, cancellation, and cleanup logic.

### Interaction Arbitration

The controller begins with an undecided axis and does not claim the gesture before an 8 CSS-pixel movement threshold.

- Horizontal dominance inside the selector transfers ownership to page swiping.
- Vertical touch movement remains native content scrolling unless the gesture began with the active scroller already at the relevant boundary and initially moved in a direction the scroller could not consume. Only that boundary-origin gesture may be claimed for sheet dragging; an in-progress native scroll never transfers to sheet dragging.
- The dedicated handle establishes `touch-action: none` before gesture start and always permits vertical sheet dragging. Content touch-action does not change during an active gesture.
- Taps remain taps until horizontal or vertical movement wins the axis lock.
- Book, chapter, and verse grid buttons are the only button exception: pointer/touch start remains unclaimed, a tap activates normally, and horizontal capture after the 8px axis lock records the pointer or touch identifier plus origin target. The controller calls `preventDefault()` where effective and suppresses exactly the matching post-swipe synthesized click. After a claimed swipe, this one-shot matching-target guard survives normal release, cancellation, and lost capture until the matching pointer-generated click, generation change, or the 500ms timeout. It never suppresses a keyboard or assistive activation whose click has `detail === 0`.
- All other buttons, links, inputs, selects, textareas, labels, editable content, and active text selections are never pager origins. They retain native interaction unless the gesture begins on the dedicated drag handle.
- Mouse body dragging may begin from a noninteractive target only when the active scroller is already at the relevant boundary.
- At most one owner exists for a pointer. Ownership cannot bounce between the pager, scroller, and sheet during one gesture.

### Real-Time Rendering

Live dragging must feel direct and high-framerate:

- Disable sheet and backdrop transitions before the controller claims a drag.
- Coalesce visual writes into at most one `requestAnimationFrame` per display frame.
- Read geometry before the active drag or during a dedicated measurement phase; do not mix layout reads with per-frame writes.
- During determined-to-fullscreen movement, resize the sheet from its anchored edge.
- During determined-to-closed movement, translate the sheet toward its opening edge.
- During fullscreen-to-determined movement, resize toward the frozen determined-height target.
- Update backdrop opacity from the same normalized drag progress.
- Do not apply a trailing CSS transition to live values.
- Do not force synchronous layout during pointer movement.

Only the settling animation uses the shared project easing curve. Reduced-motion mode settles immediately while preserving the same state decision.

### Settling and Debounce

The controller makes one state decision on release. It never changes the stable snap state during pointer movement. Named constants make the decision mutation-testable:

```text
axisLockDistance = 8px
snapDisplacement = 80px
snapVelocity = 0.4px/ms
velocityExpiry = 80ms
maximumVelocityMagnitude = 3px/ms
clickSuppressionTimeout = 500ms
```

The decision uses:

- signed displacement from the gesture origin;
- a recent velocity sample clamped to the finite maximum magnitude and ignored after the expiry window;
- the finite positive distance between adjacent states, captured at gesture start;
- direction-aware hysteresis so small reversals and noisy velocity cannot trigger a snap.

The effective displacement threshold is `min(80px, adjacentStateDistance)`. A release advances one adjacent state only when signed displacement reaches that effective threshold or a non-expired velocity in the same direction reaches 0.4px/ms. If displacement and velocity oppose one another after axis lock, velocity is ignored. Values exactly on a threshold qualify; values below it return to the starting stable state. Invalid or non-finite samples never qualify. A release may move only to the adjacent state:

```text
closed <-> determined height <-> fullscreen
```

A determined sheet dragged outward may close; dragged inward may become fullscreen. A fullscreen sheet dragged outward may return to its frozen determined height but may not skip directly to closed in the same release. Closing from fullscreen therefore requires a second intentional gesture after the sheet reaches determined height.

Cancellation, lost pointer capture, a second concurrent pointer/touch, or an invalid geometry sample returns to the gesture's starting stable state and clears every pending frame, capture, and inline drag property. If a horizontal swipe had already been claimed, its bounded one-shot click guard remains until its matching pointer-generated click, generation change, or timeout.

### History-Aware Close

Drag dismissal begins the visible close animation immediately. Browser-history cleanup happens concurrently and must not cause the sheet to spring back to its open position while waiting for `popstate`.

The controller phase is `closed | idle | dragging | settling | closing`, independent of the open snap `determined | fullscreen`. Each open receives a monotonically increasing generation. Frames, observers, timers, history callbacks, and content cleanup mutate state only when their captured generation still matches. Closing is terminal for that generation.

The close operation is idempotent. A late `popstate`, timeout fallback, backdrop cancellation, or repeated close request may finish cleanup but cannot reopen, refocus, or reanimate the sheet.

## Scroll Overflow Fades

Scrollable content receives pointer-transparent edge fades only when additional content exists beyond the visible boundary.

- Show a top fade when `scrollTop` is greater than the boundary tolerance.
- Show a bottom fade when the scroller has content below the viewport.
- Hide both fades when content fits.
- Update fade state on scroll, content resize, viewport resize, sheet snap changes, and selector page changes.
- Coalesce fade writes through animation frames and disconnect observers/listeners during content replacement and sheet cleanup.
- Apply the mechanism to the generic sheet body and to the active Books/Chapters/Verses panel, without stacking duplicate fades.
- Keep fades inside the sheet bounds, below the drag handle and Tonal Float indicator, and above scrolling content.
- Fades use the current sheet surface color so light, dark, and seasonal themes blend naturally.
- Fades never intercept pointer, wheel, or touch events.

## Selector Pager

The Books/Chapters/Verses selector retains three persistent panels and direct navbar entry into the corresponding page.

- Horizontal swiping works across natural content targets, including grid buttons.
- A completed swipe changes at most one page.
- The track follows horizontal displacement during the drag and settles to the selected page after release.
- Vertical scroll and vertical sheet drag take precedence when the vertical axis wins.
- The Tonal Float dots reflect page state visually but provide no input behavior or accessibility semantics.
- Only the active panel is exposed and focusable; inactive persistent panels are both `inert` and `aria-hidden="true"`.
- Page identity remains available through each panel's accessible label and a bounded polite status announcement after page changes.
- `Alt+ArrowLeft` and `Alt+ArrowRight` move one page backward or forward from anywhere inside the active selector panel, preserving an in-dialog keyboard equivalent while the visual dots remain noninteractive.
- Modulo-three grid sizing and active-panel-only resize observation remain unchanged.

## Launcher and Focus State

Every launcher receives a synchronized expanded/active state from the shared sheet controller. No sheet-specific button owns a separate close-state implementation.

- Opening a sheet marks only its launcher expanded where appropriate.
- Every close path clears the launcher state immediately: drag, backdrop, Escape, history navigation, selection commit, action completion, owner reset, and programmatic close.
- Keyboard-driven close restores focus to the connected opener.
- Pointer-driven close, including drag and backdrop dismissal, does not programmatically refocus the opener and therefore cannot leave a hover/focus highlight behind.
- Every close request carries an immutable generation-scoped focus policy. Selection and action completion focus their logical destination or `#view-inner`. History navigation, owner reset, and programmatic close preserve valid external focus; otherwise they focus `#view-inner`. Late callbacks never focus a second time.
- Whenever a policy targets `#view-inner`, focus uses `preventScroll`, temporarily adding `tabindex="-1"` when needed and removing it after focus leaves.

## Accessibility

- The native dialog receives a trusted kind-specific accessible name such as `History — Bible panel`, `Search — Bible panel`, `Settings — Bible panel`, `Selection — Bible panel`, or `Verse actions — Bible panel`; it no longer depends on a visible heading.
- The drag handle remains a real button. In determined state it is named `Expand [kind] panel`; in fullscreen it is named `Restore [kind] panel size`.
- Enter or Space toggles determined/fullscreen. The edge-relative inward arrow expands one adjacent state. The outward arrow restores fullscreen to determined or closes determined. For a bottom sheet, inward is ArrowUp and outward is ArrowDown; for a top sheet, inward is ArrowDown and outward is ArrowUp.
- Escape continues to close the active sheet.
- Removing the close button does not remove any keyboard close path.
- Overflow fades and indicator dots are decorative and hidden from assistive technology.
- Selector panels keep meaningful accessible labels; only the active panel participates in the accessibility tree and tab order.
- Before making the old selector panel inert, the controller checks whether it contains `document.activeElement`. Keyboard paging focuses the first logical control in the new panel. Pointer paging focuses the new panel container without scrolling using a temporary `tabindex="-1"`, then removes that attribute after focus leaves.
- Focus trapping remains provided by the modal dialog.
- Reduced motion, safe-area insets, minimum interactive target sizes, forced-colors behavior, and readable contrast remain supported.

## Error Handling, Security, and Privacy

- Treat descriptor keys and all route, history, persisted, remotely sourced, and caller-supplied scalar state as untrusted input and continue validating them before rendering.
- Renderer functions come only from the static trusted descriptor registry. Never accept renderer callbacks, HTML, CSS, selectors, or executable values from route, history, persisted, remote, or caller-supplied state; untrusted state may select only an allowlisted kind and validated scalar options.
- Never derive CSS text, selectors, HTML, or executable code from sheet state. Dynamic content continues to use safe DOM creation and `textContent`.
- Clamp all geometry and velocity values before applying style properties; reject non-finite or out-of-range measurements.
- Do not store pointer coordinates, search text, reading history, account identifiers, or other personal data in diagnostics or committed fixtures.
- Owner isolation continues to close or refresh owner-scoped sheets without exposing a previous owner's History or Search state.
- Content-render errors show a bounded, non-sensitive fallback and still permit gesture or Escape dismissal.

## Resource and Leak Safety

The controller owns and deterministically releases:

- pointer capture;
- active pointer state;
- animation frames;
- settle and history fallback timers;
- `ResizeObserver` instances;
- media-query listeners;
- scroll listeners;
- content cleanup callbacks;
- temporary inline transform, height, opacity, and transition properties.

Repeated open/close, content replacement, owner changes, viewport changes, pointer cancellation, and history traversal must leave no duplicate listener, observer, timer, frame, or retained detached DOM reference.

## Testing Strategy

All behavior changes follow red-green-refactor. Tests must fail for the missing behavior before production code changes.

### Unit and Controller Tests

- Natural determined height for short content and a 70dvh cap for long content.
- Dynamic remeasurement while settled and measurement suspension during drag.
- Exactly three stable states and adjacent-state-only transitions.
- Distance, recent velocity, velocity expiry, hysteresis, and reversal behavior.
- Effective displacement thresholds when adjacent-state distance is below, equal to, and above 80px.
- No live-drag transition and at most one animation-frame write per frame.
- No forced layout read during pointer movement.
- Immediate visual close while history cleanup is pending.
- Cancellation and lost-capture restoration with complete cleanup.
- A second pointer/touch cancels the active gesture, restores its starting state, releases capture, and produces no snap or synthesized click.
- Pointer-driven close clears launcher state without restoring focus.
- Keyboard-driven close restores safe focus.
- Dynamic overflow fades at top, middle, bottom, fitting-content, resize, and cleanup states.
- Geometry sanitization and hostile history-state rejection.
- Repeated open/replace/close, owner-change, cancellation, and history cycles return listener, observer, timer, frame, capture, media-query-listener, cleanup-callback, and retained-node counts to their pre-open baseline.
- Content-render failure remains dismissible by Escape and the handle and exposes neither exception text nor user data.

### Selector Tests

- Horizontal swipes beginning over real book, chapter, and verse buttons.
- Exact matching post-swipe click suppression without suppressing taps or keyboard-generated activation.
- Claimed swipe release followed by lost capture still suppresses exactly the subsequent matching pointer-generated click.
- Taps still activate buttons when no axis wins.
- Vertical scroll and vertical sheet drag are not stolen by paging.
- Live track following, one-page settling, endpoint clamping, cancellation, and reduced motion.
- Tonal Float is noninteractive, decorative, compact, bottom-positioned for both sheet edges, and synchronized to page state.
- Inactive panels are inert and hidden from assistive technology; keyboard paging and bounded announcements remain available.
- Keyboard paging and pointer swiping relocate focus before the previous focused panel becomes inert.
- Modulo-three grids and active-panel observation remain intact.

### Structure and Accessibility Tests

- No sheet close button, sheet-chrome title element, or sheet-chrome header row remains; semantic headings inside sheet content remain permitted.
- Direct dialog accessible name and accessible drag handle remain.
- Edge-aware handle placement is correct.
- Escape and keyboard handle controls remain functional.
- Fades and dots do not enter the tab order or accessibility tree.

### Rendered Browser QA

Verify with the in-app browser at desktop and mobile widths:

- short History and Settings sheets open at natural height;
- long Search and selector sheets initially cap at 70dvh;
- top and bottom handles appear at their correct free edges;
- Tonal Float remains at the bottom for both orientations;
- fades appear and disappear at real scroll boundaries;
- page swipes work when starting on grid cells;
- sheet movement follows touch without trailing easing or bounce;
- determined/fullscreen/closed snaps are intentional and stable;
- all close paths clear launcher highlighting;
- no relevant console errors or warnings occur.

## Out of Scope

- Changing Bible data, reading-position persistence, search indexing, account synchronization, seasonal palette definitions, navbar placement, or modulo-three grid rules.
- Adding more snap points, free-position persistence, interactive page dots, visible sheet titles, or a replacement close button.
- Replacing the native dialog with a custom modal framework.
