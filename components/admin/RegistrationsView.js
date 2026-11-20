'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bell, Check, Copy, ExternalLink, Mail, MessageCircle, RotateCcw, Search, Send, Users, X } from 'lucide-react';
import { api, ago, copyText, dateTime, Dialog, Kbd, MailStatus, n, StatusBadge, useToast } from './ui';

const FILTERS = [
  { id: 'pending', label: 'অপেক্ষমাণ' },
  { id: 'approved', label: 'অ্যাপ্রুভড' },
  { id: 'declined', label: 'ডিক্লাইনড' },
  { id: 'all', label: 'সব' },
];

const matches = (r, q) =>
  !q || [r.fullName, r.teamName, r.productName, r.institution, r.email, r.whatsapp, ...(r.members || [])].some((v) => v?.toLowerCase().includes(q));

export default function RegistrationsView({ data, emailConfigured, onChange, onAuthLost, initialFilter = 'pending' }) {
  const toast = useToast();
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // { decision, registration }
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [remindOpen, setRemindOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => setFilter(initialFilter), [initialFilter]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, declined: 0, all: data.length };
    data.forEach((r) => (c[r.status] += 1));
    return c;
  }, [data]);

  const q = query.trim().toLowerCase();
  const list = useMemo(() => data.filter((r) => (filter === 'all' || r.status === filter) && matches(r, q)), [data, filter, q]);
  const selected = data.find((r) => r.id === selectedId) || list[0] || null;
  const index = selected ? list.findIndex((r) => r.id === selected.id) : -1;

  const select = (r) => {
    setSelectedId(r?.id ?? null);
    if (r) setMobileOpen(true);
  };
  const move = (step) => {
    if (!list.length) return;
    const next = list[Math.min(list.length - 1, Math.max(0, index + step))];
    setSelectedId(next.id);
    document.getElementById(`reg-${next.id}`)?.scrollIntoView({ block: 'nearest' });
  };

  function openConfirm(decision, registration = selected) {
    if (!registration) return;
    setNote(registration.decisionNote || '');
    setNotify(true);
    setConfirm({ decision, registration });
  }

  async function runDecision(registration, decision, { note: n2 = '', notify: notify2 = true, quiet = false } = {}) {
    const res = await api('/api/admin/decision', { id: registration.id, decision, note: n2, notify: notify2 });
    await onChange();
    if (quiet) return res;
    const who = registration.teamName || registration.fullName;
    const mail = res.email?.status;
    const label = decision === 'approved' ? 'অ্যাপ্রুভ করা হয়েছে' : decision === 'declined' ? 'ডিক্লাইন করা হয়েছে' : 'অপেক্ষমাণে ফেরানো হয়েছে';
    const mailText = decision === 'pending' ? '' : mail === 'sent' ? ' · ইমেইল গেছে' : mail === 'failed' ? ' · ইমেইল ব্যর্থ' : notify2 ? ' · ইমেইল পরে পাঠাতে হবে' : '';
    toast(`${who} — ${label}${mailText}`, {
      tone: mail === 'failed' ? 'error' : 'info',
      action: decision !== 'pending' ? { label: 'আগের অবস্থায় ফেরান', onClick: () => runDecision(registration, res.previousStatus, { notify: false, note: registration.decisionNote || '' }).catch((e) => toast(e.message, { tone: 'error' })) } : undefined,
    });
    return res;
  }

  async function confirmDecision() {
    const { decision, registration } = confirm;
    setBusy(true);
    try {
      // Move to the next item in the current list before it re-filters.
      const nextId = list[index + 1]?.id ?? list[index - 1]?.id ?? null;
      await runDecision(registration, decision, { note, notify });
      setConfirm(null);
      if (filter === 'pending') setSelectedId(nextId);
    } catch (e) {
      if (e.name === 'AuthError') onAuthLost();
      toast(e.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function resend(r) {
    try {
      const res = await api('/api/admin/resend', { id: r.id });
      await onChange();
      toast(res.sent ? 'ইমেইল পাঠানো হয়েছে' : res.failed ? 'ইমেইল পাঠানো যায়নি' : 'ইমেইল সেটআপ এখনো বাকি', { tone: res.failed ? 'error' : 'info' });
    } catch (e) {
      toast(e.message, { tone: 'error' });
    }
  }

  async function copyLink(r) {
    try {
      const { link } = await api('/api/admin/link', { id: r.id });
      await copyText(link);
      toast('সাবমিশন লিংক কপি হয়েছে — WhatsApp বা ইমেইলে পাঠাতে পারেন');
    } catch (e) {
      toast(e.message, { tone: 'error' });
    }
  }

  async function sendReminders() {
    setBusy(true);
    try {
      const res = await api('/api/admin/remind', {});
      await onChange();
      setRemindOpen(false);
      toast(res.total ? `${n(res.sent)} জনকে রিমাইন্ডার গেছে${res.skipped ? ` · ${n(res.skipped)}টি পাঠানো যায়নি (ইমেইল সেটআপ বাকি)` : ''}${res.failed ? ` · ${n(res.failed)}টি ব্যর্থ` : ''}` : 'সবাইকে গত ২৪ ঘণ্টায় মনে করানো হয়েছে');
    } catch (e) {
      toast(e.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  // Keyboard workflow: j/k move, a approve, d decline, / search.
  useEffect(() => {
    function onKey(e) {
      if (confirm || remindOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && typing) {
        document.activeElement.blur();
      } else if (!typing && (e.key === 'j' || e.key === 'ArrowDown')) {
        e.preventDefault();
        move(1);
      } else if (!typing && (e.key === 'k' || e.key === 'ArrowUp')) {
        e.preventDefault();
        move(-1);
      } else if (!typing && selected && e.key === 'a' && selected.status !== 'approved') {
        openConfirm('approved');
      } else if (!typing && selected && e.key === 'd' && selected.status !== 'declined') {
        openConfirm('declined');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pendingCount = counts.pending;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="স্ট্যাটাস ফিল্টার" className="flex gap-1 overflow-x-auto rounded-xl bg-sunken p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                setSelectedId(null);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f.id ? 'bg-surface text-ink shadow-card' : 'text-ink-3 hover:text-ink'
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${filter === f.id ? 'bg-sunken text-ink-2' : 'text-ink-4'}`}>{n(counts[f.id])}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label className="relative flex-1 lg:w-72 lg:flex-none">
            <span className="sr-only">খুঁজুন</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="নাম, প্রোডাক্ট, প্রতিষ্ঠান, ইমেইল…"
              className="field-input !py-2 !pl-9 !text-sm"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 lg:block"><Kbd>/</Kbd></span>
          </label>
          {pendingCount > 0 && (
            <button onClick={() => setRemindOpen(true)} className="btn-secondary shrink-0 !px-3.5 !py-2 !text-sm" title="অপেক্ষমাণ সবাইকে রিমাইন্ডার">
              <Bell className="h-4 w-4" /> <span className="hidden sm:inline">রিমাইন্ডার</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* List */}
        <div className="card flex flex-col overflow-hidden lg:sticky lg:top-20 lg:self-start">
          {list.length === 0 ? (
            <div className="flex-1 px-6 py-16 text-center">
              <p className="font-semibold text-ink">{q ? 'কিছু পাওয়া যায়নি' : filter === 'pending' ? 'রিভিউ করার মতো কিছু বাকি নেই' : 'এখানে এখনো কিছু নেই'}</p>
              <p className="mt-1 text-sm text-ink-3">{q ? 'অন্য শব্দ দিয়ে খুঁজে দেখুন।' : filter === 'pending' ? 'নতুন রেজিস্ট্রেশন এলে এখানে দেখা যাবে।' : ''}</p>
            </div>
          ) : (
            <ul className="max-h-[calc(100vh-220px)] min-h-[240px] flex-1 divide-y divide-line overflow-y-auto" aria-label="রেজিস্ট্রেশন তালিকা">
              {list.map((r) => {
                const active = selected?.id === r.id;
                const mailIssue = r.status !== 'pending' && r.decisionEmail && r.decisionEmail.status !== 'sent';
                return (
                  <li key={r.id} id={`reg-${r.id}`}>
                    <button
                      onClick={() => select(r)}
                      aria-current={active ? 'true' : undefined}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${active ? 'bg-brand-soft/60' : 'hover:bg-paper'}`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${active ? 'bg-brand' : 'bg-transparent'}`} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold text-ink">{r.productName}</span>
                          <span className="shrink-0 text-xs text-ink-4">{ago(r.createdAt)}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-ink-3">
                          {r.registrationType === 'team' && <Users className="h-3.5 w-3.5 shrink-0" />}
                          <span className="truncate">{r.teamName || r.fullName} · {r.institution}</span>
                        </span>
                        {(filter === 'all' || mailIssue) && (
                          <span className="mt-1.5 flex items-center gap-2">
                            {filter === 'all' && <StatusBadge status={r.status} />}
                            {mailIssue && <MailStatus status={r.decisionEmail.status} />}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="hidden items-center gap-3 border-t border-line bg-paper px-4 py-2 text-xs text-ink-3 lg:flex">
            <span><Kbd>j</Kbd> <Kbd>k</Kbd> সরান</span>
            <span><Kbd>a</Kbd> অ্যাপ্রুভ</span>
            <span><Kbd>d</Kbd> ডিক্লাইন</span>
          </p>
        </div>

        {/* Detail: side panel on desktop, full-screen sheet on phones */}
        <div className={`${mobileOpen && selected ? 'fixed inset-0 z-40 overflow-y-auto bg-paper p-4' : 'hidden'} lg:static lg:block lg:p-0`}>
          {selected ? (
            <Detail
              r={selected}
              emailConfigured={emailConfigured}
              onBack={() => setMobileOpen(false)}
              onDecide={openConfirm}
              onResend={resend}
              onCopyLink={copyLink}
            />
          ) : (
            <div className="card hidden h-full place-items-center p-10 text-sm text-ink-3 lg:grid">বাঁ দিক থেকে একটি রেজিস্ট্রেশন বেছে নিন</div>
          )}
        </div>
      </div>

      <Dialog
        open={!!confirm}
        title={confirm?.decision === 'approved' ? 'অ্যাপ্রুভ করবেন?' : confirm?.decision === 'declined' ? 'ডিক্লাইন করবেন?' : 'অপেক্ষমাণে ফেরাবেন?'}
        confirmLabel={confirm?.decision === 'approved' ? 'অ্যাপ্রুভ করুন' : confirm?.decision === 'declined' ? 'ডিক্লাইন করুন' : 'ফেরান'}
        tone={confirm?.decision === 'declined' ? 'danger' : 'primary'}
        busy={busy}
        onConfirm={confirmDecision}
        onClose={() => !busy && setConfirm(null)}
      >
        {confirm && (
          <>
            <p>
              <strong className="text-ink">{confirm.registration.productName}</strong> — {confirm.registration.teamName || confirm.registration.fullName}
            </p>
            {confirm.decision !== 'pending' && (
              <>
                <label className="field-label mt-4" htmlFor="decision-note">নোট (ঐচ্ছিক, ইমেইলে যাবে)</label>
                <textarea id="decision-note" rows={2} className="field-input !text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder={confirm.decision === 'approved' ? 'যেমন: স্কোপ ছোট রাখো, লগইন বাদ দিলেও চলবে' : 'যেমন: ১২ ঘণ্টায় বানানো কঠিন'} />
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-brand" />
                  প্রতিযোগীকে ইমেইলে জানান
                </label>
                {notify && !emailConfigured && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">ইমেইল এখনো সেটআপ হয়নি — সিদ্ধান্ত সংরক্ষিত হবে, ইমেইল পরে “বাকি ইমেইল পাঠান” থেকে পাঠানো যাবে।</p>
                )}
              </>
            )}
          </>
        )}
      </Dialog>

      <Dialog
        open={remindOpen}
        title="রিমাইন্ডার পাঠাবেন?"
        confirmLabel="পাঠান"
        busy={busy}
        onConfirm={sendReminders}
        onClose={() => !busy && setRemindOpen(false)}
      >
        অপেক্ষমাণ {n(pendingCount)} জনের মধ্যে যাদের গত ২৪ ঘণ্টায় মনে করানো হয়নি, তারা “আইডিয়া যাচাই চলছে” ইমেইল পাবে।
        {!emailConfigured && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">ইমেইল সেটআপ না থাকায় এখন কোনো ইমেইল যাবে না।</p>}
      </Dialog>
    </div>
  );
}

function Detail({ r, emailConfigured, onBack, onDecide, onResend, onCopyLink }) {
  const decided = r.status !== 'pending';
  const mail = r.decisionEmail;
  const wa = `https://wa.me/88${r.whatsapp}`;

  return (
    <article className="card flex h-full flex-col" aria-label={`${r.productName} — বিস্তারিত`}>
      <header className="border-b border-line p-5 sm:p-6">
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-3 lg:hidden">
          <ArrowLeft className="h-4 w-4" /> তালিকায় ফিরুন
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-ink-3">#{r.id} · {dateTime(r.createdAt)} · {r.registrationType === 'team' ? 'টিম' : 'একা'}</p>
            <h2 className="mt-1 text-2xl font-semibold leading-tight">{r.productName}</h2>
            <p className="mt-1 text-[15px] text-ink-2">
              {r.teamName ? <><strong className="font-semibold text-ink">{r.teamName}</strong> · লিডার {r.fullName}</> : r.fullName} · {r.institution}, {r.className}
            </p>
          </div>
          <StatusBadge status={r.status} />
        </div>
      </header>

      <div className="flex-1 space-y-6 p-5 sm:p-6">
        <Section title="কোন সমস্যার সমাধান">{r.problem}</Section>
        <Section title="কারা ব্যবহার করবে">{r.targetUsers}</Section>
        <Section title="প্রধান ফিচার">
          {Array.isArray(r.features) ? (
            <ol className="list-decimal space-y-1 pl-5">{r.features.map((f, i) => <li key={i}>{f}</li>)}</ol>
          ) : (
            r.features
          )}
        </Section>
        {r.members?.length > 0 && (
          <Section title="টিমের সদস্য">
            <ol className="list-decimal pl-5">{r.members.map((m) => <li key={m}>{m}</li>)}</ol>
          </Section>
        )}

        <div className="flex flex-wrap gap-2">
          <a href={`mailto:${r.email}`} className="chip hover:border-ink-4"><Mail className="h-3.5 w-3.5" /> {r.email}</a>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="chip hover:border-ink-4"><MessageCircle className="h-3.5 w-3.5" /> {r.whatsapp}</a>
          <a href={`https://github.com/${encodeURIComponent(r.github)}`} target="_blank" rel="noopener noreferrer" className="chip hover:border-ink-4">
            <ExternalLink className="h-3.5 w-3.5" /> github.com/{r.github}
          </a>
        </div>
      </div>

      <footer className="sticky bottom-0 border-t border-line bg-surface p-4 sm:p-5">
        {decided && (
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3">
            <span>{r.status === 'approved' ? 'অ্যাপ্রুভ' : 'ডিক্লাইন'} করেছেন {r.decidedBy} · {ago(r.decidedAt)}</span>
            {mail && <MailStatus status={mail.status} />}
            {!mail && <span className="text-xs">ইমেইল পাঠানো হয়নি</span>}
            {r.decisionNote && <p className="w-full text-ink-2">নোট: {r.decisionNote}</p>}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {r.status !== 'approved' && (
            <button onClick={() => onDecide('approved', r)} className="btn-primary !py-2.5 !text-sm">
              <Check className="h-4 w-4" /> অ্যাপ্রুভ <span className="hidden opacity-60 lg:inline">a</span>
            </button>
          )}
          {r.status !== 'declined' && (
            <button onClick={() => onDecide('declined', r)} className="btn-secondary !py-2.5 !text-sm hover:!border-red-300 hover:!text-red-700">
              <X className="h-4 w-4" /> ডিক্লাইন <span className="hidden opacity-60 lg:inline">d</span>
            </button>
          )}
          {r.status === 'approved' && (
            <button onClick={() => onCopyLink(r)} className="btn-secondary !py-2.5 !text-sm">
              <Copy className="h-4 w-4" /> সাবমিশন লিংক কপি
            </button>
          )}
          {decided && (!mail || mail.status !== 'sent') && emailConfigured && (
            <button onClick={() => onResend(r)} className="btn-secondary !py-2.5 !text-sm">
              <Send className="h-4 w-4" /> ইমেইল পাঠান
            </button>
          )}
          {decided && (
            <button onClick={() => onDecide('pending', r)} className="btn !px-3 !py-2.5 !text-sm text-ink-3 hover:text-ink" title="অপেক্ষমাণে ফেরান">
              <RotateCcw className="h-4 w-4" /> অপেক্ষমাণে ফেরান
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-ink-3">{title}</h3>
      <div className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}
