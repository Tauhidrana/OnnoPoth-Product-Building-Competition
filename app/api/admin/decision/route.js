/**
 * POST /api/admin/decision { id, decision: approved|declined|pending, note?, notify? }
 * Saves the decision (with an audit entry), then emails the participant
 * unless notify is false or the decision is "pending" (undo).
 */
import { requireAdmin } from '@/lib/admin';
import { decide } from '@/lib/repo';
import { sendDecisionEmail } from '@/lib/server/decision-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'অনুরোধটি পড়া যায়নি।' }, { status: 400 });
  }
  const id = Number(body?.id);
  const decision = body?.decision;
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 1000) : '';
  if (!Number.isInteger(id) || !['approved', 'declined', 'pending'].includes(decision)) {
    return Response.json({ error: 'অনুরোধটি সঠিক নয়।' }, { status: 400 });
  }

  try {
    const result = await decide(id, decision, { note, actor: auth.actor });
    if (!result) return Response.json({ error: 'রেজিস্ট্রেশনটি পাওয়া যায়নি।' }, { status: 404 });

    let email = { status: 'skipped' };
    const changed = result.previousStatus !== decision;
    if (decision !== 'pending' && body?.notify !== false && changed) {
      email = await sendDecisionEmail(result.registration);
    }
    return Response.json({ ok: true, registration: result.registration, previousStatus: result.previousStatus, email });
  } catch (error) {
    console.error('Decision failed:', error);
    return Response.json({ error: 'সিদ্ধান্ত সংরক্ষণ করা যায়নি।' }, { status: 500 });
  }
}
