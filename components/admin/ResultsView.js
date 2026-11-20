'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { api, dateTime, Dialog, n, useToast } from './ui';
import { rowsFromScores } from './SubmissionsView';

const PLACES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const blank = (i) => ({ place: PLACES[i] || `${i + 1}`, name: '', email: '', product: '', institution: '', marks: '', registrationId: null });
const fromPublished = (r) => ({ place: r.place, name: r.name, email: r.email, product: r.product, institution: r.institution || '', marks: r.marks ?? '', registrationId: r.registrationId });

export default function ResultsView({ results, submissions, emailConfigured, onChange, seed }) {
  const toast = useToast();
  const [rows, setRows] = useState(() => (results.length ? results.map(fromPublished) : rowsFromScores(submissions, 3)));
  const [confirm, setConfirm] = useState(null); // 'publish' | 'unpublish'
  const [busy, setBusy] = useState(false);

  // "Build from scores" on the submissions tab hands us fresh rows.
  useEffect(() => {
    if (seed) setRows(seed);
  }, [seed]);

  const set = (i, key, value) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  const swap = (i, j) => setRows((rs) => {
    const next = [...rs];
    [next[i], next[j]] = [next[j], next[i]];
    return next.map((r, k) => ({ ...r, place: PLACES.includes(r.place) ? PLACES[k] : r.place }));
  });

  const filled = rows.filter((r) => r.name || r.email || r.product);
  const willEmail = filled.filter((r, i) => {
    const prev = results.find((p) => p.rank === i + 1);
    return !(prev && prev.emailedAt && prev.email === r.email.trim().toLowerCase() && prev.place === r.place && prev.product === r.product);
  }).length;

  async function run() {
    setBusy(true);
    try {
      const winners = confirm === 'unpublish' ? [] : filled.map((r) => ({ ...r, marks: r.marks === '' ? null : Number(r.marks) }));
      const res = await api('/api/admin/results', { winners });
      await onChange();
      setConfirm(null);
      toast(
        confirm === 'unpublish'
          ? 'ফলাফল সরিয়ে নেওয়া হয়েছে'
          : `${n(res.published)}টি স্থান প্রকাশিত${res.sent ? ` · ${n(res.sent)}টি ইমেইল গেছে` : ''}${res.skipped ? ` · ${n(res.skipped)}টি ইমেইল বাকি` : ''}${res.failed ? ` · ${n(res.failed)}টি ব্যর্থ` : ''}`,
        { tone: res.failed ? 'error' : 'info' }
      );
    } catch (e) {
      toast(e.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">ফলাফল তৈরি করুন</h3>
            <p className="text-sm text-ink-3">সর্বোচ্চ ১০টি স্থান। প্রকাশের পর বিজয়ীরা ইমেইল পাবে, /results পেজে দেখা যাবে।</p>
          </div>
          <button
            onClick={() => setRows(rowsFromScores(submissions, Math.max(3, filled.length)))}
            disabled={!submissions.some((s) => s.score != null)}
            className="btn-secondary !px-3.5 !py-2 !text-sm"
          >
            নম্বর থেকে পূরণ
          </button>
        </div>

        <ol className="mt-5 space-y-3">
          {rows.map((r, i) => (
            <li key={i} className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white">{i + 1}</span>
                <input aria-label="স্থান" value={r.place} onChange={(e) => set(i, 'place', e.target.value)} className="field-input !w-20 !py-1.5 !text-sm" />
                <input aria-label="নম্বর" type="number" min={0} max={100} value={r.marks} onChange={(e) => set(i, 'marks', e.target.value)} placeholder="নম্বর" className="field-input !w-24 !py-1.5 !text-sm" />
                <div className="ml-auto flex">
                  <button onClick={() => i > 0 && swap(i, i - 1)} disabled={i === 0} aria-label="উপরে" className="rounded p-1.5 text-ink-3 hover:text-ink disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => i < rows.length - 1 && swap(i, i + 1)} disabled={i === rows.length - 1} aria-label="নিচে" className="rounded p-1.5 text-ink-3 hover:text-ink disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="সরান" className="rounded p-1.5 text-ink-3 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input aria-label="নাম / টিম" value={r.name} onChange={(e) => set(i, 'name', e.target.value)} placeholder="নাম / টিম" className="field-input !py-2 !text-sm" />
                <input aria-label="প্রোডাক্ট" value={r.product} onChange={(e) => set(i, 'product', e.target.value)} placeholder="প্রোডাক্ট" className="field-input !py-2 !text-sm" />
                <input aria-label="ইমেইল" type="email" value={r.email} onChange={(e) => set(i, 'email', e.target.value)} placeholder="ইমেইল" className="field-input !py-2 !text-sm" />
                <input aria-label="প্রতিষ্ঠান" value={r.institution} onChange={(e) => set(i, 'institution', e.target.value)} placeholder="প্রতিষ্ঠান" className="field-input !py-2 !text-sm" />
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <button onClick={() => setRows((rs) => [...rs, blank(rs.length)])} disabled={rows.length >= 10} className="btn-secondary !px-3.5 !py-2 !text-sm">
            <Plus className="h-4 w-4" /> সারি যোগ করুন
          </button>
          <button onClick={() => setConfirm('publish')} disabled={!filled.length} className="btn-primary !py-2.5 !text-sm">
            ফলাফল প্রকাশ করুন
          </button>
        </div>
      </section>

      <aside className="card h-fit p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">প্রকাশিত ফলাফল</h3>
          <a href="/results" target="_blank" className="inline-flex items-center gap-1 text-sm text-brand">দেখুন <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
        {results.length ? (
          <>
            <ul className="mt-4 divide-y divide-line">
              {results.map((r) => (
                <li key={r.rank} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.place} · {r.name}</p>
                    <p className="truncate text-ink-3">{r.product}{r.marks != null ? ` · ${n(r.marks)}` : ''}</p>
                  </div>
                  <span className={`shrink-0 text-xs ${r.emailedAt ? 'text-green-700' : 'text-amber-800'}`}>{r.emailedAt ? 'ইমেইল গেছে' : 'ইমেইল বাকি'}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-3">প্রকাশিত {dateTime(results[0].publishedAt)}</p>
            <button onClick={() => setConfirm('unpublish')} className="btn-secondary mt-4 w-full !py-2 !text-sm hover:!border-red-300 hover:!text-red-700">ফলাফল সরিয়ে নিন</button>
          </>
        ) : (
          <p className="mt-3 text-sm text-ink-3">এখনো প্রকাশ করা হয়নি। /results পেজে “ফলাফলের অপেক্ষায়” দেখাচ্ছে।</p>
        )}
      </aside>

      <Dialog
        open={!!confirm}
        title={confirm === 'unpublish' ? 'ফলাফল সরিয়ে নেবেন?' : 'ফলাফল প্রকাশ করবেন?'}
        confirmLabel={confirm === 'unpublish' ? 'সরিয়ে নিন' : 'প্রকাশ করুন'}
        tone={confirm === 'unpublish' ? 'danger' : 'primary'}
        busy={busy}
        onConfirm={run}
        onClose={() => !busy && setConfirm(null)}
      >
        {confirm === 'unpublish' ? (
          '/results পেজ আবার “ফলাফলের অপেক্ষায়” দেখাবে। কাউকে ইমেইল যাবে না।'
        ) : (
          <>
            <ol className="mb-3 space-y-1 text-sm">
              {filled.map((r, i) => <li key={i}><strong className="text-ink">{r.place}</strong> — {r.name} ({r.product})</li>)}
            </ol>
            {emailConfigured
              ? willEmail ? `${n(willEmail)} জন বিজয়ী ইমেইল পাবে। আগে যারা একই ফলাফলের ইমেইল পেয়েছে, তারা আবার পাবে না।` : 'নতুন কাউকে ইমেইল যাবে না (সবাই আগেই পেয়েছে)।'
              : 'ইমেইল সেটআপ হয়নি — ফলাফল প্রকাশ হবে, ইমেইল পরে আবার প্রকাশ করলে যাবে।'}
          </>
        )}
      </Dialog>
    </div>
  );
}
