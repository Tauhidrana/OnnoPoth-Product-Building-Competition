import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';

/** Create the throwaway schema the e2e server uses; return a teardown that drops it. */
export default async function globalSetup() {
  const name = process.env.E2E_SCHEMA;
  if (!/^e2e_[0-9a-f]{8}$/.test(name)) throw new Error(`bad schema name ${name}`);
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, onnotice: () => {} });
  await sql.unsafe(`create schema "${name}"`);
  const dir = join(process.cwd(), 'supabase', 'migrations');
  await sql.begin(async (tx) => {
    await tx.unsafe(`set local search_path to "${name}", public`);
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) await tx.unsafe(readFileSync(join(dir, f), 'utf8'));
  });
  await sql.end();

  return async () => {
    const s = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, onnotice: () => {} });
    await s.unsafe(`drop schema "${name}" cascade`);
    await s.end();
  };
}
