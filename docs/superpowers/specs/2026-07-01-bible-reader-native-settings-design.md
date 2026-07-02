# Bible Reader Native Settings Design

## Goal

Prevent the three settings controls from wrapping or overflowing when display scaling is increased by replacing their segmented button groups with consistent native dropdown menus.

## Scope

Convert these existing settings in `bible.html`:

- Appearance: Light, Dark, System
- Season: Auto, Spring, Summer, Fall, Winter
- Display Size: Small, Medium, Large

No new framework, build system, module split, or Node test infrastructure will be introduced. Existing persistence, cloud synchronization, automatic season calculation, theme transitions, and display-size values remain unchanged.

## Interface

Each setting card will contain its existing visible title and one full-width native `<select>`. The three selects will share one project-native style: the same height, typography, border, background, focus treatment, and width behavior.

Option labels retain meaningful emoji prefixes:

- Appearance: `☀️ Light`, `🌙 Dark`, `🖥️ System`
- Season: `🗓️ Auto`, `🌱 Spring`, `🏖️ Summer`, `🍁 Fall`, `❄️ Winter`
- Display Size: `S Small`, `M Medium`, `L Large`

The native picker remains controlled by the operating system. The closed select is constrained to the settings card width with `min-width: 0` and `width: 100%`, preventing enlarged text from growing the panel horizontally. Native keyboard, touch, and assistive-technology behavior is retained.

## Behavior and Data Flow

Each select uses the same values already stored by the application:

- Appearance: `light`, `dark`, `auto`
- Season: `auto`, `spring`, `summer`, `fall`, `winter`
- Display Size: `0`, `1`, `2`

On initialization and whenever local or cloud state is reapplied, the existing application functions update both the document presentation and the matching select value. A select `change` event passes its value to the existing appearance, season, or display-size function. This preserves validation, persistence, synchronization, theme-color updates, layout recalculation, and transition behavior in one path.

Invalid stored values continue to fall back through the current setting-specific normalization. The select then reflects that normalized choice. Repeated changes replace the displayed value and do not accumulate listeners or create new long-lived objects.

## Accessibility and Responsive Behavior

Each select has a programmatic label through its visible setting title. Focus remains visibly indicated with the current seasonal accent while retaining native semantics. The controls remain usable with touch, keyboard, VoiceOver, and enlarged display settings.

The implementation will preserve the selected option across panel close/reopen, page reload, authentication hydration, and season/theme auto-updates. At mobile widths and Large display size, neither the select nor its card may exceed the panel's horizontal bounds.

## Quality and Security Checks

Focused checks will verify:

- all three controls are native selects with unique labels;
- every approved option and stored value is present;
- initialization and state reapplication synchronize the selected values;
- changes call the existing persistence paths;
- invalid values normalize safely;
- the retired segmented-button listeners and state rendering are removed;
- mobile and Large display-size rendering remains within the settings panel;
- keyboard focus and native selection work in the rendered app.

The controls accept only fixed in-document option values and do not introduce HTML injection, network requests, user data, timers, or retained global listeners. Existing cloud backoff and privacy behavior are unaffected.
