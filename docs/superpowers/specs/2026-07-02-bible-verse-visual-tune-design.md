# Bible Verse Visual Tune Design

## Goal

Replace the quintic smootherstep motion introduced in the latest iteration with the prior unified cubic curve, and return verse visuals to the f22-era transparent layout while retaining a calm inactive highlight and a clearly active border.

## Motion

Use one non-quintic curve throughout the app: `cubic-bezier(.64, 0, .36, 1)`. Remove the CSS `linear(...)` smootherstep approximation and replace the JavaScript `smootherstep()` calculation used by verse centering with the matching cubic-bezier timing function. Keep existing duration, reduced-motion, cancellation, and keyboard-follow behavior unchanged.

## Verse treatment

Verses use no default border, preserving the f22 transparent layout and avoiding visual grid lines. Every inactive verse receives a quiet seasonal-tint background highlight. The active verse keeps that background and adds a 2px solid seasonal accent border using the existing accent color. It has no glow, box shadow, outline, or additional background transition.

Footnote expansion changes padding only; it does not add or thicken a border. Keyboard and pointer selection share the same active state and visuals.

## Testing

Tests must assert that the single motion token and verse-centering function no longer use quintic smootherstep, that all seasonal palettes provide the inactive highlight, and that inactive verses have no border while active verses use a 2px accent border. Existing tests continue to enforce seasonal contrast, reduced motion, UI reflow, keyboard follow, and absence of glow.
