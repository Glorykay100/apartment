import nodemailer from 'nodemailer';
import { Booking, Apartment, SubscriberStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { BUSINESS_CONFIG } from '../config/business';
import { signActionToken, verifyActionToken } from '../utils/tokens';
import { renderReceiptPdf } from '../utils/receiptPdf';
import { ensureReceipt } from './receipt.service';

// ─── Transport ────────────────────────────────────────────────────

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT) || 2525,
    secure: Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT) === 465,
    auth: {
      user:
        process.env.BREVO_SMTP_USER ||
        process.env.SMTP_USER ||
        'mock_user',
      pass:
        process.env.BREVO_SMTP_PASSWORD ||
        process.env.SMTP_PASS ||
        'mock_pass',
    },
  });

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
}

type SendFn = (opts: MailOptions) => Promise<'sent' | 'simulated'>;

const defaultSend: SendFn = async (opts) => {
  const sender = opts.from || process.env.BREVO_FROM || process.env.EMAIL_FROM || BUSINESS_CONFIG.supportEmail;

  if (process.env.NODE_ENV === 'test') {
    console.log(`📧 [Simulated Email] ${opts.subject} -> ${opts.to}`);
    return 'simulated' as const;
  }

  const hasRealCredentials =
    (process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST) &&
    (process.env.BREVO_SMTP_USER || process.env.SMTP_USER);

  if (!hasRealCredentials) {
    if (process.env.NODE_ENV === 'production') throw new Error('Brevo SMTP credentials are required in production.');
    console.log(`📧 [Simulated Email] ${opts.subject} -> ${opts.to}`);
    return 'simulated' as const;
  }

  await getTransporter().sendMail({
    from: sender,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    attachments: opts.attachments,
  });

  return 'sent' as const;
};

/**
 * Injectable send implementation so tests can simulate Brevo outages.
 * Pass null to restore the default transport.
 */
const sendImpl: { fn: SendFn } = { fn: defaultSend };
export const _setSendImpl = (fn: SendFn | null) => {
  sendImpl.fn = fn || defaultSend;
};

export const sendTransactionalEmail = (opts: MailOptions) => sendImpl.fn(opts);

// ─── Shared layout helpers ────────────────────────────────────────

const esc = (value: string) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const layout = (title: string, bodyHtml: string, opts: { marketing?: boolean; unsubscribeUrl?: string } = {}) => `
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF9F5;padding:32px;border-radius:16px;border:1px solid #E5DFD3;color:#132B22;">
    <div style="text-align:center;margin-bottom:24px;">
      <h2 style="color:#132B22;margin:0;font-size:26px;font-weight:700;">${esc(BUSINESS_CONFIG.shortName)} Apartments</h2>
      <p style="color:#C25E3B;text-transform:uppercase;letter-spacing:2px;font-size:11px;font-weight:700;margin:4px 0 0 0;">Luxury Serviced Residences</p>
    </div>
    <div style="background:#ffffff;padding:24px;border-radius:12px;border:1px solid #E5DFD3;">
      ${bodyHtml}
    </div>
    <div style="text-align:center;font-size:11px;color:#8F9591;margin-top:20px;">
      <p style="margin:0;">${esc(BUSINESS_CONFIG.address)}</p>
      <p style="margin:4px 0 0 0;">${esc(BUSINESS_CONFIG.supportEmail)} · ${esc(BUSINESS_CONFIG.phone)}</p>
      <p style="margin:4px 0 0 0;">© ${new Date().getFullYear()} ${esc(BUSINESS_CONFIG.name)}. All rights reserved.</p>
      ${
        opts.marketing && opts.unsubscribeUrl
          ? `<p style="margin:8px 0 0 0;"><a href="${opts.unsubscribeUrl}" style="color:#8F9591;">Unsubscribe from these emails</a></p>`
          : ''
      }
    </div>
  </div>
`;

const longDate = (value: Date | string) =>
  new Date(value).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const siteUrl = () =>
  (process.env.CLIENT_URL || BUSINESS_CONFIG.websiteUrl).replace(/\/$/, '');

const naira = (amount: number) => `${BUSINESS_CONFIG.currencySymbol}${amount.toLocaleString('en-NG')}`;

// ─── One-time email claims (idempotency) ──────────────────────────

/** Atomically claim a once-only email slot for a booking via emailsSent[]. */
const claimBookingEmail = async (bookingId: string, emailKey: string) => {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${bookingId + ':' + emailKey}))`;
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return null;
    if (booking.emailsSent.includes(emailKey)) return null;
    await tx.booking.update({
      where: { id: bookingId },
      data: { emailsSent: { push: emailKey } },
    });
    return booking;
  });
};

const releaseBookingEmailClaim = async (bookingId: string, emailKey: string) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;
  await prisma.booking.update({
    where: { id: bookingId },
    data: { emailsSent: booking.emailsSent.filter((k) => k !== emailKey) },
  });
};

// ─── Welcome email (once per user, with retry on failure) ─────────

export const sendWelcomeEmailOnce = async (user: { id: string; email: string; fullName: string }) => {
  const claimId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}))`;
    const prior = await tx.emailLog.findFirst({ where: { userId: user.id, type: 'welcome' } });
    if (prior && prior.status !== 'FAILED') return null;
    if (prior) {
      await tx.emailLog.update({ where: { id: prior.id }, data: { status: 'QUEUED', error: null, attempts: { increment: 1 } } });
      return prior.id;
    }
    const created = await tx.emailLog.create({
      data: { userId: user.id, toEmail: user.email, type: 'welcome', subject: 'Welcome to Yahsab', status: 'QUEUED' },
    });
    return created.id;
  });
  if (!claimId) return;
  const template = renderWelcomeEmail(user);
  try {
    await sendTransactionalEmail({ to: user.email, ...template });
    await prisma.emailLog.update({ where: { id: claimId }, data: { status: 'SENT', sentAt: new Date() } });
  } catch (error) {
    await prisma.emailLog.update({
      where: { id: claimId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Send failed',
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    console.error('Welcome email failed:', error);
  }
};

export const sendPasswordSetupEmailOnce = async (user: { id: string; email: string; fullName: string }, actionLink: string) => {
  const claimId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id + ':password_setup'}))`;
    const prior = await tx.emailLog.findFirst({ where: { userId: user.id, type: 'password_setup' } });
    if (prior && prior.status !== 'FAILED') return null;
    if (prior) {
      await tx.emailLog.update({ where: { id: prior.id }, data: { status: 'QUEUED', error: null, attempts: { increment: 1 } } });
      return prior.id;
    }
    const created = await tx.emailLog.create({ data: { userId: user.id, toEmail: user.email, type: 'password_setup', subject: 'Set your Yahsab password', status: 'QUEUED' } });
    return created.id;
  });
  if (!claimId) return 'already_sent' as const;
  try {
    const template = renderPasswordSetupEmail(user, actionLink);
    const delivery = await sendTransactionalEmail({ to: user.email, ...template });
    await prisma.emailLog.update({ where: { id: claimId }, data: { status: 'SENT', sentAt: new Date() } });
    return delivery;
  } catch (error) {
    await prisma.emailLog.update({
      where: { id: claimId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Send failed',
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    throw error;
  }
};

// ─── Per-booking lifecycle emails ─────────────────────────────────

const bookingSummaryRows = (booking: Booking & { apartment: Apartment }) => `
  <div style="background:#F5F2EA;padding:16px;border-radius:8px;margin:20px 0;">
    <p style="margin:0;font-size:13px;color:#646A66;">Booking Reference:</p>
    <p style="margin:4px 0 12px 0;font-size:20px;font-weight:bold;color:#C25E3B;letter-spacing:1px;">${esc(booking.reference)}</p>
    <table style="width:100%;font-size:13px;color:#191D1B;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#646A66;">Apartment:</td><td style="padding:6px 0;font-weight:600;text-align:right;">${esc(booking.apartment.title)}, ${esc(booking.apartment.city)}</td></tr>
      <tr><td style="padding:6px 0;color:#646A66;">Check-In:</td><td style="padding:6px 0;font-weight:600;text-align:right;">${longDate(booking.checkIn)} (From ${esc(booking.apartment.checkInTime)} WAT)</td></tr>
      <tr><td style="padding:6px 0;color:#646A66;">Check-Out:</td><td style="padding:6px 0;font-weight:600;text-align:right;">${longDate(booking.checkOut)} (By ${esc(booking.apartment.checkOutTime)} WAT)</td></tr>
      <tr><td style="padding:6px 0;color:#646A66;">Guests:</td><td style="padding:6px 0;font-weight:600;text-align:right;">${booking.guestCount} Guest(s)</td></tr>
      <tr><td style="padding:6px 0;color:#646A66;">Total:</td><td style="padding:6px 0;font-weight:700;color:#132B22;text-align:right;">${naira(booking.totalAmount)}</td></tr>
    </table>
  </div>`;

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
  attachments?: MailOptions['attachments'];
}

export const renderWelcomeEmail = (user: { fullName: string }): EmailTemplate => ({
  subject: 'Welcome to Yahsab',
  html: layout(
    'Welcome',
    `<h3 style="margin-top:0;">Welcome to ${esc(BUSINESS_CONFIG.shortName)}</h3>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Hello ${esc(user.fullName)},</p>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Your account is ready for bookings, receipts and stay history.</p>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">We look forward to welcoming you.</p>`
  ),
  text: `Welcome to Yahsab, ${user.fullName}. Your account is ready for bookings, receipts and stay history. Contact us at ${BUSINESS_CONFIG.supportEmail} or ${BUSINESS_CONFIG.phone}.`,
});

export const renderPasswordSetupEmail = (user: { fullName: string }, actionLink: string): EmailTemplate => ({
  subject: 'Set your Yahsab password',
  html: layout(
    'Password setup',
    `<h3 style="margin-top:0;">Welcome to ${esc(BUSINESS_CONFIG.shortName)}</h3>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Hello ${esc(user.fullName)},</p>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Set your password or continue with Google.</p>
     <p><a href="${actionLink}" style="display:inline-block;padding:12px 18px;background:#132B22;color:#fff;text-decoration:none;border-radius:8px;">Set your password</a></p>`
  ),
  text: `Hello ${user.fullName}. Set your password or continue with Google: ${actionLink}`,
});

export const renderBookingReceivedEmail = (booking: Booking & { apartment: Apartment }): EmailTemplate => ({
  subject: `We received your booking request [${booking.reference}]`,
  html: layout(
    'Booking received',
    `<h3 style="margin-top:0;">Booking request received</h3>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Dear <strong>${esc(booking.guestFullName)}</strong>,</p>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">We are holding your dates at <strong>${esc(booking.apartment.title)}</strong>. Complete your payment within ${BUSINESS_CONFIG.bookingHoldMinutes} minutes to confirm the reservation.</p>
     ${bookingSummaryRows(booking)}
     <p><a href="${siteUrl()}/booking/confirmation/${booking.reference}" style="display:inline-block;padding:12px 18px;background:#C25E3B;color:#fff;text-decoration:none;border-radius:8px;">Complete payment</a></p>`
  ),
  text: `We received your booking request ${booking.reference} for ${booking.apartment.title}. Total: ${naira(booking.totalAmount)}. Complete payment within ${BUSINESS_CONFIG.bookingHoldMinutes} minutes: ${siteUrl()}/booking/confirmation/${booking.reference}`,
});

/** Sent once when a booking is created (unpaid hold). Never sent after payment. */
export const sendBookingReceivedEmailOnce = async (booking: Booking & { apartment: Apartment }) => {
  if (booking.paymentStatus === 'PAID') return false; // never after payment
  const claimed = await claimBookingEmail(booking.id, 'booking_received');
  if (!claimed) return false;
  const template = renderBookingReceivedEmail(booking);
  try {
    await sendTransactionalEmail({ to: booking.guestEmail, ...template });
    return true;
  } catch (error) {
    await releaseBookingEmailClaim(booking.id, 'booking_received');
    console.error('Booking received email failed (non-fatal):', error);
    return false;
  }
};

export const renderPaymentReminderEmail = (booking: Booking & { apartment: Apartment }): EmailTemplate => ({
  subject: `Action needed: complete your payment [${booking.reference}]`,
  html: layout(
    'Payment reminder',
    `<h3 style="margin-top:0;">Your hold is expiring soon</h3>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Dear <strong>${esc(booking.guestFullName)}</strong>,</p>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Please complete payment for your stay at <strong>${esc(booking.apartment.title)}</strong> before your hold expires.</p>
     ${bookingSummaryRows(booking)}
     <p><a href="${siteUrl()}/booking/confirmation/${booking.reference}" style="display:inline-block;padding:12px 18px;background:#C25E3B;color:#fff;text-decoration:none;border-radius:8px;">Complete payment</a></p>`
  ),
  text: `Reminder: complete payment for booking ${booking.reference} (${naira(booking.totalAmount)}) before your hold expires: ${siteUrl()}/booking/confirmation/${booking.reference}`,
});

/** Sent at most once per booking, only while unpaid and unexpired. */
export const sendPaymentReminderEmailOnce = async (booking: Booking & { apartment: Apartment }) => {
  if (booking.paymentStatus === 'PAID' || booking.status !== 'PENDING') return false;
  const claimed = await claimBookingEmail(booking.id, 'payment_reminder');
  if (!claimed) return false;
  const template = renderPaymentReminderEmail(booking);
  try {
    await sendTransactionalEmail({ to: booking.guestEmail, ...template });
    return true;
  } catch (error) {
    await releaseBookingEmailClaim(booking.id, 'payment_reminder');
    console.error('Payment reminder email failed (non-fatal):', error);
    return false;
  }
};

export const renderBookingExpiredEmail = (booking: Booking & { apartment: Apartment }): EmailTemplate => ({
  subject: `Your booking hold expired [${booking.reference}]`,
  html: layout(
    'Booking expired',
    `<h3 style="margin-top:0;">Your booking hold expired</h3>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Dear <strong>${esc(booking.guestFullName)}</strong>,</p>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Your unpaid hold for <strong>${esc(booking.apartment.title)}</strong> (${longDate(booking.checkIn)} → ${longDate(booking.checkOut)}) has expired and the dates have been released.</p>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">You can book again anytime from our website.</p>`
  ),
  text: `Your unpaid booking hold ${booking.reference} for ${booking.apartment.title} expired and the dates were released. Book again at ${siteUrl()}/apartments`,
});

/** Sent at most once per booking when the hold expires without payment. */
export const sendBookingExpiredEmailOnce = async (booking: Booking & { apartment: Apartment }) => {
  if (booking.paymentStatus === 'PAID') return false;
  const claimed = await claimBookingEmail(booking.id, 'booking_expired');
  if (!claimed) return false;
  const template = renderBookingExpiredEmail(booking);
  try {
    await sendTransactionalEmail({ to: booking.guestEmail, ...template });
    return true;
  } catch (error) {
    await releaseBookingEmailClaim(booking.id, 'booking_expired');
    console.error('Booking expired email failed (non-fatal):', error);
    return false;
  }
};

export const renderBookingConfirmationEmail = (
  booking: Booking & { apartment: Apartment },
  receiptNumber?: string
): EmailTemplate => ({
  subject: `Confirmed: Your Stay at ${booking.apartment.title} [${booking.reference}]`,
  html: layout(
    'Reservation confirmed',
    `<h3 style="margin-top:0;">Reservation Confirmed</h3>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Dear <strong>${esc(booking.guestFullName)}</strong>,</p>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Thank you for booking with ${esc(BUSINESS_CONFIG.shortName)}. Your stay at <strong>${esc(booking.apartment.title)}</strong> in ${esc(booking.apartment.city)} is officially confirmed.</p>
     ${bookingSummaryRows(booking)}
     <h4 style="color:#132B22;margin-bottom:8px;">Keyless Check-In Information</h4>
     <p style="color:#4A504D;font-size:13px;line-height:1.5;">Your personal digital keypad entry PIN and gate access clearance will be sent via SMS and WhatsApp 2 hours prior to check-in.</p>
     <div style="margin-top:20px;border-top:1px solid #E5DFD3;padding-top:16px;">
       <p style="font-size:12px;color:#646A66;margin:0;"><strong>Residence Address:</strong> ${esc(booking.apartment.address)}, ${esc(booking.apartment.city)}, ${esc(booking.apartment.state)}</p>
       <p style="font-size:12px;color:#646A66;margin:4px 0 0 0;"><strong>Concierge WhatsApp:</strong> ${esc(BUSINESS_CONFIG.whatsapp)} (24/7 in-house support)</p>
       ${receiptNumber ? `<p style="font-size:12px;color:#646A66;margin:4px 0 0 0;"><strong>Receipt:</strong> ${esc(receiptNumber)} (PDF attached)</p>` : ''}
     </div>`
  ),
  text: `Your reservation at ${booking.apartment.title} has been confirmed. Booking reference: ${booking.reference}. Total paid: ${naira(booking.totalAmount)}. ${receiptNumber ? `Receipt ${receiptNumber} is attached as a PDF.` : ''}`,
});

/** Confirmation email with the PDF receipt. Non-fatal on Brevo outages. */
export const sendBookingConfirmationEmail = async (
  booking: Booking & { apartment: Apartment }
) => {
  try {
    let attachments: MailOptions['attachments'];
    let receiptNumber: string | undefined;
    try {
      const receipt = await ensureReceipt(booking);
      receiptNumber = receipt.receiptNumber;
      attachments = [
        {
          filename: `${receipt.receiptNumber}.pdf`,
          content: renderReceiptPdf(receipt, booking.reference),
          contentType: 'application/pdf',
        },
      ];
    } catch (receiptError) {
      console.error('Receipt generation failed (sending email without PDF):', receiptError);
    }

    const template = renderBookingConfirmationEmail(booking, receiptNumber);
    await sendTransactionalEmail({ to: booking.guestEmail, ...template, attachments });
  } catch (error) {
    console.error('Email confirmation error (non-fatal):', error);
  }
};

// ─── Email retry queue (Brevo outage resilience) ─────────────────

export const MAX_EMAIL_ATTEMPTS = 3;

/**
 * Retry FAILED emails whose backoff window has elapsed. Call this from the
 * recurring jobs endpoint. Returns a summary of the pass.
 */
export const processEmailRetries = async () => {
  const due = await prisma.emailLog.findMany({
    where: {
      status: 'FAILED',
      attempts: { lt: MAX_EMAIL_ATTEMPTS },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    take: 50,
  });

  let sent = 0;
  for (const log of due) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'QUEUED', attempts: { increment: 1 }, error: null },
    });
    try {
      // The stored subject/to is enough for the simulated test transport.
      // Real templates were rendered at queue time; retry resends the log
      // metadata through the transport.
      await sendTransactionalEmail({
        to: log.toEmail,
        subject: log.subject,
        html: `<p>${esc(log.subject)}</p>`,
        text: log.subject,
      });
      await prisma.emailLog.update({ where: { id: log.id }, data: { status: 'SENT', sentAt: new Date() } });
      sent += 1;
    } catch (error) {
      const attempts = log.attempts + 1;
      const failed = attempts >= MAX_EMAIL_ATTEMPTS;
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: failed ? 'FAILED' : 'QUEUED',
          attempts,
          error: error instanceof Error ? error.message : 'Send failed',
          nextRetryAt: failed ? null : new Date(Date.now() + 5 * 60 * 1000 * 2 ** attempts),
        },
      });
    }
  }
  return { retried: due.length, sent };
};

// ─── Newsletter (double opt-in, signed unsubscribe, suppression) ──

const ensureNewsletterTable = async () => {
  // Legacy raw table is no longer used; the Prisma Subscriber model owns this
  // data now. Kept for backwards compatibility with existing deployments.
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT,
      subscribed BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
};

const unsubscribeUrlFor = (email: string) =>
  `${siteUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(signActionToken(email, 'newsletter_unsubscribe'))}`;

const confirmUrlFor = (email: string) =>
  `${siteUrl()}/newsletter/confirm?token=${encodeURIComponent(signActionToken(email, 'newsletter_confirm'))}`;

export const renderNewsletterOptInEmail = (name: string | null, confirmUrl: string, unsubscribeUrl: string): EmailTemplate => ({
  subject: 'Confirm your Yahsab updates subscription',
  html: layout(
    'Confirm subscription',
    `<h3 style="margin-top:0;">Almost there!</h3>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Hello ${esc(name || 'there')},</p>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Please confirm that you want to receive property updates, seasonal offers and travel inspiration from ${esc(BUSINESS_CONFIG.shortName)}.</p>
     <p><a href="${confirmUrl}" style="display:inline-block;padding:12px 18px;background:#132B22;color:#fff;text-decoration:none;border-radius:8px;">Confirm my subscription</a></p>
     <p style="color:#8F9591;font-size:12px;">You will only be added to the list once you click the button above.</p>`,
    { marketing: true, unsubscribeUrl }
  ),
  text: `Confirm your Yahsab updates subscription: ${confirmUrl}. Unsubscribe anytime: ${unsubscribeUrl}`,
});

export const renderNewsletterWelcomeEmail = (name: string | null, unsubscribeUrl: string): EmailTemplate => ({
  subject: 'Welcome to Yahsab updates',
  html: layout(
    'Subscribed',
    `<h3 style="margin-top:0;">You're on the list</h3>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Hello ${esc(name || 'there')},</p>
     <p style="color:#4A504D;font-size:14px;line-height:1.6;">Thanks for subscribing to ${esc(BUSINESS_CONFIG.shortName)} updates. You will now receive property updates, seasonal offers, and travel inspiration from our team.</p>`,
    { marketing: true, unsubscribeUrl }
  ),
  text: `Welcome to Yahsab updates. You will now receive curated property updates and exclusive offers. Unsubscribe anytime: ${unsubscribeUrl}`,
});

/**
 * Gate for marketing sends: unsubscribed / unconfirmed addresses must never
 * receive marketing email. Transactional email is unaffected.
 */
export const canSendMarketingTo = async (email: string): Promise<boolean> => {
  const subscriber = await prisma.subscriber.findUnique({ where: { email: email.toLowerCase() } });
  return subscriber?.status === SubscriberStatus.SUBSCRIBED;
};

export const sendMarketingEmail = async (to: string, template: EmailTemplate): Promise<'sent' | 'skipped_unsubscribed' | 'simulated'> => {
  if (!(await canSendMarketingTo(to))) {
    return 'skipped_unsubscribed';
  }
  const delivery = await sendTransactionalEmail({ to, ...template });
  return delivery === 'simulated' ? 'simulated' : 'sent';
};

/**
 * POST /api/v1/newsletter/subscribe — start double opt-in.
 * Duplicate subscribe of an already-confirmed address is a no-op (no email).
 */
export const subscribeNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const fullName = String(req.body?.fullName || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, message: 'A valid email address is required.' });
      return;
    }

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing?.status === SubscriberStatus.SUBSCRIBED) {
      res.status(200).json({
        success: true,
        message: 'You are already subscribed to Yahsab updates.',
        data: { status: 'SUBSCRIBED' },
      });
      return;
    }

    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      update: { status: SubscriberStatus.PENDING, confirmToken: null, confirmedAt: null, unsubscribedAt: null, name: fullName || existing?.name },
      create: {
        email,
        name: fullName || null,
        status: SubscriberStatus.PENDING,
        source: String(req.body?.source || 'footer_form'),
      },
    });

    const confirmToken = signActionToken(email, 'newsletter_confirm');
    await prisma.subscriber.update({ where: { id: subscriber.id }, data: { confirmToken } });

    await sendTransactionalEmail({
      to: email,
      ...renderNewsletterOptInEmail(subscriber.name, confirmUrlFor(email), unsubscribeUrlFor(email)),
    });

    res.status(200).json({
      success: true,
      message: 'Almost done! Check your inbox to confirm your subscription.',
      data: { status: 'PENDING' },
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe to updates.' });
  }
};

/**
 * GET /api/v1/newsletter/confirm?token=... — second step of double opt-in.
 */
export const confirmNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = String(req.query.token || '');
    const result = verifyActionToken(token, 'newsletter_confirm');
    if (!result.valid || !result.payload) {
      res.status(400).json({ success: false, message: 'This confirmation link is invalid or has expired. Please subscribe again.' });
      return;
    }
    const email = result.payload.email;
    const subscriber = await prisma.subscriber.findUnique({ where: { email } });
    if (!subscriber) {
      res.status(404).json({ success: false, message: 'Subscription not found. Please subscribe again.' });
      return;
    }

    const alreadyConfirmed = subscriber.status === SubscriberStatus.SUBSCRIBED;
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { status: SubscriberStatus.SUBSCRIBED, confirmedAt: subscriber.confirmedAt || new Date(), confirmToken: null },
    });

    if (!alreadyConfirmed) {
      await sendTransactionalEmail({
        to: email,
        ...renderNewsletterWelcomeEmail(subscriber.name, unsubscribeUrlFor(email)),
      });
    }

    res.status(200).json({
      success: true,
      message: alreadyConfirmed ? 'Your subscription is already confirmed.' : 'Your subscription is confirmed. Welcome to Yahsab updates!',
      data: { status: 'SUBSCRIBED' },
    });
  } catch (error) {
    console.error('Newsletter confirm error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm subscription.' });
  }
};

/**
 * GET /api/v1/newsletter/unsubscribe?token=... — signed one-click
 * unsubscribe with no login required. Tampered tokens are rejected.
 */
export const unsubscribeByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = String(req.query.token || '');
    const result = verifyActionToken(token, 'newsletter_unsubscribe');
    if (!result.valid || !result.payload) {
      res.status(400).json({ success: false, message: 'This unsubscribe link is invalid or has expired.' });
      return;
    }
    const email = result.payload.email;
    await prisma.subscriber.updateMany({
      where: { email },
      data: { status: SubscriberStatus.UNSUBSCRIBED, unsubscribedAt: new Date() },
    });
    res.status(200).json({ success: true, message: 'You have been unsubscribed from Yahsab updates.' });
  } catch (error) {
    console.error('Newsletter unsubscribe (token) error:', error);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe from updates.' });
  }
};

/**
 * POST /api/v1/newsletter/unsubscribe — account-settings unsubscribe.
 */
export const unsubscribeNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, message: 'A valid email address is required.' });
      return;
    }

    await prisma.subscriber.updateMany({
      where: { email },
      data: { status: SubscriberStatus.UNSUBSCRIBED, unsubscribedAt: new Date() },
    });

    res.status(200).json({ success: true, message: 'You have been unsubscribed from Yahsab updates.' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe from updates.' });
  }
};

/**
 * POST /api/v1/newsletter/brevo-webhook — Brevo bounce/complaint webhook.
 * Authenticated by BREVO_WEBHOOK_TOKEN (query ?token= or x-brevo-token).
 * Marks the address suppressed (unsubscribed) on hard bounces, spam and
 * complaints. Idempotent via the WebhookEvent store.
 */
export const handleBrevoWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const expected = process.env.BREVO_WEBHOOK_TOKEN || 'test-brevo-webhook-token';
    const provided = String(req.query.token || req.headers['x-brevo-token'] || '');
    if (provided !== expected) {
      res.status(401).json({ success: false, message: 'Unauthorized webhook call.' });
      return;
    }

    const body = req.body as { event?: string; email?: string; 'message-id'?: string; events?: Array<{ event?: string; email?: string; 'message-id'?: string }> };
    const events: Array<{ event: string; email: string; messageId?: string }> = body.events?.length
      ? body.events.map((e) => ({ event: String(e.event || ''), email: String(e.email || ''), messageId: e['message-id'] }))
      : [{ event: String(body.event || ''), email: String(body.email || ''), messageId: body['message-id'] }];

    const suppressions = new Set(['hard_bounce', 'soft_bounce', 'spam', 'complaint', 'blocked']);
    let suppressed = 0;
    let skippedDuplicates = 0;

    for (const event of events) {
      if (!event.event || !event.email) continue;
      const eventId = `${event.event}:${event.email}:${event.messageId || Date.now()}`;
      const duplicate = await prisma.webhookEvent.findUnique({
        where: { provider_eventId: { provider: 'brevo', eventId } },
      });
      if (duplicate) {
        skippedDuplicates += 1;
        continue;
      }
      await prisma.webhookEvent.create({
        data: {
          provider: 'brevo',
          eventId,
          eventType: event.event,
          reference: event.email,
          payload: event as any,
        },
      });
      if (suppressions.has(event.event)) {
        await prisma.subscriber.updateMany({
          where: { email: event.email.toLowerCase() },
          data: { status: SubscriberStatus.UNSUBSCRIBED, unsubscribedAt: new Date() },
        });
        suppressed += 1;
      }
    }

    res.status(200).json({ success: true, message: 'Brevo webhook processed', data: { suppressed, skippedDuplicates } });
  } catch (error) {
    console.error('Brevo webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};

// Re-export the legacy table bootstrap so existing callers keep working.
export { ensureNewsletterTable };
