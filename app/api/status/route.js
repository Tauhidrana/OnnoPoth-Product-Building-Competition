/** POST /api/status — a participant checks their idea's status with email + WhatsApp. */
import { findRegistrationForStatus } from '@/lib/repo';
import { hit, clientIp } from '@/lib/rate-limit';
import { clean, normalisePhone } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'অনুরোধটি পড়া যায়নি।' }, { status: 400 });
  }
  const email = clean(body?.email);
  const whatsapp = normalisePhone(body?.whatsapp);
  if (!email || !whatsapp) return Response.json({ error: 'ইমেইল ও WhatsApp নম্বর দিন।' }, { status: 400 });

  try {
    // Stops anyone from guessing combinations at scale.
    if (await hit('status', clientIp(req), { limit: 20, windowMs: 10 * 60 * 1000 })) {
      return Response.json({ error: 'অনেকবার চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।' }, { status: 429 });
    }
    const r = await findRegistrationForStatus(email, whatsapp);
    if (!r) return Response.json({ status: 'not-found' });
    return Response.json({ status: r.status, name: r.fullName, productName: r.productName, teamName: r.teamName || null });
  } catch (error) {
    console.error('Status check failed:', error);
    return Response.json({ error: 'স্ট্যাটাস যাচাই করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।' }, { status: 500 });
  }
}
