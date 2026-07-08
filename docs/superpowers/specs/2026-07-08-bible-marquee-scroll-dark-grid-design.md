# Bible Marquee, Reader Chrome, Dark Palette, and Grid Design

Date: 2026-07-08
Status: Implemented, reviewed, and verified

## Scope

Update `bible.html` in four narrowly related UI areas:

1. Make both endpoints of overflowing marquee text fully readable.
2. Give dark mode a quieter active-verse border and a reading background that is visibly darker than the active verse fill.
3. Prevent scripted verse positioning after chapter navigation from triggering the manual-scroll chrome hiding behavior.
4. Keep chapter and verse picker column counts divisible by three while adapting to available horizontal space and the current UI scale.

The change will not add network access, storage, credentials, analytics, or user-data handling.

## Marquee Endpoint Visibility

Keep the existing clipped, masked marquee and shared motion easing. Synchronize the text movement with the mask phases:

- At the start, hold `translateX(0)` while the left edge is fully opaque so the first glyph is completely visible.
- Move only during the middle portion of the animation.
- At the end, hold the final translation while the right edge is fully opaque so the last glyph is completely visible.

The movement distance remains the measured overflow distance. No duplicated text, continuously moving ticker, timer, or new event listener is needed. Reduced-motion behavior remains static.

Because the book control is also an inline-flex button, overflowing marquee labels align to the inline start while marquee mode is active. Ordinary, non-overflowing navigation labels retain their centered alignment. This prevents flex centering from clipping the leading text before animation begins.

## Dark Reader Hierarchy

The default dark reading surface must be visibly darker than the active verse fill in the base palette and every seasonal dark palette. Scripture text must retain at least 4.5:1 contrast against both surfaces.

The active verse must no longer use the raw accent as its border. Add a dedicated palette-derived active-verse border token that is quieter than the accent while remaining distinguishable against the active fill. Remove or materially subdue the current accent glow so the border does not regain the same excessive brightness through its shadow.

The active state remains redundant and accessible through fill, border, and focus semantics. The active verse retains its ARIA behavior and gains a visible focus-only outline for keyboard navigation.

## User-Intent Scroll Ownership

Programmatic verse positioning will have explicit lifecycle ownership. While that ownership is active, scroll events will synchronize the chrome scroll baseline but will not hide or reveal the bars.

Ownership begins before any scripted `scrollTop` write, including the initial visibility correction. It remains active through reduced-motion jumps, near-zero moves, and animated verse chasing. Every completion, cancellation, view transition, and manual interruption clears ownership and synchronizes the baseline.

Existing wheel and touch-start handlers continue to cancel verse chasing before manual movement. After that handoff, the existing direction-and-threshold chrome behavior applies normally. The implementation will not use timeouts, `Event.isTrusted`, or inferred timing to classify scroll origin.

## Modulo-Three Responsive Grids

Chapter and verse pickers share one pure column-count rule. Given available inner width `W`, effective minimum cell width `M` for the current UI scale, and gap `G`:

1. Compute the largest raw count that fits: `floor((W + G) / (M + G))`.
2. Snap downward to the nearest positive multiple of three: `max(3, floor(raw / 3) * 3)`.
3. Apply that count through a CSS custom property used by `grid-template-columns`.

Examples: a raw fit of 5 becomes 3 columns; 6 remains 6; 8 becomes 6; 10 becomes 9. Rows remain implicit and content-driven. No placeholder buttons or empty semantic cells are added.

The effective minimum width scales with the existing UI scale so enlarging controls can move the grid to the previous multiple of three and shrinking controls can move it to the next multiple. The count recomputes when the active grid's measured width or UI scale changes.

Use one tracked observer or an existing coalesced resize path. It must be disconnected or retargeted when views change so repeated navigation cannot accumulate observers, listeners, or animation frames.

## Testing

Tests are written before production changes and must fail for the current behavior.

- Marquee tests require matching endpoint holds for mask and translation and preserve reduced-motion behavior.
- Palette tests cover base and seasonal dark modes, readable foreground contrast, a darker default surface, a lighter active fill, and a non-raw-accent active border.
- Scroll tests prove programmatic downward movement updates the baseline without hiding chrome, then prove a subsequent manual downward movement hides it. Completion, reduced-motion, cancellation, and manual-interruption paths must release ownership.
- Grid tests execute the pure fit-and-snap rule across representative widths, scales, gaps, and boundary transitions. Every result must be at least three, divisible by three, deterministic, and the largest fitting multiple of three when at least three cells fit.
- Structural tests require both chapter and verse grids to use the same computed column property and require observer cleanup.

Run the complete existing Node suite with:

`mise exec node@24 -- node --test tests/*.test.js`

Rendered verification will exercise desktop and mobile-sized viewports, including `1 Thessalonians`, repeated Next Chapter actions, manual scrolling after navigation, dark mode, and grid transitions across width and scale changes. Console errors, clipping, layout overlap, and stale observers will be checked.

## Security, Privacy, and Resource Safety

All text continues to enter the DOM through `textContent`; no HTML parsing sink is introduced. The grid calculation accepts only local numeric geometry and clamps non-finite or invalid values. No PII, private domains, customer values, or credentials are added.

The implementation will reuse bounded state, cancel or coalesce animation frames, and disconnect any grid observer when it is no longer needed. It will not allocate per-scroll listeners or timers.

## Out of Scope

- Changing Bible data, history semantics, search behavior, or verse selection behavior.
- Making row counts divisible by three.
- Adding filler cells.
- Redesigning the navigation or reader layout.
- Altering network or service-worker behavior.
