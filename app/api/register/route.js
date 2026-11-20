/**
 * POST /api/register — validate, store in Supabase, then email.
 * The registration is saved even when email isn't configured yet; email
 * attempts are logged so the organizer can see and resend them.
 */
import { isRegistrationOpen } from '@/lib/config';
import { validateRegistration } from '@/lib/validation';
import { createRegistration, DuplicateRegistrationError } from '@/lib/repo';
import { hit, clientIp } from '@/lib/rate-limit';
import { sendEmail, organizerInbox } from '@/lib/mailer';
import { registrationOrganizer, registrationConfirmation } from '@/lib/email-templates';
import { eventIcs } from '@/lib/calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (error, status, fields) => Response.json(fields ? { error, fields } : { error }, { status });

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return fail('অনুরোধটি পড়া যায়নি।', 400);
  }

  // Honeypot: bots fill every field. Pretend success, store nothing.
  if (typeof body?.website === 'string' && body.website.trim()) return Response.json({ ok: true, emailed: false });

  if (!isRegistrationOpen()) return fail('রেজিস্ট্রেশনের সময় শেষ হয়ে গেছে।', 403);

  const { data, errors } = validateRegistration(body);
  if (Object.keys(errors).length) return fail('অনুগ্রহ করে সব ঘর সঠিকভাবে পূরণ করুন।', 400, errors);

  try {
    if (await hit('register', clientIp(req), { limit: 5, windowMs: 10 * 60 * 1000 })) {
      return fail('অনেকগুলো চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।', 429);
    }

    const registration = await createRegistration(data);

    const inbox = organizerInbox();
    if (inbox) {
      await sendEmail({ kind: 'registration-organizer', to: inbox, replyTo: registration.email, registrationId: registration.id, ...registrationOrganizer(registration) });
    }
    const confirmation = await sendEmail({
      kind: 'registration-confirmation',
      to: registration.email,
      registrationId: registration.id,
      attachments: [{ filename: 'onnopoth-competition.ics', content: eventIcs(), contentType: 'text/calendar' }],
      ...registrationConfirmation(registration),
    });

    return Response.json({ ok: true, emailed: confirmation.status === 'sent' });
  } catch (error) {
    if (error instanceof DuplicateRegistrationError) {
      return fail('এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে।', 409, { email: 'এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে। স্ট্যাটাস পেজে দেখে নাও।' });
    }
    console.error('Registration failed:', error);
    return fail('কিছু একটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', 500);
  }
}
