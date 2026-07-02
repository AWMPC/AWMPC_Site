const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const bible = fs.readFileSync(path.join(root, 'bible.html'), 'utf8');
const css = bible.match(/<style>([\s\S]*?)<\/style>/)[1];

test('one quintic easing token owns application transitions', () => {
  assert.match(css, /:root \{[\s\S]*--display-nav-padding: 6px;\s*--motion-ease-fallback: cubic-bezier\(\.64, 0, \.36, 1\);\s*--motion-ease: var\(--motion-ease-fallback\);/);
  assert.match(css, /@supports \(transition-timing-function: linear\(0, 1\)\) \{\s*:root \{\s*--motion-ease: linear\(0, 0\.00856 10%, 0\.05792 20%, 0\.16308 30%, 0\.31744 40%, 0\.5 50%, 0\.68256 60%, 0\.83692 70%, 0\.94208 80%, 0\.99144 90%, 1\);\s*\}\s*\}/);

  const transitionBlocks = [...css.matchAll(/(^|})\s*([^@][^{]*)\{([^{}]*\btransition-property:[^{}]*)\}/gm)];
  assert.ok(transitionBlocks.length > 0, 'motion selectors use transition longhands');
  for (const [, , selector, declarations] of transitionBlocks) {
    assert.match(declarations, /transition-duration:/, `${selector.trim()} declares transition duration`);
    assert.match(declarations, /transition-timing-function:\s*var\(--motion-ease\);/, `${selector.trim()} uses the resolved easing token`);
    assert.doesNotMatch(declarations, /var\(--motion-ease-fallback\)/, `${selector.trim()} does not bypass feature detection`);
  }

  const cssWithoutDisabledTransitions = css.replace(/\btransition:\s*none;/g, '');
  assert.doesNotMatch(cssWithoutDisabledTransitions, /\btransition\s*:/, 'motion transition shorthands are retired');
  assert.doesNotMatch(
    css.replace('--motion-ease-fallback: cubic-bezier(.64, 0, .36, 1);', ''),
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
    assert.doesNotMatch(css, new RegExp(`animation: ${name} [^;]*var\\(--motion-ease-fallback\\)`));
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
});

test('JavaScript smootherstep remains exact', () => {
  const smootherstep = bible.match(/function smootherstep\([^)]*\) \{[\s\S]*?\n  \}/);
  assert.ok(smootherstep, 'smootherstep remains available to JavaScript motion');
  const evaluate = Function(`${smootherstep[0]}; return [smootherstep(0), smootherstep(.5), smootherstep(1)];`);
  assert.deepEqual(evaluate(), [0, 0.5, 1]);
});
