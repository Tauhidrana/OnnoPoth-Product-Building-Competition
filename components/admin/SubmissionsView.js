'use client';

import { useState } from 'react';
import { Code2, Copy, ExternalLink, Loader2, MessageCircle, PlayCircle } from 'lucide-react';
import { api, ago, copyText, n, useToast } from './ui';


export default function SubmissionsView({ submissions, registrations, onChange, onBuildResults }) {
  const toast = useToast();
  const approved = registrations.filter((r) => r.status === 'approved');
  const missing = approved.filter((r) => !r.submissionId);
  const scored = submissions.filter((s) => s.score != null).length;

  async function copyLink(r) {
    try {
      const { link } = await api('/api/admin/link', { id: r.id });
      await copyText(link);
      toast(`${r.teamName || r.fullName}-এর সাবমিশন লিংক কপি হয়েছে`);
    } catch (e) {
      toast(e.message, { tone: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          অ্যাপ্রুভড {n(approved.length)} টিমের মধ্যে <strong className="text-ink">{n(submissions.length)}</strong> টি জমা দিয়েছে · নম্বর দেওয়া হয়েছে {n(scored)}/{n(submissions.length)}
        </p>
        <div className="flex gap-2">
          <a href="/api/admin/export?type=submissions" className="btn-secondary !px-3.5 !py-2 !text-sm">CSV ডাউনলোড</a>
          <button onClick={onBuildResults} disabled={!scored} className="btn-primary !px-3.5 !py-2 !text-sm">নম্বর থেকে ফলাফল তৈরি করুন</button>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <p className="font-semibold">এখনো কোনো সাবমিশন আসেনি</p>
          <p className="mt-1 text-sm text-ink-3">২৭ নভেম্বর রাত ১০টা পর্যন্ত অ্যাপ্রুভড টিমগুলো তাদের লিংক দিয়ে জমা দিতে পারবে।</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {submissions.map((s) => <SubmissionRow key={s.id} s={s} onSaved={onChange} />)}
        </ul>
      )}

      {missing.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h3 className="font-semibold">জমা দেয়নি ({n(missing.length)})</h3>
          <p className="mt-1 text-sm text-ink-3">লিংক কপি করে WhatsApp-এ পাঠাতে পারেন।</p>
          <ul className="mt-4 divide-y divide-line">
            {missing.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.productName}</p>
                  <p className="truncate text-sm text-ink-3">{r.teamName || r.fullName} · {r.whatsapp}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`https://wa.me/88${r.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-3 !py-1.5 !text-xs">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                  <button onClick={() => copyLink(r)} className="btn-secondary !px-3 !py-1.5 !text-xs">
                    <Copy className="h-3.5 w-3.5" /> লিংক কপি
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SubmissionRow({ s, onSaved }) {
  const toast = useToast();
  const [score, setScore] = useState(s.score ?? '');
  const [notes, setNotes] = useState(s.judgeNotes ?? '');
  const [saving, setSaving] = useState(false);
  const dirty = String(score) !== String(s.score ?? '') || notes !== (s.judgeNotes ?? '');

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/api/admin/score', { submissionId: s.id, score: score === '' ? null : Number(score), notes });
      await onSaved();
      toast(`${s.productName} — নম্বর সংরক্ষিত`);
    } catch (err) {
      toast(err.message, { tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="card p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold">{s.productName}</h3>
            <span className="text-xs text-ink-3">{s.updatedAt && s.updatedAt !== s.createdAt ? `আপডেট ${ago(s.updatedAt)}` : `জমা ${ago(s.createdAt)}`} </span>
          </div>
          <p className="text-sm text-ink-3">{s.name} · {s.institution}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={s.liveUrl} target="_blank" rel="noopener noreferrer" className="chip hover:border-ink-4"><ExternalLink className="h-3.5 w-3.5" /> {s.liveUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>
            {s.githubUrl && <a href={s.githubUrl} target="_blank" rel="noopener noreferrer" className="chip hover:border-ink-4"><Code2 className="h-3.5 w-3.5" /> GitHub</a>}
            {s.demoUrl && <a href={s.demoUrl} target="_blank" rel="noopener noreferrer" className="chip hover:border-ink-4"><PlayCircle className="h-3.5 w-3.5" /> ডেমো</a>}
          </div>
          {s.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{s.description}</p>}
          {s.aiTools && <p className="mt-2 whitespace-pre-wrap text-sm text-ink-3"><span className="font-medium text-ink-2">AI ব্যবহার:</span> {s.aiTools}</p>}
        </div>
        <form onSubmit={save} className="space-y-2 rounded-xl bg-paper p-3">
          <div className="flex items-center gap-2">
            <label htmlFor={`score-${s.id}`} className="text-sm font-medium">নম্বর</label>
            <input
              id={`score-${s.id}`}
              type="number"
              min={0}
              max={100}
              inputMode="numeric"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="field-input !w-24 !py-2 !text-sm"
              placeholder="০–১০০"
            />
            <span className="text-sm text-ink-3">/ ১০০</span>
          </div>
          <label htmlFor={`notes-${s.id}`} className="sr-only">নোট</label>
          <textarea id={`notes-${s.id}`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="field-input !py-2 !text-sm" placeholder="বিচারকের নোট (শুধু আয়োজকরা দেখবেন)" />
          <button type="submit" disabled={!dirty || saving} className="btn-primary w-full !py-2 !text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'সংরক্ষণ'}
          </button>
        </form>
      </div>
    </li>
  );
}

/** Top scored submissions → result rows (used by the results builder). */
export function rowsFromScores(submissions, count = 3) {
  const PLACES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  return submissions
    .filter((s) => s.score != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s, i) => ({ place: PLACES[i], name: s.name, email: s.email, product: s.productName, institution: s.institution || '', marks: s.score, registrationId: s.registrationId }));
}

