# Bible Reader Sheet Redesign

Date: 2026-07-08
Status: Approved for implementation

## Goal

Keep the Bible reader mounted while History, Settings, Search, verse actions, and Bible navigation use one consistent native modal-sheet experience. Remove marquee fading, restore the last private reading location, and preserve responsive modulo-three selection grids.

## Shared sheet

One persistent `<dialog id="app-sheet">` owns the backdrop, focus containment, focus restoration, browser-history integration, and gesture lifecycle. Its content kind is one of `history`, `settings`, `search`, `selection`, or `verse-actions`; opening another kind reuses the same dialog rather than adding document listeners or duplicate modal nodes.

History, Settings, Search, and verse actions open as full-width bottom sheets. The initial compact snap is approximately 70dvh and the expanded snap is 100dvh. A bottom sheet drags upward to expand and downward to close.

Bible navigation follows the responsive navbar edge. At 640px and below it opens from the top, drags downward to expand, and upward to close. Above 640px it behaves as a bottom sheet. The handle is the primary vertical drag surface. A nested scroller transfers control to the sheet only at the relevant boundary.

Pointer gestures use capture, an axis lock, displacement and velocity thresholds adapted from `wmpc_pager.php`, and complete cleanup for `pointerup`, `pointercancel`, and `lostpointercapture`. Reduced motion settles immediately. Escape, backdrop activation, browser Back, the explicit close button, and edge-relative dismissal share one close path.

## Selection pager

The selection sheet contains three persistent pages: Books, Chapters, and Verses. Navbar buttons open the matching page directly. Horizontal swipes change one page at a time, while vertical movement belongs to the sheet gesture after axis lock. Three accessible dot buttons expose the active page and allow direct switching.

Selecting a book updates the selection context and advances to Chapters. Selecting a chapter advances to Verses. Selecting a verse commits the new reader location and closes the sheet. The existing modulo-three column algorithm is retained and observes only the visible grid; observers and scheduled frames disconnect on page changes and sheet close.

## Search

Search becomes sheet content and never clears the mounted reader. Its index builds in bounded idle chunks after Bible data loads. Until ready, the existing shimmer skeleton is displayed. Closing Search cancels its debounce and focus timers and invalidates detached results. Queries are length-limited before local persistence, never placed in URLs or logs, and result text continues to use `textContent` and text nodes.

## Reading restoration and browser history

Startup precedence is a valid explicit verse URL, the newest valid entry in the owner-isolated `bible_chapter_positions` MRU, Genesis 1:1, then the first valid dataset verse as a defensive fallback. Stored references are normalized against loaded data before use. Quarantined or switched-account storage is never bypassed, and the reader does not jump after a late authentication result.

Active-verse changes debounce `history.replaceState` with the canonical verse URL, so reload restores the actual last position without adding browser entries. Opening a sheet pushes exactly one state over the current reader route. Sheet-kind and selection-page changes replace that state. Closing uses Back; selecting a result or verse replaces the temporary sheet state with the new canonical reader state.

## Marquee

Overflow measurement and horizontal sway remain. All mask declarations, registered fade properties, fade keyframes, and fade-specific reduced-motion rules are removed. Endpoint holds continue to expose the full beginning and ending of the label without fading any text or border pixels.

## Accessibility, security, and lifecycle

The shared sheet uses native dialog semantics, a labelled title, a close button, focus restoration, safe-area padding, minimum target sizes, and keyboard equivalents for drag-only states. Reader content remains inert while the modal is open. No search or reading data is logged, added to network requests, or exposed across owners.

The singleton controller owns and releases pointer capture, animation frames, settle timers, search timers, idle-index work, and grid observers. Repeated open/close cycles must not grow document listeners or retain detached content.

## Verification

Strict tests cover fade removal, sheet state/history transitions, both edge directions, gesture cancellation, axis ownership, reduced motion, search cleanup, pager/dot semantics, active-grid observation, startup precedence, owner quarantine, canonical route replacement, and repeated lifecycle cleanup. Browser QA covers 320px, 640px, and desktop widths in light/dark and reduced-motion modes.
