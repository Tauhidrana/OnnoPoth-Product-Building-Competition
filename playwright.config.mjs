/**
 * Browser end-to-end tests. Runs a production build against its own
 * throwaway database schema (created in global-setup, dropped afterwards),
 * with test admin credentials and no SMTP — the same state as a fresh deploy.
 */
import { defineConfig, devices } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
process.env.E2E_SCHEMA ||= `e2e_${randomBytes(4).toString('hex')}`;
process.env.E2E_ADMIN_EMAIL = 'admin@e2e.local';
process.env.E2E_ADMIN_PASSWORD = 'e2e-password-123';
const PORT = 3100;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.mjs',
  globalSetup: './tests/e2e/global-setup.mjs',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, channel: 'chrome', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
  ],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
      DB_SCHEMA: process.env.E2E_SCHEMA,
      ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL,
      ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET: 'e2e-session-secret-0123456789',
      SMTP_HOST: '',
      GMAIL_USER: '',
      GMAIL_APP_PASSWORD: '',
      RECEIVER_EMAIL: '',
    },
  },
});
