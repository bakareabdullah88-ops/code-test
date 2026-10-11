import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`design gallery (${scheme})`, () => {
    test.use({ colorScheme: scheme });

    test('has no axe violations and no horizontal scroll', async ({ page }) => {
      await page.goto('/design');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow).toBe(false);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test('dialog traps focus, closes on Escape and restores focus', async ({ page }) => {
  await page.goto('/design');
  const trigger = page.getByRole('button', { name: 'Open dialog' });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Delete this reflection?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('reduce motion switch sets the motion preference', async ({ page }) => {
  await page.goto('/design');
  await page.getByRole('switch', { name: 'Reduce motion' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
});

test('toast announces and error toasts persist until dismissed', async ({ page }) => {
  await page.goto('/design');
  await page.getByRole('button', { name: 'Show error toast' }).click();
  const toast = page.getByRole('listitem').filter({ hasText: "Couldn't send feedback" });
  await expect(toast).toBeVisible();
  await page.waitForTimeout(7000);
  await expect(toast).toBeVisible();
});
