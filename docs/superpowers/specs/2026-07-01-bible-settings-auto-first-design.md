# Bible Settings Auto-First Design

## Goal

Make the Appearance and Season dropdowns follow the same ordering rule: place their automatic choice first, and use automatic appearance for users who have never chosen a mode.

## Interface

The dropdown order will be:

- Appearance: `🖥️ System`, `☀️ Light`, `🌙 Dark`
- Season: `🗓️ Auto`, `🌱 Spring`, `🏖️ Summer`, `🍁 Fall`, `❄️ Winter`

Season already follows this order and requires no markup change. Display Size remains `S Small`, `M Medium`, `L Large` because it has no automatic choice.

## State Behavior

When neither `bible_theme_mode` nor the legacy `bible_dark` preference exists, `State.getThemeMode()` will return `auto` instead of `light`. The existing `applyThemeMode()` path will then resolve the operating system preference and keep the Appearance select on `System`.

Compatibility rules remain unchanged:

- an explicit saved `light`, `dark`, or `auto` value wins;
- a legacy `bible_dark: true` value remains Dark;
- a legacy `bible_dark: false` value remains Light;
- an invalid modern value with no valid legacy value falls back to System;
- cloud hydration continues to apply a valid saved account preference through the existing state path.

No existing explicit preference is migrated or overwritten, and the default is not persisted merely by reading it.

## Quality and Scope

The implementation changes only `bible.html`: reorder the three Appearance options and change the final no-preference fallback in `State.getThemeMode()`. It introduces no new storage key, listener, timer, network behavior, dependency, or migration.

Focused checks will verify exact option order; fresh-user System behavior; saved Light, Dark, and System behavior; both legacy Boolean paths; invalid-value fallback; inline JavaScript parsing; and rendered Appearance/Season order. Existing responsive bounds, native picker behavior, and stored-user preferences must remain intact.
