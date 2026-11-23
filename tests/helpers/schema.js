/**
 * Creates a throwaway Postgres schema with the app's migrations applied, and
 * points the app at it via DB_SCHEMA. Real data in `public` is never touched.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { getSql } from '../../lib/db.js';

const MIGRATIONS = join(process.cwd(), 'supabase', 'migrations');

export async function createTestSchema(prefix = 'test') {
  const name = `${prefix}_${randomBytes(4).toString('hex')}`;
  const sql = getSql();
  await sql.unsafe(`create schema "${name}"`);
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
  await sql.begin(async (tx) => {
    await tx.unsafe(`set local search_path to "${name}", public`);
    for (const f of files) await tx.unsafe(readFileSync(join(MIGRATIONS, f), 'utf8'));
  });
  process.env.DB_SCHEMA = name;
  return name;
}

export async function dropTestSchema(name) {
  if (!name || !/^(test|e2e)_[0-9a-f]{8}$/.test(name)) throw new Error(`refusing to drop schema ${name}`);
  await getSql().unsafe(`drop schema "${name}" cascade`);
}
