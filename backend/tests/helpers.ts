/**
 * Shared test helpers for backend tests.
 *
 * Provides:
 *  - Seeded user IDs for guest and admin
 *  - Helper to create consent records for a user
 *  - Helper to clean up test data
 */
import { prisma } from '../src/config/db';
import { BUSINESS_CONFIG } from '../src/config/business';

/**
 * Ensure consent records exist for the given user.
 */
export async function ensureConsent(userId: string) {
  await prisma.consentRecord.deleteMany({ where: { userId } });
  await prisma.consentRecord.createMany({
    data: [
      { userId, documentType: 'terms', version: BUSINESS_CONFIG.termsVersion },
      { userId, documentType: 'privacy', version: BUSINESS_CONFIG.privacyVersion },
      { userId, documentType: 'refund', version: BUSINESS_CONFIG.refundVersion },
    ],
  });
  await prisma.user.update({
    where: { id: userId },
    data: { termsAcceptedAt: new Date(), termsVersion: BUSINESS_CONFIG.termsVersion },
  }).catch(() => {});
}

/**
 * Get the seeded guest user ID.
 */
export async function getGuestId(): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email: 'guest@yahsab.com' } });
  if (!user) throw new Error('Missing seeded test guest');
  return user.id;
}

/**
 * Get the seeded admin user ID.
 */
export async function getAdminId(): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email: 'admin@yahsab.com' } });
  if (!user) throw new Error('Missing seeded test admin');
  return user.id;
}

/**
 * Get the first published apartment ID.
 */
export async function getApartmentId(): Promise<string> {
  const apt = await prisma.apartment.findFirst({ where: { isPublished: true } });
  if (!apt) throw new Error('No apartment found in test db');
  return apt.id;
}

/**
 * Generate a unique email for test bookings.
 */
export function testEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@example.com`;
}
