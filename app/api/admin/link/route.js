/** POST /api/admin/link { id } — the approved team's personal submission link, to share by hand. */
import { requireAdmin, submitLink } from '@/lib/admin';
import { getRegistration, logActivity } from '@/lib/repo';
import { socialLinks } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => ({}));
  const r = await getRegistration(Number(body?.id));
  if (!r) return Response.json({ error: 'রেজিস্ট্রেশনটি পাওয়া যায়নি।' }, { status: 404 });
  if (r.status !== 'approved') return Response.json({ error: 'শুধু অ্যাপ্রুভড টিমের লিংক তৈরি করা যায়।' }, { status: 409 });
  await logActivity(auth.actor, 'link.copied', r.id, {});
  return Response.json({ link: submitLink(r, new URL(req.url).origin || socialLinks.siteUrl) });
}
