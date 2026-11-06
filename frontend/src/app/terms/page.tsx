import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, BadgeCheck, Clock3, ShieldCheck, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-sand-100 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
            Legal
          </span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-forest-900">
            Terms and Conditions
          </h1>
          <p className="mt-3 text-sm text-charcoal-700">
            Version 1.0 • Last updated: November 2026 • Governing law: Federal Republic of Nigeria
          </p>
        </div>

        <div className="rounded-3xl border border-linen bg-white p-8 sm:p-12 shadow-subtle space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-terracotta-500" />
              <h2 className="font-serif text-2xl font-semibold text-forest-900">1. Booking process and acceptance</h2>
            </div>
            <p className="text-sm leading-relaxed text-charcoal-700">
              Guests may reserve a property through Yahsab by selecting dates, confirming guest details, and completing payment authorization. A booking is considered accepted only after the reservation is successfully created and payment is verified. By completing a booking, you confirm that all provided information is accurate and that you accept the applicable house rules, payment terms, and privacy policy.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-terracotta-500" />
              <h2 className="font-serif text-2xl font-semibold text-forest-900">2. Check-in, check-out and responsibilities</h2>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-charcoal-700">
              <li>Check-in begins at 2:00 PM WAT and check-out is by 11:00 AM WAT unless otherwise agreed in writing.</li>
              <li>Guests must present valid identification and comply with the maximum guest count and house rules.</li>
              <li>Guests are responsible for the care of the apartment during the stay and must notify management promptly of any damage, maintenance issue or emergency.</li>
              <li>Personal items left behind are not guaranteed and may be returned only at the guest&apos;s expense.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-terracotta-500" />
              <h2 className="font-serif text-2xl font-semibold text-forest-900">3. House rules and prohibited conduct</h2>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-charcoal-700">
              <li>Quiet hours apply from 10:00 PM to 7:00 AM local time.</li>
              <li>Smoking or vaping inside apartments is prohibited unless otherwise stated in writing.</li>
              <li>Parties, loud gatherings, unauthorized events, or commercial shoots are prohibited.</li>
              <li>Illegal activity, harassment, or damage to property may lead to immediate termination of stay and loss of access to the property.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-terracotta-500" />
              <h2 className="font-serif text-2xl font-semibold text-forest-900">4. Damages, deposits and liability</h2>
            </div>
            <p className="text-sm leading-relaxed text-charcoal-700">
              Guests are liable for any damage, loss, theft, or cleaning issues beyond normal wear and tear. Yahsab may deduct repair or replacement costs, cleaning charges, and related expenses from the guest&apos;s payment method or seek direct reimbursement. Yahsab&apos;s liability for any claim arising from the stay is limited to the booking value paid for that reservation, except where the law provides otherwise.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">5. Refund and non-refundable booking policy</h2>
            <p className="text-sm leading-relaxed text-charcoal-700">
              All confirmed bookings are final and non-refundable once payment is completed, unless Yahsab grants a written exception. By ticking the booking acceptance checkbox, guests confirm they understand that this booking is non-refundable and agree to the <Link href="/refund-policy" className="font-semibold text-terracotta-600 underline underline-offset-2">Refund Policy</Link>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">6. Account termination and governing law</h2>
            <p className="text-sm leading-relaxed text-charcoal-700">
              Yahsab may suspend or terminate a user account where there is fraudulent conduct, repeated house rule violations, non-payment, or abuse of the platform. These terms are governed by the laws of the Federal Republic of Nigeria, and disputes should first be raised with our support team before legal action.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">7. Contact details</h2>
            <p className="text-sm leading-relaxed text-charcoal-700">
              For support, legal inquiries, or booking disputes, contact Yahsab at reservations@yahsab.com or +234 (0) 803 123 4567. Our registered business address is Plot 14, River Benue Crescent, Old GRA, Makurdi, Benue State, Nigeria.
            </p>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link href="/apartments">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Back to apartment catalog
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
