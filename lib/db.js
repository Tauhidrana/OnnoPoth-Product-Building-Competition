/**
 * Server-only Postgres client (Supabase, via the session pooler).
 *
 * DATABASE_URL is the Supabase "Session pooler" connection string (IPv4,
 * port 5432) with the password URL-encoded. Don't use the transaction pooler
 * (port 6543): postgres.js hangs there when queries run concurrently. Each
 * server instance keeps a small pool so we stay under Supabase's limit.
 *
 * Every query names its table through `t()`, so the schema can be swapped
 * (DB_SCHEMA) for an isolated throwaway schema in tests.
 */
import postgres from 'postgres';

const g = globalThis;

export function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
  if (!g.__onnopothSql) {
    g.__onnopothSql = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: Number(process.env.DB_POOL_MAX || 3),
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => {},
      // snake_case columns ⇄ camelCase objects, both ways.
      transform: postgres.camel,
      // bigint ids as plain numbers (safe far beyond this app's row counts).
      types: { int8: { to: 20, from: [20], serialize: (v) => String(v), parse: (v) => Number(v) } },
    });
  }
  return g.__onnopothSql;
}

/** Schema-qualified table identifier, e.g. t('registrations') → "public"."registrations". */
export function t(table) {
  return getSql()(`${process.env.DB_SCHEMA || 'public'}.${table}`);
}

/** For tests: close the pool so the process can exit. */
export async function closeSql() {
  if (g.__onnopothSql) {
    await g.__onnopothSql.end({ timeout: 5 });
    g.__onnopothSql = undefined;
  }
}
