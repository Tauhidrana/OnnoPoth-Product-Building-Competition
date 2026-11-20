/**
 * Validation shared by the browser forms and the API routes, so both always
 * agree. Returns normalised data plus Bangla error messages keyed by field.
 * Length limits match the database CHECK constraints in supabase/migrations.
 */

// Bangladeshi mobile numbers: 013–019 followed by 8 digits.
export const PHONE_RE = /^01[3-9]\d{8}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;
const GITHUB_REPO_RE = /^https?:\/\/(www\.)?github\.com\/[^\s/]+\/[^\s/]+/i;
// GitHub's own rule: letters, digits and single hyphens, not at either end, max 39.
const GITHUB_USER_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export const LIMITS = {
  fullName: 120,
  teamName: 120,
  member: 120,
  institution: 200,
  className: 120,
  productName: 160,
  long: 4000,
  problemMin: 20,
  feature: 200,
  featuresRequired: 3,
  featuresMax: 5,
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const INVISIBLE = /[​-‍⁠﻿]/g;

export const clean = (v) => (typeof v === 'string' ? v.normalize('NFC').replace(INVISIBLE, '').trim() : '');
/** Single-line text: also collapses runs of whitespace. */
export const cleanLine = (v) => clean(v).replace(/\s+/g, ' ');

/** "+88 017-1234 5678", "০১৭১২৩৪৫৬৭৮" → "01712345678". */
export function normalisePhone(v) {
  let digits = clean(v).replace(/[০-৯]/g, (d) => BN_DIGITS.indexOf(d)).replace(/\D/g, '');
  if (digits.startsWith('0088')) digits = digits.slice(4);
  else if (digits.startsWith('88') && digits.length === 13) digits = digits.slice(2);
  return digits;
}

/** "https://github.com/rahim/repo", "@rahim" → "rahim". */
export function normaliseGithub(v) {
  let s = clean(v).replace(/^@/, '');
  const m = s.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#\s]+)/i);
  if (m) s = m[1];
  return s.replace(/\/+$/, '');
}

const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com'];

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** "rahim@gmial.con" → "rahim@gmail.com" (or null when it looks fine). */
export function suggestEmail(email) {
  const [user, domain] = String(email).toLowerCase().split('@');
  if (!user || !domain || COMMON_DOMAINS.includes(domain)) return null;
  const best = COMMON_DOMAINS.map((d) => [d, distance(domain, d)]).sort((a, b) => a[1] - b[1])[0];
  return best && best[1] > 0 && best[1] <= 2 ? `${user}@${best[0]}` : null;
}

const tooLong = (v, n) => [...v].length > n;

/**
 * Features arrive as a list (one per input). Older clients may send one block
 * of text; split it into lines and drop list markers like "১." or "-".
 */
export function parseFeatures(v) {
  const list = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\r?\n/) : [];
  return list
    .slice(0, 10)
    .map((f) => cleanLine(f).replace(/^(?:[০-৯\d]+[.)।]|[-•*])\s*/, ''))
    .filter(Boolean);
}
const bn = (n) => String(n).replace(/\d/g, (d) => BN_DIGITS[d]);

export function validateRegistration(body = {}) {
  const errors = {};
  const type = clean(body.registrationType);
  const isTeam = type === 'team';
  const rawMembers = Array.isArray(body.members) ? body.members.slice(0, 3).map(cleanLine) : [];
  const leaderIndex = Number.isInteger(body.teamLeader) && body.teamLeader >= 0 && body.teamLeader < 3 ? body.teamLeader : 0;
  const members = rawMembers.filter(Boolean);
  const fullName = isTeam ? rawMembers[leaderIndex] || members[0] || '' : cleanLine(body.fullName);

  const data = {
    registrationType: type,
    fullName,
    teamName: isTeam ? cleanLine(body.teamName) : '',
    members: isTeam ? members : [],
    institution: cleanLine(body.institution),
    className: cleanLine(body.className),
    whatsapp: normalisePhone(body.whatsapp),
    email: clean(body.email).toLowerCase(),
    github: normaliseGithub(body.github),
    productName: cleanLine(body.productName),
    problem: clean(body.problem),
    users: clean(body.users),
    features: parseFeatures(body.features),
    agree: body.agree === true,
  };

  const need = (key, ok, message) => {
    if (!errors[key] && !ok) errors[key] = message;
  };

  need('registrationType', ['solo', 'team'].includes(type), 'একা নাকি টিমে — একটি বেছে নাও।');

  if (isTeam) {
    need('teamName', data.teamName, 'টিমের একটা নাম দাও।');
    need('teamName', !tooLong(data.teamName, LIMITS.teamName), `টিমের নাম ${bn(LIMITS.teamName)} অক্ষরের মধ্যে রাখো।`);
    need('members', members.length >= 2, members.length === 1 ? 'টিমে অন্তত ২ জন লাগবে। একা হলে উপরে “একা” বেছে নাও।' : 'টিমের সদস্যদের নাম লেখো (অন্তত ২ জন)।');
    const lower = members.map((m) => m.toLowerCase());
    need('members', new Set(lower).size === lower.length, 'একই নাম দুবার লেখা হয়েছে।');
    need('members', !members.some((m) => tooLong(m, LIMITS.member)), `প্রতিটি নাম ${bn(LIMITS.member)} অক্ষরের মধ্যে রাখো।`);
  } else {
    need('fullName', data.fullName, 'তোমার পুরো নাম লেখো।');
    need('fullName', !tooLong(data.fullName, LIMITS.fullName), `নাম ${bn(LIMITS.fullName)} অক্ষরের মধ্যে রাখো।`);
  }

  need('institution', data.institution, 'তোমার স্কুল, কলেজ বা বিশ্ববিদ্যালয়ের নাম লেখো।');
  need('institution', !tooLong(data.institution, LIMITS.institution), `প্রতিষ্ঠানের নাম ${bn(LIMITS.institution)} অক্ষরের মধ্যে রাখো।`);
  need('className', data.className, 'শ্রেণি বা সেমিস্টার লেখো (যেমন: Class 12, 3rd Semester)।');
  need('className', !tooLong(data.className, LIMITS.className), `${bn(LIMITS.className)} অক্ষরের মধ্যে রাখো।`);

  need('whatsapp', data.whatsapp, 'WhatsApp নম্বর দাও।');
  need('whatsapp', data.whatsapp.length === 11, `নম্বরে ১১টি সংখ্যা থাকতে হবে (এখন ${bn(data.whatsapp.length)}টি)। যেমন: 01712345678`);
  need('whatsapp', PHONE_RE.test(data.whatsapp), 'এটি বাংলাদেশি মোবাইল নম্বর মনে হচ্ছে না। 013–019 দিয়ে শুরু হতে হবে।');

  need('email', data.email, 'ইমেইল ঠিকানা দাও — কনফার্মেশন এখানেই যাবে।');
  need('email', EMAIL_RE.test(data.email) && data.email.length <= 254, 'ইমেইল ঠিকানাটি সঠিক নয় (যেমন: name@gmail.com)।');

  need('github', data.github, 'GitHub ইউজারনেম দাও। অ্যাকাউন্ট না থাকলে github.com-এ ফ্রি খুলে নাও।');
  need('github', GITHUB_USER_RE.test(data.github), 'GitHub ইউজারনেমে শুধু ইংরেজি অক্ষর, সংখ্যা ও হাইফেন (-) থাকে, সর্বোচ্চ ৩৯ অক্ষর।');

  need('productName', data.productName, 'প্রোডাক্টের একটা নাম দাও (পরে বদলানো যাবে)।');
  need('productName', !tooLong(data.productName, LIMITS.productName), `নাম ${bn(LIMITS.productName)} অক্ষরের মধ্যে রাখো।`);

  need('problem', data.problem, 'কোন সমস্যার সমাধান করবে তা লেখো।');
  need('problem', [...data.problem].length >= LIMITS.problemMin, `আরেকটু বিস্তারিত লেখো (অন্তত ${bn(LIMITS.problemMin)} অক্ষর) — কে, কী সমস্যায় পড়ছে?`);
  need('users', data.users, 'কারা এটি ব্যবহার করবে তা লেখো।');
  const f = data.features;
  need('features', f.length >= LIMITS.featuresRequired, f.length ? `অন্তত ${bn(LIMITS.featuresRequired)}টি ফিচার লাগবে (এখন ${bn(f.length)}টি)।` : `প্রধান ${bn(LIMITS.featuresRequired)}টি ফিচার লেখো — প্রতিটি আলাদা ঘরে।`);
  need('features', f.length <= LIMITS.featuresMax, `সর্বোচ্চ ${bn(LIMITS.featuresMax)}টি ফিচার দেওয়া যায়।`);
  need('features', !f.some((x) => tooLong(x, LIMITS.feature)), `প্রতিটি ফিচার ${bn(LIMITS.feature)} অক্ষরের মধ্যে রাখো — ছোট করে এক লাইনে।`);
  need('features', new Set(f.map((x) => x.toLowerCase())).size === f.length, 'একই ফিচার দুবার লেখা হয়েছে।');
  for (const k of ['problem', 'users']) need(k, !tooLong(data[k], LIMITS.long), `লেখাটি ${bn(LIMITS.long)} অক্ষরের মধ্যে রাখো।`);

  need('agree', data.agree, 'জমা দেওয়ার আগে রুলবুক পড়ে টিক দাও।');

  return { data, errors };
}

/** "my-app.vercel.app" → "https://my-app.vercel.app". */
export function normaliseUrl(v) {
  const s = clean(v).replace(/\s+/g, '');
  return s && !/^https?:\/\//i.test(s) ? `https://${s}` : s;
}

/** True for a deployed Vercel site (used for a gentle hint, never to block). */
export const isVercelUrl = (url) => {
  try {
    return /(^|\.)vercel\.app$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
};

export const SUBMISSION_LIMITS = { url: 500, description: 500 };

/** Final submission: the live project URL and an optional short description. */
export function validateSubmission(body = {}) {
  const errors = {};
  const data = { liveUrl: normaliseUrl(body.liveUrl), description: clean(body.description) };

  if (!data.liveUrl) {
    errors.liveUrl = 'লাইভ প্রোজেক্টের লিংক দাও (যেমন: https://your-app.vercel.app)।';
  } else {
    let url = null;
    try {
      url = new URL(data.liveUrl);
    } catch {}
    const host = url?.hostname.toLowerCase() || '';
    if (/^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.)/.test(host)) {
      errors.liveUrl = 'এটি তোমার কম্পিউটারের লোকাল লিংক, অন্যরা খুলতে পারবে না। Vercel-এ ডিপ্লয় করা পাবলিক লিংক দাও।';
    } else if (!url || !host.includes('.') || data.liveUrl.length > SUBMISSION_LIMITS.url) {
      errors.liveUrl = 'লিংকটি সঠিক নয়। ব্রাউজারের ঠিকানা থেকে পুরো লিংকটি কপি করে দাও।';
    } else if (host === 'github.com' || host === 'www.github.com') {
      errors.liveUrl = 'এটি GitHub রিপোজিটরির লিংক। ডিপ্লয় করা লাইভ সাইটের লিংক দাও (যেমন: https://your-app.vercel.app)।';
    } else if (host === 'vercel.com' || host === 'www.vercel.com') {
      errors.liveUrl = 'এটি Vercel ড্যাশবোর্ডের লিংক। প্রোজেক্টের “Visit” বাটনের পাবলিক লিংকটি দাও (…vercel.app)।';
    }
  }
  if ([...data.description].length > SUBMISSION_LIMITS.description) {
    errors.description = `বিবরণ ${bn(SUBMISSION_LIMITS.description)} অক্ষরের মধ্যে রাখো।`;
  }
  return { data, errors };
}

/** Admin results input: up to ten rows with place, name, email and product. */
export function validateResults(rows) {
  if (!Array.isArray(rows)) return { error: 'ফলাফলের তালিকা সঠিক নয়।' };
  if (rows.length > 10) return { error: 'সর্বোচ্চ ১০টি স্থান প্রকাশ করা যায়।' };
  const out = [];
  for (const [i, r] of rows.entries()) {
    const row = {
      rank: i + 1,
      place: cleanLine(r?.place) || `${i + 1}`,
      registrationId: Number.isInteger(r?.registrationId) ? r.registrationId : null,
      name: cleanLine(r?.name),
      email: clean(r?.email).toLowerCase(),
      product: cleanLine(r?.product),
      institution: cleanLine(r?.institution),
      marks: r?.marks === '' || r?.marks == null ? null : Number(r.marks),
    };
    if (!row.name || !row.product || !EMAIL_RE.test(row.email)) return { error: `${i + 1} নম্বর সারিতে নাম, প্রোডাক্ট ও সঠিক ইমেইল আবশ্যক।` };
    if (row.place.length > 40) return { error: `${i + 1} নম্বর সারির স্থানের নাম অনেক বড়।` };
    if (row.marks != null && (!Number.isInteger(row.marks) || row.marks < 0 || row.marks > 100)) return { error: `${i + 1} নম্বর সারির নম্বর ০–১০০ এর মধ্যে হতে হবে।` };
    out.push(row);
  }
  return { rows: out };
}
