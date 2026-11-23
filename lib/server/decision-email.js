import { sendEmail } from '../mailer.js';
import { approval, decline } from '../email-templates.js';
import { submitLink } from '../admin.js';
import { socialLinks } from '../config.js';
import { eventIcs } from '../calendar.js';

/** Email the participant about their current decision. Returns the mail status. */
export async function sendDecisionEmail(registration) {
  if (registration.status === 'approved') {
    return sendEmail({
      kind: 'approval',
      to: registration.email,
      registrationId: registration.id,
      attachments: [{ filename: 'onnopoth-competition.ics', content: eventIcs(), contentType: 'text/calendar' }],
      ...approval(registration, submitLink(registration, socialLinks.siteUrl)),
    });
  }
  if (registration.status === 'declined') {
    return sendEmail({ kind: 'decline', to: registration.email, registrationId: registration.id, ...decline(registration) });
  }
  return { status: 'skipped', error: 'No decision to send' };
}
