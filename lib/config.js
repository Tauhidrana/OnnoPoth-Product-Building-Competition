/**
 * ============================================================================
 *  SINGLE SOURCE OF TRUTH
 * ----------------------------------------------------------------------------
 *  Every editable value of the competition lives here: dates, deadlines,
 *  phone numbers, prizes, links and labels. Change a value here and it updates
 *  across the whole website.
 *
 *  NOTE: Secrets (GMAIL_USER, GMAIL_APP_PASSWORD, RECEIVER_EMAIL) are NOT here.
 *  They are read only on the server from environment variables so they can
 *  never be shipped to the browser.
 * ============================================================================
 */

// Event identity -------------------------------------------------------------
export const event = {
  name: 'Product Building Competition (Using AI)',
  shortName: 'Product Building Competition',
  organizer: 'OnnoPoth',
  tagline: 'AI-এর সাহায্যে আইডিয়াকে বাস্তব প্রোডাক্টে রূপ দাও',
  mode: 'Online Event',
  duration: '12 Hours',
  prizeLabel: 'Gifts for Top 3',
};

/**
 * All dates use an explicit UTC+6 (Bangladesh) offset so they are unambiguous.
 * `new Date(...)` understands the "+06:00" part automatically.
 */
export const dates = {
  // Main competition starts: 27 November 2026, 10:00 AM (UTC+6)
  competitionStart: '2026-11-27T10:00:00+06:00',
  // Competition ends: 27 November 2026, 10:00 PM (UTC+6)
  competitionEnd: '2026-11-27T22:00:00+06:00',
  // Registration runs 19–23 November 2026 (UTC+6)
  registrationStart: '2026-11-19T00:00:00+06:00',
  // Registration closes: 23 November 2026, 11:59 PM (UTC+6)
  registrationDeadline: '2026-11-23T23:59:00+06:00',
  // Human-readable version shown in the UI.
  competitionStartLabel: '২৭ নভেম্বর ২০২৬, সকাল ১০টা (UTC+6)',
  registrationWindowLabel: '১৯–২৩ নভেম্বর',
  registrationWindowLabelEn: '19–23 Nov',
  registrationDeadlineLabel: '২৩ নভেম্বর ২০২৬, রাত ১১:৫৯ (UTC+6)',
  submissionDeadlineLabel: '২৭ নভেম্বর ২০২৬, রাত ১০টা (UTC+6)',
};

// Contacts -------------------------------------------------------------------
// Add another organiser here and it appears in the Contact section + footer.
export const contacts = [
  {
    name: 'Kazi Tauhid Rana',
    detail: '01319711956',
    whatsapp: 'https://wa.me/8801319711956',
    tel: 'tel:+8801319711956',
    link: 'https://wa.me/8801319711956',
    linkLabel: 'WhatsApp',
  },
  {
    name: 'OnnoPoth',
    detail: 'অফিশিয়াল ফেসবুক পেজ',
    facebook: 'https://www.facebook.com/onnopoth.official',
    link: 'https://www.facebook.com/onnopoth.official',
    linkLabel: 'Facebook Page',
  },
];

// Social links shown in contact/footer cards.
export const socialLinks = {
  rulebook: '/rulebook',
  siteUrl: 'https://onnopoth-competition.vercel.app', // live production URL
  facebook: 'https://www.facebook.com/onnopoth.official',
  // Paste the WhatsApp group invite link here once the group is created (26 Nov).
  // Until then the site shows a friendly "group opens on 26 Nov" note.
  whatsappGroup: '',
};

// Prize cards ----------------------------------------------------------------
export const prizes = [
  { place: '1st', bangla: 'প্রথম স্থান', prize: 'Book', theme: 'gold' },
  { place: '2nd', bangla: 'দ্বিতীয় স্থান', prize: 'Book', theme: 'silver' },
  { place: '3rd', bangla: 'তৃতীয় স্থান', prize: 'Book', theme: 'bronze' },
];

// Judging criteria (must total 100) -----------------------------------------
export const judgingCriteria = [
  { label: 'আইডিয়ার মৌলিকতা ও সমস্যা সমাধান', marks: 25 },
  { label: 'প্রোডাক্ট ঠিকমতো কাজ করছে কি না', marks: 25 },
  { label: 'AI-এর কার্যকর ব্যবহার', marks: 20 },
  { label: 'UI/UX ডিজাইন', marks: 15 },
  { label: 'উপস্থাপনা ও README', marks: 10 },
  { label: 'কোডের গুণমান', marks: 5 },
];

// Where teams submit their finished product (see app/submit/page.js).
export const submissionLink = '/submit';

// Ways a competitor can build their product. Lovable/v0 projects only need a live link.
export const buildPlatforms = [
  { id: 'github', label: 'GitHub + Vercel', hint: 'কোড GitHub-এ, লাইভ Vercel-এ' },
  { id: 'lovable', label: 'Lovable', hint: 'শুধু লাইভ লিংক দিলেই হবে' },
  { id: 'v0', label: 'v0 (Vercel)', hint: 'শুধু লাইভ লিংক দিলেই হবে' },
];

// Final results — fill these in on 28 Nov, then push/redeploy (or leave empty
// to show the "result announcement pending" state).
export const results = [];
// Example shape:
// { place: '1st', name: 'Team Name', product: 'Product Name', institution: 'College', marks: 92 }

// Judges — add { name, role, detail } entries when the panel is announced.
// Leaving this empty shows a tasteful "will be announced" state.
export const judges = [];

// Gift sponsor ---------------------------------------------------------------
export const giftSponsor = {
  name: 'MIU',
  tagline: 'Learn Grow Succeed',
  logo: '/miu-logo.svg',
  facebook: 'https://www.facebook.com/miuacademy13',
};

// Competitor ID card ---------------------------------------------------------
// Exactly the eight identity fields shown on the card. Edit values here only.
export const idCardSample = {
  fullName: 'Kazi Tauhid Rana',
  institution: 'OnnoPoth',
  className: 'Organizing Committee',
  whatsapp: '01319711956',
  email: 'tauhidrana00@gmail.com',
  github: 'Tauhidrana',
  teamName: 'OnnoPoth',
  teamLeader: 'Kazi Tauhid Rana',
};

// Shared navigation ----------------------------------------------------------
// Header links (sections on the home page + the rulebook).
// `hint` is the one-line description shown in the mobile menu.
export const navLinks = [
  { label: 'কীভাবে', href: '/#about', hint: 'চারটি ধাপে পুরো প্রক্রিয়া' },
  { label: 'সময়সূচি', href: '/#timeline', hint: 'রেজিস্ট্রেশন থেকে ফলাফল' },
  { label: 'নিয়ম', href: '/#rules', hint: 'যোগ্যতা ও বিচারের মানদণ্ড' },
  { label: 'পুরস্কার', href: '/#prizes', hint: 'সেরা তিনটি প্রোডাক্টের জন্য' },
  { label: 'প্রশ্নোত্তর', href: '/#faq', hint: 'সাধারণ প্রশ্নের উত্তর' },
  { label: 'রুলবুক', href: '/rulebook', hint: 'সম্পূর্ণ নিয়মাবলি, PDF সহ' },
];

// Pages competitors use after registering (header "প্রতিযোগী" group + footer).
export const participantLinks = [
  { label: 'স্ট্যাটাস চেক', href: '/status' },
  { label: 'কনফার্মড তালিকা', href: '/confirmed' },
  { label: 'প্রোডাক্ট জমা', href: '/submit' },
  { label: 'ফলাফল', href: '/results' },
];

/**
 * Small helper used by BOTH the browser and the API route so the two stay in
 * sync. Returns true while registration is still open.
 */
export function isRegistrationOpen(now = Date.now()) {
  return now < new Date(dates.registrationDeadline).getTime();
}

/** True until the submission deadline (27 Nov, 10 PM UTC+6). */
export function isSubmissionOpen(now = Date.now()) {
  return now < new Date(dates.competitionEnd).getTime();
}
