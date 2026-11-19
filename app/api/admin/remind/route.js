/** POST /api/admin/remind — email all participants whose idea is still pending. */
import nodemailer from 'nodemailer';
import { getRecords, decisionFor } from '@/lib/gmail-store';
import { getCookieValue, isAdminSession } from '@/lib/admin';
import { event, socialLinks } from '@/lib/config';
import { layout, button, p, signoff, esc } from '@/lib/email';

function reminderEmail(person) {
  return layout({
    preheader: 'আপনার আইডিয়া পর্যালোচনায় আছে। ২৫ নভেম্বর স্ট্যাটাস জানানো হবে।',
    eyebrow: 'আইডিয়া যাচাই চলছে',
    title: `প্রিয় ${esc(person.name || 'প্রতিযোগী')}`,
    body:
      p(`আপনার <strong>${esc(person.productName || 'প্রোডাক্ট')}</strong> আইডিয়া আমাদের পর্যালোচনায় আছে। ২৫ নভেম্বর স্ট্যাটাস জানানো হবে।`) +
      p('রেজিস্ট্রেশনের ইমেইল ও WhatsApp নম্বর দিয়ে যেকোনো সময় নিজের স্ট্যাটাস দেখতে পারেন।') +
      button('স্ট্যাটাস দেখুন', `${socialLinks.siteUrl}/status`) +
      signoff(),
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!isAdminSession(getCookieValue(req.headers.get('cookie'), 'onnopoth_admin'))) {
    return Response.json({ error: 'অনুমোদন প্রয়োজন।' }, { status: 401 });
  }

  try {
    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return Response.json({ error: 'ইমেইল সেটআপ করা নেই।' }, { status: 500 });
    }

    const { registrations, approvals } = await getRecords({ force: true });
    const pending = registrations.filter((r) => !decisionFor(approvals, r.email));
    if (!pending.length) return Response.json({ sent: 0 });

    const smtpHost = process.env.SMTP_HOST;
    const transporter = smtpHost
      ? nodemailer.createTransport({ host: smtpHost, port: Number(process.env.SMTP_PORT || 1025), secure: false })
      : nodemailer.createTransport({
          service: 'gmail',
          auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
        });

    let sent = 0;
    for (const person of pending) {
      try {
        await transporter.sendMail({
          from: `"${event.shortName}" <${GMAIL_USER}>`,
          to: person.email,
          subject: 'মনে করিয়ে দিচ্ছি: আইডিয়া যাচাই চলছে',
          html: reminderEmail(person),
        });
        sent += 1;
      } catch (error) {
        console.warn('Reminder failed for', person.email, error.message);
      }
    }

    return Response.json({ sent });
  } catch (error) {
    console.error('Reminder run failed:', error.message);
    return Response.json({ error: 'রিমাইন্ডার পাঠানো যায়নি।' }, { status: 500 });
  }
}
