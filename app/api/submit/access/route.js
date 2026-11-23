/** GET /api/submit/access?token=… — unlocks and pre-fills the submission form. */
import { approvedRegistrationFromToken } from '@/lib/server/approval';
import { getSubmissionByRegistration } from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const token = new URL(req.url).searchParams.get('token') || '';
  try {
    const r = await approvedRegistrationFromToken(token);
    if (!r) return Response.json({ allowed: false }, { status: 403 });
    const existing = await getSubmissionByRegistration(r.id);
    return Response.json({
      allowed: true,
      name: r.teamName || r.fullName,
      leader: r.fullName,
      email: r.email,
      productName: r.productName,
      submitted: existing ? { at: existing.updatedAt, liveUrl: existing.liveUrl, description: existing.description || '' } : null,
    });
  } catch (error) {
    console.error('Submit access failed:', error);
    return Response.json({ allowed: false, error: 'যাচাই করা যায়নি।' }, { status: 500 });
  }
}
