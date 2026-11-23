import { expect, test } from './fixtures.mjs';

test.describe('rulebook docs layout', () => {
  test('sidebar navigation, scroll-spy and on-this-section', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/rulebook');
    const sidebar = page.getByRole('navigation', { name: 'রুলবুকের সূচিপত্র' });
    await sidebar.getByRole('link', { name: 'ধাপে ধাপে প্রক্রিয়া' }).click();
    await expect(page).toHaveURL(/#process$/);
    await expect(sidebar.getByRole('link', { name: 'ধাপে ধাপে প্রক্রিয়া' })).toHaveAttribute('aria-current', 'location');
    // Right column lists the steps of the section being read.
    await expect(page.getByRole('navigation', { name: 'এই অংশে' }).getByRole('link')).toHaveCount(6);
  });

  test('search filters sections by content and Enter jumps to the first match', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/rulebook');
    await page.keyboard.press('/');
    await expect(page.locator('#rulebook-search')).toBeFocused();
    await page.keyboard.type('README');
    const links = page.getByRole('navigation', { name: 'রুলবুকের সূচিপত্র' }).getByRole('link');
    await expect(links).toHaveCount(4);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#process$/);
    await page.locator('#rulebook-search').fill('কোনোকিছুইনেই');
    await expect(page.getByText('কোথাও পাওয়া যায়নি')).toBeVisible();
  });

  test('phone: contents drawer opens, navigates and closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/rulebook');
    await page.getByRole('button', { name: /সূচিপত্র/ }).click();
    const drawer = page.getByRole('dialog', { name: 'সূচিপত্র' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'নিয়মাবলি' }).click();
    await expect(drawer).toBeHidden();
    await expect(page).toHaveURL(/#rules$/);
    await expect(page.getByRole('button', { name: /সূচিপত্র/ })).toContainText('নিয়মাবলি');
  });

  test('print hides the navigation', async ({ page }) => {
    await page.goto('/rulebook');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#rulebook-search')).toBeHidden();
    await expect(page.locator('#rules')).toBeVisible();
    await expect(page.locator('.id-card')).toBeVisible();
  });
});
