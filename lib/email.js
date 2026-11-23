/**
 * Shared HTML email layout, matching the website: warm paper background,
 * a white card, ink text and one brand blue. Table-based with inline styles
 * so it renders in Gmail, Outlook and phone mail apps (no SVG, no web fonts
 * required, no gradients).
 */
import { event, socialLinks } from './config.js';

const C = {
  paper: '#f6f5f1',
  surface: '#ffffff',
  line: '#e4e2db',
  ink: '#111418',
  ink2: '#3b4049',
  ink3: '#6a6f78',
  brand: '#2f5bea',
  navy: '#14264a',
};
const FONT = "'Noto Sans Bengali','Hind Siliguri',-apple-system,'Segoe UI',Roboto,Arial,sans-serif";

/** Escape anything user-supplied before it goes into HTML. */
export function esc(value) {
  return String(value ?? '')
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Western digits → Bangla digits (৯২). */
export const bn = (value) => String(value).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

/** A paragraph of body copy. `html` must already be escaped. */
export function p(html, { muted = false, small = false } = {}) {
  return `<p style="margin:0 0 16px;font-size:${small ? 14 : 16}px;line-height:1.75;color:${muted ? C.ink3 : C.ink2};">${html}</p>`;
}

/** The one primary action. */
export function button(label, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr>
    <td style="border-radius:999px;background:${C.ink};">
      <a href="${href}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${label} &rarr;</a>
    </td>
  </tr></table>`;
}

/** Label / value table for organizer notifications. Values must already be escaped. */
export function details(rows) {
  const body = rows
    .filter(Boolean)
    .map(
      ([label, value], i) => `<tr>
        <td style="padding:11px 16px 11px 0;width:38%;vertical-align:top;font-size:13px;color:${C.ink3};${i ? `border-top:1px solid ${C.line};` : ''}">${label}</td>
        <td style="padding:11px 0;vertical-align:top;font-size:15px;color:${C.ink};white-space:pre-wrap;word-break:break-word;${i ? `border-top:1px solid ${C.line};` : ''}">${value || '—'}</td>
      </tr>`
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 8px;">${body}</table>`;
}

/** Numbered "what happens next" list. */
export function steps(items) {
  const body = items
    .map(
      ([when, what], i) => `<tr>
        <td style="width:28px;padding:0 12px 14px 0;vertical-align:top;">
          <div style="width:24px;height:24px;line-height:24px;border-radius:12px;background:${i === 0 ? C.brand : C.paper};color:${i === 0 ? '#ffffff' : C.ink2};font-size:12px;font-weight:600;text-align:center;">${i + 1}</div>
        </td>
        <td style="padding:2px 0 14px;vertical-align:top;">
          <div style="font-size:13px;color:${C.ink3};">${when}</div>
          <div style="font-size:15px;font-weight:600;color:${C.ink};">${what}</div>
        </td>
      </tr>`
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:4px 0 20px;">${body}</table>`;
}

/** A highlighted fact box (e.g. a place and score). */
export function highlight(label, value) {
  return `<div style="margin:4px 0 20px;padding:18px 20px;border-radius:14px;background:${C.navy};">
    <div style="font-size:13px;color:#c9d3ea;">${label}</div>
    <div style="margin-top:4px;font-size:22px;font-weight:700;color:#ffffff;">${value}</div>
  </div>`;
}

/**
 * Full email document.
 * @param {object} o
 * @param {string} o.preheader  inbox preview text (plain text)
 * @param {string} [o.eyebrow]  small blue label above the title
 * @param {string} o.title      headline (escaped)
 * @param {string} o.body       inner HTML
 * @param {string} [o.footnote] small grey line at the bottom of the card
 */
export function layout({ preheader, eyebrow, title, body, footnote }) {
  return `<!doctype html>
<html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${C.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:${C.paper};font-family:${FONT};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
        <tr><td style="padding:0 4px 18px;">
          <span style="font-size:18px;font-weight:700;color:${C.ink};">OnnoPoth</span><span style="font-size:18px;font-weight:700;color:${C.brand};">.</span>
          <span style="font-size:13px;color:${C.ink3};">&nbsp; Product Building Competition</span>
        </td></tr>
        <tr><td style="background:${C.surface};border:1px solid ${C.line};border-radius:16px;padding:32px 28px;">
          ${eyebrow ? `<div style="font-size:13px;font-weight:600;color:${C.brand};margin:0 0 8px;">${eyebrow}</div>` : ''}
          <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;font-weight:700;color:${C.ink};">${title}</h1>
          ${body}
          ${footnote ? `<div style="margin-top:8px;padding-top:16px;border-top:1px solid ${C.line};font-size:13px;line-height:1.6;color:${C.ink3};">${footnote}</div>` : ''}
        </td></tr>
        <tr><td style="padding:18px 4px 0;font-size:12px;line-height:1.7;color:${C.ink3};">
          ${esc(event.name)} · আয়োজক ${esc(event.organizer)}<br/>
          <a href="${socialLinks.siteUrl}" style="color:${C.ink3};">${socialLinks.siteUrl.replace(/^https?:\/\//, '')}</a> ·
          <a href="${socialLinks.facebook}" style="color:${C.ink3};">Facebook</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export const signoff = () => p(`— ${esc(event.organizer)} আয়োজক কমিটি`, { muted: true, small: true });
