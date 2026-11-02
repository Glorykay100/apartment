import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, Clock, AlertTriangle, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-sand-100 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
            Policies & Guest Agreement
          </span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-forest-900">
            Terms, House Rules & Cancellation Policy
          </h1>
          <p className="mt-3 text-sm text-charcoal-700">
            Last updated: November 2026 • Governed by the Laws of the Federal Republic of Nigeria
          </p>
        </div>

        <div className="rounded-3xl border border-linen bg-white p-8 sm:p-12 shadow-subtle space-y-12">
          {/* Section 1: Cancellation */}
          <section id="cancellation" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-200 text-terracotta-500">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-forest-900">
                1. Cancellation & Refund Policy
              </h2>
            </div>
            <p className="text-sm text-charcoal-700 leading-relaxed">
              We understand that travel plans can change unexpectedly. Because our residences are exclusively prepared and reserved for each guest, the following cancellation schedule strictly applies:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  5+ Days Before Check-in
                </span>
                <span className="font-serif text-2xl font-bold text-emerald-950 mt-1 block">
                  100% Full Refund
                </span>
                <p className="text-[11px] text-emerald-800 mt-1">
                  Full refund of nightly rates and cleaning fees returned via original payment method.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                  48h – 5 Days Prior
                </span>
                <span className="font-serif text-2xl font-bold text-amber-950 mt-1 block">
                  50% Refund
                </span>
                <p className="text-[11px] text-amber-800 mt-1">
                  50% refund of nightly rates + full cleaning fee refunded to the guest.
                </p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
                <span className="text-xs font-bold text-red-800 uppercase tracking-wider block">
                  Within 48 Hours
                </span>
                <span className="font-serif text-2xl font-bold text-red-950 mt-1 block">
                  Non-Refundable
                </span>
                <p className="text-[11px] text-red-800 mt-1">
                  Cleaning fee refunded; nightly reservation charges are retained.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: House Rules */}
          <section id="house-rules" className="space-y-4 border-t border-linen pt-10">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-200 text-terracotta-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-forest-900">
                2. House Rules & Quiet Hours
              </h2>
            </div>
            <ul className="space-y-3 text-sm text-charcoal-700 leading-relaxed list-disc list-inside">
              <li>
                <strong>Quiet Hours:</strong> Between 10:00 PM and 7:00 AM (WAT), all guests are expected to respect neighboring tranquility.
              </li>
              <li>
                <strong>No Indoor Smoking:</strong> Smoking of cigarettes, shisha, or e-cigarettes is strictly prohibited inside the apartments. Guests may smoke in outdoor garden gazebos or open terraces where provided.
              </li>
              <li>
                <strong>Parties & Events:</strong> Unannounced parties, clubs, or loud gatherings are strictly banned and result in immediate lease cancellation without refund.
              </li>
              <li>
                <strong>Maximum Occupancy:</strong> Only guests registered on the booking confirmation are permitted to stay overnight.
              </li>
            </ul>
          </section>

          {/* Section 3: Check-in / Out */}
          <section id="check-in" className="space-y-4 border-t border-linen pt-10">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-200 text-terracotta-500">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-forest-900">
                3. Check-In, Access & Security
              </h2>
            </div>
            <p className="text-sm text-charcoal-700 leading-relaxed">
              Check-in begins promptly at <strong>14:00 (2:00 PM) WAT</strong>. Early check-in is subject to availability of the previous night’s occupancy. Check-out is strictly by <strong>11:00 AM WAT</strong> to allow our housekeeping staff to sanitize and prepare the residence. Valid Nigerian identification (NIN, Driver’s License, or International Passport) must be presented upon entry.
            </p>
          </section>

          {/* Section 4: Payments */}
          <section className="space-y-4 border-t border-linen pt-10">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-200 text-terracotta-500">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-forest-900">
                4. Payment Processing & Currencies
              </h2>
            </div>
            <p className="text-sm text-charcoal-700 leading-relaxed">
              All transactions are processed securely in Nigerian Naira (₦) via Paystack, utilizing 256-bit PCI-DSS compliant encryption. We accept all Nigerian and international Visa, Mastercard, and Verve cards, as well as direct bank transfers.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/apartments">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4 text-terracotta-400" />}
            >
              Back to Apartment Catalog
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
