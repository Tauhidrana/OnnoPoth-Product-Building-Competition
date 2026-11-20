import { readApprovalToken } from '../admin.js';
import { getRegistration } from '../repo.js';

/** Resolve an approval link token to an approved registration, or null. */
export async function approvedRegistrationFromToken(token) {
  const payload = readApprovalToken(token);
  if (!payload) return null;
  const registration = await getRegistration(payload.rid);
  if (!registration || registration.status !== 'approved') return null;
  if (registration.email.toLowerCase() !== String(payload.email).toLowerCase()) return null;
  return registration;
}
