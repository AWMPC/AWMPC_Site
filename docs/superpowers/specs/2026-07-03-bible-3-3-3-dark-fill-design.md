# Bible 3.3.3 dark active-fill design

## Goal

Release Bible app version 3.3.3 and make active verse fills in dark palettes
only barely lighter than their page backgrounds.

## Version

- Set both visible footer markup and `APP_VERSION` to `3.3.3`.

## Palette

- Keep every light palette unchanged.
- Keep every dark background, foreground, accent, glow, and inactive-verse
  treatment unchanged.
- Replace only dark `--selection-fill` values:
  - Base: `#111722`
  - Spring: `#101a11`
  - Summer: `#1e190d`
  - Fall: `#22120c`
  - Winter: `#0d1b28`
- Each fill remains lighter than its corresponding dark background, while its
  scripture text contrast remains at least 4.5:1.

## Verification

- Update the palette contract with the exact five dark fills and require each
  to be lighter than its background while retaining 4.5:1 text contrast.
- Add a version contract requiring both version locations to be `3.3.3`.
- Run the full Node suite and whitespace check.

## Non-goals

- No changes to light palettes, active glow/border treatment, navigation,
  double activation, data, or context-menu behavior.
