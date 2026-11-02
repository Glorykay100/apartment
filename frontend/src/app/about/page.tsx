import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Zap, Droplets, HeartHandshake, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-sand-100 py-16 sm:py-24">
      {/* Hero Header */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
            About Yahsab
          </span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-forest-900 leading-[1.15]">
            Rooted in Central Nigeria. Elevated for the Modern World.
          </h1>
          <p className="mt-6 text-lg text-charcoal-700 leading-relaxed font-light">
            Yahsab was born out of a simple observation: travelers to Makurdi and Abuja deserve accommodations where serenity is guaranteed, architectural beauty is standard, and critical utilities never fail.
          </p>
        </div>

        {/* Editorial Collage */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="relative h-[420px] md:col-span-7 rounded-3xl overflow-hidden shadow-elevated border border-linen">
            <Image
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"
              alt="Yahsab Luxury Living Room in Makurdi"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative h-[360px] md:col-span-5 rounded-3xl overflow-hidden shadow-elevated border border-linen">
            <Image
              src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80"
              alt="Yahsab Kitchen and Dining"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* The Story & Principles */}
      <section className="mt-28 border-y border-linen bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
                Our Hospitality Philosophy
              </span>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-forest-900 leading-tight">
                Quiet Luxury Through Absolute Reliability.
              </h2>
              <p className="mt-4 text-sm text-charcoal-700 leading-relaxed">
                Hospitality is not just fine Egyptian cotton sheets or handsome timber furniture—it is the peace of mind knowing that when you plug in your laptop for an international board meeting, your internet is running at gigabit speeds and your power will not flicker.
              </p>
              <p className="mt-4 text-sm text-charcoal-700 leading-relaxed">
                From our flagship penthouse overlooking the River Benue in Makurdi’s historic Old GRA to our diplomatic suites in Abuja, every residence is owned, furnished, and operated with meticulous care.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-linen bg-sand-50 p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-900 text-terracotta-400">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-forest-900">
                  Autonomous Clean Energy
                </h3>
                <p className="text-xs text-charcoal-700 leading-relaxed">
                  Industrial solar inverters with automated lithium-iron phosphate battery banks guarantee continuous 24/7 power without generator noise.
                </p>
              </div>

              <div className="rounded-2xl border border-linen bg-sand-50 p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-900 text-terracotta-400">
                  <Droplets className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-forest-900">
                  Purified Water Security
                </h3>
                <p className="text-xs text-charcoal-700 leading-relaxed">
                  Dedicated borehole systems with carbon filtering, sediment sieves, and UV sterilization protect your skin and daily health.
                </p>
              </div>

              <div className="rounded-2xl border border-linen bg-sand-50 p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-900 text-terracotta-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-forest-900">
                  Privacy & Discretion
                </h3>
                <p className="text-xs text-charcoal-700 leading-relaxed">
                  Manned gated access, discrete digital smart check-in, and full respect for executive privacy and security.
                </p>
              </div>

              <div className="rounded-2xl border border-linen bg-sand-50 p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-900 text-terracotta-400">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-forest-900">
                  Attentive Human Care
                </h3>
                <p className="text-xs text-charcoal-700 leading-relaxed">
                  Direct host assistance via WhatsApp or phone. Whether you need grocery stocking or airport transfers, our team is at your service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Invitation CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl font-semibold text-forest-900">
            Experience the Yahsab Standard in Person.
          </h2>
          <p className="text-sm text-charcoal-700 leading-relaxed">
            Whether visiting for a weekend wedding, an extended consultancy mission, or a private retreat, we welcome you to our residences.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/apartments">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4 text-terracotta-400" />}
              >
                Explore All Apartments
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">
                Contact Host
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
