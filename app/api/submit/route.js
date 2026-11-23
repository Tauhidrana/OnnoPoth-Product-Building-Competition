/**
 * POST /api/submit { token, liveUrl, description? } — final submission: the
 * live project URL and an optional short description. Only works with a
 * valid approval link for an approved registration; resubmitting before the
 * deadline replaces the earlier one. Sends the participant a confirmation.
 */
import { isSubmissionOpen } from '@/lib/config';
import { validateSubmission } from '@/lib/validation';
import { upsertSubmission } from '@/lib/repo';
import { approvedRegistrationFromToken } from '@/lib/server/approval';
import { hit, clientIp } from '@/lib/rate-limit';
import { sendEmail, organizerInbox } from '@/lib/mailer';
import { submissionOrganizer, submissionConfirmation } from '@/lib/email-templates';

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
  if (typeof body?.website === 'string' && body.website.trim()) return Response.json({ ok: true });

  try {
    const registration = await approvedRegistrationFromToken(body?.token);
    if (!registration) return fail('আপনার আইডিয়া এখনো অ্যাপ্রুভ হয়নি বা লিংকটি সঠিক নয়।', 403);
    if (!isSubmissionOpen()) return fail('জমা দেওয়ার সময় শেষ হয়ে গেছে।', 403);

    const { data, errors } = validateSubmission(body);
    if (Object.keys(errors).length) return fail('অনুগ্রহ করে সব ঘর সঠিকভাবে পূরণ করুন।', 400, errors);

    if (await hit('submit', clientIp(req), { limit: 10, windowMs: 10 * 60 * 1000 })) {
      return fail('অনেকগুলো চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।', 429);
    }

    const submission = await upsertSubmission(registration, data);

    const inbox = organizerInbox();
    if (inbox) await sendEmail({ kind: 'submission-organizer', to: inbox, replyTo: registration.email, registrationId: registration.id, ...submissionOrganizer(submission) });
    const confirmation = await sendEmail({ kind: 'submission-confirmation', to: registration.email, registrationId: registration.id, ...submissionConfirmation(submission) });

    return Response.json({ ok: true, updated: submission.updated, emailed: confirmation.status === 'sent' });
  } catch (error) {
    console.error('Submission failed:', error);
    return fail('কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।', 500);
  }
}
