'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

// ---------------------------------------------------------------- API

export class AuthError extends Error {
  name = 'AuthError';
}

/** JSON request to an admin route. Throws AuthError on 401, Error(message) otherwise. */
export async function api(path, body) {
  const res = await fetch(path, body === undefined
    ? { cache: 'no-store' }
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new AuthError(data.error || 'Unauthorized');
  if (!res.ok) throw new Error(data.error || 'কিছু একটা সমস্যা হয়েছে।');
  return data;
}

// ---------------------------------------------------------------- formatting

const TZ = 'Asia/Dhaka';
const num = new Intl.NumberFormat('bn-BD');
const rel = new Intl.RelativeTimeFormat('bn', { numeric: 'auto' });

export const n = (v) => num.format(v ?? 0);

export function dateTime(v) {
  if (!v) return '';
  return new Date(v).toLocaleString('bn-BD', { timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function ago(v) {
  if (!v) return '';
  const s = (new Date(v).getTime() - Date.now()) / 1000;
  const abs = Math.abs(s);
  if (abs < 60) return 'এইমাত্র';
  if (abs < 3600) return rel.format(Math.round(s / 60), 'minute');
  if (abs < 86400) return rel.format(Math.round(s / 3600), 'hour');
  return rel.format(Math.round(s / 86400), 'day');
}

// ---------------------------------------------------------------- badges

const STATUS = {
  pending: { label: 'অপেক্ষমাণ', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  approved: { label: 'অ্যাপ্রুভড', cls: 'bg-green-50 text-green-800 ring-green-200' },
  declined: { label: 'ডিক্লাইনড', cls: 'bg-red-50 text-red-700 ring-red-200' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.cls}`}>{s.label}</span>;
}

const MAIL = {
  sent: { label: 'ইমেইল গেছে', cls: 'text-green-700' },
  failed: { label: 'ইমেইল ব্যর্থ', cls: 'text-red-700' },
  skipped: { label: 'ইমেইল যায়নি', cls: 'text-amber-800' },
};

export function MailStatus({ status, className = '' }) {
  const m = MAIL[status];
  if (!m) return null;
  return <span className={`text-xs font-medium ${m.cls} ${className}`}>{m.label}</span>;
}

export function Kbd({ children }) {
  return <kbd className="rounded border border-line-strong bg-surface px-1.5 py-px font-mono text-[11px] text-ink-2 shadow-[0_1px_0_#cfccc3]">{children}</kbd>;
}

// ---------------------------------------------------------------- dialog

/**
 * Native <dialog> confirm. `open` toggles showModal/close; Esc and the
 * backdrop cancel. Children render inside the body.
 */
export function Dialog({ open, title, children, confirmLabel, tone = 'primary', busy, onConfirm, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="w-[min(92vw,460px)] rounded-2xl border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-ink/30 backdrop:backdrop-blur-[2px]"
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm();
        }}
        className="p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="বন্ধ করুন" className="-m-1 rounded-md p-1 text-ink-3 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 text-[15px] text-ink-2">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary !py-2.5 !text-sm">বাতিল</button>
          <button type="submit" disabled={busy} autoFocus className={`${tone === 'danger' ? 'btn bg-red-600 text-white hover:bg-red-700' : 'btn-primary'} !py-2.5 !text-sm`}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}

// ---------------------------------------------------------------- toasts

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (message, { tone = 'info', action, duration = 6000 } = {}) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, message, tone, action }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`rise pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-lift ${
              t.tone === 'error' ? 'bg-red-700 text-white' : 'bg-ink text-white'
            }`}
          >
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action.onClick();
                  dismiss(t.id);
                }}
                className="shrink-0 font-semibold text-[#9fb6ff] hover:text-white"
              >
                {t.action.label}
              </button>
            )}
            <button type="button" onClick={() => dismiss(t.id)} aria-label="বন্ধ করুন" className="shrink-0 text-white/60 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Copy text, falling back to a prompt where the clipboard API is blocked. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.prompt('কপি করুন:', text);
    return false;
  }
}
