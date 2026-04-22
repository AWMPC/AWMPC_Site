---
date: 2026-04-21
topic: bible-floating-controls
---

# Bible reader: floating controls and full-bleed reading

## Problem Frame

The AWMPC Bible web app (`bible.html`) dedicates vertical space to a two-row header toolbar and separate TTS chrome. Readers who want maximum space for scripture must trade away persistent navigation and quick access to settings. The goal is to remove low-value or redundant features (TTS, bookmarks), relocate primary navigation and tools into floating UI, and let verse content use the viewport edge-to-edge (with safe-area handling as needed on notched devices).

## Requirements

**Remove TTS (text-to-speech)**

- R1. Remove all user-facing TTS behavior: no listen/audio entry point, no playback bar, no speech synthesis–driven verse highlighting, and no OS media-session integration used only for TTS.
- R2. Remove ancillary UI tied exclusively to TTS (e.g. voice/speed/timer setup that exists only to configure reading aloud).

**Remove bookmarks**

- R3. Remove bookmarks from the product surface: no bookmark button on verses, no bookmark popup, no bookmarks view, and no navigation to a bookmarks screen.
- R4. Stop persisting bookmark state in application flows (including cloud sync payloads) in a way that implies the feature still exists; stale bookmark data in storage may be left inert or cleaned up—decision deferred to planning with a bias toward simplifying sync and avoiding surprise restores of a removed feature.

**Floating navigation bar**

- R5. Provide a floating (overlaid) navigation control, visually organized as **previous | book name | chapter number | next**, with affordances consistent with the following:
  - R5a. **Previous chapter control:** from the first chapter of a book, goes to the **last chapter of the previous book** in canonical order; at the first chapter of the first book (Genesis 1), there is no previous destination—the control is **disabled** and **visually de-emphasized** (e.g. grayed out).
  - R5b. **Next chapter control:** from the last chapter of a book, goes to the **first chapter of the next book**; at the last chapter of the last book, there is no next destination—the control is **disabled** and **visually de-emphasized** (e.g. grayed out).
  - R5c. **Tap book name** opens the **full Old/New Testament book list** (same destination as the current title control `nav-home`).
  - R5d. **Tap chapter number** opens the **chapter grid for the current book** (same intent as the current `nav-book` control, which shows chapters for the selected book).
- R6. ~~The bar is visible when navigation is relevant~~ **Superseded by R13** (iteration 2): the chapter bar is always visible whenever scripture data is loaded.

**Floating action button (FAB) stack**

- R7. Replace the header’s scattered controls with a **single primary FAB** that expands or reveals a **stack** of actions, preserving existing capabilities:
  - Google user profile (sign-in, avatar, sign-out) and **sync status** text as today.
  - **Dark mode** and **large text** toggles with the same semantics as current settings.
  - **Search** (opens existing search experience).
  - **History** (opens the same history list behavior as today’s history dropdown).
- R8. Each logical area that used a separate menu (profile vs. history vs. search) must remain discoverable and operable from this stack, including **nested or expanded panels** where needed so the FAB does not become a single overcrowded flat list—interaction pattern deferred to planning.

**Deprecate the header toolbar**

- R9. Remove the fixed top **toolbar** block that currently contains the title, profile, nav buttons, search, audio, bookmarks, and history—so scripture and other views can use vertical space without that strip.
- R10. **Edge-to-edge content**: the main reading area uses the full width and height available below system UI, with verse text extending to comfortable margins that may match or tighten current `view-inner` padding—exact spacing deferred to planning with a goal of maximal reading area.

**Reading typography**

- R11. **Verse numbers** use a **lighter** foreground color than verse body text so superscript numbers read as secondary metadata and contrast clearly with the passage (tune for both light and dark themes).

**Search quality**

- R12. **Fuzzy search:** queries match scripture text **without requiring exact string equality** for minor differences—examples include ignoring punctuation and hyphenation so a query like `barjesus` can match `Bar-Jesus` in the text. Specific normalization and ranking rules are deferred to planning; the user-facing goal is more forgiving matches than strict substring search alone.

**UI polish (iteration 2 — 2026-04-21)**

- R13. **Always-on chapter bar:** The floating chapter control (`previous | book | chapter | next`) is **always visible** after `bible.json` has loaded, regardless of whether the user is on the book list, chapter grid, verse view, or search. It is not tied to `uiView === 'verses'` only.
- R13b. **Reading anchor:** The bar always reflects a **single canonical reading position** `(book, chapter)` used for labels and for prev/next. That anchor **persists** when switching to book list, chapter grid, or search (it does not disappear or zero out). It **updates** when the user opens a verse chapter (same as today’s “current reading” intent).
- R13c. **Cold start:** Before the user has opened any chapter, the anchor defaults to the first book and first chapter in canonical order (e.g. **Genesis 1**), unless a stored preference or last-session restore says otherwise—exact default is deferred to planning if multiple options compete.
- R14. **FAB alignment:** The floating chapter bar and the primary FAB share the **same height** and sit on a **common horizontal baseline** (one row: bar and FAB aligned as a unit, e.g. bar left/center cluster + FAB right, with matching min-heights and vertical centering). Exact layout is deferred to planning; the user-facing goal is no vertical “step” between the two controls.
- R15. **Search result previews:** Each search hit’s text preview must **include the matched passage** so the user can confirm the hit **without** opening the verse. Snippets must not rely on a naive slice that misses fuzzy matches: when matching uses normalized text, the UI must **derive highlight bounds** in the raw verse so the `<mark>` (or equivalent) covers the actual matched substring in context, with enough surrounding characters for readability.

## Success Criteria

- Users can change book, chapter, and chapter grid without the old header; prev/next chapter is available from the floating bar.
- Profile, sync status, theme, font size, search, and history remain reachable from the FAB pattern without the header.
- No TTS or bookmark UI remains; the app does not advertise or sync bookmarks as an active feature.
- Reading views feel visually full-bleed compared to today (no persistent top chrome for global actions).
- Search finds relevant verses when the typed query does not exactly match surface punctuation or formatting (per R12).
- Verse numbers are visibly subtler than verse text (per R11).
- Chapter bar and FAB stay visible and visually aligned (R13–R14).
- Search previews show the real match in context so users trust the hit before navigating (R15).

## Scope Boundaries

- Non-goal: Replacing Firebase auth or changing search **history storage** beyond what removal of bookmarks requires (fuzzy **matching** behavior is in scope via R12).
- Non-goal: New features not listed (e.g. notes, sharing) unless they fall out trivially from layout work.

## Key Decisions

- **Book list entry point:** Tap **book name** on the floating bar → full book list; tap **chapter number** → chapter grid for the current book (confirmed 2026-04-21).
- **Chapter arrows:** Previous/next move by chapter and wrap across books; arrows **gray out** when no prior or next chapter exists (confirmed 2026-04-21).
- **Remove TTS and bookmarks entirely** rather than hiding behind flags—this is a deliberate product reduction to simplify the UI and maximize reading space.
- **Always-on chapter bar (iteration 2):** Navigation chrome stays on screen across all main views; reading anchor persists (R13–R13c).
- **Search previews (iteration 2):** Fuzzy matches must map to visible highlights in result snippets (R15).

## Dependencies / Assumptions

- `bible.json` structure and existing view functions (`showBooksView`, `showChaptersView`, `showVersesView`, `showSearchView`) remain the source of truth for navigation; floating UI rehomes triggers, not scripture data.
- Firestore user document shape may need adjustment when bookmarks are dropped from sync (planning).

## Outstanding Questions

### Resolve Before Planning

- (none)

### Deferred to Planning

- [Affects R4][Technical] Whether to migrate or delete `bible_bm2` / legacy bookmark keys locally and how to handle historical `bookmarks` fields in Firestore for signed-in users.
- [Affects R11][Design] Exact color tokens for verse numbers in light/dark mode while meeting contrast guidelines.
- [Affects R7–R8][Design] FAB panel z-order vs. verse text and touch target sizes for mobile accessibility.
- [Affects R13–R13c][Technical] Whether `currentBook` / `currentChapter` are split from a dedicated **reading anchor** for chrome vs. main view state; behavior on chapter grid when chapter not yet chosen.
- [Affects R14][Design] Pixel height token shared by FAB and chapter bar; safe-area padding for the combined bottom row.
- [Affects R15][Technical] Algorithm to map normalized match offset to **raw verse** start/end indices for snippet + `<mark>` (scan/walk, or auxiliary index); handling multi-word queries.

## Next Steps

`-> /ce:plan` for structured implementation planning.

## Alternatives Considered

- **Keep chapter-grid behavior on book name and add “Library” to FAB:** Rejected in favor of tap book name → full list for fewer taps to switch books.
- **Speed-dial FAB vs. single FAB opening a sheet:** Left to planning; requirement only mandates a stack with expansions (R7–R8).
