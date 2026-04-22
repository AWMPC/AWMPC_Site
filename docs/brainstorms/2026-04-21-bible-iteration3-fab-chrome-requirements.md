---
date: 2026-04-21
topic: bible-iteration3-fab-chrome
---

# Bible SPA — iteration 3: stable FAB position + tight chapter bar chrome

## Problem Frame

Readers use `bible.html` with a fixed bottom row: chapter controls (“chapter bar”) and a menu button (FAB). After iteration 2, both live in shared bottom chrome. **Opening the FAB menu changes the layout of that row**: the menu stack grows taller, and the flex row re-centers its children vertically, so the chapter bar and/or the round menu control no longer stay pinned to the same screen position as when the menu is closed. That feels broken compared to common mobile patterns (menu expands **over** content without shoving the trigger).

Separately, the **chapter bar’s visible pill** (background, shadow, rounded shape) stretches across most of the width because the bar is allowed to grow in the flex row. Users expect that chrome to **hug only the prev/book/chapter/next controls**, not a wide empty band.

## Requirements

**FAB / menu behavior**

- **R16** — The position of the round FAB trigger (and the chapter bar cluster beside it) **must not move** when the FAB panel opens or closes. The user’s mental anchor is the bottom edge of the screen (and safe area); controls stay on that baseline in both states.

- **R17** — The expanded FAB panel may appear above the trigger (or otherwise overlay the reading area), but it **must not participate in layout** in a way that shifts the trigger or the chapter bar vertically or horizontally. (Analogous to a dropdown anchored to a button.)

**Chapter bar chrome**

- **R18** — The styled “pill” around the chapter navigation controls (**←**, book, chapter, **→**) **wraps tightly** around those controls only. It does not stretch to fill leftover horizontal space in the bottom row except as needed for touch targets and readable book names (ellipsis is acceptable for long names).

## Success Criteria

- With the FAB closed and open, a screen recording or visual check shows the **FAB button center** (or bottom anchor point) **unchanged** relative to the viewport bottom / safe area.
- The **chapter bar pill** width is **content-driven**, clearly narrower than full width on typical phone widths when book names are short, with no large empty colored region inside the pill.

## Scope Boundaries

- Non-goal: Redesigning FAB panel contents, auth UI, or chapter bar control set.
- Non-goal: Changing fuzzy search or reading-anchor behavior from iteration 2.
- Non-goal: Animations or transitions beyond what is needed to satisfy R16–R18.

## Key Decisions

- **Stable baseline:** Treat the FAB trigger and chapter bar as a single bottom-aligned row; the expandable menu is an **overlay** relative to that row’s layout box, not an extra flex sibling that changes row height for alignment purposes.
- **Tight chapter pill:** The chapter bar is a **shrink-wrapped** horizontal group; remaining space in the row is margin/empty, not part of the pill background.

## Dependencies / Assumptions

- Current markup/CSS lives in `bible.html` (bottom chrome from iteration 2). Planners should confirm DOM order (`fab-panel` vs `fab-main`) when choosing overlay positioning.

## Outstanding Questions

### Deferred to Planning

- **[Affects R17]** Exact stacking (`z-index`) and scroll/overflow behavior so the panel never clips incorrectly above the home indicator on iOS.
- **[Affects R18]** Whether `max-width` on the book label should cap the pill before ellipsis for very long book names.

## Next Steps

-> `/ce:plan` (or direct implementation) for CSS/markup changes in `bible.html` guided by R16–R18.
