# Bible Reader Interaction, Responsive Layout, and Seasonal Theme Design

Date: 2026-06-30

## Summary

Improve the existing single-file Bible SPA without changing its deployment model. The work fixes mobile search overflow, adds touch chapter navigation and verse actions, makes reading history reflect settled reading, restores per-chapter reading positions for adjacent navigation, adds linkable verses, introduces four accessible seasonal color families, and shortens interaction transitions.

The implementation remains in `bible.html`. It adds no framework, build step, Node runtime module, or new automated test harness.

## Goals

1. Keep every view within the mobile viewport at all display sizes.
2. Make chapter and verse navigation feel native to touch, mouse, and keyboard input.
3. Record meaningful reading history rather than transient chapter visits.
4. Restore the reader's place when moving backward and forward through adjacent chapters.
5. Make every valid verse independently addressable, copyable, and shareable, including Matthew 17:21.
6. Provide accessible Spring, Summer, Fall, and Winter palettes in light and night appearances.
7. Keep transitions responsive, curved, and respectful of reduced-motion preferences.
8. Preserve DOM safety, offline use, bounded state, and leak-free event handling.

## Non-goals

- Converting the SPA to a framework or modular Node application.
- Adding a build system or runtime dependency.
- Redesigning authentication, Bible data, search matching, or the existing bottom navigation.
- Cloud-syncing per-chapter position memory.
- Adding a new automated test framework or Node test layer.

## Architecture

All runtime behavior stays in `bible.html`. New code is organized into focused internal CSS and script sections:

- responsive search and typography styles;
- press and ripple feedback;
- reader gesture handling;
- chapter-position and settled-history state;
- verse action menu, copy, share, and deep-link handling;
- seasonal palette tokens and resolution.

Existing render and navigation functions remain authoritative. Swipe gestures, arrow buttons, and keyboard chapter navigation converge on the same adjacent-chapter function. Verse activation continues to use the current active-verse and centering paths. No parallel router or rendering system is introduced.

One delegated pointer listener handles verse interactions, and one delegated press-feedback listener handles ripple effects on supported interactive surfaces. View changes cancel pending timers, pointer state, animation frames, and temporary UI.

## Responsive Search and Typography

Search containers, result cards, snippets, history rows, and the input receive bounded widths and `min-width: 0`. Text wraps normally, including safe breaking for unusually long tokens. No search child may establish a width larger than its viewport container.

On narrow screens, the search bar remains within the content column. Large display mode clamps search-specific font size, horizontal padding, and control dimensions so the input and results remain readable without forcing horizontal overflow. General reader text can retain its requested large size.

Verse numbers use a proportional `em` size derived from the reader font rather than the current fixed 14 px. Their visual hierarchy remains subordinate to the verse while scaling with Small, Medium, and Large display modes.

## Chapter Swipe Navigation

Swipe navigation is active only in the chapter-reading view. A gesture qualifies when:

- the initiating pointer is touch or pen input;
- horizontal travel is at least 72 CSS pixels;
- horizontal travel is at least 1.25 times vertical travel;
- the gesture did not begin on a footnote control, action menu, or another interactive control;
- no text selection or long-press action is active.

A left swipe advances to the next chapter. A right swipe returns to the previous chapter. Book boundaries use the same existing adjacent-chapter behavior as the arrow controls. Invalid edge navigation does nothing and leaves the current view stable.

The gesture listener remains passive until horizontal intent is established so normal vertical reading scroll is not blocked. Only one chapter transition can be accepted for a completed gesture.

## Chapter Position Memory

The reader tracks the active verse for each visited `book|chapter` key in an in-memory map. It persists the 200 most recently touched chapter positions to local storage after 500 ms without an active-verse change and when leaving a chapter or the page. This avoids a local-storage write on every scroll frame.

Before adjacent navigation, the current chapter's active verse is saved. Swipe, previous-arrow, next-arrow, and equivalent keyboard chapter navigation restore the remembered active verse for the destination chapter. If no valid saved verse exists, the destination starts at verse 1.

Other entry paths do not implicitly restore chapter memory:

- book/chapter selection starts at verse 1;
- a selected verse, search result, history entry, or deep link opens its explicit verse;
- invalid or stale stored verses fall back to verse 1.

Position memory remains device-local and is not included in Firebase synchronization.

## Settled Reading History

Entering a chapter starts one cancellable seven-second history timer. Moving to another chapter before it fires cancels the prior timer and starts a new one for the new chapter. Rapidly pressing Next three times therefore records only the final chapter if the reader stays there for seven seconds.

When the timer fires, history records the current active verse, not automatically verse 1. A chapter has at most one history entry, keyed by book and chapter. Later settled reading in that chapter updates and moves the existing entry rather than adding another entry for a different verse.

After the first commit, each active-verse change restarts a seven-second settled refresh for that chapter. The history entry therefore follows meaningful reading progress without writing on each scroll event. Existing history size limits and non-blocking cloud synchronization remain in place.

Leaving the reading view cancels pending history work. A timer verifies that its book and chapter are still active before committing, preventing stale closures from recording an abandoned chapter.

## Verse Press Behavior

In this design, an "active highlighted verse" means the single verse with the reader's persistent active state, whether selected by a press or chosen because it is nearest the reading viewport center. The temporary gold arrival highlight used by search or history navigation does not independently enable active-verse actions.

Pointer behavior is:

- Short press on an inactive verse: make it active and smoothly center it.
- Short press on the active verse: open all its footnotes if any are closed; otherwise close all its footnotes.
- Long press on the active verse: open the verse action menu.
- Long press on an inactive verse: activate and center it without opening the action menu. A later long press can open the menu.

Long press uses a 500 ms duration and cancels after 10 CSS pixels of movement. Pointer cancellation, view change, or a detected swipe also cancels it. The synthetic click following a successful long press is suppressed. Desktop right-click on the active verse opens the same action menu.

Keyboard behavior remains equivalent: verse activation and footnote toggling remain reachable, and the active verse's action menu is keyboard accessible.

## Press Feedback and Motion

Buttons, selectable rows, verses, and menu actions receive water-drop ripple feedback originating at the press point. The ripple is clipped to the pressed surface, expands once over 320 ms, fades, and removes its temporary node after completion. It never captures pointer events and is hidden from assistive technology.

Chapter crossfades, theme changes, menus, and press responses use shorter transitions, generally 180–220 ms, with ease-out or tuned cubic-bezier curves. Reduced-motion mode disables travel and ripple expansion, replacing them with a brief opacity response or no nonessential animation.

## Verse Action Menu

The active verse's long-press menu uses a semantic modal `dialog`: it appears as a bottom action sheet on narrow screens and as a compact centered dialog on wider screens. It contains exactly:

1. Copy Verse Text
2. Share Link to Verse

The dialog traps focus through native modal behavior, identifies the verse in its accessible label, returns focus to the active verse on close, and closes on Escape, backdrop press, completed action, or chapter navigation. Opening it does not add a browser-history entry, duplicate listeners, or orphaned state.

### Copy Verse Text

Copy uses the final rendered reading paragraph as its source so display-time verse reconstruction is respected. It extracts only the visible reading text for that verse and excludes:

- verse-control labels;
- footnote-toggle labels;
- collapsed or expanded footnote panels;
- action-menu content;
- decorative elements.

The clipboard format is `Book Chapter:Verse — rendered verse text`.

Matthew 17:21 is a required acceptance case. The current `bible.json` contains it as a nonblank explicit key, and it must remain a standalone rendered, active, copyable, and shareable verse. A verse materialized by rendering or source-footnote reconstruction must receive the same standalone behavior and reference identity.

### Share Link to Verse

The canonical link uses bounded query parameters, for example:

`bible.html?book=Matthew&chapter=17&verse=21`

On supported devices, Share opens the OS-native share sheet with the reference, rendered verse text, and canonical link. User cancellation is silent. When native sharing is unavailable, the app copies the canonical link and shows a brief accessible confirmation. Genuine clipboard or share failures show a concise non-blocking error.

Every valid verse can be represented by a canonical link, regardless of whether the menu is currently open. Opening a link waits for Bible data, validates the reference, renders the chapter, makes the verse active, centers it, and applies the existing arrival highlight. Invalid references fail safely to the normal starting view with a readable message; they never create selectors or HTML from untrusted input.

## Seasonal Theme Model

The settings panel contains two independent controls:

- **Season:** Auto, Spring, Summer, Fall, Winter.
- **Appearance:** Light, Dark, System.

Season Auto resolves from the device's local calendar using fixed Northern Hemisphere astronomical-style boundaries:

- Spring: March 20 through June 20;
- Summer: June 21 through September 21;
- Fall: September 22 through December 20;
- Winter: December 21 through March 19.

The chosen season preference syncs as ordinary UI preference data. The resolved automatic season is calculated locally and is never stored as a replacement for Auto. Appearance preserves the existing light, dark, and system-preference behavior.

Each season supplies semantic tokens for backgrounds, elevated surfaces, text levels, accents, verse numbers, focus indicators, footnotes, selections, errors, shadows, and highlights in both light and night appearances:

- Spring uses fresh grass green.
- Summer uses warm sandy yellow.
- Fall uses autumn maple orange.
- Winter evolves the current palette toward ice blue.

The implementation follows the approved calm palette direction: seasonal identity is strongest in accents and selected states, while reading surfaces remain low-saturation and comfortable. Normal text meets at least 4.5:1 contrast. Large text, focus indicators, and essential UI boundaries meet at least 3:1. The page's `theme-color` metadata updates to the resolved palette.

## Loading, Offline Behavior, and API Backoff

Until `bible.json` has loaded and parsed, the content area shows a lightweight animated skeleton. Reduced-motion mode uses a static skeleton. A load failure replaces the skeleton with a readable error and explicit retry control.

Reading, local position memory, copy, and link generation do not require Firebase. Existing synchronization remains non-blocking and offline-first. Any synchronization path modified for the new season preference retries transient failures after nominal delays of 1, 2, 4, 8, and 16 seconds with up to 20 percent jitter, then waits for a new local change or an online event. Permanent authentication and validation failures are not retried. Retrying never blocks local UI or creates concurrent duplicate requests.

## Security and Privacy

- Deep links contain only public Bible references.
- Book names and numeric fields are decoded defensively, length-bounded, and accepted only if they resolve against loaded Bible data.
- Bible and URL content are rendered through text nodes or `textContent`, never untrusted `innerHTML`.
- Clipboard and native share actions require an explicit user action.
- Per-chapter position memory is local, bounded, and excluded from cloud data.
- No account, history, customer, company, domain, or other non-public data is added to committed fixtures or code.
- Temporary pointer, timer, animation, menu, and ripple state is cleared on navigation and teardown.

## Accessibility

- All action-sheet commands are semantic buttons with visible focus.
- The menu has an accessible name containing the active verse reference.
- Footnote expanded state is reflected with appropriate ARIA state on controls.
- Status confirmations and errors use a polite live region.
- Touch behavior has keyboard equivalents and does not remove existing arrow-key navigation.
- Ripple effects are decorative and never the sole indication of state.
- Reduced-motion preferences are honored across all new and shortened animations.
- All seasonal variants meet the defined WCAG contrast targets.

## Browser Acceptance Verification

Per project direction, this iteration adds no new automated test harness or Node test layer. Verification is performed directly in the browser against the following acceptance matrix:

### Responsive layout

- At viewport widths of 320, 375, 430, and 768 CSS pixels, search input, history, result references, and snippets never cause horizontal scrolling.
- Small, Medium, and Large display modes remain within the viewport.
- Long search text and long unbroken strings wrap safely.
- Verse numbers scale proportionally with reader text.

### Navigation and state

- Left and right swipes match Next and Previous arrow behavior, including book boundaries.
- Vertical scrolling and text selection do not accidentally change chapters.
- Three rapid Next actions create no history entries for skipped chapters; the final chapter appears only after seven seconds.
- History records the active verse and updates one entry per chapter.
- Returning by swipe or arrow restores the remembered verse; entering through general selection starts at verse 1 unless an explicit verse was selected.
- Reloading preserves local chapter-position memory, while signed-in cloud data does not contain it.

### Verse actions and links

- Inactive short press activates and centers; active short press toggles all footnotes.
- Active long press and desktop context click open the accessible action menu without also toggling footnotes.
- Copy contains exactly the reference and rendered reading text.
- Share opens the native sheet where supported and copies the link otherwise.
- A direct link to Matthew 17:21 opens, centers, highlights, copies, and shares that standalone verse.
- Invalid, oversized, or malformed link parameters fail safely.

### Themes, motion, and resilience

- Auto, Spring, Summer, Fall, and Winter resolve correctly in Light, Dark, and System appearances.
- Auto changes at the fixed boundary dates using local time.
- Every palette's text, focus, selected, footnote, and error states meet contrast targets.
- Reduced-motion mode removes nonessential movement.
- Repeated navigation does not accumulate action menus, ripple nodes, listeners, timers, or stale history commits.
- Loading, retry, offline reading, clipboard failure, share cancellation, and sync failure remain usable and non-blocking.

## Implementation Sequence

1. Fix responsive search widths and proportional verse-number sizing.
2. Centralize adjacent chapter entry options and add local position memory.
3. Replace immediate history writes with cancellable settled-history commits.
4. Add swipe recognition and unify it with existing adjacent navigation.
5. Add delegated verse presses, footnote toggling, ripples, and the action menu.
6. Add deep-link loading, rendered-text copy, native sharing, and fallback feedback.
7. Add seasonal tokens, season selection, Auto resolution, contrast tuning, and faster motion.
8. Add the loading skeleton, bounded retry behavior where synchronization is touched, and complete browser acceptance verification.
