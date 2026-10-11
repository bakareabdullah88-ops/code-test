// Fails when a semantic colour pair in src/styles/tokens.css drops below WCAG AA.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

function block(selector) {
  const start = css.indexOf(selector + ' {');
  if (start < 0) throw new Error(`Missing block ${selector}`);
  const end = css.indexOf('\n}', start);
  return css.slice(start, end);
}
function vars(text) {
  const out = {};
  for (const m of text.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
function resolve(map, name, depth = 0) {
  let v = map[name];
  if (v === undefined || depth > 8) return undefined;
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolve(map, ref[1], depth + 1) : v;
}
function lum(hex) {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? [...n].map((c) => c + c).join('') : n;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const root = vars(block(':root'));
const dark = { ...root, ...vars(block(":root[data-theme='dark']")) };
const accents = ['moss', 'ochre', 'slate'];
const themes = [
  ['light', root, null],
  ['dark', dark, 'dark'],
  ...accents.map((a) => [`light+${a}`, { ...root, ...vars(block(`:root[data-accent='${a}']`)) }, null]),
  ...accents.map((a) => [`dark+${a}`, { ...dark, ...vars(block(`:root[data-theme='dark'][data-accent='${a}']`)) }, null]),
];

const text = [
  ['text', 'bg'], ['text', 'surface'], ['text', 'surface-raised'], ['text', 'surface-sunken'],
  ['text-muted', 'bg'], ['text-subtle', 'bg'], ['text-subtle', 'surface-sunken'], ['text-muted', 'surface'], ['text-muted', 'surface-sunken'],
  ['accent', 'bg'], ['accent', 'surface'], ['accent-hover', 'bg'],
  ['on-accent', 'accent'], ['on-accent', 'accent-hover'], ['accent-subtle-text', 'accent-subtle'], ['accent-subtle-text', 'bg'],
  ['success', 'bg'], ['success', 'success-subtle'], ['warning', 'bg'], ['warning', 'warning-subtle'],
  ['danger', 'bg'], ['danger', 'danger-subtle'], ['on-accent', 'danger'],
  ['text', 'hl-straw'], ['text', 'hl-sage'], ['text', 'hl-rose'], ['text', 'hl-mist'],
  ...[1, 2, 3, 4, 5, 6].map((i) => ['text', `tint-${i}`]),
  ...[1, 2, 3, 4, 5, 6].map((i) => ['text-muted', `tint-${i}`]),
  ['tag-amber', 'tint-1'], ['tag-green', 'tint-2'], ['tag-blue', 'tint-3'], ['tag-violet', 'tint-5'], ['tag-rose', 'tint-6'],
  ['tag-amber', 'surface'], ['tag-green', 'surface'], ['tag-blue', 'surface'], ['danger', 'surface'], ['success', 'surface'],
  ['on-solid', 'solid'], ['accent-subtle-text', 'accent-subtle'],
];
// Non-text UI: control borders and focus indicators (WCAG 1.4.11).
const ui = [['border-strong', 'bg'], ['focus-ring', 'bg'], ['accent', 'bg']];

let failures = 0;
let checked = 0;
for (const [name, map] of themes) {
  const get = (k) => resolve(map, `--${k}`);
  for (const [pairs, min] of [[text, 4.5], [ui, 3]]) {
    for (const [fg, bg] of pairs) {
      const f = get(fg);
      const b = get(bg);
      if (!f || !b || !f.startsWith('#') || !b.startsWith('#')) continue; // rgba or unresolved values are skipped
      const r = ratio(f, b);
      checked++;
      if (r < min) {
        failures++;
        console.error(`FAIL [${name}] ${fg} on ${bg}: ${r.toFixed(2)} < ${min}`);
      }
    }
  }
}
// Text on glass: blend the glass fill over every colour stop of each sky and check muted text against the result.
const hexes = (v) => [...(v ?? '').matchAll(/#[0-9a-f]{6}/gi)].map((m) => m[0]);
const rgba = (v) => { const m = v?.match(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/); return m ? { c: [m[1], m[2], m[3]].map(Number), a: Number(m[4]) } : null; };
const blend = (fill, under) => { const u = [0, 2, 4].map((i) => parseInt(under.slice(1 + i, 3 + i), 16)); return '#' + fill.c.map((c, i) => Math.round(c * fill.a + (u[i] ?? 0) * (1 - fill.a)).toString(16).padStart(2, '0')).join(''); };
for (const [name, map] of [['light', root], ['dark', dark]]) {
  for (const g of ['glass', 'glass-strong']) {
    const fill = rgba(map[`--${g}`]);
    for (const sky of ['sky-morning', 'sky-afternoon', 'sky-evening']) for (const stop of hexes(map[`--${sky}`])) {
      for (const fg of ['text', 'text-muted']) {
        const f = resolve(map, `--${fg}`);
        if (!fill || !f) continue;
        const r = ratio(f, blend(fill, stop));
        checked++;
        if (r < 4.5) { failures++; console.error(`FAIL [${name}] ${fg} on ${g} over ${sky} ${stop}: ${r.toFixed(2)} < 4.5`); }
      }
    }
  }
  const sf = resolve(map, '--on-solid'); const sb = resolve(map, '--solid');
  if (sf && sb) { checked++; if (ratio(sf, sb) < 4.5) { failures++; console.error(`FAIL [${name}] on-solid on solid`); } }
}
// White text on every stop of the promo gradient.
for (const [name, map] of [['light', root], ['dark', dark]]) for (const stop of hexes(map['--promo'])) {
  checked++;
  const r = ratio('#ffffff', stop);
  if (r < 3) { failures++; console.error(`FAIL [${name}] white on promo ${stop}: ${r.toFixed(2)} < 3 (large text)`); }
}
console.log(`${checked} pairs checked, ${failures} failing`);
process.exit(failures ? 1 : 0);
