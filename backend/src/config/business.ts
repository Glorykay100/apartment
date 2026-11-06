/**
 * Central business configuration for Yahsab Luxury Apartments & Suites.
 *
 * All business-specific details live here. Replace the placeholder values
 * with your real business details and the rest of the app reads from this
 * single source of truth (or from environment variables where noted).
 *
 * DO NOT hard-code contact details anywhere else in the codebase.
 */

export const BUSINESS_CONFIG = {
  name: process.env.BUSINESS_NAME || 'Yahsab Luxury Apartments & Suites',
  shortName: process.env.BUSINESS_SHORT_NAME || 'Yahsab',
  address: process.env.BUSINESS_ADDRESS || 'Plot 14, River Benue Crescent, Old GRA, Makurdi, Benue State, Nigeria',
  city: process.env.BUSINESS_CITY || 'Makurdi',
  state: process.env.BUSINESS_STATE || 'Benue State',
  country: 'Nigeria',
  supportEmail: process.env.BUSINESS_SUPPORT_EMAIL || 'reservations@yahsab.com',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@yahsab.com',
  phone: process.env.BUSINESS_PHONE || '+234 (0) 803 123 4567',
  whatsapp: process.env.BUSINESS_WHATSAPP || '+234 (0) 803 123 4567',
  timezone: 'Africa/Lagos',
  currency: 'NGN',
  currencySymbol: '₦',
  governingLaw: 'Federal Republic of Nigeria',
  websiteUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.CLIENT_URL || 'http://localhost:5000',
  // Legal document versions — bump when content changes to force re-acceptance
  legalVersion: '1.0',
  termsVersion: '1.0',
  privacyVersion: '1.0',
  refundVersion: '1.0',
  cookieVersion: '1.0',
  // Booking hold configuration
  bookingHoldMinutes: 15,
  // Free entry to check-in instructions email (hours before check-in)
  checkInReminderHours: 24,
  // Review request (hours after check-out)
  reviewRequestHours: 24,
  // Payment reminder at 50% of hold time
  paymentReminderPercent: 50,
} as const;

export type BusinessConfig = typeof BUSINESS_CONFIG;

/**
 * Returns the legal document version for a given document type.
 */
export function getDocumentVersion(docType: 'terms' | 'privacy' | 'refund' | 'cookie'): string {
  switch (docType) {
    case 'terms':
      return BUSINESS_CONFIG.termsVersion;
    case 'privacy':
      return BUSINESS_CONFIG.privacyVersion;
    case 'refund':
      return BUSINESS_CONFIG.refundVersion;
    case 'cookie':
      return BUSINESS_CONFIG.cookieVersion;
    default:
      return BUSINESS_CONFIG.legalVersion;
  }
}
