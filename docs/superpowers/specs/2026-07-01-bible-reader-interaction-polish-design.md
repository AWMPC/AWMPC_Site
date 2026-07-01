# Bible Reader Interaction Polish Design

## Scope

Polish four existing interactions in the dependency-free `bible.html` SPA:

1. Animate the verse-action dialog into and out of view.
2. Separate verse text, link, and combined sharing actions.
3. Add matching decorative emoji to appearance and season buttons.
4. Replace the long multi-stage “go to verse” highlight with one brief transition into the normal active state.

No application modularization, new runtime dependency, data-format change, or cloud-schema change is included.

## Verse action dialog

Keep the native `<dialog>` so browser focus trapping, Escape handling, semantics, and modal behavior remain native. A small transition controller will add explicit opening and closing states to the dialog.

- Entry: backdrop opacity and dialog opacity/scale transition over approximately 180–220 ms with a curved ease-out.
- Exit: the same properties reverse with a curved ease-in before `dialog.close()` finalizes the close.
- Cancel, backdrop press, Escape, and successful actions all use the same exit path.
- Clipboard or share failures leave the dialog open and announce a useful status.
- `prefers-reduced-motion: reduce` skips the visual transition and closes immediately.
- The controller owns at most one bounded fallback timer. Reopening, closing, or native `close` cleanup cancels stale transition state so repeated use cannot accumulate listeners or timers.
- The dialog remains interactive during entry. Once exit begins, duplicate actions are ignored only for the short exit interval.

## Verse text, link, and share actions

The dialog will contain these actions:

- `📋 Copy Verse Text`: copies the verse reference and final rendered verse text, without a URL.
- `🔗 Copy Verse Link`: copies only the validated canonical verse URL.
- `📤 Share Verse`: shares the final rendered verse text and canonical URL together through the native share sheet.
- `Cancel`: closes without performing an action.

The emoji are decorative and hidden from assistive technology; the button text supplies the accessible name.

All verse text continues to come from the final `.verse-reading-text` DOM rather than directly from `bible.json`. This preserves support for verses synthesized from footnotes, including a blank-key Matthew 17:21. URLs continue through the existing strict canonical-reference validation.

If native sharing is unavailable, `Share Verse` copies a combined payload containing the reference, rendered text, and canonical URL. Clipboard failures keep the dialog open. Successful copy or share actions announce their result and use the animated close path. A user-cancelled native share closes without reporting an error.

## Appearance and season emoji

Retain the existing native buttons, `aria-pressed` state, persistence, synchronization, seasonal calculations, and responsive layout. Add a decorative emoji span before each visible label:

### Appearance

- `☀️ Light`
- `🌙 Dark`
- `🖥️ System`

### Season

- `🗓️ Auto`
- `🌱 Spring`
- `🏖️ Summer`
- `🍁 Fall`
- `❄️ Winter`

Emoji spans use `aria-hidden="true"`; accessible names remain the text labels. Button content may wrap at narrow mobile widths and must not introduce horizontal overflow in large display mode.

## Go-to-verse highlight

Search results, history entries, deep links, and explicit verse selection currently hold a gold found state, fade it away, and later reveal the normal active state. Replace that sequence with a direct transition:

1. The destination verse is immediately active and centered using the existing navigation behavior.
2. It begins in the brief gold found color.
3. The background, border, and shadow transition directly into the current season’s active-verse tokens over approximately 450 ms.
4. No intermediate transparent state or second fade occurs.

The transition never disables scrolling, navigation, verse presses, footnotes, or keyboard input. A newer navigation cancels any stale transition cleanup. Reduced-motion mode displays the final active state immediately. Sequential previous/next chapter position restoration is otherwise unchanged.

## Error handling and lifecycle

- Reuse the existing validated verse-action payload and clipboard fallback.
- Keep actions generation-guarded so stale asynchronous clipboard/share completions cannot close or update a newer dialog.
- Clear dialog-transition and verse-highlight state when their owning view or target is replaced.
- Do not add global listeners repeatedly; existing listeners remain single-installation.
- Do not add any external API, analytics, or personally identifying data.

## Verification

Automated Node test infrastructure remains out of scope by prior user direction. Verification will use syntax/static checks and rendered browser acceptance:

- Dialog entry and exit through successful actions, Cancel, backdrop press, and Escape.
- Repeated open/close cycles without retained classes, timers, or focus loss.
- Copy Text, Copy Link, native Share, share fallback, failure status, and share cancellation.
- Rendered-DOM action payloads for ordinary verses and synthesized Matthew 17:21.
- Appearance and season labels, selected states, mobile wrapping, and large display mode.
- Search, history, deep-link, and verse-picker navigation transitioning directly from found to active color.
- Interaction remains available throughout the highlight transition.
- Reduced-motion behavior, keyboard access, focus restoration, console errors, and horizontal overflow.
