'use client';

import { useState } from 'react';
import { ago, dateTime, MailStatus } from './ui';

const ACTIONS = {
  'decision.approved': 'অ্যাপ্রুভ করেছেন',
  'decision.declined': 'ডিক্লাইন করেছেন',
  'decision.pending': 'অপেক্ষমাণে ফিরিয়েছেন',
  'submission.scored': 'নম্বর দিয়েছেন',
  'results.published': 'ফলাফল প্রকাশ করেছেন',
  'results.unpublished': 'ফলাফল সরিয়েছেন',
  'reminders.sent': 'রিমাইন্ডার পাঠিয়েছেন',
  'emails.resent': 'ইমেইল আবার পাঠিয়েছেন',
  'link.copied': 'সাবমিশন লিংক কপি করেছেন',
  'admin.login': 'লগইন করেছেন',
};

const KINDS = {
  'registration-confirmation': 'রেজিস্ট্রেশন কনফার্মেশন',
  'registration-organizer': 'নতুন রেজিস্ট্রেশন (আয়োজক)',
  'submission-confirmation': 'সাবমিশন কনফার্মেশন',
  'submission-organizer': 'নতুন সাবমিশন (আয়োজক)',
  approval: 'অ্যাপ্রুভাল',
  decline: 'ডিক্লাইন',
  reminder: 'রিমাইন্ডার',
  result: 'ফলাফল',
};

export default function ActivityView({ activity, emails }) {
  const [onlyIssues, setOnlyIssues] = useState(false);
  const shownEmails = onlyIssues ? emails.filter((e) => e.status !== 'sent') : emails;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-5 sm:p-6">
        <h3 className="font-semibold">অ্যাক্টিভিটি</h3>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-ink-3">এখনো কিছু হয়নি।</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-4" aria-hidden />
                <div className="min-w-0">
                  <p className="text-ink">
                    <span className="font-medium">{a.actor.split('@')[0]}</span> {ACTIONS[a.action] || a.action}
                    {a.productName && <> — <span className="font-medium">{a.productName}</span></>}
                    {a.action === 'submission.scored' && a.details?.score != null && <> ({a.details.score})</>}
                    {a.action === 'reminders.sent' && <> ({a.details?.count} জন)</>}
                  </p>
                  {a.details?.note && <p className="text-ink-3">নোট: {a.details.note}</p>}
                  <p className="text-xs text-ink-4" title={dateTime(a.createdAt)}>{ago(a.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">ইমেইল লগ</h3>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} className="h-4 w-4 accent-brand" />
            শুধু যেগুলো যায়নি
          </label>
        </div>
        {shownEmails.length === 0 ? (
          <p className="mt-3 text-sm text-ink-3">{onlyIssues ? 'সব ইমেইল পৌঁছেছে।' : 'এখনো কোনো ইমেইল পাঠানো হয়নি।'}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {shownEmails.map((e) => (
              <li key={e.id} className="py-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-medium">{KINDS[e.kind] || e.kind}</span>
                  <MailStatus status={e.status} className="shrink-0" />
                </div>
                <p className="truncate text-ink-3">{e.toEmail} · {ago(e.createdAt)}</p>
                {e.status === 'failed' && e.error && <p className="truncate text-xs text-red-700" title={e.error}>{e.error}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
