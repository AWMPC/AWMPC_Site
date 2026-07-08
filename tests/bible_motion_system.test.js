const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const bible = fs.readFileSync(path.join(root, 'bible.html'), 'utf8');
const css = bible.match(/<style>([\s\S]*?)<\/style>/)[1];

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

test('key animation families share easing and reduced motion disables them', () => {
  for (const [name, duration] of [
    ['press-ripple', '320ms'],
    ['marquee-mask-breathe', '3s'],
    ['marquee-sway', '3s'],
    ['loading-skeleton-shimmer', '1.1s']
  ]) {
    assert.match(css, new RegExp(`animation: ${name} ${duration} var\\(--motion-ease\\)[^;]*;`));
    assert.doesNotMatch(css, new RegExp(`animation: ${name} [^;]*linear\\(`));
  }

  const reducedMotion = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  for (const selector of [
    '.marquee-line.is-marquee',
    '.marquee-line.is-marquee .marquee-text',
    '.loading-skeleton span',
    '.press-ripple'
  ]) {
    assert.match(reducedMotion, new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{[^}]*animation: none;`));
  }

  assert.match(
    css,
    /\.marquee-line\.is-marquee \{\s*--marquee-left-fade: 0px;\s*--marquee-right-fade: 14px;/,
    'the static marquee mask exposes the inline start'
  );
  const reducedMarquee = reducedMotion.match(/\.marquee-line\.is-marquee \{([^}]*)\}/);
  assert.ok(reducedMarquee, 'reduced motion disables the marquee mask animation');
  assert.match(reducedMarquee[1], /^\s*animation: none;\s*$/, 'reduced motion keeps the static start mask');
  assert.match(
    reducedMotion,
    /\.marquee-line\.is-marquee \.marquee-text \{\s*animation: none;\s*transform: none;\s*\}/,
    'reduced motion resets marquee translation to the readable start'
  );
});

test('marquee translation holds at each edge while the mask fade clears', () => {
  const marqueeMask = css.match(/@keyframes marquee-mask-breathe \{([\s\S]*?)\n  \}/);
  const marqueeSway = css.match(/@keyframes marquee-sway \{([\s\S]*?)\n  \}/);
  assert.ok(marqueeMask, 'marquee mask keyframes remain defined');
  assert.ok(marqueeSway, 'marquee sway keyframes remain defined');
  assert.match(marqueeMask[1], /0%, 18% \{\s*--marquee-left-fade: 0px;\s*--marquee-right-fade: 14px;\s*\}/);
  assert.match(marqueeMask[1], /44%, 56% \{\s*--marquee-left-fade: 14px;\s*--marquee-right-fade: 14px;\s*\}/);
  assert.match(marqueeMask[1], /82%, 100% \{\s*--marquee-left-fade: 14px;\s*--marquee-right-fade: 0px;\s*\}/);
  assert.match(marqueeSway[1], /0%, 18% \{\s*transform: translateX\(0\);\s*\}/);
  assert.match(
    marqueeSway[1],
    /82%, 100% \{\s*transform: translateX\(calc\(var\(--marquee-distance, 0px\) \* -1\)\);\s*\}/
  );
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
