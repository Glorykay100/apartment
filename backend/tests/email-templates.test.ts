import { describe, it, expect } from 'vitest';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { BUSINESS_CONFIG } from '../src/config/business';
import {
  renderWelcomeEmail,
  renderBookingReceivedEmail,
  renderBookingConfirmationEmail,
  renderPaymentReminderEmail,
  renderBookingExpiredEmail,
  renderNewsletterOptInEmail,
  renderNewsletterWelcomeEmail,
} from '../src/services/email.service';
import { renderReceiptPdf } from '../src/utils/receiptPdf';

const HREF_RE = /href="(https?:\/\/[^"]+)"/g;

const expectValidLinks = (html: string) => {
  const links = [...html.matchAll(HREF_RE)].map((m) => m[1]);
  for (const link of links) {
    expect(() => new URL(link)).not.toThrow();
    expect(link).toMatch(/^https?:\/\//);
  }
  return links;
};

const baseBooking = {
  id: 'booking-1',
  reference: 'YAH-2026-TEST',
  apartmentId: 'apt-1',
  userId: 'user-1',
  guestFullName: 'Terna Agbo',
  guestEmail: 'guest@example.com',
  guestPhone: '+2348012345678',
  checkIn: new Date('2029-01-10'),
  checkOut: new Date('2029-01-13'),
  nights: 3,
  guestCount: 2,
  nightlyRate: 95000,
  subtotal: 285000,
  cleaningFee: 15000,
  serviceFee: 6000,
  totalAmount: 306000,
  status: BookingStatus.PENDING,
  paymentStatus: PaymentStatus.UNPAID,
  paystackReference: null,
  paystackPaidAt: null,
  paystackChannel: null,
  holdExpiresAt: new Date(),
  specialRequests: null,
  emailsSent: [],
  review: undefined,
  receipt: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  apartment: {
    id: 'apt-1',
    title: 'The Benue Terrace Penthouse',
    city: 'Makurdi',
    state: 'Benue State',
    address: 'Plot 14, River Benue Crescent, Old GRA',
    checkInTime: '14:00',
    checkOutTime: '11:00',
  },
} as any;

const baseReceipt = {
  id: 'receipt-1',
  receiptNumber: 'RCT-2026-000001',
  bookingId: 'booking-1',
  userId: 'user-1',
  amountPaid: 306000,
  paymentDate: new Date(),
  paystackReference: 'PSTK_yah-2026-test_123',
  channel: 'card',
  guestName: 'Terna Agbo',
  guestEmail: 'guest@example.com',
  apartmentTitle: 'The Benue Terrace Penthouse',
  apartmentAddress: 'Plot 14, River Benue Crescent, Old GRA',
  checkIn: new Date('2029-01-10'),
  checkOut: new Date('2029-01-13'),
  nights: 3,
  guestCount: 2,
  nightlyRate: 95000,
  subtotal: 285000,
  cleaningFee: 15000,
  serviceFee: 6000,
  totalAmount: 306000,
  pdfPath: null,
  createdAt: new Date(),
} as any;

describe('Email templates — render checks', () => {
  const transactionalTemplates: Array<[string, ReturnType<() => any>]> = [
    ['welcome', () => renderWelcomeEmail({ fullName: 'Terna Agbo' })],
    ['booking_received', () => renderBookingReceivedEmail(baseBooking)],
    ['booking_confirmation', () => renderBookingConfirmationEmail(baseBooking, 'RCT-2026-000001')],
    ['payment_reminder', () => renderPaymentReminderEmail(baseBooking)],
    ['booking_expired', () => renderBookingExpiredEmail(baseBooking)],
  ];

  it.each(transactionalTemplates)('%s template has subject, plain-text version and valid links', (_name, factory) => {
    const template = factory();
    expect(template.subject.length).toBeGreaterThan(5);
    expect(template.text.length).toBeGreaterThan(20);
    expect(template.html).toContain('<');
    // Plain-text version must not be just the HTML dump
    expect(template.text).not.toContain('<div');
    expectValidLinks(template.html);
  });

  it.each(transactionalTemplates.map((t) => [t[0], t[1]] as const))('%s carries correct business details', (_name, factory) => {
    const template = factory();
    expect(template.html).toContain(BUSINESS_CONFIG.supportEmail);
    expect(template.html).toContain(BUSINESS_CONFIG.phone);
    expect(template.html).toContain(BUSINESS_CONFIG.shortName);
    // Transactional emails must NOT contain the unsubscribe link
    expect(template.html).not.toMatch(/unsubscribe/i);
  });

  it('booking confirmation shows the booking number, amounts and receipt PDF attachment', () => {
    const template = renderBookingConfirmationEmail(baseBooking, 'RCT-2026-000001');
    expect(template.subject).toContain('YAH-2026-TEST');
    expect(template.html).toContain('YAH-2026-TEST');
    expect(template.html).toContain('306,000');
    expect(template.html).toContain('The Benue Terrace Penthouse');
    expect(template.html).toContain('RCT-2026-000001');
    expect(template.html).toMatch(/PDF attached/);
  });

  it('marketing opt-in email contains an unsubscribe link; newsletter welcome too', () => {
    const optIn = renderNewsletterOptInEmail('Terna', 'https://example.com/confirm?token=x', 'https://example.com/unsubscribe?token=y');
    expect(optIn.html).toMatch(/Unsubscribe from these emails/);
    expectValidLinks(optIn.html);
    expect(optIn.html).toContain('https://example.com/unsubscribe?token=y');

    const welcome = renderNewsletterWelcomeEmail('Terna', 'https://example.com/unsubscribe?token=y');
    expect(welcome.html).toMatch(/Unsubscribe/);
    expect(welcome.text).toContain('Unsubscribe anytime');
  });

  it('the generated receipt PDF contains the receipt number, amounts and booking reference', () => {
    const pdf = renderReceiptPdf(baseReceipt, 'YAH-2026-TEST').toString('latin1');
    expect(pdf).toContain('RCT-2026-000001');
    expect(pdf).toContain('YAH-2026-TEST');
    expect(pdf).toContain('306,000');
    expect(pdf).toContain('NGN');
    // Naira sign is normalized to ASCII-safe NGN
    expect(pdf).not.toContain('₦');
  });

  it('mobile-friendly layout: templates use max-width, inline styles and viewport-safe tables', () => {
    const template = renderBookingConfirmationEmail(baseBooking);
    expect(template.html).toContain('max-width:600px');
    expect(template.html).toMatch(/width:100%/);
    // All styles inline (email clients strip <style> blocks)
    expect(template.html).not.toContain('<style');
  });

  it('payment reminder includes the complete-payment link with the booking reference', () => {
    const template = renderPaymentReminderEmail(baseBooking);
    expect(template.html).toContain(`/booking/confirmation/YAH-2026-TEST`);
    expect(template.text).toContain('/booking/confirmation/YAH-2026-TEST');
  });

  it('action emails include their working links (received, confirmation, opt-in)', () => {
    const received = renderBookingReceivedEmail(baseBooking);
    expect(received.html).toContain('/booking/confirmation/YAH-2026-TEST');
    expectValidLinks(received.html);

    const confirmation = renderBookingConfirmationEmail(baseBooking);
    expectValidLinks(confirmation.html);

    const optIn = renderNewsletterOptInEmail('Terna', 'https://example.com/confirm?token=x', 'https://example.com/unsubscribe?token=y');
    expect(optIn.html).toContain('https://example.com/confirm?token=x');
  });
});
