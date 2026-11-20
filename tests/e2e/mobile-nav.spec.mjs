import { expect, test } from './fixtures.mjs';

test.describe('mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('opens as a full sheet, locks scrolling, and closes with Escape', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'মেনু খুলুন' });
    await toggle.click();
    const menu = page.locator('#mobile-menu');
    await expect(menu).toBeVisible();
    await expect(page.getByRole('button', { name: 'মেনু বন্ধ করুন' })).toHaveAttribute('aria-expanded', 'true');
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
    await expect(menu.getByText('রেজিস্ট্রেশন চলছে')).toBeVisible();
    await expect(menu.getByRole('link', { name: /রুলবুক/ })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'মেনু খুলুন' })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('button', { name: 'মেনু খুলুন' })).toBeFocused();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  });

  test('a link closes the menu and goes to the section', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'মেনু খুলুন' }).click();
    await page.locator('#mobile-menu').getByRole('link', { name: /পুরস্কার/ }).click();
    await expect(page).toHaveURL(/#prizes$/);
    await expect(page.getByRole('button', { name: 'মেনু খুলুন' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('marks the current page', async ({ page }) => {
    await page.goto('/status');
    await page.getByRole('button', { name: 'মেনু খুলুন' }).click();
    await expect(page.locator('#mobile-menu').getByRole('link', { name: 'স্ট্যাটাস চেক' })).toHaveAttribute('aria-current', 'page');
  });

  test('is hidden and not focusable when closed', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#mobile-menu')).toHaveAttribute('inert', '');
  });
});
