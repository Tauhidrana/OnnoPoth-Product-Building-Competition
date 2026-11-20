import { randomBytes } from 'node:crypto';

let n = 0;
/** A valid registration body, unique per call. */
export function registrationBody(overrides = {}) {
  n += 1;
  const tag = `${Date.now().toString(36)}${n}${randomBytes(2).toString('hex')}`;
  return {
    registrationType: 'solo',
    fullName: `Test Person ${n}`,
    teamName: '',
    members: ['', '', ''],
    teamLeader: 0,
    institution: 'Dhaka College',
    className: 'HSC',
    whatsapp: `017${String(10000000 + n).slice(-8)}`,
    email: `person-${tag}@example.com`,
    github: 'tester',
    productName: `Product ${n}`,
    problem: 'Prices change daily.',
    users: 'Families',
    features: ['Daily prices', 'Price trends', 'Compare by area'],
    agree: true,
    website: '',
    ...overrides,
  };
}

export function submissionBody(overrides = {}) {
  return {
    liveUrl: 'https://bazardor.vercel.app',
    description: 'Daily market prices with trends.',
    website: '',
    ...overrides,
  };
}

let ip = 0;
/** Build a Request like Next.js passes to route handlers. */
export function request(path, { method = 'GET', body, cookie, headers = {}, ipAddress } = {}) {
  ip += 1;
  const h = new Headers({ 'x-forwarded-for': ipAddress || `10.0.${Math.floor(ip / 250)}.${ip % 250}`, ...headers });
  if (body !== undefined && !h.has('content-type')) h.set('content-type', 'application/json');
  if (cookie) h.set('cookie', cookie);
  return new Request(`http://localhost:3000${path}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
}
