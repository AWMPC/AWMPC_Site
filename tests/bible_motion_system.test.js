const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const bible = fs.readFileSync(path.join(root, 'templates', 'bible.html'), 'utf8');
const css = bible.match(/<style>([\s\S]*?)<\/style>/)[1];
const marqueeMaskDeclaration = /(?:^|[;\s])(?:mask|mask-image|-webkit-mask|-webkit-mask-image)\s*:/;

function marqueeRuleDeclarations(source) {
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selector]) => /\.marquee-/.test(selector))
    .map(([, , declarations]) => declarations)
    .join('\n');
}

test('one cubic easing token owns application transitions', () => {
  assert.match(css, /:root \{[\s\S]*--motion-ease: cubic-bezier\(\.64, 0, \.36, 1\);/);
  assert.doesNotMatch(css, /--motion-ease-fallback:/, 'the direct motion token has no fallback alias');
  assert.doesNotMatch(css, /@supports \(transition-timing-function: linear\(/, 'no feature-gated linear timing approximation remains');
  assert.doesNotMatch(css, /--motion-ease:\s*linear\(/, 'the motion token is not a linear timing approximation');

  const transitionBlocks = [...css.matchAll(/(^|})\s*([^@][^{]*)\{([^{}]*\btransition-property:[^{}]*)\}/gm)];
  assert.ok(transitionBlocks.length > 0, 'motion selectors use transition longhands');
  for (const [, , selector, declarations] of transitionBlocks) {
    assert.match(declarations, /transition-duration:/, `${selector.trim()} declares transition duration`);
    assert.match(declarations, /transition-timing-function:\s*var\(--motion-ease\);/, `${selector.trim()} uses the motion token`);
  }

  const cssWithoutDisabledTransitions = css.replace(/\btransition:\s*none;/g, '');
  assert.doesNotMatch(cssWithoutDisabledTransitions, /\btransition\s*:/, 'motion transition shorthands are retired');
  assert.doesNotMatch(
    css.replace('--motion-ease: cubic-bezier(.64, 0, .36, 1);', ''),
    /cubic-bezier\(|[\s,]ease(?:-in|-out|-in-out)?(?=[\s,;])/,
    'no competing easing curves remain'
  );
});

test('app sheet lifecycle uses named paired motion durations and anchored edge origins', () => {
  assert.match(css, /\.app-sheet \{[\s\S]*--sheet-open-close-duration:\s*280ms;/);
  assert.match(css, /\.app-sheet \{[\s\S]*--sheet-resize-duration:\s*320ms;/);
  assert.match(css, /transition-property:\s*width, height, margin-left, margin-right, transform, opacity;/);
  assert.match(css, /transition-duration:\s*var\(--sheet-resize-duration\),\s*var\(--sheet-resize-duration\),\s*var\(--sheet-resize-duration\),\s*var\(--sheet-resize-duration\),\s*var\(--sheet-open-close-duration\),\s*var\(--sheet-open-close-duration\);/);
  assert.match(css, /--sheet-origin-inline:\s*right;/);
  assert.match(css, /--sheet-origin-block:\s*bottom;/);
  assert.match(css, /transform-origin:\s*var\(--sheet-origin-inline\) var\(--sheet-origin-block\);/);
  assert.match(css, /\.app-sheet\.inline-left\s*\{[^}]*--sheet-origin-inline:\s*left;/s);
  assert.match(css, /\.app-sheet\.edge-top\s*\{[^}]*--sheet-origin-block:\s*top;/s);
  assert.match(css, /\.app-sheet\.is-preparing\s*\{[^}]*visibility:\s*hidden;[^}]*transition-duration:\s*0s;/s);
  assert.match(css, /\.app-sheet\.is-opening\.edge-bottom\s*\{[^}]*translateY\(100%\)/s);
  assert.match(css, /\.app-sheet\.is-opening\.edge-top\s*\{[^}]*translateY\(-100%\)/s);
  assert.match(css, /\.app-sheet::backdrop\s*\{[^}]*transition-duration:\s*var\(--sheet-open-close-duration\)/s);
  assert.match(css,
    /\.app-sheet\.is-opening::backdrop,\s*\.app-sheet\.is-closing::backdrop\s*\{[^}]*backdrop-filter:\s*blur\(0\);[^}]*-webkit-backdrop-filter:\s*blur\(0\);/s,
    'opening and closing transition the paired backdrop blur to zero');
  assert.match(css, /\.app-sheet\.is-dragging\s*\{[^}]*transition:\s*none;/s);
  assert.match(css, /\.app-sheet\.is-dragging::backdrop\s*\{[^}]*transition:\s*none;/s);
  assert.match(css, /\.app-sheet\.is-drag-exit\s*\{[^}]*height:\s*var\(--sheet-live-height\);/s);
});

test('app sheet controller owns lifecycle frames and named fallbacks', () => {
  assert.match(bible, /var APP_SHEET_OPEN_CLOSE_MS = 280;/);
  assert.match(bible, /var APP_SHEET_RESIZE_MS = 320;/);
  assert.match(bible, /openFrame:\s*null/);
  assert.match(bible, /openFrame2:\s*null/);
  assert.match(bible, /function clearAppSheetOpenFrames\(\)/);
  assert.match(bible, /clearAppSheetOpenFrames\(\);[\s\S]*cancelAnimationFrame/);
  assert.match(bible, /setSheetSnap\(snap, immediate\)[\s\S]*APP_SHEET_RESIZE_MS/);
  assert.match(bible, /requestCloseAppSheet\(source, focusPolicy, releaseVisual\)[\s\S]*APP_SHEET_OPEN_CLOSE_MS/);
  assert.doesNotMatch(
    bible.slice(bible.indexOf('/* APP SHEET CONTROLLER START */'), bible.indexOf('/* APP SHEET CONTROLLER END */')),
    /setTimeout\([\s\S]{0,500},\s*(?:200|240|260)\)/,
    'sheet lifecycle fallbacks do not retain anonymous legacy durations'
  );
});

test('key animation families share easing and reduced motion disables them', () => {
  for (const [name, duration] of [
    ['press-ripple', '320ms'],
    ['marquee-sway', '3s'],
    ['loading-skeleton-shimmer', '1.1s']
  ]) {
    assert.match(css, new RegExp(`animation: ${name} ${duration} var\\(--motion-ease\\)[^;]*;`));
    assert.doesNotMatch(css, new RegExp(`animation: ${name} [^;]*linear\\(`));
  }

  const reducedMotion = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  for (const selector of [
    '.marquee-line.is-marquee .marquee-text',
    '.loading-skeleton span',
    '.press-ripple'
  ]) {
    assert.match(reducedMotion, new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{[^}]*animation: none;`));
  }

  assert.match(
    reducedMotion,
    /\.marquee-line\.is-marquee \.marquee-text \{\s*animation: none;\s*transform: none;\s*\}/,
    'reduced motion resets marquee translation to the readable start'
  );
});

test('marquee translation holds at each edge without any fade or mask mechanism', () => {
  const marqueeSway = css.match(/@keyframes marquee-sway \{([\s\S]*?)\n  \}/);
  assert.ok(marqueeSway, 'marquee sway keyframes remain defined');
  assert.match(marqueeSway[1], /0%, 18% \{\s*transform: translateX\(0\);\s*\}/);
  assert.match(
    marqueeSway[1],
    /82%, 100% \{\s*transform: translateX\(calc\(var\(--marquee-distance, 0px\) \* -1\)\);\s*\}/
  );
  assert.doesNotMatch(css, /--marquee-(?:left|right)-fade/);
  assert.doesNotMatch(marqueeRuleDeclarations(css), marqueeMaskDeclaration);
  assert.doesNotMatch(css, /marquee-mask-breathe/);
});

test('marquee mask guard ignores unrelated masks and rejects every mask property', () => {
  const unrelatedMask = '.decorative-icon { mask-image: url(icon.svg); -webkit-mask: none; }';
  assert.doesNotMatch(
    marqueeRuleDeclarations(`${unrelatedMask}\n.marquee-line { overflow: hidden; }`),
    marqueeMaskDeclaration
  );

  for (const property of ['mask', 'mask-image', '-webkit-mask', '-webkit-mask-image']) {
    const mutated = `${unrelatedMask}\n.marquee-line.is-marquee { ${property}: none; }`;
    assert.match(marqueeRuleDeclarations(mutated), marqueeMaskDeclaration, `${property} is rejected on a marquee rule`);
  }
});

test('overflowing navigation book labels align from the English inline start', () => {
  assert.match(bible, /<html lang="en">/, 'the marquee alignment contract is scoped to English LTR');
  assert.match(css, /\.floating-nav button \{[^}]*justify-content: center;/, 'short navigation labels remain centered');
  assert.match(
    css,
    /\.floating-nav \.fn-book\.is-marquee \{[^}]*justify-content: flex-start;/,
    'overflowing book labels expose their beginning before motion starts'
  );
});

test('JavaScript cubic verse easing matches the shared curve endpoints', () => {
  assert.doesNotMatch(bible, /smootherstep/, 'the quintic verse easing is retired');
  const cubicVerseEase = bible.match(/function cubicVerseEase\([^)]*\) \{[\s\S]*?\n  \}/);
  assert.ok(cubicVerseEase, 'cubicVerseEase remains available to JavaScript motion');
  assert.match(cubicVerseEase[0], /\* \.64/, 'the helper uses the shared first cubic control');
  assert.match(cubicVerseEase[0], /\* \.36/, 'the helper uses the shared second cubic control');
  assert.match(bible, /var eased = cubicVerseEase\(progress\);/, 'verse chasing uses the cubic helper');
  const evaluate = Function(`${cubicVerseEase[0]}; return [0, .25, .5, .75, 1].map(cubicVerseEase);`);
  const [start, quarter, midpoint, threeQuarters, end] = evaluate();
  assert.deepEqual([start, midpoint, end], [0, 0.5, 1]);
  assert.ok(Math.abs(quarter - .0727443) < .00001, 'quarter progress follows the cubic curve');
  assert.ok(Math.abs(threeQuarters - .9272557) < .00001, 'three-quarter progress follows the cubic curve');
});
