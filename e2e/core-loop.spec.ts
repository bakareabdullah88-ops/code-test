import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { signInAs, switchPerson } from './helpers';

test('lesson, reflection, mentor feedback, and back to the student', async ({ page }) => {
  await signInAs(page, 'Adaeze Okafor');
  await expect(page.getByRole('heading', { level: 1, name: /Adaeze/ })).toBeVisible();

  // Open today's lesson and finish it.
  await page.getByRole('link', { name: /Continue lesson/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Grace' })).toBeVisible();
  await expect(page.getByText('Ephesians 2:8-9').first()).toBeVisible();
  await expect(page.getByText('For by grace you have been saved').first()).toBeVisible();

  // Answer the quiz without penalty.
  await page.getByRole('radio', { name: 'Salvation by grace through faith' }).click();
  await page.getByRole('checkbox', { name: 'Permission to stop caring how we live' }).click();
  await page.getByRole('radio', { name: 'False' }).click();
  await page.getByRole('button', { name: 'Check answers' }).click();
  await expect(page.getByText('3 of 3 right')).toBeVisible();

  // Write a reflection from the prompt and share it with the mentor.
  await page.getByRole('button', { name: /Continue writing|Write your reflection/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const editor = dialog.getByRole('textbox', { name: 'Your reflection' });
  await editor.click();
  await page.keyboard.press('Control+End');
  await page.keyboard.type(' Receiving is harder than earning for me. I want to learn it.');
  await expect(dialog.getByText(/Saved/)).toBeVisible({ timeout: 8000 });
  await dialog.getByRole('button', { name: 'Share' }).click();
  await expect(dialog.getByText(/can now read this and write back/)).toBeVisible();
  await page.keyboard.press('Escape');

  // Switch to the mentor; the reflection is in the inbox and a notification exists.
  await switchPerson(page, 'Grace Wanjiru');
  await expect(page).toHaveURL(/#\/mentor$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Who needs attention' })).toBeVisible();
  await expect(page.getByText(/reflection on “Who is God\?” has been waiting/)).toBeVisible();

  await page.goto('/#/mentor/feedback');
  await page.getByRole('link', { name: /Adaeze Okafor/ }).first().click();
  await page.getByRole('textbox', { name: 'Your reply' }).click();
  await page.keyboard.type('Thank you for writing so honestly. Notice that you named receiving.');
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.getByText(/Reply sent to Adaeze/).first()).toBeVisible();

  // Back as the student: the reply is in the journal and a notification arrived.
  await switchPerson(page, 'Adaeze Okafor');
  await page.goto('/#/app/journal');
  await expect(page.getByText('Replied').first()).toBeVisible();
  await page.goto('/#/notifications');
  await expect(page.getByText(/wrote|replied to your reflection/).first()).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test('persona picker and shell have no axe violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Walk the journey as someone else' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
});
