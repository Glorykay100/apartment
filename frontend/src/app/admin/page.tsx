'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, ShieldAlert } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <main className="min-h-screen bg-sand-100 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-linen bg-white p-8 text-center shadow-subtle">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.28em] text-charcoal-700">
            Checking access
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sand-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-3xl border border-linen bg-white p-6 shadow-subtle sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-amber-700">
                Administrative portal
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold text-forest-900">
                Yahsab operations dashboard
              </h1>
            </div>
            <Badge variant="accent" size="sm">
              System overview
            </Badge>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Active reservations', value: '48', hint: 'Across all properties' },
            { label: 'Revenue this month', value: '₦11.4m', hint: 'Payments verified' },
            { label: 'Guest satisfaction', value: '4.9/5', hint: 'Average reviews' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-linen bg-white p-5 shadow-subtle">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal-700">
                {item.label}
              </p>
              <p className="mt-5 font-serif text-3xl font-semibold text-forest-900">{item.value}</p>
              <p className="mt-1 text-xs text-charcoal-700">{item.hint}</p>
            </div>
          ))}
        </section>

        <div className="rounded-3xl border border-linen bg-white p-6 shadow-subtle">
          <h2 className="font-serif text-2xl font-semibold text-forest-900">Operations summary</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-linen bg-sand-50 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal-700">
                Check-in readiness
              </p>
              <p className="mt-3 text-sm text-charcoal-700">
                13 of 18 units are fully prepared for today&apos;s arrivals with housekeeping and power checks completed.
              </p>
            </div>
            <div className="rounded-2xl border border-linen bg-sand-50 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal-700">
                Service alerts
              </p>
              <p className="mt-3 text-sm text-charcoal-700">
                2 guests requested airport transfers, and 1 property requires a routine maintenance review before evening check-in.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link href="/dashboard">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Return to guest dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
