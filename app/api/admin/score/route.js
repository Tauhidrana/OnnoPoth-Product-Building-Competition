/** POST /api/admin/score { submissionId, score (0–100 or null), notes? } */
import { requireAdmin } from '@/lib/admin';
import { scoreSubmission } from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => ({}));
  const id = Number(body?.submissionId);
  const score = body?.score === null || body?.score === '' ? null : Number(body?.score);
  const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 2000) : '';
  if (!Number.isInteger(id) || (score !== null && (!Number.isInteger(score) || score < 0 || score > 100))) {
    return Response.json({ error: 'নম্বর ০ থেকে ১০০ এর মধ্যে পূর্ণসংখ্যা হতে হবে।' }, { status: 400 });
  }
  try {
    const row = await scoreSubmission(id, { score, notes }, auth.actor);
    if (!row) return Response.json({ error: 'সাবমিশনটি পাওয়া যায়নি।' }, { status: 404 });
    return Response.json({ ok: true, submission: row });
  } catch (error) {
    console.error('Score failed:', error);
    return Response.json({ error: 'নম্বর সংরক্ষণ করা যায়নি।' }, { status: 500 });
  }
}
