// Screenshots a list of routes as a given person. Usage: node scripts/tour.mjs <person> <route>...
// Env: W, H (viewport), SCHEME (light|dark), PREFIX (file prefix), BASE.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [person, ...routes] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:3100';
mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const ctx = await browser.newContext({ viewport: { width: Number(process.env.W ?? 1280), height: Number(process.env.H ?? 800) }, colorScheme: process.env.SCHEME ?? 'light' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
await page.goto(base);
await page.evaluate(() => localStorage.setItem('tessera.demo.v1', JSON.stringify({ latency: 'instant', offline: false })));
await page.reload();
const first = person.split(' ')[0];
const featured = page.getByRole('button', { name: new RegExp(`Continue as ${first}`) });
await page.waitForTimeout(800);
if (await featured.count()) await featured.click(); else await page.getByRole('button', { name: new RegExp(person) }).first().click();
await page.waitForTimeout(600);
for (const r of routes) {
  await page.goto(`${base}/#${r}`);
  await page.waitForTimeout(1300);
  const slug = r.replace(/\W+/g, '_');
  await page.screenshot({ path: `.screenshots/${process.env.PREFIX ?? 't'}-${slug}.png`, fullPage: process.env.FULL === '1' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(r, 'overflow=', overflow);
}
console.log('errors:', errors);
await browser.close();
