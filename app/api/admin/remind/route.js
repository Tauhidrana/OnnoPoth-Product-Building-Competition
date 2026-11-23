/** POST /api/admin/remind — remind pending participants (at most once per 24 hours each). */
import { requireAdmin } from '@/lib/admin';
import { pendingForReminder, markReminded } from '@/lib/repo';
import { sendEmail } from '@/lib/mailer';
import { reminder } from '@/lib/email-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;
  try {
    const people = await pendingForReminder();
    const counts = { sent: 0, failed: 0, skipped: 0 };
    const done = [];
    for (const r of people) {
      const res = await sendEmail({ kind: 'reminder', to: r.email, registrationId: r.id, ...reminder(r) });
      counts[res.status] += 1;
      if (res.status === 'sent') done.push(r.id);
    }
    await markReminded(done, auth.actor);
    return Response.json({ ok: true, total: people.length, ...counts });
  } catch (error) {
    console.error('Reminders failed:', error);
    return Response.json({ error: 'রিমাইন্ডার পাঠানো যায়নি।' }, { status: 500 });
  }
}
