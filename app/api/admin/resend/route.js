/** POST /api/admin/resend { id } — resend the decision email (after SMTP is set up, or a failure). */
import { requireAdmin } from '@/lib/admin';
import { getRegistration, logActivity } from '@/lib/repo';
import { sendDecisionEmail } from '@/lib/server/decision-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => ({}));
  const ids = (Array.isArray(body?.ids) ? body.ids : [body?.id]).map(Number).filter(Number.isInteger).slice(0, 500);
  if (!ids.length) return Response.json({ error: 'অনুরোধটি সঠিক নয়।' }, { status: 400 });

  try {
    const counts = { sent: 0, failed: 0, skipped: 0 };
    for (const id of ids) {
      const r = await getRegistration(id);
      if (!r || r.status === 'pending') continue;
      const res = await sendDecisionEmail(r);
      counts[res.status] += 1;
    }
    await logActivity(auth.actor, 'emails.resent', ids.length === 1 ? ids[0] : null, counts);
    return Response.json({ ok: true, ...counts });
  } catch (error) {
    console.error('Resend failed:', error);
    return Response.json({ error: 'ইমেইল পাঠানো যায়নি।' }, { status: 500 });
  }
}
