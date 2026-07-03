# Bible verse glow and double activation design

## Goal

Restore the earlier active-verse glow-and-highlight character without losing
the reader quality-of-life work added afterward. Replace the long-press action
menu trigger with a consistent double activation on touch, pen, and mouse.

## Visual treatment

- Each seasonal light-mode page surface becomes slightly brighter than its
  current value. It remains darker than the dedicated selection fill.
- Each seasonal dark-mode page surface remains unchanged, while its active
  selection fill becomes slightly lighter.
- Every explicit selection fill continues to meet the WCAG 4.5:1 normal-text
  contrast requirement with scripture text.
- Inactive verses stay transparent and borderless.
- The active verse keeps the selection fill and gets the historical broad
  seasonal glow: `0 8px 28px var(--accent-glow)`.
- The active border becomes 1px, using the existing seasonal accent at the
  existing restrained opacity/mix. This is a visual locator, not a second
  contrast target.

## Reader interactions

- A short activation on an inactive verse centers it and makes it active.
- A short activation on an active verse toggles its footnotes.
- A double activation on an active verse opens the existing context action
  menu. This applies to double tap for touch/pen and double click for mouse.
- The first active-verse activation is deferred for a short double-activation
  window. If a matching second activation arrives, the pending footnote toggle
  is cancelled before the menu opens. Otherwise it runs once after the window.
- Existing right-click context-menu access remains available.
- Swipes, text selection, keyboard navigation, chapter transitions, ripple
  feedback, copied rendered text, and link sharing keep their current behavior.

## Implementation boundaries

- Keep the implementation in the existing Bible HTML SPA; no framework or
  dependency changes.
- Replace the long-press timer/state only in reader action handling. Ensure
  cleanup of any pending delayed action on navigation, gesture cancellation,
  and view changes so stale callbacks cannot mutate detached verses.
- Reuse the existing modal/action functions rather than duplicating menu logic.

## Verification

- Extend static contracts for every seasonal palette: light-mode page surfaces
  are brighter than before but still darker than their selection fills;
  dark-mode selection fills are lighter than before; and normal scripture
  contrast against each selection fill remains at least 4.5:1.
- Add contracts for the exact active glow, 1px active border, transparent
  inactive verse styling, and absence of the retired long-press timer.
- Add behavior contracts for deferred single activation, double activation
  cancellation, primary-pointer matching, and cleanup of pending timers.
- Run the complete Node test suite, inspect the diff for whitespace errors,
  and visually check the browser treatment and both interaction paths.

## Non-goals

- No change to the context menu contents, copy/share semantics, season choice,
  navigation layout, text scale algorithm, or rendered scripture data.
