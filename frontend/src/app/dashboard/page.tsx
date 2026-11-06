'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Booking } from '@/types';
import { formatNaira, formatDateRange } from '@/lib/utils';
import {
  ArrowRight,
  CalendarRange,
  CreditCard,
  LogOut,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

type TabKey = 'upcoming' | 'past' | 'cancelled' | 'unpaid';

const statusVariant: Record<string, 'default' | 'success' | 'outline' | 'muted'> = {
  PENDING: 'muted',
  CONFIRMED: 'success',
  COMPLETED: 'default',
  CANCELLED: 'outline',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingRef, setPayingRef] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings/my-bookings');
        const items = res.data?.data?.bookings ?? [];
        setBookings(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error('Failed to load dashboard bookings:', error);
        setBookings([]);
      } finally {
        setIsFetching(false);
      }
    };

    fetchBookings();
  }, [isLoading, user, router]);

  const stats = useMemo(() => {
    const totalSpent = bookings
      .filter((b) => b.paymentStatus === 'PAID')
      .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);
    const now = new Date();
    const upcoming = bookings.filter(
      (booking) => new Date(booking.checkIn).getTime() >= now.getTime() && (booking.status === 'CONFIRMED' || booking.status === 'PENDING')
    );
    const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED');

    return {
      totalSpent,
      upcoming: upcoming.length,
      confirmed: confirmed.length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const now = new Date();
    switch (activeTab) {
      case 'upcoming':
        return bookings.filter((b) => new Date(b.checkIn) >= now && (b.status === 'CONFIRMED' || b.status === 'PENDING'));
      case 'past':
        return bookings.filter((b) => new Date(b.checkOut) < now && (b.status === 'CONFIRMED' || b.status === 'COMPLETED'));
      case 'cancelled':
        return bookings.filter((b) => b.status === 'CANCELLED');
      case 'unpaid':
        return bookings.filter((b) => b.status === 'PENDING' && b.paymentStatus === 'UNPAID');
      default:
        return bookings;
    }
  }, [bookings, activeTab]);

  const handleCancel = useCallback(async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' as any } : b))
      );
    } catch (error: any) {
      alert(error.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  }, []);

  const handleCompletePayment = useCallback(async (reference: string) => {
    setPayingRef(reference);
    try {
      const res = await api.post(`/bookings/${reference}/complete-payment`);
      if (res.data?.success && res.data?.data?.authorizationUrl) {
        window.location.href = res.data.data.authorizationUrl;
      }
    } catch (error: any) {
      alert(error.message || 'Failed to initialize payment');
      setPayingRef(null);
    }
  }, []);

  if (isLoading || (user && isFetching)) {
    return (
      <main className="min-h-screen bg-sand-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-16 w-64 animate-pulse rounded-2xl bg-sand-200" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-3xl bg-sand-200" />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-3xl bg-sand-200" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: bookings.filter((b) => new Date(b.checkIn) >= new Date() && (b.status === 'CONFIRMED' || b.status === 'PENDING')).length },
    { key: 'past', label: 'Past stays', count: bookings.filter((b) => new Date(b.checkOut) < new Date() && (b.status === 'CONFIRMED' || b.status === 'COMPLETED')).length },
    { key: 'unpaid', label: 'Unpaid', count: bookings.filter((b) => b.status === 'PENDING' && b.paymentStatus === 'UNPAID').length },
    { key: 'cancelled', label: 'Cancelled', count: bookings.filter((b) => b.status === 'CANCELLED').length },
  ];

  return (
    <main className="min-h-screen bg-sand-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <header className="rounded-3xl border border-linen bg-white p-6 shadow-subtle sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-900 text-lg font-semibold text-sand-50">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-charcoal-700">
                  Guest account
                </p>
                <h1 className="mt-1 font-serif text-3xl font-semibold text-forest-900">
                  Welcome back, {user.fullName.split(' ')[0]}.
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/apartments">
                <Button variant="primary" size="md">
                  Reserve another stay
                </Button>
              </Link>
              <Button
                variant="outline"
                size="md"
                leftIcon={<LogOut className="h-4 w-4" />}
                onClick={async () => {
                  await logout();
                  router.push('/auth/login');
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-linen bg-white p-5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal-700">Bookings</span>
              <CalendarRange className="h-4 w-4 text-terracotta-500" />
            </div>
            <p className="mt-5 font-serif text-3xl font-semibold text-forest-900">{bookings.length}</p>
            <p className="mt-1 text-xs text-charcoal-700">Total reservations</p>
          </div>

          <div className="rounded-3xl border border-linen bg-white p-5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal-700">Upcoming stays</span>
              <Sparkles className="h-4 w-4 text-terracotta-500" />
            </div>
            <p className="mt-5 font-serif text-3xl font-semibold text-forest-900">{stats.upcoming}</p>
            <p className="mt-1 text-xs text-charcoal-700">Confirmed and pending arrivals</p>
          </div>

          <div className="rounded-3xl border border-linen bg-white p-5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal-700">Total spend</span>
              <CreditCard className="h-4 w-4 text-terracotta-500" />
            </div>
            <p className="mt-5 font-serif text-3xl font-semibold text-forest-900">{formatNaira(stats.totalSpent)}</p>
            <p className="mt-1 text-xs text-charcoal-700">Across loyalty and paid stays</p>
          </div>
        </section>

        {/* Booking Tabs */}
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-linen bg-white p-6 shadow-subtle">
            {/* Tab Bar */}
            <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-linen pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    activeTab === tab.key
                      ? 'bg-forest-900 text-sand-50'
                      : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 rounded-full bg-terracotta-500/10 px-1.5 py-0.5 text-[10px] text-terracotta-600">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filteredBookings.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-linen bg-sand-50 px-6 text-center">
                <p className="font-serif text-xl font-semibold text-forest-900">No bookings here</p>
                <p className="mt-2 max-w-sm text-xs text-charcoal-700">
                  {activeTab === 'unpaid'
                    ? 'No unpaid bookings. All your reservations are paid.'
                    : 'Start with a short-let reservation and your booking history will appear here.'}
                </p>
                <Link href="/apartments" className="mt-5 inline-block">
                  <Button variant="primary" size="md">Explore residences</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => {
                  const imageUrl = booking.apartment?.images?.[0]?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
                  const bookingLink = booking.apartment?.slug ? `/apartments/${booking.apartment.slug}` : '/apartments';

                  return (
                    <article key={booking.id} className="overflow-hidden rounded-2xl border border-linen bg-sand-50/70">
                      <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr]">
                        <div className="relative h-32 overflow-hidden rounded-2xl bg-sand-200">
                          <Image src={imageUrl} alt={booking.apartment?.title || 'Residence'} fill className="object-cover" />
                        </div>

                        <div className="flex flex-col justify-between gap-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal-700">{booking.reference}</p>
                              <h3 className="mt-1 font-serif text-xl font-semibold text-forest-900">{booking.apartment?.title || 'Yahsab residence'}</h3>
                              <p className="mt-1 flex items-center gap-1 text-xs text-charcoal-700">
                                <MapPin className="h-3.5 w-3.5 text-terracotta-500" />
                                {booking.apartment?.address || 'Makurdi, Nigeria'}
                              </p>
                            </div>
                            <Badge variant={statusVariant[booking.status] || 'default'} size="sm">{booking.status}</Badge>
                          </div>

                          <div className="grid gap-2 text-xs text-charcoal-700 sm:grid-cols-2">
                            <p><span className="font-semibold text-forest-900">Dates:</span> {formatDateRange(booking.checkIn, booking.checkOut)}</p>
                            <p><span className="font-semibold text-forest-900">Guests:</span> {booking.guestCount}</p>
                          </div>

                          <div className="flex flex-col gap-3 border-t border-linen pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal-700">Total</p>
                              <p className="mt-1 font-serif text-xl font-semibold text-forest-900">{formatNaira(Number(booking.totalAmount || 0))}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {activeTab === 'unpaid' && (
                                <Button
                                  variant="accent"
                                  size="sm"
                                  onClick={() => handleCompletePayment(booking.reference)}
                                  disabled={payingRef === booking.reference}
                                  leftIcon={payingRef === booking.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                                >
                                  {payingRef === booking.reference ? 'Processing...' : 'Complete payment'}
                                </Button>
                              )}

                              {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancel(booking.id)}
                                  disabled={cancellingId === booking.id}
                                  leftIcon={cancellingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                >
                                  {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                                </Button>
                              )}

                              <Link href={bookingLink}>
                                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>View stay</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-linen bg-white p-6 shadow-subtle">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-200 text-forest-900">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-charcoal-700">Account</p>
                  <h3 className="font-serif text-xl font-semibold text-forest-900">Your profile</h3>
                </div>
              </div>
              <dl className="mt-5 space-y-3 text-sm text-charcoal-700">
                <div className="flex justify-between gap-4 border-b border-linen pb-2">
                  <dt className="font-medium text-forest-900">Name</dt>
                  <dd>{user.fullName}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-linen pb-2">
                  <dt className="font-medium text-forest-900">Email</dt>
                  <dd className="truncate">{user.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-forest-900">Role</dt>
                  <dd>{user.role}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-linen bg-white p-6 shadow-subtle">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-charcoal-700">Support</p>
                  <h3 className="font-serif text-xl font-semibold text-forest-900">Guest care</h3>
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-charcoal-700">
                <li>24/7 concierge for local transfers and check-in support.</li>
                <li>Flexible cancellation guidance based on your booking window.</li>
                <li>On-arrival assistance and property access coordination.</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
