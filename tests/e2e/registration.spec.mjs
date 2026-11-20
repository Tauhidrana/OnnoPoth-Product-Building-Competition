import { expect, test } from './fixtures.mjs';

/**
 * Every field of the registration form, the edge cases found in the audit,
 * and the flows around it (draft, errors, team, success, duplicates).
 */
const open = Date.now() < new Date('2026-11-23T23:59:00+06:00').getTime();
test.skip(!open, 'registration window has closed');

const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

async function fresh(page) {
  await page.goto('/#register');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  return page.getByRole('form', { name: 'রেজিস্ট্রেশন ফর্ম' });
}

async function fillValid(page, overrides = {}) {
  const v = {
    fullName: 'রহিম উদ্দিন', institution: 'Dhaka College', className: 'HSC', whatsapp: '01712345678',
    email: `reg-${stamp()}@example.com`, github: 'rahimdev', productName: 'বাজারদর',
    problem: 'বাজারে প্রতিদিন দাম বদলায়, ক্রেতারা আগে জানতে পারেন না।', users: 'শহরের পরিবার', 'feature-0': 'আজকের দাম', 'feature-1': 'দামের ট্রেন্ড', 'feature-2': 'এলাকা অনুযায়ী তুলনা',
    ...overrides,
  };
  for (const [k, val] of Object.entries(v)) if (val !== null) await page.locator(`#${k}`).fill(val);
  await page.locator('#agree').check();
  return v;
}

const submit = (form) => form.getByRole('button', { name: /রেজিস্ট্রেশন জমা দাও/ }).click();

test('empty submit shows a summary that links to each field', async ({ page }) => {
  const form = await fresh(page);
  await submit(form);
  const summary = page.getByRole('alert').filter({ hasText: 'ঘর ঠিক করতে হবে' });
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('১১টি ঘর ঠিক করতে হবে');
  await summary.getByRole('link', { name: /WhatsApp নম্বর/ }).click();
  await expect(page.locator('#whatsapp')).toBeFocused();
  await expect(page.locator('#whatsapp')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#whatsapp')).toHaveAttribute('aria-describedby', 'whatsapp-error');
  // Fixing a field clears its error straight away.
  await page.locator('#whatsapp').fill('01712345678');
  await expect(summary).toContainText('১০টি ঘর');
});

test('fields are checked when you leave them, with specific messages', async ({ page }) => {
  await fresh(page);
  await page.locator('#whatsapp').fill('0171234567');
  await page.locator('#email').click();
  await expect(page.locator('#whatsapp-error')).toContainText('১১টি সংখ্যা');
  await page.locator('#whatsapp').fill('01212345678');
  await expect(page.locator('#whatsapp-error')).toContainText('013–019');
  await page.locator('#email').fill('rahim@');
  await page.locator('#github').click();
  await expect(page.locator('#email-error')).toBeVisible();
  await page.locator('#github').fill('rahim_dev');
  await page.locator('#productName').click();
  await expect(page.locator('#github-error')).toContainText('হাইফেন');
  await page.locator('#problem').fill('দাম');
  await page.locator('#users').click();
  await expect(page.locator('#problem-error')).toContainText('বিস্তারিত');
});

test('tidies pasted values: phone formats and GitHub links', async ({ page }) => {
  await fresh(page);
  await page.locator('#whatsapp').fill('+880 1712-345678');
  await page.locator('#email').click();
  await expect(page.locator('#whatsapp')).toHaveValue('01712345678');
  await expect(page.locator('#whatsapp-hint')).toContainText('ঠিক করা হয়েছে');
  await page.locator('#whatsapp').fill('০১৮১২৩৪৫৬৭৮');
  await page.locator('#email').click();
  await expect(page.locator('#whatsapp')).toHaveValue('01812345678');
  await page.locator('#github').fill('https://github.com/rahim-dev/bazardor');
  await page.locator('#productName').click();
  await expect(page.locator('#github')).toHaveValue('rahim-dev');
});

test('offers a fix for a mistyped email domain', async ({ page }) => {
  await fresh(page);
  await page.locator('#email').fill('rahim@gmial.com');
  await page.locator('#github').click();
  await page.getByRole('button', { name: 'rahim@gmail.com' }).click();
  await expect(page.locator('#email')).toHaveValue('rahim@gmail.com');
});

test('team: carries the name over, needs two members, and moves the leader', async ({ page }) => {
  await fresh(page);
  await page.locator('#fullName').fill('রহিম');
  await page.getByRole('radio', { name: /টিম/ }).click();
  await expect(page.locator('#member-0')).toHaveValue('রহিম');
  await expect(page.getByRole('radio', { name: 'সদস্য ১ লিডার' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'সদস্য ৩ লিডার' })).toBeDisabled();

  await page.locator('#member-1').fill('করিম');
  await page.getByRole('radio', { name: 'সদস্য ২ লিডার' }).check();
  // Clearing the leader hands the role to the first named member.
  await page.locator('#member-1').fill('');
  await expect(page.getByRole('radio', { name: 'সদস্য ১ লিডার' })).toBeChecked();
  await page.locator('#member-2').click();
  await page.locator('#teamName').click();
  await expect(page.locator('#members-error')).toContainText('অন্তত ২ জন');

  await page.locator('#member-1').fill('রহিম ');
  await page.locator('#member-2').click();
  await expect(page.locator('#members-error')).toContainText('দুবার');

  // Back to solo keeps the leader's name.
  await page.getByRole('radio', { name: 'একা' }).click();
  await expect(page.locator('#fullName')).toHaveValue('রহিম');
});

test('a team registers with the chosen leader', async ({ page }) => {
  const form = await fresh(page);
  await page.getByRole('radio', { name: /টিম/ }).click();
  await page.locator('#teamName').fill('Team Syntax Error');
  await page.locator('#member-0').fill('রহিম');
  await page.locator('#member-1').fill('করিম');
  await page.getByRole('radio', { name: 'সদস্য ২ লিডার' }).check();
  await fillValid(page, { fullName: null });
  await submit(form);
  await expect(page.getByRole('heading', { name: 'রেজিস্ট্রেশন সম্পন্ন হয়েছে' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Team Syntax Error');
  await expect(page.getByRole('status')).toContainText('করিম');
});

test('keeps a draft across reloads, and can start over', async ({ page }) => {
  await fresh(page);
  await page.locator('#fullName').fill('ড্রাফট পরীক্ষা');
  await page.locator('#problem').fill('অর্ধেক লেখা আইডিয়া');
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.getByText('আগের অসম্পূর্ণ লেখা ফিরিয়ে আনা হয়েছে')).toBeVisible();
  await expect(page.locator('#fullName')).toHaveValue('ড্রাফট পরীক্ষা');
  await page.getByRole('button', { name: 'নতুন করে শুরু করো' }).click();
  await expect(page.locator('#fullName')).toHaveValue('');
  await page.reload();
  await expect(page.getByText('আগের অসম্পূর্ণ লেখা')).toBeHidden();
});

test('success replaces the form with a summary, next steps and a calendar file', async ({ page }) => {
  const form = await fresh(page);
  const v = await fillValid(page);
  await submit(form);
  const done = page.getByRole('status').filter({ hasText: 'রেজিস্ট্রেশন সম্পন্ন হয়েছে' });
  await expect(done).toBeVisible();
  await expect(done).toContainText(v.email);
  await expect(done).toContainText('এরপর যা হবে');
  const [download] = await Promise.all([page.waitForEvent('download'), done.getByRole('button', { name: 'ক্যালেন্ডারে যোগ করো' }).click()]);
  expect(download.suggestedFilename()).toBe('onnopoth-competition.ics');
  // The draft is gone after a successful registration.
  await page.reload();
  await expect(page.getByText('আগের অসম্পূর্ণ লেখা')).toBeHidden();
});

test('registering the same email twice explains what to do', async ({ page }) => {
  const email = `dup-${stamp()}@example.com`;
  let form = await fresh(page);
  await fillValid(page, { email });
  await submit(form);
  await expect(page.getByRole('heading', { name: 'রেজিস্ট্রেশন সম্পন্ন হয়েছে' })).toBeVisible();

  form = await fresh(page);
  await fillValid(page, { email: email.toUpperCase() });
  await submit(form);
  const notice = page.getByRole('alert').filter({ hasText: 'আগেই রেজিস্ট্রেশন হয়েছে' });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole('link', { name: /স্ট্যাটাস দেখো/ })).toBeVisible();
  await expect(page.locator('#email-error')).toBeVisible();
  // Changing the email clears that error.
  await page.locator('#email').fill(`other-${stamp()}@example.com`);
  await expect(page.locator('#email-error')).toBeHidden();
});

test('features: three required boxes, up to two more, Enter moves along', async ({ page }) => {
  const form = await fresh(page);
  await expect(page.locator('[id^="feature-"]')).toHaveCount(3);
  await page.locator('#feature-0').fill('আজকের দাম');
  await page.locator('#feature-0').press('Enter');
  await expect(page.locator('#feature-1')).toBeFocused();
  await page.locator('#feature-1').fill('দামের ট্রেন্ড');
  await page.locator('#feature-1').press('Enter');
  await page.locator('#feature-2').fill('এলাকা অনুযায়ী তুলনা');
  // Enter on the last filled box adds an optional one.
  await page.locator('#feature-2').press('Enter');
  await expect(page.locator('#feature-3')).toBeFocused();
  await page.locator('#feature-3').fill('অফলাইন মোড');
  await page.getByRole('button', { name: /আরেকটি ফিচার যোগ করো/ }).click();
  await expect(page.locator('#feature-4')).toBeFocused();
  await expect(page.getByRole('button', { name: /আরেকটি ফিচার যোগ করো/ })).toBeHidden();
  // Optional boxes can be removed; required ones cannot.
  await page.getByRole('button', { name: 'ফিচার ৫ সরাও' }).click();
  await expect(page.locator('[id^="feature-"]')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'ফিচার ১ সরাও' })).toHaveCount(0);
  // Enter never submits the form from a feature box.
  await expect(page.getByRole('alert').filter({ hasText: 'ঘর ঠিক করতে হবে' })).toBeHidden();
  expect(form).toBeTruthy();
});

test('features: missing ones are pointed out, and the summary jumps to the empty box', async ({ page }) => {
  const form = await fresh(page);
  await fillValid(page, { 'feature-1': '', 'feature-2': '' });
  await submit(form);
  await expect(page.locator('#features-error')).toContainText('এখন ১টি');
  await expect(page.locator('#feature-1')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#feature-0')).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('alert').getByRole('link', { name: /ফিচার/ }).click();
  await expect(page.locator('#feature-1')).toBeFocused();
  await page.locator('#feature-1').fill('আজকের দাম');
  await page.locator('#feature-2').fill('আজকের দাম');
  await expect(page.locator('#features-error')).toContainText('দুবার');
});

test('a network failure keeps everything typed', async ({ page }) => {
  const form = await fresh(page);
  await fillValid(page, { fullName: 'অফলাইন পরীক্ষা' });
  await page.route('**/api/register', (route) => route.abort());
  await submit(form);
  await expect(page.getByRole('alert').filter({ hasText: 'ইন্টারনেট সংযোগ নেই' })).toBeVisible();
  await expect(page.locator('#fullName')).toHaveValue('অফলাইন পরীক্ষা');
});

test('a server error shows a calm message and keeps the data', async ({ page }) => {
  const form = await fresh(page);
  await fillValid(page);
  await page.route('**/api/register', (route) => route.fulfill({ status: 500, body: '{}' }));
  await submit(form);
  await expect(page.getByRole('alert').filter({ hasText: 'জমা দেওয়া যায়নি' })).toBeVisible();
  await expect(page.locator('#problem')).not.toHaveValue('');
});

test('works at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  const form = await fresh(page);
  await submit(form);
  await expect(page.getByRole('alert').filter({ hasText: 'ঘর ঠিক করতে হবে' })).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
