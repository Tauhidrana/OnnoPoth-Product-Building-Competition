import { expect, test } from './fixtures.mjs';

/**
 * The whole competition, as the participant and the organizer see it:
 * register → admin approves → participant submits → admin scores → results.
 * Runs in one sequential flow because each step depends on the previous one.
 */
test.describe.configure({ mode: 'serial' });

const stamp = Date.now().toString(36);
const team = {
  name: `E2E Rahim ${stamp}`,
  email: `e2e-${stamp}@example.com`,
  whatsapp: '01712345678',
  product: `Bazardor ${stamp}`,
};
const registrationOpen = Date.now() < new Date('2026-11-23T23:59:00+06:00').getTime();
const submissionOpen = Date.now() < new Date('2026-11-27T22:00:00+06:00').getTime();

async function adminLogin(page) {
  await page.goto('/admin');
  await page.getByLabel('ইমেইল').fill(process.env.E2E_ADMIN_EMAIL);
  await page.getByLabel('পাসওয়ার্ড').fill(process.env.E2E_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'লগইন করুন' }).click();
  await expect(page.getByText('এখন যা করতে হবে')).toBeVisible();
}

test('home page shows the hero and the registration form', async ({ page }) => {
  await page.goto('/');
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveAccessibleName(/Product Building Competition/);
  await expect(h1.getByRole('img')).toBeVisible();
  await expect(page.getByText('লাইভ প্রোডাক্ট').first()).toBeVisible();
  await expect(page.locator('#register')).toBeVisible();
});

test('participant registers', async ({ page }) => {
  test.skip(!registrationOpen, 'registration window has closed');
  await page.goto('/#register');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const form = page.getByRole('form', { name: 'রেজিস্ট্রেশন ফর্ম' });

  await page.locator('#fullName').fill(team.name);
  await page.locator('#institution').fill('Dhaka College');
  await page.locator('#className').fill('HSC');
  await page.locator('#whatsapp').fill(team.whatsapp);
  await page.locator('#email').fill(team.email);
  await page.locator('#github').fill('rahimdev');
  await page.locator('#productName').fill(team.product);
  await page.locator('#problem').fill('বাজারে প্রতিদিন দাম বদলায়, ক্রেতারা আগে জানতে পারেন না।');
  await page.locator('#users').fill('শহরের পরিবার');
  await page.locator('#feature-0').fill('আজকের দাম');
  await page.locator('#feature-1').fill('দামের ট্রেন্ড');
  await page.locator('#feature-2').fill('এলাকা অনুযায়ী তুলনা');
  await page.locator('#agree').check();
  await form.getByRole('button', { name: /রেজিস্ট্রেশন জমা দাও/ }).click();
  await expect(page.getByRole('heading', { name: 'রেজিস্ট্রেশন সম্পন্ন হয়েছে' })).toBeVisible();
  // Without SMTP the message points to the status page instead of an email.
  await expect(page.getByText('স্ট্যাটাস পেজে')).toBeVisible();
});

test('admin login rejects a wrong password', async ({ page }) => {
  await page.goto('/admin');
  await page.getByLabel('ইমেইল').fill(process.env.E2E_ADMIN_EMAIL);
  await page.getByLabel('পাসওয়ার্ড').fill('wrong');
  await page.getByRole('button', { name: 'লগইন করুন' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'সঠিক নয়' })).toBeVisible();
});

test('organizer reviews and approves with the keyboard', async ({ page }) => {
  test.skip(!registrationOpen, 'needs the registration from the previous step');
  await adminLogin(page);
  await expect(page.getByText('ইমেইল এখনো সেটআপ হয়নি')).toBeVisible();

  await page.getByRole('button', { name: new RegExp(team.product) }).click();
  await expect(page.getByRole('heading', { name: team.product })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-review.png', fullPage: true });

  await page.keyboard.press('a');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('অ্যাপ্রুভ করবেন?');
  await dialog.getByLabel(/নোট/).fill('স্কোপ ছোট রাখো');
  await dialog.getByRole('button', { name: 'অ্যাপ্রুভ করুন' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'অ্যাপ্রুভ করা হয়েছে' })).toBeVisible();

  await page.getByRole('tab', { name: /অ্যাপ্রুভড/ }).click();
  await page.getByRole('button', { name: new RegExp(team.product) }).click();
  await expect(page.getByText('নোট: স্কোপ ছোট রাখো')).toBeVisible();
  await expect(page.getByRole('button', { name: 'সাবমিশন লিংক কপি' })).toBeVisible();
});

test('participant sees approval on the status page', async ({ page }) => {
  test.skip(!registrationOpen, 'needs the registration');
  await page.goto('/status');
  await page.getByLabel(/ইমেইল/).fill(team.email);
  await page.getByLabel(/WhatsApp/).fill(team.whatsapp);
  await page.getByRole('button', { name: /স্ট্যাটাস চেক/ }).click();
  await expect(page.getByText('অ্যাপ্রুভ হয়েছে')).toBeVisible();
});

test('approved team submits with their personal link', async ({ page }) => {
  test.skip(!registrationOpen || !submissionOpen, 'needs an approved registration and an open submission window');
  await adminLogin(page);
  const regs = await page.evaluate(() => fetch('/api/admin/data').then((r) => r.json()));
  const reg = regs.registrations.find((r) => r.email === team.email);
  const { link } = await page.evaluate((id) => fetch('/api/admin/link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).then((r) => r.json()), reg.id);

  await page.goto(new URL(link).pathname + new URL(link).search);
  const form = page.getByRole('form', { name: 'লাইভ প্রোজেক্ট জমার ফর্ম' });
  await expect(form).toContainText(team.product);
  await expect(form).toContainText(team.email);
  await page.locator('#liveUrl').fill('bazardor.vercel.app');
  await page.locator('#description').fill('বাজারদর দেখার সহজ অ্যাপ।');
  await form.getByRole('button', { name: /জমা দাও/ }).click();
  await expect(page.getByRole('heading', { name: 'জমা হয়েছে!' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('https://bazardor.vercel.app');

  // Coming back to the link shows the saved values and offers an update.
  await page.reload();
  await expect(page.getByText('জমা দিয়েছ। নতুন লিংক বা বিবরণ দিয়ে জমা দিলে')).toBeVisible();
  await expect(page.locator('#liveUrl')).toHaveValue('https://bazardor.vercel.app');
  await expect(page.getByRole('button', { name: /আপডেট করো/ })).toBeVisible();
});

test('organizer scores and publishes results', async ({ page }) => {
  test.skip(!registrationOpen || !submissionOpen, 'needs a submission');
  await adminLogin(page);
  await page.getByRole('tab', { name: 'সাবমিশন ও নম্বর' }).click();
  await expect(page.getByRole('heading', { name: team.product })).toBeVisible();
  const card = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: team.product }) });
  await card.getByRole('spinbutton', { name: 'নম্বর' }).fill('92');
  await card.getByRole('button', { name: 'সংরক্ষণ' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'নম্বর সংরক্ষিত' })).toBeVisible();

  await page.getByRole('button', { name: 'নম্বর থেকে ফলাফল তৈরি করুন' }).click();
  await expect(page.getByLabel('প্রোডাক্ট').first()).toHaveValue(team.product);
  await page.getByRole('button', { name: 'ফলাফল প্রকাশ করুন' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('ইমেইল সেটআপ হয়নি');
  await dialog.getByRole('button', { name: 'প্রকাশ করুন' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'স্থান প্রকাশিত' })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-results.png', fullPage: true });

  await page.goto('/results');
  await expect(page.getByText(team.product)).toBeVisible();
});

test('dashboard works on a phone', async ({ browser }) => {
  test.skip(!registrationOpen, 'needs a registration');
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await adminLogin(page);
  await page.getByRole('tab', { name: /সব/ }).click();
  await page.getByRole('button', { name: new RegExp(team.product) }).click();
  await expect(page.getByRole('button', { name: 'তালিকায় ফিরুন' })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-phone.png' });
  await page.getByRole('button', { name: 'তালিকায় ফিরুন' }).click();
  await expect(page.getByRole('button', { name: 'তালিকায় ফিরুন' })).toBeHidden();
  await page.close();
});

test('logout returns to the sign-in screen and blocks the API', async ({ page }) => {
  await adminLogin(page);
  await page.getByRole('button', { name: 'লগআউট' }).click();
  await expect(page.getByRole('button', { name: 'লগইন করুন' })).toBeVisible();
  const res = await page.evaluate(() => fetch('/api/admin/data').then((r) => r.status));
  expect(res).toBe(401);
});
