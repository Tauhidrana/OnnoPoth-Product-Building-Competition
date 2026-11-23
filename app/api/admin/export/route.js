/** GET /api/admin/export?type=registrations|submissions — CSV download. */
import { requireAdmin } from '@/lib/admin';
import { listRegistrations, listSubmissions } from '@/lib/repo';
import { toCsv } from '@/lib/csv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLUMNS = {
  registrations: [
    ['id', 'ID'], ['createdAt', 'Registered at'], ['status', 'Status'], ['registrationType', 'Type'], ['fullName', 'Name'],
    ['teamName', 'Team'], ['members', 'Members'], ['institution', 'Institution'], ['className', 'Class'], ['whatsapp', 'WhatsApp'],
    ['email', 'Email'], ['github', 'GitHub'], ['productName', 'Product'], ['problem', 'Problem'], ['targetUsers', 'Users'],
    ['features', 'Features'], ['decisionNote', 'Decision note'], ['decidedAt', 'Decided at'],
  ],
  submissions: [
    ['id', 'ID'], ['createdAt', 'Submitted at'], ['updatedAt', 'Updated at'], ['name', 'Team / name'], ['email', 'Email'],
    ['institution', 'Institution'], ['productName', 'Product'], ['liveUrl', 'Live URL'], ['description', 'Description'],
    ['score', 'Score'], ['judgeNotes', 'Notes'],
  ],
};

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;
  const type = new URL(req.url).searchParams.get('type');
  if (!COLUMNS[type]) return Response.json({ error: 'Unknown export type' }, { status: 400 });
  const rows = type === 'registrations' ? await listRegistrations() : await listSubmissions();
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(COLUMNS[type], rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="onnopoth-${type}-${stamp}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
