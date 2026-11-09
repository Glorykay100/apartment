import nodemailer from 'nodemailer';
import { Booking, Apartment } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../config/db';

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

const sendTransactionalEmail = async ({
  to,
  subject,
  html,
  text,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}) => {
  const sender = from || process.env.BREVO_FROM || process.env.EMAIL_FROM || 'reservations@yahsab.com';

  if (process.env.NODE_ENV === 'test') {
    console.log(`📧 [Simulated Email] ${subject} -> ${to}`);
    return 'simulated' as const;
  }

  const transporter = getTransporter();
  const hasRealCredentials =
    (process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST) &&
    (process.env.BREVO_SMTP_USER || process.env.SMTP_USER);

  if (!hasRealCredentials) {
    if (process.env.NODE_ENV === 'production') throw new Error('Brevo SMTP credentials are required in production.');
    console.log(`📧 [Simulated Email] ${subject} -> ${to}`);
    return 'simulated' as const;
  }

  await transporter.sendMail({
    from: sender,
    to,
    subject,
    html,
    text,
  });

  return 'sent' as const;
};

/** Create a durable one-time claim before sending a welcome message. */
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
  try {
    await sendTransactionalEmail({
      to: user.email,
      subject: 'Welcome to Yahsab',
      text: `Welcome to Yahsab, ${user.fullName}. Your account is ready for bookings, receipts and stay history.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;background:#FBF9F5;color:#132B22"><h2>Welcome to Yahsab</h2><p>Hello ${user.fullName.replace(/[&<>"']/g, '')},</p><p>Your account is ready for bookings, receipts and stay history.</p><p>We look forward to welcoming you.</p></div>`,
    });
    await prisma.emailLog.update({ where: { id: claimId }, data: { status: 'SENT', sentAt: new Date() } });
  } catch (error) {
    await prisma.emailLog.update({ where: { id: claimId }, data: { status: 'FAILED', error: error instanceof Error ? error.message : 'Send failed' } });
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
    const delivery = await sendTransactionalEmail({
      to: user.email,
      subject: 'Set your Yahsab password',
      text: `Hello ${user.fullName}. Set your password or continue with Google: ${actionLink}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;background:#FBF9F5;color:#132B22"><h2>Welcome to Yahsab</h2><p>Hello ${user.fullName.replace(/[&<>"']/g, '')},</p><p>Set your password or continue with Google.</p><p><a href="${actionLink}" style="display:inline-block;padding:12px 18px;background:#132B22;color:#fff;text-decoration:none;border-radius:8px">Set your password</a></p><p>If you prefer, you can continue with Google from the sign-in page.</p></div>`,
    });
    await prisma.emailLog.update({ where: { id: claimId }, data: { status: 'SENT', sentAt: new Date() } });
    return delivery;
  } catch (error) {
    await prisma.emailLog.update({ where: { id: claimId }, data: { status: 'FAILED', error: error instanceof Error ? error.message : 'Send failed' } });
    throw error;
  }
};

const ensureNewsletterTable = async () => {
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

export const subscribeNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const fullName = String(req.body?.fullName || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, message: 'A valid email address is required.' });
      return;
    }

    await ensureNewsletterTable();

    await prisma.$executeRaw`
      INSERT INTO newsletter_subscribers (email, full_name, subscribed, created_at, updated_at)
      VALUES (${email}, ${fullName || null}, true, NOW(), NOW())
      ON CONFLICT (email)
      DO UPDATE SET full_name = EXCLUDED.full_name, subscribed = true, updated_at = NOW()
    `;

    await sendTransactionalEmail({
      to: email,
      subject: 'Welcome to Yahsab updates',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #FBF9F5; border-radius: 12px; color: #132B22;">
          <h2 style="margin: 0 0 12px; color: #132B22;">Welcome to Yahsab</h2>
          <p style="line-height: 1.6; color: #2D403B;">
            Thanks for subscribing to Yahsab updates. You will now receive property updates, seasonal offers, and travel inspiration from our team.
          </p>
          <p style="line-height: 1.6; color: #2D403B;">
            Need to opt out later? You can unsubscribe anytime from the footer or by contacting us directly.
          </p>
        </div>
      `,
      text: 'Welcome to Yahsab updates. You will now receive curated property updates and exclusive offers.',
    });

    res.status(200).json({
      success: true,
      message: 'You have been subscribed to Yahsab updates.',
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe to updates.' });
  }
};

export const unsubscribeNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, message: 'A valid email address is required.' });
      return;
    }

    await ensureNewsletterTable();

    await prisma.$executeRaw`
      UPDATE newsletter_subscribers
      SET subscribed = false, updated_at = NOW()
      WHERE email = ${email}
    `;

    res.status(200).json({
      success: true,
      message: 'You have been unsubscribed from Yahsab updates.',
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe from updates.' });
  }
};

export const sendBookingConfirmationEmail = async (
  booking: Booking & { apartment: Apartment }
) => {
  try {
    const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FBF9F5; padding: 32px; border-radius: 16px; border: 1px solid #E5DFD3;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #132B22; margin: 0; font-size: 28px; font-weight: 700;">Yahsab Apartments</h2>
          <p style="color: #C25E3B; text-transform: uppercase; letter-spacing: 2px; font-size: 11px; font-weight: 700; margin: 4px 0 0 0;">
            Luxury Serviced Residences
          </p>
        </div>

        <div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #E5DFD3; margin-bottom: 24px;">
          <h3 style="color: #132B22; margin-top: 0;">Reservation Confirmed</h3>
          <p style="color: #4A504D; font-size: 14px; line-height: 1.6;">
            Dear <strong>${booking.guestFullName}</strong>,
          </p>
          <p style="color: #4A504D; font-size: 14px; line-height: 1.6;">
            Thank you for booking with Yahsab. Your stay at <strong>${booking.apartment.title}</strong> in ${booking.apartment.city} is officially confirmed.
          </p>

          <div style="background: #F5F2EA; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #646A66;">Booking Reference:</p>
            <p style="margin: 4px 0 12px 0; font-size: 20px; font-weight: bold; color: #C25E3B; letter-spacing: 1px;">
              ${booking.reference}
            </p>

            <table style="width: 100%; font-size: 13px; color: #191D1B; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #646A66;">Check-In:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right;">${checkInDate} (From ${booking.apartment.checkInTime} WAT)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #646A66;">Check-Out:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right;">${checkOutDate} (By ${booking.apartment.checkOutTime} WAT)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #646A66;">Guests:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right;">${booking.guestCount} Guest(s)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #646A66;">Total Paid:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #132B22; text-align: right;">₦${booking.totalAmount.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <h4 style="color: #132B22; margin-bottom: 8px;">Keyless Check-In Information</h4>
          <p style="color: #4A504D; font-size: 13px; line-height: 1.5;">
            Your personal digital keypad entry PIN and gate access clearance will be sent via SMS and WhatsApp 2 hours prior to check-in.
          </p>

          <div style="margin-top: 20px; border-top: 1px solid #E5DFD3; padding-top: 16px;">
            <p style="font-size: 12px; color: #646A66; margin: 0;">
              <strong>Residence Address:</strong> ${booking.apartment.address}, ${booking.apartment.city}, ${booking.apartment.state}
            </p>
            <p style="font-size: 12px; color: #646A66; margin: 4px 0 0 0;">
              <strong>Concierge WhatsApp:</strong> +234 (0) 803 123 4567 (24/7 in-house support)
            </p>
          </div>
        </div>

        <div style="text-align: center; font-size: 11px; color: #8F9591;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Yahsab Luxury Apartments & Suites. All rights reserved.</p>
          <p style="margin: 4px 0 0 0;">Guaranteed 24/7 Solar Electricity & Starlink Gigabit Internet</p>
        </div>
      </div>
    `;

    await sendTransactionalEmail({
      to: booking.guestEmail,
      from: process.env.BREVO_FROM || process.env.EMAIL_FROM || 'reservations@yahsab.com',
      subject: `Confirmed: Your Stay at ${booking.apartment.title} [${booking.reference}]`,
      html: htmlContent,
      text: `Your reservation at ${booking.apartment.title} has been confirmed. Booking reference: ${booking.reference}`,
    });
  } catch (error) {
    console.error('Email confirmation error (non-fatal):', error);
  }
};
