# Bible selection surface design

## Goal

Make the Bible app’s default surface darker, use a lighter WCAG-compliant seasonal fill for reading and selection, and prevent desktop navigation from expanding unnecessarily.

## Surface hierarchy

- Every seasonal light and dark palette defines a darker default app background and a lighter `--selection-fill`.
- The lighter selection fill has at least 4.5:1 contrast against the palette’s scripture text color (`--fg`).
- Reader verses are transparent when inactive, revealing the darker default surface.
- The active verse uses `--selection-fill` and retains its existing 2px seasonal accent border.
- Every book and chapter picker button uses `--selection-fill`; the selected button retains its existing active border/text state.

## Navigation sizing

- On desktop, the floating navigation bar does not grow into unused space.
- The book control reserves 16ch for the longest book label. Chapter and verse controls keep their existing 44px minimum target size.
- On mobile, existing constrained-width and marquee behavior remains in force.

## Verification

Tests must calculate 4.5:1 minimum contrast for `--fg` against each seasonal `--selection-fill`, assert the transparent inactive verse and active selection fill, assert picker-button fill, and preserve desktop/mobile navigation sizing contracts. Browser checks will compare desktop nav width and mobile marquee behavior.
