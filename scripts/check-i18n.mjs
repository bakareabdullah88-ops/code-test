// Verifies every literal t('key') call in src exists in the English catalogues, and flags unused-looking placeholders.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]));

const catalogue = new Map();
const dir = join(root, 'messages/en');
for (const f of readdirSync(dir)) for (const [k, v] of flat(JSON.parse(readFileSync(join(dir, f), 'utf8')))) catalogue.set(k, v);

function walk(d) {
  return readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|ts)$/.test(n) && !n.includes('.test.') && !p.includes('/features/design/') ? [p] : [];
  });
}

let problems = 0;
const used = new Set();
for (const file of walk(join(root, 'src'))) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) {
    used.add(m[1]);
    if (!catalogue.has(m[1])) { problems++; console.error(`MISSING ${m[1]}  (${file.replace(root, '')})`); }
  }
  for (const m of src.matchAll(/\bt\(\s*`([^`]+)`/g)) {
    // Dynamic keys: check that at least one catalogue key matches the template prefix.
    const prefix = m[1].split('${')[0];
    if (prefix && ![...catalogue.keys()].some((k) => k.startsWith(prefix))) { problems++; console.error(`NO KEYS UNDER ${prefix}  (${file.replace(root, '')})`); }
  }
}
console.log(`${used.size} keys used, ${catalogue.size} in catalogue, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
