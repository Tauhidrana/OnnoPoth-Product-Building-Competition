/**
 * POST /api/admin/results { winners: [{ place, name, email, product, institution?, marks?, registrationId? }], notify? }
 * Replaces the published results. Emails only winners whose result is new or
 * changed since the last publish. An empty list unpublishes.
 */
import { requireAdmin } from '@/lib/admin';
import { publishResults, markResultEmailed } from '@/lib/repo';
import { validateResults } from '@/lib/validation';
import { sendEmail } from '@/lib/mailer';
import { result } from '@/lib/email-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => ({}));
  const { rows, error } = validateResults(body?.winners);
  if (error) return Response.json({ error }, { status: 400 });

  try {
    const saved = await publishResults(rows, auth.actor);
    const counts = { sent: 0, failed: 0, skipped: 0 };
    if (body?.notify !== false) {
      for (const w of saved.filter((r) => !r.emailedAt)) {
        const res = await sendEmail({ kind: 'result', to: w.email, registrationId: w.registrationId, ...result(w) });
        counts[res.status] += 1;
        if (res.status === 'sent') await markResultEmailed(w.rank);
      }
    }
    return Response.json({ ok: true, published: saved.length, ...counts });
  } catch (err) {
    console.error('Publish results failed:', err);
    return Response.json({ error: 'ফলাফল প্রকাশ করা যায়নি।' }, { status: 500 });
  }
}
