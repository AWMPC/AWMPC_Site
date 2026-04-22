---
title: Replace innerHTML DOM sinks in bible.html (history + profile FAB)
date: 2026-04-22
category: security-issues
module: awmpc_site Bible PWA (bible.html)
problem_type: security_issue
component: authentication
symptoms:
  - Reading-history menu built with innerHTML concatenating book/chapter strings from localStorage and Firestore-synced history
  - Signed-in FAB avatar built with innerHTML embedding Firebase user.photoURL in an img src attribute string
root_cause: missing_validation
resolution_type: code_fix
severity: medium
tags:
  - dom-xss
  - innerhtml
  - firebase-auth
  - localstorage
  - bible-html
---

# Replace innerHTML DOM sinks in bible.html (history + profile FAB)

## Problem

Code review flagged two **P2** patterns in `bible.html`: user- or storage-originating strings were interpolated into HTML via `innerHTML`. If history entries or `photoURL` were ever adversarial or malformed, that could lead to DOM XSS or attribute breakout. The app is a static PWA with Firebase sync; treating synced arrays and auth fields as trusted HTML was unsafe-by-default.

## Symptoms

- History FAB menu items used `innerHTML` with `parts[0]`, `parts[1]` from `book|chapter` keys in `bible_history` (localStorage / cloud merge).
- The main FAB button used `innerHTML` to inject `<img src="...">` with `user.photoURL` concatenated into a string.

## What Didn't Work

- Relying on “book names only contain safe characters” or on Firebase always returning a benign URL string — defense-in-depth says **never** bind untrusted strings into HTML parsers.

## Solution

1. **Profile avatar:** Clear `fabMain`, `createElement('img')`, set `className`, `alt`, `referrerPolicy`, and `src` via properties, then `appendChild`. No HTML parsing of `photoURL`.

```javascript
fabMain.textContent = '';
var av = document.createElement('img');
av.className = 'profile-avatar';
av.alt = '';
av.referrerPolicy = 'no-referrer';
av.src = user.photoURL || '';
fabMain.appendChild(av);
```

2. **History menu:** Build the icon and label with `span` elements and `textContent` for the dynamic book/chapter line (emoji icon uses a fixed `textContent`).

```javascript
var hi = document.createElement('span');
hi.className = 'dd-icon';
hi.textContent = '📄';
var hl = document.createElement('span');
hl.className = 'dd-label';
hl.textContent = parts[0] + ' ' + parts[1];
btn.appendChild(hi);
btn.appendChild(hl);
```

## Why This Works

`innerHTML` parses a string as HTML; attacker-controlled substrings can introduce tags or break out of attributes. **`textContent` assigns plain text**; the DOM API does not interpret HTML. Setting **`img.src` as a property** lets the browser handle the URL without injecting a raw string into parsed markup (and avoids attribute delimiter issues from string concatenation).

## Prevention

- For any value from **localStorage, Firestore, auth profile fields, or query params**, prefer **`createElement` + `textContent`** (or trusted templates with structured slots) instead of `innerHTML` or string-built markup.
- Reserve `innerHTML` for **constant, developer-authored** fragments only (and keep a lint rule or review checklist for `innerHTML` in the repo).
- When adding **cloud merge** for user state, validate shape before render; rendering is still safest with text nodes and property assignment.

## Related Issues

- Prior review artifact: `.context/compound-engineering/ce-review/20260421-f80f-manual/` (identified P2 items before fix).
