'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Apartment } from '@/types';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Calendar as CalendarIcon,
  Users,
  ShieldCheck,
  Zap,
  Info,
  AlertCircle,
} from 'lucide-react';

interface BookingSidebarProps {
  apartment: Apartment;
}

export const BookingSidebar: React.FC<BookingSidebarProps> = ({ apartment }) => {
  const router = useRouter();

  // Tomorrow as default checkIn, 3 days later as checkOut
  const today = new Date();
  const defaultCheckIn = new Date(today);
  defaultCheckIn.setDate(today.getDate() + 1);
  const defaultCheckOut = new Date(today);
  defaultCheckOut.setDate(today.getDate() + 4);

  const formatDateISO = (d: Date) => d.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState<string>(formatDateISO(defaultCheckIn));
  const [checkOut, setCheckOut] = useState<string>(formatDateISO(defaultCheckOut));
  const [guestCount, setGuestCount] = useState<number>(1);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Fetch unavailable dates
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await api.get(`/apartments/${apartment.id}/availability`);
        if (res.data?.success && res.data?.data?.allUnavailableDates) {
          setUnavailableDates(res.data.data.allUnavailableDates);
        }
      } catch (err) {
        console.error('Error loading unavailable dates:', err);
      }
    };
    fetchAvailability();
  }, [apartment.id]);

  // Validate dates whenever they change
  useEffect(() => {
    setConflictError(null);
    if (!checkIn || !checkOut) return;

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (end <= start) {
      setConflictError('Check-out date must be after check-in date.');
      return;
    }

    // Check if any date in the selected range is unavailable
    const curr = new Date(start);
    while (curr < end) {
      const dateStr = curr.toISOString().split('T')[0];
      if (unavailableDates.includes(dateStr)) {
        setConflictError(
          `The date ${curr.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          })} is already booked or reserved.`
        );
        return;
      }
      curr.setDate(curr.getDate() + 1);
    }
  }, [checkIn, checkOut, unavailableDates]);

  // Calculate pricing breakdown
  const calculateDays = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
  };

  const nights = calculateDays();
  const subtotal = nights * apartment.basePricePerNight;
  const cleaningFee = apartment.cleaningFee;
  const serviceFee = Math.round(subtotal * apartment.serviceFeeRate);
  const totalAmount = subtotal + cleaningFee + serviceFee;

  const handleProceed = () => {
    if (conflictError) return;
    const query = new URLSearchParams({
      apartmentId: apartment.id,
      checkIn,
      checkOut,
      guests: guestCount.toString(),
    });
    router.push(`/booking/checkout?${query.toString()}`);
  };

  const minDateStr = formatDateISO(new Date());

  return (
    <div className="rounded-3xl border border-linen bg-white p-6 sm:p-8 shadow-elevated sticky top-28 space-y-6">
      {/* Header Price */}
      <div className="flex items-baseline justify-between border-b border-linen pb-5">
        <div>
          <span className="text-xs text-charcoal-700 block">Nightly rate</span>
          <div className="font-serif text-3xl font-bold text-forest-900">
            {formatNaira(apartment.basePricePerNight)}
            <span className="text-xs font-sans font-normal text-charcoal-700 ml-1">
              / night
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-forest-900 font-semibold bg-sand-200 px-2.5 py-1 rounded-lg">
          <Zap className="w-3.5 h-3.5 text-terracotta-500" />
          24/7 Solar
        </div>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] leading-relaxed text-red-700">
        Booking is final and non-refundable once payment is confirmed.
      </div>

      {/* Date & Guest Inputs */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-linen p-2 bg-sand-50/60">
          <div className="p-2 border-r border-linen">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-700">
              Check-In
            </label>
            <input
              type="date"
              min={minDateStr}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-forest-900 focus:outline-none cursor-pointer mt-1"
            />
          </div>

          <div className="p-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-700">
              Check-Out
            </label>
            <input
              type="date"
              min={checkIn || minDateStr}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-forest-900 focus:outline-none cursor-pointer mt-1"
            />
          </div>
        </div>

        {/* Guests Count */}
        <div className="rounded-2xl border border-linen p-3 bg-sand-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-terracotta-500" />
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-700">
                Guests
              </label>
              <span className="text-xs font-semibold text-forest-900">
                {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'} (max {apartment.maxGuests})
              </span>
            </div>
          </div>

          <select
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="rounded-lg border border-linen bg-white px-2 py-1 text-xs font-medium text-forest-900 focus:outline-none cursor-pointer"
          >
            {Array.from({ length: apartment.maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Collision Error Alert */}
      {conflictError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 leading-snug">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{conflictError}</span>
        </div>
      )}

      {/* Live Quote Breakdown */}
      <div className="space-y-2.5 border-t border-linen pt-5 text-xs text-charcoal-700">
        <div className="flex justify-between">
          <span>
            {formatNaira(apartment.basePricePerNight)} × {nights} {nights === 1 ? 'night' : 'nights'}
          </span>
          <span className="font-medium text-forest-900">{formatNaira(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            Cleaning & Sanitation Fee
            <Info className="w-3 h-3 text-charcoal-400" />
          </span>
          <span className="font-medium text-forest-900">{formatNaira(cleaningFee)}</span>
        </div>

        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            Service & Security Protocol (5%)
            <Info className="w-3 h-3 text-charcoal-400" />
          </span>
          <span className="font-medium text-forest-900">{formatNaira(serviceFee)}</span>
        </div>

        <div className="flex justify-between border-t border-linen pt-3 text-sm font-bold text-forest-900">
          <span>Total Payable</span>
          <span className="font-serif text-lg font-bold text-terracotta-600">
            {formatNaira(totalAmount)}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        variant="accent"
        size="lg"
        onClick={handleProceed}
        disabled={!!conflictError}
        className="w-full shadow-elevated"
      >
        Reserve Residence
      </Button>

      <p className="text-center text-[11px] text-charcoal-700">
        You won&apos;t be charged until the final Paystack payment step.
      </p>

      {/* Trust Badges */}
      <div className="border-t border-linen pt-4 space-y-2 text-[11px] text-charcoal-700">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-forest-900" />
          <span>Full refund up to 5 days prior to check-in</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-forest-900" />
          <span>Guaranteed 24/7 power with soundproof generator backup</span>
        </div>
      </div>
    </div>
  );
};
