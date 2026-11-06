import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-sand-100 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
            Policy
          </span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-forest-900">
            Refund Policy
          </h1>
          <p className="mt-3 text-sm text-charcoal-700">
            Last updated: November 2026 • Version 1.0
          </p>
        </div>

        <div className="rounded-3xl border border-linen bg-white p-8 sm:p-12 shadow-subtle space-y-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-700">
                  Important notice
                </p>
                <p className="mt-2 text-sm text-charcoal-800 leading-relaxed">
                  Once payment is confirmed for a booking, all reservations are final and non-refundable. This includes short-let stays, weekend bookings, and concierge add-on purchases. Guests may cancel to release dates and notify management, but no automatic refund will be issued unless an exception is granted by Yahsab at its sole discretion.
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">1. Final and non-refundable bookings</h2>
            <p className="text-sm leading-relaxed text-charcoal-700">
              Payment secures the unit, housekeeping preparation, security checks, and the hold on your requested dates. Because these commitments begin immediately upon confirmation, all bookings are final and non-refundable.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">2. Cancellations and no-shows</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-charcoal-700">
              <li>Guests may cancel a reservation to free the dates and notify the host or support team; however, no refund will be automatically issued.</li>
              <li>No-shows are treated as completed stays and are not eligible for any refund.</li>
              <li>Early check-out does not trigger a refund, unless Yahsab expressly agrees in writing to a credit or date change.</li>
              <li>Disappointment with the property, a change of travel plans, or a preference to stay elsewhere does not create a refund right.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">3. Exceptions at our sole discretion</h2>
            <p className="text-sm leading-relaxed text-charcoal-700">
              Yahsab may, at its absolute discretion, offer a date change, property location change, or account credit when the apartment becomes unavailable due to the host&apos;s fault, an emergency, or exceptional circumstances. Any exception is voluntary and will not be treated as a legal precedent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">4. Payment and confirmation</h2>
            <p className="text-sm leading-relaxed text-charcoal-700">
              Booking confirmation only becomes complete after payment is successfully verified and the guest receives a final confirmation number. By booking, you accept that the reservation is final once confirmed.
            </p>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link href="/booking/checkout">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Return to checkout
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
