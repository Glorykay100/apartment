'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatNaira, formatDateRange } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  CheckCircle2,
  Printer,
  Calendar,
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  Phone,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';

export default function BookingConfirmationPage() {
  const params = useParams();
  const reference = params?.reference as string;

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndLoad = async () => {
      try {
        // Auto-verify with Paystack verification endpoint
        const res = await api.get(`/payments/verify/${reference}`);
        if (res.data?.success && res.data?.data?.booking) {
          setBooking(res.data.data.booking);
        } else {
          // Fallback to fetch by reference
          const bookRes = await api.get(`/bookings/${reference}`);
          if (bookRes.data?.success && bookRes.data?.data?.booking) {
            setBooking(bookRes.data.data.booking);
          }
        }
      } catch (err: any) {
        console.error('Confirmation load error:', err);
        setError(err.message || 'Failed to verify booking confirmation');
      } finally {
        setIsLoading(false);
      }
    };

    if (reference) verifyAndLoad();
  }, [reference]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-sand-100 py-16">
        <div className="mx-auto max-w-3xl px-4 space-y-6">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-sand-100 py-24 text-center">
        <div className="mx-auto max-w-md rounded-3xl border border-linen bg-white p-8 shadow-subtle space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-forest-900">
            Booking Confirmation Notice
          </h2>
          <p className="text-xs text-charcoal-700">
            {error || 'Unable to load confirmation for this reference.'}
          </p>
          <Link href="/apartments">
            <Button variant="primary" size="md">
              Return to Catalog
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const primaryImage =
    booking.apartment.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';

  return (
    <main className="min-h-screen bg-sand-100 py-12 sm:py-20 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header Alert */}
        <div className="text-center mb-8 space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-semibold">
            Payment Verified & Stay Confirmed
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-forest-900">
            We Are Delighted to Welcome You.
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-700 max-w-lg mx-auto">
            A confirmation receipt and keyless check-in instructions have been sent to{' '}
            <strong className="text-forest-900">{booking.guestEmail}</strong>.
          </p>
        </div>

        {/* Printable Receipt Card */}
        <div className="rounded-3xl border border-linen bg-white p-6 sm:p-10 shadow-elevated space-y-8 print:shadow-none print:border-none">
          {/* Reference Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-linen pb-6 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-700">
                Official Booking Reference
              </span>
              <div className="font-serif text-2xl font-bold text-terracotta-600 tracking-wider mt-0.5">
                {booking.reference}
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Receipt
              </Button>
            </div>
          </div>

          {/* Residence Details */}
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-28 shrink-0 rounded-2xl overflow-hidden bg-sand-200">
              <Image
                src={primaryImage}
                alt={booking.apartment.title}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-forest-900">
                {booking.apartment.title}
              </h3>
              <p className="text-xs text-charcoal-700 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
                {booking.apartment.address}, {booking.apartment.city}, {booking.apartment.state}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-900 bg-sand-200 px-2 py-0.5 rounded">
                  <Zap className="w-3 h-3 text-terracotta-500" />
                  24/7 Solar Power
                </span>
              </div>
            </div>
          </div>

          {/* Stay Dates & Check-In */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-linen bg-sand-50/70 p-5 text-xs text-charcoal-800">
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-charcoal-700 block">
                Check-In Date
              </span>
              <p className="font-serif text-base font-semibold text-forest-900">
                {new Date(booking.checkIn).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="text-[11px] text-charcoal-700">
                From {booking.apartment.checkInTime} WAT (Self Check-In)
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-charcoal-700 block">
                Check-Out Date
              </span>
              <p className="font-serif text-base font-semibold text-forest-900">
                {new Date(booking.checkOut).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="text-[11px] text-charcoal-700">
                By {booking.apartment.checkOutTime} WAT
              </p>
            </div>
          </div>

          {/* Payment Breakdown Table */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-semibold text-forest-900">
              Payment Summary
            </h4>
            <div className="rounded-2xl border border-linen divide-y divide-linen text-xs">
              <div className="flex justify-between p-3.5">
                <span className="text-charcoal-700">
                  Accommodation ({booking.nights} nights @ {formatNaira(booking.nightlyRate)}/night)
                </span>
                <span className="font-semibold text-forest-900">
                  {formatNaira(booking.subtotal)}
                </span>
              </div>
              <div className="flex justify-between p-3.5">
                <span className="text-charcoal-700">Sanitation & Linen Preparation</span>
                <span className="font-semibold text-forest-900">
                  {formatNaira(booking.cleaningFee)}
                </span>
              </div>
              <div className="flex justify-between p-3.5">
                <span className="text-charcoal-700">Service & Security Protocol (5%)</span>
                <span className="font-semibold text-forest-900">
                  {formatNaira(booking.serviceFee)}
                </span>
              </div>
              <div className="flex justify-between p-4 bg-sand-50 text-sm font-bold text-forest-900 rounded-b-2xl">
                <span>Total Paid via Paystack</span>
                <span className="font-serif text-xl font-bold text-terracotta-600">
                  {formatNaira(booking.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Concierge Assistance */}
          <div className="rounded-2xl border border-linen bg-forest-900 text-sand-50 p-5 space-y-2">
            <h4 className="font-serif text-base font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-terracotta-400" />
              Need Assistance or Early Luggage Drop?
            </h4>
            <p className="text-xs text-sand-200 leading-relaxed font-light">
              Our 24/7 on-call hospitality manager is available directly on WhatsApp or telephone at{' '}
              <strong>+234 (0) 803 123 4567</strong>. Quote reference{' '}
              <strong className="text-terracotta-300">{booking.reference}</strong>.
            </p>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-linen print:hidden">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                leftIcon={<LayoutDashboard className="w-4 h-4 text-terracotta-400" />}
              >
                Go to My Bookings
              </Button>
            </Link>

            <Link href="/apartments" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Browse More Residences
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
