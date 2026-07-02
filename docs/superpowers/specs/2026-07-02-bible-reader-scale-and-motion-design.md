# Bible Reader Scale and Motion Design

## Goal

Improve the Bible reader at small Text Scale values by shrinking footnote-container geometry and active-verse glow geometry/strength, and replace the current distance-sensitive spring centering with the user-selected half-speed quintic smootherstep motion.

The work remains inside the existing `bible.html` SPA. It adds no dependency, service, persistent setting, or user-data path.

## Current Problems

### Footnote container

Footnote text already scales proportionally through `--text-17`, but the body retains fixed indentation, margins, padding, and corner radius. At 50% and 75% Text Scale, the container becomes visually oversized relative to its text.

### Active-verse glow

The active verse always uses `0 8px 28px var(--accent-glow)`. Its fixed downward offset, blur, and opacity remain large at small Text Scale values, overlap neighboring verses, and make the active state look vertically displaced.

### Verse centering

The current scroll chase increases pull and maximum velocity with distance. Distant verse clicks surge too aggressively, while nearby clicks receive too little momentum and settle slowly or unevenly.

## Shared Shrink-Only Detail Scale

Reuse the existing scale factor:

```text
min(textScale / 100, 1)
```

The resulting detail scale is 0.5 at 50%, 0.75 at 75%, and 1 at 100%, 125%, and 150%.

### Footnote body geometry

Route the following fixed values through semantic CSS variables and multiply their 100% baselines by the detail scale:

- closed left indentation: 20px;
- closed horizontal padding: 12px;
- visible top margin: 6px;
- visible bottom margin: 4px;
- visible left indentation: 20px;
- visible vertical padding: 10px;
- visible horizontal padding: 12px;
- corner radius: 20px.

At 50%, these become 10px indentation, 6px closed horizontal padding, `3px 0 2px 10px` visible margins, `5px 6px` visible padding, and 10px radius. At 75%, all values become three quarters of their baselines. At 100–150%, they remain at the current values.

The footnote body font continues using `--text-17`, so it preserves its current 85% relationship to the 20px reader baseline. The 40vh maximum-height safety cap and 1px/4px visible border widths remain fixed.

### Active-verse glow

Replace the fixed shadow geometry with semantic variables for:

- vertical offset: 8px baseline;
- blur radius: 28px baseline;
- effective color strength: 100% baseline.

All three use the detail scale below 100%. At 50%, the shadow uses a 4px vertical offset, 14px blur, and 50% of the theme’s existing accent-glow strength. At 75%, it uses 6px, 21px, and 75%. At 100–150%, the current `0 8px 28px` glow and theme strength remain unchanged.

Glow strength is derived from the existing theme-aware `--accent-glow` through `color-mix`, preserving seasonal and light/dark palette behavior. No theme receives a hard-coded replacement color.

## Quintic Verse-Centering Motion

Replace the spring velocity/pull model with bounded time-based interpolation using quintic smootherstep:

```text
progress(t) = 6t^5 - 15t^4 + 10t^3
```

This curve begins and ends with zero velocity and acceleration, is monotonic from 0 to 1, and has no overshoot.

### Distance-based duration

Duration increases moderately with absolute pixel distance:

```text
durationMs = clamp(350, 300 + distancePx * 0.85, 820)
```

This produces approximately 350ms for a one-verse movement and approaches the selected 820ms cap for distant jumps. Pixel distance, not verse count, is authoritative because verse heights vary with content, footnotes, and Text Scale.

### Animation state

The reader keeps one animation-frame loop with:

- start scroll position;
- destination scroll position;
- start timestamp;
- duration;
- active target element;
- frame identifier.

Each frame clamps elapsed progress to `[0, 1]`, applies smootherstep, interpolates between start and destination, and stops exactly at the destination when progress reaches 1.

Retargeting cancels the old frame and starts a new interpolation from the current scroll position. Wheel, touch scrolling, view departure, and explicit chase cleanup cancel the active frame and clear all retained animation state. Reduced-motion mode centers immediately without creating a frame.

## Validation

Strict RED/GREEN contracts will verify:

- exact footnote geometry at 50%, 75%, 100%, 125%, and 150%;
- exact glow offset, blur, and strength at all five scales;
- the footnote and glow variables are actually written by `applyTextScale()`;
- mutation checks fail if any required variable write is removed;
- footnote border widths and maximum height remain fixed;
- smootherstep returns exactly 0 at 0 and 1 at 1;
- smootherstep is monotonic, bounded, and has no overshoot across sampled progress values;
- duration starts at 350ms, rises with distance, and caps at 820ms;
- retargeting and cancellation retain at most one scheduled frame;
- reduced-motion behavior remains immediate.

Rendered acceptance will compare 50%, 75%, and 100% footnote containers and active glows; check neighboring verses for glow encroachment; compare nearby and distant centering; interrupt motion with wheel/touch input; verify retargeting; and check mobile horizontal overflow and browser console health.

## Security and Resource Safety

The change introduces no HTML construction, dynamic code execution, network request, storage key, external dependency, or personal-data handling. It reuses a single animation-frame lifecycle and clears target/state references on completion and cancellation. Scaling remains synchronous and bounded to supported Text Scale values.

## Scope

Production changes are limited to `bible.html`. Design and implementation-plan documents are the only additional tracked files. Existing untracked `.context/`, `.superpowers/`, `IMG_5255.png`, and `bible.json` remain untouched.
