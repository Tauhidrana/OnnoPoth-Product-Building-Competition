import { test as base, expect } from '@playwright/test';

/**
 * Each test browses from its own simulated client IP (the header Vercel
 * sets in production), so the per-IP rate limits — 5 registrations per
 * 10 minutes — apply per test instead of across the whole run.
 */
const ip = () => `10.${(Math.random() * 250) | 0}.${(Math.random() * 250) | 0}.${(Math.random() * 250) | 0}`;

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.setExtraHTTPHeaders({ 'x-forwarded-for': ip() });
    await use(context);
  },
  request: async ({ playwright, baseURL }, use) => {
    const req = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { 'x-forwarded-for': ip() } });
    await use(req);
    await req.dispose();
  },
});
export { expect };
