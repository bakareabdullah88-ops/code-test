// Captures screenshots at phone and desktop widths into .screenshots/ (git-ignored).
// Usage: node scripts/screenshots.mjs <baseUrl> <path> [path...]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [base, ...paths] = process.argv.slice(2);
mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const sizes = [['mobile', 360, 800], ['desktop', 1280, 800]];
for (const [name, width, height] of sizes) {
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    for (const p of paths) {
      await page.goto(base + p, { waitUntil: 'networkidle' });
      const slug = p.replace(/\W+/g, '_') || 'home';
      await page.screenshot({ path: `.screenshots/${slug}-${name}-${scheme}.png`, fullPage: false });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      console.log(`${p} ${name} ${scheme} horizontalOverflow=${overflow}`);
    }
    if (errors.length) console.log('console errors:', errors);
    await ctx.close();
  }
}
await browser.close();
