# Bible Reader Interaction Fixes Design

## Goal

Correct three reader regressions in the existing single-file `bible.html` application:

1. Keyboard verse traversal must use the same single active-verse treatment as mouse selection.
2. Verse-container spacing must shrink with Text Scale below 100%, without growing above 100%.
3. Horizontal mobile swipes in the scripture reading area must reliably navigate to the adjacent chapter.

The implementation stays inside the existing SPA and introduces no dependency, framework, service, or new persistent state.

## Root Causes

### Double verse border

Arrow-key traversal calls `focus()` after activating the next verse. The verse therefore has both `.active`, which supplies its selection border, and `:focus-visible`, which supplies a second outer outline. Mouse selection activates the verse without moving DOM focus, so it displays only the active border.

### Fixed verse spacing at small Text Scale

Text Scale changes semantic font-size variables, but `.verse` still uses fixed pixel values for padding, bottom margin, and radius. At 50% and 75%, those fixed values visually dominate the reduced text.

### Cancelled mobile swipe

The reader already tracks horizontal primary touch/pen pointer movement and invokes the same adjacent-chapter function used by keyboard navigation. The reading surface does not declare native gesture ownership, so a mobile browser may claim the gesture for its default touch behavior and dispatch `pointercancel` before the reader receives `pointerup`.

## Behavior

### Unified active-verse treatment

- An active verse looks identical whether selected by mouse, touch, or keyboard arrows.
- `.verse.active:focus-visible` suppresses only the redundant outer outline.
- The existing active background, border, and shadow remain the visible selection/focus indication.
- Focus styling for every other control remains unchanged.
- Inactive verses retain their general `:focus-visible` rule as a defensive accessibility fallback.

### Verse-only spacing scale

Define semantic verse-container variables for:

- normal vertical and horizontal padding;
- open-footnote vertical and horizontal padding;
- bottom margin;
- corner radius.

`applyTextScale()` writes these verse-only variables using a spacing multiplier of `min(scale / 100, 1)`:

| Text Scale | Verse spacing |
|---|---:|
| 50% | 50% |
| 75% | 75% |
| 100% | 100% |
| 125% | 100% |
| 150% | 100% |

Text still scales through the existing typography variables. General UI geometry and touch-target dimensions remain fixed. Border widths remain fixed so the selected state does not become too faint at small scales.

### Native mobile chapter swipe

- The scripture reading surface declares `touch-action: pan-y` while in the verses view.
- Vertical gestures remain native scrolling.
- Horizontal pointer gestures continue through the existing reader pointer state.
- A swipe qualifies when horizontal displacement is at least 72px and at least 1.25 times vertical displacement.
- Left swipe invokes next chapter; right swipe invokes previous chapter.
- Navigation uses `showAdjacentChapter()`, preserving the existing chapter-position recall and settled-history behavior.
- Swipes can begin over active or inactive verse text.
- Buttons, links, dialogs, inputs, selects, textareas, elements with `role="button"`, and the verse-actions UI remain excluded.
- A non-collapsed text selection prevents chapter navigation.
- Completion and cancellation clear the single pointer state and pending long-press timer.

## Data Flow

Text Scale continues to flow from persisted state through `applyTextScale()`. That function updates typography variables and the new verse-spacing variables in one synchronous operation, then performs its existing select synchronization and persistence behavior.

Touch/pen input continues to flow through the current `pointerdown` → `pointermove` → `pointerup` sequence. The CSS `touch-action` declaration only tells the browser to retain native vertical panning and allow horizontal pointer delivery; it does not add another listener, timer, or gesture state machine.

## Validation

Strict source/runtime contracts will be written and observed failing before production changes. They will prove:

- active focused verses do not stack an outline over the active border;
- other focus-visible styles are not globally suppressed;
- verse spacing resolves to 50%, 75%, 100%, 100%, and 100% across the five Text Scale values;
- border widths and general UI geometry remain fixed;
- the verses surface declares vertical native panning;
- the qualifying horizontal gesture path invokes adjacent-chapter navigation exactly once;
- interactive descendants and text selection remain protected;
- inline JavaScript still parses and the prior Text Scale contract remains valid.

Rendered mobile acceptance at a 320px viewport will verify both swipe directions, ordinary vertical scrolling, gesture starts over active and inactive verse text, footnote-button taps, and no horizontal overflow at 50% or 150%. Browser console errors and warnings will also be checked.

## Security and Resource Safety

The change introduces no HTML construction, dynamic code execution, network request, external dependency, storage key, or user-data collection. It reuses the existing single pointer state. Pointer completion and cancellation continue to clear state and the long-press timer, avoiding retained DOM references or orphaned work.

## Scope

Only `bible.html` production behavior changes. Design and implementation-plan documents are the only additional tracked files. The existing untracked `.context/`, `.superpowers/`, `IMG_5255.png`, and `bible.json` remain untouched.
