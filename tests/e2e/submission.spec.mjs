import { expect, test } from './fixtures.mjs';

/** The live-project submission page, opened from the approval email's link. */
test('without a link it explains where the link comes from', async ({ page }) => {
  await page.goto('/submit');
  await expect(page.getByRole('heading', { name: 'অ্যাপ্রুভাল ইমেইলের লিংক লাগবে' })).toBeVisible();
  await expect(page.getByRole('link', { name: /স্ট্যাটাস দেখো/ })).toBeVisible();
});

test('a broken or forged link is refused clearly', async ({ page }) => {
  await page.goto('/submit?token=abc.def');
  await expect(page.getByRole('heading', { name: 'এই লিংকটি কাজ করছে না' })).toBeVisible();
});

test.describe('with a valid link', () => {
  const open = Date.now() < new Date('2026-11-23T23:59:00+06:00').getTime();
  test.skip(!open, 'needs a fresh registration');

  test('checks the URL and explains common mistakes, then submits', async ({ page, request }) => {
    // Register, approve and get the personal link through the real APIs.
    const email = `sub-${Date.now().toString(36)}@example.com`;
    const reg = await request.post('/api/register', {
      data: { registrationType: 'solo', fullName: 'জমা পরীক্ষা', institution: 'X', className: 'Y', whatsapp: '01912345678', email, github: 'tester', productName: 'লিংক পরীক্ষা', problem: 'বাজারে প্রতিদিন দাম বদলায়, ক্রেতারা জানে না।', users: 'সবাই', features: ['এক', 'দুই', 'তিন'], agree: true },
    });
    expect(reg.ok()).toBeTruthy();
    const login = await request.post('/api/admin/login', { data: { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD } });
    expect(login.ok()).toBeTruthy();
    const { registrations } = await (await request.get('/api/admin/data')).json();
    const id = registrations.find((r) => r.email === email).id;
    await request.post('/api/admin/decision', { data: { id, decision: 'approved', notify: false } });
    const { link } = await (await request.post('/api/admin/link', { data: { id } })).json();

    await page.goto(new URL(link).pathname + new URL(link).search);
    const form = page.getByRole('form', { name: 'লাইভ প্রোজেক্ট জমার ফর্ম' });
    await expect(form).toContainText('লিংক পরীক্ষা');

    const url = page.locator('#liveUrl');
    // Empty submit.
    await form.getByRole('button', { name: /জমা দাও/ }).click();
    await expect(page.locator('#liveUrl-error')).toBeVisible();
    await expect(url).toBeFocused();
    // Repo link instead of the site.
    await url.fill('https://github.com/tester/repo');
    await url.blur();
    await expect(page.locator('#liveUrl-error')).toContainText('GitHub রিপোজিটরি');
    // Local address.
    await url.fill('localhost:3000');
    await url.blur();
    await expect(page.locator('#liveUrl-error')).toContainText('লোকাল');
    // Missing https:// is added; a non-Vercel host gets a gentle note and an "open it" link.
    await url.fill('my-app.lovable.app');
    await url.blur();
    await expect(url).toHaveValue('https://my-app.lovable.app');
    await expect(page.locator('#liveUrl-hint')).toContainText('Vercel-এর লিংক নয়');
    await page.getByRole('form').screenshot({ path: 'test-results/submission-form.png' });
    await expect(page.getByRole('link', { name: /খুলে দেখো/ })).toHaveAttribute('href', 'https://my-app.lovable.app');
    // A Vercel URL: plain hint.
    await url.fill('https://my-app.vercel.app');
    await url.blur();
    await expect(page.locator('#liveUrl-hint')).toContainText('Visit');

    // Description is optional, with a counter.
    await expect(page.getByText('০/৫০০')).toBeVisible();
    await page.locator('#description').fill('ক'.repeat(501));
    await page.locator('#description').blur();
    await expect(page.locator('#description-error')).toBeVisible();
    await page.locator('#description').fill('');

    await form.getByRole('button', { name: /জমা দাও/ }).click();
    await expect(page.getByRole('heading', { name: 'জমা হয়েছে!' })).toBeVisible();
    // Update from the success screen.
    await page.getByRole('button', { name: /আপডেট করো/ }).click();
    await page.locator('#description').fill('এখন বিবরণসহ');
    await page.getByRole('button', { name: /আপডেট করো/ }).click();
    await expect(page.getByRole('heading', { name: 'জমা আপডেট হয়েছে' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('এখন বিবরণসহ');
    await page.getByRole('status').screenshot({ path: 'test-results/submission-done.png' });
  });
});
