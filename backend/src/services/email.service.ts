import nodemailer from 'nodemailer';
import { Booking, Apartment } from '@prisma/client';

export const sendBookingConfirmationEmail = async (
  booking: Booking & { apartment: Apartment }
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER || 'mock_user',
        pass: process.env.SMTP_PASS || 'mock_pass',
      },
    });

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

    // Only attempt actual transport if valid host is configured
    if (process.env.SMTP_HOST && !process.env.SMTP_HOST.includes('mailtrap.io')) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'reservations@yahsab.com',
        to: booking.guestEmail,
        subject: `Confirmed: Your Stay at ${booking.apartment.title} [${booking.reference}]`,
        html: htmlContent,
      });
    } else {
      console.log(
        `📧 [Simulated Email] Booking confirmation sent to ${booking.guestEmail} for reference ${booking.reference}`
      );
    }
  } catch (error) {
    console.error('Email confirmation error (non-fatal):', error);
  }
};
