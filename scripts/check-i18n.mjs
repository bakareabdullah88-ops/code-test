// Catalogue checks: valid JSON, other locales only use keys that exist in English, balanced ICU braces.
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const root = new URL('../messages/', import.meta.url).pathname;
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]));

let problems = 0;
const fail = (msg) => { problems++; console.error(`FAIL ${msg}`); };

const en = {};
for (const file of readdirSync(`${root}en`)) {
  const entries = flat(JSON.parse(readFileSync(`${root}en/${file}`, 'utf8')));
  en[file] = new Map(entries);
  for (const [k, v] of entries) {
    if (typeof v !== 'string' || v.trim() === '') fail(`en/${file}: ${k} is empty`);
    const depth = [...String(v)].reduce((d, c) => (c === '{' ? d + 1 : c === '}' ? d - 1 : d), 0);
    if (depth !== 0) fail(`en/${file}: ${k} has unbalanced braces`);
  }
}
for (const locale of readdirSync(root).filter((l) => l !== 'en')) {
  for (const file of Object.keys(en)) {
    const p = `${root}${locale}/${file}`;
    if (!existsSync(p)) { fail(`${locale}/${file} missing`); continue; }
    for (const [k] of flat(JSON.parse(readFileSync(p, 'utf8')))) if (!en[file].has(k)) fail(`${locale}/${file}: ${k} not in English`);
  }
}
console.log(problems ? `${problems} problem(s)` : 'catalogues ok');
process.exit(problems ? 1 : 0);
