/** GET /api/admin/data — everything the dashboard shows, in one request. */
import { requireAdmin } from '@/lib/admin';
import { listRegistrations, listSubmissions, getResults, recentActivity, recentEmails, stats } from '@/lib/repo';
import { isEmailConfigured } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;
  try {
    const [registrations, submissions, results, activity, emails, totals] = await Promise.all([
      listRegistrations(),
      listSubmissions(),
      getResults(),
      recentActivity(60),
      recentEmails(60),
      stats(),
    ]);
    return Response.json({
      me: auth.actor,
      emailConfigured: isEmailConfigured(),
      stats: totals,
      registrations,
      submissions,
      results,
      activity,
      emails,
    });
  } catch (error) {
    console.error('Admin data failed:', error);
    return Response.json({ error: 'ডেটা লোড করা যায়নি।' }, { status: 500 });
  }
}
