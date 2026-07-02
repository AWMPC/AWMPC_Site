# Bible Text Scale Design

## Goal

Replace the three-level Display Size setting with a five-level Text Scale setting that changes every visible text string while keeping the interface geometry at its current 100% size.

## Interface

The setting label becomes `Text Scale`. Its native dropdown contains plain text options with no emoji:

- `50%`
- `75%`
- `100%`
- `125%`
- `150%`

The default is `100%`. The control remains the same full-width native select used by Appearance and Season.

## Scaling Model

Text Scale applies to every visible string: scripture, verse numbers, book and chapter names, search text, history, navigation labels and glyphs, settings, authentication/status text, footnotes, dialogs, and error/loading messages. Image and vector assets do not scale.

The current Medium presentation is the 100% baseline. At each setting, typography is calculated from that baseline. Existing relative relationships remain intact—for example, verse numbers remain proportional to scripture and secondary labels remain smaller than their primary labels.

Control heights, icon-button boxes, input/select boxes, padding, gaps, panel dimensions, navigation dimensions, and touch targets stay at their current 100% values. Text may wrap in content areas that already support wrapping. Existing single-line controls continue to clip, ellipsize, or marquee according to their current behavior rather than enlarging the containing UI.

Implementation uses one text-scale factor plus scale-aware typography variables. Every explicit `font-size` declaration and its `min()`, `max()`, or `calc()` bounds must participate in the factor; inherited text uses the same factor. Geometry variables are no longer changed when Text Scale changes.

## State and Migration

The allowed stored values are the percentages `50`, `75`, `100`, `125`, and `150`. The existing local key `bible_font_step` and cloud field `font` remain in place to avoid a storage-schema expansion, but new writes contain percentages rather than indices.

Existing numeric values migrate when read:

- old `0` (Small) becomes `75`;
- old `1` (Medium) becomes `100`;
- old `2` (Large) becomes `125`.

The legacy Boolean `bible_large_font` maps `false` to `100` and `true` to `125`. Missing, invalid, non-numeric, or unsupported values fall back to `100`. A user selection writes the normalized percentage and removes the legacy Boolean key. Cloud hydration accepts both old indices and new percentages through the same normalization path, and synchronization sends the normalized percentage.

## Runtime Behavior

Applying a scale updates typography variables, synchronizes the dropdown value, persists only when requested, and reruns the existing bottom-clearance and marquee measurements because larger strings can change wrapping or truncation. It does not add listeners, timers, or DOM nodes.

The setting and internal functions should use Text Scale terminology. Compatibility storage names may remain unchanged where renaming would create migration risk.

## Quality, Accessibility, and Security

Focused checks will verify:

- exact label and option order, with no emoji;
- 100% fresh-user default;
- all five values persist and hydrate;
- old `0/1/2` and legacy Boolean values map correctly;
- invalid values fall back to 100%;
- representative text across scripture and UI follows 50–150% ratios;
- control and touch-target geometry is identical at every scale;
- 50% and 150% remain horizontally contained on mobile;
- inline JavaScript parses and no unrelated storage, network, or reader behavior changes.

The setting accepts only fixed native-option values. Normalization occurs before CSS or storage use, so it introduces no injection path, remote input, PII exposure, network request, long-lived allocation, or new lifecycle cleanup requirement.
