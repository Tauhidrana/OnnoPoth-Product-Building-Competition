// Next.js ignores .env.local when NODE_ENV=test, so load it directly
// (CI can provide DATABASE_URL as a real environment variable instead).
import { existsSync } from 'node:fs';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');

process.env.ADMIN_EMAIL = 'admin@test.local';
process.env.ADMIN_PASSWORD = 'correct horse battery staple';
process.env.ADMIN_SESSION_SECRET = 'test-secret-0123456789abcdef';
// Tests never use real mail settings; a test opts in to the local SMTP sink.
for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'SMTP_SECURE', 'GMAIL_USER', 'GMAIL_APP_PASSWORD', 'RECEIVER_EMAIL']) delete process.env[k];
