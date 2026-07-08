# Bible Marquee Border Isolation Design

Date: 2026-07-08
Status: Approved in conversation; awaiting written-spec review

## Problem

The floating book control is both the bordered button and the `.marquee-line`. When overflow activates `.is-marquee`, its CSS mask applies to the button's complete composited output, fading the background and border along with the text.

## Design

For button hosts only, `setMarqueeText` will create an inner `<span class="marquee-line">` containing the existing `<span class="marquee-text">`. The button itself will no longer receive `.marquee-line` or `.is-marquee`, so its border, background, hover, focus, and pressed states remain outside the mask.

Non-button hosts retain the current direct-host structure. This keeps the change narrow and avoids introducing block wrappers inside existing span hosts.

The floating book control's inner line fills the available content width. Short labels remain centered; overflowing inner lines align to the English inline start. Existing mask phases, endpoint holds, movement distance, and reduced-motion behavior remain unchanged.

## Measurement and Lifecycle

`measureMarqueeLines` continues to measure each `.marquee-line` against its own `clientWidth`, which is now the button's inner content viewport. Replacing text first clears the prior inner line, so no detached nodes, listeners, observers, timers, or retained references accumulate.

## Testing

Tests are written before production changes and must prove:

- Button hosts receive an inner `.marquee-line` and never receive the masked class themselves.
- Non-button hosts remain the `.marquee-line` for compatibility.
- Text continues to enter through `textContent`.
- The mask is applied only to `.marquee-line.is-marquee`, inside the button border.
- Short navigation labels remain centered and overflowing labels align to the inline start.
- Existing endpoint, fade, easing, measurement, and reduced-motion contracts remain green.

Rendered QA will verify the `1 Thessalonians` marquee at desktop and 320px mobile widths in light and dark modes, confirming that both button borders remain visually continuous while the text alone fades.

## Security and Privacy

This is presentation-only. It adds no network, storage, credential, logging, PII, or HTML-parsing path. Text remains assigned with `textContent`.
