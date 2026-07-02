# Bible verse focus cleanup design

## Goal

Keep verse selection visually identical for pointer and keyboard navigation while removing the background from inactive verses.

## Design

- Inactive `.verse` elements have a transparent background and transparent border.
- The active verse continues to use the existing 2px seasonal `--accent` border as the only selection indicator.
- Arrow-key navigation continues to programmatically focus the newly active verse for keyboard semantics and assistive technology.
- `.verse:focus-visible` explicitly has no outline, preventing the browser user-agent focus ring from appearing in addition to the active border.

## Accessibility and verification

The active state is synchronized before focus is moved, so keyboard focus retains one visible, season-aware indicator. Tests will assert the transparent inactive background, the focused-verse outline suppression, and unchanged active-border rules. Browser verification will compare pointer and Arrow-key selection.
