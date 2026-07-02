# Bible Menu, Keyboard Follow, and Verse Border Polish

## Scope

This change corrects three related reader-polish issues without changing Bible data, navigation semantics, history behavior, sharing, or synchronization:

1. Scale the custom settings/menu panel along with Text Scale below 100%.
2. Keep held-arrow keyboard navigation visibly centered in real time.
3. Give all verses a subtle border and the active verse a quiet, stronger border that remains subordinate to scripture text.

## Scale-aware settings panel

The custom `.fab-panel` is application HTML/CSS, not the operating system's native select popup. Its width, viewport inset, maximum-height clearance, and entrance displacement will derive from the existing shrink-only UI geometry system. At 50% and 75%, these dimensions shrink proportionally; at 100%, 125%, and 150%, they retain today's 100% geometry. The panel remains bounded by the viewport and maintains the existing 320 CSS-pixel reflow contract.

Closed native `<select>` controls continue to inherit the app's scaled height, typography, padding, and radius. The option popup shown after opening a select remains operating-system/browser controlled and is outside the CSS scaling guarantee.

## Real-time keyboard following

Up/Down Arrow navigation will keep the active verse near the vertical center continuously, including during native key repeat. Verse selection remains immediate. A single request-animation-frame loop owns viewport movement.

When a new arrow event arrives during motion, the current rendered scroll position becomes the new interpolation start and the newly active verse becomes the destination. Retargeting must not introduce an idle timer, wait for keyup, create a second animation frame, or reset the viewport to a stale destination. Motion continues with quintic smootherstep and a short duration derived from the remaining distance, so nearby repeats feel responsive while longer corrections remain smooth.

The active verse must not leave the visible reader viewport during ordinary key-repeat navigation. If the next target would cross a visibility guard near the viewport edge, the scroll position is corrected immediately enough to preserve visibility while the centering animation continues. Reduced-motion mode centers immediately with no scheduled animation.

## Verse borders

Every verse uses a one-pixel seasonal boundary:

- Inactive verses use a very low-contrast “whisper” border.
- The active verse uses the approved option B “quiet” border.
- The active border is stronger than the inactive border but intentionally lower-contrast than normal scripture text against the verse surface.
- Seasonal active background highlighting remains the primary state cue.
- No glow, shadow, double border, or separate keyboard-only focus treatment is introduced.

The border hierarchy is measured as a relationship rather than as a WCAG meaningful-control boundary: inactive border contrast < active border contrast < scripture text contrast. Verse text retains its existing WCAG contrast. This exception is appropriate because the border is supplemental decoration, not the only indicator or an interactive-control boundary.

## State and lifecycle

No new persisted state, storage key, network request, observer, or timer is added. Existing verse-chase state is reused and tightened so one animation frame owns movement and cleanup clears all references. Mouse/touch selection continues to use the same active-verse styling.

## Verification

Strict tests will cover:

- Settings-panel geometry at 50%, 75%, 100%, 125%, and 150%.
- Viewport bounding at 320 CSS pixels.
- A held-arrow sequence retargeting one live animation without idle delay, stale destinations, or multiple scheduled frames.
- Immediate reduced-motion centering.
- Active-verse visibility during repeated navigation.
- Seasonal border hierarchy across all four seasons and light/dark modes.
- Absence of verse glow, double borders, and input-method-specific styling.
- Full existing test suite, inline JavaScript parse, rendered browser verification, and `git diff --check`.

## Out of scope

- Styling or resizing the operating system's opened native-select popup.
- Changing arrow-key selection semantics or chapter navigation.
- Changing verse background colors, scripture typography, history, hyperlinks, or context-menu behavior.
