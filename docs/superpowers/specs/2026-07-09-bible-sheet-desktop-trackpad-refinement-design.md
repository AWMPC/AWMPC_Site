# Bible Sheet Desktop and Trackpad Refinement Design

Date: 2026-07-09

## Goal

Refine the Bible sheet system so desktop sheets occupy only the width their content needs, remain attached to the side from which they opened, animate consistently, and support deliberate horizontal trackpad navigation. Correct the remaining mobile launcher, search-keyboard, handle, fade, and top-edge spacing issues without weakening the existing three-state, generation-safe sheet lifecycle.

This specification extends `2026-07-09-bible-sheet-gesture-refinement-design.md`. Where the two documents overlap, this specification supplies the narrower, later decision.

## Scope

The changes apply to History, Settings, Search, verse actions, and the Books/Chapters/Verses selector. Trackpad chapter navigation additionally applies to the main verse-reading pane.

The approved implementation approach extends the current shared sheet controller. It does not replace the native dialog foundation or introduce a parallel sheet implementation.

## Stable State Model

Every sheet retains exactly three stable states:

1. **Closed**: no visible sheet and no active launcher identity.
2. **Determined**: the natural content height plus required chrome, capped initially at 70% of the available dynamic viewport.
3. **Fullscreen**: the full available dynamic viewport.

Pointer movement may render temporary intermediate geometry, but those positions are not persistent states. A release settles to one adjacent stable state. Restoring from fullscreen returns to the most recently valid determined dimensions.

The existing generation identifier remains authoritative. Measurement, delayed focus, animations, wheel-burst timers, visual-viewport updates, history callbacks, and cleanup callbacks must verify that their captured generation is still current before mutating state.

## Desktop Width and Horizontal Anchor

At desktop breakpoints, a determined sheet uses the minimum inline size needed to display its content in full, including sheet padding and chrome, subject to a hard maximum of 50% of the current viewport width (`50vw`). This is a percentage of the screen, not a fixed pixel value.

Width resolution follows these rules:

- Measure intrinsic content width in a dedicated measurement phase before the opening transition.
- Add horizontal sheet padding, border, and chrome exactly once. The handle does not add width unless its measured inline size exceeds the content-and-padding result.
- Clamp the result to the valid range between the sheet's existing project-native minimum usable width and `min(50vw, viewport width minus existing desktop edge gutters)`.
- Content explicitly marked by the trusted sheet descriptor as panel-filling, including the selection grids, receives the full clamped `50vw` panel width rather than an arbitrarily narrow intrinsic result. Caller or persisted state cannot set this flag.
- The three persistent selector pages share one stable `50vw` determined width; paging never causes a width jump.
- Long unbreakable content wraps or scrolls inside the sheet according to its existing content policy and never expands the sheet beyond the hard maximum.
- Recompute determined width after material content, scale, font, or viewport changes while the sheet is settled in determined state.
- Freeze the determined width during a live gesture or transition.
- Mobile sheets remain full-width and do not use intrinsic desktop sizing.

Before `showModal()`, the controller reads the launcher's center point. A launcher centered left of the viewport midpoint produces a left anchor; one centered at or right of the midpoint produces a right anchor. The chosen anchor is immutable for that opening generation.

Determined and restored sheets remain attached to that side. Fullscreen temporarily fills the viewport but retains the origin anchor so restore and close travel toward the correct side and edge. Content remeasurement, keyboard changes, and responsive updates must not flip the anchor during the same opening.

## Approved Motion Direction

The approved visual direction is **A: Anchored Edge Glide**.

- Opening travels vertically into view from the navbar's top or bottom edge.
- Closing reverses vertically toward that same edge.
- Maximizing expands inward from the sheet's fixed horizontal side and navbar edge.
- Restoring contracts toward the saved determined dimensions while preserving the origin side.
- The backdrop opacity follows the same normalized transition progress.
- Existing project easing is used with two named duration tokens: 280ms for open/close and 320ms for maximize/restore. The backdrop uses the same duration as its paired sheet transition.
- `prefers-reduced-motion: reduce` applies the same state result immediately, without animated travel.

Opening geometry and the initial off-edge pose are applied before the first visible frame. Transform origin combines the immutable horizontal anchor with the navbar-derived vertical edge. Live dragging remains transition-free and uses coalesced `requestAnimationFrame` transform or size writes with cached geometry; it must not trigger layout reads on each pointer event.

Rapid open, close, replace, resize, and maximize requests cancel the previous generation's animation and begin from sanitized current visual geometry. A stale transition completion cannot commit state, restore focus, or remove styles owned by a newer generation. Reduced-motion mode skips both animation and animation-fallback timers.

## Horizontal Trackpad Gesture Interpreter

One shared interpreter normalizes horizontal wheel input for the selector and verse-reading pane. It is attached only while the Bible interface owns the relevant surface and is removed deterministically during cleanup.

The interpreter:

- normalizes pixel, line, and page `deltaMode` values into a bounded finite distance;
- accepts a gesture only when horizontal movement clearly dominates vertical movement;
- accumulates same-direction horizontal distance until a named threshold is reached;
- locks direction for the active burst;
- permits at most one adjacent navigation action per burst;
- resets accumulated distance, direction, and consumed state after a short idle debounce;
- maps positive `deltaX` to forward navigation and negative `deltaX` to backward navigation;
- ignores non-finite values, Shift-converted vertical-wheel input, momentum reversals after consumption, active sheet dragging, active transitions, text-entry focus, active text selection, hidden or non-verse views, and Control/Meta-modified browser gestures;
- does not prevent default until the gesture has been claimed;
- leaves vertical and ambiguous diagonal scrolling native.

The initial constants are explicit and unit-tested:

```text
wheelAxisDominanceRatio = 1.25
wheelActivationDistance = 48px
wheelIdleReset = 160ms
wheelLinePixels = 16px
maximumNormalizedDeltaPerEvent = 120px
```

Page-mode deltas normalize to the finite current viewport inline size before the per-event cap. These constants may be tuned only through a later reviewed behavior change, not as undocumented magic numbers.

At a selector or Bible endpoint, a clearly claimed in-scope horizontal burst is still consumed so the browser cannot reinterpret it as a history-navigation swipe. It performs no application navigation and remains subject to the one-action-per-burst lock.

### Selector Priority

When the Books/Chapters/Verses sheet is open, it exclusively owns a claimed horizontal trackpad gesture. One burst moves at most one adjacent selector page:

```text
Books <-> Chapters <-> Verses
```

The selector clamps at its endpoints. The underlying verse-reading pane must not also change chapter.

### Continuous Chapter Navigation

When no selector sheet owns the gesture and the verse-reading pane is active, one claimed horizontal trackpad burst moves to the adjacent chapter in canonical Bible order.

The chapter sequence crosses book boundaries:

- forward from the final chapter of a book opens chapter 1 of the next book;
- backward from chapter 1 opens the final chapter of the previous book;
- backward stops only at Genesis 1;
- forward stops only at Revelation 22.

Each successful transition routes through the same adjacent-chapter navigation path used by the existing navbar controls; the wheel adapter introduces no separate history policy. That path restores a valid recalled verse for the destination chapter when available, otherwise verse 1, and atomically updates the active book, active chapter, destination verse, navbar labels, selector state, canonical URL/history entry, and persisted last-reading location. Automatic positioning at that verse is marked as programmatic so it cannot trigger scroll-driven navbar hiding.

Repeated momentum events from the same burst cannot skip chapters. A new action requires the idle reset and a new deliberate horizontal burst.

Wheel burst state resets on sheet close or replacement, route/view change, window blur or visibility loss, viewport resize, and transition completion. A stale burst cannot act on a newer sheet generation or newly rendered chapter.

## Mobile Search and Keyboard

Search may retain its normal autofocus behavior. On mobile, the first focus entering the search input during an opening promotes the Search sheet to fullscreen. It remains fullscreen for the rest of that opening generation, even if the keyboard later closes or focus leaves the input.

The fullscreen latch is committed before the focus action that may summon the keyboard. While the software keyboard is present, the sheet uses the finite, sanitized visual viewport height and offset to keep the input and results visible above the keyboard, falling back to the dynamic layout viewport when `visualViewport` is unavailable or invalid. Rotation and resize preserve fullscreen and recompute its available geometry. Viewport events are coalesced through one animation frame. Closing Search removes every visual-viewport listener and clears its fullscreen lock; the next opening begins from normal determined sizing before focus.

Delayed autofocus must verify the current sheet kind and generation. It cannot refocus a closed or replaced sheet.

## Mobile Visual Corrections

### Launcher Highlight

Launcher highlighting is derived solely from the shared controller's current open-sheet identity. Every close path clears the identity immediately, including drag dismissal, backdrop dismissal, Escape, browser history, selection commit, action completion, programmatic close, owner reset, and interrupted animation cleanup.

Touch-only devices do not retain mouse-hover styling. Pointer-driven close does not restore focus to its launcher. Keyboard-driven close preserves the existing safe focus-restoration behavior and `:focus-visible` indication.

### Grab Bar

The mobile grab bar's visible mark becomes 30 by 3 CSS pixels. Its transparent interactive button remains at least 44 by 44 CSS pixels. The handle stays at the sheet's free edge: bottom for a top-opening sheet and top for a bottom-opening sheet.

### Selector Fade, Indicator, and Top Spacing

For a top-opening mobile selector:

- add a `0.5rem` content inset below the already-owned top safe-area region so the first row is not clipped, without adding the safe-area inset twice;
- attach the bottom overflow fade immediately above the bottom grab-bar region, rather than at a fixed offset in the middle of content;
- keep the Tonal Float page indicator at the bottom for both top- and bottom-opening sheets;
- layer scrolling content below the fade, the fade below the indicator, and the grab handle at the free edge;
- reserve one bottom content inset large enough for the handle and Tonal Float so neither obscures the final grid row, without double-counting safe-area space;
- make the fade and indicator pointer-transparent, nonselectable, unfocusable, and hidden from assistive technology.

Overflow fades appear only when more content exists in their direction and disappear at the corresponding scroll boundary. Sheet bounds clip every fade so it never overlaps the outside border.

## Accessibility and Native Behavior

- Native modal dialog focus trapping and Escape dismissal remain intact.
- The visual dots remain decorative; selector panels retain meaningful accessible labels and keyboard paging.
- The handle remains a real button with state-appropriate expand or restore labeling and existing keyboard controls.
- Desktop trackpad behavior has keyboard equivalents through existing chapter controls and selector keyboard paging.
- Forced-colors, increased text scale, safe-area insets, reduced motion, and minimum target sizes remain supported.
- Touch paging, trackpad paging, and vertical sheet dragging must not suppress normal taps, text selection, or assistive-technology activation.

## Security, Privacy, and Resource Safety

- Treat persisted location, history state, descriptor keys, geometry, viewport values, and wheel deltas as untrusted scalar input. Validate allowlisted kinds and clamp finite numeric values before use.
- Build content with trusted renderers and safe DOM APIs; do not derive HTML, CSS text, selectors, or executable code from route, persisted, search, or wheel data.
- Do not record search text, reading history, pointer coordinates, account identifiers, or other personal information in diagnostics or committed fixtures.
- Owner changes and content replacement preserve the existing isolation guarantees for History and Search.
- Each opening generation owns and releases its wheel listener, idle timer, animation frame, visual-viewport listener, resize observer, pointer capture, transition callback, and temporary inline styles.
- Repeated open, replace, drag, maximize, close, resize, keyboard, and wheel cycles must return owned resource counts to their pre-open baseline and retain no detached sheet nodes.

## Strict Test Strategy

Behavior changes follow red-green-refactor. Tests must fail for the missing behavior before production changes.

### Geometry and Motion

- Intrinsic desktop width for narrow content.
- Full available panel width for content designated full-width.
- The hard `50vw` maximum at multiple desktop viewport sizes and text scales.
- Full-width mobile behavior below the desktop breakpoint.
- Left and right anchor capture from launcher center, persistence through maximize/restore, and reset after close.
- Open, close, maximize, restore, interruption, and reduced-motion behavior for top- and bottom-opening sheets.
- No per-pointer-move layout read and at most one live visual write per animation frame.

### Trackpad Navigation

- Wheel `deltaMode` normalization and rejection of invalid or extreme values.
- Horizontal dominance, diagonal ambiguity, vertical-scroll preservation, threshold boundaries, direction lock, idle reset, and one-action-per-burst behavior.
- Positive-delta forward mapping, negative-delta backward mapping, Shift-wheel exclusion, modifier exclusion, selection exclusion, and claimed endpoint consumption.
- Selector priority prevents simultaneous chapter navigation.
- Books/Chapters/Verses adjacency and endpoint clamping.
- Verse-view previous and next chapter navigation within a book.
- Forward and backward traversal across every book boundary represented by fixtures.
- Bible-wide clamping at Genesis 1 and Revelation 22.
- Recalled-verse restoration with verse-1 fallback and atomic book, chapter, verse, labels, selector state, URL/history, and persisted-location updates.
- Programmatic destination-verse positioning never triggers hide-bars behavior.
- No gesture handling during input focus, sheet drag, transition, or browser-modified wheel gestures.
- Burst reset on close, replacement, route change, blur/visibility loss, resize, and transition completion.

### Mobile Corrections

- Every close route clears launcher identity and touch devices do not retain hover/focus highlighting.
- Search input focus promotes mobile Search to fullscreen once per opening and keyboard dismissal does not restore determined size.
- Visual viewport changes keep search input/results visible and stale callbacks cannot mutate a newer generation.
- Visible handle thickness changes without shrinking its 44px target.
- Top-opening selector receives top content inset.
- Bottom fade is directly adjacent to the handle region, appears only with overflow, and disappears at the boundary.
- Tonal Float remains bottom-positioned and noninteractive for both opening edges.

### Leak, Security, and Accessibility

- Repeated lifecycle and gesture cycles return listener, timer, frame, observer, pointer-capture, and retained-node counts to baseline.
- Hostile history and persisted scalar values cannot select untrusted renderers or produce unsafe style values.
- No sensitive text or reading state appears in diagnostics or fixtures.
- Keyboard close, handle controls, selector paging, chapter controls, focus restoration, reduced motion, forced colors, and accessibility-tree isolation remain intact.

## Rendered Browser Verification

Use the in-app browser to verify representative desktop and mobile widths in light and dark modes:

- narrow desktop sheets fit content while full-width panels stop at half the viewport;
- sheets open on and remain attached to the launcher's side;
- anchored edge-glide motion is smooth for open, close, maximize, and restore;
- trackpad paging changes exactly one selector page or one canonical chapter per deliberate burst;
- chapter navigation crosses book boundaries and stops only at the Bible endpoints;
- mobile Search stays visible and fullscreen while the keyboard changes the visual viewport;
- mobile close paths remove launcher highlighting;
- the thin grab bar retains an easy touch target;
- selector top spacing, fade placement, and Tonal Float layering are visually correct;
- no relevant console errors or warnings occur.

## Out of Scope

- Adding snap states beyond closed, determined, and fullscreen.
- Free-position or free-size persistence.
- Changing Bible content, canonical book order, search indexing, seasonal palette definitions, navbar placement, or modulo-three grid rules.
- Interactive indicator dots, visible sheet title bars, close buttons, or a replacement modal framework.
- Horizontal touch gestures on the verse-reading pane; this specification adds desktop trackpad chapter navigation only.
