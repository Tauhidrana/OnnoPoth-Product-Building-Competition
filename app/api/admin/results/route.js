/**
 * POST /api/admin/results — publish up to 10 winners and email each of them.
 * The published list is stored as a custom header in the organizer's inbox,
 * so the public results page can read it without a database.
 */
import nodemailer from 'nodemailer';
import { getCookieValue, isAdminSession } from '@/lib/admin';
import { clearRecordsCache } from '@/lib/gmail-store';
import { event, socialLinks } from '@/lib/config';
import { layout, button, highlight, p, signoff, esc, bn } from '@/lib/email';

export const runtime = 'nodejs';

function resultEmail(name, place, product, marks, rank) {
  return layout({
    preheader: `${place} — ${event.name}`,
    eyebrow: 'ফলাফল ঘোষণা',
    title: `অভিনন্দন, ${esc(name)}`,
    body:
      p(`<strong>${esc(product)}</strong> প্রোডাক্টের জন্য আপনি এই স্থান অর্জন করেছেন:`) +
      highlight(marks != null ? `${bn(esc(marks))} / ১০০ নম্বর` : 'অর্জিত স্থান', esc(place)) +
      (rank <= 3 ? p('আপনার পুরস্কার (বই) পৌঁছে দেওয়ার বিষয়ে আয়োজক কমিটি শীঘ্রই যোগাযোগ করবে।') : '') +
      button('সম্পূর্ণ ফলাফল দেখুন', `${socialLinks.siteUrl}/results`) +
      signoff(),
  });
}

export async function POST(req) {
  if (!isAdminSession(getCookieValue(req.headers.get('cookie'), 'onnopoth_admin'))) {
    return Response.json({ error: 'অনুমোদন প্রয়োজন।' }, { status: 401 });
  }

  try {
    const { winners } = await req.json();
    if (!Array.isArray(winners) || winners.length === 0 || winners.length > 10) {
      return Response.json({ error: '১ থেকে ১০ জনের ফলাফল দিন।' }, { status: 400 });
    }

    const clean = winners.slice(0, 10).map((w, i) => ({
      rank: i + 1,
      place: String(w.place || `${i + 1}`),
      name: String(w.name || '').trim(),
      email: String(w.email || '').trim(),
      product: String(w.product || '').trim(),
      institution: String(w.institution || '').trim(),
      marks: w.marks === '' || w.marks == null ? null : Number(w.marks),
    }));

    if (clean.some((w) => !w.name || !w.email || !w.product)) {
      return Response.json({ error: 'নাম, প্রোডাক্ট ও ইমেইল আবশ্যক।' }, { status: 400 });
    }

    const { GMAIL_USER, GMAIL_APP_PASSWORD, RECEIVER_EMAIL } = process.env;
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return Response.json({ error: 'ইমেইল সেটআপ করা নেই।' }, { status: 500 });
    }

    const smtpHost = process.env.SMTP_HOST;
    const transporter = smtpHost
      ? nodemailer.createTransport({ host: smtpHost, port: Number(process.env.SMTP_PORT || 1025), secure: false })
      : nodemailer.createTransport({
          service: 'gmail',
          auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
        });

    // One email per unique address, even if someone appears in multiple places.
    const byEmail = new Map();
    for (const w of clean) {
      if (!byEmail.has(w.email.toLowerCase())) byEmail.set(w.email.toLowerCase(), []);
      byEmail.get(w.email.toLowerCase()).push(w);
    }

    let emailsSent = 0;
    for (const [, entries] of byEmail) {
      const first = entries[0];
      const rankText = entries.map((e) => `${e.place} স্থান (${e.product})`).join(', ');
      try {
        await transporter.sendMail({
          from: `"${event.shortName}" <${GMAIL_USER}>`,
          to: first.email,
          subject: `ফলাফল ঘোষণা – ${rankText}`,
          html: resultEmail(first.name, rankText, first.product, first.marks, first.rank),
        });
        emailsSent += 1;
      } catch (error) {
        console.warn('Result email failed for', first.email, error.message);
      }
    }

    await transporter.sendMail({
      from: `"${event.shortName}" <${GMAIL_USER}>`,
      to: RECEIVER_EMAIL || GMAIL_USER,
      subject: `Results published – ${clean.length} places`,
      headers: {
        'X-OnnoPoth-Results': Buffer.from(
          JSON.stringify({ winners: clean, publishedAt: new Date().toISOString() })
        ).toString('base64'),
      },
      text: `Published results:\n${clean.map((w) => `${w.place}. ${w.name} – ${w.product} – ${w.marks ?? '—'}`).join('\n')}`,
    });

    clearRecordsCache();
    return Response.json({ ok: true, published: clean.length, emailsSent });
  } catch (error) {
    console.error('Publish results failed:', error.message);
    return Response.json({ error: 'ফলাফল প্রকাশ করা যায়নি।' }, { status: 500 });
  }
}
