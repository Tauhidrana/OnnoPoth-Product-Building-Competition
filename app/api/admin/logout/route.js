import { sessionCookie } from '@/lib/admin';

export const runtime = 'nodejs';

export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.set('Set-Cookie', sessionCookie('', { maxAge: 0 }));
  return res;
}
