'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatNaira, formatDateRange } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ShieldCheck,
  Zap,
  ArrowLeft,
  Calendar,
  Users,
  AlertCircle,
  Car,
  UtensilsCrossed,
  Sparkles,
  Shirt,
  Lock,
} from 'lucide-react';

interface ConciergeAddOn {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: any;
}

const availableAddOns: ConciergeAddOn[] = [
  {
    id: 'airport_pickup',
    name: 'Airport Chauffeur Transfer',
    price: 15000,
    description: 'Executive vehicle airport pickup or drop-off with luggage assistance.',
    icon: Car,
  },
  {
    id: 'private_chef',
    name: 'Private Gourmet In-House Chef',
    price: 25000,
    description: 'Personalized breakfast, lunch, or dinner prepared in your kitchen.',
    icon: UtensilsCrossed,
  },
  {
    id: 'daily_cleaning',
    name: 'Daily Housekeeping & Fresh Linens',
    price: 5000,
    description: 'Daily turn-down, fresh Egyptian cotton sheets, and bathroom sanitization.',
    icon: Sparkles,
  },
  {
    id: 'laundry_valet',
    name: 'Express Wash & Press Laundry Valet',
    price: 8000,
    description: 'Same-day garment washing, tumble drying, and crisp steam pressing.',
    icon: Shirt,
  },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const apartmentId = searchParams.get('apartmentId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests') || '1';

  const [quote, setQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [guestFieldOverrides, setGuestFieldOverrides] = useState({ fullName: false, email: false, phone: false });
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [acceptsRefundPolicy, setAcceptsRefundPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const guestFullName = guestFieldOverrides.fullName ? fullName : user?.fullName || fullName;
  const guestEmail = guestFieldOverrides.email ? email : user?.email || email;
  const guestPhone = guestFieldOverrides.phone ? phone : user?.phone || phone;

  // Fetch verified server quote
  useEffect(() => {
    const fetchQuote = async () => {
      if (!apartmentId || !checkIn || !checkOut) {
        setQuoteError('Missing booking dates or apartment selection.');
        setIsLoadingQuote(false);
        return;
      }

      setIsLoadingQuote(true);
      setQuoteError(null);
      try {
        const res = await api.post('/bookings/calculate-quote', {
          apartmentId,
          checkIn,
          checkOut,
          guestCount: Number(guests),
        });

        if (res.data?.success && res.data?.data?.quote) {
          setQuote(res.data.data.quote);
        }
      } catch (err: any) {
        setQuoteError(
          err.message || 'The selected dates are unavailable or in conflict.'
        );
      } finally {
        setIsLoadingQuote(false);
      }
    };

    fetchQuote();
  }, [apartmentId, checkIn, checkOut, guests]);

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addOnsTotal = selectedAddOns.reduce((sum, id) => {
    const found = availableAddOns.find((item) => item.id === id);
    return sum + (found ? found.price : 0);
  }, 0);

  const grandTotal = quote ? quote.totalAmount + addOnsTotal : 0;

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote || quoteError) return;
    if (!acceptsRefundPolicy) {
      setSubmitError('You must confirm that this booking is non-refundable before continuing to payment.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.post('/bookings', {
        apartmentId: quote.apartment.id,
        checkIn,
        checkOut,
        guestCount: Number(guests),
        guestFullName,
        guestEmail,
        guestPhone,
        specialRequests,
        addOnsTotal,
        acceptsNonRefundPolicy: acceptsRefundPolicy,
      });

      if (res.data?.success && res.data?.data?.booking) {
        const booking = res.data.data.booking;
        // Proceed to payment page with booking reference
        router.push(`/booking/payment?reference=${booking.reference}`);
      }
    } catch (err: any) {
      setSubmitError(
        err.message || 'Failed to initialize booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingQuote) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (quoteError || !quote) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="rounded-3xl border border-linen bg-white p-10 shadow-subtle space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-forest-900">
            Dates Unavailable or Collision Detected
          </h2>
          <p className="text-xs text-charcoal-700 leading-relaxed">
            {quoteError || 'These dates have already been booked by another guest.'}
          </p>
          <Link href={`/apartments/${apartmentId || ''}`}>
            <Button variant="primary" size="md">
              Choose Different Dates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage =
    quote.apartment.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Top Bar */}
      <div className="mb-8">
        <Link
          href={`/apartments/${quote.apartment.slug || quote.apartment.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal-700 hover:text-forest-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-terracotta-500" />
          Back to Residence Details
        </Link>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-forest-900">
          Confirm Your Reservation
        </h1>
        <p className="mt-1 text-xs text-charcoal-700">
          Step 1 of 2: Guest Details & Concierge Add-ons
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmitBooking} className="lg:col-span-7 space-y-8">
          {submitError && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Guest Information */}
          <div className="rounded-3xl border border-linen bg-white p-6 sm:p-8 shadow-subtle space-y-6">
            <div>
              <h2 className="font-serif text-xl font-semibold text-forest-900">
                1. Guest Information
              </h2>
              <p className="mt-1 text-xs text-charcoal-700">
                Your check-in code and digital receipt will be sent to these details.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name (as on Government ID)"
                required
                placeholder="e.g. David Iorfa"
                value={guestFullName}
                onChange={(e) => {
                  setGuestFieldOverrides((current) => ({ ...current, fullName: true }));
                  setFullName(e.target.value);
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="e.g. david@example.com"
                  value={guestEmail}
                  onChange={(e) => {
                    setGuestFieldOverrides((current) => ({ ...current, email: true }));
                    setEmail(e.target.value);
                  }}
                />

                <Input
                  label="Phone / WhatsApp Number"
                  required
                  placeholder="e.g. +2348031234567"
                  value={guestPhone}
                  onChange={(e) => {
                    setGuestFieldOverrides((current) => ({ ...current, phone: true }));
                    setPhone(e.target.value);
                  }}
                />
              </div>

              <Textarea
                label="Special Requests or Arrival Notes (Optional)"
                rows={3}
                placeholder="e.g. Late night flight arrival, preference for feather pillows..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>
          </div>

          {/* Concierge Add-Ons */}
          <div className="rounded-3xl border border-linen bg-white p-6 sm:p-8 shadow-subtle space-y-6">
            <div>
              <h2 className="font-serif text-xl font-semibold text-forest-900">
                2. Concierge Add-On Services
              </h2>
              <p className="mt-1 text-xs text-charcoal-700">
                Enhance your stay with our vetted hospitality staff.
              </p>
            </div>

            <div className="space-y-3">
              {availableAddOns.map((addon) => {
                const Icon = addon.icon;
                const isSelected = selectedAddOns.includes(addon.id);

                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddOn(addon.id)}
                    className={`flex items-start justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-terracotta-500 bg-sand-50/80 shadow-2xs'
                        : 'border-linen bg-white hover:bg-sand-50/40'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 pr-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isSelected
                            ? 'bg-forest-900 text-terracotta-400'
                            : 'bg-sand-200 text-forest-900'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-forest-900">
                          {addon.name}
                        </h4>
                        <p className="text-[11px] text-charcoal-700 mt-0.5 leading-relaxed">
                          {addon.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-serif text-sm font-bold text-forest-900 block">
                        +{formatNaira(addon.price)}
                      </span>
                      <span className="text-[10px] font-semibold text-terracotta-600 uppercase tracking-wider">
                        {isSelected ? 'Added' : 'Click to add'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-linen bg-sand-50 p-4 text-xs text-charcoal-700">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acceptsRefundPolicy}
                onChange={(e) => setAcceptsRefundPolicy(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                I understand that this booking is non-refundable and I agree to the{' '}
                <Link href="/refund-policy" target="_blank" rel="noreferrer" className="font-semibold text-terracotta-600 underline underline-offset-2">
                  Refund Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full shadow-elevated"
            isLoading={isSubmitting}
            leftIcon={<Lock className="w-4 h-4" />}
            disabled={!acceptsRefundPolicy}
          >
            Continue to Secure Paystack Checkout
          </Button>
        </form>

        {/* Order Summary Card Column */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-linen bg-white p-6 sm:p-8 shadow-elevated sticky top-28 space-y-6">
            <h3 className="font-serif text-xl font-semibold text-forest-900 border-b border-linen pb-4">
              Reservation Summary
            </h3>

            {/* Apartment Brief */}
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-24 shrink-0 rounded-xl overflow-hidden bg-sand-200">
                <Image
                  src={primaryImage}
                  alt={quote.apartment.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="font-serif text-base font-semibold text-forest-900 line-clamp-1">
                  {quote.apartment.title}
                </h4>
                <p className="text-xs text-charcoal-700 mt-0.5">
                  {quote.apartment.city}, {quote.apartment.state}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-forest-900">
                  <Zap className="w-3 h-3 text-terracotta-500" />
                  24/7 Solar Power
                </div>
              </div>
            </div>

            {/* Dates & Guests Details */}
            <div className="rounded-2xl border border-linen bg-sand-50/60 p-4 space-y-3 text-xs text-charcoal-800">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-charcoal-700">
                  <Calendar className="w-4 h-4 text-terracotta-500" />
                  Dates:
                </span>
                <span className="font-semibold text-forest-900">
                  {formatDateRange(checkIn!, checkOut!)} ({quote.nights}{' '}
                  {quote.nights === 1 ? 'night' : 'nights'})
                </span>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] leading-relaxed text-red-700">
                All bookings are final and non-refundable once payment is confirmed. Please review the <Link href="/refund-policy" className="font-semibold underline underline-offset-2">refund policy</Link> before paying.
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-charcoal-700">
                  <Users className="w-4 h-4 text-terracotta-500" />
                  Guests:
                </span>
                <span className="font-semibold text-forest-900">
                  {guests} {guests === '1' ? 'Guest' : 'Guests'}
                </span>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs text-charcoal-700 border-t border-linen pt-5">
              <div className="flex justify-between">
                <span>
                  {formatNaira(quote.nightlyRate)} × {quote.nights}{' '}
                  {quote.nights === 1 ? 'night' : 'nights'}
                </span>
                <span className="font-medium text-forest-900">
                  {formatNaira(quote.rawSubtotal)}
                </span>
              </div>

              {quote.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Extended Stay Discount ({quote.discountPercent}%)</span>
                  <span>-{formatNaira(quote.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Sanitation & Cleaning Fee</span>
                <span className="font-medium text-forest-900">
                  {formatNaira(quote.cleaningFee)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Security & Service Fee (5%)</span>
                <span className="font-medium text-forest-900">
                  {formatNaira(quote.serviceFee)}
                </span>
              </div>

              {selectedAddOns.length > 0 && (
                <div className="flex justify-between text-terracotta-600 font-semibold">
                  <span>Selected Concierge Add-Ons</span>
                  <span>+{formatNaira(addOnsTotal)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-linen pt-4 text-base font-bold text-forest-900">
                <span>Total Amount</span>
                <span className="font-serif text-xl font-bold text-terracotta-600">
                  {formatNaira(grandTotal)}
                </span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="border-t border-linen pt-4 space-y-2 text-[11px] text-charcoal-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-forest-900" />
                <span>Full refund guaranteed up to 5 days prior to check-in</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-forest-900" />
                <span>Encrypted 256-bit checkout via Paystack</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-sand-100">
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-16">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </main>
  );
}
