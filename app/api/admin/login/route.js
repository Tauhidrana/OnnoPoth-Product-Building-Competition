/** POST /api/admin/login — refuses unless admin is fully configured; rate-limited per IP. */
import { adminConfigured, checkCredentials, createAdminSession, sessionCookie } from '@/lib/admin';
import { isLimited, recordEvent, clientIp } from '@/lib/rate-limit';
import { logActivity } from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

export async function POST(req) {
  if (!adminConfigured()) {
    return Response.json({ error: 'অ্যাডমিন লগইন সেটআপ করা নেই (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET)।' }, { status: 503 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'অনুরোধটি পড়া যায়নি।' }, { status: 400 });
  }

  const ip = clientIp(req);
  try {
    if (await isLimited('login-fail', ip, LIMIT)) {
      return Response.json({ error: 'অনেকবার ভুল চেষ্টা হয়েছে। ১৫ মিনিট পর আবার চেষ্টা করুন।' }, { status: 429 });
    }
    if (!checkCredentials(body?.email, body?.password)) {
      await recordEvent('login-fail', ip);
      return Response.json({ error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।' }, { status: 401 });
    }
    const email = body.email.trim().toLowerCase();
    await logActivity(email, 'admin.login', null, {});
    const res = Response.json({ ok: true });
    res.headers.set('Set-Cookie', sessionCookie(createAdminSession(email)));
    return res;
  } catch (error) {
    console.error('Admin login failed:', error);
    return Response.json({ error: 'লগইন করা যায়নি।' }, { status: 500 });
  }
}
