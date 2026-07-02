# Bible Responsive Seasonal UI Design

## Goal

Make Text Scale visually proportional across the entire Bible SPA, complete the seasonal color system so ordinary UI chrome no longer leaks the base Samsung blue palette, simplify verse emphasis, introduce responsive two-bar navigation, guarantee WCAG 320 CSS-pixel reflow, and give all application motion one quintic smootherstep language.

The work remains in the existing `bible.html` single-page application. It adds no framework, package, network service, persistent preference, or personal-data path.

## Approved Direction

The approved approach extends the existing semantic CSS-variable system. It does not transform-scale the document and does not duplicate scale or palette formulas independently across components.

The visual direction was approved through the browser companion:

- Text Scale option B: shrink the whole UI below 100%, while retaining current control geometry from 100% upward;
- mobile: chapter navigation at the top and actions at the bottom;
- tablet/desktop: separate bottom-left chapter and bottom-right action bars;
- every verse has a seasonal background, while only the active verse has a border;
- all application motion uses quintic smootherstep;
- WCAG 320 CSS-pixel reflow is required, rather than constraining desktop scripture columns to 320px.

## Shrink-Only UI Geometry

Typography continues using the supported Text Scale values of 50%, 75%, 100%, 125%, and 150%.

General UI geometry uses:

```text
detailScale = min(textScale / 100, 1)
```

The factor is 0.5 at 50%, 0.75 at 75%, and 1 at 100%, 125%, and 150%. This extends the shrink-only behavior already used by verse and footnote geometry.

Semantic geometry tokens cover:

- control and icon-button heights;
- control horizontal and vertical padding;
- panel and navigation padding;
- gaps between controls, cards, grids, and panels;
- ordinary control, card, menu, dialog, and panel radii;
- search result, history item, book, chapter, and settings geometry;
- both responsive chrome bars and their internal controls;
- ripple and other geometry whose visible size must remain proportional.

At 100–150%, ordinary UI geometry remains at the current 100% baseline. At 50–75%, it shrinks proportionally with the text.

Accessibility-critical borders remain at least 1 CSS pixel. Where the visibly compact control would otherwise produce an impractical pointer target, an invisible or transparent hit area preserves usability without visually restoring the oversized box. The layout must never use transform scaling because it would distort scroll measurements, fixed positioning, pointer coordinates, and reflow.

## Responsive Two-Bar Chrome

The bottom chrome is separated into two semantic groups:

1. chapter navigation: previous, book, chapter, verse, next;
2. application actions: History, Search, and hamburger/social menu.

### Mobile

At the mobile breakpoint:

- chapter navigation occupies a dedicated top floating bar;
- the application-action bar remains at the bottom;
- History and Search stay grouped at the left edge of the bottom bar;
- the hamburger/social button is pinned to the far right;
- the reader receives top and bottom clearance so neither bar covers scripture.

### Tablet and desktop

Above the mobile breakpoint:

- chapter navigation occupies a separate bottom-left floating bar;
- History, Search, and hamburger/social occupy a separate bottom-right floating bar;
- the hamburger/social button remains the rightmost action;
- the two bars do not merge into one full-width surface.

### Shared scroll behavior

Both bars in the active responsive layout share the existing directional visibility rule:

- scrolling downward hides both bars;
- scrolling upward reveals both bars;
- arriving at relevant scroll boundaries preserves the existing explicit visibility behavior;
- a single state and animation-frame lifecycle drives both bars, preventing drift or competing animation work.

Viewport rotation, resize, virtual-keyboard changes, and browser-chrome changes trigger clearance recomputation. Responsive placement is CSS-driven and is not stored as a preference.

## WCAG Reflow and Control Wrapping

Every application view must reflow at a viewport equivalent to 320 CSS pixels wide without requiring horizontal page scrolling. This applies to:

- the scripture reader and footnotes;
- book, chapter, and verse selection grids;
- search controls and search results;
- history;
- settings and authentication status;
- dialogs and context actions;
- top and bottom responsive bars.

Long scripture, footnotes, search text, and labels wrap within bounded containers. Navigation labels that cannot safely wrap may use the existing bounded marquee behavior. No control, result, panel, or dialog may make the document wider than the viewport. Exceptions are limited to content for which two-dimensional layout is essential; the current Bible SPA has no approved exception.

Tablet and desktop retain a comfortable centered reading measure rather than forcing 320px columns.

## Complete Seasonal Palette Ownership

The current seasonal selectors override core backgrounds, text, accents, notes, and pills but leave several UI variables inherited from the base One UI light/dark palette. That incomplete ownership is why blue surfaces remain under Spring, Summer, and Fall.

Each season/light-mode combination will define the complete ordinary UI token set:

- page, secondary, elevated, and inset surfaces;
- primary, secondary, tertiary, and muted foregrounds;
- standard, strong, and translucent borders;
- accent and accent foreground;
- card backgrounds and card borders;
- navigation and action bar backgrounds, foregrounds, borders, and shadows;
- FAB/hamburger background and foreground;
- menu and dialog backgrounds and shadows;
- hover, pressed, selected, and focus surfaces;
- verse, footnote, and note surfaces;
- loading skeleton surfaces;
- ordinary control and input surfaces.

Ordinary UI surfaces must not fall through to the base blue palette when a non-Winter season is selected. Winter intentionally remains ice-blue.

Semantic colors remain independent where meaning is more important than season:

- errors and destructive states;
- warnings;
- search-match emphasis;
- authentication or sync failure states.

These semantic exceptions must still meet contrast requirements and should harmonize with the active palette without being mistaken for its accent.

## Verse Emphasis

Every rendered verse always receives a subtle background derived from the active seasonal palette.

Inactive verses:

- have the seasonal verse background;
- have a transparent border that reserves active-border geometry and prevents layout shift;
- have no visible border;
- have no glow or shadow.

The active verse:

- uses the same background family;
- gains the season-aware active border;
- has no glow or box shadow.

Only the active verse receives a visible border. Keyboard focus uses an outline, not a second border. When the focused verse is active, the focus treatment must not create a visually doubled border.

Search/history found emphasis transitions directly into the final active treatment. It must not fade out and then fade back into active state, and it must not lock interaction during a decorative sequence.

Footnote-open styling remains distinct through its existing surface/padding treatment without granting an inactive verse an active border.

## Contrast Requirements

Every seasonal light/dark combination must meet:

- at least 4.5:1 for normal text against its rendered background;
- at least 3:1 for large text where the WCAG large-text exception applies;
- at least 3:1 for active borders, keyboard focus indicators, and meaningful control boundaries against adjacent colors;
- visible hover, pressed, selected, and disabled distinctions that do not rely on color alone where another cue is required.

Contrast is validated from the final composited colors, including translucent and `color-mix()` surfaces, rather than from uncomposited token values.

## Unified Quintic Motion

The canonical easing is quintic smootherstep:

```text
6t^5 - 15t^4 + 10t^3
```

JavaScript motion uses the exact function already established by verse centering.

CSS transitions and keyframes use one shared sampled `linear()` easing token that represents the same monotonic curve. A single cubic-bezier approximation is declared immediately before the sampled value as a compatibility fallback for browsers that do not support CSS `linear()` easing.

All application-controlled animation families use the shared easing token:

- bar hide/show movement;
- chapter and view transitions;
- dialogs and context menus;
- dropdown and panel movement;
- verse found-to-active transition;
- hover, press, focus, and selection transitions;
- ripple expansion/fade;
- marquee start/stop transitions where easing applies;
- loading skeleton movement where a non-linear easing is appropriate.

Durations remain purpose-specific. A press response stays faster than a dialog or chapter transition; only the acceleration/deceleration language is unified.

Reduced-motion mode continues to collapse transitions and animations to effectively immediate state changes. Infinite decorative animation is removed or stopped under reduced motion.

## State, Security, and Resource Safety

The change reuses existing Text Scale, season, appearance, chapter-position, history, and verse-link state. It introduces no storage key or migration.

The work introduces no dynamic HTML evaluation, user-derived CSS, API request, third-party dependency, or personal information. Palette and geometry values are static application constants.

Scroll-controlled chrome keeps one requestAnimationFrame lifecycle. Completion, cancellation, view departure, and reduced motion clear scheduled work and retained references. Resize observation remains bounded to existing application elements.

## Verification

Strict durable tests will cover:

- exact shrink-only UI geometry at 50%, 75%, 100%, 125%, and 150%;
- mutation-sensitive application of every required geometry token;
- fixed minimum border widths and preserved interaction hit areas;
- full seasonal token ownership for four seasons in light and dark modes;
- computed contrast across verse, text, borders, focus, controls, and ordinary surfaces;
- no visible base-blue token leakage in Spring, Summer, or Fall;
- every verse having a background;
- inactive verses lacking visible borders and shadows;
- only the active verse receiving a visible border and no shadow;
- mobile top/bottom bars and tablet/desktop left/right bars;
- left-aligned History/Search and right-pinned hamburger/social control;
- synchronized directional hide/show state;
- 320 CSS-pixel reflow without horizontal document overflow;
- exact JavaScript smootherstep behavior and shared CSS easing ownership;
- retired ad-hoc easing declarations being absent;
- reduced-motion behavior and animation-frame cleanup.

Rendered in-app browser acceptance covers:

- 320px mobile, a normal mobile viewport, tablet, and desktop;
- 50%, 75%, 100%, 125%, and 150% Text Scale;
- Spring, Summer, Fall, and Winter in light and dark modes;
- scripture, footnotes, search, history, settings, dialogs, and selection grids;
- keyboard and pointer focus/selection parity;
- bar placement, clearance, rotation/resize, and directional hiding;
- animation feel, cancellation, reduced motion, and console health.

## Scope

Production changes are limited to the existing Bible SPA and any directly related cache/version metadata required to serve the changed asset correctly. Durable tests and design/plan documents may be added or updated. Existing untracked `.context/`, `.superpowers/`, `IMG_5255.png`, and `bible.json` remain untouched.
