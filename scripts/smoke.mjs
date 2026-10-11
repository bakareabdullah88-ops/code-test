// Quick browser smoke: loads the app, walks a path, prints console errors and writes screenshots.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:3100';
mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const ctx = await browser.newContext({ viewport: { width: Number(process.env.W ?? 1280), height: Number(process.env.H ?? 800) } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const shot = (n) => page.screenshot({ path: `.screenshots/${process.env.PREFIX ?? 'd'}-${n}.png` });
await page.goto(base);
await page.getByRole('heading', { name: 'Choose who to be' }).waitFor();
await shot('1-picker');
await page.getByRole('button', { name: /Continue as Adaeze/ }).click();
await page.getByRole('heading', { level: 1 }).first().waitFor();
await page.waitForTimeout(800);
await shot('2-today');
console.log('errors:', errors);
await browser.close();
