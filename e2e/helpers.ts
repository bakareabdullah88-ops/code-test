import { expect, type Page } from '@playwright/test';

/** Opens the app fresh (new browser context means fresh IndexedDB) and signs in as a person from the picker. */
export async function signInAs(page: Page, name: string) {
  await page.goto('/#/demo');
  await expect(page.getByRole('heading', { name: 'Walk the journey as someone else' })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('tessera.demo.v1', JSON.stringify({ latency: 'instant', offline: false })));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Walk the journey as someone else' })).toBeVisible();
  await pick(page, name);
}

export async function switchPerson(page: Page, name: string) {
  const sidebar = page.getByRole('button', { name: 'Sign out' });
  if (await sidebar.isVisible()) await sidebar.click();
  else {
    await page.getByRole('button', { name: 'Me and settings' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
  }
  await page.goto('/#/demo');
  await expect(page.getByRole('heading', { name: 'Walk the journey as someone else' })).toBeVisible();
  await pick(page, name);
}

async function pick(page: Page, name: string) {
  const featured = page.getByRole('button', { name: new RegExp(`Continue as ${name.split(' ')[0]}`) });
  if (await featured.count()) await featured.click();
  else await page.getByRole('button', { name: new RegExp(name) }).first().click();
}
