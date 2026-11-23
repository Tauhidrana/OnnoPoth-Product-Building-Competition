/**
 * Every email the site sends. Each builder returns { subject, html, text }.
 * Inputs are database rows (camelCase); everything user-supplied is escaped.
 */
import { layout, details, steps, button, highlight, p, signoff, esc, bn } from './email.js';
import { event, socialLinks } from './config.js';

const site = () => socialLinks.siteUrl;
const link = (url) => `<a href="${esc(url)}" style="color:#2f5bea;">${esc(url)}</a>`;
const asList = (v) => (Array.isArray(v) ? v : String(v || '').split('\n')).filter(Boolean);
const numbered = (v) => asList(v).map((x, i) => `${i + 1}. ${esc(x)}`).join('<br/>');

export function registrationOrganizer(r) {
  const isTeam = r.registrationType === 'team';
  return {
    subject: `New Registration: ${r.productName} – ${r.fullName}`,
    text: `New registration\n\nProduct: ${r.productName}\nName: ${r.fullName}\nEmail: ${r.email}\nWhatsApp: ${r.whatsapp}\nInstitution: ${r.institution}\nFeatures:\n${asList(r.features).map((x, i) => `  ${i + 1}. ${x}`).join('\n')}`,
    html: layout({
      preheader: `${r.productName} — ${r.fullName}`,
      eyebrow: 'নতুন রেজিস্ট্রেশন',
      title: esc(r.productName),
      body:
        details([
          ['ধরন', isTeam ? 'টিম' : 'একা'],
          ['নাম', esc(r.fullName)],
          isTeam && ['টিমের নাম', esc(r.teamName)],
          isTeam && ['টিমের সদস্য', (r.members || []).map((m, i) => `${i + 1}. ${esc(m)}`).join('<br/>')],
          ['প্রতিষ্ঠান', esc(r.institution)],
          ['শ্রেণি / সেমিস্টার', esc(r.className)],
          ['WhatsApp', esc(r.whatsapp)],
          ['ইমেইল', esc(r.email)],
          ['GitHub', esc(r.github)],
          ['কোন সমস্যা সমাধান করবে', esc(r.problem)],
          ['কারা ব্যবহার করবে', esc(r.targetUsers)],
          ['প্রধান ফিচার', numbered(r.features)],
        ]) + button('ড্যাশবোর্ডে রিভিউ করুন', `${site()}/admin`),
      footnote: 'এই ইমেইলে Reply করলে সরাসরি প্রতিযোগীর কাছে যাবে।',
    }),
  };
}

export function registrationConfirmation(r) {
  return {
    subject: 'আপনার রেজিস্ট্রেশন গ্রহণ করা হয়েছে',
    text: `ধন্যবাদ, ${r.fullName}। ${r.productName} আইডিয়াসহ আপনার রেজিস্ট্রেশন গ্রহণ করা হয়েছে। ২৫ নভেম্বর কনফার্মড তালিকা ঘোষণা করা হবে। স্ট্যাটাস: ${site()}/status`,
    html: layout({
      preheader: 'রেজিস্ট্রেশন গ্রহণ করা হয়েছে। ২৫ নভেম্বর কনফার্মড তালিকা ঘোষণা করা হবে।',
      eyebrow: 'রেজিস্ট্রেশন গ্রহণ করা হয়েছে',
      title: `ধন্যবাদ, ${esc(r.fullName)}`,
      body:
        p(`<strong>${esc(r.productName)}</strong> আইডিয়াসহ আপনার রেজিস্ট্রেশন আমরা পেয়েছি। এরপর যা হবে:`) +
        steps([
          ['২৪–২৫ নভেম্বর', 'আইডিয়া যাচাই ও কনফার্মড তালিকা'],
          ['২৬ নভেম্বর', 'নিয়মাবলি ও ব্রিফিং'],
          ['২৭ নভেম্বর, সকাল ১০টা – রাত ১০টা', '১২ ঘণ্টার মূল প্রতিযোগিতা'],
        ]) +
        p('আগে থেকেই GitHub ও Vercel অ্যাকাউন্ট খুলে রাখুন। কোড লেখা শুরু করতে হবে ২৭ নভেম্বর সকাল ১০টার পরে। ক্যালেন্ডারে যোগ করার ফাইল সংযুক্ত আছে।') +
        button('স্ট্যাটাস দেখুন', `${site()}/status`) +
        signoff(),
    }),
  };
}

export function submissionOrganizer(s) {
  return {
    subject: `New Submission: ${s.productName} – ${s.name}`,
    text: `New submission\n\nProduct: ${s.productName}\nTeam: ${s.name}\nLive: ${s.liveUrl}${s.description ? `\n\n${s.description}` : ''}`,
    html: layout({
      preheader: `${s.productName} — ${s.name}`,
      eyebrow: 'নতুন প্রোডাক্ট জমা',
      title: esc(s.productName),
      body:
        details([
          ['নাম / টিম', esc(s.name)],
          ['ইমেইল', esc(s.email)],
          ['লাইভ লিংক', link(s.liveUrl)],
          ['বিবরণ', esc(s.description)],
        ]) + button('ড্যাশবোর্ডে দেখুন', `${site()}/admin#submissions`),
      footnote: 'এই ইমেইলে Reply করলে সরাসরি প্রতিযোগীর কাছে যাবে।',
    }),
  };
}

export function submissionConfirmation(s) {
  return {
    subject: s.updated ? 'তোমার জমা আপডেট হয়েছে' : 'তোমার প্রোডাক্ট জমা হয়েছে',
    text: `${s.name}, ${s.productName} জমা হয়েছে।\nলাইভ লিংক: ${s.liveUrl}${s.description ? `\nবিবরণ: ${s.description}` : ''}\n২৮ নভেম্বর সন্ধ্যায় ফলাফল।`,
    html: layout({
      preheader: `${s.productName} জমা হয়েছে। ২৮ নভেম্বর সন্ধ্যায় ফলাফল।`,
      eyebrow: s.updated ? 'জমা আপডেট হয়েছে' : 'জমা দেওয়া হয়েছে',
      title: `অভিনন্দন, ${esc(s.name)}`,
      body:
        p(`<strong>${esc(s.productName)}</strong> ${s.updated ? 'এর জমা আপডেট হয়েছে' : 'সফলভাবে জমা হয়েছে'}। আমরা যা পেয়েছি:`) +
        details([
          ['লাইভ লিংক', link(s.liveUrl)],
          ['বিবরণ', esc(s.description)],
        ]) +
        p('ডেডলাইনের (২৭ নভেম্বর, রাত ১০টা) আগে একই লিংক দিয়ে আবার জমা দিলে এটি আপডেট হয়ে যাবে। বিচারকমণ্ডলী ২৮ নভেম্বর প্রোডাক্টগুলো দেখবেন, সন্ধ্যায় ফলাফল ঘোষণা।') +
        signoff(),
    }),
  };
}

export function approval(r, submitLink) {
  return {
    subject: `আপনার আইডিয়া অ্যাপ্রুভ হয়েছে – ${r.productName}`,
    text: `অভিনন্দন, ${r.fullName}! ${r.productName} অ্যাপ্রুভ হয়েছে। ২৭ নভেম্বর রাত ১০টার আগে এই লিংকে লাইভ প্রোজেক্টের URL (যেমন …vercel.app) ও ইচ্ছে হলে ছোট বিবরণ জমা দাও: ${submitLink}`,
    html: layout({
      preheader: `${r.productName} অ্যাপ্রুভ হয়েছে। ২৭ নভেম্বর দেখা হবে।`,
      eyebrow: 'আইডিয়া অ্যাপ্রুভ হয়েছে',
      title: `অভিনন্দন, ${esc(r.fullName)}`,
      body:
        p(`<strong>${esc(r.productName)}</strong> আইডিয়াটি যাচাইয়ে পাস করেছে। আপনি মূল প্রতিযোগিতায় অংশ নিচ্ছেন।`) +
        (r.decisionNote ? p(`আয়োজকদের নোট: ${esc(r.decisionNote)}`, { muted: true }) : '') +
        steps([
          ['২৬ নভেম্বর', 'ব্রিফিং ও WhatsApp গ্রুপ'],
          ['২৭ নভেম্বর, সকাল ১০টা', 'নতুন রিপো খুলে কাজ শুরু'],
          ['২৭ নভেম্বর, রাত ১০টার আগে', 'নিচের লিংকে লাইভ প্রোজেক্টের URL (যেমন …vercel.app) ও ইচ্ছে হলে ছোট বিবরণ জমা'],
        ]) +
        button('লাইভ প্রোজেক্ট জমা দিন', esc(submitLink)) +
        signoff(),
      footnote: 'এই লিংকটি শুধু আপনার জন্য, কারও সাথে শেয়ার করবেন না। ২৭ নভেম্বর রাত ১০টার পর এটি আর কাজ করবে না।',
    }),
  };
}

export function decline(r) {
  return {
    subject: `আইডিয়া আপডেট – ${r.productName}`,
    text: `প্রিয় ${r.fullName}, ${r.productName} আইডিয়াটি এইবারের জন্য নির্বাচিত হয়নি। আগ্রহের জন্য ধন্যবাদ।`,
    html: layout({
      preheader: 'আইডিয়া যাচাইয়ের ফলাফল',
      eyebrow: 'আইডিয়া আপডেট',
      title: `প্রিয় ${esc(r.fullName)}`,
      body:
        p(`<strong>${esc(r.productName)}</strong> আইডিয়াটি এইবারের জন্য নির্বাচিত হয়নি। অংশ নিতে আগ্রহ দেখানোর জন্য ধন্যবাদ।`) +
        (r.decisionNote ? p(`আয়োজকদের নোট: ${esc(r.decisionNote)}`, { muted: true }) : '') +
        p(`পরবর্তী ইভেন্টের খবর পেতে <a href="${socialLinks.facebook}" style="color:#2f5bea;">${esc(event.organizer)}-এর ফেসবুক পেজ</a> ফলো করুন।`) +
        signoff(),
    }),
  };
}

export function result(w) {
  return {
    subject: `ফলাফল ঘোষণা – ${w.place} স্থান (${w.product})`,
    text: `অভিনন্দন, ${w.name}! ${w.product} প্রোডাক্টের জন্য আপনি ${w.place} স্থান অর্জন করেছেন। ${site()}/results`,
    html: layout({
      preheader: `${w.place} স্থান — ${event.name}`,
      eyebrow: 'ফলাফল ঘোষণা',
      title: `অভিনন্দন, ${esc(w.name)}`,
      body:
        p(`<strong>${esc(w.product)}</strong> প্রোডাক্টের জন্য আপনি এই স্থান অর্জন করেছেন:`) +
        highlight(w.marks != null ? `${bn(w.marks)} / ১০০ নম্বর` : 'অর্জিত স্থান', `${esc(w.place)} স্থান`) +
        (w.rank <= 3 ? p('আপনার পুরস্কার (বই) পৌঁছে দেওয়ার বিষয়ে আয়োজক কমিটি শীঘ্রই যোগাযোগ করবে।') : '') +
        button('সম্পূর্ণ ফলাফল দেখুন', `${site()}/results`) +
        signoff(),
    }),
  };
}

export function reminder(r) {
  return {
    subject: 'মনে করিয়ে দিচ্ছি: আইডিয়া যাচাই চলছে',
    text: `প্রিয় ${r.fullName}, আপনার ${r.productName} আইডিয়া পর্যালোচনায় আছে। স্ট্যাটাস: ${site()}/status`,
    html: layout({
      preheader: 'আপনার আইডিয়া পর্যালোচনায় আছে। ২৫ নভেম্বর স্ট্যাটাস জানানো হবে।',
      eyebrow: 'আইডিয়া যাচাই চলছে',
      title: `প্রিয় ${esc(r.fullName)}`,
      body:
        p(`আপনার <strong>${esc(r.productName)}</strong> আইডিয়া আমাদের পর্যালোচনায় আছে। ২৫ নভেম্বর স্ট্যাটাস জানানো হবে।`) +
        p('রেজিস্ট্রেশনের ইমেইল ও WhatsApp নম্বর দিয়ে যেকোনো সময় নিজের স্ট্যাটাস দেখতে পারেন।') +
        button('স্ট্যাটাস দেখুন', `${site()}/status`) +
        signoff(),
    }),
  };
}
