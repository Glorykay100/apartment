import { Receipt } from '@prisma/client';

/**
 * Minimal dependency-free PDF generator for booking receipts.
 * Produces a valid single-page PDF (Helvetica) with an A4-ish page.
 * Escape parentheses in text; only ASCII-safe characters are rendered.
 */

const escapePdfText = (text: string): string =>
  text
    // Normalize the naira sign and smart quotes to ASCII-safe equivalents
    .replace(/₦/g, 'NGN ')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–|—/g, '-')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

// Receipt amounts are stored as whole naira (Booking.totalAmount semantics)
const money = (naira: number) =>
  `NGN ${Number(naira).toLocaleString('en-NG')}.00`;

const date = (value: Date | string) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const renderReceiptPdf = (receipt: Receipt, bookingReference: string): Buffer => {
  const lines: Array<{ text: string; size: number; bold: boolean; gap: number }> = [
    { text: 'Yahsab Luxury Apartments & Suites', size: 18, bold: true, gap: 6 },
    { text: 'Plot 14, River Benue Crescent, Old GRA, Makurdi, Benue State, Nigeria', size: 9, bold: false, gap: 24 },
    { text: `PAYMENT RECEIPT  ${receipt.receiptNumber}`, size: 14, bold: true, gap: 18 },
    { text: `Booking reference: ${bookingReference}`, size: 10, bold: false, gap: 6 },
    { text: `Guest: ${receipt.guestName}  (${receipt.guestEmail})`, size: 10, bold: false, gap: 6 },
    { text: `Apartment: ${receipt.apartmentTitle} - ${receipt.apartmentAddress}`, size: 10, bold: false, gap: 6 },
    { text: `Check-in: ${date(receipt.checkIn)}   Check-out: ${date(receipt.checkOut)}   Nights: ${receipt.nights}   Guests: ${receipt.guestCount}`, size: 10, bold: false, gap: 18 },
    { text: `Nightly rate: ${money(receipt.nightlyRate)} x ${receipt.nights} night(s)`, size: 10, bold: false, gap: 6 },
    { text: `Subtotal: ${money(receipt.subtotal)}`, size: 10, bold: false, gap: 6 },
    { text: `Cleaning fee: ${money(receipt.cleaningFee)}`, size: 10, bold: false, gap: 6 },
    { text: `Service fee: ${money(receipt.serviceFee)}`, size: 10, bold: false, gap: 12 },
    { text: `TOTAL PAID: ${money(receipt.totalAmount)}`, size: 13, bold: true, gap: 18 },
    { text: `Payment date: ${date(receipt.paymentDate)}   Channel: ${receipt.channel || 'card'}`, size: 10, bold: false, gap: 6 },
    { text: `Paystack reference: ${receipt.paystackReference}`, size: 9, bold: false, gap: 6 },
    { text: 'All confirmed bookings are final and non-refundable.', size: 9, bold: false, gap: 24 },
    { text: 'Questions? reservations@yahsab.com  +234 (0) 803 123 4567', size: 9, bold: false, gap: 0 },
  ];

  const contentParts: string[] = [];
  let y = 800;
  for (const line of lines) {
    const font = line.bold ? '/F2' : '/F1';
    contentParts.push(`BT ${font} ${line.size} Tf 50 ${y} Td (${escapePdfText(line.text)}) Tj ET`);
    y -= line.size + line.gap;
  }
  const content = contentParts.join('\n');

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
};
