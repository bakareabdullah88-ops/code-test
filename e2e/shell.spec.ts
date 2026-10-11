import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const lensRoutes = ['/app/today', '/mentor', '/leader', '/admin'];

test.describe('app shell', () => {
  for (const route of lensRoutes) {
    test(`${route}: no horizontal scroll and no axe violations`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow).toBe(false);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test('primary navigation marks the current page and navigates', async ({ page }, info) => {
    await page.goto('/app/today');
    const nav = page.getByRole('navigation', { name: 'Primary' }).filter({ visible: true });
    await expect(nav.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page');
    await nav.getByRole('link', { name: 'Bible' }).click();
    await expect(page).toHaveURL(/\/app\/bible$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Bible' })).toBeVisible();
    info.annotations.push({ type: 'viewport', description: info.project.name });
  });

  test('theme can be switched from the me menu and persists across reload', async ({ page }) => {
    await page.goto('/app/today');
    await page.getByRole('button', { name: 'Me and settings' }).click();
    await page.getByRole('menuitemradio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('lens switcher moves between lenses', async ({ page }) => {
    await page.goto('/app/today');
    const sidebarSwitcher = page.getByRole('button', { name: /View as/ });
    if (await sidebarSwitcher.isVisible()) {
      await sidebarSwitcher.click();
    } else {
      await page.getByRole('button', { name: 'Me and settings' }).click();
    }
    await page.getByRole('menuitem', { name: 'Mentor' }).click();
    await expect(page).toHaveURL(/\/mentor$/);
  });

  test('unknown routes show the not-found page', async ({ page }) => {
    const res = await page.goto('/app/does-not-exist');
    expect(res?.status()).toBe(404);
  });
});
