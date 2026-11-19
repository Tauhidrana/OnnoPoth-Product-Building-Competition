/**
 * POST /api/admin/decision
 * Approve or decline an idea. Approval emails a signed one-time link that
 * unlocks the main product submission form.
 */
import nodemailer from 'nodemailer';
import { getCookieValue, isAdminSession, createApprovalToken } from '@/lib/admin';
import { event, socialLinks } from '@/lib/config';
import { eventIcs } from '@/lib/calendar';
import { clearRecordsCache } from '@/lib/gmail-store';
import { layout, button, p, steps, signoff, esc } from '@/lib/email';

export const runtime = 'nodejs';

function approvalEmail(name, productName, link) {
  return layout({
    preheader: `${productName} অ্যাপ্রুভ হয়েছে। ২৭ নভেম্বর দেখা হবে।`,
    eyebrow: 'আইডিয়া অ্যাপ্রুভ হয়েছে',
    title: `অভিনন্দন, ${esc(name)}`,
    body:
      p(`<strong>${esc(productName)}</strong> আইডিয়াটি যাচাইয়ে পাস করেছে। আপনি মূল প্রতিযোগিতায় অংশ নিচ্ছেন।`) +
      steps([
        ['২৬ নভেম্বর', 'ব্রিফিং ও WhatsApp গ্রুপ'],
        ['২৭ নভেম্বর, সকাল ১০টা', 'নতুন রিপো খুলে কাজ শুরু'],
        ['২৭ নভেম্বর, রাত ১০টার আগে', 'নিচের লিংক দিয়ে প্রোডাক্ট জমা'],
      ]) +
      button('প্রোডাক্ট জমা দিন', link) +
      signoff(),
    footnote: 'এই লিংকটি শুধু আপনার জন্য, কারও সাথে শেয়ার করবেন না। ২৭ নভেম্বর রাত ১০টার পর এটি আর কাজ করবে না।',
  });
}

function declineEmail(name, productName) {
  return layout({
    preheader: 'আইডিয়া যাচাইয়ের ফলাফল',
    eyebrow: 'আইডিয়া আপডেট',
    title: `প্রিয় ${esc(name)}`,
    body:
      p(`<strong>${esc(productName)}</strong> আইডিয়াটি এইবারের জন্য নির্বাচিত হয়নি। অংশ নিতে আগ্রহ দেখানোর জন্য ধন্যবাদ।`) +
      p(`পরবর্তী ইভেন্টের খবর পেতে <a href="${socialLinks.facebook}" style="color:#2f5bea;">${esc(event.organizer)}-এর ফেসবুক পেজ</a> ফলো করুন।`) +
      signoff(),
  });
}

export async function POST(req) {
  if (!isAdminSession(getCookieValue(req.headers.get('cookie'), 'onnopoth_admin'))) {
    return Response.json({ error: 'অনুমোদন প্রয়োজন।' }, { status: 401 });
  }

  try {
    const { email, name, productName, decision } = await req.json();
    if (!email || !productName || !['approve', 'decline'].includes(decision)) {
      return Response.json({ error: 'অনুরোধটি সঠিক নয়।' }, { status: 400 });
    }

    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return Response.json({ error: 'ইমেইল সেটআপ করা নেই।' }, { status: 500 });
    }

    const smtpHost = process.env.SMTP_HOST;
    const transporter = smtpHost
      ? nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT || 1025),
          secure: false,
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        })
      : nodemailer.createTransport({
          service: 'gmail',
          auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
        });

    const approved = decision === 'approve';
    const subject = approved
      ? `আপনার আইডিয়া অ্যাপ্রুভ হয়েছে – ${productName}`
      : `আইডিয়া আপডেট – ${productName}`;

    const mail = {
      from: `"${event.shortName}" <${GMAIL_USER}>`,
      to: email,
      subject,
      html: approved
        ? approvalEmail(
            name,
            productName,
            `${socialLinks.siteUrl}/submit?token=${encodeURIComponent(createApprovalToken(email, productName))}`
          )
        : declineEmail(name, productName),
    };

    await transporter.sendMail({
      ...mail,
      attachments: [
        {
          filename: 'onnopoth-competition.ics',
          content: eventIcs(),
          contentType: 'text/calendar',
        },
      ],
    });

    // Keep a machine-readable decision record in the organizer's own inbox so
    // the status checker and confirmed list can query it later.
    await transporter.sendMail({
      from: `"${event.shortName}" <${GMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL || GMAIL_USER,
      subject: `Decision recorded: ${decision} – ${productName}`,
      headers: {
        'X-OnnoPoth-Approval': Buffer.from(
          JSON.stringify({
            email,
            name,
            productName,
            decision,
            decidedAt: new Date().toISOString(),
          })
        ).toString('base64'),
      },
      text: `Decision recorded: ${decision}\nName: ${name}\nEmail: ${email}\nProduct: ${productName}`,
    });

    clearRecordsCache();
    return Response.json({ ok: true, decision });
  } catch (error) {
    console.error('Admin decision failed:', error.message);
    return Response.json({ error: 'ইমেইল পাঠানো যায়নি।' }, { status: 500 });
  }
}
